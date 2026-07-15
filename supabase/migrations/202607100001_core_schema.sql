-- Class Quest · Phase 2
-- Core schema, constraints, score rules, timestamps, and audit triggers.

begin;

create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;
revoke all on schema private from public, anon;

create type public.profile_role as enum ('admin', 'teacher', 'viewer');
create type public.recording_mode as enum ('score_only', 'status_only', 'score_and_status');
create type public.assignment_status as enum (
  'submitted',
  'missing',
  'revision',
  'passed',
  'pending_review',
  'absent',
  'exempt'
);
create type public.student_status as enum ('active', 'transferred', 'graduated', 'inactive');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 1 and 120),
  avatar_url text,
  role public.profile_role not null default 'teacher',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.academic_terms (
  id uuid primary key default gen_random_uuid(),
  academic_year integer not null check (academic_year between 2500 and 2700),
  semester integer not null check (semester between 1 and 2),
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  unique (academic_year, semester)
);

create unique index academic_terms_one_active_idx
  on public.academic_terms (is_active)
  where is_active;

create table public.classrooms (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 120),
  grade_level smallint not null check (grade_level between 1 and 12),
  room text not null check (char_length(trim(room)) between 1 and 30),
  academic_term_id uuid not null references public.academic_terms (id) on delete restrict,
  teacher_id uuid not null references public.profiles (id) on delete restrict,
  cover_image_url text,
  color text not null default '#6956D9' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (academic_term_id, teacher_id, grade_level, room)
);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  student_code text not null unique check (char_length(trim(student_code)) between 2 and 40),
  identity_number text,
  first_name text not null check (char_length(trim(first_name)) between 1 and 100),
  last_name text not null check (char_length(trim(last_name)) between 1 and 100),
  nickname text,
  number_in_class smallint check (number_in_class > 0),
  avatar_url text,
  pin_hash text not null,
  status public.student_status not null default 'active',
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index students_identity_number_idx
  on public.students (identity_number)
  where identity_number is not null;

create table public.classroom_students (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms (id) on delete restrict,
  student_id uuid not null references public.students (id) on delete restrict,
  joined_at timestamptz not null default now(),
  is_active boolean not null default true,
  unique (classroom_id, student_id)
);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 120),
  subject_code text not null check (char_length(trim(subject_code)) between 1 and 40),
  icon text not null default 'book-open',
  color text not null default '#6956D9' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  created_by uuid not null references public.profiles (id) on delete restrict,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (created_by, subject_code)
);

create table public.classroom_subjects (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms (id) on delete restrict,
  subject_id uuid not null references public.subjects (id) on delete restrict,
  teacher_id uuid not null references public.profiles (id) on delete restrict,
  unique (classroom_id, subject_id)
);

create table public.assignment_templates (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete restrict,
  title text not null check (char_length(trim(title)) between 1 and 200),
  assignment_type text not null check (assignment_type in (
    'worksheet', 'exercise', 'homework', 'quiz', 'activity', 'group_work', 'oral', 'other'
  )),
  recording_mode public.recording_mode not null default 'score_and_status',
  default_max_score numeric(8, 2) not null check (default_max_score > 0),
  category text not null check (char_length(trim(category)) between 1 and 100),
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms (id) on delete restrict,
  subject_id uuid not null references public.subjects (id) on delete restrict,
  template_id uuid references public.assignment_templates (id) on delete set null,
  title text not null check (char_length(trim(title)) between 1 and 200),
  assignment_type text not null check (assignment_type in (
    'worksheet', 'exercise', 'homework', 'quiz', 'activity', 'group_work', 'oral', 'other'
  )),
  recording_mode public.recording_mode not null default 'score_and_status',
  unit_name text,
  category text not null check (char_length(trim(category)) between 1 and 100),
  description text,
  max_score numeric(8, 2) not null check (max_score > 0),
  activity_date date not null,
  due_date date,
  allow_bonus boolean not null default false,
  auto_reward_enabled boolean not null default false,
  is_locked boolean not null default false,
  is_active boolean not null default true,
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (due_date is null or due_date >= activity_date)
);

create table public.student_assignment_records (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments (id) on delete restrict,
  student_id uuid not null references public.students (id) on delete restrict,
  score numeric(8, 2),
  status public.assignment_status not null default 'pending_review',
  submitted_at timestamptz,
  revised_at timestamptz,
  note text,
  updated_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assignment_id, student_id),
  check (score is null or score >= 0)
);

create table public.reward_transactions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete restrict,
  classroom_id uuid not null references public.classrooms (id) on delete restrict,
  assignment_id uuid references public.assignments (id) on delete set null,
  amount integer not null check (amount between -1000 and 1000 and amount <> 0),
  reason text not null check (char_length(trim(reason)) between 1 and 250),
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.badges (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 120),
  description text,
  image_url text,
  condition_type text not null check (condition_type in (
    'manual', 'submission_count', 'perfect_score', 'revision_success', 'weekly_complete', 'improvement'
  )),
  condition_value numeric(10, 2),
  created_by uuid not null references public.profiles (id) on delete restrict,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.student_badges (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete restrict,
  badge_id uuid not null references public.badges (id) on delete restrict,
  awarded_by uuid not null references public.profiles (id) on delete restrict,
  awarded_at timestamptz not null default now(),
  unique (student_id, badge_id)
);

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  action text not null check (char_length(trim(action)) between 1 and 100),
  entity_type text not null check (char_length(trim(entity_type)) between 1 and 100),
  entity_id uuid,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

create table public.app_settings (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  setting_key text not null check (char_length(trim(setting_key)) between 1 and 120),
  setting_value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (teacher_id, setting_key)
);

create index classrooms_teacher_term_idx on public.classrooms (teacher_id, academic_term_id) where is_active;
create index classroom_students_classroom_idx on public.classroom_students (classroom_id) where is_active;
create index classroom_students_student_idx on public.classroom_students (student_id) where is_active;
create index classroom_subjects_classroom_idx on public.classroom_subjects (classroom_id);
create index assignments_classroom_activity_idx on public.assignments (classroom_id, activity_date desc) where is_active;
create index assignments_subject_idx on public.assignments (subject_id) where is_active;
create index student_records_assignment_status_idx on public.student_assignment_records (assignment_id, status);
create index student_records_student_idx on public.student_assignment_records (student_id, updated_at desc);
create index rewards_student_created_idx on public.reward_transactions (student_id, created_at desc);
create index rewards_classroom_created_idx on public.reward_transactions (classroom_id, created_at desc);
create index activity_logs_entity_idx on public.activity_logs (entity_type, entity_id, created_at desc);
create index activity_logs_user_idx on public.activity_logs (user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger classrooms_set_updated_at before update on public.classrooms
for each row execute function public.set_updated_at();
create trigger students_set_updated_at before update on public.students
for each row execute function public.set_updated_at();
create trigger subjects_set_updated_at before update on public.subjects
for each row execute function public.set_updated_at();
create trigger assignment_templates_set_updated_at before update on public.assignment_templates
for each row execute function public.set_updated_at();
create trigger assignments_set_updated_at before update on public.assignments
for each row execute function public.set_updated_at();
create trigger student_records_set_updated_at before update on public.student_assignment_records
for each row execute function public.set_updated_at();
create trigger app_settings_set_updated_at before update on public.app_settings
for each row execute function public.set_updated_at();

create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url, role)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(new.email, '@', 1), 'คุณครู'),
    new.raw_user_meta_data ->> 'avatar_url',
    'teacher'::public.profile_role
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_auth_user();

create or replace function public.validate_student_assignment_record()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  assignment_max_score numeric(8, 2);
  assignment_allows_bonus boolean;
  assignment_is_locked boolean;
begin
  select a.max_score, a.allow_bonus, a.is_locked
    into assignment_max_score, assignment_allows_bonus, assignment_is_locked
  from public.assignments a
  where a.id = new.assignment_id and a.is_active;

  if not found then
    raise exception 'ไม่พบงานที่ใช้งานอยู่' using errcode = '23503';
  end if;

  if assignment_is_locked then
    if tg_op = 'INSERT' or (
      tg_op = 'UPDATE' and (
        old.score is distinct from new.score
        or old.status is distinct from new.status
        or old.note is distinct from new.note
      )
    ) then
      raise exception 'งานนี้ถูกล็อก กรุณาปลดล็อกก่อนแก้คะแนนหรือสถานะ' using errcode = '55000';
    end if;
  end if;

  if new.score is not null and new.score < 0 then
    raise exception 'คะแนนต้องไม่ติดลบ' using errcode = '23514';
  end if;

  if new.score is not null and not assignment_allows_bonus and new.score > assignment_max_score then
    raise exception 'คะแนนต้องไม่เกินคะแนนเต็ม %', assignment_max_score using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger student_records_10_validate
before insert or update on public.student_assignment_records
for each row execute function public.validate_student_assignment_record();

create or replace function private.audit_student_assignment_record()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid;
  record_id uuid;
  action_name text;
begin
  if tg_op = 'UPDATE' and not (
    old.score is distinct from new.score
    or old.status is distinct from new.status
    or old.note is distinct from new.note
  ) then
    return new;
  end if;

  actor_id := coalesce(auth.uid(), case when tg_op = 'DELETE' then old.updated_by else new.updated_by end);
  record_id := case when tg_op = 'DELETE' then old.id else new.id end;
  action_name := case tg_op
    when 'INSERT' then 'score_record_created'
    when 'UPDATE' then 'score_record_updated'
    else 'score_record_deleted'
  end;

  insert into public.activity_logs (user_id, action, entity_type, entity_id, old_value, new_value)
  values (
    actor_id,
    action_name,
    'student_assignment_record',
    record_id,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger student_records_90_audit
after insert or update or delete on public.student_assignment_records
for each row execute function private.audit_student_assignment_record();

create or replace function private.audit_main_entity_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  before_value jsonb;
  after_value jsonb;
  actor_id uuid;
  target_id uuid;
begin
  before_value := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end;
  after_value := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end;

  if tg_table_name = 'students' then
    before_value := before_value - 'pin_hash';
    after_value := after_value - 'pin_hash';
  end if;

  actor_id := coalesce(
    auth.uid(),
    nullif(after_value ->> 'updated_by', '')::uuid,
    nullif(after_value ->> 'created_by', '')::uuid,
    nullif(after_value ->> 'teacher_id', '')::uuid,
    nullif(before_value ->> 'updated_by', '')::uuid,
    nullif(before_value ->> 'created_by', '')::uuid,
    nullif(before_value ->> 'teacher_id', '')::uuid
  );
  target_id := coalesce(nullif(after_value ->> 'id', '')::uuid, nullif(before_value ->> 'id', '')::uuid);

  insert into public.activity_logs (user_id, action, entity_type, entity_id, old_value, new_value)
  values (actor_id, lower(tg_op), tg_table_name, target_id, before_value, after_value);

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger classrooms_audit after insert or update or delete on public.classrooms
for each row execute function private.audit_main_entity_change();
create trigger students_audit after insert or update or delete on public.students
for each row execute function private.audit_main_entity_change();
create trigger subjects_audit after insert or update or delete on public.subjects
for each row execute function private.audit_main_entity_change();
create trigger assignments_audit after insert or update or delete on public.assignments
for each row execute function private.audit_main_entity_change();

revoke all on function private.handle_new_auth_user() from public, anon;
revoke all on function private.audit_student_assignment_record() from public, anon;
revoke all on function private.audit_main_entity_change() from public, anon;

comment on column public.assignments.activity_date is 'วันที่นักเรียนทำงานจริง รองรับการบันทึกย้อนหลัง';
comment on column public.assignments.created_at is 'เวลาที่สร้างข้อมูลจริง ห้ามใช้แทน activity_date';
comment on column public.reward_transactions.amount is 'ดาวสะสม แยกจากคะแนนการเรียนโดยสมบูรณ์';
comment on column public.students.pin_hash is 'PIN ที่ผ่านการ hash แล้ว ห้ามส่งกลับ Client';

commit;
