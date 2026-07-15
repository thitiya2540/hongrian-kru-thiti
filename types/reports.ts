import type { AssignmentStatus } from "@/types/database";
import type { ManagementDataSource } from "@/types/management";

export type ReportFilters = {
  classroomId?: string;
  subjectId?: string;
};

export type ReportSummary = {
  totalClassrooms: number;
  totalStudents: number;
  totalAssignments: number;
  totalRecords: number;
  submittedRate: number;
  missingRate: number;
  revisionRate: number;
  pendingReviewRate: number;
};

export type ClassroomReportRow = {
  classroomId: string;
  classroomLabel: string;
  studentCount: number;
  assignmentCount: number;
  submittedCount: number;
  missingCount: number;
  revisionCount: number;
  pendingReviewCount: number;
  absentCount: number;
  totalRecords: number;
  submittedRate: number;
  riskRate: number;
};

export type SubjectReportRow = {
  subjectId: string;
  subjectName: string;
  classroomLabels: string[];
  assignmentCount: number;
  totalMaxScore: number;
  submittedCount: number;
  missingCount: number;
  revisionCount: number;
  pendingReviewCount: number;
  submittedRate: number;
};

export type StudentWatchRow = {
  studentId: string;
  studentCode: string;
  studentName: string;
  classroomLabel: string;
  numberInClass: number | null;
  missingCount: number;
  revisionCount: number;
  riskScore: number;
  recommendedAction: string;
};

export type RecentReportAssignment = {
  assignmentId: string;
  title: string;
  classroomLabel: string;
  subjectName: string;
  activityDate: string;
  dueDate: string | null;
  maxScore: number;
  submittedCount: number;
  missingCount: number;
  revisionCount: number;
  pendingReviewCount: number;
  totalRecords: number;
  dominantStatus: AssignmentStatus;
};

export type ReportsViewModel = {
  source: ManagementDataSource;
  notice?: string;
  generatedAt: string;
  filters: ReportFilters;
  summary: ReportSummary;
  classroomRows: ClassroomReportRow[];
  subjectRows: SubjectReportRow[];
  watchList: StudentWatchRow[];
  recentAssignments: RecentReportAssignment[];
};
