import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";
import { ManagementShell } from "@/components/management/management-shell";
import { StudentForm } from "@/components/management/student-form";
import { StudentAssignmentList } from "@/components/students/student-assignment-list";
import { StudentProfileCard } from "@/components/students/student-profile-card";
import { getManagementData } from "@/lib/management/get-management-data";
import { getStudentProfileData } from "@/lib/students/get-student-profile-data";

export const metadata: Metadata = { title: "โปรไฟล์นักเรียน" };
export const dynamic = "force-dynamic";

type StudentProfilePageProps = {
  params: Promise<{ studentId: string }>;
};

export default async function StudentProfilePage({ params }: StudentProfilePageProps) {
  const { studentId } = await params;
  const [profile, management] = await Promise.all([getStudentProfileData(studentId), getManagementData()]);
  if (!profile) notFound();
  const disabled = management.source !== "supabase";

  return (
    <ManagementShell eyebrow="ข้อมูลรายบุคคล" title="โปรไฟล์นักเรียน" description="ดูคะแนนรายวิชา งานค้าง สถานะการส่งงาน และประวัติคะแนนของนักเรียนรายบุคคล" source={profile.source} notice={profile.notice}>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <Link href="/students" className="inline-flex items-center gap-2 text-sm font-extrabold text-violet-700"><ArrowLeft className="size-4" /> กลับหน้านักเรียน</Link>
        <Link href={`/students/${studentId}/report`} className="inline-flex items-center gap-2 rounded-2xl bg-[#6956d9] px-4 py-2 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(105,86,217,0.24)] transition hover:bg-[#5d4dc7]">
          <FileText className="size-4" />
          รายงานรายบุคคล
        </Link>
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)]">
        <div className="grid content-start gap-5"><StudentProfileCard profile={profile} /></div>
        <div className="grid content-start gap-5">
          <StudentForm classrooms={management.classrooms.filter((item) => item.isActive)} student={profile.student} disabled={disabled} />
          <StudentAssignmentList title="งานที่ต้องจัดการ" items={profile.todoAssignments} />
          <StudentAssignmentList title="ประวัติคะแนนล่าสุด" items={profile.history} />
        </div>
      </div>
    </ManagementShell>
  );
}
