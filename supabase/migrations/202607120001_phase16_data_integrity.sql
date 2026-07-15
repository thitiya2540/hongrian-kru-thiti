-- Class Quest · Phase 16
-- Data integrity fixes: preserve first submission timestamp on edits,
-- and unblock onboarding for a school with no admin yet.

begin;

-- 1) Preserve submitted_at / revised_at across edits that don't change status.
--    Previously every score/note edit reset submitted_at to now(), destroying
--    the real "when the student submitted" timestamp used for backdating.
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

  if tg_op = 'UPDATE' and old.status = new.status then
    if old.submitted_at is not null then
      new.submitted_at := old.submitted_at;
    end if;
    if old.revised_at is not null then
      new.revised_at := old.revised_at;
    end if;
  end if;

  return new;
end;
$$;

-- 2) Onboarding bootstrap: the very first profile in a fresh project becomes
--    admin automatically, so a solo teacher can create the first academic
--    term (previously only admins could, and every new signup defaulted to
--    'teacher', leaving nobody able to insert the first term).
create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  assigned_role public.profile_role;
begin
  assigned_role := case
    when exists (select 1 from public.profiles where role = 'admin')
      then 'teacher'
    else 'admin'
  end;

  insert into public.profiles (id, display_name, avatar_url, role)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(new.email, '@', 1), 'คุณครู'),
    new.raw_user_meta_data ->> 'avatar_url',
    assigned_role
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 3) Repair existing installs: if a project already has profiles but no
--    admin (e.g. the account was created before this migration), promote
--    the earliest profile so the school isn't permanently stuck.
update public.profiles p
set role = 'admin'
where p.id = (select id from public.profiles order by created_at asc limit 1)
  and not exists (select 1 from public.profiles where role = 'admin');

commit;
