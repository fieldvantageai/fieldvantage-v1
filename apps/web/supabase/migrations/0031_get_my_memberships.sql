-- ============================================================
-- 0031_get_my_memberships.sql
-- Função SECURITY DEFINER para buscar as memberships do usuário
-- autenticado contornando qualquer issue de RLS/JWT no middleware
-- e em Server Components.
-- ============================================================

drop function if exists public.get_my_memberships();

create function public.get_my_memberships()
returns table (company_id uuid, role text, status text, branch_id uuid)
language sql
security definer
stable
set search_path = public
as $$
  select m.company_id, m.role, m.status, m.branch_id
  from public.company_memberships m
  where m.user_id = auth.uid()
    and m.status = 'active';
$$;

-- Garante que usuários autenticados podem chamar a função
grant execute on function public.get_my_memberships() to authenticated;
