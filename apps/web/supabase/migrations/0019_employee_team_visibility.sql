create or replace function public.employee_shares_job_with_auth(target_employee_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.job_assignments ja_target
    join public.job_assignments ja_auth
      on ja_auth.job_id = ja_target.job_id
    join public.employees auth_employee
      on auth_employee.id = ja_auth.employee_id
    where ja_target.employee_id = target_employee_id
      and auth_employee.user_id = auth.uid()
      and auth_employee.is_active = true
  );
$$;

do $$
begin
  if exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'job_assignments'
      and policyname = 'Employees can view own assignments'
  ) then
    drop policy "Employees can view own assignments" on public.job_assignments;
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'job_assignments'
      and policyname = 'Employees can view job assignments for their jobs'
  ) then
    create policy "Employees can view job assignments for their jobs"
    on public.job_assignments
    for select
    using (public.is_employee_assigned_to_job(job_id));
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'employees'
      and policyname = 'Employees can view teammates on same jobs'
  ) then
    create policy "Employees can view teammates on same jobs"
    on public.employees
    for select
    using (public.employee_shares_job_with_auth(id));
  end if;
end $$;
