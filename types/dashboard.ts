export type ClassroomTheme = "violet" | "emerald" | "orange";
export type ClassroomScene = "school" | "mountain" | "castle";

export type ClassroomSummary = {
  id: string;
  grade: string;
  title: string;
  room: string;
  students: number;
  subjects: number;
  missing: number;
  revision: number;
  pendingReview: number;
  completionRate: number;
  lastUpdated: string;
  theme: ClassroomTheme;
  scene: ClassroomScene;
};

export type TaskStatus = "missing" | "revision" | "pending_review";

export type TodayTask = {
  id: string;
  title: string;
  classroom: string;
  subject: string;
  status: TaskStatus;
  studentCount: number;
  dueLabel: string;
};

export type DashboardStats = {
  assignmentsThisTerm: number;
  submissionRate: number;
  studentsNeedAttention: number;
};

export type AcademicTermOption = {
  id: string;
  academicYear: number;
  semester: number;
  isActive: boolean;
};

export type DashboardDataSource = "supabase" | "mock" | "fallback";

export type DashboardViewModel = {
  teacherName: string;
  academicTerms: AcademicTermOption[];
  selectedTermId: string;
  classrooms: ClassroomSummary[];
  todayTasks: TodayTask[];
  stats: DashboardStats;
  source: DashboardDataSource;
  notice?: string;
};
