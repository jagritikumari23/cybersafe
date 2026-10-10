create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null,
  status text not null default 'Filed',
  submission_date timestamptz not null default now()
);

create index if not exists reports_submission_date_idx
  on public.reports (submission_date desc);

create index if not exists reports_status_idx
  on public.reports (status);

alter table public.reports enable row level security;

-- API routes use the server-only service role key; no client table policies are needed.