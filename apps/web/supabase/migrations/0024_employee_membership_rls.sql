alter table if exists public.employees
  alter column company_id drop not null;

create or replace function public.employee_shares_company(target_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.company_memberships as mine
    join public.company_memberships as theirs
      on theirs.company_id = mine.company_id
    where mine.user_id = auth.uid()
      and mine.status = 'active'
      and theirs.user_id = target_user_id
      and theirs.status = 'active'
  );
$$;

create or replace function public.employee_visible_by_invite(employee_uuid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.invites
    join public.company_memberships
      on company_memberships.company_id = invites.company_id
    where invites.employee_id = employee_uuid
      and invites.status = 'pending'
      and company_memberships.user_id = auth.uid()
      and company_memberships.status = 'active'
      and company_memberships.role in ('owner', 'admin')
  );
$$;

drop policy if exists "Members can view employees" on public.employees;
drop policy if exists "Members can view employees by membership" on public.employees;
drop policy if exists "Admins can manage employees" on public.employees;
drop policy if exists "Admins can insert employees" on public.employees;
drop policy if exists "Admins can update employees" on public.employees;
drop policy if exists "Admins can delete employees" on public.employees;

create policy "Members can view employees by membership"
on public.employees
for select
using (
  (user_id is not null and public.employee_shares_company(user_id))
  or public.employee_visible_by_invite(id)
);

create policy "Admins can insert employees"
on public.employees
for insert
with check (
  company_id is null
  or public.is_company_admin(company_id)
);

create policy "Admins can update employees"
on public.employees
for update
using (
  (user_id is not null and public.employee_shares_company(user_id))
  or (company_id is not null and public.is_company_admin(company_id))
)
with check (
  (user_id is not null and public.employee_shares_company(user_id))
  or (company_id is not null and public.is_company_admin(company_id))
);

create policy "Admins can delete employees"
on public.employees
for delete
using (
  (user_id is not null and public.employee_shares_company(user_id))
  or (company_id is not null and public.is_company_admin(company_id))
);
