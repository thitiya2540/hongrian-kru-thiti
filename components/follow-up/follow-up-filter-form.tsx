import { Search } from "lucide-react";
import type { ClassroomSummary } from "@/types/management";
import type { FollowUpFilters } from "@/types/follow-up";

const priorityOptions = [
  ["all", "ทุกระดับความเร่งด่วน"],
  ["critical", "เร่งด่วนมาก"],
  ["warning", "ควรติดตาม"],
  ["normal", "ปกติ"],
];

export function FollowUpFilterForm({ filters, classrooms }: { filters: FollowUpFilters; classrooms: ClassroomSummary[] }) {
  return (
    <form className="grid gap-3 rounded-[28px] border border-white/70 bg-white/90 p-4 shadow-[0_16px_40px_rgba(46,58,112,0.08)] backdrop-blur md:grid-cols-[1fr_1fr_1.2fr_auto]">
      <label className="grid gap-1 text-sm font-bold text-[#3c4668]">
        ห้องเรียน
        <select name="classroom" defaultValue={filters.classroomId ?? "all"} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-[#27325e]">
          <option value="all">ทุกห้องเรียน</option>
          {classrooms.map((classroom) => <option key={classroom.id} value={classroom.id}>ป.{classroom.gradeLevel}/{classroom.room}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-bold text-[#3c4668]">
        ความเร่งด่วน
        <select name="priority" defaultValue={filters.priority ?? "all"} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-[#27325e]">
          {priorityOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-bold text-[#3c4668]">
        ค้นหา
        <input name="q" defaultValue={filters.q ?? ""} placeholder="ค้นหางาน วิชา ห้อง หรือนักเรียน..." className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-[#27325e] outline-none focus:border-violet-300" />
      </label>
      <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#6956d9] px-5 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-violet-200 transition hover:bg-[#5947c3] md:self-end">
        <Search className="size-4" />
        ดูรายการ
      </button>
    </form>
  );
}
