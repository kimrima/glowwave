'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Globe, ChevronDown, X, ArrowLeft } from 'lucide-react';
import { Preset, TierType, TIER_CONFIGS, getLocalizedPrice, getLocalizedTierName } from '@/lib/types';
import LandscapePhoneMockup from '@/components/LandscapePhoneMockup';
import { t, Locale } from '@/lib/translations';
import { getDefaultsByLocale } from '@/lib/templates';

export default function HostSetup() {
  const router = useRouter();

  // Active Locale State
  const [activeLocale, setActiveLocale] = useState<Locale>('ko');
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  const defaultPresets = getDefaultsByLocale(activeLocale);

  const [selectedTier, setSelectedTier] = useState<TierType>('free');
  const [planType, setPlanType] = useState<'event' | 'store'>('event');
  const [hostEmail, setHostEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  
  // Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'toss' | 'stripe'>('toss');
  const [checkoutStep, setCheckoutStep] = useState<'input' | 'done'>('input');
  const [createdRoomInfo, setCreatedRoomInfo] = useState<{ room_id: string; host_session_token: string } | null>(null);

  // Import Status from Solo Signboard
  const [importStatus, setImportStatus] = useState<'free' | 'premium' | null>(null);
  const [importedPresetCount, setImportedPresetCount] = useState<number>(0);

  // 1. Initial State Hydration
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLocale = (localStorage.getItem('glowwave_host_locale') || 
                           localStorage.getItem('glowwave_home_locale') || 
                           localStorage.getItem('glowwave_local_locale')) as Locale;
      if (savedLocale && ['ko', 'en', 'ja', 'es', 'zh-TW', 'zh-HK'].includes(savedLocale)) {
        setActiveLocale(savedLocale);
      } else {
        const navLang = navigator.language.toLowerCase();
        let currentLocale: Locale = 'ko';
        if (navLang.startsWith('ko')) currentLocale = 'ko';
        else if (navLang.startsWith('ja')) currentLocale = 'ja';
        else if (navLang.startsWith('es')) currentLocale = 'es';
        else if (navLang.startsWith('zh-tw') || navLang.startsWith('zh-cn')) currentLocale = 'zh-TW';
        else if (navLang.startsWith('zh-hk')) currentLocale = 'zh-HK';
        else currentLocale = 'en';
        setActiveLocale(currentLocale);
      }
    }
  }, []);

  // Check URL parameters for preset importing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const importParam = params.get('import') as 'free' | 'premium' | null;
      const planParam = params.get('plan');

      if (planParam === 'store') {
        setPlanType('store');
        setSelectedTier('store');
      } else {
        setPlanType('event');
      }

      if (importParam) {
        setImportStatus(importParam);
        if (importParam === 'premium') {
          if (planParam === 'store') {
            setSelectedTier('store');
          } else {
            setSelectedTier('lite'); // Pre-select Lite for premium import path
          }
        } else {
          setSelectedTier('free');
        }

        // Check for staged presets
        const staged = localStorage.getItem('glowwave_temp_import_presets');
        if (staged) {
          try {
            const parsed = JSON.parse(staged);
            if (Array.isArray(parsed)) {
              setImportedPresetCount(parsed.length);
            }
          } catch (e) {}
        }
      }
    }
  }, []);

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
      const invalidEmailMsg = {
        ko: '유효한 이메일 주소를 입력해 주세요.',
        en: 'Please enter a valid email address.',
        ja: '有効なメールアドレスを入力してください。',
        es: 'Por favor, ingrese un correo electrónico válido.',
        'zh-TW': '請輸入有效的電子郵件地址。',
        'zh-HK': '請輸入有效的電子郵件地址。'
      }[activeLocale] || '유효한 이메일 주소를 입력해 주세요.';
      setEmailError(invalidEmailMsg);
      return;
    }
    setEmailError('');

    // Passcode Validation
    if (selectedTier !== 'free' && passcode && (passcode.length < 4 || passcode.length > 6)) {
      const invalidPasscodeMsg = {
        ko: '비밀번호는 4~6자리의 숫자여야 합니다.',
        en: 'Passcode must be a 4 to 6 digit number.',
        ja: 'パスコードは4〜6桁の数字である必要があります。',
        es: 'La contraseña debe ser un número de 4 a 6 dígitos.',
        'zh-TW': '密碼必須為 4 到 6 位數字。',
        'zh-HK': '密碼必須為 4 到 6 位數字。'
      }[activeLocale] || '비밀번호는 4~6자리의 숫자여야 합니다.';
      setPasscodeError(invalidPasscodeMsg);
      return;
    }
    setPasscodeError('');
    setIsProcessing(true);

    try {
      // 1. Call Create Room API
      const response = await fetch('/api/room/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: hostEmail,
          tier: selectedTier,
          passcode: selectedTier !== 'free' && passcode ? passcode : undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        const roomCreateFailedMsg = {
          ko: '방 생성 실패',
          en: 'Failed to create room',
          ja: 'ルーム作成に失敗しました',
          es: 'Error al crear la sala',
          'zh-TW': '建立房間失敗',
          'zh-HK': '建立房間失敗'
        }[activeLocale] || '방 생성 실패';
        throw new Error(data.error || roomCreateFailedMsg);
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
      const roomCreateErr = {
        ko: '방 생성 중 오류가 발생했습니다.',
        en: 'An error occurred during room creation.',
        ja: 'ルーム作成中にエラーが発生しました。',
        es: 'Ocurrió un error al crear la sala.',
        'zh-TW': '建立房間時發生錯誤。',
        'zh-HK': '建立房間時發生錯誤。'
      }[activeLocale] || '방 생성 중 오류가 발생했습니다.';
      alert(err.message || roomCreateErr);
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
        const webhookFailedMsg = {
          ko: '결제 웹훅 통신 실패',
          en: 'Payment webhook communication failed',
          ja: '決済ウェブフック通信に失敗しました',
          es: 'Fallo en la comunicación del webhook de pago',
          'zh-TW': '付款回呼通訊失敗',
          'zh-HK': '付款回呼通訊失敗'
        }[activeLocale] || '결제 웹훅 통신 실패';
        throw new Error(data.error || webhookFailedMsg);
      }

      // Check for staged presets from 1-person dashboard import path
      const staged = localStorage.getItem('glowwave_temp_import_presets');
      let presetsToSave = defaultPresets;
      if (staged) {
        try {
          const parsed = JSON.parse(staged);
          if (Array.isArray(parsed) && parsed.length > 0) {
            presetsToSave = parsed;
          }
        } catch (e) {}
      }

      // Save default or imported presets and authorization to LocalStorage
      localStorage.setItem(`glowwave_presets_${createdRoomInfo.room_id}`, JSON.stringify(presetsToSave));
      localStorage.setItem(`glowwave_token_${createdRoomInfo.room_id}`, createdRoomInfo.host_session_token);
      localStorage.setItem('glowwave_active_host_room_id', createdRoomInfo.room_id);

      // If imported from 1-person sync dashboard, configure local sync settings and return back to /local
      if (importStatus) {
        localStorage.setItem('glowwave_local_sync_room_id', createdRoomInfo.room_id);
        localStorage.setItem('glowwave_local_sync_host_token', createdRoomInfo.host_session_token);
        localStorage.setItem('glowwave_local_sync_room_created_at', new Date().toISOString());

        // Broadcast current active local preset if exists
        const activeLocalPreset = localStorage.getItem('glowwave_local_active_preset');
        if (activeLocalPreset) {
          try {
            const parsedActive = JSON.parse(activeLocalPreset);
            await fetch(`/api/room/${createdRoomInfo.room_id}/broadcast`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                host_session_token: createdRoomInfo.host_session_token,
                preset: parsedActive
              })
            });
          } catch (e) {}
        }

        setTimeout(() => {
          setIsProcessing(false);
          setIsCheckoutOpen(false);
          router.push('/local');
        }, 1500);
      } else {
        setTimeout(() => {
          setIsProcessing(false);
          setIsCheckoutOpen(false);
          router.push(`/host/dashboard/${createdRoomInfo.room_id}`);
        }, 1500);
      }
    } catch (err: any) {
      console.error(err);
      const paymentErr = {
        ko: '결제 처리 중 오류가 발생했습니다.',
        en: 'An error occurred during payment processing.',
        ja: '決済処理中にエラーが発生しました。',
        es: 'Ocurrió un error al procesar el pago.',
        'zh-TW': '付款處理時發生錯誤。',
        'zh-HK': '付款處理時發生錯誤。'
      }[activeLocale] || '결제 처리 중 오류가 발생했습니다.';
      alert(err.message || paymentErr);
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030305] text-foreground flex flex-col justify-between bg-grid-pattern relative overflow-hidden">
      {/* Background Neon Aura Spheres */}
      <div className="absolute top-[10%] left-[-10%] neon-glow-circle-1 opacity-40" />
      <div className="absolute bottom-[10%] right-[-10%] neon-glow-circle-2 opacity-30" />

      {/* Header */}
      <header className="border-b border-white/5 bg-[#030305]/60 backdrop-blur-md relative z-50 pt-[calc(env(safe-area-inset-top,0px)+12px)]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="text-zinc-400 hover:text-white transition-all text-xs font-extrabold flex items-center gap-1.5 cursor-pointer select-none bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 shadow-sm"
            >
              {
                {
                  ko: '← 뒤로가기',
                  en: '← Back',
                  ja: '← 戻る',
                  es: '← Volver',
                  'zh-TW': '← 返回',
                  'zh-HK': '← 返回',
                }[activeLocale] || '← 뒤로가기'
              }
            </Link>
            <Link href="/" className="flex items-center gap-2 font-black text-xl tracking-tight text-white font-outfit">
              <span>GlowWave</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-zinc-300 hover:text-white text-xs font-bold transition-all cursor-pointer select-none"
              >
                <Globe className="w-3.5 h-3.5" />
                <span className="uppercase">{activeLocale}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isLangDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40 bg-transparent" 
                    onClick={() => setIsLangDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-1.5 w-28 bg-[#0F0F15]/95 border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    {[
                      { val: 'ko', label: '한국어' },
                      { val: 'en', label: 'English' },
                      { val: 'ja', label: '日本語' },
                      { val: 'es', label: 'Español' },
                      { val: 'zh-TW', label: '繁體中文' },
                      { val: 'zh-HK', label: '繁體中文 (HK)' }
                    ].map((loc) => (
                      <button
                        key={loc.val}
                        type="button"
                        onClick={() => {
                          setActiveLocale(loc.val as Locale);
                          localStorage.setItem('glowwave_host_locale', loc.val);
                          localStorage.setItem('glowwave_home_locale', loc.val);
                          localStorage.setItem('glowwave_local_locale', loc.val);
                          setIsLangDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs font-bold transition-colors ${
                          activeLocale === loc.val 
                            ? 'bg-white/10 text-white font-extrabold' 
                            : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {loc.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="text-[10px] text-zinc-500 font-black font-mono tracking-widest animate-pulse hidden sm:block">
              SETUP BUILDER v1.2
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-10 flex-1 grid lg:grid-cols-12 gap-12 w-full items-center relative z-10">
        
        {/* Left Column: Welcome & Showcase */}
        <div className="lg:col-span-6 flex flex-col gap-8 pr-0 lg:pr-8 py-4">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
              <span>{t('setup_badge', activeLocale)}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight tracking-tight">
              {activeLocale === 'ko' ? (
                <>
                  어두운 행사장을 빛낼<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">우리만의 모바일 전광판</span>
                </>
              ) : (
                <>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">{t('setup_title', activeLocale)}</span><br />
                  <span className="text-sm text-zinc-400 font-bold">{t('setup_subtitle', activeLocale)}</span>
                </>
              )}
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed max-w-md">
              {t('setup_desc', activeLocale)}
            </p>
          </div>

          {/* Phone Mockup Showcase: Replace preview with solid indigo GLOWWAVE */}
          <div className="flex flex-col items-center lg:items-start">
            <span className="text-[10px] font-bold font-mono text-zinc-500 uppercase mb-4 tracking-wider">{t('setup_preview_label', activeLocale)}</span>
            <LandscapePhoneMockup preset={{ bg_color: '#6366F1', text: 'GLOWWAVE', text_color: '#FFFFFF', effect: 'none', speed: 1000 }} />
          </div>
        </div>

        {/* Right Column: Setup Form */}
        <div className="lg:col-span-6 flex flex-col justify-center">
          <form onSubmit={handleStartSetup} className="glass-effect rounded-2xl p-6 sm:p-8 flex flex-col gap-6 bg-[#12121a]">
            <h2 className="text-xl font-bold text-white mb-2">
              {t('setup_title', activeLocale)}
            </h2>

            {/* Dynamic Import Alert/Warning Banner */}
            {importStatus && (
              <div className={`rounded-xl p-4 border animate-in fade-in slide-in-from-top-2 duration-300 text-left font-sans ${
                selectedTier === 'free'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                  : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-200'
              }`}>
                <h4 className="text-xs font-black flex items-center gap-1.5 mb-1 text-white">
                  {selectedTier === 'free' ? (
                    <>
                      <span className="shrink-0 text-amber-400">⚠️</span>
                      <span>{t('setup_import_free_title', activeLocale)}</span>
                    </>
                  ) : (
                    <>
                      <span className="shrink-0 text-indigo-400">⚡</span>
                      <span>{t('setup_import_premium_title', activeLocale)}</span>
                    </>
                  )}
                </h4>
                <p className="text-[10px] text-zinc-400 leading-relaxed font-semibold">
                  {selectedTier === 'free' ? (
                    <span>
                      {t('setup_import_free_desc', activeLocale).replace('{cnt}', String(importedPresetCount))}
                    </span>
                  ) : (
                    <span>
                      {t('setup_import_premium_desc', activeLocale).replace('{cnt}', String(importedPresetCount))}
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* Email Input Step (No login logic) */}
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                {t('setup_email_label', activeLocale)}
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
                <p className="text-[10px] text-zinc-500 mt-2 font-medium">{t('setup_email_tip', activeLocale)}</p>
              )}
            </div>

            {/* Passcode Input Field (Paid Tiers Only) */}
            {selectedTier !== 'free' && (
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 animate-in fade-in slide-in-from-top-3 duration-200">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  {t('setup_passcode_label', activeLocale)}
                </label>
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    if (val.length <= 6) {
                      setPasscode(val);
                      setPasscodeError('');
                    }
                  }}
                  placeholder={
                    {
                      ko: '예: 1234',
                      en: 'e.g. 1234',
                      ja: '例: 1234',
                      es: 'ej. 1234',
                      'zh-TW': '例如: 1234',
                      'zh-HK': '例如: 1234'
                    }[activeLocale] || '예: 1234'
                  }
                  className="w-full bg-[#0B0B0F] border border-white/10 rounded-lg px-4 py-2.5 text-white tracking-widest text-center text-sm font-black focus:outline-none focus:border-white font-mono"
                  maxLength={6}
                />
                {passcodeError ? (
                  <p className="text-xs text-red-400 mt-2">
                    {passcodeError}
                  </p>
                ) : (
                  <p className="text-[10px] text-zinc-500 mt-2 font-medium">
                    {t('setup_passcode_tip', activeLocale)}
                  </p>
                )}
              </div>
            )}

            {/* Plan Category Selector Tabs */}
            <div className="bg-black/30 border border-white/5 p-1 rounded-2xl flex gap-1.5 mt-2">
              <button
                type="button"
                onClick={() => {
                  setPlanType('event');
                  setSelectedTier('free');
                }}
                className={`flex-1 py-3 text-center rounded-xl text-xs font-black transition-all cursor-pointer select-none ${
                  planType === 'event'
                    ? 'bg-white text-black shadow-lg font-black'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5 font-bold'
                }`}
              >
                {
                  {
                    ko: '이벤트/행사용 (18h-24h)',
                    en: 'Event / Party (18h-24h)',
                    ja: 'イベント・フェス用 (18h-24h)',
                    es: 'Eventos y Fiestas (18h-24h)',
                    'zh-TW': '活動/派對用 (18h-24h)',
                    'zh-HK': '活動/派對用 (18h-24h)'
                  }[activeLocale] || '이벤트/행사용 (18h-24h)'
                }
              </button>
              <button
                type="button"
                onClick={() => {
                  setPlanType('store');
                  setSelectedTier('store');
                }}
                className={`flex-1 py-3 text-center rounded-xl text-xs font-black transition-all cursor-pointer select-none ${
                  planType === 'store'
                    ? 'bg-white text-black shadow-lg font-black'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5 font-bold'
                }`}
              >
                {
                  {
                    ko: '매장 전광판 (1년 무중단)',
                    en: 'Store Signage (1-Yr 24/7)',
                    ja: '店舗看板用 (1年常時稼働)',
                    es: 'Letrero de Tienda (1 año 24/7)',
                    'zh-TW': '店家電子看板 (1年無中斷)',
                    'zh-HK': '商戶電子看板 (1年無中斷)'
                  }[activeLocale] || '매장 전광판 (1년 무중단)'
                }
              </button>
            </div>

            {/* Tiers List */}
            <div className="flex flex-col gap-3">
              {(Object.keys(TIER_CONFIGS) as TierType[])
                .filter((tierKey) => {
                  if (planType === 'store') {
                    return tierKey === 'store' || tierKey === 'store_annual';
                  } else {
                    return tierKey === 'free' || tierKey === 'lite' || tierKey === 'pro';
                  }
                })
                .map((tierKey) => {
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
                        {getLocalizedTierName(tierKey, activeLocale)}
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />}
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-1 font-semibold">
                        {
                          {
                            ko: `최대 동시 접속 ${cfg.maxParticipants}명`,
                            en: `Max participants: ${cfg.maxParticipants}`,
                            ja: `最大接続人数: ${cfg.maxParticipants}名`,
                            es: `Capacidad máxima: ${cfg.maxParticipants} personas`,
                            'zh-TW': `最大同連線數 ${cfg.maxParticipants} 人`,
                            'zh-HK': `最大同連線數 ${cfg.maxParticipants} 人`
                          }[activeLocale] || `최대 동시 접속 ${cfg.maxParticipants}명`
                        }
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-white font-mono">
                        {getLocalizedPrice(tierKey, activeLocale)}
                      </div>
                      {cfg.priceKrw > 0 && activeLocale !== 'ko' && (
                        <div className="text-[9px] text-zinc-500 font-bold font-mono">(₩{cfg.priceKrw.toLocaleString()} KRW)</div>
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
                  {t('setup_creating', activeLocale)}
                </>
              ) : (
                t('card_host_btn', activeLocale)
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
                    {t('setup_checkout_title', activeLocale)}
                  </h3>
                  <span className="text-xs text-zinc-500 font-mono">{t('room_code', activeLocale)}: {createdRoomInfo?.room_id}</span>
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
                    {
                      {
                        ko: '토스페이 / 국내 카드',
                        en: 'Toss Pay / Domestic Card',
                        ja: 'Toss Pay / 国内カード',
                        es: 'Toss Pay / Tarjeta nacional',
                        'zh-TW': 'Toss Pay / 韓國國內卡',
                        'zh-HK': 'Toss Pay / 韓國國內卡'
                      }[activeLocale] || '토스페이 / 국내 카드'
                    }
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
                    <span>{t('setup_checkout_prod', activeLocale)}</span>
                    <span className="text-white font-semibold">GlowWave Room Ticket ({getLocalizedTierName(selectedTier, activeLocale)})</span>
                  </div>
                  <div className="text-xs text-zinc-400 flex justify-between">
                    <span>{t('setup_checkout_email', activeLocale)}</span>
                    <span className="text-white font-semibold">{hostEmail}</span>
                  </div>
                  <div className="text-xs text-zinc-400 flex justify-between border-t border-white/5 pt-3 mt-1">
                    <span>{t('setup_checkout_total', activeLocale)}</span>
                    <span className="text-indigo-400 font-extrabold text-sm">
                      {paymentMethod === 'toss' 
                        ? getLocalizedPrice(selectedTier, 'ko') 
                        : getLocalizedPrice(selectedTier, activeLocale)}
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-zinc-500 leading-normal">
                  <span>{t('setup_checkout_sim_warning', activeLocale)}</span>
                </div>

                <div className="flex gap-3 mt-2">
                  <button
                    disabled={isProcessing}
                    onClick={() => setIsCheckoutOpen(false)}
                    className="flex-1 py-3 rounded-xl bg-white/5 text-zinc-300 font-semibold hover:bg-white/10 transition-all text-xs"
                  >
                    {t('cancel', activeLocale)}
                  </button>
                  <button
                    disabled={isProcessing}
                    onClick={simulatePaymentSuccess}
                    className="flex-1 py-3 rounded-xl bg-indigo-500 text-white font-bold hover:bg-indigo-600 transition-all text-xs flex items-center justify-center gap-1.5"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                        {t('setup_checkout_processing', activeLocale)}
                      </>
                    ) : (
                      t('setup_btn_checkout', activeLocale)
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
