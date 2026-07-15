"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { ClassroomSummary, SubjectSummary } from "@/types/management";
import type { ReportFilters } from "@/types/reports";

type ReportFilterFormProps = {
  classrooms: ClassroomSummary[];
  subjects: SubjectSummary[];
  filters: ReportFilters;
};

export function ReportFilterForm({ classrooms, subjects, filters }: ReportFilterFormProps) {
  const [classroomId, setClassroomId] = useState(filters.classroomId ?? "");
  const [subjectId, setSubjectId] = useState(filters.subjectId ?? "");
  const availableSubjects = useMemo(
    () => subjects.filter((subject) => !classroomId || subject.classroomIds.includes(classroomId)),
    [classroomId, subjects],
  );

  return (
    <form className="grid gap-3 rounded-[28px] border border-white/70 bg-white/90 p-4 shadow-[0_16px_40px_rgba(46,58,112,0.08)] backdrop-blur md:grid-cols-[1fr_1fr_auto] print:hidden">
      <label className="grid gap-1 text-sm font-bold text-[#3c4668]">
        1. เลือกห้องเรียน
        <select name="classroom" value={classroomId} onChange={(event) => { setClassroomId(event.target.value); setSubjectId(""); }} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-[#27325e]">
          <option value="">เลือกห้องเรียนก่อน</option>
          {classrooms.filter((classroom) => classroom.isActive).map((classroom) => (
            <option key={classroom.id} value={classroom.id}>ป.{classroom.gradeLevel}/{classroom.room} · {classroom.name}</option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-bold text-[#3c4668]">
        2. เลือกรายวิชา
        <select name="subject" value={subjectId} onChange={(event) => setSubjectId(event.target.value)} disabled={!classroomId} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-[#27325e] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400">
          <option value="">เลือกรายวิชา</option>
          {availableSubjects.filter((subject) => subject.isActive).map((subject) => (
            <option key={subject.id} value={subject.id}>{subject.name}</option>
          ))}
        </select>
      </label>
      <button type="submit" disabled={!classroomId || !subjectId} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#6956d9] px-5 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-violet-200 transition hover:bg-[#5947c3] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none md:self-end">
        <Search className="size-4" />
        เปิดตารางรายงาน
      </button>
    </form>
  );
}
