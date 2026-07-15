import { AlertCircle, CheckCircle2, Clock3, MinusCircle, RotateCcw, ShieldCheck, UserRoundX } from "lucide-react";
import type { AssignmentStatus } from "@/types/database";

const statusConfig = {
  submitted: { label: "ส่งแล้ว", className: "bg-emerald-50 text-emerald-700 ring-emerald-200", icon: CheckCircle2 },
  missing: { label: "ยังไม่ส่ง", className: "bg-rose-50 text-rose-700 ring-rose-200", icon: AlertCircle },
  revision: { label: "แก้งาน", className: "bg-amber-50 text-amber-700 ring-amber-200", icon: RotateCcw },
  passed: { label: "ผ่านแล้ว", className: "bg-lime-50 text-lime-700 ring-lime-200", icon: ShieldCheck },
  pending_review: { label: "รอตรวจ", className: "bg-violet-50 text-violet-700 ring-violet-200", icon: Clock3 },
  absent: { label: "ลา", className: "bg-sky-50 text-sky-700 ring-sky-200", icon: UserRoundX },
  exempt: { label: "ไม่ต้องส่ง", className: "bg-slate-50 text-slate-600 ring-slate-200", icon: MinusCircle },
};

export function AssignmentStatusChip({ status, count, href }: { status: AssignmentStatus; count?: number; href?: string }) {
  const config = statusConfig[status];
  const Icon = config.icon;
  const content = (
    <>
      <Icon className="size-3.5" />
      {config.label}{typeof count === "number" ? ` ${count}` : ""}
    </>
  );

  if (href && typeof count === "number" && count > 0) {
    return <a href={href} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset transition hover:-translate-y-0.5 ${config.className}`}>{content}</a>;
  }

  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${config.className}`}>{content}</span>;
}
