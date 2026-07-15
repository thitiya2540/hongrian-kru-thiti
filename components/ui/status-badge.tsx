import { AlertCircle, CheckCircle2, Clock3, RotateCcw, UserRoundX } from "lucide-react";
import type { TaskStatus } from "@/types/dashboard";

type Status = TaskStatus | "submitted" | "absent";

const statusStyles: Record<Status, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  submitted: { label: "ส่งแล้ว", className: "bg-emerald-50 text-emerald-700 ring-emerald-200", icon: CheckCircle2 },
  missing: { label: "ยังไม่ส่ง", className: "bg-rose-50 text-rose-700 ring-rose-200", icon: AlertCircle },
  revision: { label: "ต้องแก้", className: "bg-amber-50 text-amber-700 ring-amber-200", icon: RotateCcw },
  pending_review: { label: "รอตรวจ", className: "bg-violet-50 text-violet-700 ring-violet-200", icon: Clock3 },
  absent: { label: "ลา", className: "bg-sky-50 text-sky-700 ring-sky-200", icon: UserRoundX },
};

export function StatusBadge({ status, count }: { status: Status; count?: number }) {
  const config = statusStyles[status];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${config.className}`}>
      <Icon className="size-3.5" />
      {config.label}{typeof count === "number" ? ` ${count} คน` : ""}
    </span>
  );
}
