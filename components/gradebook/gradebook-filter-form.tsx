import { Search } from "lucide-react";
import type { ClassroomSummary, SubjectSummary } from "@/types/management";
import type { GradebookFilters } from "@/types/gradebook";

type GradebookFilterFormProps = {
  classrooms: ClassroomSummary[];
  subjects: SubjectSummary[];
  filters: GradebookFilters;
};

export function GradebookFilterForm({ classrooms, subjects, filters }: GradebookFilterFormProps) {
  return (
    <form className="grid gap-3 rounded-[28px] border border-white/70 bg-white/90 p-4 shadow-[0_16px_40px_rgba(46,58,112,0.08)] backdrop-blur md:grid-cols-[1fr_1fr_auto] print:hidden">
      <label className="grid gap-1 text-sm font-bold text-[#3c4668]">
        ห้องเรียน
        <select name="classroom" defaultValue={filters.classroomId ?? "all"} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-[#27325e]">
          <option value="all">ทุกห้องเรียน</option>
          {classrooms.map((classroom) => (
            <option key={classroom.id} value={classroom.id}>ป.{classroom.gradeLevel}/{classroom.room} · {classroom.name}</option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-bold text-[#3c4668]">
        รายวิชา
        <select name="subject" defaultValue={filters.subjectId ?? "all"} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-[#27325e]">
          <option value="all">ทุกรายวิชา</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>{subject.name}</option>
          ))}
        </select>
      </label>
      <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#6956d9] px-5 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-violet-200 transition hover:bg-[#5947c3] md:self-end">
        <Search className="size-4" />
        เปิดสมุดคะแนน
      </button>
    </form>
  );
}
