import type { ManagementDataSource } from "@/types/management";

export type ScoreCategoryPolicy = {
  key: string;
  label: string;
  weight: number;
};

export type GradeBandPolicy = {
  label: string;
  minPercent: number;
};

export type MissingScorePolicy = "count_zero" | "exclude_from_total";

export type ScoringPolicy = {
  version: 1;
  categories: ScoreCategoryPolicy[];
  gradeBands: GradeBandPolicy[];
  missingScorePolicy: MissingScorePolicy;
  updatedAt: string;
};

export type ScoringPolicyViewModel = {
  source: ManagementDataSource;
  notice?: string;
  policy: ScoringPolicy;
  totalWeight: number;
  isBalanced: boolean;
};
