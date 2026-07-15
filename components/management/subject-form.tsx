import { assignSubjectClassroomsAction, saveSubjectAction } from "@/actions/management";
import { SubmitButton } from "@/components/management/submit-button";
import type { ClassroomSummary, SubjectSummary } from "@/types/management";

const colors = ["#6F58D9", "#32A66B", "#E98525", "#0EA5E9", "#E94E77"];
const icons = ["calculator", "book-open", "shapes", "sigma"];

export function SubjectForm({ subject, disabled = false }: { subject?: SubjectSummary; disabled?: boolean }) {
  return (
    <form action={saveSubjectAction} className="rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_18px_50px_rgba(44,55,105,0.12)]">
      <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-violet-500">{subject ? "แก้ไขรายวิชา" : "เพิ่มรายวิชา"}</p>
      <h2 className="mt-1 text-lg font-black text-[#293562]">{subject?.name ?? "ตั้งค่ารายวิชาใหม่"}</h2>
      {subject ? <input type="hidden" name="id" value={subject.id} /> : null}
      <div className="mt-5 grid gap-3">
        <label className="grid gap-1.5 text-sm font-bold text-slate-600">ชื่อวิชา<input name="name" defaultValue={subject?.name} disabled={disabled} required className="h-11 rounded-2xl border border-slate-200 px-3 text-sm outline-none focus:border-violet-300" /></label>
        <label className="grid gap-1.5 text-sm font-bold text-slate-600">รหัสวิชา<input name="subjectCode" defaultValue={subject?.subjectCode} disabled={disabled} required className="h-11 rounded-2xl border border-slate-200 px-3 text-sm uppercase outline-none focus:border-violet-300" placeholder="MATH-P4" /></label>
        <label className="grid gap-1.5 text-sm font-bold text-slate-600">ไอคอน<select name="icon" defaultValue={subject?.icon ?? "book-open"} disabled={disabled} className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-violet-300">{icons.map((icon) => <option key={icon} value={icon}>{icon}</option>)}</select></label>
        <div className="grid gap-1.5 text-sm font-bold text-slate-600">
          สีประจำวิชา
          <div className="flex flex-wrap gap-2">{colors.map((color) => <label key={color}><input className="peer sr-only" type="radio" name="color" value={color} defaultChecked={(subject?.color ?? colors[0]) === color} disabled={disabled} /><span className="block size-9 rounded-2xl ring-2 ring-transparent peer-checked:ring-slate-700" style={{ backgroundColor: color }} /></label>)}</div>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between gap-3"><p className="text-xs leading-5 text-slate-400">{disabled ? "เชื่อม Supabase ก่อนจึงจะบันทึกได้" : "รหัสวิชาห้ามซ้ำในบัญชีครูเดียวกัน"}</p><SubmitButton disabled={disabled}>{subject ? "บันทึก" : "เพิ่มวิชา"}</SubmitButton></div>
    </form>
  );
}

export function SubjectClassroomForm({ subject, classrooms, disabled = false }: { subject: SubjectSummary; classrooms: ClassroomSummary[]; disabled?: boolean }) {
  return (
    <form action={assignSubjectClassroomsAction} className="rounded-3xl bg-slate-50 p-4">
      <input type="hidden" name="subjectId" value={subject.id} />
      <p className="text-sm font-extrabold text-[#293562]">เชื่อมกับห้องเรียน</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {classrooms.map((classroom) => (
          <label key={classroom.id} className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm font-bold text-slate-600 ring-1 ring-slate-100">
            <input type="checkbox" name="classroomIds" value={classroom.id} defaultChecked={subject.classroomIds.includes(classroom.id)} disabled={disabled} className="size-4 accent-violet-600" />
            ป.{classroom.gradeLevel}/{classroom.room}
          </label>
        ))}
      </div>
      <div className="mt-3"><SubmitButton disabled={disabled}>บันทึกการเชื่อม</SubmitButton></div>
    </form>
  );
}
