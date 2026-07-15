-- Prepare the linked project for real use.
-- Keep authentication profiles, academic terms, scoring settings, and schema.
-- Remove operational demo data that was inserted by the old seed file.

begin;

do $$
declare
  seed_classrooms uuid[] := array[
    'c4000000-0000-4000-8000-000000000001'::uuid,
    'c5000000-0000-4000-8000-000000000001'::uuid,
    'c6000000-0000-4000-8000-000000000001'::uuid
  ];
  seed_students uuid[] := array[
    '44000000-0000-4000-8000-000000000001'::uuid, '44000000-0000-4000-8000-000000000002'::uuid,
    '44000000-0000-4000-8000-000000000003'::uuid, '44000000-0000-4000-8000-000000000004'::uuid,
    '44000000-0000-4000-8000-000000000005'::uuid, '44000000-0000-4000-8000-000000000006'::uuid,
    '44000000-0000-4000-8000-000000000007'::uuid, '44000000-0000-4000-8000-000000000008'::uuid,
    '55000000-0000-4000-8000-000000000001'::uuid, '55000000-0000-4000-8000-000000000002'::uuid,
    '55000000-0000-4000-8000-000000000003'::uuid, '55000000-0000-4000-8000-000000000004'::uuid,
    '55000000-0000-4000-8000-000000000005'::uuid, '55000000-0000-4000-8000-000000000006'::uuid,
    '55000000-0000-4000-8000-000000000007'::uuid, '55000000-0000-4000-8000-000000000008'::uuid,
    '66000000-0000-4000-8000-000000000001'::uuid, '66000000-0000-4000-8000-000000000002'::uuid,
    '66000000-0000-4000-8000-000000000003'::uuid, '66000000-0000-4000-8000-000000000004'::uuid,
    '66000000-0000-4000-8000-000000000005'::uuid, '66000000-0000-4000-8000-000000000006'::uuid,
    '66000000-0000-4000-8000-000000000007'::uuid, '66000000-0000-4000-8000-000000000008'::uuid
  ];
  seed_subjects uuid[] := array[
    '54000000-0000-4000-8000-000000000001'::uuid,
    '55000000-0000-4000-8000-000000000101'::uuid,
    '56000000-0000-4000-8000-000000000001'::uuid
  ];
  seed_templates uuid[] := array[
    '74000000-0000-4000-8000-000000000001'::uuid, '74000000-0000-4000-8000-000000000002'::uuid,
    '74000000-0000-4000-8000-000000000003'::uuid, '74000000-0000-4000-8000-000000000004'::uuid
  ];
  seed_assignments uuid[] := array[
    'a4000000-0000-4000-8000-000000000001'::uuid, 'a4000000-0000-4000-8000-000000000002'::uuid,
    'a4000000-0000-4000-8000-000000000003'::uuid, 'a4000000-0000-4000-8000-000000000004'::uuid,
    'a5000000-0000-4000-8000-000000000001'::uuid, 'a5000000-0000-4000-8000-000000000002'::uuid,
    'a5000000-0000-4000-8000-000000000003'::uuid, 'a5000000-0000-4000-8000-000000000004'::uuid,
    'a6000000-0000-4000-8000-000000000001'::uuid, 'a6000000-0000-4000-8000-000000000002'::uuid,
    'a6000000-0000-4000-8000-000000000003'::uuid, 'a6000000-0000-4000-8000-000000000004'::uuid
  ];
begin
  if not exists (select 1 from public.classrooms where id = any(seed_classrooms)) then
    return;
  end if;

  delete from public.student_badges where student_id = any(seed_students);
  delete from public.reward_transactions where student_id = any(seed_students);
  delete from public.badges where id::text like 'b4000000-0000-4000-8000-%';
  delete from public.student_assignment_records where assignment_id = any(seed_assignments) or student_id = any(seed_students);
  delete from public.assignments where id = any(seed_assignments);
  delete from public.assignment_templates where id = any(seed_templates);
  delete from public.classroom_subjects where classroom_id = any(seed_classrooms) or subject_id = any(seed_subjects);
  delete from public.classroom_students where classroom_id = any(seed_classrooms) or student_id = any(seed_students);
  delete from public.subjects where id = any(seed_subjects);
  delete from public.students where id = any(seed_students);
  delete from public.classrooms where id = any(seed_classrooms);

  -- This project has not entered production yet; old logs only describe demo data.
  if not exists (select 1 from public.classrooms) and not exists (select 1 from public.students) then
    delete from public.activity_logs;
  end if;
end
$$;

commit;
