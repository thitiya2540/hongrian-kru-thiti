import type { Metadata } from "next";
import { ClassroomCard } from "@/components/dashboard/classroom-card";
import { DailyOverview } from "@/components/dashboard/daily-overview";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { TodayTasks } from "@/components/dashboard/today-tasks";
import { EmptyState } from "@/components/ui/empty-state";
import { getDashboardData } from "@/lib/dashboard/get-dashboard-data";

export const metadata: Metadata = { title: "หน้าหลัก" };
export const dynamic = "force-dynamic";

type DashboardPageProps = {
  searchParams: Promise<{ term?: string }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { term } = await searchParams;
  const dashboard = await getDashboardData(term);
  const selectedTerm = dashboard.academicTerms.find((item) => item.id === dashboard.selectedTermId)
    ?? dashboard.academicTerms.find((item) => item.isActive)
    ?? dashboard.academicTerms[0];
  const periodLabel = selectedTerm
    ? `ปีการศึกษา ${selectedTerm.academicYear} · ภาคเรียนที่ ${selectedTerm.semester}`
    : "ช่วงเวลาที่เลือก";
  const totalStudents = dashboard.classrooms.reduce((sum, classroom) => sum + classroom.students, 0);
  const totalSubjects = dashboard.classrooms.reduce((sum, classroom) => sum + classroom.subjects, 0);

  return (
    <main className="mx-auto max-w-[1600px] p-4 pb-28 sm:p-6 sm:pb-28 lg:p-7 lg:pb-8 xl:p-9">
      <DashboardHeader teacherName={dashboard.teacherName} terms={dashboard.academicTerms} selectedTermId={dashboard.selectedTermId} source={dashboard.source} notice={dashboard.notice} />

      <section aria-labelledby="classrooms-heading" className="mt-5">
        <div className="mb-3 flex items-end justify-between gap-4 px-1"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-violet-500">แผนที่การเรียนรู้</p><h2 id="classrooms-heading" className="mt-1 text-xl font-extrabold text-[#293562]">ห้องเรียนของฉัน</h2></div><p className="hidden text-xs font-medium text-slate-400 sm:block">นักเรียนรวม {totalStudents} คน · {totalSubjects} รายวิชา</p></div>
        {dashboard.classrooms.length === 0 ? <EmptyState title="ยังไม่มีห้องเรียนในภาคเรียนนี้" description="เพิ่มห้องเรียนและเชื่อมรายวิชาในระยะจัดการข้อมูล เพื่อเริ่มติดตามคะแนน" /> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {dashboard.classrooms.map((classroom) => <ClassroomCard key={classroom.id} classroom={classroom} />)}
        </div>}
      </section>

      <div className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
        <TodayTasks tasks={dashboard.todayTasks} periodLabel={periodLabel} />
        <DailyOverview stats={dashboard.stats} />
      </div>
    </main>
  );
}
