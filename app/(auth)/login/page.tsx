import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { LoginIllustration } from "@/components/auth/login-illustration";
import { QuestLogo } from "@/components/ui/quest-logo";
import { appBrand } from "@/lib/branding";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "เข้าสู่ระบบ" };

type LoginPageProps = {
  searchParams: Promise<{ message?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { message } = await searchParams;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f7f8ff] p-4 sm:p-6 lg:p-8">
      <div className="pointer-events-none absolute -left-32 -top-32 size-96 rounded-full bg-cyan-200/35 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 right-[35%] size-80 rounded-full bg-violet-200/35 blur-3xl" />
      <div className="relative mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1500px] overflow-hidden rounded-[30px] border border-white bg-white/85 shadow-[0_28px_90px_rgba(49,57,109,0.12)] backdrop-blur sm:min-h-[calc(100vh-3rem)] lg:grid-cols-[0.88fr_1.12fr] lg:p-3">
        <section className="flex min-h-[700px] flex-col px-6 py-7 sm:px-12 sm:py-9 lg:px-16 xl:px-20">
          <QuestLogo />
          <div className="flex flex-1 items-center py-12">
            <div className="w-full">
              {message && <div className="mx-auto mb-5 max-w-[470px] rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">{message}</div>}
              <LoginForm isConfigured={isSupabaseConfigured()} />
            </div>
          </div>
          <p className="text-center text-xs text-slate-400 lg:text-left">© 2026 {appBrand.name} · ออกแบบเพื่อห้องเรียนที่สนุกและเป็นระบบ</p>
        </section>
        <aside className="hidden lg:block"><LoginIllustration /></aside>
      </div>
    </div>
  );
}
