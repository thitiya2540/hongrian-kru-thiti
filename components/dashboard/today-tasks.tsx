import { Calculator, ClipboardList, ListChecks, NotebookPen, Shapes } from "lucide-react";
import { ComingSoonButton } from "@/components/ui/coming-soon-button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import type { TodayTask } from "@/types/dashboard";

const taskIcons = [Calculator, Shapes, NotebookPen];
const iconStyles = ["bg-amber-100 text-amber-600", "bg-fuchsia-100 text-fuchsia-600", "bg-sky-100 text-sky-600"];

export function TodayTasks({ tasks, periodLabel }: { tasks: TodayTask[]; periodLabel: string }) {
  return (
    <section className="rounded-[26px] border border-white bg-white p-4 shadow-[0_14px_35px_rgba(39,59,110,0.08)] sm:p-5">
      <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div><div className="flex items-center gap-2"><span className="grid size-9 place-items-center rounded-xl bg-violet-100 text-violet-600"><ListChecks className="size-5" /></span><h2 className="text-lg font-extrabold text-[#293562]">ต้องจัดการวันนี้</h2></div><p className="mt-1 pl-11 text-xs text-slate-400">รายการที่ควรติดตามตาม{periodLabel}</p></div>
        <ComingSoonButton label="ดูงานทั้งหมด" icon={ClipboardList} />
      </div>

      {tasks.length === 0 ? <div className="mt-4"><EmptyState title="วันนี้ไม่มีงานค้าง" description="เยี่ยมมาก! ยังไม่มีรายการที่ต้องติดตามในภาคเรียนที่เลือก" /></div> : <div className="mt-4 grid gap-3 md:grid-cols-3">
        {tasks.map((task, index) => {
          const Icon = taskIcons[index % taskIcons.length];
          return (
            <article key={task.id} className="rounded-2xl border border-slate-100 bg-[#fbfcff] p-4 transition hover:border-violet-200 hover:bg-white hover:shadow-md">
              <div className="flex items-start gap-3"><span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${iconStyles[index % iconStyles.length]}`}><Icon className="size-5" /></span><div className="min-w-0"><h3 className="truncate text-sm font-extrabold text-[#303b68]">{task.title}</h3><p className="mt-1 text-[11px] font-medium text-slate-400">{task.classroom} · {task.subject}</p></div></div>
              <div className="mt-4 flex items-center justify-between gap-2"><StatusBadge status={task.status} count={task.studentCount} /><span className="text-right text-[9px] font-semibold text-slate-400">{task.dueLabel}</span></div>
            </article>
          );
        })}
      </div>}
    </section>
  );
}
