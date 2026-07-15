import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Database, Json } from "@/types/database";
import type { AuditFilters, AuditLogItem, AuditLogSummary, AuditViewModel } from "@/types/audit";

type Tables = Database["public"]["Tables"];
type ActivityLogRow = Tables["activity_logs"]["Row"];

const actionLabels: Record<string, string> = {
  INSERT: "เพิ่มข้อมูล",
  UPDATE: "แก้ไขข้อมูล",
  DELETE: "ลบข้อมูล",
  insert: "เพิ่มข้อมูล",
  update: "แก้ไขข้อมูล",
  delete: "ลบข้อมูล",
  score_record_created: "สร้างรายการคะแนน",
  score_record_updated: "แก้ไขคะแนน/สถานะ",
  score_record_deleted: "ลบรายการคะแนน",
};

const entityLabels: Record<string, string> = {
  classrooms: "ห้องเรียน",
  students: "นักเรียน",
  subjects: "รายวิชา",
  assignments: "ภารกิจ / งาน",
  student_assignment_record: "รายการคะแนน",
  app_settings: "ตั้งค่าระบบ",
};

const sensitiveFields = new Set(["score", "status", "pin_hash", "setting_value", "amount", "reason"]);

function isRecord(value: Json | null): value is Record<string, Json | undefined> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function changedFields(oldValue: Json | null, newValue: Json | null) {
  if (!isRecord(oldValue) && !isRecord(newValue)) return [];
  const oldRecord = isRecord(oldValue) ? oldValue : {};
  const newRecord = isRecord(newValue) ? newValue : {};
  const keys = new Set([...Object.keys(oldRecord), ...Object.keys(newRecord)]);
  return [...keys]
    .filter((key) => key !== "pin_hash")
    .filter((key) => JSON.stringify(oldRecord[key]) !== JSON.stringify(newRecord[key]))
    .sort();
}

function severityFor(entityType: string, fields: string[]): AuditLogItem["severity"] {
  if (entityType === "student_assignment_record" || fields.some((field) => sensitiveFields.has(field))) return "sensitive";
  if (["students", "assignments", "app_settings"].includes(entityType)) return "important";
  return "info";
}

function mapLog(row: ActivityLogRow, actorName = "ผู้ใช้งานปัจจุบัน"): AuditLogItem {
  const fields = changedFields(row.old_value, row.new_value);
  return {
    id: row.id,
    userId: row.user_id,
    actorName,
    action: row.action,
    actionLabel: actionLabels[row.action] ?? row.action,
    entityType: row.entity_type,
    entityLabel: entityLabels[row.entity_type] ?? row.entity_type,
    entityId: row.entity_id,
    oldValue: row.old_value,
    newValue: row.new_value,
    changedFields: fields,
    createdAt: row.created_at,
    severity: severityFor(row.entity_type, fields),
  };
}

function applyFilters(logs: AuditLogItem[], filters?: AuditFilters) {
  const q = filters?.q?.trim().toLowerCase();
  return logs.filter((log) => {
    const matchesEntity = !filters?.entityType || log.entityType === filters.entityType;
    const matchesAction = !filters?.action || log.action === filters.action;
    const matchesSearch = !q || `${log.actorName} ${log.actionLabel} ${log.entityLabel} ${log.entityId ?? ""} ${log.changedFields.join(" ")}`.toLowerCase().includes(q);
    return matchesEntity && matchesAction && matchesSearch;
  });
}

function summarize(logs: AuditLogItem[]): AuditLogSummary {
  return {
    totalLogs: logs.length,
    scoreChanges: logs.filter((log) => log.entityType === "student_assignment_record").length,
    masterDataChanges: logs.filter((log) => ["classrooms", "students", "subjects", "assignments"].includes(log.entityType)).length,
    settingChanges: logs.filter((log) => log.entityType === "app_settings").length,
    latestAt: logs[0]?.createdAt ?? null,
  };
}

function mockLogs(): AuditLogItem[] {
  return [];
}

export function parseAuditFilters(input: { entity?: string; action?: string; q?: string }): AuditFilters {
  return {
    entityType: input.entity && input.entity !== "all" ? input.entity : undefined,
    action: input.action && input.action !== "all" ? input.action : undefined,
    q: input.q?.trim() || undefined,
  };
}

export async function getAuditData(filters?: AuditFilters): Promise<AuditViewModel> {
  if (!isSupabaseConfigured()) {
    const logs = applyFilters(mockLogs(), filters);
    return {
      source: "mock",
      notice: "ยังไม่ได้ตั้งค่า Supabase จึงยังไม่มีประวัติให้แสดง",
      filters: filters ?? {},
      summary: summarize(logs),
      logs,
    };
  }

  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      const logs = applyFilters(mockLogs(), filters);
      return {
        source: "fallback",
        notice: "ยังไม่ได้เข้าสู่ระบบ จึงยังไม่สามารถอ่านประวัติจริงได้",
        filters: filters ?? {},
        summary: summarize(logs),
        logs,
      };
    }

    const { data, error } = await supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(120);

    if (error) throw error;
    const logs = applyFilters((data ?? []).map((row) => mapLog(row)), filters);
    return {
      source: "supabase",
      filters: filters ?? {},
      summary: summarize(logs),
      logs,
    };
  } catch {
    const logs = applyFilters(mockLogs(), filters);
    return {
      source: "fallback",
      notice: "โหลดประวัติจาก Supabase ไม่สำเร็จ กรุณาตรวจการเชื่อมต่อแล้วลองใหม่",
      filters: filters ?? {},
      summary: summarize(logs),
      logs,
    };
  }
}
