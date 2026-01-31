alter table if exists public.employees
  add column if not exists preferred_navigation_app text null;

alter table if exists public.employees
  drop constraint if exists employees_preferred_navigation_app_check;

alter table public.employees
  add constraint employees_preferred_navigation_app_check
  check (
    preferred_navigation_app is null
    or preferred_navigation_app in ('auto', 'google_maps', 'apple_maps', 'waze')
  );
