alter table if exists public.jobs
  add column if not exists estimated_end_at timestamptz null,
  add column if not exists is_recurring boolean not null default false,
  add column if not exists recurrence jsonb null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'jobs_recurrence_check'
  ) then
    alter table public.jobs
      add constraint jobs_recurrence_check
      check (
        (is_recurring = false and recurrence is null)
        or
        (is_recurring = true and recurrence is not null)
      );
  end if;
end $$;
