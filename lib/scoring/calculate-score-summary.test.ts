import { describe, expect, it } from "vitest";
import { calculateScoreSummary, isScoreCellCounted, resolveGradeLabel, type ScoringCell } from "@/lib/scoring/calculate-score-summary";
import type { ScoringPolicy } from "@/types/settings";

const policy: ScoringPolicy = {
  version: 1,
  updatedAt: "2026-07-12T00:00:00.000Z",
  missingScorePolicy: "count_zero",
  categories: [
    { key: "งาน", label: "งาน", weight: 60 },
    { key: "สอบ", label: "สอบ", weight: 40 },
  ],
  gradeBands: [
    { label: "ดีเยี่ยม", minPercent: 80 },
    { label: "ผ่าน", minPercent: 50 },
    { label: "ต้องเสริม", minPercent: 0 },
  ],
};

function cell(overrides: Partial<ScoringCell> = {}): ScoringCell {
  return { score: 8, maxScore: 10, status: "submitted", categoryKey: "งาน", categoryWeight: 60, ...overrides };
}

describe("calculateScoreSummary", () => {
  it("คำนวณคะแนนรวมและร้อยละปกติ", () => {
    const result = calculateScoreSummary([cell(), cell({ score: 7 })], policy);
    expect(result).toMatchObject({ earnedScore: 15, possibleScore: 20, percent: 75, gradeLabel: "ผ่าน", submittedCount: 2 });
  });

  it("ถ่วงน้ำหนักแต่ละหมวดตามนโยบาย", () => {
    const result = calculateScoreSummary([
      cell({ score: 10, categoryKey: "งาน", categoryWeight: 60 }),
      cell({ score: 5, categoryKey: "สอบ", categoryWeight: 40 }),
    ], policy);
    expect(result.percent).toBe(80);
    expect(result.gradeLabel).toBe("ดีเยี่ยม");
  });

  it("นับงานยังไม่ส่งเป็นศูนย์เมื่อกำหนด count_zero", () => {
    const result = calculateScoreSummary([cell(), cell({ score: null, status: "missing" })], policy);
    expect(result).toMatchObject({ earnedScore: 8, possibleScore: 20, percent: 40, missingCount: 1 });
  });

  it("ไม่นับงานยังไม่ส่งเมื่อกำหนด exclude_from_total", () => {
    const excludingPolicy = { ...policy, missingScorePolicy: "exclude_from_total" as const };
    const result = calculateScoreSummary([cell(), cell({ score: null, status: "missing" })], excludingPolicy);
    expect(result).toMatchObject({ earnedScore: 8, possibleScore: 10, percent: 80, missingCount: 1 });
  });

  it("ไม่นับสถานะลาและยกเว้นในคะแนนเต็ม", () => {
    const result = calculateScoreSummary([
      cell(),
      cell({ score: null, status: "absent" }),
      cell({ score: null, status: "exempt" }),
    ], policy);
    expect(result).toMatchObject({ earnedScore: 8, possibleScore: 10, percent: 80, absentOrExemptCount: 2 });
  });

  it("ปัดร้อยละเป็นจำนวนเต็มด้วยกติกาเดียวกัน", () => {
    const result = calculateScoreSummary([cell({ score: 2, maxScore: 3 })], policy);
    expect(result.percent).toBe(67);
  });

  it("จัดระดับจากเกณฑ์ที่ไม่ได้เรียงลำดับได้", () => {
    const shuffledPolicy = { ...policy, gradeBands: [...policy.gradeBands].reverse() };
    expect(resolveGradeLabel(85, shuffledPolicy)).toBe("ดีเยี่ยม");
  });

  it("ระบุช่องที่นับคะแนนตามสถานะได้ถูกต้อง", () => {
    expect(isScoreCellCounted("revision", policy)).toBe(true);
    expect(isScoreCellCounted("absent", policy)).toBe(false);
    expect(isScoreCellCounted("exempt", policy)).toBe(false);
  });
});
