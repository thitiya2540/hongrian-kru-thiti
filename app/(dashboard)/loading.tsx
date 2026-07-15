export default function DashboardLoading() {
  return (
    <main className="mx-auto max-w-[1600px] animate-pulse p-4 pb-28 sm:p-6 lg:p-7 xl:p-9">
      <div className="h-52 rounded-[28px] bg-gradient-to-r from-sky-100 to-indigo-50" />
      <div className="mt-5 h-6 w-52 rounded-lg bg-slate-200" />
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((item) => <div key={item} className="h-[420px] overflow-hidden rounded-[26px] border border-slate-100 bg-white"><div className="h-36 bg-sky-100" /><div className="space-y-4 p-5"><div className="h-5 w-2/3 rounded bg-slate-100" /><div className="grid grid-cols-3 gap-2"><div className="h-20 rounded-xl bg-slate-100" /><div className="h-20 rounded-xl bg-slate-100" /><div className="h-20 rounded-xl bg-slate-100" /></div><div className="h-3 rounded bg-slate-100" /></div></div>)}
      </div>
    </main>
  );
}
