import Link from "next/link";
import { ClipboardCheck, Copy, Lock, Pencil, Power, Unlock } from "lucide-react";
import { copyAssignmentAction, toggleAssignmentActiveAction, toggleAssignmentLockAction } from "@/actions/assignments";
import { ConfirmSubmit } from "@/components/management/confirm-submit";
import type { AssignmentSummary } from "@/types/assignments";

export function AssignmentActions({ assignment, disabled = false }: { assignment: AssignmentSummary; disabled?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link href={`/assignments/${assignment.id}/scores`} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-50 px-3 text-xs font-extrabold text-emerald-700"><ClipboardCheck className="size-3.5" /> บันทึกคะแนน</Link>
      <Link href={`/assignments/${assignment.id}/edit`} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-violet-50 px-3 text-xs font-extrabold text-violet-700"><Pencil className="size-3.5" /> แก้ไข</Link>
      <form action={copyAssignmentAction}>
        <input type="hidden" name="id" value={assignment.id} />
        <button type="submit" disabled={disabled} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-sky-50 px-3 text-xs font-extrabold text-sky-700 disabled:cursor-not-allowed disabled:text-slate-400"><Copy className="size-3.5" /> คัดลอก</button>
      </form>
      <form action={toggleAssignmentLockAction}>
        <input type="hidden" name="id" value={assignment.id} />
        <input type="hidden" name="isLocked" value={(!assignment.isLocked).toString()} />
        <ConfirmSubmit message={assignment.isLocked ? "ปลดล็อกงานนี้เพื่อให้แก้คะแนนได้อีกครั้งหรือไม่" : "ล็อกงานนี้หลังตรวจเสร็จหรือไม่"}>
          {assignment.isLocked ? <Unlock className="size-3.5" /> : <Lock className="size-3.5" />}
          {assignment.isLocked ? "ปลดล็อก" : "ล็อก"}
        </ConfirmSubmit>
      </form>
      <form action={toggleAssignmentActiveAction}>
        <input type="hidden" name="id" value={assignment.id} />
        <input type="hidden" name="isActive" value={(!assignment.isActive).toString()} />
        <ConfirmSubmit message={assignment.isActive ? "ปิดใช้งานงานนี้หรือไม่ ข้อมูลคะแนนเดิมจะยังอยู่" : "เปิดใช้งานงานนี้อีกครั้งหรือไม่"} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-rose-50 px-3 text-xs font-extrabold text-rose-700">
          <Power className="size-3.5" />
          {assignment.isActive ? "ปิด" : "เปิด"}
        </ConfirmSubmit>
      </form>
    </div>
  );
}
