import { NextResponse } from "next/server";
import { requireTeacherSession } from "@/lib/auth/require-session";
import { getAssignmentsData } from "@/lib/assignments/get-assignments-data";
import { appBrand } from "@/lib/branding";
import { getGradebookData } from "@/lib/gradebook/get-gradebook-data";
import { getManagementData } from "@/lib/management/get-management-data";
import { getReportsData } from "@/lib/reports/get-reports-data";

function csvEscape(value: string | number | boolean | null | undefined) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replaceAll("\"", "\"\"")}"`;
}

function toCsv(rows: Array<Array<string | number | boolean | null | undefined>>) {
  return `\uFEFF${rows.map((row) => row.map(csvEscape).join(",")).join("\n")}`;
}

function thaiDateTime(value: string) {
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export async function GET(request: Request) {
  const authError = await requireTeacherSession();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const filters = {
    classroomId: searchParams.get("classroom") ?? undefined,
    subjectId: searchParams.get("subject") ?? undefined,
  };
  const [management, assignmentsData, gradebook, reports] = await Promise.all([
    getManagementData(),
    getAssignmentsData({ classroomId: filters.classroomId, subjectId: filters.subjectId }),
    getGradebookData({ classroomId: filters.classroomId, subjectId: filters.subjectId }),
    getReportsData({ classroomId: filters.classroomId, subjectId: filters.subjectId }),
  ]);
  const generatedAt = new Date().toISOString();

  const rows: Array<Array<string | number | boolean | null | undefined>> = [
    [`${appBrand.name} Backup Snapshot`],
    ["สร้างเมื่อ", thaiDateTime(generatedAt)],
    ["แหล่งข้อมูล", management.source],
    ["ห้องเรียน", gradebook.selectedClassroomLabel],
    ["รายวิชา", gradebook.selectedSubjectName],
    [],
    ["สรุป"],
    ["ห้องเรียน", reports.summary.totalClassrooms],
    ["นักเรียน", reports.summary.totalStudents],
    ["งาน", reports.summary.totalAssignments],
    ["รายการคะแนน", reports.summary.totalRecords],
    ["ส่งแล้ว/ผ่าน (%)", reports.summary.submittedRate],
    ["ยังไม่ส่ง (%)", reports.summary.missingRate],
    ["ต้องแก้ (%)", reports.summary.revisionRate],
    ["รอตรวจ (%)", reports.summary.pendingReviewRate],
    [],
    ["ห้องเรียน"],
    ["id", "ห้อง", "ปี/ภาคเรียน", "นักเรียน", "วิชา", "งาน", "ค้าง/รอตรวจ", "ใช้งาน"],
    ...management.classrooms.map((classroom) => [
      classroom.id,
      `ป.${classroom.gradeLevel}/${classroom.room}`,
      classroom.termLabel,
      classroom.studentCount,
      classroom.subjectCount,
      classroom.assignmentCount,
      classroom.pendingCount,
      classroom.isActive,
    ]),
    [],
    ["นักเรียน"],
    ["id", "รหัสนักเรียน", "ชื่อ-สกุล", "ชื่อเล่น", "ห้อง", "เลขที่", "สถานะ", "ยังไม่ส่ง", "ต้องแก้"],
    ...management.students
      .filter((student) => !filters.classroomId || student.classroomId === filters.classroomId)
      .map((student) => [
        student.id,
        student.studentCode,
        `${student.firstName} ${student.lastName}`,
        student.nickname,
        student.classroomLabel,
        student.numberInClass,
        student.status,
        student.missingCount,
        student.revisionCount,
      ]),
    [],
    ["งาน / ภารกิจ"],
    ["id", "ชื่องาน", "ห้อง", "วิชา", "หมวด", "คะแนนเต็ม", "วันที่กิจกรรม", "กำหนดส่ง", "ล็อก", "ส่งแล้ว", "ยังไม่ส่ง", "ต้องแก้", "รอตรวจ", "รวมรายการ"],
    ...assignmentsData.assignments.map((assignment) => [
      assignment.id,
      assignment.title,
      assignment.classroomLabel,
      assignment.subjectName,
      assignment.category,
      assignment.maxScore,
      assignment.activityDate,
      assignment.dueDate,
      assignment.isLocked,
      assignment.counts.submitted + assignment.counts.passed,
      assignment.counts.missing,
      assignment.counts.revision,
      assignment.counts.pending_review,
      assignment.totalRecords,
    ]),
    [],
    ["สมุดคะแนน"],
    [
      "เลขที่",
      "รหัสนักเรียน",
      "ชื่อ-สกุล",
      "ห้อง",
      "คะแนนรวม",
      "คะแนนเต็มที่นับ",
      "ร้อยละ",
      "ระดับ",
      "สถานะติดตาม",
      "ยังไม่ส่ง",
      "ต้องแก้",
      "รอตรวจ",
    ],
    ...gradebook.rows.map((row) => [
      row.numberInClass,
      row.studentCode,
      row.studentName,
      row.classroomLabel,
      row.earnedScore,
      row.possibleScore,
      row.percent,
      row.gradeLabel,
      row.riskLevel,
      row.missingCount,
      row.revisionCount,
      row.pendingReviewCount,
    ]),
    [],
    ["Watch list"],
    ["รหัสนักเรียน", "ชื่อ-สกุล", "ห้อง", "เลขที่", "ยังไม่ส่ง", "ต้องแก้", "คะแนนเสี่ยง", "ข้อเสนอแนะ"],
    ...reports.watchList.map((student) => [
      student.studentCode,
      student.studentName,
      student.classroomLabel,
      student.numberInClass,
      student.missingCount,
      student.revisionCount,
      student.riskScore,
      student.recommendedAction,
    ]),
  ];

  return new NextResponse(toCsv(rows), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${appBrand.exportFilePrefix}-backup-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
