"use client";

import { Printer } from "lucide-react";

export function GradebookPrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-[#3b456b] shadow-sm transition hover:border-violet-200 hover:text-violet-700 print:hidden"
    >
      <Printer className="size-4" />
      พิมพ์สมุดคะแนน
    </button>
  );
}
