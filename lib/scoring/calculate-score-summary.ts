import type { AssignmentStatus } from "@/types/database";
import type { ScoringPolicy } from "@/types/settings";

export type ScoringCell = {
  score: number | null;
  maxScore: number;
  status: AssignmentStatus;
  categoryKey: string;
  categoryWeight: number;
};

export type ScoreSummary = {
  earnedScore: number;
  possibleScore: number;
  percent: number;
  gradeLabel: string;
  submittedCount: number;
  missingCount: number;
  revisionCount: number;
  pendingReviewCount: number;
  absentOrExemptCount: number;
};

const countedStatuses: AssignmentStatus[] = ["submitted", "passed", "pending_review", "revision"];

export function isScoreCellCounted(status: AssignmentStatus, policy: Pick<ScoringPolicy, "missingScorePolicy">) {
  return countedStatuses.includes(status) || (status === "missing" && policy.missingScorePolicy === "count_zero");
}

export function resolveGradeLabel(percent: number, policy: Pick<ScoringPolicy, "gradeBands">) {
  return [...policy.gradeBands]
    .sort((a, b) => b.minPercent - a.minPercent)
    .find((band) => percent >= band.minPercent)?.label ?? "ยังไม่กำหนด";
}

function roundedPercent(earned: number, possible: number) {
  return possible > 0 ? Math.round((earned / possible) * 100) : 0;
}

export function calculateScoreSummary(cells: ScoringCell[], policy: ScoringPolicy): ScoreSummary {
  const countedCells = cells.filter((cell) => isScoreCellCounted(cell.status, policy));
  const earnedScore = countedCells.reduce((sum, cell) => sum + (cell.score ?? 0), 0);
  const possibleScore = countedCells.reduce((sum, cell) => sum + cell.maxScore, 0);
  const categoryScores = new Map<string, { earned: number; possible: number; weight: number }>();

  for (const cell of countedCells) {
    const current = categoryScores.get(cell.categoryKey) ?? { earned: 0, possible: 0, weight: cell.categoryWeight };
    current.earned += cell.score ?? 0;
    current.possible += cell.maxScore;
    current.weight = cell.categoryWeight;
    categoryScores.set(cell.categoryKey, current);
  }

  const activeCategories = [...categoryScores.values()].filter((category) => category.possible > 0 && category.weight > 0);
  const activeWeight = activeCategories.reduce((sum, category) => sum + category.weight, 0);
  const percent = activeWeight > 0
    ? Math.round(activeCategories.reduce((sum, category) => sum + roundedPercent(category.earned, category.possible) * category.weight, 0) / activeWeight)
    : roundedPercent(earnedScore, possibleScore);

  return {
    earnedScore,
    possibleScore,
    percent,
    gradeLabel: resolveGradeLabel(percent, policy),
    submittedCount: cells.filter((cell) => cell.status === "submitted" || cell.status === "passed").length,
    missingCount: cells.filter((cell) => cell.status === "missing").length,
    revisionCount: cells.filter((cell) => cell.status === "revision").length,
    pendingReviewCount: cells.filter((cell) => cell.status === "pending_review").length,
    absentOrExemptCount: cells.filter((cell) => cell.status === "absent" || cell.status === "exempt").length,
  };
}
