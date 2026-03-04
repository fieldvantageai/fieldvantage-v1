-- ============================================================
-- 0034_fix_hq_owner_only.sql
-- Corrige user_is_hq(): somente owner sem filial é HQ.
-- Admin sem filial NÃO é HQ — vê apenas ordens atribuídas a si.
-- ============================================================

-- ── 1. Reescrever user_is_hq() ────────────────────────────────

create or replace function public.user_is_hq(company_uuid uuid)
returns boolean
language sql security definer stable set search_path = public
as $$
  select exists (
    select 1 from public.company_memberships m
    where m.user_id = auth.uid()
      and m.company_id = company_uuid
      and m.status = 'active'
      and m.role = 'owner'
      and m.branch_id is null
      and not exists (
        select 1 from public.membership_branches mb where mb.membership_id = m.id
      )
  );
$$;

-- ── 2. Reescrever policy de SELECT em jobs ─────────────────────
-- Adiciona caso 3: admin sem filial vê apenas ordens atribuídas a si.

drop policy if exists "Jobs select by role and branch" on public.jobs;

create policy "Jobs select by role and branch"
  on public.jobs for select
  using (
    -- 1) HQ: owner sem filial vê todas as ordens
    public.user_is_hq(jobs.company_id)
    or
    -- 2) Admin com filial: vê ordens da filial (incluindo sem atribuição)
    (
      jobs.branch_id is not null
      and public.user_can_access_branch(jobs.company_id, jobs.branch_id)
      and exists (
        select 1 from public.company_memberships m
        where m.user_id = auth.uid()
          and m.company_id = jobs.company_id
          and m.status = 'active'
          and m.role in ('owner', 'admin')
      )
    )
    or
    -- 3) Admin sem filial (não-HQ): vê apenas ordens atribuídas a si
    exists (
      select 1 from public.company_memberships m
      where m.user_id = auth.uid()
        and m.company_id = jobs.company_id
        and m.status = 'active'
        and m.role = 'admin'
        and m.branch_id is null
        and not exists (
          select 1 from public.membership_branches mb where mb.membership_id = m.id
        )
        and public.is_membership_assigned_to_job(jobs.id, m.id)
    )
    or
    -- 4) Opção B: admin com filial também vê ordens atribuídas a si fora do escopo
    exists (
      select 1 from public.company_memberships m
      where m.user_id = auth.uid()
        and m.company_id = jobs.company_id
        and m.status = 'active'
        and m.role = 'admin'
        and (
          m.branch_id is not null
          or exists (
            select 1 from public.membership_branches mb where mb.membership_id = m.id
          )
        )
        and public.is_membership_assigned_to_job(jobs.id, m.id)
    )
    or
    -- 5) Member: apenas ordens atribuídas a si
    exists (
      select 1 from public.company_memberships m
      where m.user_id = auth.uid()
        and m.company_id = jobs.company_id
        and m.status = 'active'
        and m.role = 'member'
        and public.is_membership_assigned_to_job(jobs.id, m.id)
    )
  );
