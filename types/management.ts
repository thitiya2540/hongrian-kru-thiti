import type { StudentStatus } from "@/types/database";

export type ManagementDataSource = "supabase" | "mock" | "fallback";

export type TermOption = {
  id: string;
  academicYear: number;
  semester: number;
  isActive: boolean;
};

export type ClassroomSummary = {
  id: string;
  name: string;
  gradeLevel: number;
  room: string;
  academicTermId: string;
  termLabel: string;
  color: string;
  isActive: boolean;
  studentCount: number;
  subjectCount: number;
  assignmentCount: number;
  pendingCount: number;
  latestActivityLabel: string;
};

export type StudentSummary = {
  id: string;
  studentCode: string;
  identityNumber: string | null;
  firstName: string;
  lastName: string;
  nickname: string | null;
  avatarUrl: string | null;
  numberInClass: number | null;
  status: StudentStatus;
  classroomId: string | null;
  classroomLabel: string;
  missingCount: number;
  revisionCount: number;
};

export type SubjectSummary = {
  id: string;
  name: string;
  subjectCode: string;
  icon: string;
  color: string;
  isActive: boolean;
  classroomIds: string[];
  classroomLabels: string[];
  assignmentCount: number;
  totalMaxScore: number;
};

export type ClassroomDetail = ClassroomSummary & {
  students: StudentSummary[];
  subjects: SubjectSummary[];
  recentAssignments: {
    id: string;
    title: string;
    subjectName: string;
    activityDate: string;
    maxScore: number;
  }[];
  subjectAverages: {
    subjectId: string;
    subjectName: string;
    averageScorePercent: number;
  }[];
};

export type ManagementViewModel = {
  source: ManagementDataSource;
  notice?: string;
  teacherName: string;
  terms: TermOption[];
  classrooms: ClassroomSummary[];
  students: StudentSummary[];
  subjects: SubjectSummary[];
};
