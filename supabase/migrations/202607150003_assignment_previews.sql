-- Optional worksheet preview image and external resource link for assignments.
-- Preview files are private and scoped to the authenticated teacher folder.

begin;

alter table public.assignments
  add column if not exists preview_image_path text,
  add column if not exists resource_url text;

alter table public.assignments
  drop constraint if exists assignments_resource_url_check;

alter table public.assignments
  add constraint assignments_resource_url_check
  check (
    resource_url is null
    or resource_url ~* '^https?://'
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'assignment-previews',
  'assignment-previews',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists assignment_previews_select_own on storage.objects;
create policy assignment_previews_select_own
on storage.objects
for select
to authenticated
using (
  bucket_id = 'assignment-previews'
  and (storage.foldername(name))[1] = 'assignments'
  and (storage.foldername(name))[2] = (select auth.uid()::text)
);

drop policy if exists assignment_previews_insert_own on storage.objects;
create policy assignment_previews_insert_own
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'assignment-previews'
  and (storage.foldername(name))[1] = 'assignments'
  and (storage.foldername(name))[2] = (select auth.uid()::text)
);

drop policy if exists assignment_previews_update_own on storage.objects;
create policy assignment_previews_update_own
on storage.objects
for update
to authenticated
using (
  bucket_id = 'assignment-previews'
  and (storage.foldername(name))[1] = 'assignments'
  and (storage.foldername(name))[2] = (select auth.uid()::text)
)
with check (
  bucket_id = 'assignment-previews'
  and (storage.foldername(name))[1] = 'assignments'
  and (storage.foldername(name))[2] = (select auth.uid()::text)
);

drop policy if exists assignment_previews_delete_own on storage.objects;
create policy assignment_previews_delete_own
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'assignment-previews'
  and (storage.foldername(name))[1] = 'assignments'
  and (storage.foldername(name))[2] = (select auth.uid()::text)
);

commit;
