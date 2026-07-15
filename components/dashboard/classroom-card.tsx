import Link from "next/link";
import { BookOpen, Clock3, ListChecks, RotateCcw, UserRoundX, UsersRound } from "lucide-react";
import { ClassroomScene } from "@/components/dashboard/classroom-scene";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { ClassroomSummary } from "@/types/dashboard";

const themeStyles = {
  violet: { ribbon: "from-[#6a55d0] to-[#8f70ea]", ring: "border-violet-100", progress: "purple" as const },
  emerald: { ribbon: "from-[#2f9b5d] to-[#54bd75]", ring: "border-emerald-100", progress: "green" as const },
  orange: { ribbon: "from-[#d8751b] to-[#f6a13a]", ring: "border-orange-100", progress: "amber" as const },
};

export function ClassroomCard({ classroom }: { classroom: ClassroomSummary }) {
  const theme = themeStyles[classroom.theme];

  return (
    <Link href={`/quick-score?classroom=${classroom.id}`} className={`group relative block overflow-hidden rounded-[26px] border bg-white shadow-[0_14px_32px_rgba(39,59,110,0.11)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(39,59,110,0.16)] focus:outline-none focus:ring-4 focus:ring-violet-200 ${theme.ring}`} aria-label={`ไปบันทึกคะแนนห้อง ${classroom.grade} ${classroom.title}`}>
      <div className="relative">
        <ClassroomScene scene={classroom.scene} theme={classroom.theme} />
        <div className={`absolute left-1/2 top-3 -translate-x-1/2 rounded-[14px] bg-gradient-to-r px-7 py-2 text-white shadow-lg ${theme.ribbon}`}>
          <span className="block text-center text-xl font-extrabold leading-none">{classroom.grade}</span>
          <span className="mt-1 block whitespace-nowrap text-center text-[9px] font-semibold text-white/80">{classroom.title}</span>
        </div>
      </div>

      <div className="px-4 pb-4 pt-3.5">
        <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3 text-xs font-bold text-slate-600">
          <span className="flex items-center gap-1.5"><UsersRound className="size-4 text-sky-500" />นักเรียน {classroom.students} คน</span>
          <span className="flex items-center gap-1.5"><BookOpen className="size-4 text-violet-500" />วิชา {classroom.subjects} วิชา</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-rose-50 px-2 py-2 text-center"><UserRoundX className="mx-auto size-4 text-rose-500" /><strong className="mt-1 block text-lg leading-none text-rose-600">{classroom.missing}</strong><span className="text-[9px] font-bold text-rose-600/75">ยังไม่ส่ง</span></div>
          <div className="rounded-xl bg-amber-50 px-2 py-2 text-center"><RotateCcw className="mx-auto size-4 text-amber-500" /><strong className="mt-1 block text-lg leading-none text-amber-600">{classroom.revision}</strong><span className="text-[9px] font-bold text-amber-600/75">ต้องแก้</span></div>
          <div className="rounded-xl bg-violet-50 px-2 py-2 text-center"><ListChecks className="mx-auto size-4 text-violet-500" /><strong className="mt-1 block text-lg leading-none text-violet-600">{classroom.pendingReview}</strong><span className="text-[9px] font-bold text-violet-600/75">รอตรวจ</span></div>
        </div>

        <div className="mt-3"><ProgressBar value={classroom.completionRate} label="ส่งงานครบเฉลี่ย" color={theme.progress} /></div>
        <p className="mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-slate-50 py-2 text-[10px] font-semibold text-slate-500"><Clock3 className="size-3.5 text-emerald-500" />บันทึกล่าสุด {classroom.lastUpdated}</p>
        <p className="mt-2 rounded-xl bg-violet-50 py-2 text-center text-[10px] font-extrabold text-violet-700 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">คลิกเพื่อเลือกห้องนี้และบันทึกคะแนน</p>
      </div>
    </Link>
  );
}
