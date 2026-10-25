import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("SITE_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, "Content-Type": "application/json" },
});
const allowedDepartments = new Set([
  "General Medicine", "Pediatrics", "Maternity & Women's Health", "Surgery",
  "Dental Care", "Laboratory Services", "Radiology & Imaging", "Pharmacy",
]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json();
    const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const department = typeof body.department === "string" ? body.department : "";
    const preferredDate = typeof body.preferredDate === "string" ? body.preferredDate : "";
    const consent = body.consent === true;

    if (fullName.length < 2 || fullName.length > 120) return json({ error: "Please enter a valid name." }, 400);
    if (phone.length < 7 || phone.length > 30 || !/^[+()\d\s.-]+$/.test(phone)) return json({ error: "Please enter a valid phone number." }, 400);
    if (!allowedDepartments.has(department)) return json({ error: "Please choose a valid department." }, 400);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(preferredDate) || Number.isNaN(Date.parse(preferredDate)) || preferredDate < new Date().toISOString().slice(0, 10)) return json({ error: "Please choose a valid future date." }, 400);
    if (!consent) return json({ error: "Consent is required to process this request." }, 400);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const notificationEmail = Deno.env.get("NOTIFICATION_EMAIL");
    const fromEmail = Deno.env.get("FROM_EMAIL");
    if (!supabaseUrl || !serviceRoleKey || !resendApiKey || !notificationEmail || !fromEmail) {
      console.error("Missing required server environment variables");
      return json({ error: "The request service is not configured yet." }, 500);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
    const { data, error } = await supabase.from("appointment_requests").insert({
      full_name: fullName, phone, department, preferred_date: preferredDate, consent,
    }).select("id, created_at").single();
    if (error) {
      console.error("Database insert failed", error.message);
      return json({ error: "We could not save your request. Please try again later." }, 500);
    }

    // Email contains only appointment coordination details, not medical notes.
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: fromEmail,
        to: [notificationEmail],
        subject: "New AfyaCare appointment request",
        text: `A new appointment request was received.\n\nReference: ${data.id}\nName: ${fullName}\nPhone: ${phone}\nDepartment: ${department}\nPreferred date: ${preferredDate}\n\nThis is a request only; reception must contact the visitor to confirm.`,
      }),
    });
    if (!emailResponse.ok) {
      const detail = await emailResponse.text();
      console.error("Email provider failed; request is saved in database", emailResponse.status, detail);
      // Database has safely retained the request. Return success to avoid duplicate submissions;
      // staff should monitor email delivery and review saved requests in Supabase.
    }
    return json({ ok: true, reference: data.id });
  } catch (err) {
    console.error("Unhandled request error", err);
    return json({ error: "We could not process your request. Please try again later." }, 500);
  }
});
