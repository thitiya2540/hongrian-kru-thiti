# ห้องเรียนครูธิติ

เว็บแอปบันทึกและตรวจสอบคะแนนนักเรียนสำหรับครูผู้ใช้งานคนเดียว พัฒนาด้วย Next.js, TypeScript, Tailwind CSS และ Supabase

## ความสามารถหลัก

- จัดการห้องเรียน รายวิชา นักเรียน และรูปโปรไฟล์นักเรียน
- สร้างงาน เลือกห้องก่อนบันทึกคะแนน และกรอกคะแนนแบบรายคนหรือหลายคน
- ติดตามงานที่ยังไม่ส่ง ต้องแก้ และรอตรวจ
- ดูรายงานรายห้อง สมุดคะแนนรวม และรายงานนักเรียนรายบุคคล
- แก้คะแนนจากหน้ารายงานโดยเชื่อมกับข้อมูลชุดเดียวกัน
- ส่งออก CSV สำรองข้อมูล และพิมพ์รายงานเป็น PDF ผ่านหน้าพิมพ์ของเบราว์เซอร์
- บันทึกประวัติการแก้ไขข้อมูลสำคัญใน Supabase

ระบบนี้เป็นระบบคะแนนสำหรับครูเท่านั้น ไม่มีระบบดาว เหรียญ หรือหน้าเข้าสู่ระบบของนักเรียน

## เริ่มพัฒนาในเครื่อง

```bash
npm install
copy .env.example .env.local
npm run dev
```

กำหนดค่าใน `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

ไม่ต้องใส่ `SUPABASE_SERVICE_ROLE_KEY` ใน Vercel เพราะแอปเวอร์ชันนี้ไม่ได้ใช้คีย์ดังกล่าว และไม่ควรเปิดเผยคีย์นี้ฝั่ง Client

## เตรียม Supabase

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

ไฟล์ `supabase/seed.sql` ถูกตั้งใจเว้นว่างสำหรับ Production ห้ามใช้ `--include-seed` กับฐานข้อมูลจริง

Migration `202607150001_production_cleanup.sql` ล้างเฉพาะข้อมูลตัวอย่างที่ใช้รหัสคงที่ของโครงการเดิม โดยเก็บบัญชีครู โปรไฟล์ และภาคเรียนไว้

## ตรวจคุณภาพก่อนขึ้นระบบ

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## ขึ้น Vercel

1. เชื่อม Repository หรือรัน `npx vercel` จากโฟลเดอร์โครงการ
2. เพิ่ม `NEXT_PUBLIC_SUPABASE_URL` และ `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` ใน Environment Variables ของ Production (ถ้าโครงการเดิมมีเฉพาะ anon key ใช้ `NEXT_PUBLIC_SUPABASE_ANON_KEY` แทนได้)
3. Deploy แล้วนำโดเมนจริงไปตั้งเป็น Site URL ใน Supabase Authentication > URL Configuration
4. เพิ่มโดเมนจริงใน Redirect URLs แล้ว Redeploy หากมีการแก้ Environment Variables
5. ทดสอบเข้าสู่ระบบ สร้างห้อง เพิ่มนักเรียน สร้างงาน บันทึกคะแนน แก้คะแนน และส่งออกรายงาน

## ลำดับเริ่มใช้งานจริง

1. ตรวจภาคเรียนที่หน้า Settings
2. สร้างห้องเรียน
3. สร้างรายวิชาและผูกกับห้อง
4. เพิ่มนักเรียนและรูปโปรไฟล์
5. สร้างงาน
6. บันทึกคะแนนและตรวจรายงาน

รายละเอียดฐานข้อมูลอยู่ที่ `supabase/README.md`
