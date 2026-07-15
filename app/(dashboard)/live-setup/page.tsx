import type { Metadata } from "next";
import Link from "next/link";
import { Activity, CheckCircle2, ClipboardCheck, Database, ExternalLink, KeyRound, ShieldCheck, TriangleAlert } from "lucide-react";
import { DataSourceNotice } from "@/components/management/data-source-notice";
import { getLiveSetupHealth } from "@/lib/live-setup/get-live-setup-health";
import type { LiveSetupStatus } from "@/types/live-setup";

export const metadata: Metadata = { title: "เชื่อม Supabase" };
export const dynamic = "force-dynamic";

const statusStyles: Record<LiveSetupStatus, string> = {
  pass: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  warning: "bg-amber-50 text-amber-700 ring-amber-200",
  fail: "bg-rose-50 text-rose-700 ring-rose-200",
  pending: "bg-sky-50 text-sky-700 ring-sky-200",
};

const statusLabels: Record<LiveSetupStatus, string> = {
  pass: "ผ่าน",
  warning: "ควรตรวจ",
  fail: "ต้องแก้",
  pending: "รอดำเนินการ",
};

const statusIcons = {
  pass: CheckCircle2,
  warning: TriangleAlert,
  fail: TriangleAlert,
  pending: Activity,
};

export default async function LiveSetupPage() {
  const health = await getLiveSetupHealth();

  return (
    <main className="mx-auto max-w-[1500px] space-y-6 p-4 pb-28 sm:p-6 sm:pb-28 lg:p-7 lg:pb-8 xl:p-9">
      <section className="rounded-[32px] bg-gradient-to-br from-white via-sky-50 to-violet-50 p-5 shadow-[0_16px_48px_rgba(46,58,112,0.08)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-extrabold text-sky-700 ring-1 ring-sky-100">
              <Database className="size-3.5" />
              ตรวจความพร้อมระบบและฐานข้อมูล
            </p>
            <h1 className="mt-3 text-2xl font-extrabold text-[#253364] md:text-3xl">เชื่อม Supabase และตรวจข้อมูลจริง</h1>
            <p className="mt-1 max-w-3xl text-sm text-slate-500">
              ตรวจความพร้อมก่อนใช้งานจริง: env, session ครู, ตารางหลัก, RLS และจำนวนข้อมูลสำคัญ โดยไม่แสดง secret ออกมาบนหน้าเว็บ
            </p>
          </div>
          <DataSourceNotice source={health.source} notice={health.configured ? undefined : "ยังไม่ได้ตั้งค่า Supabase"} />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[28px] bg-white p-5 shadow-[0_16px_40px_rgba(46,58,112,0.08)]">
          <KeyRound className="size-6 text-violet-600" />
          <p className="mt-3 text-3xl font-black text-[#253364]">{health.configured ? "พร้อม" : "ยัง"}</p>
          <p className="font-bold text-slate-500">ตั้งค่า Public Env</p>
          <p className="mt-1 text-xs text-slate-400">URL + anon key</p>
        </div>
        <div className="rounded-[28px] bg-white p-5 shadow-[0_16px_40px_rgba(46,58,112,0.08)]">
          <ShieldCheck className="size-6 text-emerald-600" />
          <p className="mt-3 text-3xl font-black text-[#253364]">{health.authenticated ? "Login" : "รอ"}</p>
          <p className="font-bold text-slate-500">Session ครู</p>
          <p className="mt-1 truncate text-xs text-slate-400">{health.userEmail ?? "ยังไม่ได้เข้าสู่ระบบจริง"}</p>
        </div>
        <div className="rounded-[28px] bg-white p-5 shadow-[0_16px_40px_rgba(46,58,112,0.08)]">
          <ClipboardCheck className="size-6 text-amber-600" />
          <p className="mt-3 text-3xl font-black text-[#253364]">{health.metrics.length}</p>
          <p className="font-bold text-slate-500">จุดตรวจข้อมูล</p>
          <p className="mt-1 text-xs text-slate-400">ตามสิทธิ์ RLS ของผู้ใช้ปัจจุบัน</p>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="grid content-start gap-5">
          <section className="rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_16px_40px_rgba(46,58,112,0.08)]">
            <h2 className="text-lg font-extrabold text-[#253364]">Checklist การเชื่อมระบบจริง</h2>
            <div className="mt-4 grid gap-3">
              {health.checks.map((check) => {
                const Icon = statusIcons[check.status];
                return (
                  <article key={check.id} className="rounded-3xl border border-slate-100 bg-slate-50/80 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="flex gap-3">
                        <span className={`grid size-10 shrink-0 place-items-center rounded-2xl ring-1 ring-inset ${statusStyles[check.status]}`}>
                          <Icon className="size-5" />
                        </span>
                        <div>
                          <h3 className="font-extrabold text-[#253364]">{check.label}</h3>
                          <p className="mt-1 text-sm text-slate-500">{check.detail}</p>
                        </div>
                      </div>
                      <span className={`w-fit rounded-full px-3 py-1 text-xs font-extrabold ring-1 ring-inset ${statusStyles[check.status]}`}>{statusLabels[check.status]}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_16px_40px_rgba(46,58,112,0.08)]">
            <h2 className="text-lg font-extrabold text-[#253364]">Data QA ตามตารางหลัก</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {health.metrics.map((metric) => (
                <article key={metric.label} className="rounded-3xl bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-extrabold text-[#253364]">{metric.label}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-400">{metric.helper}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-extrabold ring-1 ring-inset ${statusStyles[metric.status]}`}>{statusLabels[metric.status]}</span>
                  </div>
                  <p className="mt-3 text-3xl font-black text-[#253364]">{metric.value}</p>
                </article>
              ))}
            </div>
          </section>
        </div>

        <aside className="grid content-start gap-4">
          <section className="rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_16px_40px_rgba(46,58,112,0.08)]">
            <h2 className="font-extrabold text-[#253364]">ขั้นตอนถัดไป</h2>
            <ol className="mt-4 space-y-2 text-sm font-semibold text-slate-500">
              {health.nextSteps.map((step, index) => (
                <li key={step} className="flex gap-3 rounded-2xl bg-slate-50 p-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-violet-100 text-xs font-black text-violet-700">{index + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_16px_40px_rgba(46,58,112,0.08)]">
            <h2 className="font-extrabold text-[#253364]">คำสั่งเชื่อม Supabase</h2>
            <div className="mt-4 space-y-3 rounded-2xl bg-slate-950 p-4 text-xs font-semibold text-slate-100">
              <p>copy .env.example .env.local</p>
              <p>npx supabase login</p>
              <p>npx supabase link --project-ref YOUR_PROJECT_REF</p>
              <p>npx supabase db push</p>
            </div>
            <p className="mt-3 text-xs font-semibold text-slate-400">ฐาน production ใช้เฉพาะ migration และเพิ่มข้อมูลจริงผ่านหน้าเว็บ</p>
          </section>

          <Link href="/api/live/health" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-white px-4 py-3 text-sm font-extrabold text-violet-700 shadow-sm transition hover:bg-violet-50">
            เปิด JSON health check
            <ExternalLink className="size-4" />
          </Link>
        </aside>
      </section>
    </main>
  );
}
