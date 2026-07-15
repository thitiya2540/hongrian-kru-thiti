-- Class Quest · Phase 3
-- Management RPCs for classrooms, students, and subjects.

begin;

create or replace function public.upsert_student_with_pin(
  p_student_id uuid default null,
  p_student_code text default null,
  p_identity_number text default null,
  p_first_name text default null,
  p_last_name text default null,
  p_nickname text default null,
  p_number_in_class integer default null,
  p_classroom_id uuid default null,
  p_status public.student_status default 'active',
  p_pin text default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  target_student_id uuid := p_student_id;
begin
  if current_user_id is null then
    raise exception 'not_authenticated';
  end if;

  if p_student_code is null or char_length(trim(p_student_code)) < 2 then
    raise exception 'student_code_required';
  end if;

  if p_first_name is null or char_length(trim(p_first_name)) < 1 then
    raise exception 'first_name_required';
  end if;

  if p_last_name is null or char_length(trim(p_last_name)) < 1 then
    raise exception 'last_name_required';
  end if;

  if p_classroom_id is not null and not public.can_access_classroom(p_classroom_id, current_user_id) then
    raise exception 'classroom_not_allowed';
  end if;

  if p_student_id is null then
    if p_pin is null or p_pin !~ '^[0-9]{4,12}$' then
      raise exception 'pin_required';
    end if;

    insert into public.students (
      student_code,
      identity_number,
      first_name,
      last_name,
      nickname,
      number_in_class,
      pin_hash,
      status,
      created_by
    )
    values (
      trim(p_student_code),
      nullif(trim(coalesce(p_identity_number, '')), ''),
      trim(p_first_name),
      trim(p_last_name),
      nullif(trim(coalesce(p_nickname, '')), ''),
      p_number_in_class,
      extensions.crypt(p_pin, extensions.gen_salt('bf', 10)),
      coalesce(p_status, 'active'),
      current_user_id
    )
    returning id into target_student_id;
  else
    if not public.can_access_student(p_student_id, current_user_id) then
      raise exception 'student_not_allowed';
    end if;

    if p_pin is not null and trim(p_pin) <> '' and p_pin !~ '^[0-9]{4,12}$' then
      raise exception 'pin_invalid';
    end if;

    update public.students s
    set
      student_code = trim(p_student_code),
      identity_number = nullif(trim(coalesce(p_identity_number, '')), ''),
      first_name = trim(p_first_name),
      last_name = trim(p_last_name),
      nickname = nullif(trim(coalesce(p_nickname, '')), ''),
      number_in_class = p_number_in_class,
      status = coalesce(p_status, s.status),
      pin_hash = case
        when p_pin is null or trim(p_pin) = '' then s.pin_hash
        else extensions.crypt(p_pin, extensions.gen_salt('bf', 10))
      end
    where s.id = p_student_id
    returning id into target_student_id;
  end if;

  if p_classroom_id is not null and target_student_id is not null then
    update public.classroom_students cs
    set is_active = false
    where cs.student_id = target_student_id
      and cs.classroom_id <> p_classroom_id
      and exists (
        select 1
        from public.classrooms c
        where c.id = cs.classroom_id and public.can_access_classroom(c.id, current_user_id)
      );

    insert into public.classroom_students (classroom_id, student_id, is_active)
    values (p_classroom_id, target_student_id, true)
    on conflict (classroom_id, student_id) do update set is_active = true;
  end if;

  return target_student_id;
end;
$$;

revoke all on function public.upsert_student_with_pin(uuid, text, text, text, text, text, integer, uuid, public.student_status, text) from public, anon;
grant execute on function public.upsert_student_with_pin(uuid, text, text, text, text, text, integer, uuid, public.student_status, text) to authenticated;

commit;
