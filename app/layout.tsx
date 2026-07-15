import type { Metadata, Viewport } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import { appBrand } from "@/lib/branding";
import "./globals.css";

const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  variable: "--font-noto-sans-thai",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: appBrand.fullName,
    template: `%s | ${appBrand.name}`,
  },
  description: "เว็บแอปจัดการคะแนนและภารกิจการเรียนรู้สำหรับครู",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#6956d9",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body className={`${notoSansThai.variable} antialiased`}>{children}</body>
    </html>
  );
}
