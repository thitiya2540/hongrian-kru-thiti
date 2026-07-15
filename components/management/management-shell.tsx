import { DataSourceNotice } from "@/components/management/data-source-notice";
import type { ManagementDataSource } from "@/types/management";

type ManagementShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  source: ManagementDataSource;
  notice?: string;
  children: React.ReactNode;
};

export function ManagementShell({ eyebrow, title, description, source, notice, children }: ManagementShellProps) {
  return (
    <main className="mx-auto max-w-[1500px] p-4 pb-28 sm:p-6 sm:pb-28 lg:p-7 lg:pb-8 xl:p-9">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,390px)] lg:items-end">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-violet-500">{eyebrow}</p>
          <h1 className="mt-2 text-2xl font-black text-[#273461] sm:text-3xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>
        </div>
        <DataSourceNotice source={source} notice={notice} />
      </div>
      {children}
    </main>
  );
}
