"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { loginSchema } from "@/lib/validations/auth";

export type LoginState = {
  error?: string;
  fieldErrors?: Partial<Record<"email" | "password", string>>;
};

export async function loginAction(_previousState: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return {
      error: "กรุณาตรวจสอบข้อมูลอีกครั้ง",
      fieldErrors: {
        email: errors.email?.[0],
        password: errors.password?.[0],
      },
    };
  }

  if (!isSupabaseConfigured()) {
    return { error: "ยังไม่ได้เชื่อมต่อ Supabase กรุณาตั้งค่า .env.local ก่อนเข้าสู่ระบบจริง" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาลองอีกครั้ง" };
  }

  redirect("/dashboard");
}

export async function signOutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  redirect("/login");
}
