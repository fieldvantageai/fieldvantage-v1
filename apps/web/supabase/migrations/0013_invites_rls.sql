alter table public.employees enable row level security;
alter table public.invites enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'employees'
      and policyname = 'employees_select_admin_or_self'
  ) then
    create policy employees_select_admin_or_self
    on public.employees
    for select
    using (
      auth.uid() is not null
      and (
        employees.user_id = auth.uid()
        or exists (
          select 1
          from public.companies
          where companies.id = employees.company_id
            and companies.owner_id = auth.uid()
        )
        or exists (
          select 1
          from public.employees as admin
          where admin.company_id = employees.company_id
            and admin.user_id = auth.uid()
            and admin.role in ('owner', 'admin')
        )
      )
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'employees'
      and policyname = 'employees_insert_admin_only'
  ) then
    create policy employees_insert_admin_only
    on public.employees
    for insert
    with check (
      auth.uid() is not null
      and employees.user_id is null
      and (
        exists (
          select 1
          from public.companies
          where companies.id = employees.company_id
            and companies.owner_id = auth.uid()
        )
        or exists (
          select 1
          from public.employees as admin
          where admin.company_id = employees.company_id
            and admin.user_id = auth.uid()
            and admin.role in ('owner', 'admin')
        )
      )
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'employees'
      and policyname = 'employees_update_admin_only'
  ) then
    create policy employees_update_admin_only
    on public.employees
    for update
    using (
      auth.uid() is not null
      and (
        exists (
          select 1
          from public.companies
          where companies.id = employees.company_id
            and companies.owner_id = auth.uid()
        )
        or exists (
          select 1
          from public.employees as admin
          where admin.company_id = employees.company_id
            and admin.user_id = auth.uid()
            and admin.role in ('owner', 'admin')
        )
      )
    )
    with check (
      auth.uid() is not null
      and (
        exists (
          select 1
          from public.companies
          where companies.id = employees.company_id
            and companies.owner_id = auth.uid()
        )
        or exists (
          select 1
          from public.employees as admin
          where admin.company_id = employees.company_id
            and admin.user_id = auth.uid()
            and admin.role in ('owner', 'admin')
        )
      )
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'invites'
      and policyname = 'invites_select_admin_only'
  ) then
    create policy invites_select_admin_only
    on public.invites
    for select
    using (
      auth.uid() is not null
      and (
        exists (
          select 1
          from public.companies
          where companies.id = invites.company_id
            and companies.owner_id = auth.uid()
        )
        or exists (
          select 1
          from public.employees as admin
          where admin.company_id = invites.company_id
            and admin.user_id = auth.uid()
            and admin.role in ('owner', 'admin')
        )
      )
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'invites'
      and policyname = 'invites_insert_admin_only'
  ) then
    create policy invites_insert_admin_only
    on public.invites
    for insert
    with check (
      auth.uid() is not null
      and invites.status = 'pending'
      and (
        exists (
          select 1
          from public.companies
          where companies.id = invites.company_id
            and companies.owner_id = auth.uid()
        )
        or exists (
          select 1
          from public.employees as admin
          where admin.company_id = invites.company_id
            and admin.user_id = auth.uid()
            and admin.role in ('owner', 'admin')
        )
      )
    );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'invites'
      and policyname = 'invites_update_admin_only'
  ) then
    create policy invites_update_admin_only
    on public.invites
    for update
    using (
      auth.uid() is not null
      and (
        exists (
          select 1
          from public.companies
          where companies.id = invites.company_id
            and companies.owner_id = auth.uid()
        )
        or exists (
          select 1
          from public.employees as admin
          where admin.company_id = invites.company_id
            and admin.user_id = auth.uid()
            and admin.role in ('owner', 'admin')
        )
      )
    )
    with check (
      auth.uid() is not null
      and (
        exists (
          select 1
          from public.companies
          where companies.id = invites.company_id
            and companies.owner_id = auth.uid()
        )
        or exists (
          select 1
          from public.employees as admin
          where admin.company_id = invites.company_id
            and admin.user_id = auth.uid()
            and admin.role in ('owner', 'admin')
        )
      )
    );
  end if;
end $$;
