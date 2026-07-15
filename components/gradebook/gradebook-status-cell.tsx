import type { GradebookCell } from "@/types/gradebook";

const statusStyles = {
  submitted: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  passed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  missing: "bg-rose-50 text-rose-700 ring-rose-200",
  revision: "bg-amber-50 text-amber-700 ring-amber-200",
  pending_review: "bg-violet-50 text-violet-700 ring-violet-200",
  absent: "bg-sky-50 text-sky-700 ring-sky-200",
  exempt: "bg-slate-50 text-slate-500 ring-slate-200",
};

const statusLabels = {
  submitted: "ส่ง",
  passed: "ผ่าน",
  missing: "ขาด",
  revision: "แก้",
  pending_review: "ตรวจ",
  absent: "ลา",
  exempt: "ยกเว้น",
};

export function GradebookStatusCell({ cell }: { cell: GradebookCell }) {
  const displayScore = cell.score === null ? "—" : Number.isInteger(cell.score) ? cell.score : cell.score.toFixed(1);

  return (
    <div className={`mx-auto min-w-16 rounded-2xl px-2 py-1.5 text-center text-xs font-extrabold ring-1 ring-inset ${statusStyles[cell.status]}`}>
      <p>{displayScore}<span className="text-[10px] opacity-60">/{cell.maxScore}</span></p>
      <p className="mt-0.5 text-[9px]">{statusLabels[cell.status]}</p>
    </div>
  );
}
