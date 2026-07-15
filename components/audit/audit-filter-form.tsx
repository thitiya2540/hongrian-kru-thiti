import { Search } from "lucide-react";
import type { AuditFilters } from "@/types/audit";

const entityOptions = [
  ["all", "ทุกประเภทข้อมูล"],
  ["student_assignment_record", "รายการคะแนน"],
  ["students", "นักเรียน"],
  ["assignments", "ภารกิจ / งาน"],
  ["classrooms", "ห้องเรียน"],
  ["subjects", "รายวิชา"],
  ["app_settings", "ตั้งค่าระบบ"],
];

const actionOptions = [
  ["all", "ทุกการกระทำ"],
  ["score_record_updated", "แก้ไขคะแนน/สถานะ"],
  ["score_record_created", "สร้างรายการคะแนน"],
  ["insert", "เพิ่มข้อมูล"],
  ["update", "แก้ไขข้อมูล"],
  ["delete", "ลบข้อมูล"],
];

export function AuditFilterForm({ filters }: { filters: AuditFilters }) {
  return (
    <form className="grid gap-3 rounded-[28px] border border-white/70 bg-white/90 p-4 shadow-[0_16px_40px_rgba(46,58,112,0.08)] backdrop-blur md:grid-cols-[1fr_1fr_1.2fr_auto]">
      <label className="grid gap-1 text-sm font-bold text-[#3c4668]">
        ประเภทข้อมูล
        <select name="entity" defaultValue={filters.entityType ?? "all"} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-[#27325e]">
          {entityOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-bold text-[#3c4668]">
        การกระทำ
        <select name="action" defaultValue={filters.action ?? "all"} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-[#27325e]">
          {actionOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-bold text-[#3c4668]">
        ค้นหา
        <input name="q" defaultValue={filters.q ?? ""} placeholder="ค้นหาผู้ทำรายการ, field, id..." className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-[#27325e] outline-none focus:border-violet-300" />
      </label>
      <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#6956d9] px-5 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-violet-200 transition hover:bg-[#5947c3] md:self-end">
        <Search className="size-4" />
        ดูประวัติ
      </button>
    </form>
  );
}
