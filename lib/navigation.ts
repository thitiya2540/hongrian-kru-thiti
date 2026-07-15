import {
  BellRing,
  BookOpen,
  BookOpenCheck,
  ChartColumn,
  ClipboardList,
  Database,
  Download,
  Home,
  School,
  Settings,
  ShieldCheck,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";

export type NavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  available: boolean;
  phase?: number;
};

export const mainNavigation: NavigationItem[] = [
  { label: "หน้าหลัก", href: "/dashboard", icon: Home, available: true },
  { label: "ห้องเรียน", href: "/classrooms", icon: School, available: true, phase: 3 },
  { label: "รายวิชา", href: "/subjects", icon: BookOpen, available: true, phase: 3 },
  { label: "ภารกิจ / งาน", href: "/assignments", icon: ClipboardList, available: true, phase: 4 },
  { label: "นักเรียน", href: "/students", icon: Users, available: true, phase: 3 },
  { label: "บันทึกคะแนนด่วน", href: "/quick-score", icon: Zap, available: true, phase: 5 },
  { label: "ติดตามงาน", href: "/follow-up", icon: BellRing, available: true, phase: 12 },
  { label: "สมุดคะแนน", href: "/gradebook", icon: BookOpenCheck, available: true, phase: 8 },
  { label: "รายงาน", href: "/reports", icon: ChartColumn, available: true, phase: 7 },
  { label: "ส่งออกข้อมูล", href: "/exports", icon: Download, available: true, phase: 13 },
  { label: "ตรวจสอบ", href: "/audit", icon: ShieldCheck, available: true, phase: 11 },
  { label: "เชื่อมระบบจริง", href: "/live-setup", icon: Database, available: true, phase: 14 },
  { label: "ตั้งค่า", href: "/settings", icon: Settings, available: true, phase: 3 },
];
