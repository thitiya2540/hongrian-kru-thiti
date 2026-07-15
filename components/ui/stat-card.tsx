import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string | number;
  helper: string;
  icon: LucideIcon;
  tone: "purple" | "green" | "rose" | "amber";
};

const toneStyles = {
  purple: "bg-violet-50 text-violet-600",
  green: "bg-emerald-50 text-emerald-600",
  rose: "bg-rose-50 text-rose-600",
  amber: "bg-amber-50 text-amber-600",
};

export function StatCard({ label, value, helper, icon: Icon, tone }: StatCardProps) {
  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_8px_24px_rgba(46,58,112,0.06)]">
      <div className="flex items-center justify-between gap-3">
        <span className={`grid size-10 place-items-center rounded-xl ${toneStyles[tone]}`}><Icon className="size-5" /></span>
        <span className="text-2xl font-extrabold text-[#27325e]">{value}</span>
      </div>
      <p className="mt-3 text-sm font-bold text-[#3c4668]">{label}</p>
      <p className="mt-0.5 text-xs text-slate-400">{helper}</p>
    </article>
  );
}
