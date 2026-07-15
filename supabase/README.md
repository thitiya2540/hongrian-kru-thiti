# Supabase ของห้องเรียนครูธิติ

โฟลเดอร์นี้เก็บ migration, RLS policy, audit trigger, RPC และ Storage policy ของระบบคะแนน

## สถานะ Production

- `seed.sql` เว้นว่างโดยตั้งใจและไม่มีบัญชีหรือนักเรียนตัวอย่าง
- Migration `202607150001_production_cleanup.sql` ล้างข้อมูลตัวอย่างเดิมแบบระบุรหัส ไม่ล้างข้อมูลผู้ใช้จริงแบบกว้าง
- เก็บบัญชีใน Supabase Auth, `profiles`, `academic_terms` และการตั้งค่าระบบไว้
- ตารางรางวัลเดิมยังคงอยู่เพื่อรักษาความเข้ากันได้ของ migration แต่ UI และ flow การใช้งานไม่อ่านหรือเขียนข้อมูลเหล่านี้

## การเชื่อมโครงการ

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

ใช้ `npx supabase migration list` เพื่อตรวจว่า migration ฝั่ง Local และ Remote ตรงกัน

## หลักความปลอดภัย

- Client ใช้เฉพาะ anon/publishable key และทุกตารางข้อมูลครูถูกป้องกันด้วย RLS
- ห้ามนำ service role key ไปใส่ตัวแปรที่ขึ้นต้นด้วย `NEXT_PUBLIC_`
- schema `private` ไม่ควรถูกเพิ่มใน Exposed Schemas
- การเพิ่มหรือแก้ `student_assignment_records` จะบันทึก `activity_logs` อัตโนมัติ
- รูปนักเรียนเก็บใน bucket private `student-avatars` และเปิดผ่าน signed URL อายุสั้นเฉพาะครูที่ล็อกอิน

## Production

อย่ารัน `npx supabase db push --include-seed` กับฐานข้อมูลจริง ใช้เพียง:

```bash
npx supabase db push
```

หลัง Deploy ให้ตั้ง Site URL และ Redirect URLs ใน Supabase Authentication ให้ตรงกับโดเมน Vercel จริง
