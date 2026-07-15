import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, CalendarDays, GraduationCap, Users } from "lucide-react";
import { saveAcademicTermAction } from "@/actions/management";
import { ManagementShell } from "@/components/management/management-shell";
import { SubmitButton } from "@/components/management/submit-button";
import { ScoringPolicyForm } from "@/components/settings/scoring-policy-form";
import { getManagementData } from "@/lib/management/get-management-data";
import { getScoringPolicy } from "@/lib/settings/scoring-policy";

export const metadata: Metadata = { title: "ตั้งค่า" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [data, scoring] = await Promise.all([getManagementData(), getScoringPolicy()]);
  const disabled = data.source !== "supabase";
  const activeTerm = data.terms.find((term) => term.isActive) ?? data.terms[0];
  const activeClassrooms = data.classrooms.filter((item) => item.isActive).length;
  const activeStudents = data.students.filter((item) => item.status === "active").length;
  const activeSubjects = data.subjects.filter((item) => item.isActive).length;

  return (
    <ManagementShell eyebrow="ตั้งค่าระบบ" title="ตั้งค่า" description="ตั้งค่าปีการศึกษา ภาคเรียน สูตรคะแนน น้ำหนักหมวด และเกณฑ์ระดับที่ใช้กับสมุดคะแนน" source={data.source} notice={data.notice ?? scoring.notice}>
      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
        <section className="grid content-start gap-5">
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/classrooms" className="rounded-[28px] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"><GraduationCap className="size-6 text-violet-600" /><p className="mt-3 text-3xl font-black text-[#293562]">{activeClassrooms}</p><p className="font-bold text-slate-500">ห้องเรียนที่เปิดใช้งาน</p></Link>
            <Link href="/students" className="rounded-[28px] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"><Users className="size-6 text-sky-600" /><p className="mt-3 text-3xl font-black text-[#293562]">{activeStudents}</p><p className="font-bold text-slate-500">นักเรียนกำลังเรียน</p></Link>
            <Link href="/subjects" className="rounded-[28px] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"><BookOpen className="size-6 text-emerald-600" /><p className="mt-3 text-3xl font-black text-[#293562]">{activeSubjects}</p><p className="font-bold text-slate-500">รายวิชาที่เปิดใช้งาน</p></Link>
          </div>

          <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_50px_rgba(44,55,105,0.1)]">
            <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-violet-50 text-violet-600"><CalendarDays className="size-5" /></span><div><h2 className="text-lg font-black text-[#293562]">ปีการศึกษาและภาคเรียน</h2><p className="text-sm font-semibold text-slate-400">ใช้เป็นตัวกรองหลักของ Dashboard และห้องเรียน</p></div></div>
            <div className="mt-4 grid gap-2">
              {data.terms.map((term) => (
                <div key={term.id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
                  <p className="font-extrabold text-[#293562]">ปีการศึกษา {term.academicYear} · ภาคเรียนที่ {term.semester}</p>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${term.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{term.isActive ? "ใช้งานอยู่" : "สำรอง"}</span>
                </div>
              ))}
            </div>
          </section>

          <ScoringPolicyForm scoring={scoring} disabled={disabled} />
        </section>

        <aside className="grid content-start gap-4">
          <form action={saveAcademicTermAction} className="rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_18px_50px_rgba(44,55,105,0.12)]">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-violet-500">เพิ่มภาคเรียน</p>
            <h2 className="mt-1 text-lg font-black text-[#293562]">ตั้งค่าช่วงเวลาหลัก</h2>
            <div className="mt-5 grid gap-3">
              <label className="grid gap-1.5 text-sm font-bold text-slate-600">ปีการศึกษา<input name="academicYear" type="number" min="2500" max="2700" defaultValue={activeTerm?.academicYear ?? 2569} disabled={disabled} className="h-11 rounded-2xl border border-slate-200 px-3 text-sm outline-none focus:border-violet-300" /></label>
              <label className="grid gap-1.5 text-sm font-bold text-slate-600">ภาคเรียน<select name="semester" defaultValue={activeTerm?.semester ?? 1} disabled={disabled} className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-violet-300"><option value={1}>ภาคเรียนที่ 1</option><option value={2}>ภาคเรียนที่ 2</option></select></label>
              <label className="flex items-center gap-2 rounded-2xl bg-violet-50 px-3 py-3 text-sm font-bold text-violet-700"><input type="checkbox" name="isActive" value="true" defaultChecked disabled={disabled} className="size-4 accent-violet-600" /> ตั้งเป็นภาคเรียนที่ใช้งานอยู่</label>
            </div>
            <div className="mt-5"><SubmitButton disabled={disabled}>บันทึกภาคเรียน</SubmitButton></div>
          </form>
          <div className="rounded-[28px] bg-white/70 p-5 ring-1 ring-white">
            <h2 className="text-sm font-black text-[#293562]">สูตรคะแนนที่ใช้อยู่</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">{scoring.policy.categories.map((category) => `${category.label} ${category.weight}%`).join(" · ")}</p>
            <p className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs font-bold text-slate-500">
              งานยังไม่ส่ง: {scoring.policy.missingScorePolicy === "count_zero" ? "นับเป็น 0 คะแนน" : "ยังไม่นับฐานคะแนน"}
            </p>
          </div>
        </aside>
      </div>
    </ManagementShell>
  );
}
