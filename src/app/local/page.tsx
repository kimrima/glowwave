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
  Tv, 
  Share2, 
  AlertCircle,
  Copy,
  PlusCircle,
  Volume2,
  Lock,
  Edit3,
  RefreshCw,
  Maximize2
} from 'lucide-react';
import { Preset, EffectType } from '@/lib/types';
import useFitText from '@/hooks/useFitText';
import LandscapePhoneMockup from '@/components/LandscapePhoneMockup';
import { TEMPLATE_CATEGORIES } from '@/lib/templates';

// Predefined gorgeous default presets for solo mode
const standaloneDefaults: Preset[] = [
  { bg_color: '#EF4444', text: '화이팅 🔥', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100 },
  { bg_color: '#3B82F6', text: '부드러운 깜빡이 💫', text_color: '#FFFFFF', effect: 'blink', speed: 1527, font_family: 'plump', font_size: 100 },
  { bg_color: '#FFFFFF', text: '사이키 ✨', text_color: '#EF4444', effect: 'blink', speed: 1527, bg_color_secondary: '#0B0B0F', font_family: 'sans-thick', font_size: 100 },
  { bg_color: '#064E3B', text: '영업중 OPEN ☕', text_color: '#FEF08A', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100 },
  { bg_color: '#C70125', text: '무적 LG ⚾', text_color: '#FFFFFF', effect: 'blink', speed: 1527, font_family: 'sans-thick', font_size: 100, special_effect: 'stars' },
  { bg_color: '#EC4899', text: 'HAPPY BIRTHDAY 🎂', text_color: '#FFFFFF', effect: 'blink', speed: 1527, font_family: 'plump', font_size: 100, special_effect: 'confetti' }
];

interface MiniCountdownPreviewProps {
  preset: Preset;
}

function MiniCountdownPreview({ preset }: MiniCountdownPreviewProps) {
  const [val, setVal] = useState<number | string>(preset.countdown_seconds || 10);
  
  useEffect(() => {
    const startVal = preset.countdown_seconds || 10;
    setVal(startVal);
    const timer = setInterval(() => {
      setVal((prev) => {
        if (typeof prev === 'number') {
          if (prev <= 1) {
            return preset.result_text || 'START';
          }
          return prev - 1;
        }
        return startVal;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [preset.countdown_seconds, preset.result_text]);

  return (
    <div 
      className="absolute inset-0 flex items-center justify-center font-bold text-lg font-mono opacity-60 text-white"
      style={{ 
        color: preset.text_color,
        animation: 'preset-card-pulse 1.2s ease-in-out infinite'
      }}
    >
      {val}
    </div>
  );
}

export default function StandaloneSignboard() {
  const router = useRouter();

  // Active fullscreen signboard state
  const [currentPreset, setCurrentPreset] = useState<Preset>({
    bg_color: '#EF4444',
    text: '화이팅 🔥',
    text_color: '#FFFFFF',
    effect: 'none',
    speed: 1000,
    font_family: 'sans-thick',
    font_size: 100
  });

  // Local Presets array
  const [localPresets, setLocalPresets] = useState<Preset[]>([]);
  
  // Custom Preset Customizer State
  const [customText, setCustomText] = useState('GLOW WAVE');
  const [customBgColor, setCustomBgColor] = useState('#EF4444');
  const [customBgColorSecondary, setCustomBgColorSecondary] = useState<string>('');
  const [customTextColor, setCustomTextColor] = useState('#FFFFFF');
  const [customFontSize, setCustomFontSize] = useState<number>(100);
  const [customFontFamily, setCustomFontFamily] = useState<'sans-thin' | 'sans-thick' | 'serif' | 'neon' | 'pixel' | 'plump'>('sans-thick');
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

  // Fullscreen Signboard Overlay Control
  const [isFullscreenActive, setIsFullscreenActive] = useState(false);

  // Layout presentation controls
  const [showMiniPreviews, setShowMiniPreviews] = useState(true);
  const [isTransmitterLocked, setIsTransmitterLocked] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'custom' | 'busking' | 'sports' | 'party' | 'anniversary' | 'store'>('custom');
  const [activePresetIndex, setActivePresetIndex] = useState<number | null>(null);

  // Preset Live Edit States (Drawer)
  const [editingPresetIndex, setEditingPresetIndex] = useState<number | null>(null);
  const [editingPreset, setEditingPreset] = useState<Preset | null>(null);

  // Wake Lock Ref & Warnings
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

  // 1. Initial Load of Local Presets and Active design state
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

      // Load active preset design state
      const savedActive = localStorage.getItem('glowwave_local_active_preset');
      let activePreset: Preset = presetsList[0] || standaloneDefaults[0];
      if (savedActive) {
        try {
          activePreset = JSON.parse(savedActive);
        } catch (e) {}
      }
      setCurrentPreset(activePreset);
      applyPresetToController(activePreset);

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
    if (isFullscreenActive) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isFullscreenActive) {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      releaseWakeLock();
    };
  }, [isFullscreenActive]);

  // ESC key listener to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreenActive) {
        setIsFullscreenActive(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreenActive]);

  // 3. Apply preset to controller form fields
  const applyPresetToController = (preset: Preset) => {
    setCustomText(preset.text);
    setCustomBgColor(preset.bg_color);
    setCustomBgColorSecondary(preset.bg_color_secondary || '');
    setCustomTextColor(preset.text_color || '#FFFFFF');
    setCustomFontSize(preset.font_size || 100);
    setCustomFontFamily(preset.font_family as any || 'sans-thin');
    setCustomEffect(preset.effect || 'none');
    setCustomSpeed(getSpeedFactor(preset.effect || 'none', preset.speed || 1000));
    setCustomSpecialEffect(preset.special_effect || 'none');
  };

  // Broadcast preset trigger
  const triggerPreset = (preset: Preset, index: number) => {
    setCurrentPreset(preset);
    if (index !== -1) {
      setActivePresetIndex(index);
    }
    applyPresetToController(preset);
    localStorage.setItem('glowwave_local_active_preset', JSON.stringify(preset));
  };

  // Reset entire dashboard
  const handleResetDashboard = () => {
    if (confirm('모든 커스텀 프리셋과 설정을 대시보드 초기 상태로 초기화하시겠습니까?\n이 작업은 복구할 수 없습니다.')) {
      localStorage.removeItem('glowwave_local_presets');
      localStorage.removeItem('glowwave_local_active_preset');
      
      const defaultList = [...standaloneDefaults];
      setLocalPresets(defaultList);
      setCurrentPreset(defaultList[0]);
      applyPresetToController(defaultList[0]);
      setActivePresetIndex(0);
      
      localStorage.setItem('glowwave_local_presets', JSON.stringify(defaultList));
      localStorage.setItem('glowwave_local_active_preset', JSON.stringify(defaultList[0]));
    }
  };

  // Save current controller state as local preset
  const handleSaveLocalPreset = () => {
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
    localStorage.setItem('glowwave_local_active_preset', JSON.stringify(newPreset));
    setActivePresetIndex(updated.length - 1);
  };

  // Save changes inside the edit drawer
  const handleSaveEditDrawerPreset = () => {
    if (editingPresetIndex === null || editingPreset === null) return;

    let updated = [...localPresets];
    if (editingPresetIndex < localPresets.length) {
      // Modify existing
      updated[editingPresetIndex] = editingPreset;
    } else {
      // Append new
      updated.push(editingPreset);
    }

    setLocalPresets(updated);
    localStorage.setItem('glowwave_local_presets', JSON.stringify(updated));
    setCurrentPreset(editingPreset);
    localStorage.setItem('glowwave_local_active_preset', JSON.stringify(editingPreset));
    setActivePresetIndex(editingPresetIndex < localPresets.length ? editingPresetIndex : updated.length - 1);
    setEditingPresetIndex(null);
    setEditingPreset(null);
  };

  // Delete a local preset
  const handleDeleteLocalPreset = (indexToDelete: number) => {
    if (confirm('이 프리셋을 삭제하시겠습니까?')) {
      const updated = localPresets.filter((_, idx) => idx !== indexToDelete);
      setLocalPresets(updated);
      localStorage.setItem('glowwave_local_presets', JSON.stringify(updated));
      
      // Select first preset if current is deleted
      if (updated.length > 0) {
        setCurrentPreset(updated[0]);
        applyPresetToController(updated[0]);
        localStorage.setItem('glowwave_local_active_preset', JSON.stringify(updated[0]));
        setActivePresetIndex(0);
      }
      setEditingPresetIndex(null);
      setEditingPreset(null);
    }
  };

  // Font family selector logic
  const handleFontSelect = (fontVal: 'sans-thin' | 'sans-thick' | 'serif' | 'neon' | 'pixel' | 'plump', isEdit: boolean) => {
    if (isEdit) {
      setEditingPreset(prev => ({ ...prev!, font_family: fontVal }));
    } else {
      setCustomFontFamily(fontVal);
    }
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
    <div className="min-h-screen bg-[#030305] text-foreground flex flex-col justify-between bg-grid-pattern relative overflow-hidden font-sans">
      
      {/* Background Neon Aura Spheres */}
      <div className="absolute top-[10%] left-[-10%] neon-glow-circle-1 opacity-40" />
      <div className="absolute bottom-[10%] right-[-10%] neon-glow-circle-2 opacity-30" />

      {/* Header */}
      <header className="border-b border-white/5 bg-[#030305]/60 backdrop-blur-md relative z-10 pt-[calc(env(safe-area-inset-top,0px)+12px)]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 font-black text-xl tracking-tight text-white font-outfit">
              <span>GlowWave</span>
            </Link>
            <span className="text-[10px] px-2 py-0.5 rounded bg-pink-500/10 text-pink-400 border border-pink-500/20 font-black tracking-wider uppercase font-mono">
              1인 단독 전광판
            </span>
          </div>

          <div className="flex items-center gap-3.5">
            {/* 설정 초기화 */}
            <button
              type="button"
              onClick={handleResetDashboard}
              className="flex items-center gap-1.5 bg-white/[0.02] border border-white/5 px-3 py-2 rounded-xl text-[10px] font-bold text-zinc-400 hover:text-white cursor-pointer select-none transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>설정 초기화</span>
            </button>

            {/* 멀티 싱크 연동 */}
            <button
              type="button"
              onClick={handleTriggerPreflight}
              className="flex items-center gap-1.5 bg-gradient-to-r from-pink-500 to-indigo-500 px-4 py-2 rounded-xl text-xs font-black text-white cursor-pointer shadow-lg select-none hover:opacity-95 transition-all"
            >
              <span>멀티 싱크 방으로 연동하기 ⚡</span>
            </button>
          </div>
        </div>
      </header>

      {/* Sub-header Metadata Row (Mirrors Host Dashboard) */}
      <section className="bg-black/20 border-b border-white/5 py-4 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div>
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">단독 방장 모드</span>
              <div className="flex items-center gap-2 mt-0.5">
                <h1 className="text-sm font-mono font-black text-white tracking-wider">
                  LOCAL_MODE
                </h1>
                <span className="text-[9px] px-1.5 py-0.2 rounded font-extrabold capitalize bg-pink-500/10 text-pink-400 border border-pink-500/20">
                  오프라인 무제한
                </span>
              </div>
            </div>

            <div className="hidden sm:block w-[1px] h-8 bg-white/5" />
            <div>
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">데이터 보존</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-black text-white px-2 py-0.5 rounded-md bg-[#ffffff]/[0.03] border border-white/5 font-mono">
                  로컬 스토리지
                </span>
              </div>
            </div>

            <div className="hidden sm:block w-[1px] h-8 bg-white/5" />
            <div className="flex items-center gap-3">
              <div>
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">남은 시간</span>
                <span className="text-xs sm:text-sm font-black font-mono tracking-tight block mt-1 text-emerald-400">
                  무제한 (만료 없음)
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">시스템 연결 상태</span>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>로컬 독립 실행</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid Layout (Dashboard UI) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 flex flex-col lg:grid lg:grid-cols-12 lg:items-start gap-8 w-full relative z-10">
        
        {/* Item 1: Templates (원터치 연출 보드) */}
        <div className="order-1 lg:col-span-8 flex flex-col w-full min-w-0">
          <div className="glass-effect rounded-2xl p-4 sm:p-6 bg-[#12121a]">
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-pink-400" />
                <h2 className="text-sm font-bold text-white font-outfit">원터치 연출 보드 (Quick Preset Board)</h2>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                {/* 6 Preset Miniature Previews Toggle */}
                <button
                  type="button"
                  onClick={() => setShowMiniPreviews(prev => !prev)}
                  className="flex items-center gap-1.5 bg-white/[0.02] border border-white/5 px-3 py-1.5 rounded-xl text-[10px] font-bold text-zinc-300 hover:text-white cursor-pointer select-none transition-all"
                >
                  <span>카드 미리보기</span>
                  <div className={`relative w-8 h-4.5 rounded-full transition-colors duration-200 ${showMiniPreviews ? 'bg-pink-500' : 'bg-zinc-700'}`}>
                    <div className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${showMiniPreviews ? 'translate-x-3.5' : 'translate-x-0'}`} />
                  </div>
                </button>

                {/* Safety Transmission Lock Toggle */}
                <button
                  type="button"
                  onClick={() => setIsTransmitterLocked(prev => !prev)}
                  className="flex items-center gap-1.5 bg-white/[0.02] border border-white/5 px-3 py-1.5 rounded-xl text-[10px] font-bold text-zinc-300 hover:text-white cursor-pointer select-none transition-all"
                >
                  <span>실시간 송출</span>
                  <div className={`relative w-8 h-4.5 rounded-full transition-colors duration-200 ${!isTransmitterLocked ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                    <div className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${!isTransmitterLocked ? 'translate-x-3.5' : 'translate-x-0'}`} />
                  </div>
                </button>
              </div>
            </div>

            {/* Category tabs scroll bar */}
            <div className="flex gap-2 overflow-x-auto pb-3.5 mb-4 scrollbar-none border-b border-white/5">
              <button
                type="button"
                onClick={() => setActiveCategory('custom')}
                className={`flex items-center px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap select-none border ${
                  activeCategory === 'custom'
                    ? 'bg-white text-black border-white shadow-sm'
                    : 'bg-white/[0.02] border-white/5 text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                <span>내 프리셋</span>
              </button>
              {TEMPLATE_CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap select-none border ${
                    activeCategory === cat.id
                      ? 'bg-white text-black border-white shadow-sm'
                      : 'bg-white/[0.02] border-white/5 text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {(activeCategory === 'custom' ? localPresets : (TEMPLATE_CATEGORIES.find(c => c.id === activeCategory)?.presets || [])).map((preset, index) => {
                const isActive = currentPreset.text === preset.text &&
                                 currentPreset.bg_color === preset.bg_color &&
                                 currentPreset.font_family === preset.font_family &&
                                 currentPreset.special_effect === preset.special_effect &&
                                 currentPreset.effect === preset.effect;
                return (
                  <div
                    key={index}
                    onClick={() => {
                      if (isTransmitterLocked) {
                        if (activeCategory === 'custom') {
                          setEditingPresetIndex(index);
                          setEditingPreset({ ...preset });
                        } else {
                          // Import template as editing preset
                          setEditingPresetIndex(localPresets.length);
                          setEditingPreset({ ...preset });
                        }
                      } else {
                        triggerPreset(preset, activeCategory === 'custom' ? index : -1);
                      }
                    }}
                    className={`h-24 rounded-2xl border flex items-center justify-center p-6 relative overflow-hidden transition-all duration-300 cursor-pointer active-spring-pad group`}
                    style={{
                      backgroundColor: showMiniPreviews ? preset.bg_color : '#0B0B0F',
                      color: showMiniPreviews ? preset.text_color : 'rgba(255, 255, 255, 0.75)',
                      borderColor: isActive 
                        ? (preset.bg_color === '#0B0B0F' || !showMiniPreviews ? '#FFFFFF' : preset.bg_color) 
                        : 'rgba(255, 255, 255, 0.08)',
                      boxShadow: isActive 
                        ? (preset.bg_color === '#0B0B0F' || !showMiniPreviews 
                            ? '0 0 20px rgba(255, 255, 255, 0.15)' 
                            : `0 0 28px ${preset.bg_color}88`) 
                        : undefined
                    }}
                  >
                    {/* Miniature interactive preview graphics inside card */}
                    {showMiniPreviews && (
                      <div 
                        className="absolute inset-0 z-0 pointer-events-none overflow-hidden rounded-2xl"
                        style={{ opacity: preset.effect === 'blink' ? 1.0 : (preset.bg_color === '#FFFFFF' ? 0.35 : 0.45) }}
                      >
                        {preset.effect === 'blink' && (
                          <div 
                            className="w-full h-full absolute inset-0 animate-siren" 
                            style={{
                              '--siren-color-1': preset.bg_color,
                              '--siren-color-2': preset.bg_color_secondary || '#0B0B0F',
                              '--blink-duration': `${preset.speed || 200}ms`
                            } as React.CSSProperties}
                          />
                        )}
                        {preset.effect === 'marquee' && (
                          <div className="w-full h-full flex items-center select-none text-[11px] font-black tracking-widest overflow-hidden" style={{ color: preset.text_color }}>
                            <div className="animate-marquee-seamless flex whitespace-nowrap" style={{ '--marquee-duration': `${(preset.speed || 6000) * 1.5}ms` } as any}>
                              {[...Array(8)].map((_, i) => (
                                <span key={i} style={{ paddingRight: '2rem' }}>{preset.text}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {preset.effect === 'countdown' && (
                          <MiniCountdownPreview preset={preset} />
                        )}
                      </div>
                    )}

                    {/* Left top indicator led light */}
                    <div 
                      className={`absolute top-3 left-3.5 w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                        isActive ? 'scale-110 shadow-lg animate-pulse' : 'opacity-40'
                      }`}
                      style={{ 
                        backgroundColor: showMiniPreviews ? preset.text_color : '#FFFFFF',
                        boxShadow: isActive ? '0 0 8px currentColor' : undefined 
                      }} 
                    />
                    
                    <div className="text-center relative z-10 select-none w-full px-2">
                      <div className={`text-xs sm:text-sm tracking-tight uppercase line-clamp-2 ${getFontFamilyClass(preset.font_family)}`}>
                        {preset.text}
                      </div>
                    </div>
 
                    {/* Pencil Edit Icon */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (activeCategory === 'custom') {
                          setEditingPresetIndex(index);
                          setEditingPreset({ ...preset });
                        } else {
                          // Import as new custom preset
                          setEditingPresetIndex(localPresets.length);
                          setEditingPreset({ ...preset });
                        }
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/20 text-white/50 hover:text-white hover:bg-black/50 transition-all z-20 cursor-pointer shadow-sm border border-white/5"
                      title={activeCategory === 'custom' ? "수정" : "내 프리셋으로 가져와 편집"}
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}

              {/* + Custom Preset Card Slot */}
              {activeCategory === 'custom' && (
                <div
                  onClick={() => {
                    const newPreset: Preset = {
                      bg_color: '#EF4444',
                      text: '새 연출',
                      text_color: '#FFFFFF',
                      effect: 'none',
                      speed: 1000
                    };
                    setEditingPresetIndex(localPresets.length);
                    setEditingPreset(newPreset);
                  }}
                  className="h-24 rounded-2xl border border-dashed border-white/10 hover:border-white/30 bg-transparent flex items-center justify-center p-6 transition-all hover:bg-white/[0.01] active:scale-[0.97] cursor-pointer text-zinc-500 hover:text-white"
                >
                  <div className="flex items-center gap-1.5">
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-bold">새 연출 추가</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Item 2: Custom Broadcast (즉석 라이브 메시지 전송) */}
        <div className="order-3 lg:col-span-8 flex flex-col w-full min-w-0">
          <div className="glass-effect rounded-2xl p-4 sm:p-6 bg-[#12121a]">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-zinc-400" />
                <h2 className="text-sm font-bold text-white">즉석 라이브 메시지 전송 (Custom Broadcast)</h2>
              </div>
              <span className="text-[9px] font-bold font-mono text-zinc-500">LIVE CONTROLLER</span>
            </div>
            
            <div className="flex flex-col gap-5">
              {/* Text Input & Apply Button */}
              <div className="flex gap-3 items-center">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value.slice(0, 15))}
                    placeholder="즉석 구호 입력 (예: 소리질러!)"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-white text-sm font-semibold"
                    maxLength={15}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold font-mono text-zinc-600">
                    {customText.length}/15
                  </span>
                </div>
                
                <button
                  type="button"
                  onClick={() => {
                    const isWhite = customBgColor === '#FFFFFF';
                    const calculatedSpeed = getSpeedMs(customEffect, customSpeed);
                    
                    const customPreset: Preset = {
                      bg_color: customBgColor,
                      text: customText.trim() || 'GLOW WAVE',
                      text_color: isWhite ? '#000000' : '#FFFFFF',
                      effect: customEffect,
                      speed: calculatedSpeed,
                      font_size: customFontSize,
                      font_family: customFontFamily,
                      special_effect: customSpecialEffect
                    };
                    if (customBgColorSecondary) {
                      customPreset.bg_color_secondary = customBgColorSecondary;
                    }
                    triggerPreset(customPreset, -1);
                  }}
                  className="btn-primary h-[48px] px-6 rounded-xl text-xs font-black flex items-center justify-center cursor-pointer shrink-0"
                >
                  송출하기
                </button>
              </div>

              {/* Segmented Controls Layout */}
              <div className="flex flex-col gap-6 pt-3.5 border-t border-white/5">
                {/* Row 1: Theme, Size, Font Style */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* 배경 테마 */}
                  <div className="lg:col-span-3 flex flex-col gap-1.5">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">배경 테마</span>
                    <div className="flex flex-wrap items-center gap-1.5 bg-black/45 p-1.5 rounded-xl border border-white/5 min-h-10">
                      {[
                        '#EF4444', '#3B82F6', '#10B981', '#8B5CF6', '#F97316', '#EC4899', '#FFFFFF', '#0B0B0F'
                      ].map((hex) => (
                        <button
                          key={hex}
                          type="button"
                          onClick={() => setCustomBgColor(hex)}
                          className={`w-5 h-5 rounded-full border cursor-pointer transition-all ${
                            customBgColor === hex
                              ? 'border-white scale-110 shadow-md'
                              : 'border-transparent hover:scale-105'
                          }`}
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                      
                      {/* Fully unlocked color picker */}
                      <div 
                        className="w-5 h-5 rounded-full overflow-hidden border border-white/10 hover:scale-110 transition-transform shadow-md cursor-pointer relative shrink-0" 
                        style={{ background: 'linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8b00ff)' }}
                        title="커스텀 색상 선택"
                      >
                        <input
                          type="color"
                          value={customBgColor}
                          onChange={(e) => setCustomBgColor(e.target.value)}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-150"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 글자 크기 */}
                  <div className="lg:col-span-3 flex flex-col gap-1.5">
                    <div className="flex justify-between text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                      <span>글자 크기</span>
                      <span className="text-pink-400 font-extrabold">{customFontSize}%</span>
                    </div>
                    <div className="flex items-center bg-black/45 px-3 rounded-xl border border-white/5 h-10">
                      <input
                        type="range"
                        min="30"
                        max="100"
                        value={customFontSize}
                        onChange={(e) => setCustomFontSize(parseInt(e.target.value))}
                        className="premium-slider w-full"
                      />
                    </div>
                  </div>

                  {/* 글꼴 스타일 - ALL UNLOCKED */}
                  <div className="lg:col-span-6 flex flex-col gap-1.5">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">글꼴 스타일</span>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 bg-black/45 p-1 rounded-xl border border-white/5 items-center">
                      {[
                        { val: 'sans-thin', label: '기본고딕', style: { fontFamily: "'Pretendard', -apple-system, sans-serif", fontWeight: 700 } },
                        { val: 'sans-thick', label: '꽉찬고딕', style: { fontFamily: "'GmarketSansBold', sans-serif", fontWeight: 900 } },
                        { val: 'serif', label: '나눔명조', style: { fontFamily: "'Nanum Myeongjo', serif", fontWeight: 700 } },
                        { val: 'neon', label: '스포티', style: { fontFamily: "'LeeSaManRu-Bold', sans-serif", fontWeight: 900 } },
                        { val: 'pixel', label: '레트로도트', style: { fontFamily: "'NeoDunggeunmo', sans-serif", fontWeight: 400 } },
                        { val: 'plump', label: '둥글몽글', style: { fontFamily: "'TmonMonsori', sans-serif", fontWeight: 900 } }
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => handleFontSelect(item.val as any, false)}
                          style={item.style}
                          className={`py-2.5 px-0.5 rounded-lg text-[10px] transition-all cursor-pointer ${
                            customFontFamily === item.val
                              ? 'bg-white text-black font-extrabold shadow-sm'
                              : 'text-zinc-400 hover:text-white hover:bg-white/[0.02]'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Row 2: Motion Effect, Special Effect */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-4 border-t border-white/5">
                  
                  {/* 모션 효과 */}
                  <div className="lg:col-span-4 flex flex-col gap-1.5">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">모션 효과</span>
                    <div className="grid grid-cols-3 gap-1 bg-black/45 p-1 rounded-xl border border-white/5 h-10 items-center">
                      {[
                        { val: 'none', label: '정적' },
                        { val: 'blink', label: '깜빡' },
                        { val: 'marquee', label: '흐름' }
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => setCustomEffect(item.val as any)}
                          className={`h-full rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                            customEffect === item.val
                              ? 'bg-white text-black font-extrabold shadow-sm'
                              : 'text-zinc-400 hover:text-white hover:bg-white/[0.02]'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 특수 효과 - ALL UNLOCKED */}
                  <div className="lg:col-span-8 flex flex-col gap-1.5">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">특수 효과</span>
                    <div className="grid grid-cols-4 gap-1 bg-black/45 p-1 rounded-xl border border-white/5 items-center min-h-10">
                      {[
                        { val: 'none', label: '없음' },
                        { val: 'hearts', label: '하트' },
                        { val: 'confetti', label: '꽃가루' },
                        { val: 'stars', label: '별빛' }
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => setCustomSpecialEffect(item.val as any)}
                          className={`py-2 px-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                            customSpecialEffect === item.val
                              ? 'bg-white text-black font-extrabold shadow-sm'
                              : 'text-zinc-400 hover:text-white hover:bg-white/[0.02]'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

              {/* Speed range slider */}
              {(customEffect === 'blink' || customEffect === 'marquee') && (
                <div className="pt-4 border-t border-white/5 animate-in fade-in duration-200">
                  <div className="flex justify-between text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-2.5">
                    <span>전송 애니메이션 속도 조절</span>
                    <span className="text-pink-400 font-extrabold">
                      속도: {customSpeed}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={customSpeed}
                    onChange={(e) => setCustomSpeed(parseInt(e.target.value))}
                    className="premium-slider"
                  />
                </div>
              )}

              {/* Save preset from controller to list button */}
              <div className="pt-3 border-t border-white/5 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveLocalPreset}
                  className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 active:scale-[0.98] font-bold text-xs tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>현재 설정을 내 프리셋에 추가</span>
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* Item 3: LIVE ON AIR Preview Card */}
        <div className="order-2 lg:col-span-4 flex flex-col w-full min-w-0">
          <div className="glass-effect rounded-2xl p-4 sm:p-6 flex flex-col items-center bg-[#12121a]">
            
            <div className="flex items-center gap-2 mb-2 self-start">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">LIVE ON AIR</h2>
            </div>
            
            <p className="text-[11px] text-zinc-500 mb-4 self-start">현재 전광판으로 내보낼 실시간 연출 미리보기 화면입니다.</p>
            
            <div className="w-full max-w-[420px] flex flex-col items-center">
              <div className="w-full flex justify-center py-2 border-y border-white/5 bg-black/20 rounded-xl relative group overflow-hidden">
                <LandscapePhoneMockup preset={currentPreset} />
                
                {/* Desktop Hover Overlay */}
                <button
                  type="button"
                  onClick={() => setIsFullscreenActive(true)}
                  className="hidden lg:flex absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center gap-2 text-white font-bold text-xs cursor-pointer"
                >
                  <Maximize2 className="w-5 h-5 text-pink-400" />
                  내 화면에 전체화면으로 띄우기
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsFullscreenActive(true)}
                className="mt-3 w-full py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 active:scale-[0.99] text-white font-bold text-xs tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer border border-white/10 hover:border-white/20 shadow-md"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>내 기기를 전광판으로 사용 (전체화면)</span>
              </button>
            </div>

          </div>
        </div>

        {/* Item 4: standalone guide & warning cards */}
        <div className="order-4 lg:col-span-4 flex flex-col gap-6 w-full min-w-0">
          
          {/* 로컬 저장소 유실 주의 경고창 */}
          <div className="glass-effect rounded-2xl p-4 sm:p-5 flex flex-col gap-2.5 bg-amber-500/[0.03] border border-amber-500/20 text-xs">
            <div className="font-bold text-amber-400 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>로컬 데이터 유실 주의 안내</span>
            </div>
            <p className="text-zinc-400 leading-relaxed font-medium">
              본 1인 모드의 연출 정보와 편집 데이터는 로그인 없이 브라우저 로컬 저장소(LocalStorage)에 기기 전용으로 안전하게 보존됩니다.<br />
              따라서 **웹브라우저 캐시, 사이트 데이터, 또는 쿠키를 삭제할 경우 작성하신 프리셋이 소멸될 수 있으니 각별히 주의해 주세요.**
            </p>
            <p className="text-indigo-300 font-bold border-t border-white/5 pt-2 mt-1">
              💡 중요한 프리셋들은 상단의 **[멀티 싱크 방으로 연동하기]** 기능을 통해 소실 걱정 없는 온라인 영구 서버 방으로 즉시 안전하게 백업 및 승계하실 수 있습니다.
            </p>
          </div>

          <div className="glass-effect rounded-2xl p-6 text-xs text-zinc-500 leading-normal flex flex-col gap-2 bg-[#12121a]">
            <div className="font-bold text-zinc-400 mb-1 flex items-center gap-1.5">
              <Tv className="w-3.5 h-3.5" />
              1인 모드 이용 가이드 (Standalone Guide)
            </div>
            <div>1. [내 기기를 전광판으로 사용] 버튼을 누르면 스마트폰 전체화면 전광판 송출 모드가 구동됩니다.</div>
            <div>2. 전체화면 모드에서 **화면을 더블클릭** 하거나 키보드의 **ESC 키**를 누르면 대시보드 관리창으로 돌아옵니다.</div>
            <div>3. 전체화면이 켜진 동안에는 화면이 자동으로 꺼지거나 절전모드로 들어가지 않도록 제어(W3C Wake Lock)됩니다.</div>
            <div>4. 원터치 템플릿의 문구나 설정을 수정하고 싶다면 우측 상단의 **[실시간 송출]** 토글을 끈 뒤 템플릿을 선택하거나, 각 카드 오른쪽 위의 연필 아이콘을 누르시면 됩니다.</div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-zinc-950 py-4 text-center text-[10px] text-zinc-600 font-mono">
        Solo Standalone Mode · Data saved locally under device sandbox storage.
      </footer>

      {/* Edit Preset Drawer Overlay */}
      {editingPresetIndex !== null && editingPreset !== null && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
            onClick={() => {
              setEditingPresetIndex(null);
              setEditingPreset(null);
            }}
          />

          <div className="absolute inset-y-0 right-0 max-w-md w-full bg-[#0D0D12]/95 border-l border-white/5 shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-right duration-200">
            
            {/* Header */}
            <div className="p-4.5 border-b border-white/5 flex justify-between items-center bg-black/20">
              <h3 className="text-sm font-bold text-white">
                {editingPresetIndex < localPresets.length ? 'P' + (editingPresetIndex + 1) + ' 연출 편집' : '새 프리셋 연출 설계'}
              </h3>
              <button 
                onClick={() => {
                  setEditingPresetIndex(null);
                  setEditingPreset(null);
                }}
                className="text-zinc-500 hover:text-white p-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form body */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 text-left">
              
              {/* Text Output Input */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">출력할 문구</label>
                <input
                  type="text"
                  value={editingPreset.text}
                  onChange={(e) => setEditingPreset({ ...editingPreset, text: e.target.value.slice(0, 15) })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-500 text-xs font-semibold"
                  maxLength={15}
                />
              </div>

              {/* Theme Settings Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Background color */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">배경 테마</label>
                  <div className="flex gap-2 items-center bg-black/40 border border-white/5 rounded-xl p-2 h-11.5">
                    <input
                      type="color"
                      value={editingPreset.bg_color}
                      onChange={(e) => setEditingPreset({ ...editingPreset, bg_color: e.target.value })}
                      className="w-7 h-7 rounded-lg overflow-hidden border border-white/10 cursor-pointer shrink-0"
                    />
                    <span className="text-[10px] font-mono text-zinc-400 select-all uppercase">{editingPreset.bg_color}</span>
                  </div>
                </div>

                {/* Secondary flash color */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">사이키 교대색</label>
                  <div className="flex gap-2 items-center bg-black/40 border border-white/5 rounded-xl p-2 h-11.5">
                    <input
                      type="color"
                      value={editingPreset.bg_color_secondary || '#000000'}
                      onChange={(e) => setEditingPreset({ ...editingPreset, bg_color_secondary: e.target.value })}
                      className="w-7 h-7 rounded-lg overflow-hidden border border-white/10 cursor-pointer shrink-0"
                      disabled={editingPreset.effect !== 'blink'}
                    />
                    {editingPreset.effect === 'blink' ? (
                      <button
                        type="button"
                        onClick={() => setEditingPreset({ ...editingPreset, bg_color_secondary: undefined })}
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

              {/* Text color */}
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
                      onClick={() => setEditingPreset({ ...editingPreset, text_color: tc.hex })}
                      className={`py-2 px-1 rounded-xl border text-[10px] font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        editingPreset.text_color === tc.hex
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

              {/* Font Family selection - ALL UNLOCKED */}
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
                      onClick={() => handleFontSelect(font.val as any, true)}
                      style={font.style}
                      className={`py-2 px-1 rounded-lg text-[10px] transition-all cursor-pointer ${
                        editingPreset.font_family === font.val
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
                      onClick={() => setEditingPreset({ ...editingPreset, effect: eff.val as any, speed: getSpeedMs(eff.val as any, 25) })}
                      className={`py-2 px-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        editingPreset.effect === eff.val
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
              {editingPreset.effect !== 'none' && (
                <div className="space-y-2 animate-in fade-in duration-200">
                  <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    <span>속도 조절</span>
                    <span className="text-pink-400 font-extrabold">
                      {getSpeedFactor(editingPreset.effect || 'none', editingPreset.speed || 1000)}%
                    </span>
                  </div>
                  <div className="flex items-center bg-black/40 border border-white/5 px-3 py-2 rounded-xl">
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={getSpeedFactor(editingPreset.effect || 'none', editingPreset.speed || 1000)}
                      onChange={(e) => {
                        const factor = parseInt(e.target.value);
                        const ms = getSpeedMs(editingPreset.effect || 'none', factor);
                        setEditingPreset({ ...editingPreset, speed: ms });
                      }}
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
                      onClick={() => setEditingPreset({ ...editingPreset, special_effect: se.val as any })}
                      className={`py-2 px-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        editingPreset.special_effect === se.val
                          ? 'bg-white text-black font-extrabold shadow-sm'
                          : 'text-zinc-500 hover:text-white hover:bg-white/[0.02]'
                      }`}
                    >
                      {se.label}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Footer Buttons */}
            <div className="p-4 border-t border-white/5 bg-[#0D0D12]/95 flex items-center justify-between gap-3">
              {editingPresetIndex < localPresets.length ? (
                <button
                  type="button"
                  onClick={() => handleDeleteLocalPreset(editingPresetIndex)}
                  className="py-3 px-4.5 rounded-xl border border-red-500/20 text-red-400 bg-red-500/5 hover:bg-red-500/15 cursor-pointer text-xs font-bold transition-colors"
                >
                  연출 삭제
                </button>
              ) : (
                <div />
              )}
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    // Apply temporarily without saving to list
                    setCurrentPreset(editingPreset);
                    localStorage.setItem('glowwave_local_active_preset', JSON.stringify(editingPreset));
                  }}
                  className="py-3 px-4 rounded-xl border border-white/10 bg-white/5 text-white text-xs font-bold hover:bg-white/10 cursor-pointer"
                >
                  임시 송출
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditDrawerPreset}
                  className="py-3 px-5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-black cursor-pointer shadow-lg shadow-pink-500/10"
                >
                  저장 및 적용
                </button>
              </div>
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
              <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-ping inline-block mb-2" />
              <h2 className="text-xl font-black text-white leading-tight font-outfit">멀티 싱크 방 개설 & 프리셋 연동</h2>
              <p className="text-xs text-zinc-400 mt-1.5 font-medium leading-relaxed">
                1인 전광판에서 저장한 소중한 디자인 프리셋들을 관객과 동기화할 수 있도록 방에 올릴 수 있습니다.
              </p>
            </div>

            {/* Analysis Stats Box */}
            <div className="bg-black/60 border border-white/5 rounded-2xl p-5 mb-6 text-left flex flex-col gap-3 font-semibold text-xs text-zinc-300">
              <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
                <span className="text-[10px] font-black text-zinc-500 uppercase">연동 전 검사 결과</span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-pink-500/10 text-pink-400 border border-pink-500/20">PRE-FLIGHT SYNC</span>
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
                  className="w-full py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-zinc-300 font-bold text-xs transition-all cursor-pointer text-center"
                >
                  무료 방 개설 및 필터 연동
                </button>
              </div>

              {/* Option B: Premium Synced Room */}
              <div className="rounded-2xl p-5 border border-pink-500/30 bg-pink-500/[0.03] hover:bg-pink-500/[0.06] transition-all flex flex-col justify-between text-left relative overflow-hidden group shadow-lg shadow-pink-500/5">
                <div className="absolute top-0 right-0 bg-pink-500 text-white font-black text-[7px] px-2 py-0.5 rounded-bl uppercase tracking-widest shadow">
                  RECOMMEND
                </div>
                <div>
                  <span className="text-[9px] font-mono text-pink-400 font-extrabold block tracking-wider mb-2">PREMIUM PLAN IMPORT</span>
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
                  className="w-full py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-0.5"
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
