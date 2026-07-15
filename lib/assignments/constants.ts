import type { AssignmentStatus } from "@/types/database";
import type { AssignmentType } from "@/types/assignments";

export const assignmentTypeLabels: Record<AssignmentType, string> = {
  worksheet: "ใบงาน",
  exercise: "แบบฝึกหัด",
  homework: "การบ้าน",
  quiz: "แบบทดสอบ",
  activity: "กิจกรรม",
  group_work: "งานกลุ่ม",
  oral: "ตอบคำถาม",
  other: "อื่น ๆ",
};

export const statusLabels: Record<AssignmentStatus, string> = {
  submitted: "ส่งแล้ว",
  missing: "ยังไม่ส่ง",
  revision: "แก้งาน",
  passed: "ผ่านแล้ว",
  pending_review: "รอตรวจ",
  absent: "ลา",
  exempt: "ไม่ต้องส่ง",
};
