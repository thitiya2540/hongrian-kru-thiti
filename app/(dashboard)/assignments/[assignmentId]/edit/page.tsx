import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AssignmentForm } from "@/components/assignments/assignment-form";
import { ManagementShell } from "@/components/management/management-shell";
import { getAssignmentById, getAssignmentsData } from "@/lib/assignments/get-assignments-data";
import { getManagementData } from "@/lib/management/get-management-data";

export const metadata: Metadata = { title: "แก้ไขงาน" };
export const dynamic = "force-dynamic";

type EditAssignmentPageProps = {
  params: Promise<{ assignmentId: string }>;
};

export default async function EditAssignmentPage({ params }: EditAssignmentPageProps) {
  const { assignmentId } = await params;
  const [management, assignmentData, assignment] = await Promise.all([getManagementData(), getAssignmentsData(), getAssignmentById(assignmentId)]);
  if (!assignment) notFound();
  const disabled = assignmentData.source !== "supabase" || assignment.isLocked;

  return (
    <ManagementShell eyebrow="แก้ไขภารกิจ" title={assignment.title} description="ปรับรายละเอียดงาน คะแนนเต็ม กำหนดส่ง หรือบันทึกเป็นแม่แบบใหม่สำหรับใช้ซ้ำในครั้งถัดไป" source={assignmentData.source} notice={assignmentData.notice}>
      <div className="mt-5">
        <Link href="/assignments" className="inline-flex items-center gap-2 text-sm font-extrabold text-violet-700"><ArrowLeft className="size-4" /> กลับหน้ารวมงาน</Link>
      </div>
      <div className="mt-5">
        <AssignmentForm classrooms={management.classrooms} subjects={management.subjects} templates={assignmentData.templates} assignment={assignment} disabled={disabled} />
      </div>
    </ManagementShell>
  );
}
