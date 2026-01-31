create or replace function public.is_employee_assigned_to_job(job_uuid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.job_assignments
    join public.employees
      on employees.id = job_assignments.employee_id
    where job_assignments.job_id = job_uuid
      and employees.user_id = auth.uid()
      and employees.is_active = true
  );
$$;

do $$
begin
  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'jobs'
      and policyname = 'Employees can view assigned jobs'
  ) then
    drop policy "Employees can view assigned jobs" on public.jobs;
  end if;

  create policy "Employees can view assigned jobs"
  on public.jobs
  for select
  using (public.is_employee_assigned_to_job(id));

  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'jobs'
      and policyname = 'Employees can update assigned jobs'
  ) then
    drop policy "Employees can update assigned jobs" on public.jobs;
  end if;

  create policy "Employees can update assigned jobs"
  on public.jobs
  for update
  using (public.is_employee_assigned_to_job(id))
  with check (public.is_employee_assigned_to_job(id));
end $$;
