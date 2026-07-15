import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertCircle, ArrowLeft, BookOpen, ClipboardList, Users } from "lucide-react";
import { ManagementShell } from "@/components/management/management-shell";
import { StudentAvatar } from "@/components/students/student-avatar";
import { getClassroomDetail, getManagementData } from "@/lib/management/get-management-data";

export const metadata: Metadata = { title: "รายละเอียดห้องเรียน" };
export const dynamic = "force-dynamic";

type ClassroomDetailPageProps = {
  params: Promise<{ classroomId: string }>;
};

export default async function ClassroomDetailPage({ params }: ClassroomDetailPageProps) {
  const { classroomId } = await params;
  const [data, classroom] = await Promise.all([getManagementData(), getClassroomDetail(classroomId)]);
  if (!classroom) notFound();

  return (
    <ManagementShell eyebrow="รายละเอียดห้องเรียน" title={`ป.${classroom.gradeLevel}/${classroom.room} · ${classroom.name}`} description={`${classroom.termLabel} รวมข้อมูลนักเรียน วิชา งานล่าสุด และค่าเฉลี่ยเบื้องต้นของห้องนี้`} source={data.source} notice={data.notice}>
      <div className="mt-5">
        <Link href="/classrooms" className="inline-flex items-center gap-2 text-sm font-extrabold text-violet-700"><ArrowLeft className="size-4" /> กลับหน้าห้องเรียน</Link>
      </div>
      <section className="mt-5 grid gap-4 md:grid-cols-4">
        <div className="rounded-[24px] bg-white p-5 shadow-sm"><Users className="size-5 text-sky-600" /><p className="mt-3 text-2xl font-black text-[#293562]">{classroom.studentCount}</p><p className="text-sm font-bold text-slate-500">นักเรียน</p></div>
        <div className="rounded-[24px] bg-white p-5 shadow-sm"><BookOpen className="size-5 text-violet-600" /><p className="mt-3 text-2xl font-black text-[#293562]">{classroom.subjectCount}</p><p className="text-sm font-bold text-slate-500">รายวิชา</p></div>
        <div className="rounded-[24px] bg-white p-5 shadow-sm"><ClipboardList className="size-5 text-emerald-600" /><p className="mt-3 text-2xl font-black text-[#293562]">{classroom.assignmentCount}</p><p className="text-sm font-bold text-slate-500">งาน</p></div>
        <div className="rounded-[24px] bg-white p-5 shadow-sm"><AlertCircle className="size-5 text-amber-500" /><p className="mt-3 text-2xl font-black text-[#293562]">{classroom.pendingCount}</p><p className="text-sm font-bold text-slate-500">ต้องจัดการ</p></div>
      </section>
      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(330px,0.85fr)]">
        <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_50px_rgba(44,55,105,0.1)]">
          <h2 className="text-lg font-black text-[#293562]">รายชื่อนักเรียน</h2>
          <div className="mt-4 grid gap-2">
            {classroom.students.map((student) => (
              <div key={student.id} className="grid grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl bg-slate-50 p-3">
                <StudentAvatar student={student} size="sm" showNumber />
                <div className="min-w-0"><p className="truncate text-sm font-extrabold text-[#293562]">{student.firstName} {student.lastName}</p><p className="truncate text-xs font-semibold text-slate-400">{student.studentCode} · {student.nickname ?? "ไม่มีชื่อเล่น"}</p></div>
                <Link href={`/students/${student.id}`} className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-extrabold text-violet-700">ดูคะแนน</Link>
              </div>
            ))}
          </div>
        </section>
        <aside className="grid content-start gap-5">
          <section className="rounded-[28px] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-[#293562]">รายวิชา</h2>
            <div className="mt-4 grid gap-3">{classroom.subjects.map((subject) => <div key={subject.id} className="rounded-2xl bg-slate-50 p-3"><p className="font-extrabold text-[#293562]">{subject.name}</p><p className="text-xs font-semibold text-slate-400">{subject.assignmentCount} งาน · คะแนนเต็มรวม {subject.totalMaxScore}</p></div>)}</div>
          </section>
          <section className="rounded-[28px] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-[#293562]">งานล่าสุด</h2>
            <div className="mt-4 grid gap-3">{classroom.recentAssignments.map((assignment) => <div key={assignment.id} className="rounded-2xl bg-violet-50 p-3"><p className="font-extrabold text-[#293562]">{assignment.title}</p><p className="text-xs font-semibold text-violet-500">{assignment.subjectName} · {assignment.maxScore} คะแนน · {assignment.activityDate}</p></div>)}</div>
          </section>
        </aside>
      </div>
    </ManagementShell>
  );
}
