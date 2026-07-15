import { z } from "zod";

export const dashboardTermIdSchema = z.string().uuid();

const academicTermSchema = z.object({
  id: z.string().uuid(),
  academic_year: z.number().int(),
  semester: z.number().int().min(1).max(2),
  is_active: z.boolean(),
});

const classroomSchema = z.object({
  id: z.string().uuid(),
  grade: z.string().min(1),
  title: z.string().min(1),
  room: z.string().min(1),
  students: z.number().int().nonnegative(),
  subjects: z.number().int().nonnegative(),
  missing: z.number().int().nonnegative(),
  revision: z.number().int().nonnegative(),
  pending_review: z.number().int().nonnegative(),
  completion_rate: z.number().int().min(0).max(100),
  last_updated: z.string().nullable(),
  theme: z.enum(["violet", "emerald", "orange"]),
  scene: z.enum(["school", "mountain", "castle"]),
});

const todayTaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  classroom: z.string().min(1),
  subject: z.string().min(1),
  status: z.enum(["missing", "revision", "pending_review"]),
  student_count: z.number().int().positive(),
  due_label: z.string().min(1),
});

const dashboardStatsSchema = z.object({
  assignments_this_term: z.number().int().nonnegative(),
  submission_rate: z.number().int().min(0).max(100),
  students_need_attention: z.number().int().nonnegative(),
  stars_today: z.number().int().nonnegative(),
});

export const dashboardRpcSchema = z.object({
  teacher_name: z.string().min(1),
  selected_term_id: z.string().uuid().nullable(),
  academic_terms: z.array(academicTermSchema),
  classrooms: z.array(classroomSchema),
  today_tasks: z.array(todayTaskSchema),
  stats: dashboardStatsSchema,
});

export type DashboardRpcPayload = z.infer<typeof dashboardRpcSchema>;
