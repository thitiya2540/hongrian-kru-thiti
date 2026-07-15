type StudentAvatarStudent = {
  firstName?: string;
  lastName?: string;
  studentName?: string;
  nickname: string | null;
  avatarUrl: string | null;
  numberInClass: number | null;
};

const sizeClasses = {
  sm: "size-11 rounded-2xl text-base",
  md: "size-14 rounded-2xl text-lg",
  lg: "size-20 rounded-[26px] text-3xl",
  xl: "size-24 rounded-[30px] text-4xl",
};

const badgeClasses = {
  sm: "min-w-5 px-1.5 py-0.5 text-[10px]",
  md: "min-w-6 px-1.5 py-0.5 text-[11px]",
  lg: "min-w-7 px-2 py-0.5 text-xs",
  xl: "min-w-8 px-2 py-1 text-xs",
};

export function StudentAvatar({
  student,
  size = "md",
  showNumber = false,
  className = "",
}: {
  student: StudentAvatarStudent;
  size?: keyof typeof sizeClasses;
  showNumber?: boolean;
  className?: string;
}) {
  const displayName = student.studentName ?? `${student.firstName ?? ""} ${student.lastName ?? ""}`.trim();
  const initial = student.nickname?.slice(0, 1) ?? displayName.slice(0, 1) ?? "?";

  return (
    <span className={`relative inline-grid shrink-0 ${className}`}>
      <span
        role={student.avatarUrl ? "img" : undefined}
        aria-label={student.avatarUrl ? `รูปโปรไฟล์ ${displayName}` : undefined}
        className={`grid place-items-center overflow-hidden bg-[#ffd9ae] bg-cover bg-center font-black text-[#6d472f] ring-4 ring-white ${sizeClasses[size]}`}
        style={student.avatarUrl ? { backgroundImage: `url("${student.avatarUrl}")` } : undefined}
      >
        {student.avatarUrl ? <span className="sr-only">{displayName}</span> : initial}
      </span>
      {showNumber ? (
        <span className={`absolute -bottom-1 -right-1 rounded-full bg-white text-center font-black text-violet-700 shadow-sm ring-2 ring-violet-100 ${badgeClasses[size]}`}>
          {student.numberInClass ?? "-"}
        </span>
      ) : null}
    </span>
  );
}
