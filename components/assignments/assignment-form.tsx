"use client";

/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import { Eye, ImageUp, Link2 } from "lucide-react";
import { saveAssignmentAction } from "@/actions/assignments";
import { SubmitButton } from "@/components/management/submit-button";
import { assignmentTypeLabels } from "@/lib/assignments/constants";
import type { AssignmentSummary, AssignmentTemplateSummary, AssignmentType } from "@/types/assignments";
import type { ClassroomSummary, SubjectSummary } from "@/types/management";
import type { RecordingMode } from "@/types/database";

const assignmentTypes = Object.entries(assignmentTypeLabels) as [AssignmentType, string][];
const recordingModes: { value: RecordingMode; label: string }[] = [
  { value: "score_and_status", label: "คะแนนพร้อมสถานะ" },
  { value: "score_only", label: "คะแนนอย่างเดียว" },
  { value: "status_only", label: "สถานะอย่างเดียว" },
];

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

type AssignmentDraft = {
  classroomId: string;
  subjectId: string;
  templateId: string;
  title: string;
  assignmentType: AssignmentType;
  recordingMode: RecordingMode;
  unitName: string;
  category: string;
  description: string;
  resourceUrl: string;
  maxScore: number;
  activityDate: string;
  dueDate: string;
  allowBonus: boolean;
  saveAsTemplate: boolean;
};

export function AssignmentForm({
  classrooms,
  subjects,
  templates,
  assignment,
  disabled = false,
}: {
  classrooms: ClassroomSummary[];
  subjects: SubjectSummary[];
  templates: AssignmentTemplateSummary[];
  assignment?: AssignmentSummary;
  disabled?: boolean;
}) {
  const initialClassroomId = assignment?.classroomId ?? classrooms[0]?.id ?? "";
  const initialSubjects = subjects.filter((subject) => subject.classroomIds.includes(initialClassroomId));
  const [draft, setDraft] = useState<AssignmentDraft>({
    classroomId: initialClassroomId,
    subjectId: assignment?.subjectId ?? initialSubjects[0]?.id ?? subjects[0]?.id ?? "",
    templateId: assignment?.templateId ?? "",
    title: assignment?.title ?? "",
    assignmentType: assignment?.assignmentType ?? "worksheet",
    recordingMode: assignment?.recordingMode ?? "score_and_status",
    unitName: assignment?.unitName ?? "",
    category: assignment?.category ?? "คะแนนเก็บ",
    description: assignment?.description ?? "",
    resourceUrl: assignment?.resourceUrl ?? "",
    maxScore: assignment?.maxScore ?? 10,
    activityDate: assignment?.activityDate ?? todayDate(),
    dueDate: assignment?.dueDate ?? "",
    allowBonus: assignment?.allowBonus ?? false,
    saveAsTemplate: false,
  });

  const availableSubjects = useMemo(() => {
    const linked = subjects.filter((subject) => subject.classroomIds.includes(draft.classroomId));
    return linked.length > 0 ? linked : subjects;
  }, [draft.classroomId, subjects]);

  function update<K extends keyof AssignmentDraft>(key: K, value: AssignmentDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function selectTemplate(templateId: string) {
    const template = templates.find((item) => item.id === templateId);
    if (!template) {
      update("templateId", "");
      return;
    }

    setDraft((current) => ({
      ...current,
      templateId,
      title: template.title,
      assignmentType: template.assignmentType,
      recordingMode: template.recordingMode,
      category: template.category,
      description: template.description ?? "",
      maxScore: template.defaultMaxScore,
    }));
  }

  return (
    <form action={saveAssignmentAction} className="rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_18px_50px_rgba(44,55,105,0.12)]">
      {assignment ? <input type="hidden" name="id" value={assignment.id} /> : null}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-violet-500">{assignment ? "แก้ไขภารกิจ" : "สร้างภารกิจใหม่"}</p>
          <h2 className="mt-1 text-xl font-black text-[#293562]">{assignment ? assignment.title : "ตั้งค่างานให้พร้อมบันทึกคะแนน"}</h2>
        </div>
        {assignment?.isLocked ? <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-extrabold text-amber-700">ล็อกแล้ว</span> : null}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-bold text-slate-600">
          ห้องเรียน
          <select
            name="classroomId"
            value={draft.classroomId}
            disabled={disabled || Boolean(assignment)}
            onChange={(event) => {
              const classroomId = event.target.value;
              const nextSubjects = subjects.filter((subject) => subject.classroomIds.includes(classroomId));
              setDraft((current) => ({ ...current, classroomId, subjectId: nextSubjects[0]?.id ?? current.subjectId }));
            }}
            className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-violet-300"
          >
            {classrooms.map((classroom) => <option key={classroom.id} value={classroom.id}>ป.{classroom.gradeLevel}/{classroom.room} · {classroom.name}</option>)}
          </select>
          {assignment ? <input type="hidden" name="classroomId" value={draft.classroomId} /> : null}
        </label>
        <label className="grid gap-1.5 text-sm font-bold text-slate-600">
          รายวิชา
          <select name="subjectId" value={draft.subjectId} disabled={disabled} onChange={(event) => update("subjectId", event.target.value)} className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-violet-300">
            {availableSubjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
          </select>
        </label>
        <label className="grid gap-1.5 text-sm font-bold text-slate-600 lg:col-span-2">
          เลือกงานเดิมเป็นแม่แบบ
          <select name="templateId" value={draft.templateId} disabled={disabled} onChange={(event) => selectTemplate(event.target.value)} className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-violet-300">
            <option value="">พิมพ์ชื่องานใหม่</option>
            {templates.map((template) => <option key={template.id} value={template.id}>{template.title} · {template.category} · {template.defaultMaxScore} คะแนน</option>)}
          </select>
        </label>
        <label className="grid gap-1.5 text-sm font-bold text-slate-600 lg:col-span-2">
          ชื่องาน
          <input name="title" value={draft.title} onChange={(event) => update("title", event.target.value)} disabled={disabled} required className="h-11 rounded-2xl border border-slate-200 px-3 text-sm outline-none focus:border-violet-300" placeholder="เช่น ใบงานการคูณ" />
        </label>
        <label className="grid gap-1.5 text-sm font-bold text-slate-600">
          ประเภทงาน
          <select name="assignmentType" value={draft.assignmentType} disabled={disabled} onChange={(event) => update("assignmentType", event.target.value as AssignmentType)} className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-violet-300">
            {assignmentTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="grid gap-1.5 text-sm font-bold text-slate-600">
          รูปแบบการบันทึก
          <select name="recordingMode" value={draft.recordingMode} disabled={disabled} onChange={(event) => update("recordingMode", event.target.value as RecordingMode)} className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-violet-300">
            {recordingModes.map((mode) => <option key={mode.value} value={mode.value}>{mode.label}</option>)}
          </select>
        </label>
        <label className="grid gap-1.5 text-sm font-bold text-slate-600">
          หน่วยการเรียนรู้
          <input name="unitName" value={draft.unitName} onChange={(event) => update("unitName", event.target.value)} disabled={disabled} className="h-11 rounded-2xl border border-slate-200 px-3 text-sm outline-none focus:border-violet-300" />
        </label>
        <label className="grid gap-1.5 text-sm font-bold text-slate-600">
          หมวดคะแนน
          <input name="category" value={draft.category} onChange={(event) => update("category", event.target.value)} disabled={disabled} required className="h-11 rounded-2xl border border-slate-200 px-3 text-sm outline-none focus:border-violet-300" />
        </label>
        <label className="grid gap-1.5 text-sm font-bold text-slate-600">
          คะแนนเต็ม
          <input name="maxScore" type="number" min="0.01" step="0.01" value={draft.maxScore} onChange={(event) => update("maxScore", Number(event.target.value))} disabled={disabled} required className="h-11 rounded-2xl border border-slate-200 px-3 text-sm outline-none focus:border-violet-300" />
        </label>
        <label className="grid gap-1.5 text-sm font-bold text-slate-600">
          วันที่ทำงาน
          <input name="activityDate" type="date" value={draft.activityDate} onChange={(event) => update("activityDate", event.target.value)} disabled={disabled} required className="h-11 rounded-2xl border border-slate-200 px-3 text-sm outline-none focus:border-violet-300" />
        </label>
        <label className="grid gap-1.5 text-sm font-bold text-slate-600">
          วันที่กำหนดส่ง
          <input name="dueDate" type="date" value={draft.dueDate} onChange={(event) => update("dueDate", event.target.value)} disabled={disabled} className="h-11 rounded-2xl border border-slate-200 px-3 text-sm outline-none focus:border-violet-300" />
        </label>
        <label className="grid gap-1.5 text-sm font-bold text-slate-600 lg:col-span-2">
          รายละเอียดเพิ่มเติม
          <textarea name="description" value={draft.description} onChange={(event) => update("description", event.target.value)} disabled={disabled} rows={3} className="rounded-2xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-violet-300" />
        </label>

        <section className="grid gap-4 rounded-3xl border border-violet-100 bg-violet-50/40 p-4 lg:col-span-2 lg:grid-cols-[minmax(0,1fr)_240px]">
          <div className="grid content-start gap-4">
            <div>
              <p className="flex items-center gap-2 text-sm font-black text-[#293562]"><ImageUp className="size-4 text-violet-600" /> ภาพตัวอย่างใบงาน</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">รองรับ JPG, PNG หรือ WebP ขนาดไม่เกิน 5MB ภาพจะมองเห็นได้เฉพาะครูที่เข้าสู่ระบบ</p>
            </div>
            <input name="previewImage" type="file" accept="image/jpeg,image/png,image/webp" disabled={disabled} className="block w-full rounded-2xl border border-dashed border-violet-200 bg-white p-3 text-sm font-semibold text-slate-500 file:mr-3 file:rounded-xl file:border-0 file:bg-violet-100 file:px-3 file:py-2 file:text-xs file:font-extrabold file:text-violet-700" />
            {assignment?.previewImagePath ? (
              <label className="flex items-center gap-2 text-xs font-bold text-rose-600">
                <input type="checkbox" name="removePreviewImage" value="true" disabled={disabled} className="size-4 accent-rose-500" />
                ลบภาพตัวอย่างเดิมโดยไม่อัปโหลดภาพใหม่
              </label>
            ) : null}
            <label className="grid gap-1.5 text-sm font-bold text-slate-600">
              <span className="flex items-center gap-2"><Link2 className="size-4 text-sky-600" /> ลิงก์ดาวน์โหลดหรือเปิดใบงาน</span>
              <input name="resourceUrl" type="url" value={draft.resourceUrl} onChange={(event) => update("resourceUrl", event.target.value)} disabled={disabled} maxLength={2048} placeholder="https://drive.google.com/..." className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-violet-300" />
              <span className="text-[11px] font-medium leading-5 text-slate-400">ใส่ลิงก์ Google Drive, OneDrive, Canva หรือเว็บไซต์ที่ครูต้องการให้ปุ่มดาวน์โหลดเปิดไปหา</span>
            </label>
          </div>
          <div className="overflow-hidden rounded-2xl border border-white bg-white shadow-sm">
            {assignment?.previewImageUrl ? (
              <a href={assignment.previewImageUrl} target="_blank" rel="noreferrer" className="group relative block aspect-[4/3] bg-slate-100">
                <img src={assignment.previewImageUrl} alt={`ตัวอย่าง ${assignment.title}`} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                <span className="absolute inset-x-3 bottom-3 inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-950/75 px-3 py-2 text-xs font-extrabold text-white backdrop-blur"><Eye className="size-3.5" /> ดูภาพเดิมขนาดเต็ม</span>
              </a>
            ) : (
              <div className="grid aspect-[4/3] place-items-center p-5 text-center text-xs font-bold leading-5 text-slate-400"><ImageUp className="mx-auto mb-2 size-8 text-violet-300" />ยังไม่มีภาพตัวอย่าง</div>
            )}
          </div>
        </section>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <label className="flex items-center gap-2 rounded-2xl bg-sky-50 px-3 py-3 text-sm font-bold text-sky-700"><input type="checkbox" name="allowBonus" value="true" checked={draft.allowBonus} onChange={(event) => update("allowBonus", event.target.checked)} disabled={disabled} className="size-4 accent-sky-600" /> อนุญาตโบนัส</label>
        <label className="flex items-center gap-2 rounded-2xl bg-amber-50 px-3 py-3 text-sm font-bold text-amber-700"><input type="checkbox" name="saveAsTemplate" value="true" checked={draft.saveAsTemplate} onChange={(event) => update("saveAsTemplate", event.target.checked)} disabled={disabled} className="size-4 accent-amber-500" /> เก็บเป็นแม่แบบ</label>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-xs leading-5 text-slate-400">{disabled ? "เชื่อม Supabase ก่อนจึงจะบันทึกงานได้" : "เมื่อสร้างงาน ระบบจะเตรียมรายการนักเรียนในห้องให้พร้อมสำหรับบันทึกคะแนนระยะถัดไป"}</p>
        <SubmitButton disabled={disabled || classrooms.length === 0 || subjects.length === 0}>{assignment ? "บันทึกงาน" : "สร้างงาน"}</SubmitButton>
      </div>
    </form>
  );
}
