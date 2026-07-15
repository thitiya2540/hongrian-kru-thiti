import { NextResponse } from "next/server";
import { requireTeacherSession } from "@/lib/auth/require-session";
import { appBrand } from "@/lib/branding";
import { getReportsData } from "@/lib/reports/get-reports-data";

function csvEscape(value: string | number | null | undefined) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replaceAll("\"", "\"\"")}"`;
}

function toCsv(rows: Array<Array<string | number | null | undefined>>) {
  return `\uFEFF${rows.map((row) => row.map(csvEscape).join(",")).join("\n")}`;
}

export async function GET(request: Request) {
  const authError = await requireTeacherSession();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const report = await getReportsData({
    classroomId: searchParams.get("classroom") ?? undefined,
    subjectId: searchParams.get("subject") ?? undefined,
  });

  const rows: Array<Array<string | number | null | undefined>> = [
    [`รายงานภาพรวม ${appBrand.name}`],
    ["สร้างเมื่อ", new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(report.generatedAt))],
    [],
    ["สรุป"],
    ["ห้องเรียน", report.summary.totalClassrooms],
    ["นักเรียน", report.summary.totalStudents],
    ["งาน", report.summary.totalAssignments],
    ["รายการคะแนน", report.summary.totalRecords],
    ["ส่งแล้ว/ผ่าน (%)", report.summary.submittedRate],
    ["ยังไม่ส่ง (%)", report.summary.missingRate],
    ["ต้องแก้ (%)", report.summary.revisionRate],
    ["รอตรวจ (%)", report.summary.pendingReviewRate],
    [],
    ["รายงานห้องเรียน"],
    ["ห้อง", "นักเรียน", "งาน", "รายการทั้งหมด", "ส่งแล้ว", "ยังไม่ส่ง", "ต้องแก้", "รอตรวจ", "ลา", "ส่งแล้ว (%)", "เสี่ยง (%)"],
    ...report.classroomRows.map((row) => [
      row.classroomLabel,
      row.studentCount,
      row.assignmentCount,
      row.totalRecords,
      row.submittedCount,
      row.missingCount,
      row.revisionCount,
      row.pendingReviewCount,
      row.absentCount,
      row.submittedRate,
      row.riskRate,
    ]),
    [],
    ["นักเรียนที่ควรติดตาม"],
    ["รหัสนักเรียน", "ชื่อ-สกุล", "ห้อง", "เลขที่", "ยังไม่ส่ง", "ต้องแก้", "คะแนนเสี่ยง", "ข้อเสนอแนะ"],
    ...report.watchList.map((student) => [
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
      "content-disposition": `attachment; filename="${appBrand.exportFilePrefix}-report-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
