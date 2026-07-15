"use client";

import { useActionState, useState } from "react";
import { ArrowRight, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { loginAction, type LoginState } from "@/actions/auth";

const initialState: LoginState = {};

type LoginFormProps = {
  isConfigured: boolean;
};

export function LoginForm({ isConfigured }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <div className="w-full max-w-[470px]">
      <div>
        <p className="text-sm font-bold text-[#6956d9]">ยินดีต้อนรับกลับมา</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#202b56] sm:text-[38px]">เข้าสู่โลกแห่งภารกิจ</h1>
        <p className="mt-3 text-[15px] leading-7 text-slate-500">เข้าสู่ระบบสำหรับครู เพื่อจัดการคะแนน งาน และพัฒนาการของนักเรียน</p>
      </div>

      {!isConfigured && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
          <b>ยังไม่พร้อมใช้งาน:</b> กรุณาตั้งค่า Supabase ใน Environment Variables ก่อนเข้าสู่ระบบ ข้อมูลตัวอย่างถูกปิดเพื่อป้องกันความสับสนกับข้อมูลจริง
        </div>
      )}

      <form action={formAction} className="mt-7 space-y-5" noValidate>
        {state.error && (
          <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium leading-6 text-rose-700">
            {state.error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-bold text-[#354060]">อีเมล</label>
          <div className={`flex h-13 items-center rounded-2xl border bg-white px-4 transition focus-within:border-[#7764db] focus-within:ring-4 focus-within:ring-[#7764db]/10 ${state.fieldErrors?.email ? "border-rose-300" : "border-slate-200"}`}>
            <Mail className="mr-3 size-5 text-slate-400" aria-hidden="true" />
            <input id="email" name="email" type="email" autoComplete="email" placeholder="teacher@school.ac.th" className="h-full min-w-0 flex-1 border-0 bg-transparent text-[15px] text-slate-800 outline-none placeholder:text-slate-400" aria-invalid={Boolean(state.fieldErrors?.email)} />
          </div>
          {state.fieldErrors?.email && <p className="mt-1.5 text-xs font-medium text-rose-600">{state.fieldErrors.email}</p>}
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-bold text-[#354060]">รหัสผ่าน</label>
          <div className={`flex h-13 items-center rounded-2xl border bg-white px-4 transition focus-within:border-[#7764db] focus-within:ring-4 focus-within:ring-[#7764db]/10 ${state.fieldErrors?.password ? "border-rose-300" : "border-slate-200"}`}>
            <LockKeyhole className="mr-3 size-5 text-slate-400" aria-hidden="true" />
            <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="กรอกรหัสผ่าน" className="h-full min-w-0 flex-1 border-0 bg-transparent text-[15px] text-slate-800 outline-none placeholder:text-slate-400" aria-invalid={Boolean(state.fieldErrors?.password)} />
            <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="ml-2 grid size-9 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-[#6956d9]" aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}>
              {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </div>
          {state.fieldErrors?.password && <p className="mt-1.5 text-xs font-medium text-rose-600">{state.fieldErrors.password}</p>}
        </div>

        <div className="flex items-center justify-between gap-4 text-sm">
          <label className="flex cursor-pointer items-center gap-2 font-medium text-slate-600">
            <input name="remember" type="checkbox" className="size-4 rounded border-slate-300 accent-[#6956d9]" />
            จดจำการเข้าสู่ระบบ
          </label>
          <span className="font-semibold text-slate-400" title="กำลังพัฒนา">ลืมรหัสผ่าน · กำลังพัฒนา</span>
        </div>

        <button type="submit" disabled={isPending || !isConfigured} className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#6f58d9] to-[#8a67e8] px-5 font-bold text-white shadow-[0_12px_25px_rgba(105,86,217,0.27)] transition hover:-translate-y-0.5 hover:shadow-[0_15px_30px_rgba(105,86,217,0.34)] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0">
          {isPending ? <><LoaderCircle className="size-5 animate-spin" /> กำลังเข้าสู่ระบบ...</> : <>เข้าสู่ระบบ <ArrowRight className="size-5" /></>}
        </button>

      </form>

      <div className="mt-7 flex items-center justify-center gap-2 text-xs font-medium text-slate-400">
        <ShieldCheck className="size-4 text-emerald-500" /> ข้อมูลเข้าสู่ระบบได้รับการดูแลผ่าน Supabase Auth
      </div>
    </div>
  );
}
