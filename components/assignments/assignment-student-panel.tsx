import Link from "next/link";
import { X } from "lucide-react";
import { AssignmentStatusChip } from "@/components/assignments/assignment-status-chip";
import { StudentAvatar } from "@/components/students/student-avatar";
import { statusLabels } from "@/lib/assignments/constants";
import type { AssignmentStatus } from "@/types/database";
import type { AssignmentStudentStatus, AssignmentSummary } from "@/types/assignments";

export function AssignmentStudentPanel({
  assignment,
  status,
  students,
}: {
  assignment: AssignmentSummary;
  status?: AssignmentStatus;
  students: AssignmentStudentStatus[];
}) {
  return (
    <aside className="rounded-[28px] border border-violet-100 bg-white p-5 shadow-[0_18px_50px_rgba(44,55,105,0.16)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-violet-500">รายชื่อนักเรียน</p>
          <h2 className="mt-1 text-lg font-black text-[#293562]">{assignment.title}</h2>
          <p className="mt-1 text-sm font-semibold text-slate-400">{status ? statusLabels[status] : "ทุกสถานะ"} · {students.length} คน</p>
        </div>
        <Link href="/assignments" aria-label="ปิดรายชื่อ" className="grid size-9 place-items-center rounded-2xl bg-slate-100 text-slate-500"><X className="size-4" /></Link>
      </div>
      <div className="mt-4 grid gap-2">
        {students.map((student) => (
          <div key={student.id} className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl bg-slate-50 p-3">
            <StudentAvatar student={student} size="sm" showNumber />
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold text-[#293562]">{student.studentName}</p>
              <p className="truncate text-xs font-semibold text-slate-400">{student.classroomLabel} · {student.nickname ?? "ไม่มีชื่อเล่น"} · คะแนน {student.score ?? "-"}</p>
            </div>
            <AssignmentStatusChip status={student.status} />
          </div>
        ))}
      </div>
    </aside>
  );
}
