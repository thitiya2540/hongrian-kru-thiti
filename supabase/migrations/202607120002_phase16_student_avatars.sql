-- Class Quest · Phase 16
-- Student profile photo storage.

begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'student-avatars',
  'student-avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists student_avatars_select on storage.objects;
create policy student_avatars_select
on storage.objects
for select
to public
using (bucket_id = 'student-avatars');

drop policy if exists student_avatars_insert_authenticated on storage.objects;
create policy student_avatars_insert_authenticated
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'student-avatars'
  and (storage.foldername(name))[1] = 'students'
);

drop policy if exists student_avatars_update_authenticated on storage.objects;
create policy student_avatars_update_authenticated
on storage.objects
for update
to authenticated
using (
  bucket_id = 'student-avatars'
  and (storage.foldername(name))[1] = 'students'
)
with check (
  bucket_id = 'student-avatars'
  and (storage.foldername(name))[1] = 'students'
);

drop policy if exists student_avatars_delete_authenticated on storage.objects;
create policy student_avatars_delete_authenticated
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'student-avatars'
  and (storage.foldername(name))[1] = 'students'
);

commit;
