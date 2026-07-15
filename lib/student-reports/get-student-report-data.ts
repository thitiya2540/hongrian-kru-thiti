import { getGradebookData } from "@/lib/gradebook/get-gradebook-data";
import { getStudentProfileData } from "@/lib/students/get-student-profile-data";
import type { StudentReportAssignment, StudentReportViewModel } from "@/types/student-report";

export async function getStudentReportData(studentId: string): Promise<StudentReportViewModel | null> {
  const profile = await getStudentProfileData(studentId);
  if (!profile) return null;

  const gradebook = await getGradebookData({
    classroomId: profile.student.classroomId ?? undefined,
  });
  const gradebookRow = gradebook.rows.find((row) => row.studentId === studentId) ?? null;
  const assignments: StudentReportAssignment[] = gradebookRow
    ? gradebookRow.cells.map((cell) => {
        const column = gradebook.columns.find((item) => item.id === cell.assignmentId);
        return {
          ...cell,
          title: column?.title ?? "ไม่พบชื่องาน",
          subjectName: column?.subjectName ?? "รายวิชา",
          category: column?.category ?? "อื่น ๆ",
          categoryWeight: column?.categoryWeight ?? 0,
          activityDate: column?.activityDate ?? gradebook.generatedAt,
        };
      })
    : [];

  return {
    source: gradebook.source,
    notice: gradebook.notice ?? profile.notice,
    generatedAt: new Date().toISOString(),
    profile,
    gradebookRow,
    columns: gradebook.columns,
    assignments,
    scoringPolicy: gradebook.scoringPolicy,
    summary: {
      earnedScore: gradebookRow?.earnedScore ?? 0,
      possibleScore: gradebookRow?.possibleScore ?? 0,
      percent: gradebookRow?.percent ?? profile.averagePercent,
      gradeLabel: gradebookRow?.gradeLabel ?? "ยังไม่มีคะแนน",
      submittedCount: gradebookRow?.submittedCount ?? profile.submittedCount,
      missingCount: gradebookRow?.missingCount ?? profile.missingCount,
      revisionCount: gradebookRow?.revisionCount ?? profile.revisionCount,
      pendingReviewCount: gradebookRow?.pendingReviewCount ?? profile.pendingReviewCount,
      absentOrExemptCount: gradebookRow?.absentOrExemptCount ?? 0,
    },
  };
}
