import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { AssignmentCard } from "@/components/assignments/assignment-card";
import { AssignmentFilterBar } from "@/components/assignments/assignment-filter-bar";
import { AssignmentStudentPanel } from "@/components/assignments/assignment-student-panel";
import { ManagementShell } from "@/components/management/management-shell";
import { getAssignmentStudents, getAssignmentsData, parseAssignmentFilters } from "@/lib/assignments/get-assignments-data";
import { assignmentStatusSchema } from "@/lib/validations/assignments";
import { getManagementData } from "@/lib/management/get-management-data";

export const metadata: Metadata = { title: "ภารกิจ / งาน" };
export const dynamic = "force-dynamic";

type AssignmentsPageProps = {
  searchParams: Promise<{ classroom?: string; subject?: string; type?: string; status?: string; q?: string; assignment?: string }>;
};

export default async function AssignmentsPage({ searchParams }: AssignmentsPageProps) {
  const params = await searchParams;
  const filters = parseAssignmentFilters(params);
  const [management, assignmentData] = await Promise.all([getManagementData(), getAssignmentsData(filters)]);
  const disabled = assignmentData.source !== "supabase";
  const selectedAssignment = assignmentData.assignments.find((assignment) => assignment.id === params.assignment)
    ?? (params.assignment ? (await getAssignmentsData()).assignments.find((assignment) => assignment.id === params.assignment) : undefined);
  const parsedStatus = assignmentStatusSchema.safeParse(params.status);
  const selectedStatus = parsedStatus.success ? parsedStatus.data : undefined;
  const selectedStudents = selectedAssignment ? await getAssignmentStudents(selectedAssignment.id, selectedStatus) : [];
  const activeAssignments = assignmentData.assignments.filter((assignment) => assignment.isActive).length;
  const pendingTotal = assignmentData.assignments.reduce((sum, assignment) => sum + assignment.counts.missing + assignment.counts.revision + assignment.counts.pending_review, 0);

  return (
    <ManagementShell eyebrow="จัดการงานและคะแนน" title="ภารกิจ / งาน" description="สร้างงานจากแม่แบบ คัดลอกงานเดิม กรองตามห้องเรียน วิชา ประเภท และเปิดดูรายชื่อนักเรียนตามสถานะได้ทันที" source={assignmentData.source} notice={assignmentData.notice}>
      <div className="mt-6 grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-3xl bg-white p-4 shadow-sm"><p className="text-xs font-bold text-slate-400">งานที่เปิดใช้งาน</p><p className="mt-1 text-2xl font-black text-[#293562]">{activeAssignments}</p></div>
          <div className="rounded-3xl bg-white p-4 shadow-sm"><p className="text-xs font-bold text-slate-400">ต้องจัดการ</p><p className="mt-1 text-2xl font-black text-rose-600">{pendingTotal}</p></div>
          <div className="rounded-3xl bg-white p-4 shadow-sm"><p className="text-xs font-bold text-slate-400">แม่แบบงาน</p><p className="mt-1 text-2xl font-black text-violet-700">{assignmentData.templates.length}</p></div>
        </div>
        <Link href="/assignments/new" className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#6956d9] px-5 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(105,86,217,0.24)]"><Plus className="size-4" /> สร้างงานใหม่</Link>
      </div>

      <div className="mt-5">
        <AssignmentFilterBar classrooms={management.classrooms} subjects={management.subjects} defaults={params} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
        <section className="grid content-start gap-4">
          {assignmentData.assignments.map((assignment) => <AssignmentCard key={assignment.id} assignment={assignment} disabled={disabled} />)}
          {assignmentData.assignments.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-violet-200 bg-violet-50/60 p-10 text-center">
              <h2 className="text-lg font-black text-[#293562]">ยังไม่พบงานตามตัวกรอง</h2>
              <p className="mt-2 text-sm text-slate-500">ลองล้างตัวกรอง หรือสร้างงานใหม่จากปุ่มด้านบน</p>
            </div>
          ) : null}
        </section>
        <aside className="grid content-start gap-4">
          {selectedAssignment ? (
            <AssignmentStudentPanel assignment={selectedAssignment} status={selectedStatus} students={selectedStudents} />
          ) : (
            <div className="rounded-[28px] bg-white/70 p-5 ring-1 ring-white">
              <h2 className="text-sm font-black text-[#293562]">เปิดรายชื่อนักเรียนจากตัวเลขสถานะ</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">คลิก “ยังไม่ส่ง”, “แก้งาน” หรือ “รอตรวจ” บนการ์ดงานเพื่อดูรายชื่อนักเรียนทันที</p>
            </div>
          )}
          <div className="rounded-[28px] bg-white/70 p-5 ring-1 ring-white">
            <h2 className="text-sm font-black text-[#293562]">ขั้นตอนทำงานที่แนะนำ</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">สร้างงานและตรวจรายละเอียดให้ครบ จากนั้นเปิด “บันทึกคะแนน” เพื่อกรอกคะแนนรายคน หรือเลือกหลายคนเพื่อจัดการพร้อมกัน</p>
          </div>
        </aside>
      </div>
    </ManagementShell>
  );
}
