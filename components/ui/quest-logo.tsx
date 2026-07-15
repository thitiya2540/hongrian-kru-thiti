import { Star } from "lucide-react";
import { appBrand } from "@/lib/branding";

type QuestLogoProps = {
  compact?: boolean;
  light?: boolean;
  className?: string;
};

export function QuestLogo({ compact = false, light = false, className = "" }: QuestLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`} aria-label={appBrand.name}>
      <span className="relative grid size-11 shrink-0 place-items-center rounded-[16px] bg-gradient-to-br from-amber-300 to-orange-400 text-white shadow-[0_7px_18px_rgba(245,158,11,0.28)] ring-4 ring-white/70">
        <Star className="size-6 fill-current" strokeWidth={2.2} aria-hidden="true" />
        <span className="absolute -right-1 -top-1 size-3 rounded-full bg-fuchsia-400 ring-2 ring-white" />
      </span>
      {!compact && (
        <span className="min-w-0 leading-none">
          <span className={`block text-[18px] font-extrabold leading-tight ${light ? "text-white" : "text-[#3b3b9e]"}`}>
            {appBrand.name}
          </span>
          <span className={`mt-1 block text-[10px] font-semibold ${light ? "text-white/75" : "text-slate-500"}`}>
            {appBrand.subtitle}
          </span>
        </span>
      )}
    </div>
  );
}
