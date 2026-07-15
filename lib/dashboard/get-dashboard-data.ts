import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { dashboardRpcSchema, dashboardTermIdSchema, type DashboardRpcPayload } from "@/lib/validations/dashboard";
import { dashboardClassrooms, dashboardStats, todayTasks } from "@/lib/mock-data/dashboard";
import type { DashboardDataSource, DashboardViewModel } from "@/types/dashboard";

const mockTermId = "mock-2569-1";

function createMockDashboard(source: DashboardDataSource, notice?: string): DashboardViewModel {
  return {
    teacherName: "ครูธิติ",
    academicTerms: [{ id: mockTermId, academicYear: 2569, semester: 1, isActive: true }],
    selectedTermId: mockTermId,
    classrooms: dashboardClassrooms,
    todayTasks,
    stats: dashboardStats,
    source,
    notice,
  };
}

function formatLastUpdated(value: string | null) {
  if (!value) return "ยังไม่มีการบันทึก";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "ยังไม่มีการบันทึก";

  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Bangkok",
  }).format(date);
}

function mapRpcPayload(payload: DashboardRpcPayload): DashboardViewModel {
  return {
    teacherName: payload.teacher_name,
    academicTerms: payload.academic_terms.map((term) => ({
      id: term.id,
      academicYear: term.academic_year,
      semester: term.semester,
      isActive: term.is_active,
    })),
    selectedTermId: payload.selected_term_id ?? "",
    classrooms: payload.classrooms.map((classroom) => ({
      id: classroom.id,
      grade: classroom.grade,
      title: classroom.title,
      room: classroom.room,
      students: classroom.students,
      subjects: classroom.subjects,
      missing: classroom.missing,
      revision: classroom.revision,
      pendingReview: classroom.pending_review,
      completionRate: classroom.completion_rate,
      lastUpdated: formatLastUpdated(classroom.last_updated),
      theme: classroom.theme,
      scene: classroom.scene,
    })),
    todayTasks: payload.today_tasks.map((task) => ({
      id: task.id,
      title: task.title,
      classroom: task.classroom,
      subject: task.subject,
      status: task.status,
      studentCount: task.student_count,
      dueLabel: task.due_label,
    })),
    stats: {
      assignmentsThisTerm: payload.stats.assignments_this_term,
      submissionRate: payload.stats.submission_rate,
      studentsNeedAttention: payload.stats.students_need_attention,
    },
    source: "supabase",
  };
}

export async function getDashboardData(requestedTermId?: string): Promise<DashboardViewModel> {
  if (!isSupabaseConfigured()) {
    return createMockDashboard("mock", "ยังไม่ได้ตั้งค่า Supabase จึงยังไม่มีข้อมูลจริงให้แสดง");
  }

  try {
    const supabase = await createClient();
    const parsedTermId = dashboardTermIdSchema.safeParse(requestedTermId);
    const termId = parsedTermId.success ? parsedTermId.data : null;
    const { data, error } = await supabase.rpc("get_dashboard_overview", { p_term_id: termId });

    if (error) {
      return createMockDashboard("fallback", "เชื่อมต่อฐานข้อมูลไม่สำเร็จ ระบบจึงแสดงข้อมูลสำรองชั่วคราว");
    }

    const parsed = dashboardRpcSchema.safeParse(data);
    if (!parsed.success) {
      return createMockDashboard("fallback", "รูปแบบข้อมูลจากฐานข้อมูลไม่สมบูรณ์ ระบบจึงแสดงข้อมูลสำรองชั่วคราว");
    }

    return mapRpcPayload(parsed.data);
  } catch {
    return createMockDashboard("fallback", "ไม่สามารถโหลดข้อมูลจาก Supabase ได้ ระบบจึงแสดงข้อมูลสำรองชั่วคราว");
  }
}
