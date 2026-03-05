-- Job attachments table
create table public.job_attachments (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index idx_job_attachments_job_id on public.job_attachments(job_id);
create index idx_job_attachments_company_id on public.job_attachments(company_id);

alter table public.job_attachments enable row level security;

create policy "Members can view attachments"
  on public.job_attachments
  for select
  using (public.has_active_membership(company_id));

create policy "Members can insert attachments"
  on public.job_attachments
  for insert
  with check (public.has_active_membership(company_id));

create policy "Members can delete attachments"
  on public.job_attachments
  for delete
  using (public.has_active_membership(company_id));

-- Private bucket for job attachments
insert into storage.buckets (id, name, public)
values ('job-attachments', 'job-attachments', false)
on conflict (id) do nothing;

-- Storage policies: access restricted by company_id in path
create policy "Job attachments read"
on storage.objects
for select
using (
  bucket_id = 'job-attachments'
  and exists (
    select 1
    from public.companies
    where companies.id::text = split_part(name, '/', 1)
      and public.has_active_membership(companies.id)
  )
);

create policy "Job attachments insert"
on storage.objects
for insert
with check (
  bucket_id = 'job-attachments'
  and exists (
    select 1
    from public.companies
    where companies.id::text = split_part(name, '/', 1)
      and public.has_active_membership(companies.id)
  )
);

create policy "Job attachments delete"
on storage.objects
for delete
using (
  bucket_id = 'job-attachments'
  and exists (
    select 1
    from public.companies
    where companies.id::text = split_part(name, '/', 1)
      and public.has_active_membership(companies.id)
  )
);
