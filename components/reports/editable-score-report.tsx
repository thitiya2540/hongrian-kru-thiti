"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Check, CheckCircle2, CircleAlert, Eye, LoaderCircle, LockKeyhole, Maximize2, PencilLine, Save, Search, X } from "lucide-react";
import { saveScoreRecordAction } from "@/actions/assignments";
import { StudentAvatar } from "@/components/students/student-avatar";
import { calculateScoreSummary, isScoreCellCounted } from "@/lib/scoring/calculate-score-summary";
import type { AssignmentStatus } from "@/types/database";
import type { GradebookCell, GradebookStudentRow, GradebookViewModel } from "@/types/gradebook";

type ReportMode = "view" | "edit";
type RowFilter = "all" | "missing" | "revision" | "risk";

const statusOptions: Array<{ value: AssignmentStatus; label: string }> = [
  { value: "submitted", label: "ส่งแล้ว" },
  { value: "passed", label: "ผ่าน" },
  { value: "missing", label: "ยังไม่ส่ง" },
  { value: "revision", label: "ต้องแก้" },
  { value: "pending_review", label: "รอตรวจ" },
  { value: "absent", label: "ลา" },
  { value: "exempt", label: "ยกเว้น" },
];

const statusLabel = Object.fromEntries(statusOptions.map((item) => [item.value, item.label])) as Record<AssignmentStatus, string>;

const statusTone: Record<AssignmentStatus, { dot: string; text: string; border: string; soft: string }> = {
  submitted: { dot: "bg-emerald-500", text: "text-emerald-700", border: "border-emerald-300", soft: "bg-emerald-50" },
  passed: { dot: "bg-emerald-500", text: "text-emerald-700", border: "border-emerald-300", soft: "bg-emerald-50" },
  missing: { dot: "bg-rose-500", text: "text-rose-700", border: "border-rose-300", soft: "bg-rose-50" },
  revision: { dot: "bg-amber-500", text: "text-amber-700", border: "border-amber-300", soft: "bg-amber-50" },
  pending_review: { dot: "bg-violet-500", text: "text-violet-700", border: "border-violet-300", soft: "bg-violet-50" },
  absent: { dot: "bg-sky-500", text: "text-sky-700", border: "border-sky-300", soft: "bg-sky-50" },
  exempt: { dot: "bg-slate-400", text: "text-slate-500", border: "border-slate-300", soft: "bg-slate-50" },
};

const rowFilterLabels: Record<RowFilter, string> = {
  all: "นักเรียนทั้งหมด",
  missing: "มีงานยังไม่ส่ง",
  revision: "มีงานต้องแก้",
  risk: "เร่งติดตาม",
};

function refreshRow(row: GradebookStudentRow, gradebook: GradebookViewModel): GradebookStudentRow {
  const cells = row.cells.map((cell) => ({ ...cell, countedInTotal: isScoreCellCounted(cell.status, gradebook.scoringPolicy) }));
  const summary = calculateScoreSummary(cells.map((cell, index) => ({
    score: cell.score,
    maxScore: cell.maxScore,
    status: cell.status,
    categoryKey: gradebook.columns[index].categoryKey,
    categoryWeight: gradebook.columns[index].categoryWeight,
  })), gradebook.scoringPolicy);
  const riskLevel = summary.missingCount >= 2 || summary.percent < 50 ? "risk" : summary.missingCount > 0 || summary.revisionCount > 0 || summary.percent < 65 ? "watch" : "good";

  return {
    ...row,
    cells,
    earnedScore: summary.earnedScore,
    possibleScore: summary.possibleScore,
    percent: summary.percent,
    gradeLabel: summary.gradeLabel,
    riskLevel,
    submittedCount: summary.submittedCount,
    missingCount: summary.missingCount,
    revisionCount: summary.revisionCount,
    pendingReviewCount: summary.pendingReviewCount,
    absentOrExemptCount: summary.absentOrExemptCount,
  };
}

function displayScore(value: number | null) {
  return value === null ? "" : String(value);
}

function compactDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short" }).format(date);
}

function scoreText(cell: GradebookCell) {
  if (cell.score === null) return "–";
  return Number.isInteger(cell.score) ? String(cell.score) : cell.score.toFixed(1);
}

export function EditableScoreReport({ gradebook }: { gradebook: GradebookViewModel }) {
  const containerRef = useRef<HTMLElement>(null);
  const [rows, setRows] = useState(gradebook.rows);
  const [mode, setMode] = useState<ReportMode>("view");
  const [query, setQuery] = useState("");
  const [rowFilter, setRowFilter] = useState<RowFilter>("all");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [cellState, setCellState] = useState<Record<string, "saved" | "error">>({});
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const totalFullScore = gradebook.columns.reduce((sum, column) => sum + column.maxScore, 0);
  const total = useMemo(() => ({
    averagePercent: rows.length ? Math.round(rows.reduce((sum, row) => sum + row.percent, 0) / rows.length) : 0,
    missing: rows.reduce((sum, row) => sum + row.missingCount, 0),
    risk: rows.filter((row) => row.riskLevel === "risk").length,
  }), [rows]);
  const visibleRows = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("th");
    return rows.filter((row) => {
      const matchesQuery = !normalizedQuery || `${row.studentName} ${row.nickname ?? ""} ${row.studentCode}`.toLocaleLowerCase("th").includes(normalizedQuery);
      const matchesFilter = rowFilter === "all"
        || rowFilter === "missing" && row.missingCount > 0
        || rowFilter === "revision" && row.revisionCount > 0
        || rowFilter === "risk" && row.riskLevel === "risk";
      return matchesQuery && matchesFilter;
    });
  }, [query, rowFilter, rows]);

  function updateCell(studentId: string, assignmentId: string, change: Partial<GradebookCell>) {
    setRows((current) => current.map((row) => {
      if (row.studentId !== studentId) return row;
      const cells = row.cells.map((cell) => cell.assignmentId === assignmentId ? { ...cell, ...change } : cell);
      return refreshRow({ ...row, cells }, gradebook);
    }));
  }

  function saveCell(studentId: string, assignmentId: string, score: number | null, status: AssignmentStatus) {
    const key = `${studentId}:${assignmentId}`;
    setPendingKey(key);
    setCellState((current) => { const next = { ...current }; delete next[key]; return next; });
    setMessage(null);
    startTransition(async () => {
      try {
        await saveScoreRecordAction({ assignmentId, studentId, score, status });
        updateCell(studentId, assignmentId, { score, status });
        setDrafts((current) => { const next = { ...current }; delete next[key]; return next; });
        setCellState((current) => ({ ...current, [key]: "saved" }));
        setMessage({ type: "success", text: "บันทึกแล้ว คะแนนรวมและรายงานส่วนอื่นอัปเดตตามกัน" });
      } catch (error) {
        setCellState((current) => ({ ...current, [key]: "error" }));
        setMessage({ type: "error", text: error instanceof Error ? error.message : "บันทึกคะแนนไม่สำเร็จ กรุณาลองอีกครั้ง" });
      } finally {
        setPendingKey(null);
      }
    });
  }

  async function toggleFullscreen() {
    if (!document.fullscreenElement) await containerRef.current?.requestFullscreen();
    else await document.exitFullscreen();
  }

  return (
    <section ref={containerRef} className="rounded-[28px] border border-white/70 bg-white p-4 shadow-[0_16px_40px_rgba(46,58,112,0.08)] fullscreen:overflow-auto fullscreen:rounded-none fullscreen:p-6">
      <div className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-[#253364]">ตารางสรุปคะแนนรายงาน</h2>
          <p className="mt-1 text-sm text-slate-500">
            <strong>คะแนนที่นับ</strong> ตัดงานสถานะลา/ยกเว้นออก · <strong>ร้อยละถ่วงน้ำหนัก</strong> คำนวณตามหมวดคะแนนที่ตั้งค่าไว้
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <div className="inline-flex rounded-xl bg-slate-100 p-1">
            <button type="button" onClick={() => setMode("view")} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-extrabold transition ${mode === "view" ? "bg-white text-violet-700 shadow-sm" : "text-slate-500"}`}><Eye className="size-3.5" />ดูรายงาน</button>
            <button type="button" onClick={() => setMode("edit")} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-extrabold transition ${mode === "edit" ? "bg-white text-violet-700 shadow-sm" : "text-slate-500"}`}><PencilLine className="size-3.5" />แก้คะแนน</button>
          </div>
          <button type="button" onClick={toggleFullscreen} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-extrabold text-slate-600 hover:border-violet-200 hover:text-violet-700"><Maximize2 className="size-3.5" />เต็มหน้าจอ</button>
        </div>
      </div>

      <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(220px,1fr)_auto] print:hidden">
        <label className="relative block">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาชื่อ ชื่อเล่น หรือรหัสนักเรียน" className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-sm text-[#253364] outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-50" />
          {query && <button type="button" aria-label="ล้างคำค้น" onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"><X className="size-4" /></button>}
        </label>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(Object.keys(rowFilterLabels) as RowFilter[]).map((filter) => (
            <button key={filter} type="button" onClick={() => setRowFilter(filter)} className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-extrabold transition ${rowFilter === filter ? "bg-[#6956d9] text-white shadow-md shadow-violet-100" : "bg-slate-50 text-slate-500 hover:bg-violet-50 hover:text-violet-700"}`}>{rowFilterLabels[filter]}</button>
          ))}
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold text-slate-400">แสดง {visibleRows.length} จาก {rows.length} คน · คะแนนเต็มทุกงาน {totalFullScore}</p>
        <div className="flex flex-wrap gap-2 text-[11px] font-bold">
          <span className="rounded-full bg-violet-50 px-3 py-1 text-violet-700">เฉลี่ย {total.averagePercent}%</span>
          <span className="rounded-full bg-rose-50 px-3 py-1 text-rose-700">ยังไม่ส่ง {total.missing}</span>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">เร่งติดตาม {total.risk} คน</span>
        </div>
      </div>

      {message && (
        <p className={`mb-3 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold ${message.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
          {message.type === "success" ? <CheckCircle2 className="size-4" /> : <CircleAlert className="size-4" />}
          {message.text}
        </p>
      )}

      <div className="soft-scrollbar overflow-x-auto pb-2">
        <table className="min-w-[1080px] w-full border-separate border-spacing-0 text-left text-sm">
          <thead className="sticky top-0 z-30">
            <tr className="text-[11px] text-slate-500">
              <th className="sticky left-0 z-40 w-14 rounded-l-2xl border-b border-slate-200 bg-slate-50 px-2 py-3 text-center">เลขที่</th>
              <th className="sticky left-14 z-40 min-w-60 border-b border-slate-200 bg-slate-50 px-3 py-3">นักเรียน</th>
              <th title="รวมเฉพาะงานที่นับคะแนน ไม่รวมสถานะลาและยกเว้น" className="min-w-28 border-b border-slate-200 bg-slate-50 px-3 py-3 text-center">คะแนนที่นับ</th>
              <th title="คำนวณตามน้ำหนักหมวดคะแนนที่กำหนดในการตั้งค่า" className="min-w-28 border-b border-slate-200 bg-slate-50 px-3 py-3 text-center">ร้อยละถ่วงน้ำหนัก</th>
              <th className="min-w-24 border-b border-slate-200 bg-slate-50 px-3 py-3 text-center">ผลประเมิน</th>
              {gradebook.columns.map((column, index) => (
                <th key={column.id} title={`${column.title} · ${column.category} · ${column.activityDate} · เต็ม ${column.maxScore} คะแนน`} className="min-w-32 border-b border-slate-200 bg-slate-50 px-2 py-2.5 text-center align-bottom">
                  <span className="block text-[9px] font-bold text-violet-500">งานที่ {index + 1}</span>
                  <Link href={`/assignments/${column.id}/scores`} className="mt-0.5 block font-extrabold text-[#253364] hover:text-violet-700">{column.shortTitle}</Link>
                  <span className="mt-0.5 block text-[9px] font-semibold text-slate-400">{compactDate(column.activityDate)} · เต็ม {column.maxScore}</span>
                  {column.isLocked && <span className="mt-1 inline-flex items-center gap-1 text-[9px] font-bold text-slate-400"><LockKeyhole className="size-3" />ล็อกแล้ว</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-[#35405f]">
            {visibleRows.map((row) => (
              <tr key={row.studentId} className="group odd:bg-white even:bg-slate-50/40 hover:bg-violet-50/70">
                <td className="sticky left-0 z-20 border-b border-slate-100 bg-inherit px-2 py-2.5 text-center font-extrabold text-slate-500">{row.numberInClass ?? "-"}</td>
                <td className="sticky left-14 z-20 border-b border-slate-100 bg-inherit px-3 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <StudentAvatar student={{ studentName: row.studentName, nickname: row.nickname, avatarUrl: row.avatarUrl, numberInClass: row.numberInClass }} size="sm" className="scale-90" />
                    <div className="min-w-0">
                      <Link href={`/students/${row.studentId}`} className="block truncate font-extrabold text-[#253364] hover:text-violet-700">{row.studentName}</Link>
                      <p className="truncate text-[11px] text-slate-400">{row.nickname ? `ชื่อเล่น ${row.nickname}` : row.studentCode}</p>
                    </div>
                  </div>
                </td>
                <td title={`คะแนนที่นับ ${row.earnedScore} จาก ${row.possibleScore} · คะแนนเต็มทุกงาน ${totalFullScore}`} className="border-b border-slate-100 px-3 py-2.5 text-center">
                  <p className="font-extrabold text-[#253364]">{row.earnedScore}/{row.possibleScore}</p>
                  {row.possibleScore !== totalFullScore && <p className="text-[9px] font-semibold text-slate-400">เต็มทั้งหมด {totalFullScore}</p>}
                </td>
                <td className="border-b border-slate-100 px-3 py-2.5 text-center">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-extrabold ${row.percent >= 70 ? "bg-emerald-50 text-emerald-700" : row.percent >= 50 ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"}`}>{row.percent}%</span>
                </td>
                <td className="border-b border-slate-100 px-3 py-2.5 text-center"><span className="text-xs font-bold text-slate-600">{row.gradeLabel}</span></td>
                {row.cells.map((cell, index) => {
                  const column = gradebook.columns[index];
                  const key = `${row.studentId}:${cell.assignmentId}`;
                  const tone = statusTone[cell.status];
                  const isLocked = column.isLocked || cell.status === "exempt" && cell.note === "งานนี้เป็นของห้องเรียนอื่น";
                  const draft = drafts[key] ?? displayScore(cell.score);
                  return (
                    <td key={key} className="border-b border-slate-100 px-2 py-2.5 text-center">
                      {mode === "view" ? (
                        <div className={`mx-auto rounded-lg border-l-[3px] bg-white px-2 py-1.5 shadow-sm ring-1 ring-slate-100 ${tone.border}`}>
                          <p className="text-sm font-extrabold text-[#253364]">{scoreText(cell)}<span className="text-[9px] font-semibold text-slate-400">/{cell.maxScore}</span></p>
                          <p className={`mt-0.5 flex items-center justify-center gap-1 text-[9px] font-bold ${tone.text}`}><span className={`size-1.5 rounded-full ${tone.dot}`} />{statusLabel[cell.status]}</p>
                        </div>
                      ) : (
                        <div className="relative mx-auto rounded-lg border border-slate-200 bg-white px-1.5 py-1 shadow-sm focus-within:border-violet-300 focus-within:ring-2 focus-within:ring-violet-50">
                          <div className="flex items-center gap-1">
                            <input aria-label={`คะแนน ${row.studentName} งาน ${column.title}`} type="number" min="0" max={column.maxScore} step="0.5" value={draft} disabled={isLocked || pendingKey === key} onChange={(event) => setDrafts((current) => ({ ...current, [key]: event.target.value }))} onBlur={() => {
                              const value = drafts[key] ?? displayScore(cell.score);
                              if (value === displayScore(cell.score)) return;
                              const score = value.trim() === "" ? null : Number(value);
                              if (score !== null && (!Number.isFinite(score) || score < 0)) {
                                setCellState((current) => ({ ...current, [key]: "error" }));
                                setMessage({ type: "error", text: "คะแนนต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป" });
                                return;
                              }
                              saveCell(row.studentId, cell.assignmentId, score, score !== null && cell.status === "missing" ? "submitted" : cell.status);
                            }} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} className="min-w-0 w-full bg-transparent px-1 py-0.5 text-center text-sm font-extrabold text-[#253364] outline-none disabled:cursor-not-allowed disabled:text-slate-400" placeholder="–" />
                            {pendingKey === key && <LoaderCircle className="size-3.5 shrink-0 animate-spin text-violet-500" />}
                            {pendingKey !== key && cellState[key] === "saved" && <Check className="size-3.5 shrink-0 text-emerald-500" />}
                            {pendingKey !== key && cellState[key] === "error" && <CircleAlert className="size-3.5 shrink-0 text-rose-500" />}
                          </div>
                          <select aria-label={`สถานะ ${row.studentName} งาน ${column.title}`} value={cell.status} disabled={isLocked || isPending} onChange={(event) => saveCell(row.studentId, cell.assignmentId, cell.score, event.target.value as AssignmentStatus)} className={`mt-0.5 w-full rounded-md py-0.5 text-center text-[9px] font-bold outline-none disabled:cursor-not-allowed ${tone.soft} ${tone.text}`}>
                            {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                          </select>
                          {isLocked && <LockKeyhole className="absolute right-1 top-1 size-3 text-slate-400" />}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {visibleRows.length === 0 && <div className="rounded-2xl bg-slate-50 p-8 text-center"><p className="font-extrabold text-[#253364]">ไม่พบนักเรียนตามตัวกรอง</p><p className="mt-1 text-sm text-slate-400">ลองล้างคำค้นหรือเลือกตัวกรองอื่น</p></div>}
      <p className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-400">
        {mode === "edit" ? <><Save className="size-3.5" />ออกจากช่องคะแนนหรือกด Enter เพื่อบันทึกอัตโนมัติ</> : <><Eye className="size-3.5" />กำลังอยู่ในโหมดดูรายงาน กด “แก้คะแนน” เมื่อต้องการแก้ข้อมูล</>}
      </p>
    </section>
  );
}
