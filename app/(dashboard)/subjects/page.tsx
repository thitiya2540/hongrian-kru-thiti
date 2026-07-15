import type { Metadata } from "next";
import { BookOpen, ClipboardList, Link2 } from "lucide-react";
import { toggleSubjectAction } from "@/actions/management";
import { ConfirmSubmit } from "@/components/management/confirm-submit";
import { ManagementShell } from "@/components/management/management-shell";
import { SubjectClassroomForm, SubjectForm } from "@/components/management/subject-form";
import { getManagementData } from "@/lib/management/get-management-data";

export const metadata: Metadata = { title: "รายวิชา" };
export const dynamic = "force-dynamic";

export default async function SubjectsPage() {
  const data = await getManagementData();
  const disabled = data.source !== "supabase";

  return (
    <ManagementShell eyebrow="จัดการรายวิชา" title="รายวิชา" description="จัดการรายวิชา สี ไอคอน และเชื่อมรายวิชากับหลายห้องเรียน เพื่อใช้ต่อในระบบสร้างงานและบันทึกคะแนน" source={data.source} notice={data.notice}>
      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
        <section className="grid gap-4 lg:grid-cols-2">
          {data.subjects.map((subject) => (
            <article key={subject.id} className={`rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_18px_50px_rgba(44,55,105,0.12)] ${subject.isActive ? "" : "opacity-60"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="grid size-12 place-items-center rounded-2xl text-white" style={{ backgroundColor: subject.color }}><BookOpen className="size-5" /></span>
                  <div><h2 className="text-lg font-black text-[#293562]">{subject.name}</h2><p className="text-xs font-bold text-slate-400">{subject.subjectCode} · {subject.icon}</p></div>
                </div>
                <form action={toggleSubjectAction}>
                  <input type="hidden" name="id" value={subject.id} />
                  <input type="hidden" name="isActive" value={(!subject.isActive).toString()} />
                  <ConfirmSubmit message={subject.isActive ? "ปิดใช้งานรายวิชานี้หรือไม่ งานเดิมจะยังอยู่" : "เปิดใช้งานรายวิชานี้อีกครั้งหรือไม่"}>{subject.isActive ? "ปิด" : "เปิด"}</ConfirmSubmit>
                </form>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-violet-50 p-3"><Link2 className="size-4 text-violet-600" /><p className="mt-2 text-xl font-black text-[#293562]">{subject.classroomLabels.length}</p><p className="text-xs font-bold text-slate-500">ห้องเรียน</p></div>
                <div className="rounded-2xl bg-emerald-50 p-3"><ClipboardList className="size-4 text-emerald-600" /><p className="mt-2 text-xl font-black text-[#293562]">{subject.assignmentCount}</p><p className="text-xs font-bold text-slate-500">งาน</p></div>
              </div>
              <p className="mt-4 text-sm font-semibold text-slate-500">เชื่อมอยู่กับ {subject.classroomLabels.length ? subject.classroomLabels.join(", ") : "ยังไม่เชื่อมห้องเรียน"}</p>
              <div className="mt-4"><SubjectClassroomForm subject={subject} classrooms={data.classrooms.filter((item) => item.isActive)} disabled={disabled} /></div>
            </article>
          ))}
        </section>
        <aside className="grid content-start gap-4">
          <SubjectForm disabled={disabled} />
          <div className="rounded-[28px] bg-white/70 p-5 ring-1 ring-white"><h2 className="text-sm font-black text-[#293562]">แนวทางใช้งาน</h2><p className="mt-2 text-sm leading-6 text-slate-500">หนึ่งรายวิชาสามารถเชื่อมหลายห้องได้ เหมาะกับวิชาชื่อเดียวกันที่สอนหลายระดับหรือหลายห้อง</p></div>
        </aside>
      </div>
    </ManagementShell>
  );
}
