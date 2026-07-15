import { z } from "zod";
import { idSchema } from "@/lib/validations/management";

export const assignmentTypeSchema = z.enum([
  "worksheet",
  "exercise",
  "homework",
  "quiz",
  "activity",
  "group_work",
  "oral",
  "other",
]);

export const recordingModeSchema = z.enum(["score_only", "status_only", "score_and_status"]);
export const assignmentStatusSchema = z.enum(["submitted", "missing", "revision", "passed", "pending_review", "absent", "exempt"]);

export const assignmentFormSchema = z.object({
  id: idSchema.optional(),
  classroomId: idSchema,
  subjectId: idSchema,
  templateId: idSchema.optional().or(z.literal("")),
  title: z.string().trim().min(1, "กรุณากรอกชื่องาน").max(200),
  assignmentType: assignmentTypeSchema,
  recordingMode: recordingModeSchema,
  unitName: z.string().trim().max(120).optional(),
  category: z.string().trim().min(1, "กรุณากรอกหมวดคะแนน").max(100),
  description: z.string().trim().max(800).optional(),
  resourceUrl: z.string().trim().max(2048).url("กรุณากรอกลิงก์ให้ถูกต้อง").refine(
    (url) => url.startsWith("https://") || url.startsWith("http://"),
    "ลิงก์ต้องขึ้นต้นด้วย https:// หรือ http://",
  ).optional().or(z.literal("")),
  maxScore: z.coerce.number().positive("คะแนนเต็มต้องมากกว่า 0").max(9999),
  activityDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/),
  dueDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  allowBonus: z.coerce.boolean().default(false),
  saveAsTemplate: z.coerce.boolean().default(false),
});

export const assignmentFilterSchema = z.object({
  classroom: idSchema.optional(),
  subject: idSchema.optional(),
  type: assignmentTypeSchema.optional(),
  status: assignmentStatusSchema.optional(),
  q: z.string().trim().max(120).optional(),
});

export const scoreRecordSchema = z.object({
  assignmentId: idSchema,
  studentId: idSchema,
  score: z.coerce.number().min(0).max(9999).nullable().optional(),
  status: assignmentStatusSchema,
  note: z.string().trim().max(500).optional().nullable(),
});

export const bulkScoreRecordSchema = z.object({
  assignmentId: idSchema,
  records: z.array(scoreRecordSchema.omit({ assignmentId: true })).min(1).max(80),
});
