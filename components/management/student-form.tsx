import { saveStudentAction } from "@/actions/management";
import { SubmitButton } from "@/components/management/submit-button";
import { StudentAvatar } from "@/components/students/student-avatar";
import type { ClassroomSummary, StudentSummary } from "@/types/management";
import { ImagePlus } from "lucide-react";

export function StudentForm({ classrooms, student, disabled = false }: { classrooms: ClassroomSummary[]; student?: StudentSummary; disabled?: boolean }) {
  return (
    <form action={saveStudentAction} encType="multipart/form-data" className="rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_18px_50px_rgba(44,55,105,0.12)]">
      <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-violet-500">{student ? "แก้ไขนักเรียน" : "เพิ่มนักเรียน"}</p>
      <h2 className="mt-1 text-lg font-black text-[#293562]">{student ? `${student.firstName} ${student.lastName}` : "เพิ่มสมาชิกใหม่ในห้อง"}</h2>
      {student ? <input type="hidden" name="id" value={student.id} /> : null}
      <div className="mt-5 grid gap-3">
        <div className="flex items-center gap-3 rounded-[24px] bg-violet-50/70 p-3 ring-1 ring-violet-100">
          {student ? (
            <StudentAvatar student={student} size="lg" />
          ) : (
            <span className="grid size-20 shrink-0 place-items-center rounded-[26px] bg-white text-violet-500 ring-4 ring-white">
              <ImagePlus className="size-8" />
            </span>
          )}
          <label className="grid min-w-0 flex-1 gap-1.5 text-sm font-bold text-slate-600">
            รูปโปรไฟล์นักเรียน
            <input
              name="avatar"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={disabled}
              className="block w-full cursor-pointer rounded-2xl border border-violet-100 bg-white text-xs text-slate-500 file:mr-3 file:h-10 file:border-0 file:bg-violet-100 file:px-3 file:text-xs file:font-extrabold file:text-violet-700"
            />
            <span className="text-xs font-semibold leading-5 text-slate-400">รองรับ JPG, PNG, WebP ไม่เกิน 2MB {student?.avatarUrl ? "ถ้าไม่เลือกไฟล์ใหม่ ระบบจะใช้รูปเดิม" : ""}</span>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1.5 text-sm font-bold text-slate-600">รหัสนักเรียน<input name="studentCode" defaultValue={student?.studentCode} disabled={disabled} required className="h-11 rounded-2xl border border-slate-200 px-3 text-sm outline-none focus:border-violet-300" /></label>
          <label className="grid gap-1.5 text-sm font-bold text-slate-600">เลขที่<input name="numberInClass" type="number" min="1" defaultValue={student?.numberInClass ?? ""} disabled={disabled} className="h-11 rounded-2xl border border-slate-200 px-3 text-sm outline-none focus:border-violet-300" /></label>
        </div>
        <label className="grid gap-1.5 text-sm font-bold text-slate-600">เลขประจำตัว<input name="identityNumber" defaultValue={student?.identityNumber ?? ""} disabled={disabled} className="h-11 rounded-2xl border border-slate-200 px-3 text-sm outline-none focus:border-violet-300" /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1.5 text-sm font-bold text-slate-600">ชื่อ<input name="firstName" defaultValue={student?.firstName} disabled={disabled} required className="h-11 rounded-2xl border border-slate-200 px-3 text-sm outline-none focus:border-violet-300" /></label>
          <label className="grid gap-1.5 text-sm font-bold text-slate-600">นามสกุล<input name="lastName" defaultValue={student?.lastName} disabled={disabled} required className="h-11 rounded-2xl border border-slate-200 px-3 text-sm outline-none focus:border-violet-300" /></label>
        </div>
        <label className="grid gap-1.5 text-sm font-bold text-slate-600">ชื่อเล่น<input name="nickname" defaultValue={student?.nickname ?? ""} disabled={disabled} className="h-11 rounded-2xl border border-slate-200 px-3 text-sm outline-none focus:border-violet-300" /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1.5 text-sm font-bold text-slate-600">ห้องเรียน<select name="classroomId" defaultValue={student?.classroomId ?? classrooms[0]?.id} disabled={disabled || classrooms.length === 0} className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-violet-300">{classrooms.map((classroom) => <option key={classroom.id} value={classroom.id}>ป.{classroom.gradeLevel}/{classroom.room}</option>)}</select></label>
          <label className="grid gap-1.5 text-sm font-bold text-slate-600">สถานะ<select name="status" defaultValue={student?.status ?? "active"} disabled={disabled} className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-violet-300"><option value="active">กำลังเรียน</option><option value="transferred">ย้ายออก</option><option value="graduated">จบการศึกษา</option><option value="inactive">ปิดใช้งาน</option></select></label>
        </div>
        <label className="grid gap-1.5 text-sm font-bold text-slate-600">PIN นักเรียน<input name="pin" inputMode="numeric" pattern="[0-9]*" minLength={4} maxLength={12} disabled={disabled} required={!student} className="h-11 rounded-2xl border border-slate-200 px-3 text-sm outline-none focus:border-violet-300" placeholder={student ? "เว้นว่างถ้าไม่เปลี่ยน PIN" : "เช่น 0401"} /></label>
      </div>
      <div className="mt-5 flex items-center justify-between gap-3"><p className="text-xs leading-5 text-slate-400">ระบบ hash PIN ในฐานข้อมูลและไม่ส่งค่า PIN กลับหน้าเว็บ</p><SubmitButton disabled={disabled}>{student ? "บันทึก" : "เพิ่มนักเรียน"}</SubmitButton></div>
    </form>
  );
}
