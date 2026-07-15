import { getAssignmentsData } from "@/lib/assignments/get-assignments-data";
import { getGradebookData } from "@/lib/gradebook/get-gradebook-data";
import { getManagementData } from "@/lib/management/get-management-data";
import { getReportsData } from "@/lib/reports/get-reports-data";
import type { ExportCenterFilters, ExportCenterViewModel } from "@/types/export-center";

function queryString(filters?: ExportCenterFilters) {
  const params = new URLSearchParams();
  if (filters?.classroomId) params.set("classroom", filters.classroomId);
  if (filters?.subjectId) params.set("subject", filters.subjectId);
  const text = params.toString();
  return text ? `?${text}` : "";
}

export function parseExportCenterFilters(input: { classroom?: string; subject?: string }): ExportCenterFilters {
  return {
    classroomId: input.classroom && input.classroom !== "all" ? input.classroom : undefined,
    subjectId: input.subject && input.subject !== "all" ? input.subject : undefined,
  };
}

export async function getExportCenterData(filters?: ExportCenterFilters): Promise<ExportCenterViewModel> {
  const [management, assignmentsData, gradebook, reports] = await Promise.all([
    getManagementData(),
    getAssignmentsData({ classroomId: filters?.classroomId, subjectId: filters?.subjectId }),
    getGradebookData({ classroomId: filters?.classroomId, subjectId: filters?.subjectId }),
    getReportsData({ classroomId: filters?.classroomId, subjectId: filters?.subjectId }),
  ]);
  const qs = queryString(filters);
  const source = management.source === "supabase" && assignmentsData.source === "supabase" && gradebook.source === "supabase" && reports.source === "supabase"
    ? "supabase"
    : management.source === "mock" && assignmentsData.source === "mock"
      ? "mock"
      : "fallback";

  return {
    source,
    notice: management.notice ?? assignmentsData.notice ?? gradebook.notice ?? reports.notice,
    generatedAt: new Date().toISOString(),
    filters: filters ?? {},
    summary: {
      classroomCount: reports.summary.totalClassrooms,
      studentCount: reports.summary.totalStudents,
      assignmentCount: assignmentsData.assignments.length,
      gradebookRows: gradebook.rows.length,
      watchListCount: reports.watchList.length,
    },
    options: [
      {
        id: "backup",
        title: "สำรองข้อมูลรวม",
        description: "รวมข้อมูลห้องเรียน นักเรียน งาน สมุดคะแนน และรายชื่อนักเรียนที่ควรติดตามในไฟล์ CSV เดียว",
        href: `/api/exports/backup${qs}`,
        fileType: "CSV",
        recommendedFor: "สำรองก่อนปิดภาคเรียนหรือก่อนแก้ข้อมูลจำนวนมาก",
        tone: "purple",
      },
      {
        id: "gradebook",
        title: "ส่งออกสมุดคะแนน",
        description: "ตารางคะแนนนักเรียนเป็นแถว งานเป็นคอลัมน์ พร้อมร้อยละและระดับผลการเรียน",
        href: `/api/gradebook/export${qs}`,
        fileType: "CSV",
        recommendedFor: "ส่งต่อ Excel หรือใช้ตรวจคะแนนรายวิชา",
        tone: "green",
      },
      {
        id: "report",
        title: "ส่งออกรายงานภาพรวม",
        description: "สรุปห้องเรียน รายวิชา อัตราส่งงาน งานค้าง และ Watch list",
        href: `/api/reports/export${qs}`,
        fileType: "CSV",
        recommendedFor: "ประชุม PLC / ส่งหัวหน้าวิชาการ",
        tone: "amber",
      },
      {
        id: "print-report",
        title: "พิมพ์รายงานภาพรวม",
        description: "เปิดหน้ารายงานเพื่อพิมพ์หรือบันทึก PDF จาก Browser ตามตัวกรองเดียวกัน",
        href: `/reports${qs}`,
        fileType: "PRINT",
        recommendedFor: "แนบเอกสารหรือบันทึกเป็น PDF",
        tone: "rose",
      },
    ],
  };
}
