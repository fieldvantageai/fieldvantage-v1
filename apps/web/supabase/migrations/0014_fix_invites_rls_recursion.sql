drop policy if exists employees_select_admin_or_self on public.employees;
drop policy if exists employees_insert_admin_only on public.employees;
drop policy if exists employees_update_admin_only on public.employees;
drop policy if exists invites_select_admin_only on public.invites;
drop policy if exists invites_insert_admin_only on public.invites;
drop policy if exists invites_update_admin_only on public.invites;

create or replace function public.is_company_admin_or_owner(target_company_id uuid)
returns boolean
language sql
security definer
set search_path = public, pg_catalog
set row_security = off
as $$
  select exists (
    select 1
    from public.companies
    where companies.id = target_company_id
      and companies.owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.employees
    where employees.company_id = target_company_id
      and employees.user_id = auth.uid()
      and employees.role in ('owner', 'admin')
  );
$$;

create policy employees_select_admin_or_self
on public.employees
for select
using (
  auth.uid() is not null
  and (
    employees.user_id = auth.uid()
    or public.is_company_admin_or_owner(employees.company_id)
  )
);

create policy employees_insert_admin_only
on public.employees
for insert
with check (
  auth.uid() is not null
  and employees.user_id is null
  and public.is_company_admin_or_owner(employees.company_id)
);

create policy employees_update_admin_only
on public.employees
for update
using (
  auth.uid() is not null
  and public.is_company_admin_or_owner(employees.company_id)
)
with check (
  auth.uid() is not null
  and public.is_company_admin_or_owner(employees.company_id)
);

create policy invites_select_admin_only
on public.invites
for select
using (
  auth.uid() is not null
  and public.is_company_admin_or_owner(invites.company_id)
);

create policy invites_insert_admin_only
on public.invites
for insert
with check (
  auth.uid() is not null
  and invites.status = 'pending'
  and public.is_company_admin_or_owner(invites.company_id)
);

create policy invites_update_admin_only
on public.invites
for update
using (
  auth.uid() is not null
  and public.is_company_admin_or_owner(invites.company_id)
)
with check (
  auth.uid() is not null
  and public.is_company_admin_or_owner(invites.company_id)
);
