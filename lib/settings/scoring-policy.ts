import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { resolveGradeLabel } from "@/lib/scoring/calculate-score-summary";
import type { Json } from "@/types/database";
import type { ScoringPolicy, ScoringPolicyViewModel } from "@/types/settings";

export const scoringPolicyKey = "scoring_policy";

export const defaultScoringPolicy: ScoringPolicy = {
  version: 1,
  updatedAt: new Date("2026-07-11T00:00:00+07:00").toISOString(),
  missingScorePolicy: "count_zero",
  categories: [
    { key: "คะแนนเก็บ", label: "คะแนนเก็บ / ใบงาน", weight: 50 },
    { key: "แบบทดสอบ", label: "แบบทดสอบ / Quiz", weight: 30 },
    { key: "กิจกรรม", label: "กิจกรรม / งานกลุ่ม", weight: 10 },
    { key: "อื่น ๆ", label: "อื่น ๆ", weight: 10 },
  ],
  gradeBands: [
    { label: "ดีเยี่ยม", minPercent: 80 },
    { label: "ดี", minPercent: 70 },
    { label: "พอใช้", minPercent: 60 },
    { label: "ผ่าน", minPercent: 50 },
    { label: "ต้องเสริม", minPercent: 0 },
  ],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function normalizeScoringPolicy(input: unknown): ScoringPolicy {
  if (!isRecord(input)) return defaultScoringPolicy;
  const categories = Array.isArray(input.categories)
    ? input.categories
        .map((category) => isRecord(category) ? {
          key: String(category.key ?? "").trim(),
          label: String(category.label ?? "").trim(),
          weight: Number(category.weight ?? 0),
        } : null)
        .filter((category): category is ScoringPolicy["categories"][number] => !!category && category.key.length > 0 && category.label.length > 0 && Number.isFinite(category.weight))
    : defaultScoringPolicy.categories;
  const gradeBands = Array.isArray(input.gradeBands)
    ? input.gradeBands
        .map((band) => isRecord(band) ? {
          label: String(band.label ?? "").trim(),
          minPercent: Number(band.minPercent ?? 0),
        } : null)
        .filter((band): band is ScoringPolicy["gradeBands"][number] => !!band && band.label.length > 0 && Number.isFinite(band.minPercent))
        .sort((a, b) => b.minPercent - a.minPercent)
    : defaultScoringPolicy.gradeBands;

  return {
    version: 1,
    updatedAt: typeof input.updatedAt === "string" ? input.updatedAt : new Date().toISOString(),
    missingScorePolicy: input.missingScorePolicy === "exclude_from_total" ? "exclude_from_total" : "count_zero",
    categories: categories.length > 0 ? categories : defaultScoringPolicy.categories,
    gradeBands: gradeBands.length > 0 ? gradeBands : defaultScoringPolicy.gradeBands,
  };
}

export function getPolicyTotalWeight(policy: ScoringPolicy) {
  return policy.categories.reduce((sum, category) => sum + category.weight, 0);
}

export function resolveScoreCategory(rawCategory: string, policy: ScoringPolicy) {
  const normalized = rawCategory.trim().toLowerCase();
  const exact = policy.categories.find((category) => category.key.toLowerCase() === normalized || category.label.toLowerCase() === normalized);
  if (exact) return exact.key;
  if (normalized.includes("แบบทดสอบ") || normalized.includes("quiz") || normalized.includes("สอบ")) return "แบบทดสอบ";
  if (normalized.includes("กิจกรรม") || normalized.includes("กลุ่ม")) return "กิจกรรม";
  if (normalized.includes("คะแนนเก็บ") || normalized.includes("ใบงาน") || normalized.includes("งาน")) return "คะแนนเก็บ";
  return "อื่น ๆ";
}

export function getGradeLabel(percent: number, policy: ScoringPolicy) {
  return resolveGradeLabel(percent, policy);
}

export async function getScoringPolicy(): Promise<ScoringPolicyViewModel> {
  if (!isSupabaseConfigured()) {
    return {
      source: "mock",
      notice: "ยังไม่ได้ตั้งค่า Supabase จึงใช้สูตรคะแนนตัวอย่างสำหรับตรวจหน้าจอ",
      policy: defaultScoringPolicy,
      totalWeight: getPolicyTotalWeight(defaultScoringPolicy),
      isBalanced: getPolicyTotalWeight(defaultScoringPolicy) === 100,
    };
  }

  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      return {
        source: "fallback",
        notice: "ยังไม่ได้เข้าสู่ระบบ จึงใช้สูตรคะแนนตัวอย่างชั่วคราว",
        policy: defaultScoringPolicy,
        totalWeight: getPolicyTotalWeight(defaultScoringPolicy),
        isBalanced: true,
      };
    }

    const { data, error } = await supabase
      .from("app_settings")
      .select("setting_value")
      .eq("teacher_id", user.id)
      .eq("setting_key", scoringPolicyKey)
      .maybeSingle();

    if (error) throw error;
    const policy = normalizeScoringPolicy((data?.setting_value ?? defaultScoringPolicy) as Json);
    const totalWeight = getPolicyTotalWeight(policy);

    return {
      source: "supabase",
      policy,
      totalWeight,
      isBalanced: totalWeight === 100,
    };
  } catch {
    return {
      source: "fallback",
      notice: "โหลดสูตรคะแนนจาก Supabase ไม่สำเร็จ ระบบจึงใช้สูตรตัวอย่างชั่วคราว",
      policy: defaultScoringPolicy,
      totalWeight: getPolicyTotalWeight(defaultScoringPolicy),
      isBalanced: true,
    };
  }
}
