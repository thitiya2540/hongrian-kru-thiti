import type { AssignmentStatus, RecordingMode } from "@/types/database";
import type { ManagementDataSource } from "@/types/management";

export type AssignmentType =
  | "worksheet"
  | "exercise"
  | "homework"
  | "quiz"
  | "activity"
  | "group_work"
  | "oral"
  | "other";

export type AssignmentTemplateSummary = {
  id: string;
  title: string;
  assignmentType: AssignmentType;
  recordingMode: RecordingMode;
  defaultMaxScore: number;
  category: string;
  description: string | null;
};

export type AssignmentStatusCounts = Record<AssignmentStatus, number>;

export type AssignmentSummary = {
  id: string;
  classroomId: string;
  classroomLabel: string;
  subjectId: string;
  subjectName: string;
  templateId: string | null;
  title: string;
  assignmentType: AssignmentType;
  assignmentTypeLabel: string;
  recordingMode: RecordingMode;
  unitName: string | null;
  category: string;
  description: string | null;
  previewImagePath: string | null;
  previewImageUrl: string | null;
  resourceUrl: string | null;
  maxScore: number;
  activityDate: string;
  dueDate: string | null;
  allowBonus: boolean;
  isLocked: boolean;
  isActive: boolean;
  createdAt: string;
  counts: AssignmentStatusCounts;
  totalRecords: number;
};

export type AssignmentStudentStatus = {
  id: string;
  studentId: string;
  studentName: string;
  nickname: string | null;
  avatarUrl: string | null;
  numberInClass: number | null;
  classroomLabel: string;
  score: number | null;
  status: AssignmentStatus;
  note: string | null;
};

export type AssignmentFilters = {
  classroomId?: string;
  subjectId?: string;
  assignmentType?: AssignmentType;
  status?: AssignmentStatus;
  q?: string;
};

export type AssignmentsViewModel = {
  source: ManagementDataSource;
  notice?: string;
  assignments: AssignmentSummary[];
  templates: AssignmentTemplateSummary[];
};

export type ScorebookRecord = AssignmentStudentStatus & {
  savingState: "idle" | "pending" | "saving" | "saved" | "error";
};

export type ScorebookViewModel = {
  source: ManagementDataSource;
  notice?: string;
  assignment: AssignmentSummary;
  records: AssignmentStudentStatus[];
};
