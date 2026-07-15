import type { Metadata } from "next";
import Link from "next/link";
import { BookOpenCheck, Download, FileSpreadsheet, Percent, Scale, ShieldAlert, Table2 } from "lucide-react";
import { DataSourceNotice } from "@/components/management/data-source-notice";
import { GradebookFilterForm } from "@/components/gradebook/gradebook-filter-form";
import { GradebookPrintButton } from "@/components/gradebook/gradebook-print-button";
import { GradebookStatusCell } from "@/components/gradebook/gradebook-status-cell";
import { StatCard } from "@/components/ui/stat-card";
import { getGradebookData } from "@/lib/gradebook/get-gradebook-data";
import { getManagementData } from "@/lib/management/get-management-data";

export const metadata: Metadata = {
  title: "สมุดคะแนน",
};

type GradebookPageProps = {
  searchParams: Promise<{ classroom?: string; subject?: string }>;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

const riskStyles = {
  good: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  watch: "bg-amber-50 text-amber-700 ring-amber-200",
  risk: "bg-rose-50 text-rose-700 ring-rose-200",
};

const riskLabels = {
  good: "ปกติ",
  watch: "เฝ้าดู",
  risk: "เร่งติดตาม",
};

export default async function GradebookPage({ searchParams }: GradebookPageProps) {
  const params = await searchParams;
  const filters = {
    classroomId: params.classroom && params.classroom !== "all" ? params.classroom : undefined,
    subjectId: params.subject && params.subject !== "all" ? params.subject : undefined,
  };
  const [management, gradebook] = await Promise.all([getManagementData(), getGradebookData(filters)]);
  const exportParams = new URLSearchParams();
  if (filters.classroomId) exportParams.set("classroom", filters.classroomId);
  if (filters.subjectId) exportParams.set("subject", filters.subjectId);
  const exportHref = `/api/gradebook/export${exportParams.size > 0 ? `?${exportParams.toString()}` : ""}`;

  return (
    <div className="space-y-6 pb-24 print:bg-white print:pb-0">
      <section className="rounded-[32px] bg-gradient-to-br from-white via-emerald-50 to-violet-50 p-5 shadow-[0_16px_48px_rgba(46,58,112,0.08)] print:shadow-none">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-extrabold text-emerald-700 ring-1 ring-emerald-100">
              <FileSpreadsheet className="size-3.5" />
              สมุดคะแนนแบบถ่วงน้ำหนัก
            </p>
            <h1 className="mt-3 text-2xl font-extrabold text-[#253364] md:text-3xl">สมุดคะแนนรวม</h1>
            <p className="mt-1 max-w-3xl text-sm text-slate-500">
              ตารางรวมคะแนนแบบครูคุ้นเคย: นักเรียนเป็นแถว งานเป็นคอลัมน์ รวมคะแนน ร้อยละ สถานะงาน และกลุ่มที่ควรติดตามในหน้าเดียว
            </p>
            <p className="mt-3 text-xs font-semibold text-slate-400">
              {gradebook.selectedClassroomLabel} · {gradebook.selectedSubjectName} · สร้างเมื่อ {formatDateTime(gradebook.generatedAt)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 print:hidden">
            <Link href={exportHref} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-100 transition hover:bg-emerald-700">
              <Download className="size-4" />
              ส่งออก CSV
            </Link>
            <GradebookPrintButton />
          </div>
        </div>
      </section>

      <DataSourceNotice source={gradebook.source} notice={gradebook.notice} />
      <GradebookFilterForm classrooms={management.classrooms} subjects={management.subjects} filters={gradebook.filters} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="นักเรียนในสมุด" value={`${gradebook.summary.studentCount} คน`} helper={`${gradebook.summary.assignmentCount} งาน · เต็มรวม ${gradebook.summary.totalPossibleScore} คะแนน`} icon={Table2} tone="purple" />
        <StatCard label="เฉลี่ยทั้งกลุ่ม" value={`${gradebook.summary.averagePercent}%`} helper="คำนวณจากคะแนนที่นับในสมุดนี้" icon={Percent} tone="green" />
        <StatCard label="ส่งงานแล้ว" value={`${gradebook.summary.submittedRate}%`} helper="นับสถานะส่งแล้ว/ผ่าน จากช่องที่นับคะแนน" icon={BookOpenCheck} tone="amber" />
        <StatCard label="เร่งติดตาม" value={`${gradebook.summary.riskStudentCount} คน`} helper={`ขาด ${gradebook.summary.missingCount} · แก้ ${gradebook.summary.revisionCount}`} icon={ShieldAlert} tone="rose" />
      </section>

      <section className="rounded-[28px] border border-white/70 bg-white p-4 shadow-[0_16px_40px_rgba(46,58,112,0.08)]">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-[#253364]">ตารางสมุดคะแนน</h2>
            <p className="text-sm text-slate-400">
              สูตรคำนวณ: {gradebook.summary.scoringFormulaLabel}
            </p>
          </div>
          <p className="text-xs font-semibold text-slate-400 print:hidden">เลื่อนซ้าย-ขวาเพื่อดูทุกงาน</p>
        </div>

        {gradebook.columns.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <p className="text-lg font-extrabold text-[#253364]">ยังไม่มีงานในตัวกรองนี้</p>
            <p className="mt-1 text-sm text-slate-400">ลองเลือกห้องเรียน/รายวิชาใหม่ หรือสร้างงานก่อนเปิดสมุดคะแนน</p>
          </div>
        ) : (
          <div className="soft-scrollbar overflow-x-auto pb-2">
            <table className="min-w-[980px] w-full border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="text-xs text-slate-400">
                  <th className="sticky left-0 z-20 w-16 rounded-l-2xl bg-slate-50 px-3 py-3 text-center">เลขที่</th>
                  <th className="sticky left-16 z-20 min-w-48 bg-slate-50 px-3 py-3">นักเรียน</th>
                  <th className="min-w-28 bg-slate-50 px-3 py-3 text-center">รวม</th>
                  <th className="min-w-24 bg-slate-50 px-3 py-3 text-center">ร้อยละ</th>
                  <th className="min-w-28 bg-slate-50 px-3 py-3 text-center">ระดับ</th>
                  <th className="min-w-28 bg-slate-50 px-3 py-3 text-center">ติดตาม</th>
                  {gradebook.columns.map((column) => (
                    <th key={column.id} className="min-w-28 bg-slate-50 px-3 py-3 text-center align-bottom">
                      <Link href={`/assignments/${column.id}/scores`} className="group block">
                        <span className="block text-[11px] font-extrabold text-[#253364] group-hover:text-violet-700">{column.shortTitle}</span>
                        <span className="mt-1 block text-[9px] font-semibold text-slate-400">{column.classroomLabel} · {column.subjectName}</span>
                        <span className="mt-1 inline-flex rounded-full bg-white px-2 py-0.5 text-[9px] font-bold text-slate-500 ring-1 ring-slate-200">{column.maxScore} คะแนน · {column.categoryWeight}%</span>
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-[#35405f]">
                {gradebook.rows.map((row) => (
                  <tr key={row.studentId} className="group">
                    <td className="sticky left-0 z-10 border-b border-slate-100 bg-white px-3 py-3 text-center font-extrabold text-slate-500 group-hover:bg-violet-50">{row.numberInClass ?? "-"}</td>
                    <td className="sticky left-16 z-10 border-b border-slate-100 bg-white px-3 py-3 group-hover:bg-violet-50">
                      <Link href={`/students/${row.studentId}`} className="font-extrabold text-[#253364] hover:text-violet-700">{row.studentName}</Link>
                      <p className="text-xs text-slate-400">{row.classroomLabel} · {row.nickname ? `ชื่อเล่น ${row.nickname}` : row.studentCode}</p>
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3 text-center font-extrabold text-[#253364]">{row.earnedScore}/{row.possibleScore}</td>
                    <td className="border-b border-slate-100 px-3 py-3 text-center">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${row.percent >= 70 ? "bg-emerald-50 text-emerald-700" : row.percent >= 50 ? "bg-amber-50 text-amber-700" : "bg-rose-50 text-rose-700"}`}>{row.percent}%</span>
                    </td>
                    <td className="border-b border-slate-100 px-3 py-3 text-center text-xs font-bold text-slate-600">{row.gradeLabel}</td>
                    <td className="border-b border-slate-100 px-3 py-3 text-center">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-extrabold ring-1 ring-inset ${riskStyles[row.riskLevel]}`}>{riskLabels[row.riskLevel]}</span>
                    </td>
                    {row.cells.map((cell) => (
                      <td key={`${row.studentId}-${cell.assignmentId}`} className="border-b border-slate-100 px-3 py-3 text-center">
                        <GradebookStatusCell cell={cell} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_16px_40px_rgba(46,58,112,0.08)] xl:col-span-2">
          <h2 className="text-lg font-extrabold text-[#253364]">อันดับคะแนนรวม</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {[...gradebook.rows].sort((a, b) => b.percent - a.percent).slice(0, 6).map((row, index) => (
              <Link key={row.studentId} href={`/students/${row.studentId}`} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/80 p-3 transition hover:border-violet-200 hover:bg-violet-50">
                <div>
                  <p className="text-sm font-extrabold text-[#253364]">{index + 1}. {row.studentName}</p>
                  <p className="text-xs text-slate-400">{row.classroomLabel} · ส่ง {row.submittedCount}/{gradebook.columns.length} งาน</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-extrabold text-emerald-700">{row.percent}%</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_16px_40px_rgba(46,58,112,0.08)]">
          <h2 className="text-lg font-extrabold text-[#253364]">สูตรที่ใช้อยู่</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-500">
            <p className="rounded-2xl bg-emerald-50 p-3 text-emerald-700"><strong>น้ำหนัก:</strong> {gradebook.scoringPolicy.categories.map((category) => `${category.label} ${category.weight}%`).join(" · ")}</p>
            <p className="rounded-2xl bg-sky-50 p-3 text-sky-700"><strong>ไม่นับฐานคะแนน:</strong> ลา, ยกเว้น</p>
            <p className="rounded-2xl bg-amber-50 p-3 text-amber-700"><strong>งานยังไม่ส่ง:</strong> {gradebook.scoringPolicy.missingScorePolicy === "count_zero" ? "คิดเป็น 0 คะแนน" : "ยังไม่นับฐานคะแนน"}</p>
            <p className="flex items-center gap-2 rounded-2xl bg-violet-50 p-3 text-violet-700"><Scale className="size-4" /> เกณฑ์ระดับ: {gradebook.scoringPolicy.gradeBands.map((band) => `${band.label} ≥ ${band.minPercent}%`).join(" · ")}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
