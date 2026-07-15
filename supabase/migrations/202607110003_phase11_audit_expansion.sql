-- Class Quest · Phase 11
-- Extend audit coverage to rewards, badges, student badges, and scoring policy settings.

begin;

drop trigger if exists reward_transactions_audit on public.reward_transactions;
create trigger reward_transactions_audit
after insert or update or delete on public.reward_transactions
for each row execute function private.audit_main_entity_change();

drop trigger if exists badges_audit on public.badges;
create trigger badges_audit
after insert or update or delete on public.badges
for each row execute function private.audit_main_entity_change();

drop trigger if exists student_badges_audit on public.student_badges;
create trigger student_badges_audit
after insert or update or delete on public.student_badges
for each row execute function private.audit_main_entity_change();

drop trigger if exists app_settings_audit on public.app_settings;
create trigger app_settings_audit
after insert or update or delete on public.app_settings
for each row execute function private.audit_main_entity_change();

comment on table public.activity_logs is
  'Audit timeline for important Class Quest changes. Phase 11 UI reads this table; PIN hashes are stripped by trigger logic.';

commit;
