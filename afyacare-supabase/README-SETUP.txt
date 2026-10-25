AFYACARE + SUPABASE BACKEND SETUP
================================

WHAT THIS PACKAGE DOES
- Preserves the existing AfyaCare page design and interactions.
- Removes the free-text medical-message field; collects name, phone, department, preferred date and explicit consent only.
- Sends submissions to a Supabase Edge Function.
- The Edge Function validates the fields, stores the request in a private Supabase table, then sends a notification email using Resend.
- The service-role key and Resend API key stay on the server, never in browser files.

IMPORTANT BEFORE PRODUCTION
This is a starter integration, not a complete compliance/security review. Before using it with real visitors, the hospital should approve the data flow, privacy notice, retention/deletion process, access controls and vendors under applicable Kenyan law (including the Data Protection Act and any applicable health-data requirements). Add rate limiting and bot protection (for example CAPTCHA) to the public function, configure the exact production website origin in SITE_ORIGIN, and verify email delivery. Do not collect symptoms, diagnoses, test results, ID numbers, or medical records through this form. This is not an emergency channel or a confirmed booking system.

STEP 1 — CREATE SUPABASE PROJECT
1. Go to https://supabase.com/ and create a project.
2. Save the project password securely.
3. In Project Settings > API (or Connect), copy the Project URL and service_role key. The service_role key is secret: do not paste it into index.html or script.js, and do not share it publicly.

STEP 2 — CREATE DATABASE TABLE
1. In the Supabase dashboard, open SQL Editor > New query.
2. Open supabase/schema.sql from this package, copy all its contents, paste into SQL Editor, and run it.
3. The table is private by design. Public users do not receive direct table access; only the server-side Edge Function writes to it.

STEP 3 — CREATE RESEND EMAIL SENDER
1. Create an account at https://resend.com/.
2. Verify a sending domain and create an API key. Follow Resend's current domain verification instructions.
3. Choose a verified FROM_EMAIL, such as AfyaCare Reception <appointments@your-verified-domain.example> (replace with your real verified domain).
4. Set NOTIFICATION_EMAIL to the hospital's approved reception inbox.
Do not rely on an unverified sender address for production email.

STEP 4 — INSTALL SUPABASE CLI AND DEPLOY FUNCTION
Use a terminal on your computer. Install the Supabase CLI using the official instructions: https://supabase.com/docs/guides/cli
Then, from the extracted afyacare-supabase folder:

  supabase login
  supabase link --project-ref YOUR_PROJECT_REF
  supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY RESEND_API_KEY=YOUR_RESEND_API_KEY NOTIFICATION_EMAIL=reception@your-real-domain.example FROM_EMAIL='AfyaCare Reception <appointments@your-verified-domain.example>' SITE_ORIGIN=https://your-real-website-domain.example
  supabase functions deploy appointment-request --no-verify-jwt

Replace every example value with the real values. For local testing you can use your local origin, but set SITE_ORIGIN to the exact live website origin before launch. The public function intentionally has JWT verification disabled because visitors submit without signing in; therefore add rate limiting/bot protection before production and monitor abuse. Never expose the service-role key.

If CLI asks you to set the project ref, find it in the Supabase project URL: https://YOUR_PROJECT_REF.supabase.co

STEP 5 — CONNECT FRONTEND TO THE FUNCTION
1. After deployment, your function URL will be:
   https://YOUR_PROJECT_REF.supabase.co/functions/v1/appointment-request
2. Open script.js.
3. Replace this line:
   const APPOINTMENT_FUNCTION_URL = 'PASTE_YOUR_SUPABASE_FUNCTION_URL_HERE';
   with your real function URL.
4. Save the file. Upload index.html, style.css, and script.js together to the website host. Keep all three in the same directory.

STEP 6 — TEST
1. Test first using dummy contact details you control.
2. Submit a request from the website.
3. Confirm the success message appears.
4. In Supabase Table Editor, open appointment_requests and confirm a row exists.
5. Confirm the notification email arrives in the approved inbox (check spam too).
6. Test invalid/blank fields and mobile layout.
7. If a request saves but email fails, the Edge Function logs the email-provider failure and the database row remains; inspect Supabase Edge Function logs and Resend logs.

FILES
- index.html: website structure, linked CSS and JS
- style.css: original styles plus privacy/consent styling
- script.js: existing interactions plus POST submission to the Edge Function
- supabase/schema.sql: private database table
- supabase/functions/appointment-request/index.ts: server-side validation, database insert, and email notification

The form deliberately does not collect free-text health notes. Do not add sensitive fields without a formal security and privacy design review.
