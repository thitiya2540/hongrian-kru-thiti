import { Bell } from "lucide-react";
import { QuestLogo } from "@/components/ui/quest-logo";
import type { CurrentTeacher } from "@/lib/auth/get-current-teacher";
import { appBrand } from "@/lib/branding";

export function MobileHeader({ teacher }: { teacher: CurrentTeacher }) {
  return (
    <header className="sticky top-0 z-30 flex h-[70px] items-center justify-between border-b border-white/80 bg-white/90 px-4 shadow-sm shadow-slate-200/40 backdrop-blur lg:hidden print:hidden">
      <QuestLogo compact />
      <div className="ml-3 min-w-0 flex-1"><p className="truncate text-sm font-extrabold text-[#2e3868]">{appBrand.name}</p><p className="truncate text-[10px] font-medium text-slate-400">{appBrand.subtitle}</p></div>
      <span title="การแจ้งเตือนกำลังพัฒนา" className="relative grid size-10 place-items-center rounded-2xl bg-violet-50 text-violet-500"><Bell className="size-5" /><span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-rose-500 ring-2 ring-white" /></span>
      <span className="ml-2 grid size-10 place-items-center rounded-2xl bg-[#ffd9ae] font-extrabold text-[#6d472f]">{teacher.initial}</span>
    </header>
  );
}
