import type { ClassroomSummary, DashboardStats, TodayTask } from "@/types/dashboard";

export const dashboardClassrooms: ClassroomSummary[] = [];
export const todayTasks: TodayTask[] = [];
export const dashboardStats: DashboardStats = {
  assignmentsThisTerm: 0,
  submissionRate: 0,
  studentsNeedAttention: 0,
};
