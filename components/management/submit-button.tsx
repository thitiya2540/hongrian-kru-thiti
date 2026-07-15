"use client";

import { Loader2, Save } from "lucide-react";
import { useFormStatus } from "react-dom";

export function SubmitButton({ children = "บันทึก", disabled = false }: { children?: React.ReactNode; disabled?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#6956d9] px-4 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(105,86,217,0.24)] transition hover:bg-[#5d4dc7] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
      {pending ? "กำลังบันทึก" : children}
    </button>
  );
}
