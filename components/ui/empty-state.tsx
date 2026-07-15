import { Map } from "lucide-react";

type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-3xl border border-dashed border-violet-200 bg-violet-50/50 px-6 py-12 text-center">
      <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-white text-violet-500 shadow-sm"><Map className="size-7" /></span>
      <h3 className="mt-4 font-extrabold text-[#303b69]">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}
