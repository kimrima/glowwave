import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Outfit, Plus_Jakarta_Sans, Black_Han_Sans, Orbitron, Gowun_Batang } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

const blackHanSans = Black_Han_Sans({
  variable: "--font-black-han-sans",
  weight: "400",
  subsets: ["latin"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
});

const gowunBatang = Gowun_Batang({
  variable: "--font-gowun-batang",
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GlowWave | 실시간 관객 참여형 스마트폰 전광판 동기화",
  description: "별도의 앱 설치 없이 QR 코드 스캔만으로 관객 스마트폰 화면 색상과 텍스트를 실시간 동기화하는 소규모 이벤트용 조명 연출 웹서비스",
  metadataBase: new URL("https://glow-wave.net"),
  alternates: {
    canonical: "/",
    languages: {
      "ko-KR": "/",
      "en-US": "/",
      "ja-JP": "/",
      "es-ES": "/",
      "zh-TW": "/",
      "zh-HK": "/"
    }
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://glow-wave.net",
    title: "GlowWave | 실시간 관객 참여형 스마트폰 전광판 동기화",
    description: "별도의 앱 설치 없이 QR 코드 스캔만으로 관객 스마트폰 화면 색상과 텍스트를 실시간 동기화하는 소규모 이벤트용 조명 연출 웹서비스",
    siteName: "GlowWave",
    images: [
      {
        url: "/og-banner.png",
        width: 1200,
        height: 630,
        alt: "GlowWave - Real-time crowd signboards sync"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "GlowWave | 실시간 관객 참여형 스마트폰 전광판 동기화",
    description: "별도의 앱 설치 없이 QR 코드 스캔만으로 관객 스마트폰 화면 색상과 텍스트를 실시간 동기화하는 소규모 이벤트용 조명 연출 웹서비스",
    images: ["/og-banner.png"]
  },
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
      className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} ${plusJakartaSans.variable} ${blackHanSans.variable} ${orbitron.variable} ${gowunBatang.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
