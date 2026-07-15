"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { scoringPolicyKey } from "@/lib/settings/scoring-policy";
import { scoringPolicySchema } from "@/lib/validations/settings";
import type { ScoringPolicy } from "@/types/settings";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

async function getAuthenticatedClient() {
  if (!isSupabaseConfigured()) throw new Error("ยังไม่ได้ตั้งค่า Supabase");
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("กรุณาเข้าสู่ระบบก่อนบันทึกข้อมูล");
  return { supabase, userId: data.user.id };
}

export async function saveScoringPolicyAction(formData: FormData) {
  const categories = ["คะแนนเก็บ", "แบบทดสอบ", "กิจกรรม", "อื่น ๆ"].map((key) => ({
    key,
    label: getString(formData, `label_${key}`) || key,
    weight: getString(formData, `weight_${key}`),
  }));
  const gradeBands = ["excellent", "good", "fair", "pass", "support"].map((key) => ({
    label: getString(formData, `grade_label_${key}`),
    minPercent: getString(formData, `grade_min_${key}`),
  }));
  const parsed = scoringPolicySchema.parse({
    missingScorePolicy: getString(formData, "missingScorePolicy"),
    categories,
    gradeBands,
  });
  const { supabase, userId } = await getAuthenticatedClient();
  const policy: ScoringPolicy = {
    version: 1,
    updatedAt: new Date().toISOString(),
    missingScorePolicy: parsed.missingScorePolicy,
    categories: parsed.categories,
    gradeBands: parsed.gradeBands.sort((a, b) => b.minPercent - a.minPercent),
  };
  const { error } = await supabase.from("app_settings").upsert(
    {
      teacher_id: userId,
      setting_key: scoringPolicyKey,
      setting_value: policy,
    },
    { onConflict: "teacher_id,setting_key" },
  );
  if (error) throw new Error(error.message);
  revalidatePath("/settings");
  revalidatePath("/gradebook");
  revalidatePath("/api/gradebook/export");
}
