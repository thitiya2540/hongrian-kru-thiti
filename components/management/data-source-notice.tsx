import { Database, FlaskConical } from "lucide-react";
import type { ManagementDataSource } from "@/types/management";

type DataSourceNoticeProps = {
  source: ManagementDataSource;
  notice?: string;
};

export function DataSourceNotice({ source, notice }: DataSourceNoticeProps) {
  const isLive = source === "supabase";
  const Icon = isLive ? Database : FlaskConical;

  return (
    <div className={`flex flex-wrap items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold ring-1 ${isLive ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-amber-50 text-amber-800 ring-amber-200"}`}>
      <Icon className="size-4" />
      <span>{isLive ? "ข้อมูลจริงจาก Supabase" : (notice ?? "ยังไม่มีข้อมูลจริงให้แสดง")}</span>
    </div>
  );
}
