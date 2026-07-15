import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BarChart3, Lock } from "lucide-react";
import { ScorebookClient } from "@/components/assignments/scorebook-client";
import { ManagementShell } from "@/components/management/management-shell";
import { getScorebookData } from "@/lib/assignments/get-assignments-data";

export const metadata: Metadata = { title: "บันทึกคะแนน" };
export const dynamic = "force-dynamic";

type ScoresPageProps = {
  params: Promise<{ assignmentId: string }>;
};

function formatDate(value: string | null) {
  if (!value) return "ไม่กำหนด";
  const date = new Date(`${value}T00:00:00+07:00`);
  if (Number.isNaN(date.getTime())) return "ไม่กำหนด";
  return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Bangkok" }).format(date);
}

export default async function ScoresPage({ params }: ScoresPageProps) {
  const { assignmentId } = await params;
  const scorebook = await getScorebookData(assignmentId);
  if (!scorebook) notFound();
  const { assignment } = scorebook;
  const disabled = scorebook.source !== "supabase" || assignment.isLocked;

  return (
    <ManagementShell eyebrow="โต๊ะบันทึกคะแนน" title="บันทึกและตรวจคะแนน" description="กรอกทีละคนด้วยแป้นพิมพ์ หรือเลือกหลายคนเพื่อแก้พร้อมกัน ระบบจะให้ตรวจทานก่อนการเปลี่ยนคะแนนจำนวนมาก" source={scorebook.source} notice={scorebook.notice}>
      <div className="mt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href={`/quick-score?classroom=${assignment.classroomId}`} className="inline-flex items-center gap-2 text-sm font-extrabold text-violet-700"><ArrowLeft className="size-4" /> กลับไปเลือกงานของ {assignment.classroomLabel}</Link>
          <Link href={`/reports?classroom=${assignment.classroomId}&subject=${assignment.subjectId}`} className="inline-flex h-10 items-center gap-2 rounded-2xl bg-white px-4 text-sm font-extrabold text-slate-600 shadow-sm ring-1 ring-slate-200 transition hover:text-violet-700"><BarChart3 className="size-4" /> ตรวจรายงานห้อง</Link>
        </div>
      </div>

      <section className="mt-5 rounded-[28px] bg-white p-5 shadow-[0_18px_50px_rgba(44,55,105,0.12)]">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-extrabold text-violet-700">{assignment.classroomLabel}</span>
              <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-extrabold text-sky-700">{assignment.subjectName}</span>
              {assignment.isLocked ? <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-extrabold text-amber-700"><Lock className="size-3" /> ล็อกแล้ว</span> : null}
            </div>
            <h2 className="mt-3 text-2xl font-black text-[#293562]">{assignment.title}</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">{assignment.assignmentTypeLabel} · {assignment.category} · คะแนนเต็ม {assignment.maxScore}</p>
          </div>
          <div className="grid gap-2 rounded-3xl bg-slate-50 p-4 text-sm font-bold text-slate-500 sm:grid-cols-3 lg:min-w-[480px]">
            <p>วันที่ทำงาน: <span className="text-[#293562]">{formatDate(assignment.activityDate)}</span></p>
            <p>กำหนดส่ง: <span className="text-[#293562]">{formatDate(assignment.dueDate)}</span></p>
            <p>โบนัส: <span className="text-[#293562]">{assignment.allowBonus ? "เปิด" : "ปิด"}</span></p>
          </div>
        </div>
      </section>

      <div className="mt-5">
        <ScorebookClient assignment={assignment} initialRecords={scorebook.records} disabled={disabled} />
      </div>
    </ManagementShell>
  );
}
