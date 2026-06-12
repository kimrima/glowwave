'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Preset, TierType, TIER_CONFIGS } from '@/lib/types';
import LandscapePhoneMockup from '@/components/LandscapePhoneMockup';

export default function HostSetup() {
  const router = useRouter();
  
  // Default presets: reconfigured to Ambient, Psychedelic, Police Siren, Countdown, Scroll, Lucky Draw
  const defaultPresets: Preset[] = [
    { bg_color: '#0B0B0F', text: '앰비언트', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thin', font_size: 100 },
    { bg_color: '#EF4444', text: '사이키', text_color: '#FFFFFF', effect: 'blink', speed: 200, bg_color_secondary: '#000000', font_family: 'sans-thin', font_size: 100 },
    { bg_color: '#FF0000', text: '경찰 사이렌', text_color: '#FFFFFF', effect: 'blink', speed: 150, bg_color_secondary: '#0000FF', font_family: 'sans-thin', font_size: 100 },
    { bg_color: '#8B5CF6', text: '카운트다운', text_color: '#FFFFFF', effect: 'countdown', speed: 1000, countdown_seconds: 10, result_text: 'START', font_family: 'sans-thin', font_size: 100 },
    { bg_color: '#F97316', text: '스크롤', text_color: '#FFFFFF', effect: 'marquee', speed: 3000, font_family: 'sans-thin', font_size: 100 },
    { bg_color: '#0B0B0F', text: '당첨!', text_color: '#FFD700', effect: 'luckydraw_wait', speed: 1000, bg_color_secondary: '#FFD700', result_text: '아쉽네요! 다음 기회에..', font_family: 'sans-thin', font_size: 100 },
  ];

  const [selectedTier, setSelectedTier] = useState<TierType>('free');
  const [hostEmail, setHostEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  
  // Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'toss' | 'stripe'>('toss');
  const [checkoutStep, setCheckoutStep] = useState<'input' | 'done'>('input');
  const [createdRoomInfo, setCreatedRoomInfo] = useState<{ room_id: string; host_session_token: string } | null>(null);

  // Auto-fill email from localStorage if returning host
  useEffect(() => {
    const savedEmail = localStorage.getItem('glowwave_host_email');
    if (savedEmail) {
      setHostEmail(savedEmail);
    }
  }, []);

  const handleStartSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Email Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!hostEmail || !emailRegex.test(hostEmail)) {
      setEmailError('유효한 이메일 주소를 입력해 주세요.');
      return;
    }
    setEmailError('');
    setIsProcessing(true);

    try {
      // 1. Call Create Room API
      const response = await fetch('/api/room/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: hostEmail,
          tier: selectedTier,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '방 생성 실패');
      }

      setCreatedRoomInfo({
        room_id: data.room_id,
        host_session_token: data.host_session_token,
      });

      // Save email in localStorage for future convenience
      localStorage.setItem('glowwave_host_email', hostEmail);

      // Save default presets and authorization to LocalStorage
      localStorage.setItem(`glowwave_presets_${data.room_id}`, JSON.stringify(defaultPresets));
      localStorage.setItem(`glowwave_token_${data.room_id}`, data.host_session_token);
      localStorage.setItem('glowwave_active_host_room_id', data.room_id);

      if (selectedTier === 'free') {
        // Free tier goes directly to dashboard without intermediate step
        setIsProcessing(false);
        router.push(`/host/dashboard/${data.room_id}`);
      } else {
        // Paid tier opens PG checkout input directly
        setCheckoutStep('input');
        setIsCheckoutOpen(true);
        setIsProcessing(false);
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || '방 생성 중 오류가 발생했습니다.');
      setIsProcessing(false);
    }
  };

  const simulatePaymentSuccess = async () => {
    if (!createdRoomInfo) return;
    setIsProcessing(true);
    
    try {
      // Simulate PG webhook callback to activate the room in DB
      const response = await fetch('/api/payment/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: createdRoomInfo.room_id,
          status: 'success',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '결제 웹훅 통신 실패');
      }

      // Save default presets and authorization to LocalStorage
      localStorage.setItem(`glowwave_presets_${createdRoomInfo.room_id}`, JSON.stringify(defaultPresets));
      localStorage.setItem(`glowwave_token_${createdRoomInfo.room_id}`, createdRoomInfo.host_session_token);
      localStorage.setItem('glowwave_active_host_room_id', createdRoomInfo.room_id);

      setTimeout(() => {
        setIsProcessing(false);
        setIsCheckoutOpen(false);
        router.push(`/host/dashboard/${createdRoomInfo.room_id}`);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      alert(err.message || '결제 처리 중 오류가 발생했습니다.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030305] text-foreground flex flex-col justify-between bg-grid-pattern relative overflow-hidden">
      {/* Background Neon Aura Spheres */}
      <div className="absolute top-[10%] left-[-10%] neon-glow-circle-1 opacity-40" />
      <div className="absolute bottom-[10%] right-[-10%] neon-glow-circle-2 opacity-30" />

      {/* Header */}
      <header className="border-b border-white/5 bg-[#030305]/60 backdrop-blur-md relative z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-black text-xl tracking-tight text-white font-outfit">
            <span>GlowWave</span>
          </Link>
          <div className="text-[10px] text-zinc-500 font-black font-mono tracking-widest animate-pulse">
            SETUP BUILDER v1.2
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-10 flex-1 grid lg:grid-cols-12 gap-12 w-full items-center relative z-10">
        
        {/* Left Column: Welcome & Showcase */}
        <div className="lg:col-span-6 flex flex-col gap-8 pr-0 lg:pr-8 py-4">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
              <span>비밀번호 없이 3초 만에 생성</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight tracking-tight">
              어두운 행사장을 빛낼<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">우리만의 모바일 전광판</span>
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed max-w-md">
              번거로운 가입이나 앱 다운로드 없이, 이메일 주소만으로 방을 개설할 수 있습니다. 
              생성 완료 후 호스트 리모컨 대시보드에서 마음껏 자막과 효과를 연출해 보세요!
            </p>
          </div>

          {/* Phone Mockup Showcase: Replace preview with solid indigo GLOWWAVE */}
          <div className="flex flex-col items-center lg:items-start">
            <span className="text-[10px] font-bold font-mono text-zinc-500 uppercase mb-4 tracking-wider">미리보기 (GLOWWAVE SOLID)</span>
            <LandscapePhoneMockup preset={{ bg_color: '#6366F1', text: 'GLOWWAVE', text_color: '#FFFFFF', effect: 'none', speed: 1000 }} />
          </div>
        </div>

        {/* Right Column: Setup Form */}
        <div className="lg:col-span-6 flex flex-col justify-center">
          <form onSubmit={handleStartSetup} className="glass-effect rounded-2xl p-6 sm:p-8 flex flex-col gap-6 bg-[#12121a]">
            <h2 className="text-xl font-bold text-white mb-2">
              참여 인원 및 요금제 선택
            </h2>

            {/* Email Input Step (No login logic) */}
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                이메일 주소 (비회원 영수증 및 복구용)
              </label>
              <input
                type="email"
                required
                value={hostEmail}
                onChange={(e) => {
                  setHostEmail(e.target.value);
                  setEmailError('');
                }}
                placeholder="event@glowwave.com"
                className="w-full bg-[#0B0B0F] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-white text-sm"
              />
              {emailError ? (
                <p className="text-xs text-red-400 mt-2">
                  {emailError}
                </p>
              ) : (
                <p className="text-[10px] text-zinc-500 mt-2 font-medium">이메일만으로 결제 정보를 식별하고 나중에 복구할 수 있습니다.</p>
              )}
            </div>

            {/* Tiers List */}
            <div className="flex flex-col gap-3">
              {(Object.keys(TIER_CONFIGS) as TierType[]).map((tierKey) => {
                const cfg = TIER_CONFIGS[tierKey];
                const isSelected = selectedTier === tierKey;
                return (
                  <button
                    key={tierKey}
                    type="button"
                    onClick={() => setSelectedTier(tierKey)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex justify-between items-center duration-200 ${
                      isSelected 
                        ? 'border-white bg-white/[0.04] shadow-[0_0_20px_rgba(255,255,255,0.03)]' 
                        : 'border-white/5 bg-transparent hover:border-white/10 hover:bg-white/[0.01]'
                    }`}
                  >
                    <div>
                      <div className="font-extrabold text-white text-xs flex items-center gap-2">
                        {cfg.name}
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />}
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-1 font-semibold">최대 동시 접속 {cfg.maxParticipants}명</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-white font-mono">
                        {cfg.priceKrw === 0 ? '무료' : `${cfg.priceKrw.toLocaleString()}원`}
                      </div>
                      {cfg.priceKrw > 0 && (
                        <div className="text-[9px] text-zinc-500 font-bold font-mono">${cfg.priceUsd} USD</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Submit btn */}
            <button
              type="submit"
              disabled={isProcessing}
              className="btn-primary w-full py-4 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-xl"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  생성 중...
                </>
              ) : (
                '이벤트 방 개설하기'
              )}
            </button>
          </form>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-zinc-950 py-6 text-center text-xs text-zinc-600">
        &copy; 2026 Anti-gravity. App setup is anonymous & encrypted.
      </footer>

      {/* Checkout Integration Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-sm" />
          
          <div className="glass-effect rounded-2xl w-full max-w-md p-6 relative z-10 animate-in fade-in zoom-in-95 duration-150 border border-white/10">
            {checkoutStep === 'input' && (
              <div className="flex flex-col gap-5">
                <div className="flex justify-between items-center pb-3 border-b border-white/10">
                  <h3 className="text-base font-bold text-white">
                    간편 비회원 결제창
                  </h3>
                  <span className="text-xs text-zinc-500 font-mono">방 번호: {createdRoomInfo?.room_id}</span>
                </div>

                {/* PG Method Selector */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPaymentMethod('toss')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                      paymentMethod === 'toss'
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                        : 'border-white/5 bg-white/5 text-zinc-400'
                    }`}
                  >
                    토스페이 / 국내 카드
                  </button>
                  <button
                    onClick={() => setPaymentMethod('stripe')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                      paymentMethod === 'stripe'
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                        : 'border-white/5 bg-white/5 text-zinc-400'
                    }`}
                  >
                    Stripe (Global Checkout)
                  </button>
                </div>

                {/* PG Checkout Simulator Card */}
                <div className="bg-black/50 border border-white/5 rounded-xl p-4 flex flex-col gap-3">
                  <div className="text-xs text-zinc-400 flex justify-between">
                    <span>상품명</span>
                    <span className="text-white font-semibold">GlowWave 이벤트 티켓 ({TIER_CONFIGS[selectedTier].name})</span>
                  </div>
                  <div className="text-xs text-zinc-400 flex justify-between">
                    <span>이메일</span>
                    <span className="text-white font-semibold">{hostEmail}</span>
                  </div>
                  <div className="text-xs text-zinc-400 flex justify-between border-t border-white/5 pt-3 mt-1">
                    <span>최종 결제 금액</span>
                    <span className="text-indigo-400 font-extrabold text-sm">
                      {paymentMethod === 'toss' 
                        ? `${TIER_CONFIGS[selectedTier].priceKrw.toLocaleString()}원` 
                        : `$${TIER_CONFIGS[selectedTier].priceUsd} USD`}
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-zinc-500 leading-normal">
                  <span>본 결제는 시뮬레이션입니다. 결제하기 버튼을 누르면 즉시 카드사 PG 웹훅 API를 호출하여 방장 대시보드가 활성화됩니다.</span>
                </div>

                <div className="flex gap-3 mt-2">
                  <button
                    disabled={isProcessing}
                    onClick={() => setIsCheckoutOpen(false)}
                    className="flex-1 py-3 rounded-xl bg-white/5 text-zinc-300 font-semibold hover:bg-white/10 transition-all text-xs"
                  >
                    취소
                  </button>
                  <button
                    disabled={isProcessing}
                    onClick={simulatePaymentSuccess}
                    className="flex-1 py-3 rounded-xl bg-indigo-500 text-white font-bold hover:bg-indigo-600 transition-all text-xs flex items-center justify-center gap-1.5"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                        결제 승인 중...
                      </>
                    ) : (
                      '결제하기'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
