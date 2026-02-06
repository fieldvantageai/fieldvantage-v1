drop policy if exists "Members can view company memberships by company" on public.company_memberships;

create policy "Members can view company memberships by company"
on public.company_memberships
for select
using (public.has_active_membership(company_id));
