-- Student photos contain personal data. Keep the bucket private and allow
-- access only to authenticated users through short-lived signed URLs.

begin;

update storage.buckets
set public = false
where id = 'student-avatars';

drop policy if exists student_avatars_select on storage.objects;
create policy student_avatars_select_authenticated
on storage.objects
for select
to authenticated
using (
  bucket_id = 'student-avatars'
  and (storage.foldername(name))[1] = 'students'
);

commit;
