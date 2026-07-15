import { Filter, Search } from "lucide-react";
import { assignmentTypeLabels } from "@/lib/assignments/constants";
import type { AssignmentType } from "@/types/assignments";
import type { ClassroomSummary, SubjectSummary } from "@/types/management";

const typeEntries = Object.entries(assignmentTypeLabels) as [AssignmentType, string][];

export function AssignmentFilterBar({
  classrooms,
  subjects,
  defaults,
}: {
  classrooms: ClassroomSummary[];
  subjects: SubjectSummary[];
  defaults: { classroom?: string; subject?: string; type?: string; status?: string; q?: string };
}) {
  return (
    <form className="rounded-[28px] bg-white p-4 shadow-[0_12px_34px_rgba(44,55,105,0.1)]">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(120px,1fr))_auto]">
        <label className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input name="q" defaultValue={defaults.q} placeholder="ค้นหาชื่องาน วิชา หรือหมวดคะแนน" className="h-11 w-full rounded-2xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-violet-300" />
        </label>
        <select name="classroom" defaultValue={defaults.classroom ?? ""} className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 outline-none focus:border-violet-300">
          <option value="">ทุกห้อง</option>
          {classrooms.map((classroom) => <option key={classroom.id} value={classroom.id}>ป.{classroom.gradeLevel}/{classroom.room}</option>)}
        </select>
        <select name="subject" defaultValue={defaults.subject ?? ""} className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 outline-none focus:border-violet-300">
          <option value="">ทุกวิชา</option>
          {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
        </select>
        <select name="type" defaultValue={defaults.type ?? ""} className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 outline-none focus:border-violet-300">
          <option value="">ทุกประเภท</option>
          {typeEntries.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select name="status" defaultValue={defaults.status ?? ""} className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 outline-none focus:border-violet-300">
          <option value="">ทุกสถานะ</option>
          <option value="missing">ยังไม่ส่ง</option>
          <option value="revision">แก้งาน</option>
          <option value="pending_review">รอตรวจ</option>
          <option value="submitted">ส่งแล้ว</option>
          <option value="absent">ลา</option>
        </select>
        <button type="submit" className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-violet-100 px-4 text-sm font-extrabold text-violet-700"><Filter className="size-4" /> กรอง</button>
      </div>
    </form>
  );
}
