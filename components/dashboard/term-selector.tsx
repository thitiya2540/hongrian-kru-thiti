"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useTransition } from "react";
import { CalendarDays, ChevronDown, LoaderCircle } from "lucide-react";
import type { AcademicTermOption } from "@/types/dashboard";

type TermSelectorProps = {
  terms: AcademicTermOption[];
  selectedTermId: string;
};

export function TermSelector({ terms, selectedTermId }: TermSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const selectedTerm = terms.find((term) => term.id === selectedTermId) ?? terms.find((term) => term.isActive) ?? terms[0];
  const academicYears = useMemo(
    () => Array.from(new Set(terms.map((term) => term.academicYear))).sort((a, b) => b - a),
    [terms],
  );
  const semesters = terms.filter((term) => term.academicYear === selectedTerm?.academicYear);

  function navigateToTerm(termId: string) {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("term", termId);
    startTransition(() => router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false }));
  }

  function handleYearChange(value: string) {
    const year = Number(value);
    const nextTerm = terms.find((term) => term.academicYear === year && term.isActive)
      ?? terms.find((term) => term.academicYear === year);
    if (nextTerm) navigateToTerm(nextTerm.id);
  }

  function handleSemesterChange(value: string) {
    const semester = Number(value);
    const nextTerm = terms.find(
      (term) => term.academicYear === selectedTerm?.academicYear && term.semester === semester,
    );
    if (nextTerm) navigateToTerm(nextTerm.id);
  }

  return (
    <div className="relative grid w-full grid-cols-2 gap-2 sm:w-auto sm:min-w-[300px] sm:gap-3">
      <label className="relative rounded-2xl border border-white/80 bg-white/85 px-3.5 py-2 shadow-sm backdrop-blur">
        <span className="block text-[9px] font-bold text-slate-400">ปีการศึกษา</span>
        <span className="mt-0.5 flex items-center gap-2"><CalendarDays className="size-4 text-violet-500" /><select value={selectedTerm?.academicYear ?? ""} onChange={(event) => handleYearChange(event.target.value)} disabled={isPending || terms.length === 0} className="min-w-0 flex-1 appearance-none bg-transparent pr-5 text-sm font-extrabold text-[#34406b] outline-none disabled:opacity-60" aria-label="เลือกปีการศึกษา">{academicYears.map((year) => <option key={year} value={year}>{year}</option>)}</select><ChevronDown className="pointer-events-none absolute bottom-3.5 right-3 size-3.5 text-slate-400" /></span>
      </label>
      <label className="relative rounded-2xl border border-white/80 bg-white/85 px-3.5 py-2 shadow-sm backdrop-blur">
        <span className="block text-[9px] font-bold text-slate-400">ภาคเรียน</span>
        <span className="mt-0.5 flex items-center gap-2"><span className="grid size-4 place-items-center rounded bg-emerald-100 text-[9px] font-extrabold text-emerald-600">{selectedTerm?.semester ?? "-"}</span><select value={selectedTerm?.semester ?? ""} onChange={(event) => handleSemesterChange(event.target.value)} disabled={isPending || semesters.length === 0} className="min-w-0 flex-1 appearance-none bg-transparent pr-5 text-sm font-extrabold text-[#34406b] outline-none disabled:opacity-60" aria-label="เลือกภาคเรียน">{semesters.map((term) => <option key={term.id} value={term.semester}>ภาคเรียนที่ {term.semester}</option>)}</select><ChevronDown className="pointer-events-none absolute bottom-3.5 right-3 size-3.5 text-slate-400" /></span>
      </label>
      {isPending && <span className="absolute -right-2 -top-2 grid size-7 place-items-center rounded-full bg-white text-violet-600 shadow-md" aria-label="กำลังโหลดข้อมูล"><LoaderCircle className="size-4 animate-spin" /></span>}
    </div>
  );
}
