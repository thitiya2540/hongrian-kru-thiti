export const STUDENT_CSV_HEADERS = ["รหัสนักเรียน", "เลขประจำตัว", "ชื่อ", "นามสกุล", "ชื่อเล่น", "เลขที่", "PIN"] as const;

export type StudentCsvRow = {
  rowNumber: number;
  studentCode: string;
  identityNumber: string;
  firstName: string;
  lastName: string;
  nickname: string;
  numberInClass: string;
  pin: string;
};

export type StudentCsvParseResult = {
  rows: StudentCsvRow[];
  errors: string[];
};

const MAX_IMPORT_ROWS = 200;

function parseCsvCells(source: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    const nextCharacter = source[index + 1];

    if (character === '"') {
      if (quoted && nextCharacter === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && nextCharacter === "\n") index += 1;
      row.push(cell.trim());
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }

  if (quoted) return { rows, error: "พบเครื่องหมายอัญประกาศในไฟล์ CSV ไม่ครบคู่" };
  row.push(cell.trim());
  if (row.some((value) => value.length > 0)) rows.push(row);
  return { rows, error: null };
}

export function parseStudentCsv(source: string): StudentCsvParseResult {
  const normalized = source.replace(/^\uFEFF/, "");
  const parsed = parseCsvCells(normalized);
  if (parsed.error) return { rows: [], errors: [parsed.error] };
  if (parsed.rows.length === 0) return { rows: [], errors: ["ไฟล์ CSV ว่างเปล่า"] };

  const [header, ...dataRows] = parsed.rows;
  const headerMatches = STUDENT_CSV_HEADERS.every((label, index) => header[index] === label);
  if (!headerMatches) {
    return {
      rows: [],
      errors: [`หัวตารางไม่ตรงกับไฟล์ต้นแบบ ต้องเรียงเป็น: ${STUDENT_CSV_HEADERS.join(", ")}`],
    };
  }
  if (dataRows.length === 0) return { rows: [], errors: ["ยังไม่มีรายชื่อนักเรียนในไฟล์"] };
  if (dataRows.length > MAX_IMPORT_ROWS) return { rows: [], errors: [`นำเข้าได้ครั้งละไม่เกิน ${MAX_IMPORT_ROWS} คน`] };

  const rows = dataRows.map((cells, index): StudentCsvRow => ({
    rowNumber: index + 2,
    studentCode: (cells[0] ?? "").trim(),
    identityNumber: (cells[1] ?? "").trim(),
    firstName: (cells[2] ?? "").trim(),
    lastName: (cells[3] ?? "").trim(),
    nickname: (cells[4] ?? "").trim(),
    numberInClass: (cells[5] ?? "").trim(),
    pin: (cells[6] ?? "").trim(),
  }));
  const errors: string[] = [];

  for (const row of rows) {
    if (row.studentCode.length < 2 || row.studentCode.length > 40) errors.push(`แถว ${row.rowNumber}: รหัสนักเรียนต้องมี 2-40 ตัวอักษร`);
    if (!row.firstName || row.firstName.length > 100) errors.push(`แถว ${row.rowNumber}: กรุณาระบุชื่อ`);
    if (!row.lastName || row.lastName.length > 100) errors.push(`แถว ${row.rowNumber}: กรุณาระบุนามสกุล`);
    if (row.identityNumber.length > 30) errors.push(`แถว ${row.rowNumber}: เลขประจำตัวยาวเกิน 30 ตัวอักษร`);
    if (row.nickname.length > 80) errors.push(`แถว ${row.rowNumber}: ชื่อเล่นยาวเกิน 80 ตัวอักษร`);
    if (row.numberInClass && (!/^\d+$/.test(row.numberInClass) || Number(row.numberInClass) < 1 || Number(row.numberInClass) > 999)) errors.push(`แถว ${row.rowNumber}: เลขที่ต้องเป็นจำนวนเต็มบวก`);
    if (!/^\d{4,12}$/.test(row.pin)) errors.push(`แถว ${row.rowNumber}: PIN ต้องเป็นตัวเลข 4-12 หลัก`);
  }

  return { rows, errors };
}

export function buildStudentCsvTemplate() {
  return `\uFEFF${STUDENT_CSV_HEADERS.join(",")}\r\n`;
}
