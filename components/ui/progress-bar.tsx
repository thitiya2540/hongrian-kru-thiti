type ProgressBarProps = {
  value: number;
  label?: string;
  color?: "purple" | "green" | "amber" | "blue";
  showValue?: boolean;
};

const colorStyles = {
  purple: "from-[#7862dc] to-[#9a7aec]",
  green: "from-emerald-400 to-green-500",
  amber: "from-amber-300 to-orange-400",
  blue: "from-sky-400 to-blue-500",
};

export function ProgressBar({ value, label, color = "purple", showValue = true }: ProgressBarProps) {
  const safeValue = Math.min(100, Math.max(0, value));

  return (
    <div>
      {(label || showValue) && (
        <div className="mb-2 flex items-center justify-between gap-3 text-xs font-semibold">
          <span className="text-slate-600">{label}</span>
          {showValue && <span className="text-[#34416c]">{safeValue}%</span>}
        </div>
      )}
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full bg-gradient-to-r ${colorStyles[color]} transition-[width] duration-500`} style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}
