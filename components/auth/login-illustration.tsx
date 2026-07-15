import { BookOpenCheck, ChartNoAxesCombined, Cloud, School, Sparkles, TreePine } from "lucide-react";

export function LoginIllustration() {
  return (
    <div className="relative flex h-full min-h-[680px] overflow-hidden rounded-[32px] bg-gradient-to-b from-[#8ce0f6] via-[#c5f3ff] to-[#a5e7d1] p-8 text-[#253364] shadow-[0_25px_80px_rgba(49,101,157,0.2)]">
      <div className="absolute inset-x-0 top-0 h-44 bg-[radial-gradient(circle_at_70%_-10%,rgba(255,255,255,0.9),transparent_55%)]" />
      <Cloud className="animate-drift absolute left-[9%] top-[18%] size-20 fill-white/80 text-white/80" />
      <Cloud className="absolute right-[8%] top-[28%] size-16 fill-white/70 text-white/70" />
      <Sparkles className="animate-float absolute right-[18%] top-[12%] size-9 text-amber-300" />

      <div className="relative z-10 mx-auto flex w-full max-w-xl flex-col items-center justify-between">
        <div className="mt-3 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/65 bg-white/45 px-4 py-2 text-sm font-bold text-[#42518d] shadow-sm backdrop-blur">
            <BookOpenCheck className="size-4 text-emerald-600" />
            จัดการคะแนนอย่างเป็นระบบ
          </span>
          <h2 className="mt-5 text-balance text-4xl font-extrabold leading-[1.25] tracking-tight text-[#27366b]">
            ทุกคะแนนคือก้าวใหม่
            <span className="block text-[#664fc7]">ทุกความพยายามมีความหมาย</span>
          </h2>
          <p className="mx-auto mt-3 max-w-md text-base font-medium leading-7 text-[#526488]">
            เปลี่ยนงานประจำของครูให้เป็นภารกิจที่ติดตามง่าย สนุก และเห็นพัฒนาการของเด็กทุกคน
          </p>
        </div>

        <div className="relative mb-5 mt-14 h-[340px] w-full max-w-[520px]">
          <div className="absolute inset-x-[5%] bottom-4 h-36 rounded-[50%] bg-[#3ea993] shadow-[inset_0_-22px_0_#2a8b7c,0_24px_30px_rgba(30,97,100,0.26)]" />
          <div className="absolute inset-x-[9%] bottom-[78px] h-28 rounded-[50%] bg-[#76d86d] shadow-[inset_0_-13px_0_#51be63]" />
          <div className="absolute bottom-[118px] left-1/2 grid size-28 -translate-x-1/2 place-items-center rounded-[36px] bg-gradient-to-b from-[#fff8da] to-[#ffd993] shadow-[0_18px_30px_rgba(64,88,113,0.2)] ring-[7px] ring-white/55">
            <School className="size-16 text-[#a26a35]" strokeWidth={1.7} />
          </div>
          <TreePine className="absolute bottom-[111px] left-[15%] size-20 fill-[#35aa5d] text-[#267d50]" />
          <TreePine className="absolute bottom-[104px] right-[15%] size-24 fill-[#5abd59] text-[#358e4c]" />
          <div className="animate-float absolute left-[5%] top-3 flex items-center gap-2 rounded-2xl border border-white/80 bg-white/90 px-4 py-3 shadow-xl shadow-blue-900/10">
            <span className="grid size-9 place-items-center rounded-xl bg-amber-100 text-amber-500">
              <ChartNoAxesCombined className="size-5" />
            </span>
            <span><b className="block text-sm">บันทึกคะแนน</b><small className="text-slate-500">ครบและตรวจสอบง่าย</small></span>
          </div>
          <div className="animate-float absolute right-[2%] top-16 flex items-center gap-2 rounded-2xl border border-white/80 bg-white/90 px-4 py-3 shadow-xl shadow-blue-900/10 [animation-delay:1s]">
            <span className="grid size-9 place-items-center rounded-xl bg-violet-100 text-violet-600">
              <BookOpenCheck className="size-5" />
            </span>
            <span><b className="block text-sm">เห็นงานค้าง</b><small className="text-slate-500">จัดการได้ทันที</small></span>
          </div>
        </div>
      </div>
    </div>
  );
}
