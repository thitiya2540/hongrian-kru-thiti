import type { Metadata } from "next";
import { Activity, BadgeCheck, DatabaseZap, FileClock, KeyRound, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { AuditFilterForm } from "@/components/audit/audit-filter-form";
import { DataSourceNotice } from "@/components/management/data-source-notice";
import { StatCard } from "@/components/ui/stat-card";
import { getAuditData, parseAuditFilters } from "@/lib/audit/get-audit-data";

export const metadata: Metadata = { title: "ประวัติการทำรายการ" };
export const dynamic = "force-dynamic";

type AuditPageProps = {
  searchParams: Promise<{ entity?: string; action?: string; q?: string }>;
};

const severityStyles = {
  info: "bg-sky-50 text-sky-700 ring-sky-200",
  important: "bg-amber-50 text-amber-700 ring-amber-200",
  sensitive: "bg-rose-50 text-rose-700 ring-rose-200",
};

const severityLabels = {
  info: "ทั่วไป",
  important: "สำคัญ",
  sensitive: "ข้อมูลอ่อนไหว",
};

function formatThaiDateTime(value: string) {
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default async function AuditPage({ searchParams }: AuditPageProps) {
  const params = await searchParams;
  const filters = parseAuditFilters(params);
  const audit = await getAuditData(filters);

  return (
    <main className="mx-auto max-w-[1500px] space-y-6 p-4 pb-28 sm:p-6 sm:pb-28 lg:p-7 lg:pb-8 xl:p-9">
      <section className="rounded-[32px] bg-gradient-to-br from-white via-violet-50 to-sky-50 p-5 shadow-[0_16px_48px_rgba(46,58,112,0.08)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-extrabold text-violet-700 ring-1 ring-violet-100">
              <ShieldCheck className="size-3.5" />
              ความปลอดภัยและการตรวจสอบย้อนหลัง
            </p>
            <h1 className="mt-3 text-2xl font-extrabold text-[#253364] md:text-3xl">ประวัติการทำรายการ</h1>
            <p className="mt-1 max-w-3xl text-sm text-slate-500">
              ตรวจย้อนหลังการแก้คะแนน เปลี่ยนสถานะ จัดการข้อมูลนักเรียน ห้องเรียน งาน และสูตรคะแนน เพื่อให้ระบบใช้งานจริงได้อย่างโปร่งใส
            </p>
          </div>
          <DataSourceNotice source={audit.source} notice={audit.notice} />
        </div>
      </section>

      <AuditFilterForm filters={audit.filters} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="รายการทั้งหมด" value={audit.summary.totalLogs} helper={audit.summary.latestAt ? `ล่าสุด ${formatThaiDateTime(audit.summary.latestAt)}` : "ยังไม่มีประวัติ"} icon={FileClock} tone="purple" />
        <StatCard label="แก้ไขคะแนน" value={audit.summary.scoreChanges} helper="รายการคะแนน/สถานะนักเรียน" icon={Activity} tone="rose" />
        <StatCard label="ข้อมูลหลัก" value={audit.summary.masterDataChanges} helper="นักเรียน ห้อง วิชา และงาน" icon={DatabaseZap} tone="green" />
        <StatCard label="การตั้งค่าคะแนน" value={audit.summary.settingChanges} helper="สูตร น้ำหนัก และเกณฑ์คะแนน" icon={SlidersHorizontal} tone="amber" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_16px_40px_rgba(46,58,112,0.08)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-[#253364]">Timeline รายการล่าสุด</h2>
              <p className="text-sm text-slate-400">แสดงสูงสุด 120 รายการล่าสุดตามสิทธิ์ผู้ใช้</p>
            </div>
            <FileClock className="size-5 text-violet-500" />
          </div>
          <div className="space-y-3">
            {audit.logs.length > 0 ? audit.logs.map((log) => (
              <article key={log.id} className="rounded-3xl border border-slate-100 bg-slate-50/80 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-extrabold ring-1 ring-inset ${severityStyles[log.severity]}`}>{severityLabels[log.severity]}</span>
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-extrabold text-slate-500 ring-1 ring-slate-200">{log.entityLabel}</span>
                    </div>
                    <h3 className="mt-2 text-base font-extrabold text-[#253364]">{log.actionLabel}</h3>
                    <p className="mt-1 text-sm text-slate-500">โดย {log.actorName} · {formatThaiDateTime(log.createdAt)}</p>
                  </div>
                  <p className="rounded-2xl bg-white px-3 py-2 text-xs font-semibold text-slate-400 ring-1 ring-slate-100">ID: {log.entityId ?? "-"}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {log.changedFields.length > 0 ? log.changedFields.slice(0, 8).map((field) => (
                    <span key={field} className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-[#3c4668] ring-1 ring-slate-200">{field}</span>
                  )) : <span className="text-xs font-semibold text-slate-400">ไม่มี field เปลี่ยนแปลงให้แสดง</span>}
                </div>
              </article>
            )) : (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                <p className="text-lg font-extrabold text-[#253364]">ยังไม่มีประวัติตามตัวกรองนี้</p>
                <p className="mt-1 text-sm text-slate-400">ลองเปลี่ยนตัวกรอง หรือรอให้มีการบันทึกข้อมูลจริง</p>
              </div>
            )}
          </div>
        </div>

        <aside className="grid content-start gap-4">
          <section className="rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_16px_40px_rgba(46,58,112,0.08)]">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-600"><KeyRound className="size-5" /></span>
              <div>
                <h2 className="font-extrabold text-[#253364]">Security posture</h2>
                <p className="text-xs text-slate-400">สถานะระบบที่ตรวจจากโค้ด</p>
              </div>
            </div>
            <div className="mt-4 space-y-3 text-sm font-semibold text-slate-500">
              <p className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">เปิด RLS สำหรับตารางหลักและ activity_logs</p>
              <p className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">ไม่ส่ง `pin_hash` กลับใน audit trigger นักเรียน</p>
              <p className="rounded-2xl bg-violet-50 p-3 text-violet-700">คะแนนที่ถูกล็อกต้องปลดล็อกก่อนแก้</p>
              <p className="rounded-2xl bg-amber-50 p-3 text-amber-700">ประวัติครอบคลุมการเปลี่ยนคะแนน สถานะงาน และสูตรคะแนนที่สำคัญ</p>
            </div>
          </section>

          <section className="rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_16px_40px_rgba(46,58,112,0.08)]">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-amber-50 text-amber-600"><BadgeCheck className="size-5" /></span>
              <div>
                <h2 className="font-extrabold text-[#253364]">สิ่งที่ควรตรวจประจำ</h2>
                <p className="text-xs text-slate-400">เหมาะกับแอดมิน/หัวหน้าวิชาการ</p>
              </div>
            </div>
            <ul className="mt-4 space-y-2 text-sm font-semibold text-slate-500">
              <li className="rounded-2xl bg-slate-50 p-3">ตรวจรายการคะแนนที่ถูกแก้หลังปิดงาน</li>
              <li className="rounded-2xl bg-slate-50 p-3">ตรวจการเปลี่ยนสูตรคะแนนก่อนออกรายงาน</li>
              <li className="rounded-2xl bg-slate-50 p-3">ตรวจคะแนนที่ถูกแก้หลายรายการในช่วงเวลาเดียวกัน</li>
              <li className="rounded-2xl bg-slate-50 p-3">ตรวจข้อมูลนักเรียนที่ถูกแก้สถานะ</li>
            </ul>
          </section>
        </aside>
      </section>
    </main>
  );
}
