-- Class Quest · Phase 2
-- Row Level Security and the single-request Dashboard RPC.

begin;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

alter table public.profiles enable row level security;
alter table public.academic_terms enable row level security;
alter table public.classrooms enable row level security;
alter table public.students enable row level security;
alter table public.classroom_students enable row level security;
alter table public.subjects enable row level security;
alter table public.classroom_subjects enable row level security;
alter table public.assignment_templates enable row level security;
alter table public.assignments enable row level security;
alter table public.student_assignment_records enable row level security;
alter table public.reward_transactions enable row level security;
alter table public.badges enable row level security;
alter table public.student_badges enable row level security;
alter table public.activity_logs enable row level security;
alter table public.app_settings enable row level security;

create or replace function private.is_admin(request_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = request_user_id and p.role = 'admin' and p.is_active
  );
$$;

create or replace function private.can_access_classroom(
  target_classroom_id uuid,
  request_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_admin(request_user_id) or exists (
    select 1
    from public.classrooms c
    join public.profiles p on p.id = c.teacher_id and p.is_active
    where c.id = target_classroom_id
      and c.teacher_id = request_user_id
  );
$$;

create or replace function private.can_access_student(
  target_student_id uuid,
  request_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_admin(request_user_id) or exists (
    select 1
    from public.students s
    where s.id = target_student_id and s.created_by = request_user_id
  ) or exists (
    select 1
    from public.classroom_students cs
    join public.classrooms c on c.id = cs.classroom_id
    where cs.student_id = target_student_id
      and cs.is_active
      and c.teacher_id = request_user_id
  );
$$;

create or replace function private.can_access_subject(
  target_subject_id uuid,
  request_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_admin(request_user_id) or exists (
    select 1
    from public.subjects s
    where s.id = target_subject_id and s.created_by = request_user_id
  ) or exists (
    select 1
    from public.classroom_subjects cs
    join public.classrooms c on c.id = cs.classroom_id
    where cs.subject_id = target_subject_id
      and c.teacher_id = request_user_id
  );
$$;

revoke all on function private.is_admin(uuid) from public, anon;
revoke all on function private.can_access_classroom(uuid, uuid) from public, anon;
revoke all on function private.can_access_student(uuid, uuid) from public, anon;
revoke all on function private.can_access_subject(uuid, uuid) from public, anon;
grant execute on function private.is_admin(uuid) to authenticated;
grant execute on function private.can_access_classroom(uuid, uuid) to authenticated;
grant execute on function private.can_access_student(uuid, uuid) to authenticated;
grant execute on function private.can_access_subject(uuid, uuid) to authenticated;

create or replace function public.is_admin(request_user_id uuid default auth.uid())
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select private.is_admin(request_user_id);
$$;

create or replace function public.can_access_classroom(
  target_classroom_id uuid,
  request_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select private.can_access_classroom(target_classroom_id, request_user_id);
$$;

create or replace function public.can_access_student(
  target_student_id uuid,
  request_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select private.can_access_student(target_student_id, request_user_id);
$$;

create or replace function public.can_access_subject(
  target_subject_id uuid,
  request_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select private.can_access_subject(target_subject_id, request_user_id);
$$;

revoke all on function public.is_admin(uuid) from public, anon;
revoke all on function public.can_access_classroom(uuid, uuid) from public, anon;
revoke all on function public.can_access_student(uuid, uuid) from public, anon;
revoke all on function public.can_access_subject(uuid, uuid) from public, anon;
grant execute on function public.is_admin(uuid) to authenticated;
grant execute on function public.can_access_classroom(uuid, uuid) to authenticated;
grant execute on function public.can_access_student(uuid, uuid) to authenticated;
grant execute on function public.can_access_subject(uuid, uuid) to authenticated;

create policy profiles_select_scope on public.profiles
for select to authenticated
using (id = auth.uid() or public.is_admin());

create policy profiles_update_scope on public.profiles
for update to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

create policy academic_terms_select_authenticated on public.academic_terms
for select to authenticated using (true);

create policy academic_terms_insert_admin on public.academic_terms
for insert to authenticated with check (public.is_admin());

create policy academic_terms_update_admin on public.academic_terms
for update to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy classrooms_select_scope on public.classrooms
for select to authenticated
using (teacher_id = auth.uid() or public.is_admin());

create policy classrooms_insert_scope on public.classrooms
for insert to authenticated
with check (teacher_id = auth.uid() or public.is_admin());

create policy classrooms_update_scope on public.classrooms
for update to authenticated
using (teacher_id = auth.uid() or public.is_admin())
with check (teacher_id = auth.uid() or public.is_admin());

create policy students_select_scope on public.students
for select to authenticated
using (created_by = auth.uid() or public.can_access_student(id) or public.is_admin());

create policy students_insert_scope on public.students
for insert to authenticated
with check (created_by = auth.uid() or public.is_admin());

create policy students_update_scope on public.students
for update to authenticated
using (public.can_access_student(id))
with check (public.can_access_student(id));

create policy classroom_students_select_scope on public.classroom_students
for select to authenticated
using (public.can_access_classroom(classroom_id));

create policy classroom_students_insert_scope on public.classroom_students
for insert to authenticated
with check (
  public.can_access_classroom(classroom_id)
  and public.can_access_student(student_id)
);

create policy classroom_students_update_scope on public.classroom_students
for update to authenticated
using (public.can_access_classroom(classroom_id))
with check (
  public.can_access_classroom(classroom_id)
  and public.can_access_student(student_id)
);

create policy classroom_students_delete_scope on public.classroom_students
for delete to authenticated
using (public.can_access_classroom(classroom_id));

create policy subjects_select_scope on public.subjects
for select to authenticated
using (public.can_access_subject(id));

create policy subjects_insert_scope on public.subjects
for insert to authenticated
with check (created_by = auth.uid() or public.is_admin());

create policy subjects_update_scope on public.subjects
for update to authenticated
using (public.can_access_subject(id))
with check (public.can_access_subject(id));

create policy classroom_subjects_select_scope on public.classroom_subjects
for select to authenticated
using (public.can_access_classroom(classroom_id));

create policy classroom_subjects_insert_scope on public.classroom_subjects
for insert to authenticated
with check (
  public.can_access_classroom(classroom_id)
  and public.can_access_subject(subject_id)
  and (teacher_id = auth.uid() or public.is_admin())
);

create policy classroom_subjects_update_scope on public.classroom_subjects
for update to authenticated
using (public.can_access_classroom(classroom_id))
with check (
  public.can_access_classroom(classroom_id)
  and public.can_access_subject(subject_id)
  and (teacher_id = auth.uid() or public.is_admin())
);

create policy classroom_subjects_delete_scope on public.classroom_subjects
for delete to authenticated
using (public.can_access_classroom(classroom_id));

create policy assignment_templates_select_scope on public.assignment_templates
for select to authenticated
using (teacher_id = auth.uid() or public.is_admin());

create policy assignment_templates_insert_scope on public.assignment_templates
for insert to authenticated
with check (teacher_id = auth.uid() or public.is_admin());

create policy assignment_templates_update_scope on public.assignment_templates
for update to authenticated
using (teacher_id = auth.uid() or public.is_admin())
with check (teacher_id = auth.uid() or public.is_admin());

create policy assignments_select_scope on public.assignments
for select to authenticated
using (public.can_access_classroom(classroom_id));

create policy assignments_insert_scope on public.assignments
for insert to authenticated
with check (
  public.can_access_classroom(classroom_id)
  and public.can_access_subject(subject_id)
  and (created_by = auth.uid() or public.is_admin())
);

create policy assignments_update_scope on public.assignments
for update to authenticated
using (public.can_access_classroom(classroom_id))
with check (
  public.can_access_classroom(classroom_id)
  and public.can_access_subject(subject_id)
  and (created_by = auth.uid() or public.is_admin())
);

create policy student_records_select_scope on public.student_assignment_records
for select to authenticated
using (
  exists (
    select 1 from public.assignments a
    where a.id = assignment_id and public.can_access_classroom(a.classroom_id)
  )
);

create policy student_records_insert_scope on public.student_assignment_records
for insert to authenticated
with check (
  public.can_access_student(student_id)
  and (updated_by = auth.uid() or public.is_admin())
  and exists (
    select 1 from public.assignments a
    where a.id = assignment_id and public.can_access_classroom(a.classroom_id)
  )
);

create policy student_records_update_scope on public.student_assignment_records
for update to authenticated
using (
  exists (
    select 1 from public.assignments a
    where a.id = assignment_id and public.can_access_classroom(a.classroom_id)
  )
)
with check (
  public.can_access_student(student_id)
  and (updated_by = auth.uid() or public.is_admin())
  and exists (
    select 1 from public.assignments a
    where a.id = assignment_id and public.can_access_classroom(a.classroom_id)
  )
);

create policy reward_transactions_select_scope on public.reward_transactions
for select to authenticated
using (public.can_access_classroom(classroom_id) and public.can_access_student(student_id));

create policy reward_transactions_insert_scope on public.reward_transactions
for insert to authenticated
with check (
  public.can_access_classroom(classroom_id)
  and public.can_access_student(student_id)
  and (created_by = auth.uid() or public.is_admin())
);

create policy badges_select_scope on public.badges
for select to authenticated
using (created_by = auth.uid() or public.is_admin());

create policy badges_insert_scope on public.badges
for insert to authenticated
with check (created_by = auth.uid() or public.is_admin());

create policy badges_update_scope on public.badges
for update to authenticated
using (created_by = auth.uid() or public.is_admin())
with check (created_by = auth.uid() or public.is_admin());

create policy student_badges_select_scope on public.student_badges
for select to authenticated
using (public.can_access_student(student_id));

create policy student_badges_insert_scope on public.student_badges
for insert to authenticated
with check (
  public.can_access_student(student_id)
  and (awarded_by = auth.uid() or public.is_admin())
);

create policy activity_logs_select_scope on public.activity_logs
for select to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy app_settings_select_scope on public.app_settings
for select to authenticated
using (teacher_id = auth.uid() or public.is_admin());

create policy app_settings_insert_scope on public.app_settings
for insert to authenticated
with check (teacher_id = auth.uid() or public.is_admin());

create policy app_settings_update_scope on public.app_settings
for update to authenticated
using (teacher_id = auth.uid() or public.is_admin())
with check (teacher_id = auth.uid() or public.is_admin());

revoke all on all tables in schema public from anon;
grant usage on schema public to authenticated;
grant usage on type public.profile_role to authenticated;
grant usage on type public.recording_mode to authenticated;
grant usage on type public.assignment_status to authenticated;
grant usage on type public.student_status to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.academic_terms to authenticated;
grant select, insert, update on public.classrooms to authenticated;
grant select, insert, update on public.students to authenticated;
grant select, insert, update, delete on public.classroom_students to authenticated;
grant select, insert, update on public.subjects to authenticated;
grant select, insert, update, delete on public.classroom_subjects to authenticated;
grant select, insert, update on public.assignment_templates to authenticated;
grant select, insert, update on public.assignments to authenticated;
grant select, insert, update on public.student_assignment_records to authenticated;
grant select, insert on public.reward_transactions to authenticated;
grant select, insert, update on public.badges to authenticated;
grant select, insert on public.student_badges to authenticated;
grant select on public.activity_logs to authenticated;
grant select, insert, update on public.app_settings to authenticated;

create or replace function public.get_dashboard_overview(p_term_id uuid default null)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  request_user_id uuid := auth.uid();
  selected_term_id uuid;
  teacher_name text;
  terms_payload jsonb := '[]'::jsonb;
  classrooms_payload jsonb := '[]'::jsonb;
  tasks_payload jsonb := '[]'::jsonb;
  stats_payload jsonb := '{}'::jsonb;
begin
  if request_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select p.display_name
    into teacher_name
  from public.profiles p
  where p.id = request_user_id and p.is_active;

  if teacher_name is null then
    raise exception 'บัญชีผู้ใช้ถูกปิดใช้งานหรือไม่มีโปรไฟล์' using errcode = '42501';
  end if;

  if p_term_id is not null and exists (
    select 1 from public.academic_terms t where t.id = p_term_id
  ) then
    selected_term_id := p_term_id;
  else
    select t.id
      into selected_term_id
    from public.academic_terms t
    order by t.is_active desc, t.academic_year desc, t.semester desc
    limit 1;
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', t.id::text,
        'academic_year', t.academic_year,
        'semester', t.semester,
        'is_active', t.is_active
      )
      order by t.academic_year desc, t.semester desc
    ),
    '[]'::jsonb
  )
    into terms_payload
  from public.academic_terms t;

  select coalesce(jsonb_agg(classroom_row.payload order by classroom_row.grade_level), '[]'::jsonb)
    into classrooms_payload
  from (
    select
      c.grade_level,
      jsonb_build_object(
        'id', c.id::text,
        'grade', 'ป.' || c.grade_level::text,
        'title', c.name,
        'room', c.room,
        'students', coalesce(student_stat.student_count, 0),
        'subjects', coalesce(subject_stat.subject_count, 0),
        'missing', coalesce(record_stat.missing_count, 0),
        'revision', coalesce(record_stat.revision_count, 0),
        'pending_review', coalesce(record_stat.pending_count, 0),
        'completion_rate', coalesce(record_stat.completion_rate, 0),
        'last_updated', record_stat.last_updated,
        'theme', case c.grade_level when 4 then 'violet' when 5 then 'emerald' else 'orange' end,
        'scene', case c.grade_level when 4 then 'school' when 5 then 'mountain' else 'castle' end
      ) as payload
    from public.classrooms c
    left join lateral (
      select count(*)::integer as student_count
      from public.classroom_students cs
      join public.students s on s.id = cs.student_id and s.status = 'active'
      where cs.classroom_id = c.id and cs.is_active
    ) student_stat on true
    left join lateral (
      select count(*)::integer as subject_count
      from public.classroom_subjects cs
      join public.subjects s on s.id = cs.subject_id and s.is_active
      where cs.classroom_id = c.id
    ) subject_stat on true
    left join lateral (
      select
        count(*) filter (where r.status = 'missing')::integer as missing_count,
        count(*) filter (where r.status = 'revision')::integer as revision_count,
        count(*) filter (where r.status = 'pending_review')::integer as pending_count,
        coalesce(
          round(
            100.0 * count(*) filter (where r.status in ('submitted', 'passed'))
            / nullif(count(*) filter (where r.status not in ('absent', 'exempt')), 0)
          ),
          0
        )::integer as completion_rate,
        max(r.updated_at) as last_updated
      from public.assignments a
      join public.student_assignment_records r on r.assignment_id = a.id
      where a.classroom_id = c.id and a.is_active
    ) record_stat on true
    where c.academic_term_id = selected_term_id
      and c.is_active
      and (c.teacher_id = request_user_id or public.is_admin(request_user_id))
  ) classroom_row;

  select coalesce(jsonb_agg(task_row.payload order by task_row.due_sort, task_row.activity_sort desc), '[]'::jsonb)
    into tasks_payload
  from (
    select
      coalesce(a.due_date, date '9999-12-31') as due_sort,
      a.activity_date as activity_sort,
      jsonb_build_object(
        'id', a.id::text,
        'title', a.title,
        'classroom', 'ป.' || c.grade_level::text || '/' || c.room,
        'subject', s.name,
        'status', case
          when status_stat.missing_count > 0 then 'missing'
          when status_stat.revision_count > 0 then 'revision'
          else 'pending_review'
        end,
        'student_count', case
          when status_stat.missing_count > 0 then status_stat.missing_count
          when status_stat.revision_count > 0 then status_stat.revision_count
          else status_stat.pending_count
        end,
        'due_label', case
          when a.due_date is null then 'ไม่กำหนดวันส่ง'
          when a.due_date = current_date then 'ครบกำหนดวันนี้'
          when a.due_date < current_date then 'เกินกำหนด ' || (current_date - a.due_date)::text || ' วัน'
          else 'ครบกำหนด ' || to_char(a.due_date, 'DD/MM/YYYY')
        end
      ) as payload
    from public.assignments a
    join public.classrooms c on c.id = a.classroom_id
    join public.subjects s on s.id = a.subject_id
    join lateral (
      select
        count(*) filter (where r.status = 'missing')::integer as missing_count,
        count(*) filter (where r.status = 'revision')::integer as revision_count,
        count(*) filter (where r.status = 'pending_review')::integer as pending_count
      from public.student_assignment_records r
      where r.assignment_id = a.id
    ) status_stat on true
    where c.academic_term_id = selected_term_id
      and c.is_active
      and a.is_active
      and (c.teacher_id = request_user_id or public.is_admin(request_user_id))
      and (status_stat.missing_count + status_stat.revision_count + status_stat.pending_count) > 0
    order by due_sort, activity_sort desc
    limit 6
  ) task_row;

  select jsonb_build_object(
    'assignments_this_term', (
      select count(*)::integer
      from public.assignments a
      join public.classrooms c on c.id = a.classroom_id
      where c.academic_term_id = selected_term_id
        and c.is_active and a.is_active
        and (c.teacher_id = request_user_id or public.is_admin(request_user_id))
    ),
    'submission_rate', (
      select coalesce(
        round(
          100.0 * count(*) filter (where r.status in ('submitted', 'passed'))
          / nullif(count(*) filter (where r.status not in ('absent', 'exempt')), 0)
        ),
        0
      )::integer
      from public.student_assignment_records r
      join public.assignments a on a.id = r.assignment_id and a.is_active
      join public.classrooms c on c.id = a.classroom_id and c.is_active
      where c.academic_term_id = selected_term_id
        and (c.teacher_id = request_user_id or public.is_admin(request_user_id))
    ),
    'students_need_attention', (
      select count(distinct r.student_id)::integer
      from public.student_assignment_records r
      join public.assignments a on a.id = r.assignment_id and a.is_active
      join public.classrooms c on c.id = a.classroom_id and c.is_active
      where c.academic_term_id = selected_term_id
        and r.status in ('missing', 'revision')
        and (c.teacher_id = request_user_id or public.is_admin(request_user_id))
    ),
    'stars_today', (
      select coalesce(sum(greatest(rt.amount, 0)), 0)::integer
      from public.reward_transactions rt
      join public.classrooms c on c.id = rt.classroom_id and c.is_active
      where c.academic_term_id = selected_term_id
        and rt.created_at::date = current_date
        and (c.teacher_id = request_user_id or public.is_admin(request_user_id))
    )
  ) into stats_payload;

  return jsonb_build_object(
    'teacher_name', teacher_name,
    'selected_term_id', selected_term_id::text,
    'academic_terms', terms_payload,
    'classrooms', classrooms_payload,
    'today_tasks', tasks_payload,
    'stats', stats_payload
  );
end;
$$;

revoke all on function public.get_dashboard_overview(uuid) from public, anon;
grant execute on function public.get_dashboard_overview(uuid) to authenticated;

comment on function public.get_dashboard_overview(uuid) is
  'Returns all Phase 2 Dashboard data in one authenticated request; RLS and teacher scope are enforced.';

commit;
