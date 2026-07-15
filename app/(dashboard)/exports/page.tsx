import type { Metadata } from "next";
import Link from "next/link";
import { Archive, ClipboardCheck, Download, FileDown, FileSpreadsheet, Printer, ShieldCheck } from "lucide-react";
import { ExportFilterForm } from "@/components/export-center/export-filter-form";
import { DataSourceNotice } from "@/components/management/data-source-notice";
import { StatCard } from "@/components/ui/stat-card";
import { getExportCenterData, parseExportCenterFilters } from "@/lib/export-center/get-export-center-data";
import { getManagementData } from "@/lib/management/get-management-data";
import type { ExportOption } from "@/types/export-center";

export const metadata: Metadata = { title: "ส่งออกและสำรองข้อมูล" };
export const dynamic = "force-dynamic";

type ExportsPageProps = {
  searchParams: Promise<{ classroom?: string; subject?: string }>;
};

const optionIcons = {
  backup: Archive,
  gradebook: FileSpreadsheet,
  report: FileDown,
  "print-report": Printer,
};

const toneStyles: Record<ExportOption["tone"], string> = {
  purple: "bg-violet-50 text-violet-700 ring-violet-200",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  rose: "bg-rose-50 text-rose-700 ring-rose-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
};

export default async function ExportsPage({ searchParams }: ExportsPageProps) {
  const params = await searchParams;
  const filters = parseExportCenterFilters(params);
  const [exportCenter, management] = await Promise.all([getExportCenterData(filters), getManagementData()]);

  return (
    <main className="mx-auto max-w-[1500px] space-y-6 p-4 pb-28 sm:p-6 sm:pb-28 lg:p-7 lg:pb-8 xl:p-9">
      <section className="rounded-[32px] bg-gradient-to-br from-white via-emerald-50 to-violet-50 p-5 shadow-[0_16px_48px_rgba(46,58,112,0.08)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-extrabold text-emerald-700 ring-1 ring-emerald-100">
              <Download className="size-3.5" />
              ศูนย์ส่งออกและสำรองข้อมูล
            </p>
            <h1 className="mt-3 text-2xl font-extrabold text-[#253364] md:text-3xl">ส่งออกและสำรองข้อมูล</h1>
            <p className="mt-1 max-w-3xl text-sm text-slate-500">
              รวมไฟล์ส่งออกที่ครูใช้บ่อยไว้หน้าเดียว ทั้งสำรองข้อมูลรวม สมุดคะแนน รายงานภาพรวม และหน้าพิมพ์ PDF ตามตัวกรองปัจจุบัน
            </p>
          </div>
          <DataSourceNotice source={exportCenter.source} notice={exportCenter.notice} />
        </div>
      </section>

      <ExportFilterForm filters={exportCenter.filters} classrooms={management.classrooms} subjects={management.subjects} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="ห้องเรียนในชุดข้อมูล" value={exportCenter.summary.classroomCount} helper="ตามตัวกรองปัจจุบัน" icon={Archive} tone="purple" />
        <StatCard label="นักเรียน" value={exportCenter.summary.studentCount} helper="พร้อมรหัสและเลขที่" icon={ClipboardCheck} tone="green" />
        <StatCard label="งาน / ภารกิจ" value={exportCenter.summary.assignmentCount} helper="รวมสถานะงานสำคัญ" icon={FileDown} tone="amber" />
        <StatCard label="แถวสมุดคะแนน" value={exportCenter.summary.gradebookRows} helper="ใช้ตรวจคะแนนรายคน" icon={FileSpreadsheet} tone="green" />
        <StatCard label="Watch list" value={exportCenter.summary.watchListCount} helper="นักเรียนที่ควรติดตาม" icon={ShieldCheck} tone="rose" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="grid gap-4 md:grid-cols-2">
          {exportCenter.options.map((option) => {
            const Icon = optionIcons[option.id as keyof typeof optionIcons] ?? Download;
            return (
              <article key={option.id} className="rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_16px_40px_rgba(46,58,112,0.08)]">
                <div className="flex items-start justify-between gap-4">
                  <span className={`grid size-12 place-items-center rounded-2xl ring-1 ring-inset ${toneStyles[option.tone]}`}>
                    <Icon className="size-5" />
                  </span>
                  <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-extrabold text-slate-500 ring-1 ring-slate-100">{option.fileType}</span>
                </div>
                <h2 className="mt-4 text-lg font-extrabold text-[#253364]">{option.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">{option.description}</p>
                <p className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs font-semibold text-slate-500">{option.recommendedFor}</p>
                <Link href={option.href} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#6956d9] px-4 py-3 text-sm font-extrabold text-white shadow-lg shadow-violet-100 transition hover:bg-[#5947c3]">
                  <Download className="size-4" />
                  {option.fileType === "PRINT" ? "เปิดหน้าพิมพ์" : "ดาวน์โหลดไฟล์"}
                </Link>
              </article>
            );
          })}
        </div>

        <aside className="grid content-start gap-4">
          <section className="rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_16px_40px_rgba(46,58,112,0.08)]">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-600"><ShieldCheck className="size-5" /></span>
              <div>
                <h2 className="font-extrabold text-[#253364]">Checklist ก่อนปิดภาคเรียน</h2>
                <p className="text-xs text-slate-400">ใช้ก่อนส่งออกข้อมูลจริง</p>
              </div>
            </div>
            <ul className="mt-4 space-y-2 text-sm font-semibold text-slate-500">
              <li className="rounded-2xl bg-slate-50 p-3">ตรวจตัวกรองห้องเรียน/รายวิชาก่อนดาวน์โหลด</li>
              <li className="rounded-2xl bg-slate-50 p-3">เปิดไฟล์ CSV ด้วย Excel แล้วตรวจภาษาไทยและคอลัมน์</li>
              <li className="rounded-2xl bg-slate-50 p-3">เทียบยอดรวมกับหน้า Report หรือ Gradebook ก่อนส่งต่อ</li>
              <li className="rounded-2xl bg-slate-50 p-3">เก็บไฟล์สำรองไว้ใน Drive/เครื่องส่วนตัวที่มีสิทธิ์เหมาะสม</li>
            </ul>
          </section>

          <section className="rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_16px_40px_rgba(46,58,112,0.08)]">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-amber-50 text-amber-600"><Archive className="size-5" /></span>
              <div>
                <h2 className="font-extrabold text-[#253364]">ขอบเขตไฟล์สำรองรวม</h2>
                <p className="text-xs text-slate-400">ไฟล์ส่งออกไม่แก้ไขข้อมูลต้นทาง</p>
              </div>
            </div>
            <div className="mt-4 space-y-3 text-sm font-semibold text-slate-500">
              <p className="rounded-2xl bg-violet-50 p-3 text-violet-700">มีสรุปภาพรวม ห้องเรียน นักเรียน งาน สมุดคะแนน และ Watch list</p>
              <p className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">ไฟล์เป็น CSV UTF-8 BOM เปิดกับ Excel ได้ง่ายขึ้น</p>
              <p className="rounded-2xl bg-amber-50 p-3 text-amber-700">ยังไม่รวมไฟล์แนบ/รูปภาพ เพราะระบบยังไม่มี storage สำหรับแนบหลักฐาน</p>
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}
