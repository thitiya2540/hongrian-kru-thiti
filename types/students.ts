import type { AssignmentStatus } from "@/types/database";
import type { ManagementDataSource, StudentSummary } from "@/types/management";

export type StudentSubjectScore = {
  subjectId: string;
  subjectName: string;
  earnedScore: number;
  maxScore: number;
  percent: number;
};

export type StudentAssignmentHistory = {
  id: string;
  title: string;
  subjectName: string;
  score: number | null;
  maxScore: number;
  status: AssignmentStatus;
  activityDate: string;
  note: string | null;
};

export type StudentProfileViewModel = {
  source: ManagementDataSource;
  notice?: string;
  student: StudentSummary;
  subjectScores: StudentSubjectScore[];
  assignmentsTotal: number;
  submittedCount: number;
  missingCount: number;
  revisionCount: number;
  pendingReviewCount: number;
  averagePercent: number;
  todoAssignments: StudentAssignmentHistory[];
  history: StudentAssignmentHistory[];
};
