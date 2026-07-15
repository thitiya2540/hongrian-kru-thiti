import type { Json } from "@/types/database";
import type { ManagementDataSource } from "@/types/management";

export type AuditLogSummary = {
  totalLogs: number;
  scoreChanges: number;
  masterDataChanges: number;
  settingChanges: number;
  latestAt: string | null;
};

export type AuditLogItem = {
  id: string;
  userId: string | null;
  actorName: string;
  action: string;
  actionLabel: string;
  entityType: string;
  entityLabel: string;
  entityId: string | null;
  oldValue: Json | null;
  newValue: Json | null;
  changedFields: string[];
  createdAt: string;
  severity: "info" | "important" | "sensitive";
};

export type AuditFilters = {
  entityType?: string;
  action?: string;
  q?: string;
};

export type AuditViewModel = {
  source: ManagementDataSource;
  notice?: string;
  filters: AuditFilters;
  summary: AuditLogSummary;
  logs: AuditLogItem[];
};
