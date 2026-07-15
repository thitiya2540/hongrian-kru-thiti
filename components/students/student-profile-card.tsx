import { ClipboardList, Percent, RotateCcw } from "lucide-react";
import { StudentAvatar } from "@/components/students/student-avatar";
import { ProgressBar } from "@/components/ui/progress-bar";
import type { StudentProfileViewModel } from "@/types/students";

export function StudentProfileCard({ profile, compact = false }: { profile: StudentProfileViewModel; compact?: boolean }) {
  const averageScore = profile.subjectScores.length > 0
    ? Math.round(profile.subjectScores.reduce((sum, subject) => sum + subject.percent, 0) / profile.subjectScores.length)
    : 0;
  return (
    <section className="overflow-hidden rounded-[28px] bg-white shadow-[0_18px_50px_rgba(44,55,105,0.12)]">
      <div className="bg-gradient-to-br from-sky-100 via-violet-100 to-emerald-100 p-5">
        <div className="flex items-start gap-4">
          <StudentAvatar student={profile.student} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-violet-500">{profile.student.classroomLabel}</p>
            <h2 className="mt-1 truncate text-2xl font-black text-[#293562]">{profile.student.firstName} {profile.student.lastName}</h2>
            <p className="text-sm font-semibold text-slate-500">{profile.student.studentCode} · เลขที่ {profile.student.numberInClass ?? "-"}</p>
          </div>
          <div className="rounded-3xl bg-white/80 px-4 py-3 text-center shadow-sm"><p className="text-xs font-bold text-slate-400">คะแนนเฉลี่ย</p><p className="text-2xl font-black text-violet-700">{averageScore}%</p></div>
        </div>
      </div>

      <div className="grid gap-3 p-5 sm:grid-cols-3">
        <div className="rounded-2xl bg-emerald-50 p-3"><ClipboardList className="size-4 text-emerald-600" /><p className="mt-2 text-xl font-black text-[#293562]">{profile.submittedCount}/{profile.assignmentsTotal}</p><p className="text-xs font-bold text-slate-500">ส่งแล้ว</p></div>
        <div className="rounded-2xl bg-rose-50 p-3"><RotateCcw className="size-4 text-rose-600" /><p className="mt-2 text-xl font-black text-[#293562]">{profile.missingCount + profile.revisionCount}</p><p className="text-xs font-bold text-slate-500">ต้องจัดการ</p></div>
        <div className="rounded-2xl bg-violet-50 p-3"><Percent className="size-4 text-violet-600" /><p className="mt-2 text-xl font-black text-[#293562]">{averageScore}%</p><p className="text-xs font-bold text-slate-500">เฉลี่ยรวม</p></div>
      </div>

      {!compact ? (
        <div className="px-5 pb-5">
          <h3 className="text-sm font-black text-[#293562]">คะแนนรายวิชา</h3>
          <div className="mt-3 grid gap-3">
            {profile.subjectScores.length > 0 ? profile.subjectScores.map((subject) => <ProgressBar key={subject.subjectId} value={subject.percent} label={`${subject.subjectName} ${subject.earnedScore}/${subject.maxScore}`} color="green" />) : <p className="text-sm text-slate-400">ยังไม่มีคะแนนรายวิชา</p>}
          </div>
        </div>
      ) : null}
    </section>
  );
}
