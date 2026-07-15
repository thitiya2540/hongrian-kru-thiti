import type { ManagementDataSource } from "@/types/management";
import type { GradebookAssignmentColumn, GradebookCell, GradebookStudentRow } from "@/types/gradebook";
import type { StudentProfileViewModel } from "@/types/students";
import type { ScoringPolicy } from "@/types/settings";

export type StudentReportAssignment = GradebookCell & {
  title: string;
  subjectName: string;
  category: string;
  categoryWeight: number;
  activityDate: string;
};

export type StudentReportViewModel = {
  source: ManagementDataSource;
  notice?: string;
  generatedAt: string;
  profile: StudentProfileViewModel;
  gradebookRow: GradebookStudentRow | null;
  columns: GradebookAssignmentColumn[];
  assignments: StudentReportAssignment[];
  scoringPolicy: ScoringPolicy;
  summary: {
    earnedScore: number;
    possibleScore: number;
    percent: number;
    gradeLabel: string;
    submittedCount: number;
    missingCount: number;
    revisionCount: number;
    pendingReviewCount: number;
    absentOrExemptCount: number;
  };
};
