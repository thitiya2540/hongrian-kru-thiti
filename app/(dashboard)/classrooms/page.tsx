import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BarChart3, BookOpen, ClipboardList, Gauge, LayoutGrid, Plus, Power, Search, Users, Zap } from "lucide-react";
import { toggleClassroomAction } from "@/actions/management";
import { ClassroomForm } from "@/components/management/classroom-form";
import { ConfirmSubmit } from "@/components/management/confirm-submit";
import { ManagementShell } from "@/components/management/management-shell";
import { getManagementData } from "@/lib/management/get-management-data";
import type { ClassroomSummary } from "@/types/management";

export const metadata: Metadata = { title: "ห้องเรียน" };
export const dynamic = "force-dynamic";

export default async function ClassroomsPage() {
  const data = await getManagementData();
  const disabled = data.source !== "supabase";
  const activeClassrooms = data.classrooms.filter((classroom) => classroom.isActive);
  const totalStudents = activeClassrooms.reduce((sum, classroom) => sum + classroom.studentCount, 0);
  const totalSubjects = activeClassrooms.reduce((sum, classroom) => sum + classroom.subjectCount, 0);
  const totalPending = activeClassrooms.reduce((sum, classroom) => sum + classroom.pendingCount, 0);
  const totalAssignments = activeClassrooms.reduce((sum, classroom) => sum + classroom.assignmentCount, 0);

  return (
    <ManagementShell eyebrow="แผงจัดการห้องเรียน" title="ห้องเรียน" description="เลือกห้องเพื่อจัดการนักเรียน บันทึกคะแนน ดูงานค้าง และเปิดรายงานของแต่ละห้องได้จากหน้าเดียว" source={data.source} notice={data.notice}>
      <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={LayoutGrid} label="ห้องที่เปิดใช้งาน" value={`${activeClassrooms.length} ห้อง`} helper={`ทั้งหมด ${data.classrooms.length} ห้อง`} tone="violet" />
        <SummaryCard icon={Users} label="นักเรียนในระบบ" value={`${totalStudents} คน`} helper="นับเฉพาะห้องที่เปิดใช้งาน" tone="sky" />
        <SummaryCard icon={BookOpen} label="รายวิชาที่เชื่อมแล้ว" value={`${totalSubjects} รายการ`} helper="รวมตามทุกห้องเรียน" tone="emerald" />
        <SummaryCard icon={Gauge} label="งานที่ต้องตามต่อ" value={`${totalPending} รายการ`} helper={`จากงานทั้งหมด ${totalAssignments} งาน`} tone="amber" />
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="space-y-4">
          <div className="flex flex-col gap-3 rounded-[24px] border border-white/80 bg-white/85 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-[#293562]">ห้องเรียนของฉัน</h2>
              <p className="mt-1 text-sm font-semibold text-slate-400">กดการ์ดห้องเพื่อดูรายละเอียด หรือใช้ปุ่มลัดเพื่อไปงานที่ทำบ่อย</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/students" className="inline-flex h-10 items-center gap-2 rounded-2xl bg-slate-100 px-3 text-sm font-extrabold text-slate-600 transition hover:bg-violet-50 hover:text-violet-700"><Search className="size-4" /> ค้นหานักเรียน</Link>
              <a href="#add-classroom" className="inline-flex h-10 items-center gap-2 rounded-2xl bg-[#6956d9] px-3 text-sm font-extrabold text-white shadow-[0_10px_22px_rgba(105,86,217,0.2)]"><Plus className="size-4" /> เพิ่มห้อง</a>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {data.classrooms.map((classroom) => (
            <ClassroomCard key={classroom.id} classroom={classroom} />
          ))}
          </div>
        </section>

        <aside id="add-classroom" className="grid content-start gap-4">
          <div className="rounded-[24px] border border-white/80 bg-white/80 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-violet-50 text-violet-600"><Plus className="size-5" /></span>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-violet-500">เพิ่มห้องเรียน</p>
                <h2 className="text-lg font-black text-[#293562]">สร้างห้องใหม่</h2>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-500">ใช้เมื่อต้องเปิดปี/ห้องใหม่ ข้อมูลห้องเดิมควรปิดใช้งานแทนการลบเพื่อเก็บประวัติคะแนนไว้ตรวจย้อนหลัง</p>
          </div>
          <ClassroomForm terms={data.terms} disabled={disabled} compact />
          <div className="rounded-[24px] border border-amber-100 bg-amber-50/80 p-4">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white text-amber-600"><Power className="size-5" /></span>
              <div>
                <h2 className="text-sm font-black text-amber-900">การปิดใช้งาน</h2>
                <p className="mt-1 text-sm leading-6 text-amber-800/80">ห้องที่ปิดแล้วจะยังเก็บนักเรียน งาน คะแนน และประวัติเดิมไว้ครบ เหมาะกับห้องเก่าหรือภาคเรียนที่จบแล้ว</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </ManagementShell>
  );
}

type SummaryTone = "violet" | "sky" | "emerald" | "amber";

const summaryToneClasses: Record<SummaryTone, string> = {
  violet: "bg-violet-50 text-violet-700",
  sky: "bg-sky-50 text-sky-700",
  emerald: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
};

function SummaryCard({ icon: Icon, label, value, helper, tone }: { icon: typeof LayoutGrid; label: string; value: string; helper: string; tone: SummaryTone }) {
  return (
    <article className="rounded-[24px] border border-white/80 bg-white p-4 shadow-sm">
      <div className={`grid size-11 place-items-center rounded-2xl ${summaryToneClasses[tone]}`}>
        <Icon className="size-5" />
      </div>
      <p className="mt-4 text-2xl font-black text-[#293562]">{value}</p>
      <p className="mt-1 text-sm font-extrabold text-slate-600">{label}</p>
      <p className="mt-1 text-xs font-semibold text-slate-400">{helper}</p>
    </article>
  );
}

function ClassroomCard({ classroom }: { classroom: ClassroomSummary }) {
  const activeClass = classroom.isActive ? "hover:-translate-y-0.5 hover:shadow-[0_18px_45px_rgba(44,55,105,0.14)]" : "opacity-65";
  const pendingTone = classroom.pendingCount > 0 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700";

  return (
    <article className={`group overflow-hidden rounded-[26px] border border-white/80 bg-white shadow-sm transition ${activeClass}`}>
      <Link href={`/classrooms/${classroom.id}`} className="block">
        <div className="h-2" style={{ backgroundColor: classroom.color }} />
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-full px-3 py-1 text-xs font-extrabold text-white" style={{ backgroundColor: classroom.color }}>ป.{classroom.gradeLevel}/{classroom.room}</span>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold ${classroom.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{classroom.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}</span>
              </div>
              <h2 className="mt-3 truncate text-xl font-black text-[#293562]">{classroom.name}</h2>
              <p className="mt-1 text-xs font-semibold text-slate-400">{classroom.termLabel} · งานล่าสุด {classroom.latestActivityLabel}</p>
            </div>
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-slate-50 text-slate-400 transition group-hover:bg-violet-50 group-hover:text-violet-700">
              <ArrowRight className="size-5" />
            </span>
          </div>

          <div className="mt-5 grid grid-cols-[1fr_1fr] gap-3">
            <div className="rounded-2xl bg-sky-50 p-3">
              <Users className="size-4 text-sky-600" />
              <p className="mt-2 text-2xl font-black text-[#293562]">{classroom.studentCount}</p>
              <p className="text-xs font-bold text-slate-500">นักเรียน</p>
            </div>
            <div className={`rounded-2xl p-3 ${pendingTone}`}>
              <Zap className="size-4" />
              <p className="mt-2 text-2xl font-black text-[#293562]">{classroom.pendingCount}</p>
              <p className="text-xs font-bold">{classroom.pendingCount > 0 ? "ต้องตามต่อ" : "เรียบร้อย"}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-bold text-slate-500">
            <div className="rounded-2xl bg-slate-50 px-3 py-2"><BookOpen className="mr-1 inline size-3.5 text-violet-600" />{classroom.subjectCount} รายวิชา</div>
            <div className="rounded-2xl bg-slate-50 px-3 py-2"><ClipboardList className="mr-1 inline size-3.5 text-emerald-600" />{classroom.assignmentCount} งาน</div>
          </div>
        </div>
      </Link>

      <div className="grid grid-cols-3 gap-2 border-t border-slate-100 p-3">
        <Link href={`/students?classroom=${classroom.id}`} className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-50 text-xs font-extrabold text-slate-600 transition hover:bg-sky-50 hover:text-sky-700">นักเรียน</Link>
        <Link href={`/quick-score?classroom=${classroom.id}`} className="inline-flex h-10 items-center justify-center rounded-2xl bg-violet-50 text-xs font-extrabold text-violet-700 transition hover:bg-violet-100">บันทึกคะแนน</Link>
        <Link href={`/reports?classroom=${classroom.id}`} className="inline-flex h-10 items-center justify-center gap-1 rounded-2xl bg-slate-50 text-xs font-extrabold text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-700"><BarChart3 className="size-3.5" /> รายงาน</Link>
      </div>

      <form action={toggleClassroomAction} className="border-t border-slate-100 px-3 pb-3">
        <input type="hidden" name="id" value={classroom.id} />
        <input type="hidden" name="isActive" value={(!classroom.isActive).toString()} />
        <ConfirmSubmit message={classroom.isActive ? "ปิดใช้งานห้องเรียนนี้หรือไม่ ข้อมูลเดิมจะยังอยู่" : "เปิดใช้งานห้องเรียนนี้อีกครั้งหรือไม่"}>
          {classroom.isActive ? "ปิดใช้งานห้องนี้" : "เปิดใช้งานห้องนี้"}
        </ConfirmSubmit>
      </form>
    </article>
  );
}
