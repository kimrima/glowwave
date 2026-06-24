'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  RotateCw, 
  Sliders, 
  Plus, 
  Trash2, 
  X, 
  Check, 
  HelpCircle, 
  Tv, 
  Share2, 
  AlertCircle,
  Copy,
  PlusCircle,
  Volume2,
  Lock,
  Edit3
} from 'lucide-react';
import { Preset, EffectType } from '@/lib/types';
import useFitText from '@/hooks/useFitText';

// Predefined gorgeous default presets for solo mode
const standaloneDefaults: Preset[] = [
  { bg_color: '#EF4444', text: '화이팅 🔥', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100 },
  { bg_color: '#3B82F6', text: '부드러운 깜빡이 💫', text_color: '#FFFFFF', effect: 'blink', speed: 1527, font_family: 'plump', font_size: 100 },
  { bg_color: '#FFFFFF', text: '사이키 ✨', text_color: '#EF4444', effect: 'blink', speed: 1527, bg_color_secondary: '#0B0B0F', font_family: 'sans-thick', font_size: 100 },
  { bg_color: '#064E3B', text: '영업중 OPEN ☕', text_color: '#FEF08A', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100 },
  { bg_color: '#C70125', text: '무적 LG ⚾', text_color: '#FFFFFF', effect: 'blink', speed: 1527, font_family: 'sans-thick', font_size: 100, special_effect: 'stars' },
  { bg_color: '#EC4899', text: 'HAPPY BIRTHDAY 🎂', text_color: '#FFFFFF', effect: 'blink', speed: 1527, font_family: 'plump', font_size: 100, special_effect: 'confetti' }
];

export default function StandaloneSignboard() {
  const router = useRouter();

  // Active fullscreen signboard state
  const [currentPreset, setCurrentPreset] = useState<Preset>({
    bg_color: '#0B0B0F',
    text: '터치해서 시작',
    text_color: '#FFFFFF',
    effect: 'none',
    speed: 1000,
    font_family: 'sans-thin',
    font_size: 100
  });

  // Local Presets array
  const [localPresets, setLocalPresets] = useState<Preset[]>([]);
  
  // Controls overlay drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Custom Preset Editing State (within the Drawer UI)
  const [customText, setCustomText] = useState('GLOW WAVE');
  const [customBgColor, setCustomBgColor] = useState('#EF4444');
  const [customBgColorSecondary, setCustomBgColorSecondary] = useState<string>('');
  const [customTextColor, setCustomTextColor] = useState('#FFFFFF');
  const [customFontSize, setCustomFontSize] = useState<number>(100);
  const [customFontFamily, setCustomFontFamily] = useState<'sans-thin' | 'sans-thick' | 'serif' | 'neon' | 'pixel' | 'plump'>('sans-thin');
  const [customEffect, setCustomEffect] = useState<EffectType>('none');
  const [customSpeed, setCustomSpeed] = useState(25); // 25% initial
  const [customSpecialEffect, setCustomSpecialEffect] = useState<'none' | 'hearts' | 'confetti' | 'stars'>('none');

  // Pre-flight Sync Modal State
  const [isPreflightOpen, setIsPreflightOpen] = useState(false);
  const [preflightMetrics, setPreflightMetrics] = useState({
    totalCount: 0,
    premiumCount: 0,
    overflowCount: 0
  });

  // Wake Lock Ref
  const wakeLockRef = useRef<any>(null);
  const [wakeLockSupported, setWakeLockSupported] = useState(true);
  const [orientationWarning, setOrientationWarning] = useState(false);

  // Speed Helper
  const getSpeedMs = (effect: EffectType, factor: number) => {
    if (effect === 'blink' || effect === 'luckydraw' || effect === 'luckydraw_wait') {
      return Math.round(2000 - (factor - 1) * (1950 / 99));
    }
    if (effect === 'marquee') {
      return Math.round(15000 - (factor - 1) * (14000 / 99));
    }
    return 1000;
  };

  const getSpeedFactor = (effect: EffectType, ms: number) => {
    if (effect === 'blink' || effect === 'luckydraw' || effect === 'luckydraw_wait') {
      return Math.max(1, Math.min(100, Math.round(((2000 - ms) * 99) / 1950 + 1)));
    }
    if (effect === 'marquee') {
      return Math.max(1, Math.min(100, Math.round(((15000 - ms) * 99) / 14000 + 1)));
    }
    return 25;
  };

  // Font family loader
  const getFontFamilyClass = (fontFamily?: string) => {
    switch (fontFamily) {
      case 'sans-thin':
        return 'font-sign-sans-thin font-bold';
      case 'sans-thick':
        return 'font-sign-sans-thick font-black';
      case 'serif':
        return 'font-sign-serif font-bold';
      case 'neon':
        return 'font-sign-neon font-black';
      case 'pixel':
        return 'font-sign-pixel';
      case 'plump':
        return 'font-sign-plump font-black';
      default:
        return 'font-sign-sans-thin font-bold';
    }
  };

  // 1. Initial Load of Local Presets and Auto-start
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check Wake Lock support
      if (!('wakeLock' in navigator)) {
        setWakeLockSupported(false);
      }

      // Load local presets from localStorage
      const saved = localStorage.getItem('glowwave_local_presets');
      let presetsList: Preset[] = [];
      if (saved) {
        try {
          presetsList = JSON.parse(saved);
        } catch (e) {
          presetsList = [...standaloneDefaults];
        }
      } else {
        presetsList = [...standaloneDefaults];
        localStorage.setItem('glowwave_local_presets', JSON.stringify(presetsList));
      }
      setLocalPresets(presetsList);

      if (presetsList.length > 0) {
        setCurrentPreset(presetsList[0]);
        // Set controller initial state to match first preset
        applyPresetToController(presetsList[0]);
      }

      // Detect Screen Orientation (warning if in portrait mode)
      const checkOrientation = () => {
        setOrientationWarning(window.innerHeight > window.innerWidth);
      };
      checkOrientation();
      window.addEventListener('resize', checkOrientation);
      return () => window.removeEventListener('resize', checkOrientation);
    }
  }, []);

  // 2. Request Wake Lock
  const requestWakeLock = async () => {
    if (typeof window === 'undefined' || !('wakeLock' in navigator)) return;
    try {
      if (wakeLockRef.current) return;
      wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      console.log('[Standalone] Wake Lock active.');
    } catch (err) {
      console.warn('[Standalone] Wake Lock failed:', err);
    }
  };

  // Release Wake Lock
  const releaseWakeLock = async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        console.log('[Standalone] Wake Lock released.');
      } catch (e) {}
    }
  };

  useEffect(() => {
    requestWakeLock();
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    });
    return () => {
      releaseWakeLock();
    };
  }, []);

  // 3. Apply preset to controller form fields
  const applyPresetToController = (preset: Preset) => {
    setCustomText(preset.text);
    setCustomBgColor(preset.bg_color);
    setCustomBgColorSecondary(preset.bg_color_secondary || '');
    setCustomTextColor(preset.text_color);
    setCustomFontSize(preset.font_size || 100);
    setCustomFontFamily(preset.font_family as any || 'sans-thin');
    setCustomEffect(preset.effect || 'none');
    setCustomSpeed(getSpeedFactor(preset.effect || 'none', preset.speed || 1000));
    setCustomSpecialEffect(preset.special_effect || 'none');
  };

  // Save current controller state as local preset
  const handleSaveLocalPreset = () => {
    const isWhite = customBgColor === '#FFFFFF';
    const newPreset: Preset = {
      bg_color: customBgColor,
      text: customText.trim() || 'GLOW WAVE',
      text_color: customTextColor,
      effect: customEffect,
      speed: getSpeedMs(customEffect, customSpeed),
      font_size: customFontSize,
      font_family: customFontFamily,
      special_effect: customSpecialEffect
    };
    if (customBgColorSecondary) {
      newPreset.bg_color_secondary = customBgColorSecondary;
    }

    const updated = [...localPresets, newPreset];
    setLocalPresets(updated);
    localStorage.setItem('glowwave_local_presets', JSON.stringify(updated));
    setCurrentPreset(newPreset);
  };

  // Delete a local preset
  const handleDeleteLocalPreset = (indexToDelete: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selecting
    const updated = localPresets.filter((_, idx) => idx !== indexToDelete);
    setLocalPresets(updated);
    localStorage.setItem('glowwave_local_presets', JSON.stringify(updated));
  };

  // Analyze presets and open Pre-flight wizard
  const handleTriggerPreflight = () => {
    let premiumCount = 0;
    
    localPresets.forEach(p => {
      const isPremiumFont = p.font_family === 'neon' || p.font_family === 'pixel' || p.font_family === 'plump';
      const isPremiumEffect = p.special_effect === 'hearts' || p.special_effect === 'confetti' || p.special_effect === 'stars';
      if (isPremiumFont || isPremiumEffect) {
        premiumCount++;
      }
    });

    const totalCount = localPresets.length;
    const overflowCount = Math.max(0, totalCount - 6);

    setPreflightMetrics({
      totalCount,
      premiumCount,
      overflowCount
    });

    setIsPreflightOpen(true);
  };

  // Finish pre-flight setup and redirect
  const handleStartImportRoom = (tierType: 'free' | 'premium') => {
    if (typeof window !== 'undefined') {
      // Stage current presets to temp storage for the importing wizard on dashboard page
      localStorage.setItem('glowwave_temp_import_presets', JSON.stringify(localPresets));
      
      if (tierType === 'premium') {
        router.push('/host/setup?import=premium');
      } else {
        router.push('/host/setup?import=free');
      }
    }
  };

  // Particles generator
  const particles = useMemo(() => {
    const effect = currentPreset.special_effect;
    if (!effect || effect === 'none') return [];
    
    const count = effect === 'stars' ? 35 : effect === 'confetti' ? 45 : 30;
    const list = [];
    
    for (let i = 0; i < count; i++) {
      if (effect === 'hearts') {
        list.push({
          id: i,
          left: `${Math.random() * 100}%`,
          fontSize: `${18 + Math.random() * 26}px`,
          delay: `${Math.random() * 6}s`,
          duration: `${4 + Math.random() * 5}s`,
          sway: `${2 + Math.random() * 3}s`,
          color: ['#EF4444', '#EC4899', '#F472B6', '#F43F5E', '#D946EF'][Math.floor(Math.random() * 5)]
        });
      } else if (effect === 'confetti') {
        list.push({
          id: i,
          left: `${Math.random() * 100}%`,
          fontSize: `${12 + Math.random() * 20}px`,
          delay: `${Math.random() * 5}s`,
          duration: `${3 + Math.random() * 4}s`,
          sway: `${1.5 + Math.random() * 2}s`,
          color: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#14B8A6'][Math.floor(Math.random() * 7)]
        });
      } else if (effect === 'stars') {
        list.push({
          id: i,
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          fontSize: `${4 + Math.random() * 8}px`,
          delay: `${Math.random() * 4}s`,
          duration: `${2 + Math.random() * 4}s`,
          color: ['#FFF', '#FEF08A', '#A5F3FC', '#F472B6', '#C084FC'][Math.floor(Math.random() * 5)]
        });
      }
    }
    return list;
  }, [currentPreset.special_effect, currentPreset.text]);

  const isBlink = currentPreset.effect === 'blink';
  const isDuoSiren = isBlink && !!currentPreset.bg_color_secondary;

  const { containerRef, fontSize } = useFitText(
    currentPreset.text,
    currentPreset.effect,
    currentPreset.font_size || 100
  );

  return (
    <div 
      className="fixed inset-0 z-40 overflow-hidden flex flex-col justify-center select-none"
      style={{
        backgroundColor: isDuoSiren ? undefined : currentPreset.bg_color,
        animation: isBlink && !isDuoSiren 
          ? `signboard-fade-blink ${currentPreset.speed || 1000}ms ease-in-out infinite` 
          : undefined
      }}
    >
      {/* Duo-Color Siren Flash Canvas */}
      {isDuoSiren && (
        <div 
          className="absolute inset-0 w-full h-full z-0" 
          style={{
            animation: `signboard-duo-siren ${currentPreset.speed || 300}ms steps(1, end) infinite`,
            '--siren-color-1': currentPreset.bg_color,
            '--siren-color-2': currentPreset.bg_color_secondary
          } as React.CSSProperties}
        />
      )}

      {/* Floating Canvas Special Particles Overlay */}
      {currentPreset.special_effect && currentPreset.special_effect !== 'none' && (
        <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
          {particles.map((p) => (
            <span
              key={p.id}
              className={`absolute font-extrabold select-none pointer-events-none opacity-80 ${
                currentPreset.special_effect === 'stars' 
                  ? 'animate-sparkle-stars' 
                  : currentPreset.special_effect === 'confetti'
                    ? 'animate-sway-confetti'
                    : 'animate-sway-hearts'
              }`}
              style={{
                left: p.left,
                top: p.top,
                fontSize: p.fontSize,
                animationDelay: p.delay,
                animationDuration: p.duration,
                color: p.color,
                '--sway-duration': p.sway
              } as React.CSSProperties}
            >
              {currentPreset.special_effect === 'hearts' ? '❤️' : currentPreset.special_effect === 'confetti' ? '✦' : '★'}
            </span>
          ))}
        </div>
      )}

      {/* Fullscreen Display Text Container */}
      <div 
        ref={containerRef as any}
        className="w-full h-full flex items-center justify-center relative z-20 overflow-hidden px-6"
        onClick={() => {
          // Open settings control panel drawer
          setIsDrawerOpen(true);
        }}
      >
        {currentPreset.effect === 'marquee' ? (
          <div 
            className="w-full text-center whitespace-nowrap overflow-hidden flex items-center py-[2vh]"
            style={{ 
              color: currentPreset.text_color,
              fontSize: `${fontSize}px`
            }}
          >
            <div 
              className={`inline-block animate-marquee-seamless whitespace-nowrap ${getFontFamilyClass(currentPreset.font_family)}`}
              style={{ 
                '--marquee-duration': `${currentPreset.speed || 8000}ms`
              } as React.CSSProperties}
            >
              {[...Array(6)].map((_, i) => (
                <span key={i} className="pr-[1.5em]">{currentPreset.text}</span>
              ))}
            </div>
          </div>
        ) : (
          <div 
            className={`w-full text-center leading-[1.2] whitespace-pre-wrap break-all ${getFontFamilyClass(currentPreset.font_family)}`}
            style={{ 
              color: currentPreset.text_color,
              fontSize: `${fontSize}px`
            }}
          >
            {currentPreset.text}
          </div>
        )}
      </div>

      {/* Screen Rotation Warning Guide Overlay */}
      {orientationWarning && !isDrawerOpen && (
        <div className="absolute inset-0 z-30 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center text-white pointer-events-none animate-in fade-in duration-300">
          <RotateCw className="w-12 h-12 text-indigo-400 mb-6 animate-spin" style={{ animationDuration: '3s' }} />
          <h3 className="text-lg font-black tracking-tight mb-2">스마트폰을 가로로 회전해 주세요</h3>
          <p className="text-xs text-zinc-400 max-w-[240px] leading-relaxed font-semibold">
            전광판 화면을 최대 크기로 넓게 사용하시려면 가로 모드 회전 잠금을 해제해 주세요.
          </p>
        </div>
      )}

      {/* Bottom Setup Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden select-text">
          {/* Drawer Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200" 
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Settings Control Panel Layout */}
          <div className="absolute inset-y-0 right-0 max-w-lg w-full bg-[#0D0D12]/95 border-l border-white/5 shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-right duration-250 font-sans">
            
            {/* Header */}
            <div className="p-4.5 border-b border-white/5 flex justify-between items-center bg-black/20">
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-bold font-mono tracking-widest text-indigo-400 uppercase">SOLO STANDALONE MODE</span>
                <h3 className="text-sm font-bold text-white">1인 전광판 로컬 설정보드</h3>
              </div>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="text-zinc-500 hover:text-white p-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body (Scrollable form) */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
              
              {/* Premium marketing bridge banner */}
              <div className="rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-4 border border-white/10 shadow-lg relative group">
                <div className="absolute -top-2 right-4 bg-yellow-400 text-black font-black text-[8px] px-1.5 py-0.5 rounded uppercase tracking-wider shadow">
                  Multi-Sync
                </div>
                <h4 className="text-xs font-black text-white mb-1.5 flex items-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5" />
                  <span>옆 사람과 동일하게 화면 동기화하기</span>
                </h4>
                <p className="text-[10px] text-indigo-100 font-semibold leading-relaxed mb-3.5">
                  내 주변 친구들이나 관객들과 실시간으로 LED 화면 색상을 맞추고 하나의 연출을 만들어보세요. 1인용 프리셋을 무손실로 연동 개설할 수 있습니다.
                </p>
                <button
                  type="button"
                  onClick={handleTriggerPreflight}
                  className="w-full py-2 bg-white text-black text-xs font-black rounded-lg hover:bg-zinc-200 transition-all cursor-pointer shadow-md flex items-center justify-center gap-1"
                >
                  <span>멀티 싱크 방 개설하기 ⚡</span>
                </button>
              </div>

              {/* Text Input Row */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">출력할 문구</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value.slice(0, 15))}
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 text-xs font-semibold"
                    maxLength={15}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentPreset(prev => ({
                        ...prev,
                        text: customText.trim() || 'GLOW WAVE',
                        bg_color: customBgColor,
                        bg_color_secondary: customBgColorSecondary || undefined,
                        text_color: customTextColor,
                        font_size: customFontSize,
                        font_family: customFontFamily,
                        effect: customEffect,
                        speed: getSpeedMs(customEffect, customSpeed),
                        special_effect: customSpecialEffect
                      }));
                    }}
                    className="px-4 py-3 rounded-xl bg-white text-black text-xs font-black hover:bg-zinc-200 cursor-pointer shadow-md"
                  >
                    적용
                  </button>
                </div>
              </div>

              {/* Theme Settings Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Background color picker */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">배경 테마</label>
                  <div className="flex gap-2 items-center bg-black/40 border border-white/5 rounded-xl p-2 h-11.5">
                    <input
                      type="color"
                      value={customBgColor}
                      onChange={(e) => setCustomBgColor(e.target.value)}
                      className="w-7 h-7 rounded-lg overflow-hidden border border-white/10 cursor-pointer shrink-0"
                    />
                    <span className="text-[10px] font-mono text-zinc-400 select-all uppercase">{customBgColor}</span>
                  </div>
                </div>

                {/* Secondary flash color (Psyche) */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">사이키 교대색</label>
                  <div className="flex gap-2 items-center bg-black/40 border border-white/5 rounded-xl p-2 h-11.5">
                    <input
                      type="color"
                      value={customBgColorSecondary || '#000000'}
                      onChange={(e) => setCustomBgColorSecondary(e.target.value)}
                      className="w-7 h-7 rounded-lg overflow-hidden border border-white/10 cursor-pointer shrink-0"
                      disabled={customEffect !== 'blink'}
                    />
                    {customEffect === 'blink' ? (
                      <button
                        type="button"
                        onClick={() => setCustomBgColorSecondary('')}
                        className="text-[9px] text-zinc-500 hover:text-white transition-colors"
                      >
                        사용 안함
                      </button>
                    ) : (
                      <span className="text-[9px] text-zinc-600 font-bold select-none">깜빡일 때 활성</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Text color selection */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">글자 색상</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { hex: '#FFFFFF', label: '흰색' },
                    { hex: '#FFD700', label: '노란색' },
                    { hex: '#EF4444', label: '빨간색' },
                    { hex: '#00FFCC', label: '민트색' }
                  ].map((tc) => (
                    <button
                      key={tc.hex}
                      type="button"
                      onClick={() => setCustomTextColor(tc.hex)}
                      className={`py-2 px-1 rounded-xl border text-[10px] font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        customTextColor === tc.hex
                          ? 'border-white bg-white/15 text-white shadow-sm'
                          : 'border-white/5 bg-black/20 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full border border-white/10 shrink-0" style={{ backgroundColor: tc.hex }} />
                      <span>{tc.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Family Selection */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">글꼴 디자인</label>
                <div className="grid grid-cols-3 gap-1.5 bg-black/45 p-1.5 rounded-xl border border-white/5">
                  {[
                    { val: 'sans-thin', label: '기본고딕', style: { fontFamily: "'Pretendard', sans-serif" } },
                    { val: 'sans-thick', label: '꽉찬고딕', style: { fontFamily: "'GmarketSansBold', sans-serif" } },
                    { val: 'serif', label: '나눔명조', style: { fontFamily: "'Nanum Myeongjo', serif" } },
                    { val: 'neon', label: '스포티', style: { fontFamily: "'LeeSaManRu-Bold', sans-serif" } },
                    { val: 'pixel', label: '레트로도트', style: { fontFamily: "'NeoDunggeunmo', sans-serif" } },
                    { val: 'plump', label: '둥글몽글', style: { fontFamily: "'TmonMonsori', sans-serif" } }
                  ].map((font) => (
                    <button
                      key={font.val}
                      type="button"
                      onClick={() => setCustomFontFamily(font.val as any)}
                      style={font.style}
                      className={`py-2 px-1 rounded-lg text-[10px] transition-all cursor-pointer ${
                        customFontFamily === font.val
                          ? 'bg-white text-black font-extrabold shadow-sm'
                          : 'text-zinc-500 hover:text-white hover:bg-white/[0.02]'
                      }`}
                    >
                      {font.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Motion effects */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">모션 효과</label>
                <div className="grid grid-cols-3 gap-1 bg-black/45 p-1 rounded-xl border border-white/5">
                  {[
                    { val: 'none', label: '정적 (Static)' },
                    { val: 'blink', label: '깜빡이 (Blink)' },
                    { val: 'marquee', label: '흐르기 (Scroll)' }
                  ].map((eff) => (
                    <button
                      key={eff.val}
                      type="button"
                      onClick={() => setCustomEffect(eff.val as any)}
                      className={`py-2 px-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        customEffect === eff.val
                          ? 'bg-white text-black font-extrabold shadow-sm'
                          : 'text-zinc-500 hover:text-white hover:bg-white/[0.02]'
                      }`}
                    >
                      {eff.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Speed scale */}
              {customEffect !== 'none' && (
                <div className="space-y-2 animate-in fade-in duration-200">
                  <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    <span>속도 조절</span>
                    <span className="text-indigo-400 font-extrabold">{customSpeed}%</span>
                  </div>
                  <div className="flex items-center bg-black/40 border border-white/5 px-3 py-2 rounded-xl">
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={customSpeed}
                      onChange={(e) => setCustomSpeed(parseInt(e.target.value))}
                      className="premium-slider w-full"
                    />
                  </div>
                </div>
              )}

              {/* Particle special effects */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">특수 효과</label>
                <div className="grid grid-cols-4 gap-1 bg-black/45 p-1 rounded-xl border border-white/5">
                  {[
                    { val: 'none', label: '없음' },
                    { val: 'hearts', label: '하트' },
                    { val: 'confetti', label: '꽃가루' },
                    { val: 'stars', label: '별빛' }
                  ].map((se) => (
                    <button
                      key={se.val}
                      type="button"
                      onClick={() => setCustomSpecialEffect(se.val as any)}
                      className={`py-2 px-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        customSpecialEffect === se.val
                          ? 'bg-white text-black font-extrabold shadow-sm'
                          : 'text-zinc-500 hover:text-white hover:bg-white/[0.02]'
                      }`}
                    >
                      {se.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons to test or save */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    const normalized: Preset = {
                      bg_color: customBgColor,
                      text: customText.trim() || 'GLOW WAVE',
                      text_color: customTextColor,
                      effect: customEffect,
                      speed: getSpeedMs(customEffect, customSpeed),
                      font_size: customFontSize,
                      font_family: customFontFamily,
                      special_effect: customSpecialEffect
                    };
                    if (customBgColorSecondary) {
                      normalized.bg_color_secondary = customBgColorSecondary;
                    }
                    setCurrentPreset(normalized);
                  }}
                  className="py-3.5 rounded-xl border border-white/10 bg-white/5 text-white text-xs font-bold hover:bg-white/10 cursor-pointer text-center"
                >
                  임시 송출 적용
                </button>
                <button
                  type="button"
                  onClick={handleSaveLocalPreset}
                  className="py-3.5 rounded-xl bg-indigo-600 text-white text-xs font-black hover:bg-indigo-500 cursor-pointer text-center shadow-lg shadow-indigo-500/10 flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>내 프리셋에 추가</span>
                </button>
              </div>

              {/* Saved local presets list */}
              <div className="space-y-3 pt-4 border-t border-white/5">
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">내 단독 프리셋 목록 ({localPresets.length}개)</label>
                  <span className="text-[9px] font-extrabold text-zinc-600 uppercase font-mono">UNLIMITED STORAGE</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {localPresets.map((preset, index) => {
                    return (
                      <div
                        key={index}
                        onClick={() => {
                          setCurrentPreset(preset);
                          applyPresetToController(preset);
                        }}
                        className="h-20 rounded-xl border border-white/5 hover:border-white/20 bg-black/40 flex items-center justify-between p-4 relative overflow-hidden cursor-pointer transition-all hover:scale-[1.01]"
                      >
                        <div className="text-left min-w-0 pr-4 select-none relative z-10">
                          <span className="text-[9px] text-zinc-500 font-bold block font-mono">P{index + 1}</span>
                          <span className={`text-xs font-bold text-white truncate block ${getFontFamilyClass(preset.font_family)}`}>
                            {preset.text}
                          </span>
                        </div>
                        
                        {/* Miniature preview bg color */}
                        <div 
                          className="w-4 h-4 rounded-full border border-white/10 shrink-0 shadow-inner relative z-10" 
                          style={{ backgroundColor: preset.bg_color }} 
                        />

                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={(e) => handleDeleteLocalPreset(index, e)}
                          className="absolute bottom-2 right-2 p-1 text-zinc-600 hover:text-red-400 hover:bg-white/5 rounded transition-all z-20 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/5 bg-black/40 text-center text-[10px] text-zinc-600">
              화면의 빈 영역을 탭하면 풀스크린 전광판으로 돌아갑니다.
            </div>

          </div>
        </div>
      )}

      {/* Pre-flight Sync wizard Modal */}
      {isPreflightOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/85 backdrop-blur-md transition-opacity"
            onClick={() => setIsPreflightOpen(false)}
          />

          {/* Dialog Panel */}
          <div className="bg-[#12121a] border border-white/10 rounded-3xl max-w-xl w-full p-6 sm:p-8 relative z-10 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setIsPreflightOpen(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white p-1 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping inline-block mb-2" />
              <h2 className="text-xl font-black text-white leading-tight font-outfit">멀티 싱크 방 개설 & 프리셋 연동</h2>
              <p className="text-xs text-zinc-400 mt-1.5 font-medium leading-relaxed">
                1인 전광판에서 작성한 소중한 디자인 프리셋들을 관객과 동기화할 수 있도록 방에 올릴 수 있습니다.
              </p>
            </div>

            {/* Analysis Stats Box */}
            <div className="bg-black/60 border border-white/5 rounded-2xl p-5 mb-6 text-left flex flex-col gap-3 font-semibold text-xs text-zinc-300">
              <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
                <span className="text-[10px] font-black text-zinc-500 uppercase">연동 전 검사 결과</span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">PRE-FLIGHT SYNC</span>
              </div>
              <div className="flex justify-between">
                <span>작성된 커스텀 프리셋 수:</span>
                <span className="text-white font-black">{preflightMetrics.totalCount}개</span>
              </div>
              <div className="flex justify-between">
                <span>프리미엄 효과(폰트/파티클) 사용 프리셋:</span>
                <span className="text-white font-black">{preflightMetrics.premiumCount}개</span>
              </div>
              {preflightMetrics.overflowCount > 0 && (
                <div className="flex justify-between text-amber-400">
                  <span>무료 싱크 한도 초과 프리셋:</span>
                  <span className="font-black">+{preflightMetrics.overflowCount}개</span>
                </div>
              )}
            </div>

            {/* Side-by-Side Choices */}
            <div className="grid md:grid-cols-2 gap-4">
              
              {/* Option A: Free Sync Room */}
              <div className="glass-effect rounded-2xl p-5 border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-all flex flex-col justify-between text-left relative overflow-hidden group">
                <div>
                  <span className="text-[9px] font-mono text-zinc-500 font-extrabold uppercase block tracking-wider mb-2">FREE PLAN IMPORT</span>
                  <h3 className="text-sm font-black text-white mb-2">일부 제한 연동 (무료 방)</h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed mb-4">
                    상위 6개 프리셋만 동기화하여 무료 방을 개설합니다. (유료 전용 폰트 및 파티클은 고딕/효과 없음으로 자동 변환됩니다.)
                  </p>
                  
                  <ul className="text-[9.5px] text-red-400/90 space-y-1.5 mb-6 leading-relaxed">
                    <li className="flex items-center gap-1.5">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>6개 초과 프리셋은 연동에서 제외</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>프리미엄 폰트/효과 강제 다운그레이드</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>방 유효 시간 6시간 제한 (연장 불가)</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => handleStartImportRoom('free')}
                  className="w-full py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-zinc-300 font-bold text-xs transition-all cursor-pointer"
                >
                  무료 방 개설 및 필터 연동
                </button>
              </div>

              {/* Option B: Premium Synced Room */}
              <div className="rounded-2xl p-5 border border-indigo-500/30 bg-indigo-500/[0.03] hover:bg-indigo-500/[0.06] transition-all flex flex-col justify-between text-left relative overflow-hidden group shadow-lg shadow-indigo-500/5">
                <div className="absolute top-0 right-0 bg-indigo-500 text-white font-black text-[7px] px-2 py-0.5 rounded-bl uppercase tracking-widest shadow">
                  RECOMMEND
                </div>
                <div>
                  <span className="text-[9px] font-mono text-indigo-400 font-extrabold block tracking-wider mb-2">PREMIUM PLAN IMPORT</span>
                  <h3 className="text-sm font-black text-white mb-2">무손실 100% 연동 (유료 방)</h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed mb-4">
                    내가 집에서 정성껏 디자인한 모든 프리셋과 유료 폰트, 파티클 특수효과를 단 1%의 손실도 없이 완벽하게 승계하여 개설합니다.
                  </p>
                  
                  <ul className="text-[9.5px] text-emerald-400 space-y-1.5 mb-6 leading-relaxed">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>만든 {preflightMetrics.totalCount}개 프리셋 전체 연동</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>스포티/둥글몽글 폰트 및 파티클 완벽 송출</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>방 유효 시간 24시간 제공 (언제든 연장 가능)</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => handleStartImportRoom('premium')}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 font-black text-xs transition-all cursor-pointer shadow-md flex items-center justify-center gap-0.5"
                >
                  프리미엄 무손실 연동 ⚡
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
