import type { Metadata } from "next";
import Link from "next/link";
import { BookOpenCheck, Download, FileSpreadsheet, FileText, Percent, ShieldAlert, Table2 } from "lucide-react";
import { EditableScoreReport } from "@/components/reports/editable-score-report";
import { ReportFilterForm } from "@/components/reports/report-filter-form";
import { PrintReportButton } from "@/components/reports/print-report-button";
import { DataSourceNotice } from "@/components/management/data-source-notice";
import { StatCard } from "@/components/ui/stat-card";
import { getGradebookData } from "@/lib/gradebook/get-gradebook-data";
import { getManagementData } from "@/lib/management/get-management-data";

export const metadata: Metadata = {
  title: "รายงานคะแนนรายห้อง",
};

type ReportsPageProps = {
  searchParams: Promise<{ classroom?: string; subject?: string }>;
};

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const params = await searchParams;
  const filters = {
    classroomId: params.classroom && params.classroom !== "all" ? params.classroom : undefined,
    subjectId: params.subject && params.subject !== "all" ? params.subject : undefined,
  };
  const management = await getManagementData();
  const isReady = Boolean(filters.classroomId && filters.subjectId);
  const gradebook = isReady ? await getGradebookData(filters) : null;
  const exportParams = new URLSearchParams({ classroom: filters.classroomId ?? "", subject: filters.subjectId ?? "" });

  return (
    <div className="space-y-6 pb-24 print:bg-white print:pb-0">
      <section className="rounded-[32px] bg-gradient-to-br from-white via-violet-50 to-sky-50 p-5 shadow-[0_16px_48px_rgba(46,58,112,0.08)] print:shadow-none">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-extrabold text-violet-700 ring-1 ring-violet-100">
              <FileSpreadsheet className="size-3.5" />
              รายงานคะแนนแบบแก้ไขได้
            </p>
            <h1 className="mt-3 text-2xl font-extrabold text-[#253364] md:text-3xl">รายงานคะแนนรายห้องเรียน</h1>
            <p className="mt-1 max-w-3xl text-sm text-slate-500">
              เลือกห้องเรียนและรายวิชา แล้วดูคะแนนทุกงานของนักเรียนทั้งห้องในตารางเดียว พร้อมแก้คะแนนและสถานะได้ทันที
            </p>
          </div>
          {gradebook && (
            <div className="flex flex-wrap gap-2 print:hidden">
              <Link href={`/api/gradebook/export?${exportParams.toString()}`} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-100 transition hover:bg-emerald-700">
                <Download className="size-4" />
                ส่งออก CSV
              </Link>
              <PrintReportButton />
            </div>
          )}
        </div>
      </section>

      <DataSourceNotice source={gradebook?.source ?? management.source} notice={gradebook?.notice ?? management.notice} />
      <ReportFilterForm classrooms={management.classrooms} subjects={management.subjects} filters={filters} />

      {!gradebook ? (
        <section className="rounded-[28px] border border-dashed border-violet-200 bg-white p-10 text-center shadow-[0_16px_40px_rgba(46,58,112,0.06)]">
          <FileText className="mx-auto size-10 text-violet-400" />
          <h2 className="mt-4 text-xl font-extrabold text-[#253364]">เริ่มจากเลือกห้องเรียนและรายวิชา</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">ระบบจะแสดงเฉพาะนักเรียนในห้องและงานทั้งหมดของรายวิชาที่เลือก เพื่อให้ตารางอ่านง่ายและแก้คะแนนได้ปลอดภัย</p>
        </section>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="นักเรียน" value={`${gradebook.summary.studentCount} คน`} helper={gradebook.selectedClassroomLabel} icon={Table2} tone="purple" />
            <StatCard label="งานในรายงาน" value={`${gradebook.summary.assignmentCount} งาน`} helper={`เต็มรวม ${gradebook.summary.totalPossibleScore} คะแนน`} icon={FileText} tone="amber" />
            <StatCard label="คะแนนเฉลี่ย" value={`${gradebook.summary.averagePercent}%`} helper={gradebook.selectedSubjectName} icon={Percent} tone="green" />
            <StatCard label="เร่งติดตาม" value={`${gradebook.summary.riskStudentCount} คน`} helper={`ยังไม่ส่ง ${gradebook.summary.missingCount} · ต้องแก้ ${gradebook.summary.revisionCount}`} icon={ShieldAlert} tone="rose" />
          </section>

          {gradebook.columns.length === 0 ? (
            <section className="rounded-[28px] border border-dashed border-slate-200 bg-white p-10 text-center">
              <BookOpenCheck className="mx-auto size-10 text-slate-300" />
              <h2 className="mt-4 text-xl font-extrabold text-[#253364]">ยังไม่มีงานในรายวิชานี้</h2>
              <p className="mt-2 text-sm text-slate-500">สร้างงานก่อน แล้วงานนั้นจะปรากฏเป็นคอลัมน์ในตารางรายงาน</p>
            </section>
          ) : (
            <EditableScoreReport key={`${filters.classroomId}-${filters.subjectId}`} gradebook={gradebook} />
          )}
        </>
      )}
    </div>
  );
}
