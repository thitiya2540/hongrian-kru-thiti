"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  academicTermFormSchema,
  classroomFormSchema,
  idSchema,
  studentFormSchema,
  studentStatusSchema,
  subjectFormSchema,
} from "@/lib/validations/management";
import { parseStudentCsv } from "@/lib/students/csv";
import type { Json, StudentStatus } from "@/types/database";

const STUDENT_AVATAR_BUCKET = "student-avatars";
const STUDENT_AVATAR_MAX_SIZE = 2 * 1024 * 1024;
const STUDENT_AVATAR_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const STUDENT_AVATAR_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type ClassroomFormState = {
  status?: "success" | "error";
  message?: string;
};

export type StudentCsvImportState = {
  status?: "success" | "error";
  message?: string;
  importedCount?: number;
};

function value(formData: FormData, key: string) {
  const formValue = formData.get(key);
  return typeof formValue === "string" ? formValue : undefined;
}

function optionalId(formData: FormData, key: string) {
  const raw = value(formData, key);
  return raw && raw.length > 0 ? raw : undefined;
}

function avatarFile(formData: FormData) {
  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) return null;
  if (!STUDENT_AVATAR_MIME_TYPES.has(file.type)) throw new Error("รูปโปรไฟล์ต้องเป็นไฟล์ JPG, PNG หรือ WebP เท่านั้น");
  if (file.size > STUDENT_AVATAR_MAX_SIZE) throw new Error("รูปโปรไฟล์ต้องมีขนาดไม่เกิน 2MB");
  return file;
}

async function getAuthenticatedClient() {
  if (!isSupabaseConfigured()) throw new Error("ยังไม่ได้ตั้งค่า Supabase");
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("กรุณาเข้าสู่ระบบก่อนบันทึกข้อมูล");
  return { supabase, userId: data.user.id };
}

export async function saveClassroomAction(_previousState: ClassroomFormState, formData: FormData): Promise<ClassroomFormState> {
  const parsed = classroomFormSchema.safeParse({
    id: optionalId(formData, "id"),
    name: value(formData, "name"),
    gradeLevel: value(formData, "gradeLevel"),
    room: value(formData, "room"),
    academicTermId: value(formData, "academicTermId"),
    color: value(formData, "color") ?? "#6956D9",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "กรุณาตรวจสอบข้อมูลห้องเรียนอีกครั้ง",
    };
  }

  try {
    const payload = parsed.data;
    const { supabase, userId } = await getAuthenticatedClient();

    const request = {
      name: payload.name,
      grade_level: payload.gradeLevel,
      room: payload.room,
      academic_term_id: payload.academicTermId,
      teacher_id: userId,
      color: payload.color,
      is_active: true,
    };

    const result = payload.id
      ? await supabase.from("classrooms").update(request).eq("id", payload.id)
      : await supabase.from("classrooms").insert(request);

    if (result.error) {
      if (result.error.code === "23505") {
        return { status: "error", message: "มีห้องเรียนระดับชั้นและห้องนี้ในภาคเรียนนี้แล้ว กรุณาเปลี่ยนระดับชั้นหรือเลขห้อง" };
      }

      return { status: "error", message: `บันทึกห้องเรียนไม่สำเร็จ: ${result.error.message}` };
    }

    revalidatePath("/classrooms");
    revalidatePath("/dashboard");
    return { status: "success", message: payload.id ? "บันทึกการแก้ไขห้องเรียนแล้ว" : "เพิ่มห้องเรียนเรียบร้อยแล้ว" };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "บันทึกห้องเรียนไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
    };
  }
}

export async function toggleClassroomAction(formData: FormData) {
  const id = idSchema.parse(value(formData, "id"));
  const isActive = value(formData, "isActive") === "true";
  const { supabase } = await getAuthenticatedClient();
  const { error } = await supabase.from("classrooms").update({ is_active: isActive }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/classrooms");
  revalidatePath("/dashboard");
}

export async function saveSubjectAction(formData: FormData) {
  const payload = subjectFormSchema.parse({
    id: optionalId(formData, "id"),
    name: value(formData, "name"),
    subjectCode: value(formData, "subjectCode"),
    icon: value(formData, "icon") ?? "book-open",
    color: value(formData, "color") ?? "#6956D9",
  });
  const { supabase, userId } = await getAuthenticatedClient();

  const request = {
    name: payload.name,
    subject_code: payload.subjectCode,
    icon: payload.icon,
    color: payload.color,
    created_by: userId,
    is_active: true,
  };

  const result = payload.id
    ? await supabase.from("subjects").update(request).eq("id", payload.id)
    : await supabase.from("subjects").insert(request);

  if (result.error) throw new Error(result.error.message);
  revalidatePath("/subjects");
  revalidatePath("/settings");
  revalidatePath("/dashboard");
}

export async function toggleSubjectAction(formData: FormData) {
  const id = idSchema.parse(value(formData, "id"));
  const isActive = value(formData, "isActive") === "true";
  const { supabase } = await getAuthenticatedClient();
  const { error } = await supabase.from("subjects").update({ is_active: isActive }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/subjects");
  revalidatePath("/settings");
}

export async function assignSubjectClassroomsAction(formData: FormData) {
  const subjectId = idSchema.parse(value(formData, "subjectId"));
  const classroomIds = formData.getAll("classroomIds").filter((item): item is string => typeof item === "string");
  const parsedClassroomIds = classroomIds.map((id) => idSchema.parse(id));
  const { supabase, userId } = await getAuthenticatedClient();

  const deleteResult = await supabase.from("classroom_subjects").delete().eq("subject_id", subjectId);
  if (deleteResult.error) throw new Error(deleteResult.error.message);

  if (parsedClassroomIds.length > 0) {
    const { error } = await supabase.from("classroom_subjects").insert(
      parsedClassroomIds.map((classroomId) => ({
        classroom_id: classroomId,
        subject_id: subjectId,
        teacher_id: userId,
      })),
    );
    if (error) throw new Error(error.message);
  }

  revalidatePath("/subjects");
  revalidatePath("/classrooms");
  revalidatePath("/dashboard");
}

export async function saveStudentAction(formData: FormData) {
  const avatar = avatarFile(formData);
  const payload = studentFormSchema.parse({
    id: optionalId(formData, "id"),
    studentCode: value(formData, "studentCode"),
    identityNumber: value(formData, "identityNumber"),
    firstName: value(formData, "firstName"),
    lastName: value(formData, "lastName"),
    nickname: value(formData, "nickname"),
    numberInClass: value(formData, "numberInClass"),
    classroomId: value(formData, "classroomId"),
    status: value(formData, "status") ?? "active",
    pin: value(formData, "pin") ?? "",
  });
  const { supabase } = await getAuthenticatedClient();
  const { data: studentId, error } = await supabase.rpc("upsert_student_with_pin", {
    p_student_id: payload.id ?? null,
    p_student_code: payload.studentCode,
    p_identity_number: payload.identityNumber || null,
    p_first_name: payload.firstName,
    p_last_name: payload.lastName,
    p_nickname: payload.nickname || null,
    p_number_in_class: payload.numberInClass ?? null,
    p_classroom_id: payload.classroomId,
    p_status: payload.status as StudentStatus,
    p_pin: payload.pin || null,
  });

  if (error) throw new Error(error.message);
  if (!studentId) throw new Error("บันทึกข้อมูลนักเรียนแล้ว แต่ไม่พบรหัสนักเรียนสำหรับผูกรูปโปรไฟล์");

  if (avatar) {
    const extension = STUDENT_AVATAR_EXTENSIONS[avatar.type] ?? "jpg";
    const path = `students/${studentId}/${Date.now()}.${extension}`;
    const uploadResult = await supabase.storage.from(STUDENT_AVATAR_BUCKET).upload(path, avatar, {
      cacheControl: "3600",
      contentType: avatar.type,
      upsert: true,
    });

    if (uploadResult.error) {
      throw new Error(`อัปโหลดรูปโปรไฟล์ไม่สำเร็จ: ${uploadResult.error.message}`);
    }

    const updateResult = await supabase.from("students").update({ avatar_url: path }).eq("id", studentId);
    if (updateResult.error) throw new Error(`บันทึกลิงก์รูปโปรไฟล์ไม่สำเร็จ: ${updateResult.error.message}`);
  }

  revalidatePath("/students");
  revalidatePath(`/students/${studentId}`);
  revalidatePath("/classrooms");
  revalidatePath("/dashboard");
  revalidatePath("/quick-score");
}

function csvImportErrorMessage(message: string) {
  const messages: Record<string, string> = {
    classroom_not_allowed: "คุณไม่มีสิทธิ์นำเข้าข้อมูลในห้องเรียนนี้",
    csv_rows_required: "ไม่พบรายชื่อนักเรียนในไฟล์",
    csv_rows_limit_exceeded: "นำเข้าได้ครั้งละไม่เกิน 200 คน",
    csv_duplicate_student_code: "พบรหัสนักเรียนซ้ำกันในไฟล์ ระบบยังไม่ได้บันทึกข้อมูล",
    csv_student_code_already_exists: "มีรหัสนักเรียนนี้อยู่ในระบบแล้ว ระบบยังไม่ได้บันทึกข้อมูล",
    csv_duplicate_identity_number: "พบเลขประจำตัวซ้ำกันในไฟล์ ระบบยังไม่ได้บันทึกข้อมูล",
    csv_identity_number_already_exists: "มีเลขประจำตัวนี้อยู่ในระบบแล้ว ระบบยังไม่ได้บันทึกข้อมูล",
  };
  if (messages[message]) return messages[message];
  if (message.startsWith("csv_invalid_")) return "พบข้อมูลไม่ถูกต้องในไฟล์ กรุณาตรวจข้อมูลตามไฟล์ตัวอย่างแล้วลองใหม่";
  return "นำเข้ารายชื่อนักเรียนไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
}

export async function importStudentsCsvAction(_previousState: StudentCsvImportState, formData: FormData): Promise<StudentCsvImportState> {
  try {
    const classroomId = idSchema.safeParse(value(formData, "classroomId"));
    if (!classroomId.success) return { status: "error", message: "กรุณาเลือกห้องเรียนก่อนนำเข้า" };

    const file = formData.get("csvFile");
    if (!(file instanceof File) || file.size === 0) return { status: "error", message: "กรุณาเลือกไฟล์ CSV" };
    if (file.size > 1024 * 1024) return { status: "error", message: "ไฟล์ CSV ต้องมีขนาดไม่เกิน 1MB" };

    const parsed = parseStudentCsv(await file.text());
    if (parsed.errors.length > 0) {
      return { status: "error", message: `${parsed.errors[0]}${parsed.errors.length > 1 ? ` (พบทั้งหมด ${parsed.errors.length} จุด)` : ""}` };
    }

    const { supabase } = await getAuthenticatedClient();
    const { data, error } = await supabase.rpc("import_students_from_csv", {
      p_classroom_id: classroomId.data,
      p_rows: parsed.rows.map((row) => ({
        studentCode: row.studentCode,
        identityNumber: row.identityNumber,
        firstName: row.firstName,
        lastName: row.lastName,
        nickname: row.nickname,
        numberInClass: row.numberInClass,
        pin: row.pin,
      })) as Json,
    });
    if (error) return { status: "error", message: csvImportErrorMessage(error.message) };

    revalidatePath("/students");
    revalidatePath("/classrooms");
    revalidatePath(`/classrooms/${classroomId.data}`);
    revalidatePath("/dashboard");
    revalidatePath("/quick-score");
    return { status: "success", message: `นำเข้านักเรียน ${data ?? parsed.rows.length} คนเรียบร้อยแล้ว`, importedCount: data ?? parsed.rows.length };
  } catch (error) {
    return { status: "error", message: error instanceof Error ? csvImportErrorMessage(error.message) : "นำเข้ารายชื่อนักเรียนไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" };
  }
}

export async function updateStudentStatusAction(formData: FormData) {
  const id = idSchema.parse(value(formData, "id"));
  const status = studentStatusSchema.parse(value(formData, "status"));
  const { supabase } = await getAuthenticatedClient();
  const { error } = await supabase.from("students").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/students");
  revalidatePath("/classrooms");
  revalidatePath("/dashboard");
}

export async function saveAcademicTermAction(formData: FormData) {
  const payload = academicTermFormSchema.parse({
    academicYear: value(formData, "academicYear"),
    semester: value(formData, "semester"),
    isActive: value(formData, "isActive") === "true",
  });
  const { supabase } = await getAuthenticatedClient();

  if (payload.isActive) {
    const deactivate = await supabase.from("academic_terms").update({ is_active: false }).eq("is_active", true);
    if (deactivate.error) throw new Error(deactivate.error.message);
  }

  const { error } = await supabase.from("academic_terms").upsert(
    {
      academic_year: payload.academicYear,
      semester: payload.semester,
      is_active: payload.isActive,
    },
    { onConflict: "academic_year,semester" },
  );

  if (error) throw new Error(error.message);
  revalidatePath("/settings");
  revalidatePath("/classrooms");
  revalidatePath("/dashboard");
}
