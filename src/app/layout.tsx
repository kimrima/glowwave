import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GlowWave | 실시간 관객 참여형 스마트폰 전광판 동기화",
  description: "별도의 앱 설치 없이 QR 코드 스캔만으로 관객 스마트폰 화면 색상과 텍스트를 실시간 동기화하는 소규모 이벤트용 조명 연출 웹서비스",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GlowWave",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
