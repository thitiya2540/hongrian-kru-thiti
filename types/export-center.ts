import type { ManagementDataSource } from "@/types/management";

export type ExportCenterFilters = {
  classroomId?: string;
  subjectId?: string;
};

export type ExportCenterSummary = {
  classroomCount: number;
  studentCount: number;
  assignmentCount: number;
  gradebookRows: number;
  watchListCount: number;
};

export type ExportOption = {
  id: string;
  title: string;
  description: string;
  href: string;
  fileType: "CSV" | "PRINT";
  recommendedFor: string;
  tone: "purple" | "green" | "rose" | "amber";
};

export type ExportCenterViewModel = {
  source: ManagementDataSource;
  notice?: string;
  generatedAt: string;
  filters: ExportCenterFilters;
  summary: ExportCenterSummary;
  options: ExportOption[];
};
