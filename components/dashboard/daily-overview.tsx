import { ClipboardCheck, UserRoundCheck } from "lucide-react";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatCard } from "@/components/ui/stat-card";
import type { DashboardStats } from "@/types/dashboard";

export function DailyOverview({ stats }: { stats: DashboardStats }) {
  return (
    <aside className="space-y-4">
      <section className="overflow-hidden rounded-[26px] bg-gradient-to-br from-[#5d49c6] via-[#755bd8] to-[#9575e9] p-5 text-white shadow-[0_16px_38px_rgba(91,69,194,0.24)]">
        <div className="flex items-start justify-between"><div><p className="text-xs font-semibold text-white/70">ความคืบหน้าภาคเรียนนี้</p><h2 className="mt-1 text-xl font-extrabold">ภาพรวมการส่งงาน</h2></div><span className="grid size-12 place-items-center rounded-2xl bg-white/15"><ClipboardCheck className="size-7 text-emerald-200" /></span></div>
        <div className="mt-5 rounded-2xl bg-white/12 p-4 backdrop-blur"><ProgressBar value={stats.submissionRate} label="อัตราส่งงานครบ" color="green" /><div className="mt-3 flex items-center justify-between text-[10px] font-medium text-white/70"><span>เป้าหมาย 90%</span><span>อีก 8% จะถึงเป้าหมาย</span></div></div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-1 xl:grid-cols-2">
        <StatCard label="งานภาคเรียนนี้" value={stats.assignmentsThisTerm} helper="ยอดสะสมทั้งหมด" icon={ClipboardCheck} tone="purple" />
        <StatCard label="ควรติดตาม" value={`${stats.studentsNeedAttention} คน`} helper="ยังไม่ส่งหรือต้องแก้" icon={UserRoundCheck} tone="rose" />
      </div>
    </aside>
  );
}
