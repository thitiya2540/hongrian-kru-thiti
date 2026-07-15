"use client";

import { Printer } from "lucide-react";

export function StudentReportPrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#6956d9] px-4 py-2 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(105,86,217,0.24)] transition hover:bg-[#5d4dc7] print:hidden"
    >
      <Printer className="size-4" />
      พิมพ์ / บันทึก PDF
    </button>
  );
}
