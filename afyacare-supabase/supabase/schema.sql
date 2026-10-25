-- Run this in Supabase Dashboard > SQL Editor.
-- Store only minimal appointment-coordination data; do not store medical notes.
create table if not exists public.appointment_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 2 and 120),
  phone text not null check (char_length(phone) between 7 and 30),
  department text not null check (department in ('General Medicine','Pediatrics','Maternity & Women''s Health','Surgery','Dental Care','Laboratory Services','Radiology & Imaging','Pharmacy')),
  preferred_date date not null,
  consent boolean not null check (consent = true),
  status text not null default 'new' check (status in ('new','contacted','scheduled','closed')),
  created_at timestamptz not null default now()
);

alter table public.appointment_requests enable row level security;
-- Intentionally create NO anon/authenticated read/insert policies. The Edge Function uses
-- a server-side service-role key to write. Never expose that key in frontend code.
revoke all on table public.appointment_requests from anon, authenticated;
