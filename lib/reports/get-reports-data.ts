import { getAssignmentsData } from "@/lib/assignments/get-assignments-data";
import { getManagementData } from "@/lib/management/get-management-data";
import type { AssignmentStatus } from "@/types/database";
import type {
  ClassroomReportRow,
  RecentReportAssignment,
  ReportFilters,
  ReportsViewModel,
  StudentWatchRow,
  SubjectReportRow,
} from "@/types/reports";

function percent(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

function dominantStatus(counts: Record<AssignmentStatus, number>): AssignmentStatus {
  const order: AssignmentStatus[] = ["missing", "revision", "pending_review", "submitted", "passed", "absent", "exempt"];
  return order.sort((a, b) => counts[b] - counts[a])[0] ?? "submitted";
}

function applyReportFilters(filters?: ReportFilters) {
  return {
    classroomId: filters?.classroomId && filters.classroomId !== "all" ? filters.classroomId : undefined,
    subjectId: filters?.subjectId && filters.subjectId !== "all" ? filters.subjectId : undefined,
  };
}

export async function getReportsData(filters?: ReportFilters): Promise<ReportsViewModel> {
  const normalizedFilters = applyReportFilters(filters);
  const [management, assignmentsData] = await Promise.all([
    getManagementData(),
    getAssignmentsData({
      classroomId: normalizedFilters.classroomId,
      subjectId: normalizedFilters.subjectId,
    }),
  ]);

  const visibleClassroomIds = new Set(
    management.classrooms
      .filter((classroom) => !normalizedFilters.classroomId || classroom.id === normalizedFilters.classroomId)
      .map((classroom) => classroom.id),
  );
  const visibleSubjectIds = new Set(
    management.subjects
      .filter((subject) => !normalizedFilters.subjectId || subject.id === normalizedFilters.subjectId)
      .map((subject) => subject.id),
  );
  const visibleStudents = management.students.filter((student) => !student.classroomId || visibleClassroomIds.has(student.classroomId));
  const visibleAssignments = assignmentsData.assignments.filter((assignment) => {
    return visibleClassroomIds.has(assignment.classroomId) && visibleSubjectIds.has(assignment.subjectId);
  });

  const classroomRows: ClassroomReportRow[] = management.classrooms
    .filter((classroom) => visibleClassroomIds.has(classroom.id))
    .map((classroom) => {
      const classroomStudents = visibleStudents.filter((student) => student.classroomId === classroom.id);
      const classroomAssignments = visibleAssignments.filter((assignment) => assignment.classroomId === classroom.id);
      const submittedCount = classroomAssignments.reduce((sum, assignment) => sum + assignment.counts.submitted + assignment.counts.passed, 0);
      const missingCount = classroomAssignments.reduce((sum, assignment) => sum + assignment.counts.missing, 0);
      const revisionCount = classroomAssignments.reduce((sum, assignment) => sum + assignment.counts.revision, 0);
      const pendingReviewCount = classroomAssignments.reduce((sum, assignment) => sum + assignment.counts.pending_review, 0);
      const absentCount = classroomAssignments.reduce((sum, assignment) => sum + assignment.counts.absent, 0);
      const totalRecords = classroomAssignments.reduce((sum, assignment) => sum + assignment.totalRecords, 0);

      return {
        classroomId: classroom.id,
        classroomLabel: `ป.${classroom.gradeLevel}/${classroom.room}`,
        studentCount: classroomStudents.length || classroom.studentCount,
        assignmentCount: classroomAssignments.length,
        submittedCount,
        missingCount,
        revisionCount,
        pendingReviewCount,
        absentCount,
        totalRecords,
        submittedRate: percent(submittedCount, totalRecords),
        riskRate: percent(missingCount + revisionCount, totalRecords),
      };
    });

  const subjectRows: SubjectReportRow[] = management.subjects
    .filter((subject) => visibleSubjectIds.has(subject.id))
    .map((subject) => {
      const subjectAssignments = visibleAssignments.filter((assignment) => assignment.subjectId === subject.id);
      const submittedCount = subjectAssignments.reduce((sum, assignment) => sum + assignment.counts.submitted + assignment.counts.passed, 0);
      const missingCount = subjectAssignments.reduce((sum, assignment) => sum + assignment.counts.missing, 0);
      const revisionCount = subjectAssignments.reduce((sum, assignment) => sum + assignment.counts.revision, 0);
      const pendingReviewCount = subjectAssignments.reduce((sum, assignment) => sum + assignment.counts.pending_review, 0);
      const totalRecords = subjectAssignments.reduce((sum, assignment) => sum + assignment.totalRecords, 0);

      return {
        subjectId: subject.id,
        subjectName: subject.name,
        classroomLabels: subject.classroomLabels,
        assignmentCount: subjectAssignments.length,
        totalMaxScore: subjectAssignments.reduce((sum, assignment) => sum + assignment.maxScore, 0) || subject.totalMaxScore,
        submittedCount,
        missingCount,
        revisionCount,
        pendingReviewCount,
        submittedRate: percent(submittedCount, totalRecords),
      };
    });

  const watchList: StudentWatchRow[] = visibleStudents
    .map((student) => {
      const riskScore = student.missingCount * 2 + student.revisionCount;
      const recommendedAction = student.missingCount > 0
        ? "ติดตามงานค้างและกำหนดวันส่งใหม่"
        : student.revisionCount > 0
          ? "นัดแก้งานพร้อม feedback สั้น ๆ"
          : "ชมเชยและให้ภารกิจเสริม";

      return {
        studentId: student.id,
        studentCode: student.studentCode,
        studentName: `${student.firstName} ${student.lastName}`,
        classroomLabel: student.classroomLabel,
        numberInClass: student.numberInClass,
        missingCount: student.missingCount,
        revisionCount: student.revisionCount,
        riskScore,
        recommendedAction,
      };
    })
    .sort((a, b) => b.riskScore - a.riskScore || (a.numberInClass ?? 999) - (b.numberInClass ?? 999))
    .slice(0, 10);

  const recentAssignments: RecentReportAssignment[] = visibleAssignments.slice(0, 8).map((assignment) => ({
    assignmentId: assignment.id,
    title: assignment.title,
    classroomLabel: assignment.classroomLabel,
    subjectName: assignment.subjectName,
    activityDate: assignment.activityDate,
    dueDate: assignment.dueDate,
    maxScore: assignment.maxScore,
    submittedCount: assignment.counts.submitted + assignment.counts.passed,
    missingCount: assignment.counts.missing,
    revisionCount: assignment.counts.revision,
    pendingReviewCount: assignment.counts.pending_review,
    totalRecords: assignment.totalRecords,
    dominantStatus: dominantStatus(assignment.counts),
  }));

  const totalRecords = visibleAssignments.reduce((sum, assignment) => sum + assignment.totalRecords, 0);
  const submitted = visibleAssignments.reduce((sum, assignment) => sum + assignment.counts.submitted + assignment.counts.passed, 0);
  const missing = visibleAssignments.reduce((sum, assignment) => sum + assignment.counts.missing, 0);
  const revision = visibleAssignments.reduce((sum, assignment) => sum + assignment.counts.revision, 0);
  const pendingReview = visibleAssignments.reduce((sum, assignment) => sum + assignment.counts.pending_review, 0);

  return {
    source: assignmentsData.source === "supabase" && management.source === "supabase" ? "supabase" : management.source,
    notice: assignmentsData.notice ?? management.notice,
    generatedAt: new Date().toISOString(),
    filters: normalizedFilters,
    summary: {
      totalClassrooms: classroomRows.length,
      totalStudents: visibleStudents.length,
      totalAssignments: visibleAssignments.length,
      totalRecords,
      submittedRate: percent(submitted, totalRecords),
      missingRate: percent(missing, totalRecords),
      revisionRate: percent(revision, totalRecords),
      pendingReviewRate: percent(pendingReview, totalRecords),
    },
    classroomRows,
    subjectRows,
    watchList,
    recentAssignments,
  };
}
