-- Class Quest · Phase 6
-- Student portal PIN verification without exposing pin_hash.

begin;

create or replace function public.verify_student_pin(
  p_student_code text,
  p_pin text
)
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  target_student_id uuid;
begin
  select s.id
    into target_student_id
  from public.students s
  where s.student_code = trim(p_student_code)
    and s.status = 'active'
    and s.pin_hash = extensions.crypt(p_pin, s.pin_hash)
  limit 1;

  return target_student_id;
end;
$$;

revoke all on function public.verify_student_pin(text, text) from public;
grant execute on function public.verify_student_pin(text, text) to anon, authenticated;

commit;
