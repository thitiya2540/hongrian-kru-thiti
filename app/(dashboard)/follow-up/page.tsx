import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, BellRing, CheckCircle2, ClipboardCheck, ClipboardList, Clock3, MessageCircleWarning, UserRoundSearch } from "lucide-react";
import { FollowUpFilterForm } from "@/components/follow-up/follow-up-filter-form";
import { DataSourceNotice } from "@/components/management/data-source-notice";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatCard } from "@/components/ui/stat-card";
import { getFollowUpData, parseFollowUpFilters } from "@/lib/follow-up/get-follow-up-data";
import { getManagementData } from "@/lib/management/get-management-data";
import type { FollowUpPriority } from "@/types/follow-up";

export const metadata: Metadata = { title: "ติดตามงานค้าง" };
export const dynamic = "force-dynamic";

type FollowUpPageProps = {
  searchParams: Promise<{ classroom?: string; priority?: string; q?: string }>;
};

const priorityStyles: Record<FollowUpPriority, string> = {
  critical: "bg-rose-50 text-rose-700 ring-rose-200",
  warning: "bg-amber-50 text-amber-700 ring-amber-200",
  normal: "bg-sky-50 text-sky-700 ring-sky-200",
};

const priorityLabels: Record<FollowUpPriority, string> = {
  critical: "เร่งด่วนมาก",
  warning: "ควรติดตาม",
  normal: "ปกติ",
};

export default async function FollowUpPage({ searchParams }: FollowUpPageProps) {
  const params = await searchParams;
  const filters = parseFollowUpFilters(params);
  const [followUp, management] = await Promise.all([getFollowUpData(filters), getManagementData()]);

  return (
    <main className="mx-auto max-w-[1500px] space-y-6 p-4 pb-28 sm:p-6 sm:pb-28 lg:p-7 lg:pb-8 xl:p-9">
      <section className="overflow-hidden rounded-[32px] bg-gradient-to-br from-white via-amber-50 to-violet-50 p-5 shadow-[0_16px_48px_rgba(46,58,112,0.08)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-extrabold text-amber-700 ring-1 ring-amber-100">
              <BellRing className="size-3.5" />
              ศูนย์ติดตามงาน
            </p>
            <h1 className="mt-3 text-2xl font-extrabold text-[#253364] md:text-3xl">ศูนย์ติดตามงานค้าง</h1>
            <p className="mt-1 max-w-3xl text-sm text-slate-500">
              รวมงานที่ควรตามวันนี้ งานเกินกำหนด รายการรอตรวจ และนักเรียนที่มีงานค้าง/งานต้องแก้ เพื่อให้ครูรู้ทันทีว่าควรเริ่มจากจุดไหน
            </p>
          </div>
          <DataSourceNotice source={followUp.source} notice={followUp.notice} />
        </div>
      </section>

      <FollowUpFilterForm filters={followUp.filters} classrooms={management.classrooms} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="งานเร่งด่วน" value={followUp.summary.urgentAssignments} helper="เกินกำหนดหรือมีรายการค้างมาก" icon={AlertTriangle} tone="rose" />
        <StatCard label="ครบกำหนดวันนี้" value={followUp.summary.dueTodayAssignments} helper="ควรเช็กก่อนเลิกเรียน" icon={Clock3} tone="amber" />
        <StatCard label="รอตรวจ" value={followUp.summary.pendingReviewRecords} helper="รายการที่นักเรียนส่งแล้ว" icon={ClipboardCheck} tone="purple" />
        <StatCard label="งานต้องแก้" value={followUp.summary.revisionRecords} helper="ต้องแจ้งจุดที่ควรปรับ" icon={MessageCircleWarning} tone="green" />
        <StatCard label="นักเรียนควรติดตาม" value={followUp.summary.atRiskStudents} helper="มีงานค้างหรือแก้ไขสะสม" icon={UserRoundSearch} tone="rose" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_16px_40px_rgba(46,58,112,0.08)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-[#253364]">คิวงานที่ควรติดตาม</h2>
              <p className="text-sm text-slate-400">เรียงจากเร่งด่วนและวันครบกำหนดก่อน</p>
            </div>
            <ClipboardList className="size-5 text-amber-500" />
          </div>

          {followUp.queue.length > 0 ? (
            <div className="space-y-3">
              {followUp.queue.map((item) => (
                <article key={item.id} className="rounded-3xl border border-slate-100 bg-slate-50/80 p-4 transition hover:border-violet-200 hover:bg-white hover:shadow-md">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-extrabold ring-1 ring-inset ${priorityStyles[item.priority]}`}>{priorityLabels[item.priority]}</span>
                        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-extrabold text-slate-500 ring-1 ring-slate-200">{item.dueLabel}</span>
                      </div>
                      <h3 className="mt-2 text-base font-extrabold text-[#253364]">{item.title}</h3>
                      <p className="mt-1 text-sm text-slate-500">{item.classroomLabel} · {item.subjectName}</p>
                    </div>
                    <Link href={item.actionHref} className="inline-flex items-center justify-center rounded-2xl bg-[#6956d9] px-4 py-2 text-sm font-extrabold text-white shadow-lg shadow-violet-100 transition hover:bg-[#5947c3]">
                      {item.actionLabel}
                    </Link>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <StatusBadge status="missing" count={item.missingCount} />
                    <StatusBadge status="revision" count={item.revisionCount} />
                    <StatusBadge status="pending_review" count={item.pendingReviewCount} />
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <CheckCircle2 className="mx-auto size-10 text-emerald-500" />
              <p className="mt-3 text-lg font-extrabold text-[#253364]">ไม่มีรายการต้องติดตามตามตัวกรองนี้</p>
              <p className="mt-1 text-sm text-slate-400">ลองเปลี่ยนห้องเรียนหรือความเร่งด่วนเพื่อดูรายการอื่น</p>
            </div>
          )}
        </div>

        <aside className="grid content-start gap-4">
          <section className="rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_16px_40px_rgba(46,58,112,0.08)]">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-violet-50 text-violet-600"><BellRing className="size-5" /></span>
              <div>
                <h2 className="font-extrabold text-[#253364]">สถานะที่ต้องดู</h2>
                <p className="text-xs text-slate-400">รวมจากคิวงานตามตัวกรอง</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {followUp.statusGroups.map((group) => (
                <div key={group.status} className="rounded-2xl bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <StatusBadge status={group.status} />
                    <span className="text-xl font-black text-[#253364]">{group.count}</span>
                  </div>
                  <p className="mt-2 text-xs font-semibold text-slate-400">{group.helper}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_16px_40px_rgba(46,58,112,0.08)]">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-rose-50 text-rose-600"><UserRoundSearch className="size-5" /></span>
              <div>
                <h2 className="font-extrabold text-[#253364]">นักเรียนควรติดตาม</h2>
                <p className="text-xs text-slate-400">เรียงตามจำนวนงานค้าง/ต้องแก้</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {followUp.studentRisks.slice(0, 8).map((student) => (
                <Link key={student.id} href={student.profileHref} className="block rounded-2xl bg-slate-50 p-3 transition hover:bg-violet-50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold text-[#253364]">{student.studentName}</p>
                      <p className="text-xs font-semibold text-slate-400">เลขที่ {student.numberInClass ?? "-"} · {student.classroomLabel}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-extrabold ring-1 ring-inset ${priorityStyles[student.priority]}`}>{student.totalIssueCount} งาน</span>
                  </div>
                  <p className="mt-2 text-xs font-semibold text-slate-500">ยังไม่ส่ง {student.missingCount} · ต้องแก้ {student.revisionCount}</p>
                </Link>
              ))}
              {followUp.studentRisks.length === 0 && <p className="rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">ยังไม่มีนักเรียนที่ต้องติดตามตามตัวกรองนี้</p>}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}
