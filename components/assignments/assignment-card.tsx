/* eslint-disable @next/next/no-img-element */

import { CalendarDays, ClipboardList, Download, Eye, ImageOff, Lock } from "lucide-react";
import { AssignmentActions } from "@/components/assignments/assignment-actions";
import { AssignmentStatusChip } from "@/components/assignments/assignment-status-chip";
import type { AssignmentSummary } from "@/types/assignments";

function formatDate(value: string | null) {
  if (!value) return "ไม่กำหนด";
  const date = new Date(`${value}T00:00:00+07:00`);
  if (Number.isNaN(date.getTime())) return "ไม่กำหนด";
  return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Bangkok" }).format(date);
}

export function AssignmentCard({ assignment, disabled = false }: { assignment: AssignmentSummary; disabled?: boolean }) {
  const baseHref = `/assignments?assignment=${assignment.id}`;

  return (
    <article className={`rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_18px_50px_rgba(44,55,105,0.12)] ${assignment.isActive ? "" : "opacity-60"}`}>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_230px]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-extrabold text-violet-700">{assignment.classroomLabel}</span>
                <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-extrabold text-sky-700">{assignment.subjectName}</span>
                {assignment.isLocked ? <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-extrabold text-amber-700"><Lock className="size-3" /> ล็อกแล้ว</span> : null}
              </div>
              <h2 className="mt-3 text-xl font-black text-[#293562]">{assignment.title}</h2>
              <p className="mt-1 text-sm font-semibold text-slate-400">{assignment.assignmentTypeLabel} · {assignment.category} · {assignment.maxScore} คะแนน</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-right">
              <p className="text-xs font-bold text-slate-400">บันทึกแล้ว</p>
              <p className="text-xl font-black text-[#293562]">{assignment.totalRecords}</p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-2 rounded-2xl bg-slate-50 p-3 text-sm font-bold text-slate-500"><CalendarDays className="size-4 text-violet-500" /> วันที่ทำงาน {formatDate(assignment.activityDate)}</div>
            <div className="flex items-center gap-2 rounded-2xl bg-slate-50 p-3 text-sm font-bold text-slate-500"><ClipboardList className="size-4 text-emerald-500" /> กำหนดส่ง {formatDate(assignment.dueDate)}</div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <AssignmentStatusChip status="submitted" count={assignment.counts.submitted} href={`${baseHref}&status=submitted`} />
            <AssignmentStatusChip status="missing" count={assignment.counts.missing} href={`${baseHref}&status=missing`} />
            <AssignmentStatusChip status="revision" count={assignment.counts.revision} href={`${baseHref}&status=revision`} />
            <AssignmentStatusChip status="pending_review" count={assignment.counts.pending_review} href={`${baseHref}&status=pending_review`} />
            <AssignmentStatusChip status="absent" count={assignment.counts.absent} href={`${baseHref}&status=absent`} />
          </div>

          <div className="mt-5 border-t border-slate-100 pt-4">
            <AssignmentActions assignment={assignment} disabled={disabled} />
          </div>
        </div>

        <aside className="grid content-start gap-2.5">
          <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 shadow-inner">
            {assignment.previewImageUrl ? (
              <img src={assignment.previewImageUrl} alt={`ภาพตัวอย่าง ${assignment.title}`} className="aspect-[4/3] h-full w-full object-cover" />
            ) : (
              <div className="grid aspect-[4/3] place-items-center p-5 text-center text-xs font-bold leading-5 text-slate-400">
                <span><ImageOff className="mx-auto mb-2 size-8 text-slate-300" />ยังไม่มีภาพตัวอย่าง</span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {assignment.previewImageUrl ? (
              <a href={assignment.previewImageUrl} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-violet-50 px-3 text-xs font-extrabold text-violet-700 transition hover:bg-violet-100"><Eye className="size-3.5" /> พรีวิว</a>
            ) : (
              <span className="inline-flex h-10 cursor-not-allowed items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-3 text-xs font-extrabold text-slate-400"><Eye className="size-3.5" /> พรีวิว</span>
            )}
            {assignment.resourceUrl ? (
              <a href={assignment.resourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-sky-50 px-3 text-xs font-extrabold text-sky-700 transition hover:bg-sky-100"><Download className="size-3.5" /> ดาวน์โหลด</a>
            ) : (
              <span className="inline-flex h-10 cursor-not-allowed items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-3 text-xs font-extrabold text-slate-400"><Download className="size-3.5" /> ดาวน์โหลด</span>
            )}
          </div>
          <p className="text-center text-[10px] font-semibold leading-4 text-slate-400">พรีวิวภาพเต็ม หรือเปิดลิงก์ใบงาน</p>
        </aside>
      </div>
    </article>
  );
}
