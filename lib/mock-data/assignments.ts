import type { AssignmentsViewModel } from "@/types/assignments";
import type { AssignmentStudentStatus } from "@/types/assignments";

export const mockAssignmentsData: AssignmentsViewModel = {
  source: "mock",
  notice: "ยังไม่ได้เชื่อมต่อ Supabase จึงยังไม่มีงานหรือคะแนนจริงให้แสดง",
  templates: [],
  assignments: [],
};

export const mockAssignmentStudents: AssignmentStudentStatus[] = [];
