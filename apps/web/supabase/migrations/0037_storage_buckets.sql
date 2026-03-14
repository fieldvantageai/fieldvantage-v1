-- Storage buckets required by the application
-- All buckets are private; signed URLs are generated server-side

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'customer-avatars',
    'customer-avatars',
    false,
    5242880, -- 5 MB
    array['image/png', 'image/jpeg', 'image/webp']
  ),
  (
    'company-logos',
    'company-logos',
    false,
    5242880, -- 5 MB
    array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
  ),
  (
    'job-attachments',
    'job-attachments',
    false,
    20971520, -- 20 MB
    array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
  )
on conflict (id) do nothing;

-- RLS policies: only service_role (server-side admin client) can read/write
-- The app uses supabaseAdmin (service_role key) for all storage operations,
-- so no additional authenticated user policies are needed.

create policy "service_role full access on customer-avatars"
  on storage.objects for all
  to service_role
  using (bucket_id = 'customer-avatars')
  with check (bucket_id = 'customer-avatars');

create policy "service_role full access on company-logos"
  on storage.objects for all
  to service_role
  using (bucket_id = 'company-logos')
  with check (bucket_id = 'company-logos');

create policy "service_role full access on job-attachments"
  on storage.objects for all
  to service_role
  using (bucket_id = 'job-attachments')
  with check (bucket_id = 'job-attachments');
