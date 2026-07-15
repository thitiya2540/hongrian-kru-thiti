import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AssignmentForm } from "@/components/assignments/assignment-form";
import { ManagementShell } from "@/components/management/management-shell";
import { getAssignmentsData } from "@/lib/assignments/get-assignments-data";
import { getManagementData } from "@/lib/management/get-management-data";

export const metadata: Metadata = { title: "สร้างงานใหม่" };
export const dynamic = "force-dynamic";

export default async function NewAssignmentPage() {
  const [management, assignmentData] = await Promise.all([getManagementData(), getAssignmentsData()]);
  const disabled = assignmentData.source !== "supabase";

  return (
    <ManagementShell eyebrow="สร้างภารกิจ" title="สร้างงานใหม่" description="เลือกห้องเรียน วิชา ชื่องาน คะแนนเต็ม วันที่ทำงาน และกำหนดว่าจะเก็บงานนี้เป็นแม่แบบเพื่อใช้ซ้ำหรือไม่" source={assignmentData.source} notice={assignmentData.notice}>
      <div className="mt-5">
        <Link href="/assignments" className="inline-flex items-center gap-2 text-sm font-extrabold text-violet-700"><ArrowLeft className="size-4" /> กลับหน้ารวมงาน</Link>
      </div>
      <div className="mt-5">
        <AssignmentForm classrooms={management.classrooms.filter((item) => item.isActive)} subjects={management.subjects.filter((item) => item.isActive)} templates={assignmentData.templates} disabled={disabled} />
      </div>
    </ManagementShell>
  );
}
