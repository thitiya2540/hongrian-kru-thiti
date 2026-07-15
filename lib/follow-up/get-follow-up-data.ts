import { getAssignmentsData } from "@/lib/assignments/get-assignments-data";
import { getManagementData } from "@/lib/management/get-management-data";
import type { AssignmentSummary } from "@/types/assignments";
import type {
  FollowUpFilters,
  FollowUpPriority,
  FollowUpQueueItem,
  FollowUpStatusGroup,
  FollowUpStudentRisk,
  FollowUpSummary,
  FollowUpViewModel,
} from "@/types/follow-up";

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function daysFromDue(dueDate: string | null) {
  if (!dueDate) return null;
  const due = new Date(`${dueDate}T00:00:00`);
  if (Number.isNaN(due.getTime())) return null;
  const diff = due.getTime() - startOfToday().getTime();
  return Math.round(diff / 86_400_000);
}

function formatDueLabel(dueDate: string | null) {
  const diff = daysFromDue(dueDate);
  if (diff === null) return "ไม่กำหนดวันส่ง";
  if (diff < 0) return `เกินกำหนด ${Math.abs(diff)} วัน`;
  if (diff === 0) return "ครบกำหนดวันนี้";
  if (diff === 1) return "ครบกำหนดพรุ่งนี้";
  return `เหลือ ${diff} วัน`;
}

function priorityForAssignment(assignment: AssignmentSummary): FollowUpPriority {
  const diff = daysFromDue(assignment.dueDate);
  const unresolved = assignment.counts.missing + assignment.counts.revision;
  if ((diff !== null && diff < 0 && unresolved > 0) || unresolved >= 5) return "critical";
  if ((diff !== null && diff <= 1 && unresolved > 0) || assignment.counts.pending_review > 0) return "warning";
  return "normal";
}

function priorityForStudent(totalIssueCount: number): FollowUpPriority {
  if (totalIssueCount >= 5) return "critical";
  if (totalIssueCount >= 3) return "warning";
  return "normal";
}

function actionLabel(item: Pick<AssignmentSummary, "counts">) {
  if (item.counts.pending_review > 0) return "ตรวจคะแนน";
  if (item.counts.revision > 0) return "ติดตามงานแก้";
  return "ติดตามงานค้าง";
}

function mapAssignmentToQueue(assignment: AssignmentSummary): FollowUpQueueItem | null {
  const missingCount = assignment.counts.missing;
  const revisionCount = assignment.counts.revision;
  const pendingReviewCount = assignment.counts.pending_review;
  const totalActionCount = missingCount + revisionCount + pendingReviewCount;
  if (totalActionCount === 0) return null;

  return {
    id: `follow-${assignment.id}`,
    assignmentId: assignment.id,
    title: assignment.title,
    classroomId: assignment.classroomId,
    classroomLabel: assignment.classroomLabel,
    subjectName: assignment.subjectName,
    dueDate: assignment.dueDate,
    dueLabel: formatDueLabel(assignment.dueDate),
    daysFromDue: daysFromDue(assignment.dueDate),
    priority: priorityForAssignment(assignment),
    actionLabel: actionLabel(assignment),
    actionHref: `/assignments/${assignment.id}/scores`,
    missingCount,
    revisionCount,
    pendingReviewCount,
    totalActionCount,
  };
}

function summarize(queue: FollowUpQueueItem[], students: FollowUpStudentRisk[]): FollowUpSummary {
  return {
    urgentAssignments: queue.filter((item) => item.priority === "critical").length,
    dueTodayAssignments: queue.filter((item) => item.daysFromDue === 0).length,
    pendingReviewRecords: queue.reduce((sum, item) => sum + item.pendingReviewCount, 0),
    revisionRecords: queue.reduce((sum, item) => sum + item.revisionCount, 0),
    atRiskStudents: students.length,
  };
}

function applyQueueFilters(queue: FollowUpQueueItem[], filters?: FollowUpFilters) {
  const q = filters?.q?.trim().toLowerCase();
  return queue.filter((item) => {
    const matchesClassroom = !filters?.classroomId || item.classroomId === filters.classroomId;
    const matchesPriority = !filters?.priority || item.priority === filters.priority;
    const matchesSearch = !q || `${item.title} ${item.classroomLabel} ${item.subjectName} ${item.dueLabel}`.toLowerCase().includes(q);
    return matchesClassroom && matchesPriority && matchesSearch;
  });
}

function applyStudentFilters(students: FollowUpStudentRisk[], filters?: FollowUpFilters) {
  const q = filters?.q?.trim().toLowerCase();
  return students.filter((student) => {
    const matchesClassroom = !filters?.classroomId || student.classroomId === filters.classroomId;
    const matchesPriority = !filters?.priority || student.priority === filters.priority;
    const matchesSearch = !q || `${student.studentName} ${student.nickname ?? ""} ${student.classroomLabel}`.toLowerCase().includes(q);
    return matchesClassroom && matchesPriority && matchesSearch;
  });
}

export function parseFollowUpFilters(input: { classroom?: string; priority?: string; q?: string }): FollowUpFilters {
  const priority = ["critical", "warning", "normal"].includes(input.priority ?? "") ? input.priority as FollowUpPriority : undefined;
  return {
    classroomId: input.classroom && input.classroom !== "all" ? input.classroom : undefined,
    priority,
    q: input.q?.trim() || undefined,
  };
}

export async function getFollowUpData(filters?: FollowUpFilters): Promise<FollowUpViewModel> {
  const [assignmentData, management] = await Promise.all([getAssignmentsData(), getManagementData()]);

  const queue = assignmentData.assignments
    .map(mapAssignmentToQueue)
    .filter((item): item is FollowUpQueueItem => item !== null)
    .sort((a, b) => {
      const priorityOrder = { critical: 0, warning: 1, normal: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority]
        || (a.daysFromDue ?? 999) - (b.daysFromDue ?? 999)
        || b.totalActionCount - a.totalActionCount;
    });

  const studentRisks = management.students
    .map<FollowUpStudentRisk | null>((student) => {
      const totalIssueCount = student.missingCount + student.revisionCount;
      if (totalIssueCount === 0) return null;
      return {
        id: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        nickname: student.nickname,
        classroomId: student.classroomId,
        classroomLabel: student.classroomLabel,
        numberInClass: student.numberInClass,
        missingCount: student.missingCount,
        revisionCount: student.revisionCount,
        totalIssueCount,
        priority: priorityForStudent(totalIssueCount),
        profileHref: `/students/${student.id}`,
      };
    })
    .filter((student): student is FollowUpStudentRisk => student !== null)
    .sort((a, b) => b.totalIssueCount - a.totalIssueCount || a.classroomLabel.localeCompare(b.classroomLabel, "th") || (a.numberInClass ?? 999) - (b.numberInClass ?? 999));

  const filteredQueue = applyQueueFilters(queue, filters);
  const filteredStudents = applyStudentFilters(studentRisks, filters);
  const statusGroups: FollowUpStatusGroup[] = [
    { status: "missing", label: "ยังไม่ส่ง", count: filteredQueue.reduce((sum, item) => sum + item.missingCount, 0), helper: "ควรติดตามก่อนครบกำหนดหรือเมื่อเกินกำหนด" },
    { status: "revision", label: "ต้องแก้", count: filteredQueue.reduce((sum, item) => sum + item.revisionCount, 0), helper: "ควรแจ้งจุดที่ต้องปรับและกำหนดส่งใหม่" },
    { status: "pending_review", label: "รอตรวจ", count: filteredQueue.reduce((sum, item) => sum + item.pendingReviewCount, 0), helper: "ควรตรวจให้ทันก่อนสรุปคะแนน" },
  ];

  return {
    source: assignmentData.source === "supabase" && management.source === "supabase" ? "supabase" : assignmentData.source === "mock" && management.source === "mock" ? "mock" : "fallback",
    notice: assignmentData.notice ?? management.notice,
    filters: filters ?? {},
    summary: summarize(filteredQueue, filteredStudents),
    queue: filteredQueue,
    studentRisks: filteredStudents,
    statusGroups,
  };
}
