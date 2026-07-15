"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { AlertTriangle, Check, CheckCheck, Clock3, Keyboard, Loader2, Save, Search, Sparkles, Undo2, Users, X } from "lucide-react";
import { saveScoreRecordAction, saveScoreRecordsBulkAction } from "@/actions/assignments";
import { AssignmentStatusChip } from "@/components/assignments/assignment-status-chip";
import { StudentAvatar } from "@/components/students/student-avatar";
import { statusLabels } from "@/lib/assignments/constants";
import type { AssignmentStatus } from "@/types/database";
import type { AssignmentSummary, AssignmentStudentStatus, ScorebookRecord } from "@/types/assignments";

const statuses: AssignmentStatus[] = ["submitted", "missing", "revision", "pending_review", "absent", "passed", "exempt"];

const DEBOUNCE_MS = 650;

type HistoryItem = {
  message: string;
  before: ScorebookRecord[];
};

type QuickFilter = "all" | "unscored" | AssignmentStatus;

type BulkAction =
  | { kind: "status"; status: AssignmentStatus }
  | { kind: "increment"; amount: number }
  | { kind: "full" }
  | { kind: "clear" };

function bulkActionLabel(action: BulkAction, maxScore: number) {
  if (action.kind === "status") return `เปลี่ยนสถานะเป็น “${statusLabels[action.status]}”`;
  if (action.kind === "increment") return `เพิ่มคะแนน +${action.amount}`;
  if (action.kind === "full") return `ให้คะแนนเต็ม ${maxScore} คะแนน`;
  return "ล้างคะแนนและเปลี่ยนเป็นยังไม่ส่ง";
}

function toScorebookRecords(records: AssignmentStudentStatus[]): ScorebookRecord[] {
  return records.map((record) => ({ ...record, savingState: "idle" }));
}

function clampScore(value: number | null, maxScore: number, allowBonus: boolean) {
  if (value === null || Number.isNaN(value)) return null;
  if (value < 0) return 0;
  if (!allowBonus && value > maxScore) return maxScore;
  return value;
}

function formatSavedLabel(state: ScorebookRecord["savingState"]) {
  if (state === "pending") return "รอบันทึก";
  if (state === "saving") return "กำลังบันทึก";
  if (state === "saved") return "บันทึกแล้ว";
  if (state === "error") return "บันทึกไม่สำเร็จ";
  return "พร้อมแก้ไข";
}

export function ScorebookClient({
  assignment,
  initialRecords,
  disabled = false,
}: {
  assignment: AssignmentSummary;
  initialRecords: AssignmentStudentStatus[];
  disabled?: boolean;
}) {
  const [records, setRecords] = useState(() => toScorebookRecords(initialRecords));
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [toast, setToast] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [pendingBulkAction, setPendingBulkAction] = useState<BulkAction | null>(null);
  const [isPending, startTransition] = useTransition();

  const recordsRef = useRef(records);
  const saveTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const burstHistoryPushed = useRef(new Set<string>());
  const scoreInputRefs = useRef(new Map<string, HTMLInputElement>());

  useEffect(() => {
    recordsRef.current = records;
  }, [records]);

  useEffect(() => {
    const timers = saveTimers.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const visibleRecords = records.filter((record) => {
    const q = query.trim().toLowerCase();
    const matchesQuery = !q || `${record.studentName} ${record.nickname ?? ""} ${record.numberInClass ?? ""}`.toLowerCase().includes(q);
    const matchesFilter = quickFilter === "all" ? true : quickFilter === "unscored" ? record.score === null : record.status === quickFilter;
    return matchesQuery && matchesFilter;
  });
  const dirtyOrErrored = records.some((record) => record.savingState === "error" || record.savingState === "saving" || record.savingState === "pending");
  const unscoredCount = records.filter((record) => record.score === null).length;

  const quickFilters: { key: QuickFilter; label: string; count: number }[] = [
    { key: "all", label: "ทั้งหมด", count: records.length },
    { key: "unscored", label: "ยังไม่กรอกคะแนน", count: unscoredCount },
    { key: "missing", label: statusLabels.missing, count: records.filter((record) => record.status === "missing").length },
    { key: "pending_review", label: statusLabels.pending_review, count: records.filter((record) => record.status === "pending_review").length },
    { key: "revision", label: statusLabels.revision, count: records.filter((record) => record.status === "revision").length },
  ];

  function pushHistory(message: string, before: ScorebookRecord[]) {
    setHistory((current) => [{ message, before }, ...current].slice(0, 5));
  }

  function clearDebounce(studentId: string) {
    const timer = saveTimers.current.get(studentId);
    if (timer) {
      clearTimeout(timer);
      saveTimers.current.delete(studentId);
    }
    burstHistoryPushed.current.delete(studentId);
  }

  function saveOne(next: ScorebookRecord) {
    if (disabled || assignment.isLocked) return;
    setRecords((current) => current.map((record) => record.studentId === next.studentId ? { ...next, savingState: "saving" } : record));
    startTransition(async () => {
      try {
        await saveScoreRecordAction({
          assignmentId: assignment.id,
          studentId: next.studentId,
          score: next.score,
          status: next.status,
          note: next.note,
        });
        setRecords((current) => current.map((record) => record.studentId === next.studentId ? { ...record, savingState: "saved" } : record));
      } catch (error) {
        setRecords((current) => current.map((record) => record.studentId === next.studentId ? { ...record, savingState: "error" } : record));
        setToast(error instanceof Error ? error.message : "บันทึกไม่สำเร็จ");
      }
    });
  }

  function updateRecord(studentId: string, patch: Partial<ScorebookRecord>, message = "แก้ไขข้อมูล") {
    clearDebounce(studentId);
    const before = records;
    const current = records.find((record) => record.studentId === studentId);
    if (!current) return;
    const next = {
      ...current,
      ...patch,
      score: patch.score === undefined ? current.score : clampScore(patch.score, assignment.maxScore, assignment.allowBonus),
    };
    pushHistory(message, before);
    saveOne(next);
  }

  function updateRecordDebounced(studentId: string, patch: Partial<ScorebookRecord>, message: string) {
    const current = records.find((record) => record.studentId === studentId);
    if (!current) return;
    const next: ScorebookRecord = {
      ...current,
      ...patch,
      score: patch.score === undefined ? current.score : clampScore(patch.score, assignment.maxScore, assignment.allowBonus),
      savingState: "pending",
    };

    if (!burstHistoryPushed.current.has(studentId)) {
      pushHistory(message, records);
      burstHistoryPushed.current.add(studentId);
    }

    setRecords((curr) => curr.map((record) => record.studentId === studentId ? next : record));

    const existingTimer = saveTimers.current.get(studentId);
    if (existingTimer) clearTimeout(existingTimer);
    const timer = setTimeout(() => {
      saveTimers.current.delete(studentId);
      burstHistoryPushed.current.delete(studentId);
      const latest = recordsRef.current.find((record) => record.studentId === studentId);
      if (latest) saveOne(latest);
    }, DEBOUNCE_MS);
    saveTimers.current.set(studentId, timer);
  }

  function flushDebounced(studentId: string) {
    const timer = saveTimers.current.get(studentId);
    if (!timer) return;
    clearTimeout(timer);
    saveTimers.current.delete(studentId);
    burstHistoryPushed.current.delete(studentId);
    const latest = recordsRef.current.find((record) => record.studentId === studentId);
    if (latest) saveOne(latest);
  }

  function requestBulkAction(action: BulkAction) {
    if (selectedIds.length === 0) {
      setToast("กรุณาเลือกนักเรียนก่อน");
      return;
    }
    setPendingBulkAction(action);
  }

  function applyBulkAction(action: BulkAction) {
    const patchFactory = (record: ScorebookRecord): Partial<ScorebookRecord> => {
      if (action.kind === "status") {
        return { status: action.status, score: action.status === "submitted" && record.score === null ? assignment.maxScore : record.score };
      }
      if (action.kind === "increment") {
        return { score: clampScore((record.score ?? 0) + action.amount, assignment.maxScore, assignment.allowBonus), status: record.status === "missing" ? "submitted" : record.status };
      }
      if (action.kind === "full") return { score: assignment.maxScore, status: "submitted" };
      return { score: null, status: "missing" };
    };
    const message = bulkActionLabel(action, assignment.maxScore);

    selectedIds.forEach((id) => clearDebounce(id));
    const before = records;
    const nextRecords = records.map((record) => selectedSet.has(record.studentId) ? {
      ...record,
      ...patchFactory(record),
      savingState: "saving" as const,
    } : record);
    const payload = nextRecords.filter((record) => selectedSet.has(record.studentId));

    pushHistory(message, before);
    setRecords(nextRecords);
    setSelectedIds([]);
    setPendingBulkAction(null);
    setToast(`${message} ${payload.length} คน`);

    if (disabled || assignment.isLocked) return;
    startTransition(async () => {
      try {
        await saveScoreRecordsBulkAction({
          assignmentId: assignment.id,
          records: payload.map((record) => ({
            studentId: record.studentId,
            score: clampScore(record.score, assignment.maxScore, assignment.allowBonus),
            status: record.status,
            note: record.note,
          })),
        });
        const ids = new Set(payload.map((record) => record.studentId));
        setRecords((current) => current.map((record) => ids.has(record.studentId) ? { ...record, savingState: "saved" } : record));
      } catch (error) {
        const ids = new Set(payload.map((record) => record.studentId));
        setRecords((current) => current.map((record) => ids.has(record.studentId) ? { ...record, savingState: "error" } : record));
        setToast(error instanceof Error ? error.message : "บันทึกไม่สำเร็จ");
      }
    });
  }

  function undoLast() {
    const [last, ...rest] = history;
    if (!last) return;

    const beforeById = new Map(last.before.map((record) => [record.studentId, record]));
    const changedIds = records
      .filter((current) => {
        const prior = beforeById.get(current.studentId);
        return prior && (prior.score !== current.score || prior.status !== current.status || prior.note !== current.note);
      })
      .map((record) => record.studentId);

    changedIds.forEach((id) => clearDebounce(id));
    const changedSet = new Set(changedIds);
    const restored = last.before.map((record) => changedSet.has(record.studentId) ? { ...record, savingState: "saving" as const } : record);

    setRecords(restored);
    setHistory(rest);
    setToast(`ย้อนกลับ: ${last.message}`);

    if (disabled || assignment.isLocked || changedIds.length === 0) return;

    startTransition(async () => {
      try {
        await saveScoreRecordsBulkAction({
          assignmentId: assignment.id,
          records: last.before.filter((record) => changedSet.has(record.studentId)).map((record) => ({
            studentId: record.studentId,
            score: record.score,
            status: record.status,
            note: record.note,
          })),
        });
        setRecords((current) => current.map((record) => changedSet.has(record.studentId) ? { ...record, savingState: "saved" } : record));
      } catch (error) {
        setRecords((current) => current.map((record) => changedSet.has(record.studentId) ? { ...record, savingState: "error" } : record));
        setToast(error instanceof Error ? error.message : "ย้อนกลับไม่สำเร็จ กรุณาลองใหม่");
      }
    });
  }

  function saveAll() {
    saveTimers.current.forEach((timer) => clearTimeout(timer));
    saveTimers.current.clear();
    burstHistoryPushed.current.clear();
    const before = records;
    pushHistory("บันทึกทั้งหมด", before);
    setRecords((current) => current.map((record) => ({ ...record, savingState: "saving" })));
    startTransition(async () => {
      try {
        await saveScoreRecordsBulkAction({
          assignmentId: assignment.id,
          records: records.map((record) => ({
            studentId: record.studentId,
            score: record.score,
            status: record.status,
            note: record.note,
          })),
        });
        setRecords((current) => current.map((record) => ({ ...record, savingState: "saved" })));
        setToast(`บันทึกทั้งหมด ${records.length} คนแล้ว`);
      } catch (error) {
        setRecords((current) => current.map((record) => ({ ...record, savingState: "error" })));
        setToast(error instanceof Error ? error.message : "บันทึกทั้งหมดไม่สำเร็จ");
      }
    });
  }

  function focusNextScoreInput(studentId: string) {
    const index = visibleRecords.findIndex((record) => record.studentId === studentId);
    if (index === -1) return;
    const nextRecord = visibleRecords[index + 1];
    if (!nextRecord) return;
    scoreInputRefs.current.get(nextRecord.studentId)?.focus();
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="grid gap-4">
        <div className="rounded-[28px] bg-white p-4 shadow-[0_18px_50px_rgba(44,55,105,0.12)]">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <label className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาชื่อ ชื่อเล่น หรือเลขที่" className="h-11 w-full rounded-2xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-violet-300" />
            </label>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setSelectedIds(visibleRecords.map((record) => record.studentId))} className="h-10 rounded-2xl bg-violet-50 px-3 text-xs font-extrabold text-violet-700">เลือกทั้งหมด</button>
              <button type="button" onClick={() => setSelectedIds([])} className="h-10 rounded-2xl bg-slate-100 px-3 text-xs font-extrabold text-slate-600">ยกเลิกเลือก</button>
              <button type="button" onClick={undoLast} disabled={history.length === 0} className="inline-flex h-10 items-center gap-1.5 rounded-2xl bg-amber-50 px-3 text-xs font-extrabold text-amber-700 disabled:text-slate-300"><Undo2 className="size-3.5" /> ยกเลิก</button>
              <button type="button" onClick={saveAll} disabled={disabled || assignment.isLocked || isPending} className="inline-flex h-10 items-center gap-1.5 rounded-2xl bg-emerald-50 px-3 text-xs font-extrabold text-emerald-700 disabled:text-slate-300">{isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />} บันทึกทั้งหมด</button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {quickFilters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => setQuickFilter(filter.key)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold transition ${quickFilter === filter.key ? "bg-[#293562] text-white" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}
              >
                {filter.label}
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${quickFilter === filter.key ? "bg-white/20" : "bg-white text-slate-400"}`}>{filter.count}</span>
              </button>
            ))}
          </div>

          <div className="mt-4 grid gap-3">
            <div className="flex flex-wrap gap-2">
              {statuses.map((status) => (
                <button key={status} type="button" onClick={() => requestBulkAction({ kind: "status", status })} className="rounded-full bg-slate-50 px-3 py-2 text-xs font-extrabold text-slate-600 ring-1 ring-slate-200">{statusLabels[status]}</button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 5].map((amount) => <button key={amount} type="button" onClick={() => requestBulkAction({ kind: "increment", amount })} className="rounded-full bg-violet-50 px-4 py-2 text-xs font-extrabold text-violet-700">+{amount}</button>)}
              <button type="button" onClick={() => requestBulkAction({ kind: "full" })} className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-extrabold text-emerald-700">เต็ม ({assignment.maxScore})</button>
              <button type="button" onClick={() => requestBulkAction({ kind: "clear" })} className="rounded-full bg-rose-50 px-4 py-2 text-xs font-extrabold text-rose-700">ล้าง</button>
            </div>
            <p className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400"><Keyboard className="size-4" /> กรอกคะแนนแล้วกด Enter เพื่อไปยังนักเรียนคนถัดไป · การแก้หลายคนจะมีหน้าตรวจทานก่อนบันทึก</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {visibleRecords.map((record) => {
            const selected = selectedSet.has(record.studentId);
            return (
              <article key={record.studentId} onClick={() => setSelectedIds((current) => selected ? current.filter((id) => id !== record.studentId) : [...current, record.studentId])} className={`rounded-[28px] border bg-white p-4 shadow-[0_14px_34px_rgba(44,55,105,0.1)] transition ${selected ? "border-violet-300 ring-4 ring-violet-100" : "border-white/80"}`}>
                <div className="flex items-start gap-3">
                  <button type="button" onDoubleClick={(event) => { event.stopPropagation(); updateRecord(record.studentId, { score: clampScore((record.score ?? 0) + 1, assignment.maxScore, assignment.allowBonus), status: record.status === "missing" ? "submitted" : record.status }, "ดับเบิลคลิก +1"); }} className="rounded-2xl outline-none focus:ring-4 focus:ring-violet-100" aria-label={`เพิ่มคะแนนด่วนให้ ${record.studentName}`}>
                    <StudentAvatar student={record} showNumber />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h2 className="truncate text-base font-black text-[#293562]">{record.studentName}</h2>
                        <p className="text-xs font-semibold text-slate-400">{record.nickname ?? "ไม่มีชื่อเล่น"} · {record.classroomLabel}</p>
                      </div>
                      <span className={`grid size-7 place-items-center rounded-full ${selected ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-300"}`}>{selected ? <Check className="size-4" /> : null}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <AssignmentStatusChip status={record.status} />
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${record.savingState === "error" ? "bg-rose-50 text-rose-700" : record.savingState === "saving" || record.savingState === "pending" ? "bg-amber-50 text-amber-700" : "bg-slate-50 text-slate-500"}`}>{record.savingState === "saving" || record.savingState === "pending" ? <Clock3 className="size-3.5" /> : record.savingState === "saved" ? <CheckCheck className="size-3.5" /> : <Sparkles className="size-3.5" />}{formatSavedLabel(record.savingState)}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                  <label className="grid gap-1 text-xs font-bold text-slate-500">
                    คะแนน
                    <input
                      ref={(element) => {
                        if (element) scoreInputRefs.current.set(record.studentId, element);
                        else scoreInputRefs.current.delete(record.studentId);
                      }}
                      type="number"
                      min="0"
                      max={assignment.allowBonus ? undefined : assignment.maxScore}
                      step="0.01"
                      value={record.score ?? ""}
                      disabled={disabled || assignment.isLocked}
                      onClick={(event) => event.stopPropagation()}
                      onChange={(event) => updateRecordDebounced(record.studentId, { score: event.target.value === "" ? null : Number(event.target.value), status: record.status === "missing" ? "submitted" : record.status }, "แก้คะแนน")}
                      onBlur={() => flushDebounced(record.studentId)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          focusNextScoreInput(record.studentId);
                        }
                      }}
                      className="h-10 rounded-2xl border border-slate-200 px-3 text-lg font-black text-[#293562] outline-none focus:border-violet-300"
                    />
                  </label>
                  <div className="grid place-items-end text-xs font-bold text-slate-400">/ {assignment.maxScore}</div>
                </div>
                <div className="mt-3 grid gap-2">
                  <select value={record.status} disabled={disabled || assignment.isLocked} onClick={(event) => event.stopPropagation()} onChange={(event) => updateRecord(record.studentId, { status: event.target.value as AssignmentStatus }, "เปลี่ยนสถานะ")} className="h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 outline-none focus:border-violet-300">
                    {statuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
                  </select>
                  <input value={record.note ?? ""} disabled={disabled || assignment.isLocked} onClick={(event) => event.stopPropagation()} onChange={(event) => updateRecordDebounced(record.studentId, { note: event.target.value }, "แก้หมายเหตุ")} onBlur={() => flushDebounced(record.studentId)} placeholder="หมายเหตุ" className="h-10 rounded-2xl border border-slate-200 px-3 text-sm outline-none focus:border-violet-300" />
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <aside className="grid content-start gap-4">
        <div className="rounded-[28px] bg-white p-5 shadow-[0_18px_50px_rgba(44,55,105,0.12)]">
          <h2 className="text-lg font-black text-[#293562]">สรุปการบันทึก</h2>
          <div className="mt-4 grid gap-2">
            {statuses.map((status) => <div key={status} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2 text-sm font-bold text-slate-600"><span>{statusLabels[status]}</span><span>{records.filter((record) => record.status === status).length}</span></div>)}
          </div>
          <div className="mt-4 rounded-2xl bg-violet-50 p-3 text-sm font-bold text-violet-700"><Users className="mb-2 size-4" /> เลือกอยู่ {selectedIds.length} คน จาก {records.length} คน</div>
        </div>
        {assignment.isLocked ? <div className="rounded-[28px] bg-amber-50 p-5 text-sm font-bold leading-6 text-amber-800">งานนี้ถูกล็อกแล้ว ต้องปลดล็อกจากหน้ารวมงานก่อนจึงจะแก้คะแนนได้</div> : null}
        {dirtyOrErrored ? <div className="rounded-[28px] bg-rose-50 p-5 text-sm font-bold leading-6 text-rose-700">มีรายการกำลังบันทึกหรือบันทึกไม่สำเร็จ ตรวจสถานะบนการ์ดนักเรียนอีกครั้ง</div> : null}
        {toast ? <div className="rounded-[28px] bg-[#293562] p-4 text-sm font-bold text-white shadow-xl"><div className="flex items-start justify-between gap-3"><p>{toast}</p><button type="button" onClick={() => setToast(null)} aria-label="ปิด"><X className="size-4" /></button></div></div> : null}
      </aside>

      {pendingBulkAction ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#1b2345]/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="bulk-confirm-title">
          <div className="w-full max-w-md rounded-[30px] bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-amber-50 text-amber-600"><AlertTriangle className="size-6" /></span>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-amber-600">ตรวจทานก่อนบันทึก</p>
                <h2 id="bulk-confirm-title" className="mt-1 text-xl font-black text-[#293562]">{bulkActionLabel(pendingBulkAction, assignment.maxScore)}</h2>
              </div>
            </div>
            <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm font-bold leading-6 text-slate-600">
              <p>งาน: <span className="text-[#293562]">{assignment.title}</span></p>
              <p>ห้อง: <span className="text-[#293562]">{assignment.classroomLabel}</span></p>
              <p>นักเรียนที่ได้รับผลกระทบ: <span className="text-rose-600">{selectedIds.length} คน</span></p>
            </div>
            <p className="mt-4 text-xs font-semibold leading-5 text-slate-400">หลังยืนยัน ระบบจะบันทึกคะแนนหรือสถานะของนักเรียนที่เลือกทั้งหมด และยังสามารถใช้ปุ่ม “ยกเลิก” เพื่อย้อนกลับรายการล่าสุดได้</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setPendingBulkAction(null)} className="h-11 rounded-2xl bg-slate-100 text-sm font-extrabold text-slate-600">กลับไปตรวจ</button>
              <button type="button" onClick={() => applyBulkAction(pendingBulkAction)} disabled={isPending} className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#6956d9] text-sm font-extrabold text-white disabled:opacity-60">{isPending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} ยืนยันบันทึก</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
