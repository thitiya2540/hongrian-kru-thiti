import { getAssignmentsData, getScorebookData } from "@/lib/assignments/get-assignments-data";
import { getManagementData } from "@/lib/management/get-management-data";
import { calculateScoreSummary, isScoreCellCounted } from "@/lib/scoring/calculate-score-summary";
import { getScoringPolicy, resolveScoreCategory } from "@/lib/settings/scoring-policy";
import type {
  GradebookAssignmentColumn,
  GradebookCell,
  GradebookFilters,
  GradebookStudentRow,
  GradebookViewModel,
} from "@/types/gradebook";

function percent(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

function shortTitle(title: string) {
  return title.length > 16 ? `${title.slice(0, 15)}…` : title;
}

function riskLevel(row: Pick<GradebookStudentRow, "percent" | "missingCount" | "revisionCount">): GradebookStudentRow["riskLevel"] {
  if (row.missingCount >= 2 || row.percent < 50) return "risk";
  if (row.missingCount > 0 || row.revisionCount > 0 || row.percent < 65) return "watch";
  return "good";
}

function normalizeFilters(filters?: GradebookFilters): GradebookFilters {
  return {
    classroomId: filters?.classroomId && filters.classroomId !== "all" ? filters.classroomId : undefined,
    subjectId: filters?.subjectId && filters.subjectId !== "all" ? filters.subjectId : undefined,
  };
}

export async function getGradebookData(filters?: GradebookFilters): Promise<GradebookViewModel> {
  const normalizedFilters = normalizeFilters(filters);
  const [management, assignmentsData, scoringPolicyData] = await Promise.all([
    getManagementData(),
    getAssignmentsData({ classroomId: normalizedFilters.classroomId, subjectId: normalizedFilters.subjectId }),
    getScoringPolicy(),
  ]);
  const scoringPolicy = scoringPolicyData.policy;
  const weightByCategory = new Map(scoringPolicy.categories.map((category) => [category.key, category.weight]));

  const selectedClassroom = normalizedFilters.classroomId
    ? management.classrooms.find((classroom) => classroom.id === normalizedFilters.classroomId)
    : undefined;
  const selectedSubject = normalizedFilters.subjectId
    ? management.subjects.find((subject) => subject.id === normalizedFilters.subjectId)
    : undefined;
  const classroomIds = new Set(
    selectedClassroom
      ? [selectedClassroom.id]
      : management.classrooms.map((classroom) => classroom.id),
  );
  const subjectIds = new Set(
    selectedSubject
      ? [selectedSubject.id]
      : management.subjects.map((subject) => subject.id),
  );
  const assignments = assignmentsData.assignments
    .filter((assignment) => classroomIds.has(assignment.classroomId) && subjectIds.has(assignment.subjectId) && assignment.isActive)
    .sort((a, b) => a.activityDate.localeCompare(b.activityDate) || a.title.localeCompare(b.title, "th"));
  const students = management.students
    .filter((student) => !student.classroomId || classroomIds.has(student.classroomId))
    .sort((a, b) => a.classroomLabel.localeCompare(b.classroomLabel, "th") || (a.numberInClass ?? 999) - (b.numberInClass ?? 999));

  const scorebooks = await Promise.all(assignments.map((assignment) => getScorebookData(assignment.id)));
  const recordByAssignmentStudent = new Map<string, GradebookCell>();

  for (const scorebook of scorebooks) {
    if (!scorebook) continue;
    for (const record of scorebook.records) {
      const countedInTotal = isScoreCellCounted(record.status, scoringPolicy);
      recordByAssignmentStudent.set(`${scorebook.assignment.id}:${record.studentId}`, {
        assignmentId: scorebook.assignment.id,
        score: record.score,
        maxScore: scorebook.assignment.maxScore,
        status: record.status,
        note: record.note,
        countedInTotal,
      });
    }
  }

  const columns: GradebookAssignmentColumn[] = assignments.map((assignment) => {
    const categoryKey = resolveScoreCategory(assignment.category, scoringPolicy);
    return {
      id: assignment.id,
      classroomId: assignment.classroomId,
      classroomLabel: assignment.classroomLabel,
      title: assignment.title,
      shortTitle: shortTitle(assignment.title),
      subjectName: assignment.subjectName,
      category: assignment.category,
      categoryKey,
      categoryWeight: weightByCategory.get(categoryKey) ?? 0,
      activityDate: assignment.activityDate,
      maxScore: assignment.maxScore,
      isLocked: assignment.isLocked,
    };
  });

  const rows: GradebookStudentRow[] = students.map((student) => {
    const cells = columns.map<GradebookCell>((column) => {
      if (student.classroomId !== column.classroomId) {
        return {
          assignmentId: column.id,
          score: null,
          maxScore: column.maxScore,
          status: "exempt",
          note: "งานนี้เป็นของห้องเรียนอื่น",
          countedInTotal: false,
        };
      }
      return recordByAssignmentStudent.get(`${column.id}:${student.id}`) ?? {
        assignmentId: column.id,
        score: null,
        maxScore: column.maxScore,
        status: "missing",
        note: null,
        countedInTotal: scoringPolicy.missingScorePolicy === "count_zero",
      };
    });
    const scoreSummary = calculateScoreSummary(cells.map((cell, index) => ({
      score: cell.score,
      maxScore: cell.maxScore,
      status: cell.status,
      categoryKey: columns[index].categoryKey,
      categoryWeight: columns[index].categoryWeight,
    })), scoringPolicy);
    const rowBase = {
      percent: scoreSummary.percent,
      missingCount: scoreSummary.missingCount,
      revisionCount: scoreSummary.revisionCount,
    };

    return {
      studentId: student.id,
      studentCode: student.studentCode,
      studentName: `${student.firstName} ${student.lastName}`,
      nickname: student.nickname,
      avatarUrl: student.avatarUrl,
      numberInClass: student.numberInClass,
      classroomLabel: student.classroomLabel,
      cells,
      earnedScore: scoreSummary.earnedScore,
      possibleScore: scoreSummary.possibleScore,
      percent: rowBase.percent,
      submittedCount: scoreSummary.submittedCount,
      missingCount: rowBase.missingCount,
      revisionCount: rowBase.revisionCount,
      pendingReviewCount: scoreSummary.pendingReviewCount,
      absentOrExemptCount: scoreSummary.absentOrExemptCount,
      gradeLabel: scoreSummary.gradeLabel,
      riskLevel: riskLevel(rowBase),
    };
  });

  const totalPossibleScore = columns.reduce((sum, column) => sum + column.maxScore, 0);
  const submittedCells = rows.reduce((sum, row) => sum + row.submittedCount, 0);
  const totalCountedCells = rows.reduce((sum, row) => sum + row.cells.filter((cell) => cell.countedInTotal).length, 0);
  const missingCount = rows.reduce((sum, row) => sum + row.missingCount, 0);
  const revisionCount = rows.reduce((sum, row) => sum + row.revisionCount, 0);

  return {
    source: assignmentsData.source === "supabase" && management.source === "supabase" ? "supabase" : management.source,
    notice: assignmentsData.notice ?? management.notice,
    generatedAt: new Date().toISOString(),
    filters: normalizedFilters,
    selectedClassroomLabel: selectedClassroom ? `ป.${selectedClassroom.gradeLevel}/${selectedClassroom.room}` : "ทุกห้องเรียน",
    selectedSubjectName: selectedSubject?.name ?? "ทุกรายวิชา",
    columns,
    rows,
    summary: {
      studentCount: rows.length,
      assignmentCount: columns.length,
      totalPossibleScore,
      averagePercent: rows.length > 0 ? Math.round(rows.reduce((sum, row) => sum + row.percent, 0) / rows.length) : 0,
      submittedRate: percent(submittedCells, totalCountedCells),
      missingCount,
      revisionCount,
      riskStudentCount: rows.filter((row) => row.riskLevel === "risk").length,
      scoringFormulaLabel: `น้ำหนัก ${scoringPolicy.categories.map((category) => `${category.label} ${category.weight}%`).join(" · ")}`,
    },
    scoringPolicy,
  };
}
