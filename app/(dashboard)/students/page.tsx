import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { updateStudentStatusAction } from "@/actions/management";
import { ConfirmSubmit } from "@/components/management/confirm-submit";
import { ManagementShell } from "@/components/management/management-shell";
import { StudentForm } from "@/components/management/student-form";
import { StudentAvatar } from "@/components/students/student-avatar";
import { StudentCsvImport } from "@/components/students/student-csv-import";
import { getManagementData } from "@/lib/management/get-management-data";

export const metadata: Metadata = { title: "นักเรียน" };
export const dynamic = "force-dynamic";

type StudentsPageProps = {
  searchParams: Promise<{ q?: string; classroom?: string }>;
};

const statusLabels = {
  active: "กำลังเรียน",
  transferred: "ย้ายออก",
  graduated: "จบการศึกษา",
  inactive: "ปิดใช้งาน",
};

export default async function StudentsPage({ searchParams }: StudentsPageProps) {
  const [{ q, classroom }, data] = await Promise.all([searchParams, getManagementData()]);
  const disabled = data.source !== "supabase";
  const query = (q ?? "").trim().toLowerCase();
  const filtered = data.students.filter((student) => {
    const matchesQuery = !query || `${student.studentCode} ${student.firstName} ${student.lastName} ${student.nickname ?? ""}`.toLowerCase().includes(query);
    const matchesClassroom = !classroom || student.classroomId === classroom;
    return matchesQuery && matchesClassroom;
  });

  return (
    <ManagementShell eyebrow="ทะเบียนนักเรียน" title="นักเรียน" description="ค้นหา กรอง เพิ่ม แก้ไข และเปลี่ยนสถานะนักเรียน โดยยังเก็บประวัติเดิมไว้เมื่อย้ายออกหรือปิดใช้งาน" source={data.source} notice={data.notice}>
      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_410px]">
        <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_50px_rgba(44,55,105,0.12)]">
          <form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto]">
            <label className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input name="q" defaultValue={q} placeholder="ค้นหาชื่อ รหัสนักเรียน หรือชื่อเล่น" className="h-11 w-full rounded-2xl border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-violet-300" />
            </label>
            <select name="classroom" defaultValue={classroom ?? ""} className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 outline-none focus:border-violet-300">
              <option value="">ทุกห้องเรียน</option>
              {data.classrooms.map((item) => <option key={item.id} value={item.id}>ป.{item.gradeLevel}/{item.room}</option>)}
            </select>
            <button type="submit" className="h-11 rounded-2xl bg-violet-100 px-4 text-sm font-extrabold text-violet-700">กรอง</button>
          </form>

          <div className="mt-5 grid gap-3">
            {filtered.map((student) => (
              <article key={student.id} className="grid gap-3 rounded-3xl bg-slate-50 p-3 sm:grid-cols-[56px_minmax(0,1fr)_auto] sm:items-center">
                <StudentAvatar student={student} showNumber />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-base font-black text-[#293562]">{student.firstName} {student.lastName}</h2>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-slate-500">{statusLabels[student.status]}</span>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-slate-400">{student.studentCode} · {student.classroomLabel} · ชื่อเล่น {student.nickname ?? "-"}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
                    <span className="rounded-full bg-rose-50 px-2.5 py-1 text-rose-700">ค้าง {student.missingCount}</span>
                    <span className="rounded-full bg-orange-50 px-2.5 py-1 text-orange-700">แก้งาน {student.revisionCount}</span>
                  </div>
                </div>
                <form action={updateStudentStatusAction} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={student.id} />
                  <input type="hidden" name="status" value={student.status === "active" ? "inactive" : "active"} />
                  <ConfirmSubmit message={student.status === "active" ? "ปิดใช้งานนักเรียนคนนี้หรือไม่ ข้อมูลคะแนนเดิมจะยังอยู่" : "เปิดใช้งานนักเรียนคนนี้อีกครั้งหรือไม่"}>
                    {student.status === "active" ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                  </ConfirmSubmit>
                  <Link href={`/students/${student.id}`} className="inline-flex h-9 items-center rounded-xl bg-violet-50 px-3 text-xs font-extrabold text-violet-700">โปรไฟล์</Link>
                </form>
              </article>
            ))}
          </div>
        </section>
        <aside className="grid content-start gap-4">
          <StudentForm classrooms={data.classrooms.filter((item) => item.isActive)} disabled={disabled} />
          <StudentCsvImport classrooms={data.classrooms.filter((item) => item.isActive)} disabled={disabled} />
        </aside>
      </div>
    </ManagementShell>
  );
}
