'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Sparkles, 
  Settings, 
  Layers, 
  Mail, 
  CreditCard, 
  Check, 
  ChevronRight,
  Plus,
  Trash2,
  AlertCircle,
  HelpCircle,
  Loader2
} from 'lucide-react';
import { Preset, TierType, TIER_CONFIGS, TierConfig } from '@/lib/types';

export default function HostSetup() {
  const router = useRouter();
  
  // Default presets for the buttons
  const [presets, setPresets] = useState<Preset[]>([
    { bg_color: '#EF4444', text: '열정 🔥', text_color: '#FFFFFF', effect: 'none', speed: 1000 },
    { bg_color: '#3B82F6', text: '파도 타기 🌊', text_color: '#FFFFFF', effect: 'marquee', speed: 4000 },
    { bg_color: '#EC4899', text: '소리 질러! 🎉', text_color: '#FFFFFF', effect: 'blink', speed: 600 },
    { bg_color: '#10B981', text: '싱크 클럽 ⚡', text_color: '#FFFFFF', effect: 'blink', speed: 400 },
    { bg_color: '#F59E0B', text: '박수 👏👏', text_color: '#000000', effect: 'none', speed: 1000 },
    { bg_color: '#8B5CF6', text: 'GLOW', text_color: '#FFFFFF', effect: 'none', speed: 1000 },
  ]);

  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);
  const [selectedTier, setSelectedTier] = useState<TierType>('free');
  const [hostEmail, setHostEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  
  // Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'toss' | 'stripe'>('toss');
  const [checkoutStep, setCheckoutStep] = useState<'options' | 'input' | 'done'>('options');
  const [createdRoomInfo, setCreatedRoomInfo] = useState<{ room_id: string; host_session_token: string } | null>(null);

  // Auto-fill email from localStorage if returning host
  useEffect(() => {
    const savedEmail = localStorage.getItem('glowwave_host_email');
    if (savedEmail) {
      setHostEmail(savedEmail);
    }
  }, []);

  const handleUpdatePreset = (key: keyof Preset, value: any) => {
    const updated = [...presets];
    updated[selectedPresetIndex] = {
      ...updated[selectedPresetIndex],
      [key]: value
    };
    setPresets(updated);
  };

  const handleStartSetup = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Email Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!hostEmail || !emailRegex.test(hostEmail)) {
      setEmailError('유효한 이메일 주소를 입력해 주세요.');
      return;
    }
    setEmailError('');

    // Open Checkout Dialog
    setIsCheckoutOpen(true);
    setCheckoutStep('options');
  };

  const executeCheckoutCreation = async () => {
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

      // If Free Tier, it is active immediately (no payment hook required)
      if (selectedTier === 'free') {
        // Save presets and authorization to LocalStorage
        localStorage.setItem(`glowwave_presets_${data.room_id}`, JSON.stringify(presets));
        localStorage.setItem(`glowwave_token_${data.room_id}`, data.host_session_token);
        
        // Wait briefly for style simulation and redirect
        setTimeout(() => {
          setIsProcessing(false);
          setIsCheckoutOpen(false);
          router.push(`/host/dashboard/${data.room_id}`);
        }, 1500);
      } else {
        // Go to payment inputs step for paid tiers
        setCheckoutStep('input');
        setIsProcessing(false);
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || '방 생성 중 오류가 발생했습니다.');
      setIsProcessing(false);
      setIsCheckoutOpen(false);
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

      // Save presets and authorization to LocalStorage
      localStorage.setItem(`glowwave_presets_${createdRoomInfo.room_id}`, JSON.stringify(presets));
      localStorage.setItem(`glowwave_token_${createdRoomInfo.room_id}`, createdRoomInfo.host_session_token);

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

  const colors = [
    { name: '빨강', hex: '#EF4444' },
    { name: '오렌지', hex: '#F97316' },
    { name: '노랑', hex: '#F59E0B' },
    { name: '초록', hex: '#10B981' },
    { name: '민트', hex: '#06B6D4' },
    { name: '파랑', hex: '#3B82F6' },
    { name: '남색', hex: '#6366F1' },
    { name: '보라', hex: '#8B5CF6' },
    { name: '자주', hex: '#D946EF' },
    { name: '분홍', hex: '#EC4899' },
    { name: '하양', hex: '#FFFFFF' },
    { name: '검정', hex: '#0B0B0F' },
  ];

  return (
    <div className="min-h-screen bg-[#0B0B0F] text-foreground flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#0B0B0F]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-white">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <span>GlowWave</span>
          </Link>
          <div className="text-xs text-zinc-500 font-mono">
            SETUP BUILDER v1.0
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-10 flex-1 grid lg:grid-cols-12 gap-8 w-full">
        
        {/* Left Column: Preset Setup */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="glass-effect rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-400" />
              <span>실시간 연출 프리셋 세팅</span>
            </h2>
            <p className="text-sm text-zinc-400 mb-6">현장에서 리모컨 클릭 한 번으로 관객 전체 화면을 바꿀 프리셋 6개를 세팅해 주세요.</p>

            {/* Presets Grid Selector */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedPresetIndex(idx)}
                  className={`h-16 rounded-xl border text-left p-3 relative overflow-hidden transition-all ${
                    selectedPresetIndex === idx 
                      ? 'border-white ring-2 ring-indigo-500/50 scale-[1.02]' 
                      : 'border-white/5 hover:border-white/20'
                  }`}
                  style={{ backgroundColor: p.bg_color + '15' }} // Semi-transparent button bg
                >
                  <div className="absolute top-2 left-2 w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: p.bg_color }} />
                  <div className="absolute bottom-2 left-3 text-xs font-bold truncate max-w-[85%]" style={{ color: p.text_color === '#000000' && p.bg_color === '#FFFFFF' ? '#888' : '#FFF' }}>
                    {p.text || `버튼 ${idx + 1}`}
                  </div>
                  <div className="absolute top-2 right-2 text-[9px] text-zinc-500 uppercase">
                    P{idx + 1}
                  </div>
                </button>
              ))}
            </div>

            {/* Preset Customizer Board */}
            <div className="bg-black/40 border border-white/5 rounded-xl p-5 flex flex-col gap-4">
              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <span className="text-xs font-mono text-zinc-500 uppercase">Editing Preset {selectedPresetIndex + 1}</span>
                <span className="text-xs px-2.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-semibold">
                  {presets[selectedPresetIndex].effect === 'none' ? '정적 효과' : presets[selectedPresetIndex].effect === 'blink' ? '깜빡이' : '자막 흐르기'}
                </span>
              </div>

              {/* Color Selection */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">화면 배경 색상</label>
                <div className="grid grid-cols-6 gap-2">
                  {colors.map((c) => (
                    <button
                      key={c.hex}
                      onClick={() => handleUpdatePreset('bg_color', c.hex)}
                      className={`h-9 rounded-lg border transition-all ${
                        presets[selectedPresetIndex].bg_color === c.hex 
                          ? 'border-white scale-110 shadow-lg' 
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              {/* Text Input */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">출력 문구</label>
                <input
                  type="text"
                  value={presets[selectedPresetIndex].text}
                  onChange={(e) => handleUpdatePreset('text', e.target.value)}
                  className="w-full bg-[#0B0B0F] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm font-semibold"
                  placeholder="구호를 입력하세요 (예: GOAL, 소리질러)"
                  maxLength={15}
                />
              </div>

              {/* Text Color Toggle */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">글자 색상</label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => handleUpdatePreset('text_color', '#FFFFFF')}
                      className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all ${
                        presets[selectedPresetIndex].text_color === '#FFFFFF'
                          ? 'border-white bg-white text-black'
                          : 'border-white/10 bg-transparent text-zinc-400 hover:text-white'
                      }`}
                    >
                      밝은색
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdatePreset('text_color', '#000000')}
                      className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all ${
                        presets[selectedPresetIndex].text_color === '#000000'
                          ? 'border-white bg-white text-black'
                          : 'border-white/10 bg-transparent text-zinc-400 hover:text-white'
                      }`}
                    >
                      어두운색
                    </button>
                  </div>
                </div>

                {/* Effect Select */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">모션 효과</label>
                  <div className="flex gap-2">
                    <select
                      value={presets[selectedPresetIndex].effect}
                      onChange={(e) => handleUpdatePreset('effect', e.target.value)}
                      className="w-full bg-[#0B0B0F] border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                    >
                      <option value="none">효과 없음 (정적)</option>
                      <option value="blink">전체 화면 반짝임 (Blink)</option>
                      <option value="marquee">전광판 가로 흐르기 (Marquee)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Email input & Tier Options */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <form onSubmit={handleStartSetup} className="glass-effect rounded-2xl p-6 flex flex-col gap-6">
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              <span>참여 인원 및 요금제 선택</span>
            </h2>

            {/* Email Input Step (No login logic) */}
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
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
                className="w-full bg-[#0B0B0F] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm"
              />
              {emailError ? (
                <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {emailError}
                </p>
              ) : (
                <p className="text-[11px] text-zinc-500 mt-2">비밀번호 가입 없이 이메일만으로 결제 정보를 식별하고 나중에 복구할 수 있습니다.</p>
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
                    className={`text-left p-4 rounded-xl border flex justify-between items-center transition-all ${
                      isSelected 
                        ? 'border-white bg-white/5 ring-1 ring-white/20' 
                        : 'border-white/5 bg-transparent hover:border-white/10'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-white text-sm flex items-center gap-2">
                        {cfg.name}
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />}
                      </div>
                      <div className="text-xs text-zinc-400 mt-1">최대 동시 접속 {cfg.maxParticipants}명</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black text-white">
                        {cfg.priceKrw === 0 ? '무료' : `${cfg.priceKrw.toLocaleString()}원`}
                      </div>
                      {cfg.priceKrw > 0 && (
                        <div className="text-[10px] text-zinc-500">${cfg.priceUsd} USD</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Submit btn */}
            <button
              type="submit"
              className="w-full py-4 rounded-xl bg-white text-black font-extrabold text-sm hover:bg-zinc-200 transition-all shadow-xl hover:shadow-white/5 flex items-center justify-center gap-1"
            >
              이벤트 방 개설하기 <ChevronRight className="w-4 h-4" />
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
            {checkoutStep === 'options' && (
              <div className="flex flex-col gap-6 text-center py-4">
                <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 mx-auto mb-2 animate-bounce">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">이벤트 방 생성 승인</h3>
                  <p className="text-sm text-zinc-400">
                    선택하신 <span className="text-white font-semibold">{TIER_CONFIGS[selectedTier].name}</span> 방을 생성합니다.
                  </p>
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 text-left max-w-xs mx-auto w-full text-xs flex flex-col gap-2">
                  <div className="flex justify-between"><span className="text-zinc-500">이메일:</span><span className="text-white font-mono">{hostEmail}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">인원 하드캡:</span><span className="text-white">{TIER_CONFIGS[selectedTier].maxParticipants}명</span></div>
                  <div className="flex justify-between border-t border-white/5 pt-2 mt-1"><span className="text-zinc-500 font-bold">결제 금액:</span><span className="text-white font-bold">{TIER_CONFIGS[selectedTier].priceKrw === 0 ? '무료' : `${TIER_CONFIGS[selectedTier].priceKrw.toLocaleString()}원`}</span></div>
                </div>

                <button
                  onClick={executeCheckoutCreation}
                  disabled={isProcessing}
                  className="w-full py-3.5 rounded-xl bg-white text-black font-bold hover:bg-zinc-200 transition-all text-sm flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      생성 중...
                    </>
                  ) : (
                    '방 만들기 시작'
                  )}
                </button>
              </div>
            )}

            {checkoutStep === 'input' && (
              <div className="flex flex-col gap-5">
                <div className="flex justify-between items-center pb-3 border-b border-white/10">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-indigo-400" />
                    간편 비회원 결제창
                  </h3>
                  <span className="text-xs text-zinc-500">방 번호: {createdRoomInfo?.room_id}</span>
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

                <div className="text-[10px] text-zinc-500 leading-normal flex items-start gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
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
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        결제 승인 중...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        결제하기
                      </>
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
