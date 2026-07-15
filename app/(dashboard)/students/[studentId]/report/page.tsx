import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ClipboardList, FileText, Percent, RotateCcw } from "lucide-react";
import { DataSourceNotice } from "@/components/management/data-source-notice";
import { StudentReportPrintButton } from "@/components/student-reports/student-report-print-button";
import { appBrand } from "@/lib/branding";
import { getStudentReportData } from "@/lib/student-reports/get-student-report-data";
import type { AssignmentStatus } from "@/types/database";

export const metadata: Metadata = { title: "รายงานรายบุคคล" };
export const dynamic = "force-dynamic";

type StudentReportPageProps = {
  params: Promise<{ studentId: string }>;
};

const statusLabels: Record<AssignmentStatus, string> = {
  submitted: "ส่งแล้ว",
  passed: "ผ่าน",
  missing: "ยังไม่ส่ง",
  revision: "ต้องแก้",
  pending_review: "รอตรวจ",
  absent: "ลา",
  exempt: "ยกเว้น",
};

const statusStyles: Record<AssignmentStatus, string> = {
  submitted: "bg-emerald-50 text-emerald-700",
  passed: "bg-emerald-50 text-emerald-700",
  missing: "bg-rose-50 text-rose-700",
  revision: "bg-amber-50 text-amber-700",
  pending_review: "bg-violet-50 text-violet-700",
  absent: "bg-sky-50 text-sky-700",
  exempt: "bg-slate-100 text-slate-500",
};

function formatThaiDate(value: string) {
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(new Date(value));
}

function formatThaiDateTime(value: string) {
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function scoreText(score: number | null, maxScore: number) {
  return score === null ? `—/${maxScore}` : `${Number.isInteger(score) ? score : score.toFixed(1)}/${maxScore}`;
}

export default async function StudentReportPage({ params }: StudentReportPageProps) {
  const { studentId } = await params;
  const report = await getStudentReportData(studentId);
  if (!report) notFound();

  const student = report.profile.student;
  const todoAssignments = report.assignments.filter((item) => ["missing", "revision", "pending_review"].includes(item.status));

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-24 print:max-w-none print:bg-white print:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={`/students/${student.id}`} className="inline-flex items-center gap-2 text-sm font-extrabold text-violet-700">
          <ArrowLeft className="size-4" />
          กลับโปรไฟล์นักเรียน
        </Link>
        <StudentReportPrintButton />
      </div>

      <DataSourceNotice source={report.source} notice={report.notice} />

      <article className="overflow-hidden rounded-[32px] bg-white shadow-[0_18px_60px_rgba(44,55,105,0.12)] print:rounded-none print:shadow-none">
        <header className="bg-gradient-to-br from-violet-50 via-sky-50 to-emerald-50 p-6 print:bg-white print:p-0">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-extrabold text-violet-700 ring-1 ring-violet-100 print:ring-slate-200">
                <FileText className="size-3.5" />
                รายงานความก้าวหน้ารายบุคคล
              </p>
              <h1 className="mt-3 text-2xl font-black text-[#253364] md:text-3xl">รายงานผลรายบุคคล</h1>
              <p className="mt-1 text-sm font-semibold text-slate-500">{appBrand.fullName}</p>
              <p className="mt-3 text-xs font-bold text-slate-400">สร้างรายงานเมื่อ {formatThaiDateTime(report.generatedAt)}</p>
            </div>
            <div className="rounded-3xl bg-white/80 p-4 text-right shadow-sm print:border print:border-slate-200 print:shadow-none">
              <p className="text-xs font-bold text-slate-400">ผลรวมถ่วงน้ำหนัก</p>
              <p className="text-4xl font-black text-violet-700">{report.summary.percent}%</p>
              <p className="text-sm font-extrabold text-[#253364]">{report.summary.gradeLabel}</p>
            </div>
          </div>
        </header>

        <section className="grid gap-4 p-6 md:grid-cols-[1fr_0.9fr] print:p-0 print:pt-5">
          <div className="rounded-3xl border border-slate-100 p-5">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-violet-500">ข้อมูลนักเรียน</p>
            <h2 className="mt-2 text-2xl font-black text-[#253364]">{student.firstName} {student.lastName}</h2>
            <div className="mt-3 grid gap-2 text-sm font-semibold text-slate-500 sm:grid-cols-2">
              <p>รหัสนักเรียน: <span className="text-[#253364]">{student.studentCode}</span></p>
              <p>ห้องเรียน: <span className="text-[#253364]">{student.classroomLabel}</span></p>
              <p>เลขที่: <span className="text-[#253364]">{student.numberInClass ?? "-"}</span></p>
              <p>ชื่อเล่น: <span className="text-[#253364]">{student.nickname ?? "-"}</span></p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-3xl bg-emerald-50 p-4"><ClipboardList className="size-5 text-emerald-600" /><p className="mt-2 text-2xl font-black text-[#253364]">{report.summary.submittedCount}/{report.columns.length}</p><p className="text-xs font-bold text-slate-500">ส่งแล้ว/ผ่าน</p></div>
            <div className="rounded-3xl bg-rose-50 p-4"><RotateCcw className="size-5 text-rose-600" /><p className="mt-2 text-2xl font-black text-[#253364]">{report.summary.missingCount + report.summary.revisionCount}</p><p className="text-xs font-bold text-slate-500">ยังไม่ส่ง/ต้องแก้</p></div>
            <div className="rounded-3xl bg-violet-50 p-4"><Percent className="size-5 text-violet-600" /><p className="mt-2 text-2xl font-black text-[#253364]">{report.summary.percent}%</p><p className="text-xs font-bold text-slate-500">ร้อยละรวม</p></div>
            <div className="rounded-3xl bg-sky-50 p-4"><ClipboardList className="size-5 text-sky-600" /><p className="mt-2 text-2xl font-black text-[#253364]">{report.summary.pendingReviewCount}</p><p className="text-xs font-bold text-slate-500">รอตรวจ</p></div>
          </div>
        </section>

        <section className="grid gap-4 px-6 pb-6 md:grid-cols-3 print:px-0">
          <div className="rounded-3xl border border-slate-100 p-4 md:col-span-2">
            <h2 className="text-lg font-black text-[#253364]">สรุปคะแนน</h2>
            <div className="mt-4 h-4 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-violet-500" style={{ width: `${Math.min(100, report.summary.percent)}%` }} />
            </div>
            <div className="mt-4 grid gap-3 text-sm font-semibold text-slate-500 sm:grid-cols-3">
              <p className="rounded-2xl bg-slate-50 p-3">คะแนนรวม<br /><span className="text-lg font-black text-[#253364]">{report.summary.earnedScore}/{report.summary.possibleScore}</span></p>
              <p className="rounded-2xl bg-slate-50 p-3">ร้อยละ<br /><span className="text-lg font-black text-[#253364]">{report.summary.percent}%</span></p>
              <p className="rounded-2xl bg-slate-50 p-3">ระดับ<br /><span className="text-lg font-black text-[#253364]">{report.summary.gradeLabel}</span></p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-100 p-4">
            <h2 className="text-lg font-black text-[#253364]">สูตรคะแนนที่ใช้</h2>
            <div className="mt-3 space-y-2 text-xs font-semibold text-slate-500">
              {report.scoringPolicy.categories.map((category) => (
                <p key={category.key} className="rounded-2xl bg-slate-50 p-2">{category.label}: <span className="font-black text-[#253364]">{category.weight}%</span></p>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 pb-6 print:px-0">
          <h2 className="text-lg font-black text-[#253364]">รายการงานและคะแนน</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[720px] border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs text-slate-400">
                  <th className="rounded-l-2xl px-3 py-3">วันที่</th>
                  <th className="px-3 py-3">งาน/ภารกิจ</th>
                  <th className="px-3 py-3">รายวิชา</th>
                  <th className="px-3 py-3 text-center">หมวด</th>
                  <th className="px-3 py-3 text-center">คะแนน</th>
                  <th className="rounded-r-2xl px-3 py-3 text-center">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.assignments.map((assignment) => (
                  <tr key={assignment.assignmentId}>
                    <td className="px-3 py-3 text-xs font-semibold text-slate-400">{formatThaiDate(assignment.activityDate)}</td>
                    <td className="px-3 py-3 font-extrabold text-[#253364]">{assignment.title}</td>
                    <td className="px-3 py-3 text-slate-500">{assignment.subjectName}</td>
                    <td className="px-3 py-3 text-center text-xs font-bold text-slate-500">{assignment.category} · {assignment.categoryWeight}%</td>
                    <td className="px-3 py-3 text-center font-black text-[#253364]">{scoreText(assignment.score, assignment.maxScore)}</td>
                    <td className="px-3 py-3 text-center"><span className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${statusStyles[assignment.status]}`}>{statusLabels[assignment.status]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-4 px-6 pb-6 md:grid-cols-2 print:px-0">
          <div className="rounded-3xl bg-rose-50 p-5">
            <h2 className="text-lg font-black text-rose-800">งานที่ควรติดตาม</h2>
            <div className="mt-3 space-y-2">
              {todoAssignments.length > 0 ? todoAssignments.map((assignment) => (
                <p key={assignment.assignmentId} className="rounded-2xl bg-white p-3 text-sm font-bold text-rose-700">{assignment.title} · {statusLabels[assignment.status]}</p>
              )) : <p className="rounded-2xl bg-white p-3 text-sm font-bold text-emerald-700">ไม่มีงานค้างในตัวกรองนี้</p>}
            </div>
          </div>
          <div className="rounded-3xl bg-violet-50 p-5"><h2 className="text-lg font-black text-violet-800">สรุปผลการเรียน</h2><div className="mt-3 space-y-2"><p className="rounded-2xl bg-white p-3 text-sm font-bold text-violet-700">คะแนนที่นับ {report.summary.earnedScore}/{report.summary.possibleScore}</p><p className="rounded-2xl bg-white p-3 text-sm font-bold text-violet-700">ผลประเมิน {report.summary.gradeLabel}</p><p className="rounded-2xl bg-white p-3 text-sm font-bold text-violet-700">รอตรวจ {report.summary.pendingReviewCount} งาน</p></div></div>
        </section>

        <footer className="border-t border-slate-100 px-6 py-4 text-center text-xs font-semibold text-slate-400 print:px-0">
          รายงานนี้สร้างจาก {appBrand.name} ตามข้อมูลที่บันทึกในระบบ ณ วันที่พิมพ์
        </footer>
      </article>
    </div>
  );
}
