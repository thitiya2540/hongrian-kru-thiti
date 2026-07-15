import { NextResponse } from "next/server";
import { requireTeacherSession } from "@/lib/auth/require-session";
import { appBrand } from "@/lib/branding";
import { getGradebookData } from "@/lib/gradebook/get-gradebook-data";

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
  const gradebook = await getGradebookData({
    classroomId: searchParams.get("classroom") ?? undefined,
    subjectId: searchParams.get("subject") ?? undefined,
  });

  const header = [
    "เลขที่",
    "รหัสนักเรียน",
    "ชื่อ-สกุล",
    "ห้อง",
    "คะแนนรวม",
    "คะแนนเต็มที่นับ",
    "ร้อยละ",
    "ระดับ",
    "สถานะติดตาม",
    ...gradebook.columns.map((column) => `${column.classroomLabel} ${column.title} (${column.maxScore})`),
  ];
  const rows: Array<Array<string | number | null | undefined>> = [
    [`สมุดคะแนน ${appBrand.name}`],
    ["ห้องเรียน", gradebook.selectedClassroomLabel],
    ["รายวิชา", gradebook.selectedSubjectName],
    ["สร้างเมื่อ", new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(gradebook.generatedAt))],
    [],
    header,
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
      ...row.cells.map((cell) => cell.score ?? cell.status),
    ]),
  ];

  return new NextResponse(toCsv(rows), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${appBrand.exportFilePrefix}-gradebook-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
