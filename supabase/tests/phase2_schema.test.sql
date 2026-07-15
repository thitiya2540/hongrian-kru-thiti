begin;

select plan(16);

select is(
  (
    select count(*)
    from information_schema.tables
    where table_schema = 'public'
      and table_name = any (array[
        'profiles', 'academic_terms', 'classrooms', 'students', 'classroom_students',
        'subjects', 'classroom_subjects', 'assignment_templates', 'assignments',
        'student_assignment_records', 'reward_transactions', 'badges', 'student_badges',
        'activity_logs', 'app_settings'
      ])
  ),
  15::bigint,
  'สร้างตาราง Phase 2 ครบ 15 ตาราง'
);

select is(
  (
    select count(*)
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relrowsecurity
      and c.relname = any (array[
        'profiles', 'academic_terms', 'classrooms', 'students', 'classroom_students',
        'subjects', 'classroom_subjects', 'assignment_templates', 'assignments',
        'student_assignment_records', 'reward_transactions', 'badges', 'student_badges',
        'activity_logs', 'app_settings'
      ])
  ),
  15::bigint,
  'เปิด RLS ครบทุกตาราง'
);

select has_function(
  'public',
  'get_dashboard_overview',
  array['uuid'],
  'มี RPC สำหรับโหลด Dashboard ในคำขอเดียว'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conrelid = 'public.student_assignment_records'::regclass
      and contype = 'u'
      and pg_get_constraintdef(oid) like '%(assignment_id, student_id)%'
  ),
  'คะแนนของนักเรียนหนึ่งคนต่องานต้องไม่ซ้ำ'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and contype = 'f'
      and confrelid = 'auth.users'::regclass
  ),
  'profiles เชื่อมกับ auth.users'
);

select ok(
  not has_table_privilege('anon', 'public.students', 'SELECT'),
  'anon อ่านข้อมูลนักเรียนโดยตรงไม่ได้'
);

select ok(
  not has_table_privilege('anon', 'public.student_assignment_records', 'SELECT'),
  'anon อ่านคะแนนโดยตรงไม่ได้'
);

select ok(
  has_function_privilege('authenticated', 'public.get_dashboard_overview(uuid)', 'EXECUTE'),
  'ผู้ใช้ที่เข้าสู่ระบบเรียก Dashboard RPC ได้'
);

select is((select count(*) from public.academic_terms), 1::bigint, 'Seed ปี/ภาคเรียน 1 รายการ');
select is((select count(*) from public.classrooms), 3::bigint, 'Seed ห้องเรียน ป.4-ป.6 ครบ 3 ห้อง');
select is((select count(*) from public.students), 24::bigint, 'Seed นักเรียนห้องละ 8 คน รวม 24 คน');
select is((select count(*) from public.subjects), 3::bigint, 'Seed วิชาคณิตศาสตร์ครบ 3 ระดับชั้น');
select is((select count(*) from public.assignments), 12::bigint, 'Seed งาน 4 งานต่อห้อง รวม 12 งาน');
select is((select count(*) from public.student_assignment_records), 96::bigint, 'Seed คะแนนและสถานะครบ 96 รายการ');

select ok(
  (
    select count(distinct status)
    from public.student_assignment_records
    where status in ('submitted', 'missing', 'revision', 'pending_review', 'absent')
  ) = 5,
  'Seed ครบ 5 สถานะหลัก'
);

select ok(
  not exists (
    select 1
    from public.activity_logs
    where coalesce(old_value, '{}'::jsonb) ? 'pin_hash'
       or coalesce(new_value, '{}'::jsonb) ? 'pin_hash'
  ),
  'Audit Log ไม่เก็บ PIN hash'
);

select * from finish();
rollback;
