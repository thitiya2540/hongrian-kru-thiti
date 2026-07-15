"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, CalendarClock, CheckCircle2, ClipboardCheck, History, Search } from "lucide-react";
import { AssignmentStatusChip } from "@/components/assignments/assignment-status-chip";
import type { AssignmentSummary } from "@/types/assignments";
import type { ClassroomSummary } from "@/types/management";

type WorkFilter = "priority" | "all" | "missing" | "pending_review" | "revision" | "complete";

const filters: { key: WorkFilter; label: string }[] = [
  { key: "priority", label: "ควรทำก่อน" },
  { key: "all", label: "งานทั้งหมด" },
  { key: "pending_review", label: "รอตรวจ" },
  { key: "missing", label: "ยังไม่ส่ง" },
  { key: "revision", label: "ต้องแก้" },
  { key: "complete", label: "ครบแล้ว" },
];

function toLocalDate(value: string | null) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00+07:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateLabel(value: string | null) {
  const date = toLocalDate(value);
  if (!date) return "ไม่กำหนดส่ง";
  return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "2-digit", timeZone: "Asia/Bangkok" }).format(date);
}

function workCount(assignment: AssignmentSummary, expectedStudents: number) {
  const uninitialized = Math.max(0, expectedStudents - assignment.totalRecords);
  return assignment.counts.missing + assignment.counts.pending_review + assignment.counts.revision + uninitialized;
}

function completion(assignment: AssignmentSummary, expectedStudents: number) {
  const total = Math.max(assignment.totalRecords, expectedStudents);
  if (total === 0) return 0;
  const done = assignment.counts.submitted + assignment.counts.passed + assignment.counts.exempt;
  return Math.min(100, Math.round((done / total) * 100));
}

function priorityScore(assignment: AssignmentSummary) {
  const due = toLocalDate(assignment.dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueDays = due ? Math.floor((today.getTime() - due.getTime()) / 86_400_000) : -999;
  return assignment.counts.pending_review * 5
    + assignment.counts.revision * 4
    + assignment.counts.missing * 3
    + (overdueDays >= 0 ? 30 + Math.min(overdueDays, 14) : 0);
}

export function RecentClassroomShortcut({ classrooms }: { classrooms: ClassroomSummary[] }) {
  const [recent, setRecent] = useState<ClassroomSummary | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const classroomId = window.localStorage.getItem("last-quick-score-classroom");
      setRecent(classrooms.find((item) => item.id === classroomId && item.isActive) ?? null);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [classrooms]);

  if (!recent) return null;
  return (
    <Link href={`/quick-score?classroom=${recent.id}`} className="mt-4 inline-flex h-11 items-center gap-2 rounded-2xl bg-white px-4 text-sm font-extrabold text-violet-700 shadow-sm ring-1 ring-violet-200 transition hover:-translate-y-0.5 hover:shadow-md">
      <History className="size-4" /> เปิดห้องล่าสุด ป.{recent.gradeLevel}/{recent.room}
    </Link>
  );
}

export function QuickScoreWorkspace({ assignments, classroomId, studentCount }: { assignments: AssignmentSummary[]; classroomId: string; studentCount: number }) {
  const [filter, setFilter] = useState<WorkFilter>("priority");
  const [query, setQuery] = useState("");

  useEffect(() => {
    window.localStorage.setItem("last-quick-score-classroom", classroomId);
  }, [classroomId]);

  const counts = useMemo(() => ({
    priority: assignments.filter((item) => workCount(item, studentCount) > 0).length,
    all: assignments.length,
    missing: assignments.filter((item) => item.counts.missing > 0).length,
    pending_review: assignments.filter((item) => item.counts.pending_review > 0).length,
    revision: assignments.filter((item) => item.counts.revision > 0).length,
    complete: assignments.filter((item) => workCount(item, studentCount) === 0).length,
  }), [assignments, studentCount]);

  const visibleAssignments = useMemo(() => {
    const q = query.trim().toLowerCase();
    return assignments
      .filter((assignment) => {
        const matchesQuery = !q || `${assignment.title} ${assignment.subjectName} ${assignment.category}`.toLowerCase().includes(q);
        if (!matchesQuery) return false;
        if (filter === "priority") return workCount(assignment, studentCount) > 0;
        if (filter === "complete") return workCount(assignment, studentCount) === 0;
        if (filter === "all") return true;
        return assignment.counts[filter] > 0;
      })
      .sort((a, b) => filter === "priority"
        ? priorityScore(b) - priorityScore(a)
        : b.activityDate.localeCompare(a.activityDate));
  }, [assignments, filter, query, studentCount]);

  return (
    <div className="mt-4">
      <div className="rounded-[24px] border border-slate-100 bg-slate-50/80 p-3 sm:p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(240px,1fr)_auto] lg:items-center">
          <label className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ค้นหาชื่องาน วิชา หรือหมวดคะแนน"
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
            />
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1 lg:justify-end">
            {filters.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-2xl px-3 text-xs font-extrabold transition ${filter === item.key ? "bg-[#293562] text-white shadow-md" : "bg-white text-slate-500 ring-1 ring-slate-200 hover:text-violet-700"}`}
              >
                {item.label}
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${filter === item.key ? "bg-white/15" : "bg-slate-100 text-slate-500"}`}>{counts[item.key]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {visibleAssignments.length === 0 ? (
        <div className="mt-4 rounded-[28px] border border-dashed border-emerald-200 bg-emerald-50/60 p-8 text-center">
          <CheckCircle2 className="mx-auto size-10 text-emerald-500" />
          <h3 className="mt-3 text-lg font-black text-[#293562]">ไม่พบงานในหมวดนี้</h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">ลองเลือกตัวกรองอื่น หรือล้างคำค้นหาเพื่อดูงานทั้งหมดของห้อง</p>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {visibleAssignments.map((assignment, index) => {
            const percent = completion(assignment, studentCount);
            const pending = workCount(assignment, studentCount);
            const due = toLocalDate(assignment.dueDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const overdue = Boolean(due && due.getTime() < today.getTime() && pending > 0);
            return (
              <article key={assignment.id} className="group relative overflow-hidden rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_16px_42px_rgba(44,55,105,0.1)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_52px_rgba(44,55,105,0.16)]">
                {filter === "priority" && index === 0 && pending > 0 ? <div className="absolute right-0 top-0 rounded-bl-2xl bg-rose-500 px-3 py-1.5 text-[10px] font-black text-white">ควรทำก่อน</div> : null}
                <div className="flex items-start justify-between gap-3 pr-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-extrabold text-sky-700">{assignment.subjectName}</span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-extrabold text-slate-600">{assignment.category}</span>
                    </div>
                    <h3 className="mt-3 truncate text-xl font-black text-[#293562]">{assignment.title}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-slate-400">
                      <span>{assignment.assignmentTypeLabel} · เต็ม {assignment.maxScore} คะแนน</span>
                      <span className={`inline-flex items-center gap-1 ${overdue ? "text-rose-600" : ""}`}><CalendarClock className="size-3.5" /> {overdue ? "เกินกำหนด " : "กำหนด "}{dateLabel(assignment.dueDate)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <AssignmentStatusChip status="submitted" count={assignment.counts.submitted} />
                  <AssignmentStatusChip status="missing" count={assignment.counts.missing} />
                  <AssignmentStatusChip status="revision" count={assignment.counts.revision} />
                  <AssignmentStatusChip status="pending_review" count={assignment.counts.pending_review} />
                </div>

                <div className="mt-4 rounded-2xl bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-3 text-xs font-extrabold">
                    <span className="text-slate-500">ความคืบหน้า</span>
                    <span className={percent === 100 ? "text-emerald-600" : "text-[#293562]"}>{percent}% · เหลือ {pending} รายการ</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                    <div className={`h-full rounded-full ${percent === 100 ? "bg-emerald-500" : "bg-violet-500"}`} style={{ width: `${percent}%` }} />
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className={`inline-flex items-center gap-1.5 text-xs font-extrabold ${pending > 0 ? "text-amber-700" : "text-emerald-700"}`}>
                    {pending > 0 ? <AlertTriangle className="size-4" /> : <ClipboardCheck className="size-4" />}
                    {pending > 0 ? `ต้องจัดการอีก ${pending} รายการ` : "ตรวจครบแล้ว พร้อมออกรายงาน"}
                  </p>
                  <Link href={`/assignments/${assignment.id}/scores`} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#6956d9] px-5 text-sm font-extrabold text-white transition group-hover:bg-[#5947c3]">
                    {pending > 0 ? "เปิดบันทึกคะแนน" : "ตรวจทานคะแนน"} <ArrowRight className="size-4" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
