create or replace function public.employee_can_access_customer(customer_uuid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.jobs
    join public.job_assignments
      on job_assignments.job_id = jobs.id
    join public.employees
      on employees.id = job_assignments.employee_id
    where jobs.customer_id = customer_uuid
      and employees.user_id = auth.uid()
      and employees.is_active = true
  );
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'customers'
      and policyname = 'Employees can view customers for assigned jobs'
  ) then
    create policy "Employees can view customers for assigned jobs"
    on public.customers
    for select
    using (public.employee_can_access_customer(id));
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'customer_addresses'
      and policyname = 'Employees can view addresses for assigned jobs'
  ) then
    create policy "Employees can view addresses for assigned jobs"
    on public.customer_addresses
    for select
    using (public.employee_can_access_customer(customer_id));
  end if;
end $$;
