"use client";

import { useState } from "react";
import { AlertTriangle, LoaderCircle, RefreshCcw } from "lucide-react";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [isRetrying, setIsRetrying] = useState(false);

  function handleRetry() {
    setIsRetrying(true);
    reset();
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f4f7ff] p-6">
      <section className="w-full max-w-md rounded-[28px] border border-white bg-white p-7 text-center shadow-[0_20px_60px_rgba(41,53,102,0.13)]">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-rose-50 text-rose-500"><AlertTriangle className="size-8" /></span>
        <h1 className="mt-5 text-xl font-extrabold text-[#28335f]">เส้นทางภารกิจสะดุดเล็กน้อย</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">เกิดข้อผิดพลาดขณะเปิดหน้านี้ กรุณาลองโหลดข้อมูลอีกครั้ง</p>
        <button type="button" onClick={handleRetry} disabled={isRetrying} className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#6956d9] px-6 text-sm font-bold text-white shadow-lg shadow-violet-200 disabled:opacity-60">
          {isRetrying ? <><LoaderCircle className="size-4 animate-spin" /> กำลังลองใหม่...</> : <><RefreshCcw className="size-4" /> ลองอีกครั้ง</>}
        </button>
      </section>
    </main>
  );
}
