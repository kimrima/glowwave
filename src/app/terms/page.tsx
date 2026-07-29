'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Locale, t } from '@/lib/translations';
import { ArrowLeft, Globe } from 'lucide-react';

export default function TermsPage() {
  const [activeLocale, setActiveLocale] = useState<Locale>('ko');
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLocale = (localStorage.getItem('glowwave_home_locale') || 
                           localStorage.getItem('glowwave_host_locale') || 
                           localStorage.getItem('glowwave_local_locale')) as Locale;
      if (savedLocale && ['ko', 'en', 'ja', 'es', 'zh-TW', 'zh-HK'].includes(savedLocale)) {
        setActiveLocale(savedLocale);
      }
    }
  }, []);

  const handleLocaleChange = (newLocale: Locale) => {
    setActiveLocale(newLocale);
    localStorage.setItem('glowwave_home_locale', newLocale);
  };

  const content = {
    ko: {
      title: '서비스 이용약관',
      subtitle: 'GlowWave 서비스 이용에 대한 규칙과 안내입니다.',
      updated: '최종 수정일: 2026년 7월 30일',
      sections: [
        {
          title: '제 1 조 (목적)',
          body: '본 약관은 Anti-gravity(이하 "회사")가 제공하는 실시간 스마트폰 전광판 동기화 서비스 "GlowWave"(이하 "서비스")의 이용 조건 및 절차, 회사와 회원 간의 권리, 의무 및 책임 사항을 규정함을 목적으로 합니다.'
        },
        {
          title: '제 2 조 (용어의 정의)',
          body: '"서비스"란 별도의 앱 설치 없이 QR 코드나 방 번호를 통해 여러 사용자의 모바일 기기 화면 조명을 실시간 동기화 제어하는 웹 어플리케이션을 의미합니다. "호스트"란 방을 개설하여 제어 권한을 행사하는 사용자를 의미하며, "관객"이란 호스트가 생성한 방에 참여하여 화면 제어를 수신하는 사용자를 의미합니다.'
        },
        {
          title: '제 3 조 (요금제 및 결제)',
          body: '회사는 무료 플랜 및 인원/기간에 따른 유료 플랜(Standard, Pro, Max 등)을 제공합니다. 구매한 방의 유효기간은 요금제 스펙에 명시된 기간(예: 24시간 등)으로 제한되며, 기간 만료 시 방 정보 및 프리셋 데이터는 자동 파기됩니다.'
        },
        {
          title: '제 4 조 (이용제한 및 정지)',
          body: '회사는 사용자가 공공질서 및 미풍양속에 반하는 텍스트 입력, 음란성 글 유포, 시스템 트래픽 과부하 유발 행위 등을 할 경우, 사전 경고 없이 실시간 세션을 강제 종료하거나 IP 차단 등의 기술적 제재 조치를 취할 수 있습니다.'
        }
      ]
    },
    en: {
      title: 'Terms of Service',
      subtitle: 'Rules and guidelines for using the GlowWave service.',
      updated: 'Last Updated: July 30, 2026',
      sections: [
        {
          title: 'Section 1 (Purpose)',
          body: 'These Terms of Service govern the usage of the GlowWave real-time smartphone signboard synchronization web application provided by Anti-gravity ("Company"), defining the rights and obligations between the users and the Company.'
        },
        {
          title: 'Section 2 (Definition of Terms)',
          body: '"Service" means the web application that synchronizes and controls screen colors/texts across multiple mobile devices via QR codes or room passcodes. "Host" is a user who creates a room and exercises control. "Audience" is a participant who joins the room and receives the display signals.'
        },
        {
          title: 'Section 3 (Plans & Billing)',
          body: 'The Company offers free tiers and paid tiers (Standard, Pro, Max, etc.) based on duration and max participants. Created rooms expire and are deleted automatically after the period specified in each plan (e.g., 24 hours).'
        },
        {
          title: 'Section 4 (Restricted Activities)',
          body: 'The Company reserves the right to terminate active sessions or block IP access without prior warning if a user inputs profane, harmful, or unlawful text, or intentionally attacks the system infrastructure.'
        }
      ]
    }
  };

  const activeContent = content[activeLocale === 'ko' ? 'ko' : 'en'];

  return (
    <div className="min-h-screen bg-[#0B0B0F] text-zinc-300 selection:bg-white/20">
      
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#030305]/60 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1 text-xs font-bold text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>GlowWave Home</span>
          </Link>
          
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              className="flex items-center gap-1 bg-white/5 hover:bg-white/10 border border-white/10 px-2.5 py-1.5 rounded-xl text-xs font-bold text-white cursor-pointer select-none transition-all"
            >
              <Globe className="w-3.5 h-3.5 text-zinc-400" />
              <span className="uppercase">{activeLocale}</span>
            </button>
            {isLangDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsLangDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 w-32 rounded-2xl border border-white/10 bg-[#0c0c14]/95 backdrop-blur-lg p-1 shadow-2xl z-50">
                  {['ko', 'en'].map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => {
                        handleLocaleChange(lang as Locale);
                        setIsLangDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        activeLocale === lang ? 'bg-white text-black font-black' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {lang === 'ko' ? '한국어' : 'English'}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-3xl mx-auto px-6 py-12 md:py-16 text-left">
        <h1 className="text-3xl sm:text-4xl font-black text-white font-outfit tracking-tight mb-3">
          {activeContent.title}
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mb-8 font-medium">
          {activeContent.subtitle}
        </p>
        <div className="text-[10px] font-mono text-zinc-600 border-b border-white/5 pb-4 mb-8">
          {activeContent.updated}
        </div>

        <div className="space-y-8">
          {activeContent.sections.map((sec, idx) => (
            <section key={idx} className="space-y-3">
              <h2 className="text-base font-bold text-white tracking-wide">
                {sec.title}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-medium">
                {sec.body}
              </p>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
