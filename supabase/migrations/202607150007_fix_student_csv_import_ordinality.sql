-- ห้องเรียนครูธิติ · Fix CSV import row numbering.
-- PostgreSQL names WITH ORDINALITY output "ordinality" unless an alias is provided.

begin;

create or replace function public.import_students_from_csv(
  p_classroom_id uuid,
  p_rows jsonb
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  import_row jsonb;
  row_number integer;
  student_code_value text;
  identity_number_value text;
  first_name_value text;
  last_name_value text;
  nickname_value text;
  number_in_class_value integer;
  pin_value text;
  target_student_id uuid;
  imported_count integer := 0;
begin
  if current_user_id is null then
    raise exception 'not_authenticated';
  end if;

  if not public.can_access_classroom(p_classroom_id, current_user_id) then
    raise exception 'classroom_not_allowed';
  end if;

  if jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) < 1 then
    raise exception 'csv_rows_required';
  end if;

  if jsonb_array_length(p_rows) > 200 then
    raise exception 'csv_rows_limit_exceeded';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_rows) item
    where nullif(trim(item ->> 'identityNumber'), '') is not null
    group by trim(item ->> 'identityNumber')
    having count(*) > 1
  ) then
    raise exception 'csv_duplicate_identity_number';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_rows) item
    join public.students s on s.identity_number = nullif(trim(item ->> 'identityNumber'), '')
    where nullif(trim(item ->> 'identityNumber'), '') is not null
  ) then
    raise exception 'csv_identity_number_already_exists';
  end if;

  for import_row, row_number in
    select csv_row.value, csv_row.ordinality::integer + 1
    from jsonb_array_elements(p_rows) with ordinality as csv_row(value, ordinality)
  loop
    student_code_value := trim(coalesce(import_row ->> 'studentCode', ''));
    identity_number_value := nullif(trim(coalesce(import_row ->> 'identityNumber', '')), '');
    first_name_value := trim(coalesce(import_row ->> 'firstName', ''));
    last_name_value := trim(coalesce(import_row ->> 'lastName', ''));
    nickname_value := nullif(trim(coalesce(import_row ->> 'nickname', '')), '');
    pin_value := trim(coalesce(import_row ->> 'pin', ''));

    if student_code_value !~ '^.{2,40}$' then
      raise exception 'csv_invalid_student_code_at_row_%', row_number;
    end if;
    if first_name_value = '' or char_length(first_name_value) > 100 then
      raise exception 'csv_invalid_first_name_at_row_%', row_number;
    end if;
    if last_name_value = '' or char_length(last_name_value) > 100 then
      raise exception 'csv_invalid_last_name_at_row_%', row_number;
    end if;
    if identity_number_value is not null and char_length(identity_number_value) > 30 then
      raise exception 'csv_invalid_identity_number_at_row_%', row_number;
    end if;
    if nickname_value is not null and char_length(nickname_value) > 80 then
      raise exception 'csv_invalid_nickname_at_row_%', row_number;
    end if;
    if pin_value !~ '^[0-9]{4,12}$' then
      raise exception 'csv_invalid_pin_at_row_%', row_number;
    end if;

    if nullif(trim(coalesce(import_row ->> 'numberInClass', '')), '') is null then
      number_in_class_value := null;
    elsif trim(import_row ->> 'numberInClass') ~ '^[0-9]+$' and trim(import_row ->> 'numberInClass')::integer > 0 then
      number_in_class_value := trim(import_row ->> 'numberInClass')::integer;
    else
      raise exception 'csv_invalid_number_in_class_at_row_%', row_number;
    end if;

    insert into public.students (
      student_code, identity_number, first_name, last_name, nickname,
      number_in_class, pin_hash, status, created_by
    ) values (
      student_code_value, identity_number_value, first_name_value, last_name_value, nickname_value,
      number_in_class_value, extensions.crypt(pin_value, extensions.gen_salt('bf', 10)), 'active', current_user_id
    ) returning id into target_student_id;

    insert into public.classroom_students (classroom_id, student_id, is_active)
    values (p_classroom_id, target_student_id, true);

    imported_count := imported_count + 1;
  end loop;

  insert into public.activity_logs (user_id, action, entity_type, entity_id, old_value, new_value)
  values (
    current_user_id,
    'student_csv_import',
    'classroom',
    p_classroom_id,
    null,
    jsonb_build_object('imported_count', imported_count)
  );

  return imported_count;
end;
$$;

revoke all on function public.import_students_from_csv(uuid, jsonb) from public, anon;
grant execute on function public.import_students_from_csv(uuid, jsonb) to authenticated;

commit;
