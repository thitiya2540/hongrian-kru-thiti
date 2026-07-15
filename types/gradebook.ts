import type { AssignmentStatus } from "@/types/database";
import type { ManagementDataSource } from "@/types/management";
import type { ScoringPolicy } from "@/types/settings";

export type GradebookFilters = {
  classroomId?: string;
  subjectId?: string;
};

export type GradebookAssignmentColumn = {
  id: string;
  classroomId: string;
  classroomLabel: string;
  title: string;
  shortTitle: string;
  subjectName: string;
  category: string;
  categoryKey: string;
  categoryWeight: number;
  activityDate: string;
  maxScore: number;
  isLocked: boolean;
};

export type GradebookCell = {
  assignmentId: string;
  score: number | null;
  maxScore: number;
  status: AssignmentStatus;
  note: string | null;
  countedInTotal: boolean;
};

export type GradebookStudentRow = {
  studentId: string;
  studentCode: string;
  studentName: string;
  nickname: string | null;
  avatarUrl: string | null;
  numberInClass: number | null;
  classroomLabel: string;
  cells: GradebookCell[];
  earnedScore: number;
  possibleScore: number;
  percent: number;
  submittedCount: number;
  missingCount: number;
  revisionCount: number;
  pendingReviewCount: number;
  absentOrExemptCount: number;
  gradeLabel: string;
  riskLevel: "good" | "watch" | "risk";
};

export type GradebookSummary = {
  studentCount: number;
  assignmentCount: number;
  totalPossibleScore: number;
  averagePercent: number;
  submittedRate: number;
  missingCount: number;
  revisionCount: number;
  riskStudentCount: number;
  scoringFormulaLabel: string;
};

export type GradebookViewModel = {
  source: ManagementDataSource;
  notice?: string;
  generatedAt: string;
  filters: GradebookFilters;
  selectedClassroomLabel: string;
  selectedSubjectName: string;
  columns: GradebookAssignmentColumn[];
  rows: GradebookStudentRow[];
  summary: GradebookSummary;
  scoringPolicy: ScoringPolicy;
};
