import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { assignmentFilterSchema } from "@/lib/validations/assignments";
import { mockAssignmentsData, mockAssignmentStudents } from "@/lib/mock-data/assignments";
import { getManagementData } from "@/lib/management/get-management-data";
import { assignmentTypeLabels } from "@/lib/assignments/constants";
import type { AssignmentStatus, Database } from "@/types/database";
import type {
  AssignmentFilters,
  AssignmentStatusCounts,
  AssignmentStudentStatus,
  AssignmentSummary,
  AssignmentTemplateSummary,
  AssignmentsViewModel,
  AssignmentType,
  ScorebookViewModel,
} from "@/types/assignments";
import type { ManagementDataSource } from "@/types/management";

type Tables = Database["public"]["Tables"];
type AssignmentRow = Tables["assignments"]["Row"];
type TemplateRow = Tables["assignment_templates"]["Row"];
type RecordRow = Tables["student_assignment_records"]["Row"];

const statuses: AssignmentStatus[] = ["submitted", "missing", "revision", "passed", "pending_review", "absent", "exempt"];
const ASSIGNMENT_PREVIEW_BUCKET = "assignment-previews";

function emptyCounts(): AssignmentStatusCounts {
  return { submitted: 0, missing: 0, revision: 0, passed: 0, pending_review: 0, absent: 0, exempt: 0 };
}

function createFallback(source: ManagementDataSource, notice: string): AssignmentsViewModel {
  return { ...mockAssignmentsData, source, notice };
}

function mapTemplates(rows: TemplateRow[]): AssignmentTemplateSummary[] {
  return rows.map((template) => ({
    id: template.id,
    title: template.title,
    assignmentType: template.assignment_type as AssignmentType,
    recordingMode: template.recording_mode,
    defaultMaxScore: Number(template.default_max_score),
    category: template.category,
    description: template.description,
  }));
}

function applyFilters(assignments: AssignmentSummary[], filters?: AssignmentFilters) {
  return assignments.filter((assignment) => {
    const matchesClassroom = !filters?.classroomId || assignment.classroomId === filters.classroomId;
    const matchesSubject = !filters?.subjectId || assignment.subjectId === filters.subjectId;
    const matchesType = !filters?.assignmentType || assignment.assignmentType === filters.assignmentType;
    const matchesStatus = !filters?.status || assignment.counts[filters.status] > 0;
    const q = filters?.q?.toLowerCase();
    const matchesSearch = !q || `${assignment.title} ${assignment.subjectName} ${assignment.classroomLabel} ${assignment.category}`.toLowerCase().includes(q);
    return matchesClassroom && matchesSubject && matchesType && matchesStatus && matchesSearch;
  });
}

export function parseAssignmentFilters(input: { classroom?: string; subject?: string; type?: string; status?: string; q?: string }): AssignmentFilters {
  const parsed = assignmentFilterSchema.safeParse(input);
  if (!parsed.success) return {};
  return {
    classroomId: parsed.data.classroom,
    subjectId: parsed.data.subject,
    assignmentType: parsed.data.type,
    status: parsed.data.status,
    q: parsed.data.q,
  };
}

export async function getAssignmentsData(filters?: AssignmentFilters): Promise<AssignmentsViewModel> {
  if (!isSupabaseConfigured()) {
    return { ...mockAssignmentsData, assignments: applyFilters(mockAssignmentsData.assignments, filters) };
  }

  try {
    const [management, supabase] = await Promise.all([getManagementData(), createClient()]);
    if (management.source !== "supabase") {
      return createFallback("fallback", management.notice ?? "โหลดข้อมูลพื้นฐานไม่สำเร็จ ระบบจึงแสดงข้อมูลสำรองชั่วคราว");
    }

    const [assignmentsResult, recordsResult, templatesResult] = await Promise.all([
      supabase.from("assignments").select("*").order("activity_date", { ascending: false }).order("created_at", { ascending: false }),
      supabase.from("student_assignment_records").select("*"),
      supabase.from("assignment_templates").select("*").eq("is_active", true).order("updated_at", { ascending: false }),
    ]);

    if (assignmentsResult.error || recordsResult.error || templatesResult.error) {
      return createFallback("fallback", "โหลดข้อมูลงานจาก Supabase ไม่สำเร็จ ระบบจึงแสดงข้อมูลสำรองชั่วคราว");
    }

    const classroomById = new Map(management.classrooms.map((classroom) => [classroom.id, classroom]));
    const subjectById = new Map(management.subjects.map((subject) => [subject.id, subject]));
    const previewPaths = [...new Set((assignmentsResult.data ?? [])
      .map((assignment) => assignment.preview_image_path)
      .filter((path): path is string => typeof path === "string" && path.length > 0))];
    const signedPreviewResult = previewPaths.length > 0
      ? await supabase.storage.from(ASSIGNMENT_PREVIEW_BUCKET).createSignedUrls(previewPaths, 60 * 60)
      : { data: [], error: null };
    const signedPreviewByPath = new Map(
      (signedPreviewResult.data ?? []).map((preview) => [preview.path, preview.signedUrl]),
    );
    const recordsByAssignment = new Map<string, RecordRow[]>();
    for (const record of recordsResult.data ?? []) {
      const list = recordsByAssignment.get(record.assignment_id) ?? [];
      list.push(record);
      recordsByAssignment.set(record.assignment_id, list);
    }

    const assignments = (assignmentsResult.data ?? []).map<AssignmentSummary>((assignment: AssignmentRow) => {
      const counts = emptyCounts();
      const records = recordsByAssignment.get(assignment.id) ?? [];
      for (const status of statuses) {
        counts[status] = records.filter((record) => record.status === status).length;
      }
      const classroom = classroomById.get(assignment.classroom_id);
      const subject = subjectById.get(assignment.subject_id);

      return {
        id: assignment.id,
        classroomId: assignment.classroom_id,
        classroomLabel: classroom ? `ป.${classroom.gradeLevel}/${classroom.room}` : "ไม่พบห้อง",
        subjectId: assignment.subject_id,
        subjectName: subject?.name ?? "ไม่พบวิชา",
        templateId: assignment.template_id,
        title: assignment.title,
        assignmentType: assignment.assignment_type as AssignmentType,
        assignmentTypeLabel: assignmentTypeLabels[assignment.assignment_type as AssignmentType] ?? "อื่น ๆ",
        recordingMode: assignment.recording_mode,
        unitName: assignment.unit_name,
        category: assignment.category,
        description: assignment.description,
        previewImagePath: assignment.preview_image_path,
        previewImageUrl: assignment.preview_image_path ? signedPreviewByPath.get(assignment.preview_image_path) ?? null : null,
        resourceUrl: assignment.resource_url,
        maxScore: Number(assignment.max_score),
        activityDate: assignment.activity_date,
        dueDate: assignment.due_date,
        allowBonus: assignment.allow_bonus,
        isLocked: assignment.is_locked,
        isActive: assignment.is_active,
        createdAt: assignment.created_at,
        counts,
        totalRecords: records.length,
      };
    });

    return {
      source: "supabase",
      assignments: applyFilters(assignments, filters),
      templates: mapTemplates(templatesResult.data ?? []),
    };
  } catch {
    return createFallback("fallback", "ไม่สามารถโหลดข้อมูลงานได้ ระบบจึงแสดงข้อมูลสำรองชั่วคราว");
  }
}

export async function getAssignmentById(assignmentId: string): Promise<AssignmentSummary | null> {
  const data = await getAssignmentsData();
  return data.assignments.find((assignment) => assignment.id === assignmentId) ?? null;
}

export async function getAssignmentStudents(assignmentId: string, status?: AssignmentStatus): Promise<AssignmentStudentStatus[]> {
  if (!isSupabaseConfigured()) {
    return mockAssignmentStudents.filter((record) => !status || record.status === status);
  }

  try {
    const [management, supabase] = await Promise.all([getManagementData(), createClient()]);
    const { data, error } = await supabase
      .from("student_assignment_records")
      .select("id, assignment_id, student_id, score, status, note")
      .eq("assignment_id", assignmentId);

    if (error) return [];

    const studentById = new Map(management.students.map((student) => [student.id, student]));
    return (data ?? [])
      .filter((record) => !status || record.status === status)
      .map((record) => {
        const student = studentById.get(record.student_id);
        return {
          id: record.id,
          studentId: record.student_id,
          studentName: student ? `${student.firstName} ${student.lastName}` : "ไม่พบนักเรียน",
          nickname: student?.nickname ?? null,
          avatarUrl: student?.avatarUrl ?? null,
          numberInClass: student?.numberInClass ?? null,
          classroomLabel: student?.classroomLabel ?? "-",
          score: record.score === null ? null : Number(record.score),
          status: record.status,
          note: record.note,
        };
      })
      .sort((a, b) => (a.numberInClass ?? 999) - (b.numberInClass ?? 999));
  } catch {
    return [];
  }
}

export async function getScorebookData(assignmentId: string): Promise<ScorebookViewModel | null> {
  const [assignmentData, management] = await Promise.all([getAssignmentsData(), getManagementData()]);
  const assignment = assignmentData.assignments.find((item) => item.id === assignmentId);
  if (!assignment) return null;

  if (!isSupabaseConfigured() || assignmentData.source !== "supabase") {
    const classroomStudents = management.students.filter((student) => student.classroomId === assignment.classroomId);
    const recordsByStudent = new Map(mockAssignmentStudents.map((record) => [record.studentId, record]));
    return {
      source: assignmentData.source,
      notice: assignmentData.notice,
      assignment,
      records: classroomStudents.map((student) => {
        const existing = recordsByStudent.get(student.id);
        return {
          id: existing?.id ?? `mock-record-${student.id}`,
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`,
          nickname: student.nickname,
          avatarUrl: student.avatarUrl,
          numberInClass: student.numberInClass,
          classroomLabel: student.classroomLabel,
          score: existing?.score ?? null,
          status: existing?.status ?? "missing",
          note: existing?.note ?? null,
        };
      }),
    };
  }

  try {
    const supabase = await createClient();
    const [linksResult, recordsResult] = await Promise.all([
      supabase.from("classroom_students").select("student_id").eq("classroom_id", assignment.classroomId).eq("is_active", true),
      supabase.from("student_assignment_records").select("id, assignment_id, student_id, score, status, note").eq("assignment_id", assignmentId),
    ]);

    if (linksResult.error || recordsResult.error) {
      return { source: "fallback", notice: "โหลดข้อมูลบันทึกคะแนนไม่สำเร็จ", assignment, records: [] };
    }

    const studentById = new Map(management.students.map((student) => [student.id, student]));
    const recordsByStudent = new Map((recordsResult.data ?? []).map((record) => [record.student_id, record]));
    const records = (linksResult.data ?? [])
      .map((link) => {
        const student = studentById.get(link.student_id);
        const record = recordsByStudent.get(link.student_id);
        if (!student) return null;
        return {
          id: record?.id ?? `pending-${assignmentId}-${student.id}`,
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`,
          nickname: student.nickname,
          avatarUrl: student.avatarUrl,
          numberInClass: student.numberInClass,
          classroomLabel: student.classroomLabel,
          score: record?.score === null || record?.score === undefined ? null : Number(record.score),
          status: record?.status ?? "missing",
          note: record?.note ?? null,
        } satisfies AssignmentStudentStatus;
      })
      .filter((record): record is AssignmentStudentStatus => record !== null)
      .sort((a, b) => (a.numberInClass ?? 999) - (b.numberInClass ?? 999));

    return { source: "supabase", assignment, records };
  } catch {
    return { source: "fallback", notice: "ไม่สามารถโหลดข้อมูลบันทึกคะแนนได้", assignment, records: [] };
  }
}
