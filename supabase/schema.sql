create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null,
  status text not null default 'Filed',
  submission_date timestamptz not null default now(),
  tracking_secret_hash text
);

alter table public.reports
  add column if not exists tracking_secret_hash text;

create unique index if not exists reports_tracking_secret_hash_idx
  on public.reports (tracking_secret_hash)
  where tracking_secret_hash is not null;

create index if not exists reports_submission_date_idx
  on public.reports (submission_date desc);

create index if not exists reports_status_idx
  on public.reports (status);

alter table public.reports enable row level security;

-- API routes use the server-only service role key; no client table policies are needed.

create table if not exists public.api_rate_limits (
  rate_key text primary key,
  window_started_at timestamptz not null,
  request_count integer not null check (request_count > 0)
);

revoke all on table public.api_rate_limits from public, anon, authenticated;
grant all on table public.api_rate_limits to service_role;

create or replace function public.consume_api_rate_limit(
  p_rate_key text,
  p_limit integer,
  p_window_seconds integer
)
returns table (allowed boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  current_window timestamptz := clock_timestamp();
  stored_window timestamptz;
  stored_count integer;
begin
  if p_rate_key is null or p_rate_key !~ '^[0-9a-f]{64}$'
     or p_limit < 1 or p_window_seconds < 1 then
    raise exception 'Invalid rate limit parameters';
  end if;

  insert into public.api_rate_limits as limits (rate_key, window_started_at, request_count)
  values (p_rate_key, current_window, 1)
  on conflict (rate_key) do update
  set window_started_at = case
        when limits.window_started_at + make_interval(secs => p_window_seconds) <= current_window
          then current_window
        else limits.window_started_at
      end,
      request_count = case
        when limits.window_started_at + make_interval(secs => p_window_seconds) <= current_window
          then 1
        else limits.request_count + 1
      end
  returning limits.window_started_at, limits.request_count
    into stored_window, stored_count;

  return query
    select stored_count <= p_limit,
      greatest(1, ceil(extract(epoch from (
        stored_window + make_interval(secs => p_window_seconds) - clock_timestamp()
      )))::integer);

  if random() < 0.01 then
    delete from public.api_rate_limits
    where window_started_at < clock_timestamp() - interval '1 day';
  end if;
end;
$$;

revoke all on function public.consume_api_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_api_rate_limit(text, integer, integer) to service_role;