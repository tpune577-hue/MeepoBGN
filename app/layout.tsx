import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400","600","700","800","900"],
  variable: "--font-nunito",
});

export const metadata: Metadata = {
  title: "Create your Meepo — By BGN",
  description: "อัปโหลดรูปหน้า → AI สร้าง chibi Meepo sticker สำหรับติด figure",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className={`${nunito.variable} font-nunito antialiased bg-white text-bgn-ink`}>{children}</body>
    </html>
  );
}
