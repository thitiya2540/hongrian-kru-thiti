import type { AssignmentStatus } from "@/types/database";
import type { ManagementDataSource } from "@/types/management";

export type FollowUpPriority = "critical" | "warning" | "normal";

export type FollowUpFilters = {
  classroomId?: string;
  priority?: FollowUpPriority;
  q?: string;
};

export type FollowUpSummary = {
  urgentAssignments: number;
  dueTodayAssignments: number;
  pendingReviewRecords: number;
  revisionRecords: number;
  atRiskStudents: number;
};

export type FollowUpQueueItem = {
  id: string;
  assignmentId: string;
  title: string;
  classroomId: string;
  classroomLabel: string;
  subjectName: string;
  dueDate: string | null;
  dueLabel: string;
  daysFromDue: number | null;
  priority: FollowUpPriority;
  actionLabel: string;
  actionHref: string;
  missingCount: number;
  revisionCount: number;
  pendingReviewCount: number;
  totalActionCount: number;
};

export type FollowUpStudentRisk = {
  id: string;
  studentName: string;
  nickname: string | null;
  classroomId: string | null;
  classroomLabel: string;
  numberInClass: number | null;
  missingCount: number;
  revisionCount: number;
  totalIssueCount: number;
  priority: FollowUpPriority;
  profileHref: string;
};

export type FollowUpStatusGroup = {
  status: Extract<AssignmentStatus, "missing" | "revision" | "pending_review">;
  label: string;
  count: number;
  helper: string;
};

export type FollowUpViewModel = {
  source: ManagementDataSource;
  notice?: string;
  filters: FollowUpFilters;
  summary: FollowUpSummary;
  queue: FollowUpQueueItem[];
  studentRisks: FollowUpStudentRisk[];
  statusGroups: FollowUpStatusGroup[];
};
