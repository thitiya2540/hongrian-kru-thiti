import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Database } from "@/types/database";
import type { LiveSetupCheck, LiveSetupHealth, LiveSetupMetric, LiveSetupStatus } from "@/types/live-setup";

type TableName = keyof Database["public"]["Tables"];

const requiredTables: TableName[] = [
  "profiles",
  "academic_terms",
  "classrooms",
  "students",
  "subjects",
  "assignments",
  "student_assignment_records",
  "activity_logs",
  "app_settings",
];

function statusFromCount(count: number | null, error?: unknown): LiveSetupStatus {
  if (error) return "fail";
  if ((count ?? 0) > 0) return "pass";
  return "warning";
}

function envCheck(id: string, label: string, ok: boolean, detailWhenOk: string, detailWhenMissing: string): LiveSetupCheck {
  return {
    id,
    label,
    detail: ok ? detailWhenOk : detailWhenMissing,
    status: ok ? "pass" : "fail",
  };
}

async function tableCount(supabase: Awaited<ReturnType<typeof createClient>>, table: TableName) {
  const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
  return { table, count: count ?? 0, error };
}

export async function getLiveSetupHealth(): Promise<LiveSetupHealth> {
  const hasUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasAnonKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const hasServiceRoleKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const configured = isSupabaseConfigured();
  const generatedAt = new Date().toISOString();

  const baseChecks: LiveSetupCheck[] = [
    envCheck("url", "NEXT_PUBLIC_SUPABASE_URL", hasUrl, "ตั้งค่า URL แล้ว", "ยังไม่มี URL ของ Supabase ใน .env.local"),
    envCheck("anon", "Supabase publishable key", hasAnonKey, "ตั้งค่า public key แล้ว", "ยังไม่มี publishable/anon key ใน .env.local"),
    {
      id: "service-role",
      label: "SUPABASE_SERVICE_ROLE_KEY",
      detail: hasServiceRoleKey ? "พบ service role key แต่แอปนี้ไม่จำเป็นต้องใช้ ควรถอดออกจาก Vercel" : "ไม่ได้ตั้งค่า ถูกต้องสำหรับแอปเวอร์ชันนี้",
      status: hasServiceRoleKey ? "warning" : "pass",
    },
  ];

  if (!configured) {
    return {
      source: "mock",
      generatedAt,
      configured,
      hasUrl,
      hasAnonKey,
      hasServiceRoleKey,
      authenticated: false,
      userEmail: null,
      checks: [
        ...baseChecks,
        { id: "connection", label: "เชื่อมต่อ Supabase", detail: "ยังตรวจฐานข้อมูลไม่ได้จนกว่าจะตั้งค่า URL และ anon key", status: "pending" },
      ],
      metrics: [
        { label: "สถานะฐานข้อมูล", value: "รอเชื่อม", helper: "เพิ่มค่าใน .env.local แล้ว restart dev server", status: "pending" },
      ],
      nextSteps: [
        "สร้าง Supabase project แล้วคัดลอก Project URL และ publishable key",
        "สร้างไฟล์ .env.local จาก .env.example แล้วกรอกค่า Supabase",
        "รัน npx supabase link --project-ref YOUR_PROJECT_REF และ npx supabase db push",
        "ไม่ต้องรัน --include-seed บนฐาน production",
      ],
    };
  }

  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const authenticated = Boolean(userData.user);
    const countResults = authenticated
      ? await Promise.all(requiredTables.map((table) => tableCount(supabase, table)))
      : [];
    const countByTable = new Map(countResults.map((result) => [result.table, result]));
    const failedTables = countResults.filter((result) => result.error).map((result) => result.table);
    const emptyCoreTables = ["profiles", "academic_terms", "classrooms", "students", "subjects"].filter((table) => {
      const result = countByTable.get(table as TableName);
      return result && !result.error && result.count === 0;
    });

    const checks: LiveSetupCheck[] = [
      ...baseChecks,
      {
        id: "auth",
        label: "Session ครู",
        detail: authenticated ? `เข้าสู่ระบบแล้ว${userData.user?.email ? `: ${userData.user.email}` : ""}` : "ยังไม่ได้เข้าสู่ระบบ จึงตรวจข้อมูลตาม RLS ไม่ได้",
        status: authenticated ? "pass" : "warning",
      },
      {
        id: "tables",
        label: "ตารางหลัก",
        detail: !authenticated
          ? "รอเข้าสู่ระบบก่อนตรวจตารางตามสิทธิ์"
          : failedTables.length === 0
            ? `ตรวจตารางหลักได้ครบ ${requiredTables.length} ตาราง`
            : `มีตารางที่อ่านไม่ได้หรือยังไม่มี migration: ${failedTables.join(", ")}`,
        status: !authenticated ? "pending" : failedTables.length === 0 ? "pass" : "fail",
      },
      {
        id: "seed",
        label: "ข้อมูลสำหรับเริ่มใช้งาน",
        detail: !authenticated
          ? "รอเข้าสู่ระบบก่อนตรวจจำนวนข้อมูล"
          : emptyCoreTables.length === 0
            ? "พบข้อมูลห้องเรียนและนักเรียนพร้อมใช้งาน"
            : `ฐานข้อมูลยังว่างหรืออยู่ระหว่างตั้งค่า: ${emptyCoreTables.join(", ")}`,
        status: !authenticated ? "pending" : emptyCoreTables.length === 0 ? "pass" : "warning",
      },
    ];

    const metric = (table: TableName, label: string, helper: string): LiveSetupMetric => {
      const result = countByTable.get(table);
      return {
        label,
        value: authenticated ? (result?.error ? "อ่านไม่ได้" : result?.count ?? 0) : "รอ login",
        helper,
        status: authenticated ? statusFromCount(result?.count ?? 0, result?.error) : "pending",
      };
    };

    return {
      source: "supabase",
      generatedAt,
      configured,
      hasUrl,
      hasAnonKey,
      hasServiceRoleKey,
      authenticated,
      userEmail: userData.user?.email ?? null,
      checks,
      metrics: [
        metric("profiles", "ผู้ใช้", "ต้องมีบัญชีครู/admin อย่างน้อย 1 บัญชี"),
        metric("classrooms", "ห้องเรียน", "ใช้ตรวจ scope และ Dashboard"),
        metric("students", "นักเรียน", "ข้อมูลหลักสำหรับคะแนนและรายงาน"),
        metric("assignments", "งาน / ภารกิจ", "ต้องมีงานเพื่อทดสอบบันทึกคะแนน"),
        metric("student_assignment_records", "รายการคะแนน", "ใช้ตรวจ Gradebook, Follow-up, Report"),
        metric("activity_logs", "Audit log", "ควรเพิ่มขึ้นเมื่อแก้คะแนน/ข้อมูลสำคัญ"),
      ],
      nextSteps: authenticated
        ? [
          "ทดสอบสร้าง/แก้นักเรียน 1 คน แล้วตรวจ Audit log",
          "สร้างงาน 1 งาน แล้วบันทึกคะแนนนักเรียนอย่างน้อย 2 สถานะ",
          "เปิด Gradebook, Reports, Follow-up และ Exports เทียบยอดกัน",
          "ทดสอบออกจากระบบแล้วลองเปิดหน้าครู ต้องถูกส่งกลับหน้า Login",
        ]
        : [
          "เข้าสู่ระบบด้วยบัญชีครูใน Supabase Auth",
          "ถ้ายังไม่มีบัญชี ให้สร้าง user ใน Supabase Auth และ profile ให้ตรง id",
          "หลัง login กลับมาหน้านี้เพื่อตรวจจำนวนตารางจริง",
        ],
    };
  } catch {
    return {
      source: "fallback",
      generatedAt,
      configured,
      hasUrl,
      hasAnonKey,
      hasServiceRoleKey,
      authenticated: false,
      userEmail: null,
      checks: [
        ...baseChecks,
        { id: "connection", label: "เชื่อมต่อ Supabase", detail: "เชื่อมต่อไม่ได้ ตรวจ URL, anon key, network และการ restart dev server", status: "fail" },
      ],
      metrics: [
        { label: "สถานะฐานข้อมูล", value: "เชื่อมต่อไม่ได้", helper: "ตรวจ .env.local และ Supabase project", status: "fail" },
      ],
      nextSteps: [
        "ตรวจว่า NEXT_PUBLIC_SUPABASE_URL และ NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (หรือ anon key เดิม) ถูกต้อง",
        "restart dev server หลังแก้ .env.local",
        "ตรวจว่า Supabase project ยัง active และไม่ได้ pause",
      ],
    };
  }
}
