import { getAssignmentsData } from "@/lib/assignments/get-assignments-data";
import { getManagementData } from "@/lib/management/get-management-data";
import { calculateScoreSummary, type ScoringCell } from "@/lib/scoring/calculate-score-summary";
import { getScoringPolicy, resolveScoreCategory } from "@/lib/settings/scoring-policy";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { AssignmentStatus, Database } from "@/types/database";
import type { StudentAssignmentHistory, StudentProfileViewModel, StudentSubjectScore } from "@/types/students";

type RecordRow = Database["public"]["Tables"]["student_assignment_records"]["Row"];

const todoStatuses: AssignmentStatus[] = ["missing", "revision", "pending_review"];

export async function getStudentProfileData(studentId: string): Promise<StudentProfileViewModel | null> {
  const [management, assignmentsData, scoringPolicyData] = await Promise.all([
    getManagementData(),
    getAssignmentsData(),
    getScoringPolicy(),
  ]);
  const scoringPolicy = scoringPolicyData.policy;
  const categoryWeight = new Map(scoringPolicy.categories.map((category) => [category.key, category.weight]));
  const student = management.students.find((item) => item.id === studentId);
  if (!student) return null;

  const assignmentsById = new Map(assignmentsData.assignments.map((assignment) => [assignment.id, assignment]));
  let records: RecordRow[] = [];
  if (isSupabaseConfigured() && management.source === "supabase") {
    const supabase = await createClient();
    const recordsResult = await supabase
      .from("student_assignment_records")
      .select("*")
      .eq("student_id", studentId)
      .order("updated_at", { ascending: false });
    records = recordsResult.data ?? [];
  }

  const history: StudentAssignmentHistory[] = records.map((record) => {
    const assignment = assignmentsById.get(record.assignment_id);
    return {
      id: record.id,
      title: assignment?.title ?? "ไม่พบงาน",
      subjectName: assignment?.subjectName ?? "รายวิชา",
      score: record.score === null ? null : Number(record.score),
      maxScore: assignment?.maxScore ?? 0,
      status: record.status,
      activityDate: assignment?.activityDate ?? record.created_at,
      note: record.note,
    };
  });

  const subjectCells = new Map<string, { subjectName: string; cells: ScoringCell[] }>();
  const allCells: ScoringCell[] = [];
  for (const record of records) {
    const assignment = assignmentsById.get(record.assignment_id);
    if (!assignment) continue;
    const categoryKey = resolveScoreCategory(assignment.category, scoringPolicy);
    const scoreCell: ScoringCell = {
      score: record.score === null ? null : Number(record.score),
      maxScore: assignment.maxScore,
      status: record.status,
      categoryKey,
      categoryWeight: categoryWeight.get(categoryKey) ?? 0,
    };
    const subject = subjectCells.get(assignment.subjectId) ?? { subjectName: assignment.subjectName, cells: [] };
    subject.cells.push(scoreCell);
    subjectCells.set(assignment.subjectId, subject);
    allCells.push(scoreCell);
  }

  const subjectScores: StudentSubjectScore[] = [...subjectCells.entries()].map(([subjectId, subject]) => {
    const summary = calculateScoreSummary(subject.cells, scoringPolicy);
    return {
      subjectId,
      subjectName: subject.subjectName,
      earnedScore: summary.earnedScore,
      maxScore: summary.possibleScore,
      percent: summary.percent,
    };
  });
  const overallScore = calculateScoreSummary(allCells, scoringPolicy);
  const submittedCount = history.filter((item) => ["submitted", "passed"].includes(item.status)).length;

  return {
    source: management.source,
    notice: management.notice,
    student,
    subjectScores,
    assignmentsTotal: history.length,
    submittedCount,
    missingCount: history.filter((item) => item.status === "missing").length || student.missingCount,
    revisionCount: history.filter((item) => item.status === "revision").length || student.revisionCount,
    pendingReviewCount: history.filter((item) => item.status === "pending_review").length,
    averagePercent: overallScore.percent,
    todoAssignments: history.filter((item) => todoStatuses.includes(item.status)).slice(0, 6),
    history: history.slice(0, 20),
  };
}
