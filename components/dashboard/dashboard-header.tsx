import { Bell, CalendarCheck2, CloudCheck, ClipboardPlus, Database, Sparkles, Zap } from "lucide-react";
import { ComingSoonButton } from "@/components/ui/coming-soon-button";
import { TermSelector } from "@/components/dashboard/term-selector";
import type { AcademicTermOption, DashboardDataSource } from "@/types/dashboard";

type DashboardHeaderProps = {
  teacherName: string;
  terms: AcademicTermOption[];
  selectedTermId: string;
  source: DashboardDataSource;
  notice?: string;
};

export function DashboardHeader({ teacherName, terms, selectedTermId, source, notice }: DashboardHeaderProps) {
  const dateLabel = new Intl.DateTimeFormat("th-TH", {
    dateStyle: "full",
    timeZone: "Asia/Bangkok",
  }).format(new Date());
  const sourceConfig = source === "supabase"
    ? { label: "ข้อมูลจริงจาก Supabase", icon: CloudCheck, className: "bg-emerald-50 text-emerald-700" }
    : source === "fallback"
      ? { label: "ข้อมูลสำรอง", icon: Database, className: "bg-amber-50 text-amber-700" }
      : { label: "ยังไม่เชื่อม Supabase", icon: Database, className: "bg-amber-50 text-amber-700" };
  const SourceIcon = sourceConfig.icon;

  return (
    <header className="relative overflow-hidden rounded-[28px] border border-white/80 bg-gradient-to-br from-[#d8f7ff] via-[#ebfbff] to-[#e8f4ff] px-5 py-6 shadow-[0_14px_38px_rgba(53,111,150,0.1)] sm:px-7 sm:py-7">
      <span className="pointer-events-none absolute -right-10 -top-20 size-64 rounded-full bg-white/60 blur-2xl" />
      <span className="pointer-events-none absolute bottom-3 left-[45%] h-7 w-28 rounded-full bg-white/50 blur-sm" />
      <div className="relative flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-[10px] font-extrabold text-[#6351ba]"><Sparkles className="size-3.5 text-amber-400" />เริ่มต้นวันใหม่ด้วยภารกิจดี ๆ</span>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-[#24315f] sm:text-3xl">ยินดีต้อนรับ {teacherName}!</h1>
          <p className="mt-2 flex items-center gap-2 text-xs font-medium text-[#64739a] sm:text-sm"><CalendarCheck2 className="size-4 text-emerald-500" />{dateLabel}</p>
          <span className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-extrabold ${sourceConfig.className}`}><SourceIcon className="size-3.5" />{sourceConfig.label}</span>
        </div>
        <div className="flex items-center gap-3"><TermSelector terms={terms} selectedTermId={selectedTermId} /><span title="การแจ้งเตือนกำลังพัฒนา" className="relative hidden size-12 shrink-0 place-items-center rounded-2xl bg-white/85 text-slate-500 shadow-sm sm:grid"><Bell className="size-5" /><span className="absolute right-2 top-2 grid size-4 place-items-center rounded-full bg-rose-500 text-[8px] font-bold text-white ring-2 ring-white">3</span></span></div>
      </div>
      {notice && <p role="status" className="relative mt-4 rounded-xl border border-white/80 bg-white/65 px-3 py-2 text-xs font-medium text-[#5f6f93]">{notice}</p>}
      <div className="relative mt-5 flex flex-wrap gap-2.5">
        <ComingSoonButton label="สร้างงานใหม่" icon={ClipboardPlus} variant="primary" />
        <ComingSoonButton label="บันทึกคะแนนด่วน" icon={Zap} />
      </div>
    </header>
  );
}
