import { AssignmentStatusChip } from "@/components/assignments/assignment-status-chip";
import type { StudentAssignmentHistory } from "@/types/students";

function formatDate(value: string) {
  const date = new Date(value.includes("T") ? value : `${value}T00:00:00+07:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Bangkok" }).format(date);
}

export function StudentAssignmentList({ title, items }: { title: string; items: StudentAssignmentHistory[] }) {
  return (
    <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_50px_rgba(44,55,105,0.1)]">
      <h2 className="text-lg font-black text-[#293562]">{title}</h2>
      <div className="mt-4 grid gap-3">
        {items.length > 0 ? items.map((item) => (
          <div key={item.id} className="rounded-2xl bg-slate-50 p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-extrabold text-[#293562]">{item.title}</p>
                <p className="text-xs font-semibold text-slate-400">{item.subjectName} · {formatDate(item.activityDate)}</p>
              </div>
              <AssignmentStatusChip status={item.status} />
            </div>
            <p className="mt-2 text-sm font-bold text-slate-600">คะแนน {item.score ?? "-"} / {item.maxScore}</p>
            {item.note ? <p className="mt-1 text-xs font-semibold text-amber-700">{item.note}</p> : null}
          </div>
        )) : <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-400">ยังไม่มีรายการ</p>}
      </div>
    </section>
  );
}
