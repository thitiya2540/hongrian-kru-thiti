import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { mockManagementData } from "@/lib/mock-data/management";
import type { Database, StudentStatus } from "@/types/database";
import type {
  ClassroomDetail,
  ClassroomSummary,
  ManagementDataSource,
  ManagementViewModel,
  StudentSummary,
  SubjectSummary,
  TermOption,
} from "@/types/management";

type Tables = Database["public"]["Tables"];
type TermRow = Tables["academic_terms"]["Row"];
type ClassroomRow = Tables["classrooms"]["Row"];
type StudentRow = Omit<Tables["students"]["Row"], "pin_hash">;
type ClassroomStudentRow = Tables["classroom_students"]["Row"];
type SubjectRow = Tables["subjects"]["Row"];
type ClassroomSubjectRow = Tables["classroom_subjects"]["Row"];
type AssignmentRow = Tables["assignments"]["Row"];
type StudentRecordRow = Tables["student_assignment_records"]["Row"];

const STUDENT_AVATAR_BUCKET = "student-avatars";

async function attachSignedAvatarUrls(
  supabase: Awaited<ReturnType<typeof createClient>>,
  students: StudentRow[],
): Promise<StudentRow[]> {
  const paths = [...new Set(students
    .map((student) => student.avatar_url)
    .filter((value): value is string => typeof value === "string" && !value.startsWith("http")))];
  if (paths.length === 0) return students;

  const { data, error } = await supabase.storage.from(STUDENT_AVATAR_BUCKET).createSignedUrls(paths, 60 * 60);
  if (error || !data) return students.map((student) => ({ ...student, avatar_url: null }));

  const signedUrlByPath = new Map(data.map((item) => [item.path, item.signedUrl]));
  return students.map((student) => ({
    ...student,
    avatar_url: student.avatar_url?.startsWith("http")
      ? student.avatar_url
      : student.avatar_url
        ? signedUrlByPath.get(student.avatar_url) ?? null
        : null,
  }));
}

function createFallback(source: ManagementDataSource, notice: string): ManagementViewModel {
  return { ...mockManagementData, source, notice };
}

function termLabel(term?: TermOption) {
  return term ? `ปีการศึกษา ${term.academicYear} · ภาคเรียนที่ ${term.semester}` : "ยังไม่ระบุภาคเรียน";
}

function classroomLabel(classroom?: Pick<ClassroomSummary, "gradeLevel" | "room">) {
  return classroom ? `ป.${classroom.gradeLevel}/${classroom.room}` : "ยังไม่จัดห้อง";
}

function formatThaiDate(value: string | null) {
  if (!value) return "ยังไม่มีงาน";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "ยังไม่มีงาน";

  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Bangkok",
  }).format(date);
}

function buildViewModel(
  source: ManagementDataSource,
  teacherName: string,
  termsRows: TermRow[],
  classroomRows: ClassroomRow[],
  studentRows: StudentRow[],
  classroomStudentRows: ClassroomStudentRow[],
  subjectRows: SubjectRow[],
  classroomSubjectRows: ClassroomSubjectRow[],
  assignmentRows: AssignmentRow[],
  recordRows: StudentRecordRow[],
  notice?: string,
): ManagementViewModel {
  const terms = termsRows.map<TermOption>((term) => ({
    id: term.id,
    academicYear: term.academic_year,
    semester: term.semester,
    isActive: term.is_active,
  }));
  const termById = new Map(terms.map((term) => [term.id, term]));
  const classroomById = new Map<string, ClassroomSummary>();
  const missingByStudent = new Map<string, number>();
  const revisionByStudent = new Map<string, number>();

  for (const record of recordRows) {
    if (record.status === "missing") {
      missingByStudent.set(record.student_id, (missingByStudent.get(record.student_id) ?? 0) + 1);
    }
    if (record.status === "revision") {
      revisionByStudent.set(record.student_id, (revisionByStudent.get(record.student_id) ?? 0) + 1);
    }
  }

  const activeStudentLinks = classroomStudentRows.filter((link) => link.is_active);
  const classroomAssignments = new Map<string, AssignmentRow[]>();
  for (const assignment of assignmentRows.filter((item) => item.is_active)) {
    const list = classroomAssignments.get(assignment.classroom_id) ?? [];
    list.push(assignment);
    classroomAssignments.set(assignment.classroom_id, list);
  }

  const classrooms = classroomRows.map<ClassroomSummary>((classroom) => {
    const students = activeStudentLinks.filter((link) => link.classroom_id === classroom.id).length;
    const subjects = classroomSubjectRows.filter((link) => link.classroom_id === classroom.id).length;
    const assignments = classroomAssignments.get(classroom.id) ?? [];
    const assignmentIds = new Set(assignments.map((assignment) => assignment.id));
    const pendingCount = recordRows.filter((record) => assignmentIds.has(record.assignment_id) && ["missing", "revision", "pending_review"].includes(record.status)).length;
    const latestActivity = assignments.map((assignment) => assignment.activity_date).sort().at(-1) ?? null;

    const mapped: ClassroomSummary = {
      id: classroom.id,
      name: classroom.name,
      gradeLevel: classroom.grade_level,
      room: classroom.room,
      academicTermId: classroom.academic_term_id,
      termLabel: termLabel(termById.get(classroom.academic_term_id)),
      color: classroom.color,
      isActive: classroom.is_active,
      studentCount: students,
      subjectCount: subjects,
      assignmentCount: assignments.length,
      pendingCount,
      latestActivityLabel: formatThaiDate(latestActivity),
    };
    classroomById.set(classroom.id, mapped);
    return mapped;
  });

  const studentClassroom = new Map<string, string>();
  for (const link of activeStudentLinks) {
    studentClassroom.set(link.student_id, link.classroom_id);
  }

  const students = studentRows.map<StudentSummary>((student) => {
    const currentClassroomId = studentClassroom.get(student.id) ?? null;
    return {
      id: student.id,
      studentCode: student.student_code,
      identityNumber: student.identity_number,
      firstName: student.first_name,
      lastName: student.last_name,
      nickname: student.nickname,
      avatarUrl: student.avatar_url,
      numberInClass: student.number_in_class,
      status: student.status as StudentStatus,
      classroomId: currentClassroomId,
      classroomLabel: classroomLabel(currentClassroomId ? classroomById.get(currentClassroomId) : undefined),
      missingCount: missingByStudent.get(student.id) ?? 0,
      revisionCount: revisionByStudent.get(student.id) ?? 0,
    };
  }).sort((a, b) => a.classroomLabel.localeCompare(b.classroomLabel, "th") || (a.numberInClass ?? 999) - (b.numberInClass ?? 999));

  const subjects = subjectRows.map<SubjectSummary>((subject) => {
    const links = classroomSubjectRows.filter((link) => link.subject_id === subject.id);
    const linkedAssignments = assignmentRows.filter((assignment) => assignment.subject_id === subject.id && assignment.is_active);
    return {
      id: subject.id,
      name: subject.name,
      subjectCode: subject.subject_code,
      icon: subject.icon,
      color: subject.color,
      isActive: subject.is_active,
      classroomIds: links.map((link) => link.classroom_id),
      classroomLabels: links.map((link) => classroomLabel(classroomById.get(link.classroom_id))),
      assignmentCount: linkedAssignments.length,
      totalMaxScore: linkedAssignments.reduce((sum, assignment) => sum + Number(assignment.max_score), 0),
    };
  });

  return { source, notice, teacherName, terms, classrooms, students, subjects };
}

export async function getManagementData(): Promise<ManagementViewModel> {
  if (!isSupabaseConfigured()) {
    return createFallback("mock", "ยังไม่ได้ตั้งค่า Supabase จึงยังไม่มีข้อมูลจริงให้แสดง");
  }

  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return createFallback("fallback", "ยังไม่ได้เข้าสู่ระบบ จึงไม่สามารถอ่านข้อมูลจริงได้");

    const [
      profileResult,
      termsResult,
      classroomsResult,
      studentsResult,
      classroomStudentsResult,
      subjectsResult,
      classroomSubjectsResult,
      assignmentsResult,
      recordsResult,
    ] = await Promise.all([
      supabase.from("profiles").select("display_name").eq("id", user.id).single(),
      supabase.from("academic_terms").select("*").order("academic_year", { ascending: false }).order("semester", { ascending: false }),
      supabase.from("classrooms").select("*").order("grade_level").order("room"),
      supabase.from("students").select("id, student_code, identity_number, first_name, last_name, nickname, number_in_class, status, created_by, created_at, updated_at, avatar_url").order("number_in_class"),
      supabase.from("classroom_students").select("*"),
      supabase.from("subjects").select("*").order("subject_code"),
      supabase.from("classroom_subjects").select("*"),
      supabase.from("assignments").select("*").order("activity_date", { ascending: false }),
      supabase.from("student_assignment_records").select("*"),
    ]);

    if (
      profileResult.error ||
      termsResult.error ||
      classroomsResult.error ||
      studentsResult.error ||
      classroomStudentsResult.error ||
      subjectsResult.error ||
      classroomSubjectsResult.error ||
      assignmentsResult.error ||
      recordsResult.error
    ) {
      return createFallback("fallback", "โหลดข้อมูลจาก Supabase ไม่สำเร็จ กรุณาตรวจการเชื่อมต่อแล้วลองใหม่");
    }

    const studentsWithSignedAvatars = await attachSignedAvatarUrls(supabase, studentsResult.data ?? []);

    return buildViewModel(
      "supabase",
      profileResult.data?.display_name ?? "คุณครู",
      termsResult.data ?? [],
      classroomsResult.data ?? [],
      studentsWithSignedAvatars,
      classroomStudentsResult.data ?? [],
      subjectsResult.data ?? [],
      classroomSubjectsResult.data ?? [],
      assignmentsResult.data ?? [],
      recordsResult.data ?? [],
    );
  } catch {
    return createFallback("fallback", "ไม่สามารถโหลดข้อมูลจริงได้ กรุณาตรวจการเชื่อมต่อแล้วลองใหม่");
  }
}

export async function getClassroomDetail(classroomId: string): Promise<ClassroomDetail | null> {
  const data = await getManagementData();
  const classroom = data.classrooms.find((item) => item.id === classroomId);
  if (!classroom) return null;

  const students = data.students.filter((student) => student.classroomId === classroomId);
  const subjects = data.subjects.filter((subject) => subject.classroomIds.includes(classroomId));

  if (!isSupabaseConfigured() || data.source !== "supabase") {
    return {
      ...classroom,
      students,
      subjects,
      recentAssignments: [],
      subjectAverages: [],
    };
  }

  const supabase = await createClient();
  const [{ data: recentAssignments }, { data: allAssignments }] = await Promise.all([
    supabase
      .from("assignments")
      .select("id, title, subject_id, activity_date, max_score")
      .eq("classroom_id", classroomId)
      .eq("is_active", true)
      .order("activity_date", { ascending: false })
      .limit(5),
    supabase
      .from("assignments")
      .select("id, subject_id, max_score")
      .eq("classroom_id", classroomId)
      .eq("is_active", true),
  ]);

  const subjectById = new Map(subjects.map((subject) => [subject.id, subject.name]));
  const assignmentIds = (allAssignments ?? []).map((assignment) => assignment.id);
  const { data: scoredRecords } = assignmentIds.length > 0
    ? await supabase
      .from("student_assignment_records")
      .select("assignment_id, score")
      .in("assignment_id", assignmentIds)
      .not("score", "is", null)
    : { data: [] };

  const assignmentSubjectAndMax = new Map((allAssignments ?? []).map((assignment) => [assignment.id, { subjectId: assignment.subject_id, maxScore: Number(assignment.max_score) }]));
  const subjectTotals = new Map<string, { earned: number; possible: number }>();
  for (const record of scoredRecords ?? []) {
    const info = assignmentSubjectAndMax.get(record.assignment_id);
    if (!info || record.score === null) continue;
    const current = subjectTotals.get(info.subjectId) ?? { earned: 0, possible: 0 };
    current.earned += Number(record.score);
    current.possible += info.maxScore;
    subjectTotals.set(info.subjectId, current);
  }

  return {
    ...classroom,
    students,
    subjects,
    recentAssignments: (recentAssignments ?? []).map((assignment) => ({
      id: assignment.id,
      title: assignment.title,
      subjectName: subjectById.get(assignment.subject_id) ?? "รายวิชา",
      activityDate: assignment.activity_date,
      maxScore: Number(assignment.max_score),
    })),
    subjectAverages: subjects.map((subject) => {
      const totals = subjectTotals.get(subject.id);
      return {
        subjectId: subject.id,
        subjectName: subject.name,
        averageScorePercent: totals && totals.possible > 0 ? Math.round((totals.earned / totals.possible) * 100) : 0,
      };
    }),
  };
}
