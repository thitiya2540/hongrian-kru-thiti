import { Calculator, Percent, SlidersHorizontal } from "lucide-react";
import { saveScoringPolicyAction } from "@/actions/settings";
import { SubmitButton } from "@/components/management/submit-button";
import type { ScoringPolicyViewModel } from "@/types/settings";

const gradeKeys = ["excellent", "good", "fair", "pass", "support"];

type ScoringPolicyFormProps = {
  scoring: ScoringPolicyViewModel;
  disabled: boolean;
};

export function ScoringPolicyForm({ scoring, disabled }: ScoringPolicyFormProps) {
  const policy = scoring.policy;

  return (
    <form action={saveScoringPolicyAction} className="rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_18px_50px_rgba(44,55,105,0.12)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700">
            <Calculator className="size-3.5" />
            นโยบายคะแนน
          </p>
          <h2 className="mt-2 text-xl font-black text-[#293562]">สูตรคะแนนและเกณฑ์ระดับ</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            ใช้คำนวณร้อยละและระดับในสมุดคะแนนรวม ถ้าน้ำหนักรวมไม่เท่ากับ 100% ระบบจะไม่ให้บันทึก
          </p>
        </div>
        <div className={`rounded-2xl px-3 py-2 text-center text-sm font-extrabold ${scoring.isBalanced ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
          รวม {scoring.totalWeight}%
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <section className="rounded-3xl bg-slate-50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-2xl bg-white text-violet-600"><SlidersHorizontal className="size-4" /></span>
            <div>
              <h3 className="font-extrabold text-[#293562]">น้ำหนักหมวดคะแนน</h3>
              <p className="text-xs text-slate-400">ใช้กับ category ของงาน/ภารกิจ</p>
            </div>
          </div>
          <div className="grid gap-3">
            {policy.categories.map((category) => (
              <div key={category.key} className="grid gap-2 rounded-2xl bg-white p-3 md:grid-cols-[1fr_120px]">
                <label className="grid gap-1 text-xs font-bold text-slate-500">
                  ชื่อหมวด
                  <input name={`label_${category.key}`} defaultValue={category.label} disabled={disabled} className="h-10 rounded-xl border border-slate-200 px-3 text-sm font-bold text-[#293562] outline-none focus:border-violet-300 disabled:bg-slate-100" />
                </label>
                <label className="grid gap-1 text-xs font-bold text-slate-500">
                  น้ำหนัก %
                  <input name={`weight_${category.key}`} type="number" min="0" max="100" step="1" defaultValue={category.weight} disabled={disabled} className="h-10 rounded-xl border border-slate-200 px-3 text-sm font-bold text-[#293562] outline-none focus:border-violet-300 disabled:bg-slate-100" />
                </label>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-slate-50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-2xl bg-white text-emerald-600"><Percent className="size-4" /></span>
            <div>
              <h3 className="font-extrabold text-[#293562]">เกณฑ์ระดับผลการเรียน</h3>
              <p className="text-xs text-slate-400">เรียงจากคะแนนสูงลงต่ำ และต้องมีช่วง 0%</p>
            </div>
          </div>
          <div className="grid gap-3">
            {policy.gradeBands.map((band, index) => (
              <div key={`${band.label}-${band.minPercent}`} className="grid gap-2 rounded-2xl bg-white p-3 md:grid-cols-[1fr_120px]">
                <label className="grid gap-1 text-xs font-bold text-slate-500">
                  ชื่อระดับ
                  <input name={`grade_label_${gradeKeys[index] ?? `custom_${index}`}`} defaultValue={band.label} disabled={disabled} className="h-10 rounded-xl border border-slate-200 px-3 text-sm font-bold text-[#293562] outline-none focus:border-violet-300 disabled:bg-slate-100" />
                </label>
                <label className="grid gap-1 text-xs font-bold text-slate-500">
                  ตั้งแต่ %
                  <input name={`grade_min_${gradeKeys[index] ?? `custom_${index}`}`} type="number" min="0" max="100" step="1" defaultValue={band.minPercent} disabled={disabled} className="h-10 rounded-xl border border-slate-200 px-3 text-sm font-bold text-[#293562] outline-none focus:border-violet-300 disabled:bg-slate-100" />
                </label>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-5 rounded-3xl bg-violet-50 p-4">
        <h3 className="font-extrabold text-[#293562]">งานยังไม่ส่งในสมุดคะแนน</h3>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <label className="flex items-start gap-3 rounded-2xl bg-white p-3 text-sm font-bold text-[#293562]">
            <input type="radio" name="missingScorePolicy" value="count_zero" defaultChecked={policy.missingScorePolicy === "count_zero"} disabled={disabled} className="mt-1 size-4 accent-violet-600" />
            <span><span className="block">นับเป็น 0 คะแนน</span><small className="font-medium text-slate-400">เหมาะกับคะแนนเก็บที่ครบกำหนดแล้ว</small></span>
          </label>
          <label className="flex items-start gap-3 rounded-2xl bg-white p-3 text-sm font-bold text-[#293562]">
            <input type="radio" name="missingScorePolicy" value="exclude_from_total" defaultChecked={policy.missingScorePolicy === "exclude_from_total"} disabled={disabled} className="mt-1 size-4 accent-violet-600" />
            <span><span className="block">ยังไม่นับฐานคะแนน</span><small className="font-medium text-slate-400">เหมาะกับงานที่ยังเปิดรับหรือยังไม่ครบกำหนด</small></span>
          </label>
        </div>
      </section>

      <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-xs font-semibold text-slate-400">
          อัปเดตล่าสุด {new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(policy.updatedAt))}
        </p>
        <SubmitButton disabled={disabled || !scoring.isBalanced}>บันทึกสูตรคะแนน</SubmitButton>
      </div>
    </form>
  );
}
