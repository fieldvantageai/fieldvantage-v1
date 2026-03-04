-- ============================================================
-- 0033_jobs_admin_assigned_visibility.sql
-- Opção B: admin de filial vê ordens das suas filiais
-- E também ordens atribuídas diretamente a ele (qualquer filial)
-- Member continua vendo apenas ordens atribuídas a si.
-- ============================================================

-- ── Atualizar função is_membership_assigned_to_job ────────────
-- Já existe em migration anterior, mas garantimos que está correta.
-- A função verifica se uma membership está atribuída a um job.
-- Nenhuma alteração necessária se já existe.

-- ── Reescrever policy de SELECT em jobs ──────────────────────

drop policy if exists "Jobs select by role and branch" on public.jobs;

create policy "Jobs select by role and branch"
  on public.jobs for select
  using (
    -- 1) HQ (owner/admin sem filial): vê tudo
    public.user_is_hq(jobs.company_id)
    or
    -- 2) Admin de filial: vê ordens das suas filiais
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
    -- 3) Opção B: qualquer admin com membership ativa vê ordens atribuídas a si
    --    (independentemente de filial da ordem)
    exists (
      select 1 from public.company_memberships m
      where m.user_id = auth.uid()
        and m.company_id = jobs.company_id
        and m.status = 'active'
        and m.role in ('owner', 'admin')
        and public.is_membership_assigned_to_job(jobs.id, m.id)
    )
    or
    -- 4) Member: apenas ordens atribuídas a si (qualquer filial)
    exists (
      select 1 from public.company_memberships m
      where m.user_id = auth.uid()
        and m.company_id = jobs.company_id
        and m.status = 'active'
        and m.role = 'member'
        and public.is_membership_assigned_to_job(jobs.id, m.id)
    )
  );
