import type { LucideIcon } from "lucide-react";

type ComingSoonButtonProps = {
  label: string;
  icon: LucideIcon;
  variant?: "primary" | "secondary";
};

export function ComingSoonButton({ label, icon: Icon, variant = "secondary" }: ComingSoonButtonProps) {
  return (
    <button type="button" disabled title="กำลังพัฒนาในระยะถัดไป" className={`inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold opacity-65 ${variant === "primary" ? "bg-[#6956d9] text-white shadow-lg shadow-violet-200" : "border border-violet-200 bg-white text-[#5c4cb4]"}`}>
      <Icon className="size-4" /> {label}
      <span className="rounded-full bg-white/70 px-1.5 py-0.5 text-[9px] font-extrabold text-[#6956d9]">กำลังพัฒนา</span>
    </button>
  );
}
