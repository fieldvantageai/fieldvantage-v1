drop policy if exists "Admins can view company memberships" on public.company_memberships;

create policy "Admins can view company memberships"
on public.company_memberships
for select
using (public.is_company_admin(company_id));
