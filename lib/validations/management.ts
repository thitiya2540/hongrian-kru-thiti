import { z } from "zod";

export const idSchema = z.string().uuid();
export const colorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/);
export const studentStatusSchema = z.enum(["active", "transferred", "graduated", "inactive"]);

export const classroomFormSchema = z.object({
  id: idSchema.optional(),
  name: z.string().trim().min(1, "กรุณากรอกชื่อห้อง").max(120),
  gradeLevel: z.coerce.number().int().min(1).max(12),
  room: z.string().trim().min(1, "กรุณากรอกห้อง").max(30),
  academicTermId: idSchema,
  color: colorSchema.default("#6956D9"),
});

export const subjectFormSchema = z.object({
  id: idSchema.optional(),
  name: z.string().trim().min(1, "กรุณากรอกชื่อวิชา").max(120),
  subjectCode: z.string().trim().min(1, "กรุณากรอกรหัสวิชา").max(40),
  icon: z.string().trim().min(1).max(40).default("book-open"),
  color: colorSchema.default("#6956D9"),
});

export const studentFormSchema = z.object({
  id: idSchema.optional(),
  studentCode: z.string().trim().min(2, "กรุณากรอกรหัสนักเรียน").max(40),
  identityNumber: z.string().trim().max(30).optional(),
  firstName: z.string().trim().min(1, "กรุณากรอกชื่อ").max(100),
  lastName: z.string().trim().min(1, "กรุณากรอกนามสกุล").max(100),
  nickname: z.string().trim().max(80).optional(),
  numberInClass: z.coerce.number().int().positive().optional(),
  classroomId: idSchema,
  status: studentStatusSchema.default("active"),
  pin: z.string().trim().regex(/^[0-9]{4,12}$/, "PIN ต้องเป็นตัวเลข 4-12 หลัก").optional().or(z.literal("")),
});

export const academicTermFormSchema = z.object({
  academicYear: z.coerce.number().int().min(2500).max(2700),
  semester: z.coerce.number().int().min(1).max(2),
  isActive: z.coerce.boolean().default(false),
});
