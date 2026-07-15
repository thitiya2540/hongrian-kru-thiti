import type { Metadata } from "next";
import Link from "next/link";
import { BookOpenCheck, CheckCircle2, ClipboardList, LockKeyhole, School, UsersRound, Zap } from "lucide-react";
import { QuickScoreWorkspace, RecentClassroomShortcut } from "@/components/assignments/quick-score-workspace";
import { ManagementShell } from "@/components/management/management-shell";
import { getAssignmentsData } from "@/lib/assignments/get-assignments-data";
import { getManagementData } from "@/lib/management/get-management-data";

export const metadata: Metadata = { title: "บันทึกคะแนนด่วน" };
export const dynamic = "force-dynamic";

type QuickScorePageProps = {
  searchParams: Promise<{ classroom?: string }>;
};

export default async function QuickScorePage({ searchParams }: QuickScorePageProps) {
  const { classroom } = await searchParams;
  const [data, management] = await Promise.all([
    getAssignmentsData(classroom ? { classroomId: classroom } : undefined),
    getManagementData(),
  ]);
  const selectedClassroom = classroom ? management.classrooms.find((item) => item.id === classroom) : undefined;
  const activeAssignments = selectedClassroom
    ? data.assignments.filter((assignment) => assignment.classroomId === selectedClassroom.id && assignment.isActive && !assignment.isLocked)
    : [];
  const lockedCount = selectedClassroom
    ? data.assignments.filter((assignment) => assignment.classroomId === selectedClassroom.id && assignment.isLocked).length
    : 0;
  const selectedClassroomStudents = selectedClassroom
    ? management.students.filter((student) => student.classroomId === selectedClassroom.id).length || selectedClassroom.studentCount
    : 0;

  return (
    <ManagementShell eyebrow="โต๊ะทำงานครู" title="บันทึกคะแนน" description="เลือกห้องเรียนเพียงครั้งเดียว แล้วจัดการงานค้างตามลำดับความเร่งด่วน บันทึกคะแนน และตรวจทานก่อนออกรายงาน" source={data.source} notice={data.notice ?? management.notice}>
      <section className="mt-6 rounded-[30px] border border-white/80 bg-white p-5 shadow-[0_18px_50px_rgba(44,55,105,0.1)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-violet-500">1 · เลือกห้อง</p>
            <h2 className="mt-1 text-xl font-black text-[#293562]">วันนี้จะบันทึกคะแนนห้องไหน</h2>
            <p className="mt-1 text-sm font-semibold text-slate-400">ระบบจะแสดงเฉพาะงานและนักเรียนของห้องที่เลือก ป้องกันการกรอกผิดห้อง</p>
          </div>
          {selectedClassroom && <Link href="/quick-score" className="w-fit rounded-2xl bg-slate-100 px-4 py-2 text-sm font-extrabold text-slate-600 transition hover:bg-violet-50 hover:text-violet-700">เปลี่ยนห้อง</Link>}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {management.classrooms.map((item) => {
            const active = item.id === selectedClassroom?.id;
            return (
              <Link key={item.id} href={`/quick-score?classroom=${item.id}`} className={`rounded-[24px] border p-4 transition hover:-translate-y-0.5 hover:shadow-lg ${active ? "border-violet-300 bg-violet-50 shadow-md ring-2 ring-violet-100" : "border-slate-100 bg-slate-50/80 hover:border-violet-200 hover:bg-white"}`}>
                <div className="flex items-center justify-between gap-3">
                  <span className="grid size-11 place-items-center rounded-2xl bg-white text-violet-600 shadow-sm"><School className="size-5" /></span>
                  {active && <span className="rounded-full bg-violet-600 px-3 py-1 text-xs font-extrabold text-white">เลือกอยู่</span>}
                </div>
                <h3 className="mt-3 text-lg font-black text-[#293562]">ป.{item.gradeLevel}/{item.room}</h3>
                <p className="text-sm font-semibold text-slate-400">{item.name}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
                  <span className="rounded-full bg-white px-2.5 py-1">นักเรียน {item.studentCount} คน</span>
                  <span className="rounded-full bg-white px-2.5 py-1">งาน {item.assignmentCount} งาน</span>
                  <span className="rounded-full bg-white px-2.5 py-1">ค้าง {item.pendingCount}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="mt-5 grid gap-4 md:grid-cols-4">
        <div className="rounded-[28px] bg-white p-5 shadow-sm"><School className="size-6 text-violet-600" /><p className="mt-3 text-2xl font-black text-[#293562]">{selectedClassroom ? `ป.${selectedClassroom.gradeLevel}/${selectedClassroom.room}` : "ยังไม่เลือก"}</p><p className="font-bold text-slate-500">ห้องที่กำลังทำงาน</p></div>
        <div className="rounded-[28px] bg-white p-5 shadow-sm"><UsersRound className="size-6 text-sky-600" /><p className="mt-3 text-3xl font-black text-[#293562]">{selectedClassroomStudents}</p><p className="font-bold text-slate-500">นักเรียนในห้อง</p></div>
        <div className="rounded-[28px] bg-white p-5 shadow-sm"><Zap className="size-6 text-violet-600" /><p className="mt-3 text-3xl font-black text-[#293562]">{activeAssignments.length}</p><p className="font-bold text-slate-500">งานที่พร้อมบันทึก</p></div>
        <div className="rounded-[28px] bg-white p-5 shadow-sm"><LockKeyhole className="size-6 text-amber-600" /><p className="mt-3 text-3xl font-black text-amber-600">{lockedCount}</p><p className="font-bold text-slate-500">งานที่ล็อกแล้ว</p></div>
      </div>

      <section className="mt-5 rounded-[30px] border border-white/80 bg-white/70 p-5 shadow-[0_18px_50px_rgba(44,55,105,0.08)]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-violet-500">2 · เลือกงาน</p>
            <h2 className="mt-1 text-xl font-black text-[#293562]">งานที่ต้องจัดการ</h2>
            <p className="text-sm font-semibold text-slate-400">{selectedClassroom ? `เรียงงานค้างของ ป.${selectedClassroom.gradeLevel}/${selectedClassroom.room} ให้ทำรายการสำคัญก่อน` : "เลือกห้องด้านบนก่อน ระบบจึงจะแสดงงานสำหรับบันทึกคะแนน"}</p>
          </div>
          {selectedClassroom && <Link href={`/assignments/new?classroom=${selectedClassroom.id}`} className="w-fit rounded-2xl border border-violet-200 bg-white px-4 py-2 text-sm font-extrabold text-violet-700 transition hover:bg-violet-50">สร้างงานใหม่</Link>}
        </div>

        {!selectedClassroom ? (
          <div className="mt-4 rounded-[28px] border border-dashed border-violet-200 bg-violet-50/50 p-8 text-center">
            <BookOpenCheck className="mx-auto size-10 text-violet-500" />
            <h3 className="mt-3 text-lg font-black text-[#293562]">เลือกห้องเรียนก่อน</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">เมื่อเลือกห้องแล้ว งานของห้องนั้นจะแสดงเป็นการ์ดให้เปิดบันทึกคะแนนได้ทันที</p>
            <RecentClassroomShortcut classrooms={management.classrooms} />
          </div>
        ) : activeAssignments.length === 0 ? (
          <div className="mt-4 rounded-[28px] border border-dashed border-amber-200 bg-amber-50/50 p-8 text-center">
            <ClipboardList className="mx-auto size-10 text-amber-500" />
            <h3 className="mt-3 text-lg font-black text-[#293562]">ยังไม่มีงานที่พร้อมบันทึกในห้องนี้</h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">อาจยังไม่มีงาน หรือทุกงานถูกล็อกแล้ว ลองสร้างงานใหม่หรือปลดล็อกงานเดิม</p>
          </div>
        ) : (
          <QuickScoreWorkspace assignments={activeAssignments} classroomId={selectedClassroom.id} studentCount={selectedClassroomStudents} />
        )}
      </section>

      {selectedClassroom ? (
        <section className="mt-5 rounded-[28px] border border-emerald-100 bg-emerald-50/70 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white text-emerald-600 shadow-sm"><CheckCircle2 className="size-5" /></span>
              <div><h2 className="font-black text-[#293562]">ขั้นถัดไปหลังบันทึกคะแนน</h2><p className="mt-1 text-sm font-semibold text-slate-500">ตรวจความครบถ้วนในรายงานของห้อง ก่อนพิมพ์หรือส่งออกข้อมูล</p></div>
            </div>
            <Link href={`/reports?classroom=${selectedClassroom.id}`} className="inline-flex h-11 items-center justify-center rounded-2xl bg-emerald-600 px-5 text-sm font-extrabold text-white transition hover:bg-emerald-700">ตรวจรายงานของห้องนี้</Link>
          </div>
        </section>
      ) : null}
    </ManagementShell>
  );
}
