import Link from "next/link";
import { Compass, Home, MapPinned } from "lucide-react";

export default function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-br from-[#e3f8ff] to-[#f0ecff] p-6">
      <section className="w-full max-w-lg rounded-[30px] border border-white bg-white/90 p-8 text-center shadow-[0_24px_70px_rgba(42,57,107,0.14)]">
        <span className="relative mx-auto grid size-20 place-items-center rounded-[26px] bg-violet-100 text-violet-600"><MapPinned className="size-10" /><Compass className="absolute -right-2 -top-2 size-8 rounded-full bg-amber-300 p-1.5 text-amber-800 ring-4 ring-white" /></span>
        <p className="mt-5 text-sm font-extrabold text-violet-600">404 · ไม่พบเส้นทางนี้</p>
        <h1 className="mt-2 text-2xl font-extrabold text-[#28345f]">ดูเหมือนภารกิจนี้ยังไม่เปิด</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">กลับไปยังหน้าหลักเพื่อเลือกภารกิจที่พร้อมใช้งาน</p>
        <Link href="/dashboard" className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#6956d9] px-6 text-sm font-bold text-white shadow-lg shadow-violet-200"><Home className="size-4" /> กลับหน้าหลัก</Link>
      </section>
    </main>
  );
}
