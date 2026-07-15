import { z } from "zod";

export const missingScorePolicySchema = z.enum(["count_zero", "exclude_from_total"]);

export const scoreCategoryPolicySchema = z.object({
  key: z.string().trim().min(1).max(80),
  label: z.string().trim().min(1).max(120),
  weight: z.coerce.number().min(0).max(100),
});

export const gradeBandPolicySchema = z.object({
  label: z.string().trim().min(1).max(80),
  minPercent: z.coerce.number().min(0).max(100),
});

export const scoringPolicySchema = z.object({
  missingScorePolicy: missingScorePolicySchema,
  categories: z.array(scoreCategoryPolicySchema).min(1).refine((items) => {
    const total = items.reduce((sum, item) => sum + item.weight, 0);
    return total === 100;
  }, "น้ำหนักคะแนนรวมต้องเท่ากับ 100%"),
  gradeBands: z.array(gradeBandPolicySchema).min(2).refine((items) => {
    const values = items.map((item) => item.minPercent);
    return new Set(values).size === values.length && values.includes(0);
  }, "เกณฑ์ระดับต้องไม่ซ้ำกัน และต้องมีช่วงเริ่มต้นที่ 0%"),
});
