'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Locale, t } from '@/lib/translations';
import { ArrowLeft, Globe } from 'lucide-react';

export default function PrivacyPage() {
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
      title: '개인정보처리방침',
      subtitle: '회원님의 소중한 개인정보를 안전하게 보호하기 위한 지침입니다.',
      updated: '최종 수정일: 2026년 7월 30일',
      sections: [
        {
          title: '1. 수집하는 개인정보 항목',
          body: '회사는 별도의 회원가입 없이 비회원으로 서비스를 즉시 이용할 수 있도록 지원합니다. 다만, 유료 방 결제 영수증 확인 및 방 정보 복구 기능 제공을 위해 고객의 [이메일 주소]를 동의하에 수집하며, 결제 처리 과정에서 PG사를 통해 결제 정보(카드 승인 내역 등)가 수집될 수 있습니다.'
        },
        {
          title: '2. 개인정보의 수집 및 이용 목적',
          body: '수집한 이메일 정보는 오직 "유실된 전광판 방의 복구 링크 전송" 및 "결제 영수증 발행/전송" 목적으로만 사용되며, 다른 어떠한 마케팅이나 제3자 제공 목적으로도 사용되지 않습니다.'
        },
        {
          title: '3. 개인정보의 보유 및 파기 기간',
          body: '사용자가 생성한 전광판 방 데이터 및 임시 정보는 요금제 스펙에 따른 세션 유효기간(예: 24시간 등)이 종료되는 즉시 안전하게 영구 파기됩니다. 복구용 이메일 및 결제 이력 정보는 세션 종료 후에도 거래 증빙을 위해 관련 법령에 의거하여 5년간 보관한 후 파기합니다.'
        },
        {
          title: '4. 정보주체의 권리',
          body: '사용자는 언제든지 본인의 이메일 및 방 정보에 대한 삭제, 열람 요청을 고객지원 메일(support@glow-wave.net)을 통해 신청할 수 있으며, 회사는 본인 확인 절차를 거친 후 지체 없이 이를 파기 및 조치합니다.'
        }
      ]
    },
    en: {
      title: 'Privacy Policy',
      subtitle: 'Guidelines for safely protecting your valuable personal information.',
      updated: 'Last Updated: July 30, 2026',
      sections: [
        {
          title: '1. Collected Personal Information',
          body: 'The Company does not require registration. However, to provide purchase recovery and receipt delivery functions, we collect your [email address] upon your consent. Billing details are processed securely via our payment gateway (PG).'
        },
        {
          title: '2. Purpose of Collection and Usage',
          body: 'The collected email address is strictly used for sending purchase recovery codes and transaction receipts. It is never used for marketing campaigns or disclosed to third parties.'
        },
        {
          title: '3. Data Retention and Destruction',
          body: 'Temporary signboard display parameters are permanently deleted immediately upon session expiration (e.g., 24 hours). Recovery emails and transaction records are retained for 5 years to comply with local financial regulations before permanent erasure.'
        },
        {
          title: '4. User Rights',
          body: 'Users can request the deletion or retrieval of their active email records at any time by contacting our support team (support@glow-wave.net).'
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
              {/* Highlight Personal Information handling strictly in Korean as per local law requirements */}
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
