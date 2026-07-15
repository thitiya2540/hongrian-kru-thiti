import { buildStudentCsvTemplate } from "@/lib/students/csv";

export async function GET() {
  return new Response(buildStudentCsvTemplate(), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="student-import-template.csv"',
      "Cache-Control": "no-store",
    },
  });
}
