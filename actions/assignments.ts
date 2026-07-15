"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { assignmentFormSchema } from "@/lib/validations/assignments";
import { bulkScoreRecordSchema, scoreRecordSchema } from "@/lib/validations/assignments";
import { idSchema } from "@/lib/validations/management";
import type { AssignmentStatus, Database } from "@/types/database";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;
type AssignmentInsert = Database["public"]["Tables"]["assignments"]["Insert"];
type TemplateInsert = Database["public"]["Tables"]["assignment_templates"]["Insert"];

const ASSIGNMENT_PREVIEW_BUCKET = "assignment-previews";
const ASSIGNMENT_PREVIEW_MAX_SIZE = 5 * 1024 * 1024;
const ASSIGNMENT_PREVIEW_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ASSIGNMENT_PREVIEW_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function value(formData: FormData, key: string) {
  const formValue = formData.get(key);
  return typeof formValue === "string" ? formValue : undefined;
}

function optionalId(formData: FormData, key: string) {
  const raw = value(formData, key);
  return raw && raw.length > 0 ? raw : undefined;
}

function assignmentPreviewFile(formData: FormData) {
  const file = formData.get("previewImage");
  if (!(file instanceof File) || file.size === 0) return null;
  if (!ASSIGNMENT_PREVIEW_MIME_TYPES.has(file.type)) {
    throw new Error("ภาพตัวอย่างต้องเป็นไฟล์ JPG, PNG หรือ WebP เท่านั้น");
  }
  if (file.size > ASSIGNMENT_PREVIEW_MAX_SIZE) {
    throw new Error("ภาพตัวอย่างต้องมีขนาดไม่เกิน 5MB");
  }
  return file;
}

async function getAuthenticatedClient() {
  if (!isSupabaseConfigured()) throw new Error("ยังไม่ได้ตั้งค่า Supabase");
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("กรุณาเข้าสู่ระบบก่อนบันทึกข้อมูล");
  return { supabase, userId: data.user.id };
}

async function getActiveClassroomStudentIds(supabase: SupabaseClient, classroomId: string) {
  const { data, error } = await supabase
    .from("classroom_students")
    .select("student_id")
    .eq("classroom_id", classroomId)
    .eq("is_active", true);

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => row.student_id);
}

async function ensureStudentRecords(supabase: SupabaseClient, assignmentId: string, classroomId: string, userId: string, status: AssignmentStatus = "missing") {
  const studentIds = await getActiveClassroomStudentIds(supabase, classroomId);
  if (studentIds.length === 0) return;

  const { error } = await supabase.from("student_assignment_records").upsert(
    studentIds.map((studentId) => ({
      assignment_id: assignmentId,
      student_id: studentId,
      status,
      updated_by: userId,
    })),
    { onConflict: "assignment_id,student_id" },
  );

  if (error) throw new Error(error.message);
}

async function maybeSaveTemplate(supabase: SupabaseClient, userId: string, payload: ReturnType<typeof assignmentFormSchema.parse>) {
  if (!payload.saveAsTemplate) return payload.templateId || null;

  const template: TemplateInsert = {
    teacher_id: userId,
    title: payload.title,
    assignment_type: payload.assignmentType,
    recording_mode: payload.recordingMode,
    default_max_score: payload.maxScore,
    category: payload.category,
    description: payload.description || null,
    is_active: true,
  };

  const { data, error } = await supabase.from("assignment_templates").insert(template).select("id").single();
  if (error) throw new Error(error.message);
  return data.id;
}

export async function saveAssignmentAction(formData: FormData) {
  const previewImage = assignmentPreviewFile(formData);
  const removePreviewImage = value(formData, "removePreviewImage") === "true";
  const payload = assignmentFormSchema.parse({
    id: optionalId(formData, "id"),
    classroomId: value(formData, "classroomId"),
    subjectId: value(formData, "subjectId"),
    templateId: value(formData, "templateId") ?? "",
    title: value(formData, "title"),
    assignmentType: value(formData, "assignmentType"),
    recordingMode: value(formData, "recordingMode"),
    unitName: value(formData, "unitName"),
    category: value(formData, "category"),
    description: value(formData, "description"),
    resourceUrl: value(formData, "resourceUrl") ?? "",
    maxScore: value(formData, "maxScore"),
    activityDate: value(formData, "activityDate"),
    dueDate: value(formData, "dueDate") ?? "",
    allowBonus: value(formData, "allowBonus") === "true",
    autoRewardEnabled: false,
    saveAsTemplate: value(formData, "saveAsTemplate") === "true",
  });

  const { supabase, userId } = await getAuthenticatedClient();
  const existingAssignment = payload.id
    ? await supabase.from("assignments").select("preview_image_path").eq("id", payload.id).single()
    : null;
  if (existingAssignment?.error) throw new Error(existingAssignment.error.message);
  const previousPreviewPath = existingAssignment?.data?.preview_image_path ?? null;
  const assignmentId = payload.id ?? crypto.randomUUID();
  const templateId = await maybeSaveTemplate(supabase, userId, payload);
  let nextPreviewPath = removePreviewImage ? null : previousPreviewPath;

  if (previewImage) {
    const extension = ASSIGNMENT_PREVIEW_EXTENSIONS[previewImage.type] ?? "jpg";
    nextPreviewPath = `assignments/${userId}/${assignmentId}/${Date.now()}.${extension}`;
    const uploadResult = await supabase.storage.from(ASSIGNMENT_PREVIEW_BUCKET).upload(nextPreviewPath, previewImage, {
      cacheControl: "3600",
      contentType: previewImage.type,
      upsert: false,
    });
    if (uploadResult.error) throw new Error(`อัปโหลดภาพตัวอย่างไม่สำเร็จ: ${uploadResult.error.message}`);
  }

  const request: AssignmentInsert = {
    classroom_id: payload.classroomId,
    subject_id: payload.subjectId,
    template_id: templateId || null,
    title: payload.title,
    assignment_type: payload.assignmentType,
    recording_mode: payload.recordingMode,
    unit_name: payload.unitName || null,
    category: payload.category,
    description: payload.description || null,
    preview_image_path: nextPreviewPath,
    resource_url: payload.resourceUrl || null,
    max_score: payload.maxScore,
    activity_date: payload.activityDate,
    due_date: payload.dueDate || null,
    allow_bonus: payload.allowBonus,
    auto_reward_enabled: false,
    is_locked: false,
    is_active: true,
    created_by: userId,
  };

  const result = payload.id
    ? await supabase.from("assignments").update(request).eq("id", assignmentId).select("id").single()
    : await supabase.from("assignments").insert({ ...request, id: assignmentId }).select("id").single();

  if (result.error) {
    if (previewImage && nextPreviewPath) await supabase.storage.from(ASSIGNMENT_PREVIEW_BUCKET).remove([nextPreviewPath]);
    throw new Error(result.error.message);
  }
  if (nextPreviewPath !== previousPreviewPath && previousPreviewPath) {
    await supabase.storage.from(ASSIGNMENT_PREVIEW_BUCKET).remove([previousPreviewPath]);
  }

  await ensureStudentRecords(supabase, result.data.id, payload.classroomId, userId);

  revalidatePath("/assignments");
  revalidatePath("/dashboard");
  redirect(`/assignments/${result.data.id}/scores`);
}

export async function copyAssignmentAction(formData: FormData) {
  const id = idSchema.parse(value(formData, "id"));
  const { supabase, userId } = await getAuthenticatedClient();
  const { data: source, error } = await supabase.from("assignments").select("*").eq("id", id).single();
  if (error) throw new Error(error.message);

  const copied: AssignmentInsert = {
    classroom_id: source.classroom_id,
    subject_id: source.subject_id,
    template_id: source.template_id,
    title: `${source.title} (สำเนา)`,
    assignment_type: source.assignment_type,
    recording_mode: source.recording_mode,
    unit_name: source.unit_name,
    category: source.category,
    description: source.description,
    preview_image_path: null,
    resource_url: source.resource_url,
    max_score: Number(source.max_score),
    activity_date: source.activity_date,
    due_date: source.due_date,
    allow_bonus: source.allow_bonus,
    auto_reward_enabled: false,
    is_locked: false,
    is_active: true,
    created_by: userId,
  };

  const { data, error: insertError } = await supabase.from("assignments").insert(copied).select("id").single();
  if (insertError) throw new Error(insertError.message);
  await ensureStudentRecords(supabase, data.id, source.classroom_id, userId);

  revalidatePath("/assignments");
  revalidatePath("/dashboard");
}

export async function toggleAssignmentLockAction(formData: FormData) {
  const id = idSchema.parse(value(formData, "id"));
  const isLocked = value(formData, "isLocked") === "true";
  const { supabase } = await getAuthenticatedClient();
  const { error } = await supabase.from("assignments").update({ is_locked: isLocked }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/assignments");
}

export async function toggleAssignmentActiveAction(formData: FormData) {
  const id = idSchema.parse(value(formData, "id"));
  const isActive = value(formData, "isActive") === "true";
  const { supabase } = await getAuthenticatedClient();
  const { error } = await supabase.from("assignments").update({ is_active: isActive }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/assignments");
  revalidatePath("/dashboard");
}

async function assertAssignmentEditable(supabase: SupabaseClient, assignmentId: string, score: number | null | undefined) {
  const { data, error } = await supabase
    .from("assignments")
    .select("id, max_score, allow_bonus, is_locked, classroom_id")
    .eq("id", assignmentId)
    .single();

  if (error) throw new Error(error.message);
  if (data.is_locked) throw new Error("งานนี้ถูกล็อกแล้ว กรุณาปลดล็อกก่อนแก้คะแนน");
  if (score !== null && typeof score === "number" && !data.allow_bonus && score > Number(data.max_score)) {
    throw new Error("คะแนนเกินคะแนนเต็ม และงานนี้ยังไม่เปิดคะแนนโบนัส");
  }

  return data;
}

export async function saveScoreRecordAction(input: unknown) {
  const payload = scoreRecordSchema.parse(input);
  const { supabase, userId } = await getAuthenticatedClient();
  await assertAssignmentEditable(supabase, payload.assignmentId, payload.score);

  const submittedAt = payload.status === "submitted" || payload.status === "passed" ? new Date().toISOString() : null;
  const revisedAt = payload.status === "revision" ? new Date().toISOString() : null;
  const { error } = await supabase.from("student_assignment_records").upsert(
    {
      assignment_id: payload.assignmentId,
      student_id: payload.studentId,
      score: payload.score ?? null,
      status: payload.status,
      note: payload.note || null,
      submitted_at: submittedAt,
      revised_at: revisedAt,
      updated_by: userId,
    },
    { onConflict: "assignment_id,student_id" },
  );

  if (error) throw new Error(error.message);
  revalidatePath(`/assignments/${payload.assignmentId}/scores`);
  revalidatePath("/assignments");
  revalidatePath("/dashboard");
  revalidatePath("/gradebook");
  revalidatePath("/reports");
  return { ok: true, savedAt: new Date().toISOString() };
}

export async function saveScoreRecordsBulkAction(input: unknown) {
  const payload = bulkScoreRecordSchema.parse(input);
  const { supabase, userId } = await getAuthenticatedClient();
  const assignment = await assertAssignmentEditable(supabase, payload.assignmentId, null);

  for (const record of payload.records) {
    if (record.score !== null && typeof record.score === "number" && !assignment.allow_bonus && record.score > Number(assignment.max_score)) {
      throw new Error("มีคะแนนบางรายการเกินคะแนนเต็ม");
    }
  }

  const now = new Date().toISOString();
  const { error } = await supabase.from("student_assignment_records").upsert(
    payload.records.map((record) => ({
      assignment_id: payload.assignmentId,
      student_id: record.studentId,
      score: record.score ?? null,
      status: record.status,
      note: record.note || null,
      submitted_at: record.status === "submitted" || record.status === "passed" ? now : null,
      revised_at: record.status === "revision" ? now : null,
      updated_by: userId,
    })),
    { onConflict: "assignment_id,student_id" },
  );

  if (error) throw new Error(error.message);
  revalidatePath(`/assignments/${payload.assignmentId}/scores`);
  revalidatePath("/assignments");
  revalidatePath("/dashboard");
  revalidatePath("/gradebook");
  revalidatePath("/reports");
  return { ok: true, savedAt: now, count: payload.records.length };
}
