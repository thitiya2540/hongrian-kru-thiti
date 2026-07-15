"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Sparkles } from "lucide-react";
import { signOutAction } from "@/actions/auth";
import { mainNavigation } from "@/lib/navigation";
import { QuestLogo } from "@/components/ui/quest-logo";
import type { CurrentTeacher } from "@/lib/auth/get-current-teacher";
import { appBrand } from "@/lib/branding";

export function AppSidebar({ teacher }: { teacher: CurrentTeacher }) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col border-r border-[#e9e8f6] bg-white lg:flex print:hidden">
      <div className="flex h-[92px] items-center border-b border-slate-100 px-6"><QuestLogo /></div>

      <nav className="soft-scrollbar flex-1 overflow-y-auto px-4 py-5" aria-label="เมนูหลัก">
        <p className="px-3 pb-3 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">เมนูหลัก</p>
        <ul className="space-y-1.5">
          {mainNavigation.map((item) => {
            const Icon = item.icon;
            const active = item.available && pathname.startsWith(item.href);

            return (
              <li key={item.href}>
                {item.available ? (
                  <Link href={item.href} className={`group flex h-12 items-center gap-3 rounded-2xl px-3.5 text-sm font-bold transition ${active ? "bg-gradient-to-r from-[#6956d9] to-[#8b68e5] text-white shadow-[0_9px_22px_rgba(105,86,217,0.24)]" : "text-slate-600 hover:bg-violet-50 hover:text-[#5d4eb2]"}`}>
                    <Icon className="size-5" strokeWidth={active ? 2.5 : 2} />
                    <span>{item.label}</span>
                  </Link>
                ) : (
                  <div title="เมนูนี้กำลังพัฒนา" className="flex h-12 cursor-not-allowed items-center gap-3 rounded-2xl px-3.5 text-sm font-semibold text-slate-400">
                    <Icon className="size-5" strokeWidth={1.8} />
                    <span className="flex-1">{item.label}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-400">ระยะ {item.phase}</span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-slate-100 p-4">
        <div className="mb-3 rounded-2xl bg-gradient-to-br from-[#f3f0ff] to-[#e8f8ff] p-3">
          <div className="flex items-center gap-3">
            <span className="relative grid size-11 shrink-0 place-items-center rounded-2xl bg-[#ffd9ae] text-lg font-extrabold text-[#6d472f] ring-2 ring-white">{teacher.initial}<span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-amber-400 text-white ring-2 ring-white"><Sparkles className="size-3" /></span></span>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold text-[#303a67]">{teacher.displayName}</p><p className="text-[11px] font-medium text-slate-500">{teacher.role === "admin" ? "ผู้ดูแลระบบ" : "คุณครู"}</p></div>
            <form action={signOutAction}>
              <button type="submit" title="ออกจากระบบ" aria-label="ออกจากระบบ" className="grid size-9 place-items-center rounded-xl bg-white/80 text-slate-400 transition hover:bg-white hover:text-rose-500"><LogOut className="size-4" /></button>
            </form>
          </div>
        </div>
        <p className="text-center text-[9px] font-medium text-slate-300">{appBrand.name} · ระบบเก็บคะแนนนักเรียน</p>
      </div>
    </aside>
  );
}
