alter table if exists public.jobs
add column if not exists status_changed_at timestamptz null;
