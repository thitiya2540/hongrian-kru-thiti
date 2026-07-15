"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { mainNavigation } from "@/lib/navigation";
import { signOutAction } from "@/actions/auth";

const bottomItems = mainNavigation.filter((item) => ["/dashboard", "/assignments", "/quick-score", "/follow-up"].includes(item.href));

export function MobileNavigation() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <>
      <nav className="fixed inset-x-3 bottom-3 z-50 grid h-[68px] grid-cols-5 rounded-[22px] border border-white/80 bg-white/95 px-1 shadow-[0_14px_40px_rgba(38,49,99,0.2)] backdrop-blur lg:hidden print:hidden" aria-label="เมนูมือถือ">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          return item.available ? (
            <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center gap-1 rounded-2xl text-[#6956d9]"><span className="grid size-8 place-items-center rounded-xl bg-violet-100"><Icon className="size-4.5" /></span><span className="text-[10px] font-bold">{item.label}</span></Link>
          ) : (
            <span key={item.href} title="เมนูนี้กำลังพัฒนา" className="flex cursor-not-allowed flex-col items-center justify-center gap-1 text-slate-400"><Icon className="size-4.5" /><span className="text-[9px] font-semibold">{item.label.replace("ภารกิจ / งาน", "งาน")}</span></span>
          );
        })}
        <button type="button" onClick={() => setOpen(true)} className="flex flex-col items-center justify-center gap-1 text-slate-500" aria-label="เปิดเมนูทั้งหมด"><Menu className="size-5" /><span className="text-[10px] font-semibold">เมนู</span></button>
      </nav>

      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden print:hidden">
          <button type="button" aria-label="ปิดเมนู" onClick={() => setOpen(false)} className="absolute inset-0 bg-[#182044]/45 backdrop-blur-sm" />
          <section role="dialog" aria-modal="true" aria-label="เมนูทั้งหมด" className="absolute inset-x-3 bottom-3 max-h-[82vh] overflow-y-auto rounded-[28px] bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-extrabold text-[#2b3767]">เมนูทั้งหมด</h2><p className="text-xs text-slate-400">ฟีเจอร์ถัดไปแสดงระยะการพัฒนาไว้แล้ว</p></div><button type="button" onClick={() => setOpen(false)} className="grid size-10 place-items-center rounded-2xl bg-slate-100 text-slate-500" aria-label="ปิด"><X className="size-5" /></button></div>
            <div className="grid grid-cols-2 gap-2.5">
              {mainNavigation.map((item) => {
                const Icon = item.icon;
                return item.available ? <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-2xl bg-violet-50 p-3 text-sm font-bold text-violet-700"><span className="grid size-9 place-items-center rounded-xl bg-white"><Icon className="size-4.5" /></span>{item.label}</Link> : <div key={item.href} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-slate-400"><span className="grid size-9 place-items-center rounded-xl bg-white"><Icon className="size-4.5" /></span><span className="min-w-0 flex-1"><span className="block truncate">{item.label}</span><small className="text-[9px]">กำลังพัฒนา · ระยะ {item.phase}</small></span></div>;
              })}
            </div>
            <form action={signOutAction} className="mt-4"><button type="submit" className="h-11 w-full rounded-2xl border border-rose-200 bg-rose-50 text-sm font-bold text-rose-600">ออกจากระบบ</button></form>
          </section>
        </div>
      )}
    </>
  );
}
