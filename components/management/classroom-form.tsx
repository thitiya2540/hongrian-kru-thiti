"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { saveClassroomAction, type ClassroomFormState } from "@/actions/management";
import { SubmitButton } from "@/components/management/submit-button";
import type { ClassroomSummary, TermOption } from "@/types/management";

const colors = ["#6956D9", "#35A768", "#E88524", "#0EA5E9", "#EC4899"];
const initialState: ClassroomFormState = {};

export function ClassroomForm({ terms, classroom, disabled = false, compact = false }: { terms: TermOption[]; classroom?: ClassroomSummary; disabled?: boolean; compact?: boolean }) {
  const [state, formAction] = useActionState(saveClassroomAction, initialState);

  return (
    <form action={formAction} className={`${compact ? "rounded-[24px] p-4 shadow-sm" : "rounded-[28px] p-5 shadow-[0_18px_50px_rgba(44,55,105,0.12)]"} border border-white/80 bg-white`}>
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-violet-500">{classroom ? "แก้ไขห้องเรียน" : "เพิ่มห้องเรียน"}</p>
        <h2 className="mt-1 text-lg font-black text-[#293562]">{classroom ? `ป.${classroom.gradeLevel}/${classroom.room}` : "สร้างห้องเรียนใหม่"}</h2>
      </div>

      {state.message ? (
        <div
          role="status"
          className={`mt-4 flex items-start gap-2 rounded-2xl border px-3 py-2 text-sm font-bold leading-6 ${
            state.status === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {state.status === "success" ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> : <AlertCircle className="mt-0.5 size-4 shrink-0" />}
          <span>{state.message}</span>
        </div>
      ) : null}

      {classroom ? <input type="hidden" name="id" value={classroom.id} /> : null}
      <div className="mt-5 grid gap-3">
        <label className="grid gap-1.5 text-sm font-bold text-slate-600">
          ชื่อห้อง
          <input name="name" defaultValue={classroom?.name} disabled={disabled} required className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-violet-300" placeholder="เช่น หมู่บ้านนักคิด" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1.5 text-sm font-bold text-slate-600">
            ระดับชั้น
            <select name="gradeLevel" defaultValue={classroom?.gradeLevel ?? 4} disabled={disabled} className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-violet-300">
              {[1, 2, 3, 4, 5, 6].map((grade) => <option key={grade} value={grade}>ป.{grade}</option>)}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-bold text-slate-600">
            ห้อง
            <input name="room" defaultValue={classroom?.room ?? "1"} disabled={disabled} required className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-violet-300" />
          </label>
        </div>
        <label className="grid gap-1.5 text-sm font-bold text-slate-600">
          ภาคเรียน
          <select name="academicTermId" defaultValue={classroom?.academicTermId ?? terms.find((term) => term.isActive)?.id ?? terms[0]?.id} disabled={disabled || terms.length === 0} className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-violet-300">
            {terms.map((term) => <option key={term.id} value={term.id}>ปีการศึกษา {term.academicYear} / ภาคเรียน {term.semester}</option>)}
          </select>
        </label>
        <div className="grid gap-1.5 text-sm font-bold text-slate-600">
          สีประจำห้อง
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => (
              <label key={color} className="relative">
                <input className="peer sr-only" type="radio" name="color" value={color} defaultChecked={(classroom?.color ?? colors[0]) === color} disabled={disabled} />
                <span className="grid size-9 cursor-pointer place-items-center rounded-2xl ring-2 ring-transparent peer-checked:ring-slate-700" style={{ backgroundColor: color }} />
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="text-xs leading-5 text-slate-400">{disabled ? "เชื่อม Supabase ก่อนจึงจะบันทึกได้" : "บันทึกพร้อมประวัติในฐานข้อมูล"}</p>
        <SubmitButton disabled={disabled}>{classroom ? "บันทึก" : "เพิ่มห้อง"}</SubmitButton>
      </div>
    </form>
  );
}
