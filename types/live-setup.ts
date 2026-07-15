import type { ManagementDataSource } from "@/types/management";

export type LiveSetupStatus = "pass" | "warning" | "fail" | "pending";

export type LiveSetupCheck = {
  id: string;
  label: string;
  detail: string;
  status: LiveSetupStatus;
};

export type LiveSetupMetric = {
  label: string;
  value: string | number;
  helper: string;
  status: LiveSetupStatus;
};

export type LiveSetupHealth = {
  source: ManagementDataSource;
  generatedAt: string;
  configured: boolean;
  hasUrl: boolean;
  hasAnonKey: boolean;
  hasServiceRoleKey: boolean;
  authenticated: boolean;
  userEmail: string | null;
  checks: LiveSetupCheck[];
  metrics: LiveSetupMetric[];
  nextSteps: string[];
};
