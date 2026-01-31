do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'employees'
      and policyname = 'Employees can view self'
  ) then
    create policy "Employees can view self"
    on public.employees
    for select
    using (user_id = auth.uid());
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'jobs'
      and policyname = 'Employees can view assigned jobs'
  ) then
    create policy "Employees can view assigned jobs"
    on public.jobs
    for select
    using (
      exists (
        select 1
        from public.job_assignments
        join public.employees
          on employees.id = job_assignments.employee_id
        where job_assignments.job_id = jobs.id
          and employees.user_id = auth.uid()
          and employees.is_active = true
      )
    );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'jobs'
      and policyname = 'Employees can update assigned jobs'
  ) then
    create policy "Employees can update assigned jobs"
    on public.jobs
    for update
    using (
      exists (
        select 1
        from public.job_assignments
        join public.employees
          on employees.id = job_assignments.employee_id
        where job_assignments.job_id = jobs.id
          and employees.user_id = auth.uid()
          and employees.is_active = true
      )
    )
    with check (
      exists (
        select 1
        from public.job_assignments
        join public.employees
          on employees.id = job_assignments.employee_id
        where job_assignments.job_id = jobs.id
          and employees.user_id = auth.uid()
          and employees.is_active = true
      )
    );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'job_assignments'
      and policyname = 'Employees can view own assignments'
  ) then
    create policy "Employees can view own assignments"
    on public.job_assignments
    for select
    using (
      exists (
        select 1
        from public.employees
        where employees.id = job_assignments.employee_id
          and employees.user_id = auth.uid()
          and employees.is_active = true
      )
    );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'order_status_events'
      and policyname = 'Employees can view status events for assigned jobs'
  ) then
    create policy "Employees can view status events for assigned jobs"
    on public.order_status_events
    for select
    using (
      exists (
        select 1
        from public.job_assignments
        join public.employees
          on employees.id = job_assignments.employee_id
        where job_assignments.job_id = order_status_events.order_id
          and employees.user_id = auth.uid()
          and employees.is_active = true
      )
    );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'order_status_events'
      and policyname = 'Employees can insert status events for assigned jobs'
  ) then
    create policy "Employees can insert status events for assigned jobs"
    on public.order_status_events
    for insert
    with check (
      exists (
        select 1
        from public.job_assignments
        join public.employees
          on employees.id = job_assignments.employee_id
        where job_assignments.job_id = order_status_events.order_id
          and employees.user_id = auth.uid()
          and employees.is_active = true
      )
    );
  end if;
end $$;
