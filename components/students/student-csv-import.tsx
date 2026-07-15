"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2, Download, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { importStudentsCsvAction, type StudentCsvImportState } from "@/actions/management";
import { parseStudentCsv, type StudentCsvParseResult } from "@/lib/students/csv";
import type { ClassroomSummary } from "@/types/management";

const initialState: StudentCsvImportState = {};

function ImportButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={disabled || pending} className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-[#6956d9] px-4 text-xs font-extrabold text-white shadow-[0_10px_24px_rgba(105,86,217,0.24)] transition hover:bg-[#5d4dc7] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none">
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
      ยืนยันนำเข้า
    </button>
  );
}

export function StudentCsvImport({ classrooms, disabled = false }: { classrooms: ClassroomSummary[]; disabled?: boolean }) {
  const [state, formAction] = useActionState(importStudentsCsvAction, initialState);
  const [preview, setPreview] = useState<StudentCsvParseResult | null>(null);
  const [fileName, setFileName] = useState("");

  async function handleFileChange(file: File | null) {
    setPreview(null);
    setFileName(file?.name ?? "");
    if (!file) return;
    if (file.size > 1024 * 1024) {
      setPreview({ rows: [], errors: ["ไฟล์ CSV ต้องมีขนาดไม่เกิน 1MB"] });
      return;
    }
    try {
      setPreview(parseStudentCsv(await file.text()));
    } catch {
      setPreview({ rows: [], errors: ["ไม่สามารถอ่านไฟล์ CSV นี้ได้"] });
    }
  }

  const hasValidPreview = Boolean(preview && preview.errors.length === 0 && preview.rows.length > 0);

  return (
    <section className="rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_18px_50px_rgba(44,55,105,0.12)]">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-600"><FileSpreadsheet className="size-5" /></span>
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-emerald-600">นำเข้ารายชื่อ</p>
          <h2 className="mt-1 text-lg font-black text-[#293562]">เพิ่มนักเรียนจาก CSV</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">นำเข้าได้ครั้งละไม่เกิน 200 คน ระบบตรวจข้อมูลก่อนบันทึกทุกครั้ง</p>
        </div>
      </div>

      <a href="/api/students/csv-template" className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-2xl bg-violet-50 px-3 text-xs font-extrabold text-violet-700 transition hover:bg-violet-100">
        <Download className="size-4" /> ดาวน์โหลดไฟล์ต้นแบบ CSV
      </a>
      <p className="mt-2 text-xs leading-5 text-slate-400">กรอกข้อมูลในไฟล์ต้นแบบ ห้ามเปลี่ยนชื่อหรือเรียงลำดับหัวตาราง และต้องระบุ PIN เป็นตัวเลข 4-12 หลัก</p>

      <form action={formAction} className="mt-4 grid gap-3">
        <label className="grid gap-1.5 text-sm font-bold text-slate-600">
          ห้องเรียนปลายทาง
          <select name="classroomId" defaultValue={classrooms[0]?.id ?? ""} disabled={disabled || classrooms.length === 0} className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-violet-300 disabled:bg-slate-50">
            {classrooms.length === 0 ? <option value="">ยังไม่มีห้องเรียน</option> : classrooms.map((classroom) => <option key={classroom.id} value={classroom.id}>ป.{classroom.gradeLevel}/{classroom.room} · {classroom.name}</option>)}
          </select>
        </label>
        <label className="grid gap-1.5 text-sm font-bold text-slate-600">
          ไฟล์ CSV
          <input name="csvFile" type="file" accept=".csv,text/csv" disabled={disabled || classrooms.length === 0} onChange={(event) => void handleFileChange(event.target.files?.[0] ?? null)} className="block w-full cursor-pointer rounded-2xl border border-slate-200 bg-slate-50 text-xs text-slate-500 file:mr-3 file:h-10 file:border-0 file:bg-violet-100 file:px-3 file:text-xs file:font-extrabold file:text-violet-700" />
        </label>

        {fileName ? <p className="text-xs font-semibold text-slate-400">ไฟล์ที่เลือก: {fileName}</p> : null}
        {preview?.errors.length ? (
          <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold leading-5 text-rose-700">
            <div className="flex items-center gap-1.5 font-extrabold"><AlertCircle className="size-4" /> ตรวจพบ {preview.errors.length} จุด</div>
            <ul className="mt-1 list-disc pl-5">{preview.errors.slice(0, 3).map((error) => <li key={error}>{error}</li>)}</ul>
          </div>
        ) : null}
        {hasValidPreview && preview ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
            <div className="flex items-center gap-1.5 font-extrabold"><CheckCircle2 className="size-4" /> ตรวจรูปแบบแล้ว พร้อมนำเข้า {preview.rows.length} คน</div>
            <p className="mt-1.5 truncate font-semibold">ตัวอย่าง: {preview.rows.slice(0, 3).map((row) => `${row.numberInClass || "-"} ${row.firstName} ${row.lastName}`).join(" · ")}</p>
          </div>
        ) : null}
        {state.message ? <div role="status" className={`rounded-2xl p-3 text-xs font-bold leading-5 ${state.status === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{state.message}</div> : null}

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs leading-5 text-slate-400">ถ้ารหัสซ้ำหรือข้อมูลผิด ระบบจะไม่เพิ่มนักเรียนบางส่วน</p>
          <ImportButton disabled={disabled || classrooms.length === 0 || !hasValidPreview} />
        </div>
      </form>
    </section>
  );
}
