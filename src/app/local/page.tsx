'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  X, 
  Trash2, 
  Slash, 
  Check, 
  RefreshCw, 
  Edit3 
} from 'lucide-react';
import jsQR from 'jsqr';
import { Preset, EffectType } from '@/lib/types';
import LandscapePhoneMockup from '@/components/LandscapePhoneMockup';
import { TEMPLATE_CATEGORIES } from '@/lib/templates';
import useFitText from '@/hooks/useFitText';

// Host-aligned default presets for standalone local mode
const defaults: Preset[] = [
  { bg_color: '#0B0B0F', text: '단색', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thin', font_size: 100 },
  { bg_color: '#3B82F6', text: '부드러운 깜빡이', text_color: '#FFFFFF', effect: 'blink', speed: 1000, font_family: 'sans-thin', font_size: 100 },
  { bg_color: '#FFFFFF', text: '사이키', text_color: '#EF4444', effect: 'blink', speed: 1527, bg_color_secondary: '#0B0B0F', font_family: 'sans-thin', font_size: 100 },
  { bg_color: '#0B0B0F', text: '당첨!', text_color: '#FFD700', effect: 'luckydraw_wait', speed: 1527, bg_color_secondary: '#FFD700', result_text: '아쉽네요! 다음 기회에..', font_family: 'sans-thin', font_size: 100, lucky_draw_count: 1 },
  { bg_color: '#F97316', text: '스크롤', text_color: '#FFFFFF', effect: 'marquee', speed: 11606, font_family: 'sans-thin', font_size: 100 },
  { bg_color: '#8B5CF6', text: '카운트다운', text_color: '#FFFFFF', effect: 'countdown', speed: 1000, countdown_seconds: 5, result_text: 'START', font_family: 'sans-thin', font_size: 100 },
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

function LocalSignboardFallback() {
  return (
    <div className="min-h-screen bg-[#030305] flex items-center justify-center text-white font-sans">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
        <p className="text-xs text-zinc-400 font-medium">대시보드 로딩 중...</p>
      </div>
    </div>
  );
}

export default function StandaloneSignboard() {
  return (
    <React.Suspense fallback={<LocalSignboardFallback />}>
      <LocalSignboardContent />
    </React.Suspense>
  );
}

function LocalSignboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Active signboard design state
  const [currentBroadcastPreset, setCurrentBroadcastPreset] = useState<Preset>({
    bg_color: '#0B0B0F',
    text: 'GlowWave',
    text_color: '#FFFFFF',
    effect: 'none',
    speed: 1000,
    font_family: 'sans-thin',
    font_size: 100
  });

  // Presets states
  const [presets, setPresets] = useState<Preset[]>([]);
  const [activePresetIndex, setActivePresetIndex] = useState<number | null>(0);

  // Custom live editor states
  const [customText, setCustomText] = useState('GLOW WAVE');
  const [customBgColor, setCustomBgColor] = useState('#EF4444');
  const [customFontSize, setCustomFontSize] = useState<number>(100);
  const [customFontFamily, setCustomFontFamily] = useState<'sans-thin' | 'sans-thick' | 'serif' | 'neon' | 'pixel' | 'plump'>('sans-thin');
  const [customEffect, setCustomEffect] = useState<EffectType>('none');
  const [customSpeed, setCustomSpeed] = useState(25); // Range 1 to 100
  const [customSpecialEffect, setCustomSpecialEffect] = useState<'none' | 'hearts' | 'confetti' | 'stars'>('none');

  // Control & Share Modal
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [vaultTab, setVaultTab] = useState<'slots' | 'share' | 'sync'>('slots');
  const [savedSlots, setSavedSlots] = useState<{ name: string; presets: Preset[] }[]>([]);
  const [newSlotName, setNewSlotName] = useState('');
  const [shareMode, setShareMode] = useState<'send' | 'receive'>('send');

  // QR and Code Sharing states
  const [isSharingLoading, setIsSharingLoading] = useState(false);
  const [exportCode, setExportCode] = useState('');
  const [shareQrUrl, setShareQrUrl] = useState('');
  const [shareCodeInput, setShareCodeInput] = useState('');
  const [isCodeCopied, setIsCodeCopied] = useState(false);

  // Fullscreen Signboard View
  const [isStandaloneFullscreen, setIsStandaloneFullscreen] = useState(false);

  // Active categories
  const [activeCategory, setActiveCategory] = useState<'custom' | 'busking' | 'sports' | 'party' | 'anniversary' | 'store'>('custom');

  // Preset Live Edit (Drawer)
  const [editingPresetIndex, setEditingPresetIndex] = useState<number | null>(null);
  const [editingPreset, setEditingPreset] = useState<Preset | null>(null);

  // URL import loading states
  const [isImportLoading, setIsImportLoading] = useState(false);
  const [importMessage, setImportMessage] = useState('');
  const [importError, setImportError] = useState('');

  // Camera QR scanner states & references
  const [isScanning, setIsScanning] = useState(false);
  const scannerVideoRef = useRef<HTMLVideoElement | null>(null);
  const scannerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const scannerStreamRef = useRef<MediaStream | null>(null);

  const getFontFamilyClass = (fontFamily?: string) => {
    switch (fontFamily) {
      case 'sans-thin': return 'font-sign-sans-thin font-bold';
      case 'sans-thick': return 'font-sign-sans-thick font-black';
      case 'serif': return 'font-sign-serif font-bold';
      case 'neon': return 'font-sign-neon font-black';
      case 'pixel': return 'font-sign-pixel';
      case 'plump': return 'font-sign-plump font-black';
      default: return 'font-sign-sans-thin font-bold';
    }
  };

  const getSpeedFactor = (effect: EffectType, ms: number) => {
    if (effect === 'blink' || effect === 'luckydraw' || effect === 'luckydraw_wait') {
      return Math.max(1, Math.min(100, Math.round(((2000 - ms) * 99) / 1950 + 1)));
    }
    if (effect === 'marquee') {
      return Math.max(1, Math.min(100, Math.round(((15000 - ms) * 99) / 14000 + 1)));
    }
    return 50;
  };

  const getSpeedMs = (effect: EffectType, factor: number) => {
    if (effect === 'blink' || effect === 'luckydraw' || effect === 'luckydraw_wait') {
      return Math.round(2000 - (factor - 1) * (1950 / 99));
    }
    if (effect === 'marquee') {
      return Math.round(15000 - (factor - 1) * (14000 / 99));
    }
    return 1000;
  };

  // Helper to import presets from API by key
  const handleImportByScannedKey = (key: string) => {
    setIsImportLoading(true);
    setImportError('');
    setImportMessage('공유받은 프리셋 연출 팩을 다운로드하고 있습니다...');
    const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;

    fetch(`/api/preset-share?key=${key.toUpperCase()}`)
      .then(res => {
        if (!res.ok) {
          return res.json().then(d => { throw new Error(d.error || '가져오기 실패') });
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data.presets) && data.presets.length > 0) {
          const cleanedPresets = data.presets.map((p: Preset) => {
            if (emojiRegex.test(p.text)) {
              p.text = p.text.replace(emojiRegex, '').trim();
            }
            if (typeof p.font_size === 'string' || p.font_size === undefined) {
              p.font_size = 100;
            }
            return p;
          });

          setPresets(cleanedPresets);
          localStorage.setItem('glowwave_local_presets', JSON.stringify(cleanedPresets));
          
          setCurrentBroadcastPreset(cleanedPresets[0]);
          applyPresetToController(cleanedPresets[0]);
          localStorage.setItem('glowwave_local_active_preset', JSON.stringify(cleanedPresets[0]));
          setActivePresetIndex(0);

          setImportMessage('가져오기 성공! 잠시 후 자동으로 전광판이 열립니다. 🎉');
          
          setTimeout(() => {
            setIsImportLoading(false);
            setIsStandaloneFullscreen(true);
          }, 1200);
        } else {
          throw new Error('올바르지 않은 프리셋 데이터 형식입니다.');
        }
      })
      .catch(err => {
        console.error(err);
        setImportError(err.message || '만료되었거나 올바르지 않은 공유 코드입니다.');
      });
  };

  // Camera QR code scanner mechanics
  const startScanning = async () => {
    setIsScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      scannerStreamRef.current = stream;
      if (scannerVideoRef.current) {
        scannerVideoRef.current.srcObject = stream;
        scannerVideoRef.current.setAttribute('playsinline', 'true'); // Required for iOS Safari
        scannerVideoRef.current.play();
        requestAnimationFrame(tickScanner);
      }
    } catch (err) {
      console.error('Camera access error:', err);
      alert('카메라 접근 권한이 필요합니다. 브라우저 설정에서 카메라 권한을 허용해 주세요.');
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    setIsScanning(false);
    if (scannerStreamRef.current) {
      scannerStreamRef.current.getTracks().forEach(track => track.stop());
      scannerStreamRef.current = null;
    }
    if (scannerVideoRef.current) {
      scannerVideoRef.current.srcObject = null;
    }
  };

  const tickScanner = () => {
    if (!scannerStreamRef.current) return;

    const video = scannerVideoRef.current;
    if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
      requestAnimationFrame(tickScanner);
      return;
    }

    const canvas = scannerCanvasRef.current || document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
      requestAnimationFrame(tickScanner);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert'
    });

    if (code) {
      console.log('Scanned PWA QR Code:', code.data);
      let importKey = '';
      try {
        const url = new URL(code.data);
        importKey = url.searchParams.get('import') || '';
      } catch (e) {
        const trimmed = code.data.trim().toUpperCase();
        if (trimmed.length === 6 && /^[A-Z2-9]+$/.test(trimmed)) {
          importKey = trimmed;
        }
      }

      if (importKey) {
        setIsScanning(false);
        if (scannerStreamRef.current) {
          scannerStreamRef.current.getTracks().forEach(track => track.stop());
          scannerStreamRef.current = null;
        }
        if (scannerVideoRef.current) {
          scannerVideoRef.current.srcObject = null;
        }
        handleImportByScannedKey(importKey);
      } else {
        requestAnimationFrame(tickScanner);
      }
    } else {
      requestAnimationFrame(tickScanner);
    }
  };

  useEffect(() => {
    return () => {
      if (scannerStreamRef.current) {
        scannerStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // 1. Initial State Hydration
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('glowwave_local_presets');
      let presetsList: Preset[] = [];
      if (saved) {
        try {
          presetsList = JSON.parse(saved);
        } catch (e) {
          presetsList = [...defaults];
        }
      } else {
        presetsList = [...defaults];
        localStorage.setItem('glowwave_local_presets', JSON.stringify(presetsList));
      }

      // Migrate presets
      const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
      presetsList = presetsList.map(p => {
        if (emojiRegex.test(p.text)) {
          p.text = p.text.replace(emojiRegex, '').trim();
        }
        if (typeof p.font_size === 'string' || p.font_size === undefined) {
          p.font_size = 100;
        }
        return p;
      });
      setPresets(presetsList);

      const savedActive = localStorage.getItem('glowwave_local_active_preset');
      let activePreset: Preset = presetsList[0] || defaults[0];
      if (savedActive) {
        try {
          activePreset = JSON.parse(savedActive);
        } catch (e) {}
      }
      setCurrentBroadcastPreset(activePreset);
      applyPresetToController(activePreset);

      const savedPackages = localStorage.getItem('glowwave_local_slots');
      if (savedPackages) {
        try {
          setSavedSlots(JSON.parse(savedPackages));
        } catch (e) {}
      }

      // Check import search query
      const params = new URLSearchParams(window.location.search);
      const importKey = params.get('import');
      if (importKey) {
        handleImportByScannedKey(importKey);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, []);

  const applyPresetToController = (preset: Preset) => {
    setCustomText(preset.text);
    setCustomBgColor(preset.bg_color);
    setCustomFontSize(preset.font_size || 100);
    setCustomFontFamily((preset.font_family as any) || 'sans-thin');
    setCustomEffect(preset.effect || 'none');
    setCustomSpeed(getSpeedFactor(preset.effect || 'none', preset.speed || 1000));
    setCustomSpecialEffect(preset.special_effect || 'none');
  };

  const triggerPreset = (preset: Preset, index: number) => {
    const presetWithTrigger: Preset = {
      ...preset,
      trigger_id: Date.now().toString()
    };
    setActivePresetIndex(index);
    setCurrentBroadcastPreset(presetWithTrigger);
    applyPresetToController(presetWithTrigger);
    localStorage.setItem('glowwave_local_active_preset', JSON.stringify(presetWithTrigger));
  };

  const handleDrawWinner = () => {
    const drawResultPreset: Preset = {
      ...currentBroadcastPreset,
      effect: 'luckydraw',
      lucky_draw_winner_id: 'local-winner',
      lucky_draw_winner_ids: ['local-winner'],
      trigger_id: Date.now().toString()
    };
    setCurrentBroadcastPreset(drawResultPreset);
    localStorage.setItem('glowwave_local_active_preset', JSON.stringify(drawResultPreset));
  };

  const handleResetDashboard = () => {
    if (confirm('모든 커스텀 프리셋과 슬롯을 대시보드 초기 상태로 초기화하시겠습니까?')) {
      localStorage.removeItem('glowwave_local_presets');
      localStorage.removeItem('glowwave_local_active_preset');
      
      const defaultList = [...defaults];
      setPresets(defaultList);
      setCurrentBroadcastPreset(defaultList[0]);
      applyPresetToController(defaultList[0]);
      setActivePresetIndex(0);
      
      localStorage.setItem('glowwave_local_presets', JSON.stringify(defaultList));
      localStorage.setItem('glowwave_local_active_preset', JSON.stringify(defaultList[0]));
      setIsVaultOpen(false);
    }
  };

  const handleSaveLocalPreset = () => {
    const isWhite = customBgColor === '#FFFFFF';
    const newPreset: Preset = {
      bg_color: customBgColor,
      text: customText.trim() || 'GLOW WAVE',
      text_color: isWhite ? '#000000' : '#FFFFFF',
      effect: customEffect,
      speed: getSpeedMs(customEffect, customSpeed),
      font_size: customFontSize,
      font_family: customFontFamily,
      special_effect: customSpecialEffect
    };

    const updated = [...presets, newPreset];
    setPresets(updated);
    localStorage.setItem('glowwave_local_presets', JSON.stringify(updated));
    setCurrentBroadcastPreset(newPreset);
    localStorage.setItem('glowwave_local_active_preset', JSON.stringify(newPreset));
    setActivePresetIndex(updated.length - 1);
  };

  const handleSaveEditDrawerPreset = () => {
    if (editingPresetIndex === null || editingPreset === null) return;

    let updated = [...presets];
    if (editingPresetIndex < presets.length) {
      updated[editingPresetIndex] = editingPreset;
    } else {
      updated.push(editingPreset);
    }

    setPresets(updated);
    localStorage.setItem('glowwave_local_presets', JSON.stringify(updated));
    setCurrentBroadcastPreset(editingPreset);
    localStorage.setItem('glowwave_local_active_preset', JSON.stringify(editingPreset));
    setActivePresetIndex(editingPresetIndex < presets.length ? editingPresetIndex : updated.length - 1);
    setEditingPresetIndex(null);
    setEditingPreset(null);
  };

  const handleDeleteLocalPreset = (indexToDelete: number) => {
    if (confirm('이 프리셋을 삭제하시겠습니까?')) {
      const updated = presets.filter((_, idx) => idx !== indexToDelete);
      setPresets(updated);
      localStorage.setItem('glowwave_local_presets', JSON.stringify(updated));
      
      if (updated.length > 0) {
        setCurrentBroadcastPreset(updated[0]);
        applyPresetToController(updated[0]);
        localStorage.setItem('glowwave_local_active_preset', JSON.stringify(updated[0]));
        setActivePresetIndex(0);
      }
      setEditingPresetIndex(null);
      setEditingPreset(null);
    }
  };

  // Slots Vault Handlers
  const handleSaveSlotPackage = () => {
    const name = newSlotName.trim() || `저장된 테마 #${savedSlots.length + 1}`;
    const newSlot = { name, presets: [...presets] };
    const updated = [...savedSlots, newSlot];
    setSavedSlots(updated);
    localStorage.setItem('glowwave_local_slots', JSON.stringify(updated));
    setNewSlotName('');
  };

  const handleLoadSlotPackage = (index: number) => {
    const slot = savedSlots[index];
    if (slot && slot.presets && slot.presets.length > 0) {
      setPresets(slot.presets);
      localStorage.setItem('glowwave_local_presets', JSON.stringify(slot.presets));
      setCurrentBroadcastPreset(slot.presets[0]);
      applyPresetToController(slot.presets[0]);
      localStorage.setItem('glowwave_local_active_preset', JSON.stringify(slot.presets[0]));
      setActivePresetIndex(0);
      setIsVaultOpen(false);
    }
  };

  const handleDeleteSlotPackage = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('이 테마 보관 슬롯을 삭제하시겠습니까?')) {
      const updated = savedSlots.filter((_, idx) => idx !== index);
      setSavedSlots(updated);
      localStorage.setItem('glowwave_local_slots', JSON.stringify(updated));
    }
  };

  // Wireless Sharing triggers
  const handleGenerateShareCode = async () => {
    setIsSharingLoading(true);
    setExportCode('');
    setShareQrUrl('');
    setIsCodeCopied(false);
    try {
      const res = await fetch('/api/preset-share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presets: presets })
      });
      if (!res.ok) throw new Error('API failed');
      const data = await res.json();
      
      setExportCode(data.shareKey);
      const url = `${window.location.origin}/local?import=${data.shareKey}`;
      setShareQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(url)}`);
    } catch (e) {
      console.error(e);
      alert('공유 코드 생성에 실패했습니다.');
    } finally {
      setIsSharingLoading(false);
    }
  };

  const handleImportShareCode = async () => {
    const code = shareCodeInput.trim().toUpperCase();
    if (!code || code.length !== 6) {
      alert('올바른 6자리 공유 코드를 입력하세요.');
      return;
    }

    setIsSharingLoading(true);
    try {
      const res = await fetch(`/api/preset-share?key=${code}`);
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || '가져오기 실패');
      }
      const data = await res.json();
      
      if (Array.isArray(data.presets) && data.presets.length > 0) {
        setPresets(data.presets);
        localStorage.setItem('glowwave_local_presets', JSON.stringify(data.presets));
        setCurrentBroadcastPreset(data.presets[0]);
        applyPresetToController(data.presets[0]);
        localStorage.setItem('glowwave_local_active_preset', JSON.stringify(data.presets[0]));
        setActivePresetIndex(0);
        
        setIsVaultOpen(false);
        setShareCodeInput('');
        alert('공유받은 프리셋을 정상적으로 동기화했습니다! 🎉');
      } else {
        throw new Error('올바르지 않은 프리셋 형식입니다.');
      }
    } catch (e: any) {
      console.error(e);
      alert(e.message || '가져오기에 실패했습니다. 만료된 코드인지 확인해 보세요.');
    } finally {
      setIsSharingLoading(false);
    }
  };

  const handleCopyShareCodeText = () => {
    if (!exportCode) return;
    navigator.clipboard.writeText(exportCode);
    setIsCodeCopied(true);
    setTimeout(() => setIsCodeCopied(false), 2000);
  };

  const handleFontSelect = (fontVal: 'sans-thin' | 'sans-thick' | 'serif' | 'neon' | 'pixel' | 'plump', isEdit: boolean) => {
    if (isEdit) {
      setEditingPreset(prev => ({ ...prev!, font_family: fontVal }));
    } else {
      setCustomFontFamily(fontVal);
    }
  };

  // Free/Premium Sync Room redirects
  const handleStartImportRoom = (tierType: 'free' | 'premium') => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('glowwave_temp_import_presets', JSON.stringify(presets));
      if (tierType === 'premium') {
        router.push('/host/setup?import=premium');
      } else {
        router.push('/host/setup?import=free');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#030305] text-foreground flex flex-col justify-between bg-grid-pattern relative overflow-hidden font-sans">
      
      {/* Background Neon Aura Spheres */}
      <div className="absolute top-[10%] left-[-10%] neon-glow-circle-1 opacity-30" />
      <div className="absolute bottom-[20%] right-[-10%] neon-glow-circle-2 opacity-25" />

      {/* Header */}
      <header className="border-b border-white/5 bg-[#030305]/60 backdrop-blur-md relative z-10 pt-[calc(env(safe-area-inset-top,0px)+12px)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="font-black text-white tracking-tight font-outfit text-sm uppercase">GlowWave Local</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20 font-black tracking-wider uppercase">
              1인 모드
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setVaultTab('slots');
              setIsVaultOpen(true);
            }}
            className="flex items-center bg-[#12121a] hover:bg-white/[0.08] border border-white/10 px-4.5 py-2 rounded-xl text-xs font-bold text-white cursor-pointer shadow-md select-none transition-all"
          >
            보관 & 공유 📦
          </button>
        </div>
      </header>

      {/* Unified HUD Status Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 w-full relative z-10">
        <div className="glass-effect rounded-2xl p-4 flex flex-wrap justify-between items-center gap-4 bg-[#12121a] border border-white/5">
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">방 모드</span>
              <span className="text-sm font-mono font-black text-white">1인 전용 (오프라인)</span>
            </div>
            
            <div className="hidden sm:block w-[1px] h-8 bg-white/5" />
            
            <div>
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">데이터 보존</span>
              <span className="text-sm font-black text-white">브라우저 저장소 (무제한)</span>
            </div>

            <div className="hidden sm:block w-[1px] h-8 bg-white/5" />

            <div>
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">사용 요금제</span>
              <span className="text-xs font-black text-white px-2 py-0.5 rounded-md bg-white/5 uppercase border border-white/5">
                평생 무료 (모든 기능 해제)
              </span>
            </div>

            <div className="hidden sm:block w-[1px] h-8 bg-white/5" />

            <div>
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">남은 시간</span>
              <span className="text-sm font-black text-zinc-300">무제한 (만료 없음)</span>
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

      {/* Main Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex-1 flex flex-col lg:grid lg:grid-cols-12 lg:items-start gap-8 w-full relative z-10">
        
        {/* Item 1: Templates (원터치 연출 보드) */}
        <div className="order-1 lg:col-span-8 flex flex-col w-full min-w-0">
          <div className="glass-effect rounded-2xl p-4 sm:p-6 bg-[#12121a] border border-white/5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-white/5">
              <h2 className="text-sm font-bold text-white font-outfit">원터치 연출 보드 (Quick Preset Board)</h2>
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
                내 프리셋
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
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Preset Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {(activeCategory === 'custom' ? presets : (TEMPLATE_CATEGORIES.find(c => c.id === activeCategory)?.presets || [])).map((preset, index) => {
                const isActive = currentBroadcastPreset.text === preset.text &&
                                 currentBroadcastPreset.bg_color === preset.bg_color &&
                                 currentBroadcastPreset.font_family === preset.font_family &&
                                 currentBroadcastPreset.special_effect === preset.special_effect &&
                                 currentBroadcastPreset.effect === preset.effect;
                return (
                  <div
                    key={index}
                    onClick={() => triggerPreset(preset, activeCategory === 'custom' ? index : -1)}
                    className="h-24 rounded-2xl border flex items-center justify-center p-6 relative overflow-hidden transition-all duration-300 cursor-pointer active-spring-pad group"
                    style={{
                      backgroundColor: preset.bg_color,
                      color: preset.text_color,
                      borderColor: isActive 
                        ? (preset.bg_color === '#0B0B0F' ? '#FFFFFF' : preset.bg_color) 
                        : 'rgba(255, 255, 255, 0.08)',
                      boxShadow: isActive 
                        ? (preset.bg_color === '#0B0B0F' 
                            ? '0 0 20px rgba(255, 255, 255, 0.15)' 
                            : `0 0 28px ${preset.bg_color}88`) 
                        : undefined
                    }}
                  >
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
                      {(preset.effect === 'luckydraw_wait' || preset.effect === 'luckydraw') && (
                        <div className="absolute inset-0 z-0 flex items-center justify-center bg-black/45 border border-amber-500/30 rounded-2xl animate-pulse">
                          <span className="text-[10px] text-amber-400 font-black tracking-widest font-mono">RAFFLE BOARD</span>
                        </div>
                      )}
                      {preset.effect === 'countdown' && (
                        <MiniCountdownPreview preset={preset} />
                      )}
                    </div>

                    <div 
                      className={`absolute top-3 left-3.5 w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                        isActive ? 'scale-110 shadow-lg animate-pulse' : 'opacity-40'
                      }`}
                      style={{ 
                        backgroundColor: preset.text_color,
                        boxShadow: isActive ? '0 0 8px currentColor' : undefined 
                      }} 
                    />
                    
                    <div className="text-center relative z-10 select-none w-full px-2">
                      <div className={`text-xs sm:text-sm tracking-tight uppercase line-clamp-2 ${getFontFamilyClass(preset.font_family)}`}>
                        {preset.text}
                      </div>
                    </div>
 
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (activeCategory === 'custom') {
                          setEditingPresetIndex(index);
                          setEditingPreset({ ...preset });
                        } else {
                          setEditingPresetIndex(presets.length);
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
                    setEditingPresetIndex(presets.length);
                    setEditingPreset(newPreset);
                  }}
                  className="h-24 rounded-2xl border border-dashed border-white/10 hover:border-white/30 bg-transparent flex items-center justify-center p-6 transition-all hover:bg-white/[0.01] active:scale-[0.97] cursor-pointer text-zinc-500 hover:text-white"
                >
                  <span className="text-sm font-bold">새 연출 추가</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Item 2: LIVE ON AIR Preview Card */}
        <div className="order-2 lg:col-span-4 flex flex-col w-full min-w-0">
          <div className="glass-effect rounded-2xl p-4 sm:p-6 flex flex-col items-center bg-[#12121a] border border-white/5">
            <div className="flex items-center gap-2 mb-2 self-start">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">LIVE ON AIR</h2>
            </div>
            <p className="text-[11px] text-zinc-500 mb-4 self-start">현재 전광판으로 내보내고 있는 실시간 화면 미리보기입니다.</p>
            
            <div className="w-full max-w-[420px] flex flex-col items-center">
              <div className="w-full flex justify-center py-2 border-y border-white/5 bg-black/20 rounded-xl relative group overflow-hidden">
                <LandscapePhoneMockup preset={currentBroadcastPreset} />
                
                <button
                  type="button"
                  onClick={() => setIsStandaloneFullscreen(true)}
                  className="hidden lg:flex absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center text-white font-bold text-xs cursor-pointer"
                >
                  내 화면에 전체화면으로 띄우기
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsStandaloneFullscreen(true)}
                className="mt-3 w-full py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 active:scale-[0.99] text-white font-bold text-xs tracking-wider flex items-center justify-center transition-all cursor-pointer border border-white/10 hover:border-white/20 shadow-md"
              >
                내 기기를 전광판으로 사용 (전체화면)
              </button>
            </div>

            {currentBroadcastPreset.effect === 'luckydraw_wait' && (
              <div className="w-full mt-4 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleDrawWinner}
                  className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-black text-xs tracking-wider flex items-center justify-center transition-all shadow-xl shadow-amber-500/20 cursor-pointer border border-amber-300"
                >
                  결과 발표 (추첨 완료)
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Item 3: 즉석 라이브 메시지 전송 */}
        <div className="order-3 lg:col-span-8 flex flex-col w-full min-w-0">
          <div className="glass-effect rounded-2xl p-4 sm:p-6 bg-[#12121a] border border-white/5">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/5">
              <h2 className="text-sm font-bold text-white">즉석 라이브 메시지 전송 (Custom Broadcast)</h2>
            </div>
            
            <div className="flex flex-col gap-5">
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
                    triggerPreset(customPreset, -1);
                  }}
                  className="btn-primary h-[48px] px-6 rounded-xl text-xs font-black flex items-center justify-center cursor-pointer shrink-0"
                >
                  송출하기
                </button>
              </div>

              {/* Controls Grid */}
              <div className="flex flex-col gap-6 pt-3.5 border-t border-white/5">
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
                      <span className="text-indigo-400 font-extrabold">{customFontSize}%</span>
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

                  {/* 글꼴 스타일 */}
                  <div className="lg:col-span-6 flex flex-col gap-1.5">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">글꼴 스타일</span>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 bg-black/45 p-1 rounded-xl border border-white/5 items-center">
                      {[
                        { val: 'sans-thin', label: '기본고딕', style: { fontFamily: "'Pretendard', sans-serif", fontWeight: 700 } },
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
                    <div className="grid grid-cols-5 gap-1 bg-black/45 p-1 rounded-xl border border-white/5 h-10 items-center">
                      {[
                        { val: 'none', label: '정적' },
                        { val: 'blink', label: '깜빡' },
                        { val: 'marquee', label: '흐름' },
                        { val: 'countdown', label: '타이머' },
                        { val: 'luckydraw_wait', label: '추첨' }
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => {
                            setCustomEffect(item.val as any);
                            setCustomSpeed(getSpeedFactor(item.val as any, 1000));
                          }}
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

                  {/* 특수 효과 */}
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

              {/* Speed Controller */}
              {(customEffect === 'blink' || customEffect === 'marquee' || customEffect === 'luckydraw_wait') && (
                <div className="pt-4 border-t border-white/5 animate-in fade-in duration-200">
                  <div className="flex justify-between text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-2.5">
                    <span>전송 애니메이션 속도 조절</span>
                    <span className="text-indigo-400 font-extrabold">
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

              {/* Save current state */}
              <div className="pt-3 border-t border-white/5 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveLocalPreset}
                  className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 font-bold text-xs tracking-wider transition-all cursor-pointer"
                >
                  현재 설정을 내 프리셋에 추가
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Item 4: 1인 모드 이용 가이드 & 보관 안내 (Short impact text card) */}
        <div className="order-4 lg:col-span-4 flex flex-col gap-6 w-full min-w-0">
          <div className="glass-effect rounded-2xl p-6 text-xs text-zinc-400 leading-relaxed flex flex-col gap-4 bg-[#12121a] border border-white/5">
            <h3 className="font-bold text-white text-sm">1인 모드 이용 가이드 & 보관 안내</h3>
            
            <div className="flex flex-col gap-3.5">
              <div>
                <strong className="text-zinc-200 block text-[11px] mb-1">더블 탭으로 나가기</strong>
                <p className="text-[10.5px]">전광판 화면을 **더블 클릭** (또는 ESC 키)하면 대시보드로 돌아옵니다.</p>
              </div>
              
              <div>
                <strong className="text-zinc-200 block text-[11px] mb-1">화면 자동 켜짐 유지</strong>
                <p className="text-[10.5px]">전광판이 켜진 동안에는 폰이 **절전 모드로 들어가지 않고** 화면이 유지됩니다.</p>
              </div>
              
              <div className="border-t border-white/5 pt-3">
                <strong className="text-zinc-200 block text-[11px] mb-1">기기에 안전하게 자동 보존</strong>
                <p className="text-[10.5px]">
                  수정한 프리셋들은 **브라우저에 자동 저장**됩니다. 방문 기록(캐시/쿠키)을 청소하면 데이터가 소멸할 수 있으니, 소중한 디자인 세트는 상단의 **[보관 & 공유 📦]** 메뉴에서 모바일로 백업해 두세요!
                </p>
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-zinc-950 py-4 text-center text-[10px] text-zinc-600 font-mono">
        Solo Standalone Mode · All features unlocked free.
      </footer>

      {/* 11. Standalone Fullscreen Signboard Overlay */}
      {isStandaloneFullscreen && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center animate-in fade-in duration-200">
          <LocalFullscreenSignboard 
            preset={currentBroadcastPreset} 
            onClose={() => setIsStandaloneFullscreen(false)} 
          />
        </div>
      )}

      {/* 12. Edit Preset Drawer */}
      {editingPresetIndex !== null && editingPreset !== null && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
            onClick={() => { setEditingPresetIndex(null); setEditingPreset(null); }} 
          />
          
          {/* Drawer Panel */}
          <div className="absolute inset-y-0 right-0 max-w-md w-full bg-[#12121a] border-l border-white/5 shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-right duration-200">
            
            {/* Floating Preview Card on Left for Desktop/Tablet Screens */}
            <div className="hidden lg:block absolute right-[calc(100%+24px)] top-6 z-20 w-[420px]">
              <div className="glass-effect rounded-2xl p-5 bg-[#12121a]/95 border border-white/10 shadow-2xl flex flex-col items-center">
                <span className="text-[10px] font-black font-mono text-indigo-400 uppercase mb-3 tracking-widest">실시간 연출 미리보기</span>
                <LandscapePhoneMockup preset={editingPreset} />
                <div className="mt-3.5 text-[9.5px] text-zinc-400 text-center font-semibold leading-normal">
                  수정창 좌측에 연출 화면이 고정됩니다.<br/>
                  설정을 변경하면 화면에 즉시 적용되어 변경 사항을 실시간으로 확인합니다.
                </div>
              </div>
            </div>

            <div className="flex flex-col flex-1 overflow-y-auto">
              {/* Header */}
              <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
                <h3 className="text-sm font-bold text-white">
                  {editingPresetIndex >= presets.length ? '새 커스텀 프리셋 추가' : `프리셋 P${editingPresetIndex + 1} 편집`}
                </h3>
                <button 
                  onClick={() => { setEditingPresetIndex(null); setEditingPreset(null); }}
                  className="text-zinc-500 hover:text-white p-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Landscape Live Preview Mockup Inside Drawer (Mobile only) */}
              <div className="p-6 border-b border-white/5 bg-black/40 flex flex-col items-center lg:hidden">
                <span className="text-[10px] font-bold font-mono text-zinc-500 uppercase mb-3 tracking-wider">실시간 연출 미리보기</span>
                <LandscapePhoneMockup preset={editingPreset} />
              </div>

              {/* Form Controls */}
              <div className="p-6 flex flex-col gap-5">
                {/* Output Text */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">출력 문구</label>
                  <input
                    type="text"
                    value={editingPreset.text || ''}
                    onChange={(e) => setEditingPreset(prev => ({ ...prev!, text: e.target.value.slice(0, 15) }))}
                    className="w-full bg-[#0B0B0F] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-white text-sm font-semibold"
                    maxLength={15}
                  />
                </div>

                {/* Background Color Grid */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">배경 색상</label>
                  <div className="grid grid-cols-6 gap-2">
                    {[
                      '#EF4444', '#F97316', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6', 
                      '#6366F1', '#8B5CF6', '#D946EF', '#EC4899', '#FFFFFF', '#0B0B0F'
                    ].map((hex) => {
                      const isSelected = editingPreset.bg_color === hex;
                      const dotColor = hex === '#FFFFFF' ? '#000000' : '#FFFFFF';
                      return (
                        <button
                          key={hex}
                          type="button"
                          onClick={() => setEditingPreset(prev => ({ ...prev!, bg_color: hex }))}
                          className={`h-9 rounded-lg border cursor-pointer transition-all relative flex items-center justify-center ${
                            isSelected 
                              ? 'border-white scale-105 shadow-md' 
                              : 'border-white/10 hover:border-white/30'
                          }`}
                          style={{ backgroundColor: hex }}
                        >
                          {isSelected && (
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dotColor }} />
                          )}
                        </button>
                      );
                    })}

                    <div 
                      className="h-9 rounded-lg overflow-hidden border border-white/10 hover:scale-105 transition-all shadow-md cursor-pointer relative flex items-center justify-center" 
                      style={{ background: 'linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8b00ff)' }}
                      title="커스텀 색상 선택"
                    >
                      <input
                        type="color"
                        value={editingPreset.bg_color}
                        onChange={(e) => setEditingPreset(prev => ({ ...prev!, bg_color: e.target.value }))}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-150"
                      />
                      {!['#EF4444', '#F97316', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6', 
                        '#6366F1', '#8B5CF6', '#D946EF', '#EC4899', '#FFFFFF', '#0B0B0F'].includes(editingPreset.bg_color) && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                      )}
                    </div>
                  </div>
                </div>

                {/* 모션 효과 */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">모션 효과</label>
                  <div className="grid grid-cols-5 gap-1 bg-black/40 p-1 rounded-xl border border-white/5 h-11 items-center font-medium">
                    {[
                      { val: 'none', label: '정적' },
                      { val: 'blink', label: '깜빡' },
                      { val: 'marquee', label: '흐름' },
                      { val: 'countdown', label: '타이머' },
                      { val: 'luckydraw_wait', label: '추첨' }
                    ].map((item) => (
                      <button
                        type="button"
                        key={item.val}
                        onClick={() => {
                          const effectDefaults: Record<EffectType, Preset> = {
                            none: defaults[0],
                            blink: defaults[1],
                            marquee: defaults[4],
                            countdown: defaults[5],
                            luckydraw_wait: defaults[3],
                            luckydraw: defaults[3]
                          };
                          const defaultVal = effectDefaults[item.val as EffectType];
                          setEditingPreset(prev => ({
                            ...prev!,
                            effect: item.val as EffectType,
                            text: defaultVal.text,
                            text_color: defaultVal.text_color,
                            bg_color: defaultVal.bg_color,
                            bg_color_secondary: defaultVal.bg_color_secondary,
                            speed: defaultVal.speed,
                            countdown_seconds: defaultVal.countdown_seconds,
                            result_text: defaultVal.result_text,
                            font_family: defaultVal.font_family || 'sans-thin',
                            font_size: defaultVal.font_size || 100
                          }));
                        }}
                        className={`h-full rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          (editingPreset.effect === 'luckydraw' || editingPreset.effect === 'luckydraw_wait' ? 'luckydraw_wait' : editingPreset.effect) === item.val
                            ? 'bg-white text-black shadow-sm font-extrabold'
                            : 'text-zinc-400 hover:text-white hover:bg-white/[0.02]'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Secondary Color Grid */}
                {(editingPreset.effect === 'blink' || editingPreset.effect === 'luckydraw_wait' || editingPreset.effect === 'luckydraw') && (
                  <div className="pt-3 border-t border-white/5 animate-in fade-in duration-200">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">보조 배경 색상 (듀오 교대 번쩍임/경계선 색상용)</label>
                    <div className="flex gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => setEditingPreset(prev => {
                          const copy = { ...prev! };
                          delete copy.bg_color_secondary;
                          return copy;
                        })}
                        className={`h-9 px-3 rounded-lg border border-dashed text-[10px] font-black cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                          !editingPreset.bg_color_secondary 
                            ? 'border-white bg-white/10 text-white shadow-md font-extrabold' 
                            : 'border-white/10 text-zinc-500 hover:border-white/30 hover:text-zinc-400'
                        }`}
                      >
                        <Slash className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        <span>단색 (부드러운 깜빡이)</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-6 gap-2">
                      {[
                        '#EF4444', '#F97316', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6', 
                        '#6366F1', '#8B5CF6', '#D946EF', '#EC4899', '#FFFFFF', '#0B0B0F'
                      ].map((hex) => {
                        const isSelected = editingPreset.bg_color_secondary === hex;
                        const dotColor = hex === '#FFFFFF' ? '#000000' : '#FFFFFF';
                        return (
                          <button
                            key={hex}
                            type="button"
                            onClick={() => setEditingPreset(prev => ({ ...prev!, bg_color_secondary: hex }))}
                            className={`h-9 rounded-lg border cursor-pointer transition-all relative flex items-center justify-center ${
                              isSelected 
                                ? 'border-white scale-105 shadow-md' 
                                : 'border-white/10 hover:border-white/30'
                            }`}
                            style={{ backgroundColor: hex }}
                          >
                            {isSelected && (
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dotColor }} />
                            )}
                          </button>
                        );
                      })}

                      <div 
                        className="h-9 rounded-lg overflow-hidden border border-white/10 hover:scale-105 transition-all shadow-md cursor-pointer relative flex items-center justify-center" 
                        style={{ background: 'linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8b00ff)' }}
                        title="커스텀 보조 색상 선택"
                      >
                        <input
                          type="color"
                          value={editingPreset.bg_color_secondary || '#000000'}
                          onChange={(e) => setEditingPreset(prev => ({ ...prev!, bg_color_secondary: e.target.value }))}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-150"
                        />
                        {editingPreset.bg_color_secondary && !['#EF4444', '#F97316', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6', 
                          '#6366F1', '#8B5CF6', '#D946EF', '#EC4899', '#FFFFFF', '#0B0B0F'].includes(editingPreset.bg_color_secondary) && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Speed Slider */}
                {(editingPreset.effect === 'blink' || editingPreset.effect === 'marquee' || editingPreset.effect === 'luckydraw_wait' || editingPreset.effect === 'luckydraw') && (
                  <div className="pt-3 border-t border-white/5 animate-in fade-in duration-200">
                    <div className="flex justify-between text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-2.5">
                      <span>애니메이션 속도 조절</span>
                      <span className="text-indigo-400 font-extrabold">
                        속도: {getSpeedFactor(editingPreset.effect, editingPreset.speed)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={getSpeedFactor(editingPreset.effect, editingPreset.speed)}
                      onChange={(e) => {
                        const factor = parseInt(e.target.value);
                        const newSpeed = getSpeedMs(editingPreset.effect, factor);
                        setEditingPreset(prev => ({ ...prev!, speed: newSpeed }));
                      }}
                      className="premium-slider"
                    />
                  </div>
                )}

                {/* Countdown Options */}
                {editingPreset.effect === 'countdown' && (
                  <div className="pt-3 border-t border-white/5 animate-in fade-in duration-200 flex flex-col gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">카운트다운 지속 초 (Seconds)</label>
                      <div className="grid grid-cols-5 gap-1 bg-black/40 p-1 rounded-full border border-white/5">
                        {[3, 5, 10, 30, 60].map((sec) => (
                          <button
                            type="button"
                            key={sec}
                            onClick={() => setEditingPreset(prev => ({ ...prev!, countdown_seconds: sec }))}
                            className={`py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                              (editingPreset.countdown_seconds || 10) === sec
                                ? 'bg-white text-black shadow-sm font-extrabold'
                                : 'text-zinc-400 hover:text-white hover:bg-white/[0.02]'
                            }`}
                          >
                            {sec}초
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">종료 시 출력 문구</label>
                      <input
                        type="text"
                        value={editingPreset.result_text || ''}
                        onChange={(e) => setEditingPreset(prev => ({ ...prev!, result_text: e.target.value.slice(0, 15) }))}
                        className="w-full bg-[#0B0B0F] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-white text-xs font-semibold"
                        maxLength={15}
                        placeholder="START"
                      />
                    </div>
                  </div>
                )}

                {/* Lucky Draw Options */}
                {(editingPreset.effect === 'luckydraw_wait' || editingPreset.effect === 'luckydraw') && (
                  <div className="pt-3 border-t border-white/5 animate-in fade-in duration-200 flex flex-col gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">당첨 시 출력 문구</label>
                      <input
                        type="text"
                        value={editingPreset.text || ''}
                        onChange={(e) => setEditingPreset(prev => ({ ...prev!, text: e.target.value.slice(0, 15) }))}
                        className="w-full bg-[#0B0B0F] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-white text-xs font-semibold"
                        maxLength={15}
                        placeholder="당첨!"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">낙첨 시 출력 문구</label>
                      <input
                        type="text"
                        value={editingPreset.result_text || ''}
                        onChange={(e) => setEditingPreset(prev => ({ ...prev!, result_text: e.target.value.slice(0, 15) }))}
                        className="w-full bg-[#0B0B0F] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-white text-xs font-semibold"
                        maxLength={15}
                        placeholder="아쉽네요! 다음 기회에.."
                      />
                    </div>
                  </div>
                )}

                {/* 글자 색상 */}
                <div className="pt-3 border-t border-white/5">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">글자 색상</label>
                  <div className="grid grid-cols-3 gap-2 h-10 items-center font-medium">
                    {[
                      { hex: '#FFFFFF', label: '흰색', bg: 'bg-white' },
                      { hex: '#000000', label: '검은색', bg: 'bg-black' },
                      { hex: '#FFD700', label: '노란색', bg: 'bg-[#FFD700]' }
                    ].map((tc) => (
                      <button
                        key={tc.hex}
                        type="button"
                        onClick={() => setEditingPreset(prev => ({ ...prev!, text_color: tc.hex }))}
                        className={`h-full rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          editingPreset.text_color === tc.hex
                            ? 'border-white bg-white/10 text-white font-extrabold shadow-sm'
                            : 'border-white/5 bg-transparent text-zinc-400 hover:text-white'
                        }`}
                      >
                        <span className={`w-3 h-3 rounded-full ${tc.bg} border border-white/10`} />
                        <span>{tc.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 글꼴 스타일 */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">글꼴 스타일</label>
                  <div className="grid grid-cols-3 gap-1 bg-black/40 p-1 rounded-xl border border-white/5 items-center font-medium">
                    {[
                      { val: 'sans-thin', label: '기본고딕', style: { fontFamily: "'Pretendard', sans-serif" } },
                      { val: 'sans-thick', label: '꽉찬고딕', style: { fontFamily: "'GmarketSansBold', sans-serif" } },
                      { val: 'serif', label: '나눔명조', style: { fontFamily: "'Nanum Myeongjo', serif" } },
                      { val: 'neon', label: '스포티', style: { fontFamily: "'LeeSaManRu-Bold', sans-serif" } },
                      { val: 'pixel', label: '레트로도트', style: { fontFamily: "'NeoDunggeunmo', sans-serif" } },
                      { val: 'plump', label: '둥글몽글', style: { fontFamily: "'TmonMonsori', sans-serif" } }
                    ].map((item) => (
                      <button
                        type="button"
                        key={item.val}
                        onClick={() => handleFontSelect(item.val as any, true)}
                        style={item.style}
                        className={`py-2 px-1 rounded-lg text-xs transition-all cursor-pointer ${
                          (editingPreset.font_family || 'sans-thin') === item.val
                            ? 'bg-white text-black shadow-sm font-extrabold'
                            : 'text-zinc-400 hover:text-white hover:bg-white/[0.02]'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 특수 효과 */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">특수 효과</label>
                  <div className="grid grid-cols-4 gap-1 bg-black/40 p-1 rounded-xl border border-white/5 h-11 items-center font-medium">
                    {[
                      { val: 'none', label: '없음' },
                      { val: 'hearts', label: '하트' },
                      { val: 'confetti', label: '꽃가루' },
                      { val: 'stars', label: '별빛' }
                    ].map((item) => (
                      <button
                        type="button"
                        key={item.val}
                        onClick={() => setEditingPreset(prev => ({ ...prev!, special_effect: item.val as any }))}
                        className={`h-full rounded-lg text-[10px] transition-all cursor-pointer ${
                          (editingPreset.special_effect || 'none') === item.val
                            ? 'bg-white text-black shadow-sm font-extrabold'
                            : 'text-zinc-400 hover:text-white hover:bg-white/[0.02]'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 글자 크기 */}
                <div>
                  <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    <span>글자 크기</span>
                    <span className="text-indigo-400 font-extrabold">{editingPreset.font_size || 100}%</span>
                  </div>
                  <div className="flex items-center h-10">
                    <input
                      type="range"
                      min="30"
                      max="100"
                      value={editingPreset.font_size || 100}
                      onChange={(e) => {
                        const size = parseInt(e.target.value);
                        setEditingPreset(prev => ({ ...prev!, font_size: size }));
                      }}
                      className="premium-slider w-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-6 border-t border-white/5 bg-black/20 flex flex-col gap-4">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (editingPresetIndex === null || !editingPreset) return;
                    const normalized: Preset = {
                      ...editingPreset,
                      text: editingPreset.text.trim(),
                      result_text: editingPreset.result_text?.trim()
                    };
                    const updated = [...presets];
                    if (editingPresetIndex === presets.length) {
                      updated.push(normalized);
                    } else {
                      updated[editingPresetIndex] = normalized;
                    }
                    setPresets(updated);
                    localStorage.setItem('glowwave_local_presets', JSON.stringify(updated));
                    setActiveCategory('custom');
                    setEditingPresetIndex(null);
                    setEditingPreset(null);
                  }}
                  className="flex-1 py-3 rounded-xl border border-white/10 bg-white/5 text-white font-bold hover:bg-white/10 transition-all text-xs cursor-pointer"
                >
                  저장만 하기
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    if (editingPresetIndex === null || !editingPreset) return;
                    const normalized: Preset = {
                      ...editingPreset,
                      text: editingPreset.text.trim(),
                      result_text: editingPreset.result_text?.trim()
                    };
                    const updated = [...presets];
                    if (editingPresetIndex === presets.length) {
                      updated.push(normalized);
                    } else {
                      updated[editingPresetIndex] = normalized;
                    }
                    setPresets(updated);
                    localStorage.setItem('glowwave_local_presets', JSON.stringify(updated));
                    triggerPreset(normalized, editingPresetIndex);
                    setActiveCategory('custom');
                    setEditingPresetIndex(null);
                    setEditingPreset(null);
                  }}
                  className="btn-primary flex-1 py-3 rounded-xl text-xs font-bold cursor-pointer"
                >
                  저장 후 바로 송출
                </button>
              </div>

              {editingPresetIndex === presets.length && (
                <button
                  type="button"
                  onClick={() => {
                    if (editingPresetIndex === null || !editingPreset) return;
                    const normalized: Preset = {
                      ...editingPreset,
                      text: editingPreset.text.trim(),
                      result_text: editingPreset.result_text?.trim()
                    };
                    triggerPreset(normalized, -1);
                    setEditingPresetIndex(null);
                    setEditingPreset(null);
                  }}
                  className="w-full py-2.5 rounded-xl border border-dashed border-zinc-700 bg-transparent text-zinc-400 hover:text-white hover:border-zinc-500 hover:bg-white/5 font-bold transition-all text-[11px] cursor-pointer"
                >
                  저장 없이 바로 송출 (1회성 송출)
                </button>
              )}

              <div className="flex flex-col gap-2 items-center text-xs pt-1">
                {editingPresetIndex < 6 && (
                  <button
                    type="button"
                    onClick={() => setEditingPreset({ ...defaults[editingPresetIndex] })}
                    className="text-zinc-500 hover:text-white transition-colors cursor-pointer underline underline-offset-4"
                  >
                    기본값으로 초기화
                  </button>
                )}

                {editingPresetIndex >= 6 && editingPresetIndex < presets.length && (
                  <button
                    type="button"
                    onClick={() => handleDeleteLocalPreset(editingPresetIndex)}
                    className="text-red-500/80 hover:text-red-400 transition-colors cursor-pointer underline underline-offset-4"
                  >
                    이 커스텀 프리셋 삭제
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => { setEditingPresetIndex(null); setEditingPreset(null); }}
                  className="text-zinc-500 hover:text-white transition-colors cursor-pointer underline underline-offset-4"
                >
                  취소
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 13. Centralized Vault and Share Modal */}
      {isVaultOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/85 backdrop-blur-md transition-opacity"
            onClick={() => setIsVaultOpen(false)}
          />

          <div className="bg-[#12121a] border border-white/10 rounded-3xl max-w-2xl w-full p-6 sm:p-8 relative z-10 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto font-sans text-left">
            <button 
              onClick={() => setIsVaultOpen(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white p-1 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <h2 className="text-xl font-black text-white leading-tight font-outfit font-sans">보관함 및 연출 공유</h2>
              <p className="text-xs text-zinc-500 mt-1.5 font-medium font-sans">
                전광판 프리셋을 기기에 안전하게 저장하거나 다른 기기로 전송합니다.
              </p>
            </div>

            {/* Modal Internal Tabs */}
            <div className="flex border-b border-white/5 gap-1 mb-6 overflow-x-auto pb-1 scrollbar-none">
              {[
                { tab: 'slots', label: '내 기기에 보관' },
                { tab: 'share', label: '무선 전송 (보내기/받기)' },
                { tab: 'sync', label: '여러 기기 연결 (싱크)' }
              ].map((t) => (
                <button
                  key={t.tab}
                  type="button"
                  onClick={() => setVaultTab(t.tab as any)}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all active:scale-95 shrink-0 font-sans ${
                    vaultTab === t.tab 
                      ? 'bg-white/5 border border-white/15 text-white' 
                      : 'text-zinc-500 hover:text-white hover:bg-white/[0.02]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab 1: Slots Vault */}
            {vaultTab === 'slots' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="bg-black/30 border border-white/5 rounded-2xl p-4.5">
                  <h4 className="text-xs font-bold text-white mb-1 font-sans">내 기기 브라우저 보관함</h4>
                  <p className="text-[10.5px] text-zinc-400 leading-normal font-sans">
                    현재 프리셋 구성을 슬롯에 보관해 두고 필요할 때 클릭 한 번으로 빠르게 다시 불러옵니다.
                  </p>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSlotName}
                    onChange={(e) => setNewSlotName(e.target.value.slice(0, 15))}
                    placeholder="저장할 테마 이름 (예: 블랙핑크)"
                    className="flex-1 bg-black/45 border border-white/10 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-xs font-semibold font-sans"
                    maxLength={15}
                  />
                  <button
                    onClick={handleSaveSlotPackage}
                    className="px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold transition-all cursor-pointer shrink-0 shadow active:scale-95 font-sans"
                  >
                    슬롯 저장
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {savedSlots.length > 0 ? (
                    savedSlots.map((slot, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleLoadSlotPackage(idx)}
                        className="group flex items-center justify-between p-3.5 bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 hover:border-white/10 rounded-xl cursor-pointer transition-all active:scale-[0.99]"
                      >
                        <div className="min-w-0 pr-4 font-sans">
                          <span className="text-xs font-bold text-white block truncate">{slot.name}</span>
                          <span className="text-[9px] text-zinc-500 font-mono mt-0.5 block">프리셋 {slot.presets?.length || 0}개 수록</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-indigo-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity font-sans font-sans">불러오기 &rarr;</span>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteSlotPackage(idx, e)}
                            className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-white/5 rounded transition-all cursor-pointer active:scale-90"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-white/5 bg-white/[0.01] p-8 text-center text-zinc-500 font-semibold text-[10px] font-sans">
                      보관된 테마가 없습니다. 이름을 입력하고 슬롯을 추가해 보세요.
                    </div>
                  )}
                </div>

                {/* Integration of Backup warnings & Reset */}
                <div className="pt-4 border-t border-white/5 space-y-4">
                  <div className="bg-amber-500/[0.03] border border-amber-500/10 p-3.5 rounded-xl text-left">
                    <span className="text-[10px] text-amber-400 font-bold block mb-1 font-sans">💡 브라우저 캐시 주의</span>
                    <span className="text-[9.5px] text-zinc-500 leading-normal block font-sans">
                      가입이 없는 로컬 전용 모드로, 인터넷 캐시/쿠키 청소 시 저장된 보관함 슬롯도 함께 지워집니다. 안전한 보관을 위해 가끔 <b>[무선 전송 (보내기/받기)]</b> 탭에서 다른 기기로 백업하여 안전하게 복사해 두시길 권장합니다.
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-left">
                    <div className="min-w-0 pr-4">
                      <span className="text-[10px] text-zinc-500 font-semibold block font-sans">대시보드 리셋</span>
                      <span className="text-[9px] text-zinc-650 block font-sans">모든 프리셋과 보관함을 초기 기본값으로 리셋합니다.</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetDashboard}
                      className="py-2 px-3.5 rounded-xl border border-red-500/20 text-red-400 bg-red-500/5 hover:bg-red-500/15 cursor-pointer text-[10px] font-bold transition-all text-center active:scale-95 font-sans shrink-0"
                    >
                      전체 초기 리셋
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Wireless Sharing */}
            {vaultTab === 'share' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="bg-black/30 border border-white/5 rounded-2xl p-4.5">
                  <h4 className="text-xs font-bold text-white mb-1 font-sans">기기 간 무선 전송</h4>
                  <p className="text-[10.5px] text-zinc-400 leading-normal font-sans">
                    스마트폰 카메라 스캔이나 6자리 공유 코드로 프리셋을 간편하게 보내고 받을 수 있습니다.
                  </p>
                </div>

                {/* Sub-toggle for Send vs Receive */}
                <div className="flex bg-black/40 border border-white/5 p-1 rounded-xl gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShareMode('send');
                      stopScanning();
                    }}
                    className={`flex-1 py-2 text-[10.5px] font-bold rounded-lg transition-all active:scale-95 font-sans ${
                      shareMode === 'send' 
                        ? 'bg-white/10 text-white shadow-sm border border-white/10' 
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    내 프리셋 보내기 (QR 생성)
                  </button>
                  <button
                    type="button"
                    onClick={() => setShareMode('receive')}
                    className={`flex-1 py-2 text-[10.5px] font-bold rounded-lg transition-all active:scale-95 font-sans ${
                      shareMode === 'receive' 
                        ? 'bg-white/10 text-white shadow-sm border border-white/10' 
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    다른 프리셋 가져오기 (스캔/입력)
                  </button>
                </div>

                {/* Sub-tab A: Send (공유하기) */}
                {shareMode === 'send' && (
                  <div className="space-y-3 animate-in fade-in duration-150">
                    <div className="bg-black/50 border border-white/5 p-4 rounded-xl flex flex-col items-center gap-3.5 text-center min-h-[160px] justify-center relative">
                      {isSharingLoading ? (
                        <span className="text-xs text-zinc-500 animate-pulse font-sans">임시 무선 연동 토큰 생성 중...</span>
                      ) : shareQrUrl ? (
                        <div className="flex flex-col items-center gap-2.5 animate-in fade-in duration-200">
                          <div className="bg-white p-2.5 rounded-xl shadow-xl">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={shareQrUrl} alt="Preset Share QR" className="w-36 h-36 rounded-lg" />
                          </div>
                          <span className="text-[9.5px] text-zinc-400 font-bold font-sans">
                            📱 상대방 스마트폰 카메라로 비추면 즉시 내 프리셋이 복사 적용됩니다!
                          </span>
                          
                          <div className="flex items-center gap-1.5 mt-1 bg-[#12121a] px-3 py-1.5 rounded-xl border border-white/5">
                            <span className="text-[11px] font-mono text-zinc-400 font-bold uppercase tracking-widest">{exportCode}</span>
                            <button
                              onClick={handleCopyShareCodeText}
                              className="text-[9px] text-indigo-400 hover:text-indigo-300 font-bold transition-colors active:scale-95 font-sans"
                            >
                              {isCodeCopied ? '복사 완료' : '코드 복사'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="py-6 px-4 text-center space-y-4">
                          <p className="text-[11px] text-zinc-400 leading-normal font-sans">
                            현재 기기에 세팅된 원터치 프리셋 패키지를 다른 폰으로 바로 전송할 수 있는 QR 코드를 만듭니다.
                          </p>
                          <button
                            onClick={handleGenerateShareCode}
                            className="w-full py-3.5 rounded-xl bg-white text-black font-extrabold text-xs shadow-lg hover:bg-zinc-200 transition-all cursor-pointer flex items-center justify-center active:scale-95 font-sans"
                          >
                            전송용 QR 코드 및 번호 생성
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Sub-tab B: Receive (불러오기) */}
                {shareMode === 'receive' && (
                  <div className="space-y-3 animate-in fade-in duration-150">
                    {isScanning ? (
                      <div className="flex flex-col items-center gap-3 bg-[#0d0d15]/40 border border-white/5 p-4 rounded-xl">
                        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-white/10 flex items-center justify-center">
                          <video
                            ref={scannerVideoRef}
                            className="w-full h-full object-cover"
                            playsInline
                            muted
                          />
                          {/* Custom Neon laser scanning line overlay */}
                          <div className="absolute inset-x-0 h-0.5 bg-indigo-500/80 animate-bounce top-1/2 shadow-[0_0_8px_#6366f1]" />
                          <canvas ref={scannerCanvasRef} className="hidden" />
                        </div>
                        <button
                          type="button"
                          onClick={stopScanning}
                          className="w-full py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-bold transition-all cursor-pointer active:scale-95 font-sans"
                        >
                          스캔 취소
                        </button>
                      </div>
                    ) : (
                      <div className="bg-[#0d0d15]/40 border border-white/5 p-4 rounded-xl space-y-4">
                        <div className="space-y-2">
                          <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block font-sans">방법 A: 카메라로 즉시 스캔</span>
                          <button
                            type="button"
                            onClick={startScanning}
                            className="w-full py-3 rounded-xl border border-dashed border-white/15 hover:border-indigo-500 hover:bg-white/[0.02] text-zinc-300 hover:text-white font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 font-sans"
                          >
                            카메라 QR 스캔 켜기
                          </button>
                        </div>

                        <div className="h-[1px] bg-white/5" />

                        <div className="space-y-2">
                          <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block font-sans">방법 B: 6자리 코드 입력</span>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={shareCodeInput}
                              onChange={(e) => setShareCodeInput(e.target.value.toUpperCase())}
                              placeholder="6자리 코드 입력 (예: X8Y3ZA)"
                              className="flex-1 bg-black/45 border border-white/10 rounded-xl px-3.5 py-2.5 text-white tracking-widest text-center text-xs font-black focus:outline-none focus:border-indigo-500 uppercase font-mono"
                              maxLength={6}
                            />
                            <button
                              onClick={handleImportShareCode}
                              className="px-4.5 rounded-xl bg-white text-black text-xs font-black hover:bg-zinc-200 transition-colors cursor-pointer shrink-0 active:scale-95 font-sans"
                            >
                              가져오기
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Create Sync Room */}
            {vaultTab === 'sync' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="bg-black/30 border border-white/5 rounded-2xl p-4.5">
                  <h4 className="text-xs font-bold text-white mb-1 font-sans">여러 기기 연결 (싱크)</h4>
                  <p className="text-[10.5px] text-zinc-400 leading-normal font-sans">
                    현재 프리셋 세팅을 가져와 다수의 관객 스마트폰 화면들을 실시간 조종하는 멀티 싱크 방을 개설합니다.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Option A */}
                  <div className="glass-effect rounded-2xl p-5 border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-all flex flex-col justify-between text-left active:scale-[0.99]">
                    <div>
                      <span className="text-[9px] font-mono text-zinc-500 font-extrabold uppercase block tracking-wider mb-2">FREE PLAN</span>
                      <h3 className="text-sm font-black text-white mb-2 font-sans">일부 제한 연동 (무료 방)</h3>
                      <p className="text-[11px] text-zinc-400 leading-relaxed mb-4 font-sans">
                        상위 6개 프리셋만 동기화하여 무료 방을 개설합니다. (유료 폰트 및 파티클은 자동 제외)
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleStartImportRoom('free')}
                      className="w-full py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-zinc-300 font-bold text-xs transition-all cursor-pointer text-center active:scale-95 font-sans"
                    >
                      무료 방 개설
                    </button>
                  </div>

                  {/* Option B */}
                  <div className="rounded-2xl p-5 border border-indigo-500/30 bg-indigo-500/[0.03] hover:bg-indigo-500/[0.06] transition-all flex flex-col justify-between text-left relative overflow-hidden group shadow-lg shadow-indigo-500/5 active:scale-[0.99]">
                    <div>
                      <span className="text-[9px] font-mono text-indigo-400 font-extrabold block tracking-wider mb-2">PREMIUM PLAN</span>
                      <h3 className="text-sm font-black text-white mb-2 font-sans">무손실 100% 연동 (유료 방)</h3>
                      <p className="text-[11px] text-zinc-400 leading-relaxed mb-4 font-sans">
                        모든 연출 프리셋과 프리미엄 폰트, 별빛/하트 등 특수 효과를 완벽하게 유지하여 개설합니다.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleStartImportRoom('premium')}
                      className="w-full py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-650 text-white font-black text-xs transition-all cursor-pointer text-center active:scale-95 font-sans"
                    >
                      프리미엄 방 개설
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Automatic URL Import Progress Overlay */}
      {isImportLoading && (
        <div className="fixed inset-0 z-50 bg-[#030305]/95 flex flex-col items-center justify-center p-6 text-center select-none font-sans">
          <div className="w-12 h-12 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin mb-6" />
          
          {importError ? (
            <div className="max-w-md animate-in fade-in duration-300">
              <h3 className="text-lg font-black text-white mb-2">프리셋 연동에 실패했습니다</h3>
              <p className="text-xs text-zinc-400 leading-relaxed mb-6 font-semibold">{importError}</p>
              <button
                onClick={() => setIsImportLoading(false)}
                className="py-3 px-6 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-xs hover:bg-white/10 transition-all cursor-pointer"
              >
                닫고 대시보드로 가기
              </button>
            </div>
          ) : (
            <div className="animate-in fade-in duration-300">
              <h3 className="text-base font-black text-white mb-2">GlowWave 기기 간 프리셋 연동</h3>
              <p className="text-xs text-zinc-400 font-medium">{importMessage}</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

// Local Fullscreen Signboard Component (Matches HostFullscreenSignboard exactly)
interface LocalFullscreenSignboardProps {
  preset: Preset;
  onClose: () => void;
}

function LocalFullscreenSignboard({ preset, onClose }: LocalFullscreenSignboardProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const wakeLockRef = useRef<any>(null);

  // Countdown timer logic
  const [countdownVal, setCountdownVal] = useState<number | string>(preset.countdown_seconds || 10);
  useEffect(() => {
    if (preset.effect === 'countdown') {
      const startSec = preset.countdown_seconds || 10;
      setCountdownVal(startSec);
      const timer = setInterval(() => {
        setCountdownVal((prev) => {
          if (typeof prev === 'number') {
            if (prev <= 1) {
              return preset.result_text || 'START';
            }
            return prev - 1;
          }
          return prev;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [preset.text, preset.effect, preset.countdown_seconds, preset.result_text]);

  const isLuckyDrawWait = preset.effect === 'luckydraw_wait';
  const displayText = preset.effect === 'countdown'
    ? String(countdownVal)
    : isLuckyDrawWait
      ? '추첨 대기 중'
      : (preset.text || '');

  // FitText Hook
  const { containerRef, fontSize } = useFitText(
    displayText,
    preset.effect || 'none',
    preset.font_size || 100
  );

  // ESC key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        if (wakeLockRef.current) return;
        const lock = await (navigator as any).wakeLock.request('screen');
        lock.addEventListener('release', () => {
          wakeLockRef.current = null;
        });
        wakeLockRef.current = lock;
      } catch (err: any) {
        console.warn(`[LocalWakeLock] Screen lock failed: ${err.message}`);
      }
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      } catch (e) {}
    }
  };

  // Video play & Wake Lock request
  useEffect(() => {
    requestWakeLock();
    if (videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.warn('[LocalWakeLock] silent video loop playback blocked:', err);
      });
    }
    return () => {
      releaseWakeLock();
    };
  }, []);

  // Monitor visibility
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        await requestWakeLock();
        if (videoRef.current) {
          videoRef.current.play().catch(() => {});
        }
      } else {
        releaseWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Particles
  const particles = useMemo(() => {
    const effect = preset.special_effect;
    if (!effect || effect === 'none') return [];
    const count = effect === 'stars' ? 35 : effect === 'confetti' ? 45 : 30;
    const arr = [];
    for (let i = 0; i < count; i++) {
      if (effect === 'hearts') {
        arr.push({
          id: i,
          left: `${Math.random() * 100}%`,
          fontSize: `${18 + Math.random() * 26}px`,
          delay: `${Math.random() * 6}s`,
          duration: `${4 + Math.random() * 5}s`,
          sway: `${2 + Math.random() * 3}s`,
          color: ['#EF4444', '#EC4899', '#F472B6', '#F43F5E', '#D946EF'][Math.floor(Math.random() * 5)]
        });
      } else if (effect === 'confetti') {
        arr.push({
          id: i,
          left: `${Math.random() * 100}%`,
          fontSize: `${12 + Math.random() * 20}px`,
          delay: `${Math.random() * 5}s`,
          duration: `${3 + Math.random() * 4}s`,
          sway: `${1.5 + Math.random() * 2}s`,
          color: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#14B8A6'][Math.floor(Math.random() * 7)]
        });
      } else if (effect === 'stars') {
        arr.push({
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
    return arr;
  }, [preset.special_effect]);

  const isDuoSiren = preset.effect === 'blink' && !!preset.bg_color_secondary;
  const isBlink = preset.effect === 'blink';
  const isMarquee = preset.effect === 'marquee';

  const getFontFamilyClass = (fontFamily?: string) => {
    switch (fontFamily) {
      case 'sans-thin': return 'font-sign-sans-thin font-bold';
      case 'sans-thick': return 'font-sign-sans-thick font-black';
      case 'serif': return 'font-sign-serif font-bold';
      case 'neon': return 'font-sign-neon font-black';
      case 'pixel': return 'font-sign-pixel';
      case 'plump': return 'font-sign-plump font-black';
      default: return 'font-sign-sans-thin font-bold';
    }
  };

  const [showExitBtn, setShowExitBtn] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setShowExitBtn(false), 3000);
    return () => clearTimeout(timer);
  }, [showExitBtn]);

  const triggerResetControls = () => {
    setShowExitBtn(true);
    requestWakeLock();
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  return (
    <div 
      ref={containerRef}
      onClick={triggerResetControls}
      onDoubleClick={onClose}
      className={`w-full h-full flex items-center justify-center relative select-none ${
        (isDuoSiren || isBlink) ? '' : 'transition-colors duration-300'
      } ${
        isDuoSiren ? 'animate-siren' : isBlink ? 'animate-blink' : ''
      }`}
      style={{ 
        backgroundColor: isDuoSiren ? undefined : preset.bg_color,
        '--blink-duration': `${preset.speed || 1000}ms`,
        '--siren-color-1': preset.bg_color,
        '--siren-color-2': preset.bg_color_secondary || '#FFD700'
      } as React.CSSProperties}
    >
      {/* Special Effects Particle Layer */}
      {preset.special_effect && preset.special_effect !== 'none' && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          {particles.map((p: any) => {
            if (preset.special_effect === 'hearts') {
              return (
                <div
                  key={p.id}
                  className="animate-heart text-shadow-lg"
                  style={{
                    left: p.left,
                    fontSize: p.fontSize,
                    color: p.color,
                    animationName: 'float-heart, sway-heart',
                    animationDuration: `${p.duration}, ${p.sway}`,
                    animationTimingFunction: 'linear, ease-in-out',
                    animationIterationCount: 'infinite, infinite',
                    animationDelay: `${p.delay}, 0s`
                  } as React.CSSProperties}
                >
                  ❤️
                </div>
              );
            } else if (preset.special_effect === 'confetti') {
              const shapes = ['🎉', '✨', '■', '●', '▲', '✦'];
              const shape = shapes[p.id % shapes.length];
              return (
                <div
                  key={p.id}
                  className="animate-confetti"
                  style={{
                    left: p.left,
                    fontSize: p.fontSize,
                    color: p.color,
                    animationName: 'float-confetti, sway-confetti',
                    animationDuration: `${p.duration}, ${p.sway}`,
                    animationTimingFunction: 'linear, ease-in-out',
                    animationIterationCount: 'infinite, infinite',
                    animationDelay: `${p.delay}, 0s`
                  } as React.CSSProperties}
                >
                  {shape}
                </div>
              );
            } else if (preset.special_effect === 'stars') {
              const starGlyphs = ['✦', '★', '🌟', '✧', '•'];
              const glyph = starGlyphs[p.id % starGlyphs.length];
              return (
                <div
                  key={p.id}
                  className="animate-star"
                  style={{
                    left: p.left,
                    top: p.top,
                    fontSize: p.fontSize,
                    color: p.color,
                    animationName: 'twinkle-star',
                    animationDuration: p.duration,
                    animationTimingFunction: 'ease-in-out',
                    animationIterationCount: 'infinite',
                    animationDelay: p.delay
                  } as React.CSSProperties}
                >
                  {glyph}
                </div>
              );
            }
            return null;
          })}
        </div>
      )}

      {isMarquee ? (
        <div className="w-full overflow-hidden flex items-center whitespace-nowrap relative z-10 py-[2vh]">
          <div 
            className={`animate-marquee-seamless select-none leading-[1.2] flex shrink-0 gap-[4rem] pr-[4rem] ${getFontFamilyClass(preset.font_family)}`}
            style={{ 
              color: preset.text_color,
              fontSize,
              '--marquee-duration': `${preset.speed || 6000}ms`
            } as React.CSSProperties}
          >
            <span>{displayText}</span>
            <span>{displayText}</span>
            <span>{displayText}</span>
            <span>{displayText}</span>
          </div>
          <div 
            className={`animate-marquee-seamless select-none leading-[1.2] flex shrink-0 gap-[4rem] pr-[4rem] ${getFontFamilyClass(preset.font_family)}`}
            style={{ 
              color: preset.text_color,
              fontSize,
              '--marquee-duration': `${preset.speed || 6000}ms`
            } as React.CSSProperties}
            aria-hidden="true"
          >
            <span>{displayText}</span>
            <span>{displayText}</span>
            <span>{displayText}</span>
            <span>{displayText}</span>
          </div>
        </div>
      ) : (
        <div 
          className={`text-center whitespace-nowrap px-8 select-none max-w-full leading-[1.2] tracking-tighter relative z-10 ${getFontFamilyClass(preset.font_family)}`}
          style={{ 
            color: preset.text_color,
            fontSize,
            zIndex: 10
          }}
        >
          {displayText}
        </div>
      )}

      {/* Floating Exit overlay */}
      <div className={`absolute top-6 left-6 z-40 transition-opacity duration-300 ${showExitBtn ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <button
          onClick={onClose}
          className="py-2.5 px-5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 text-white font-bold text-xs tracking-wider flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 transition-all"
        >
          닫기 (Exit)
        </button>
      </div>

      <div className={`absolute bottom-6 left-6 z-40 text-[10px] text-zinc-500 transition-opacity duration-300 ${showExitBtn ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        화면을 더블클릭하거나 ESC 키를 누르면 종료됩니다.
      </div>

      {/* Sleep prevention silent video loop */}
      <video
        ref={videoRef}
        playsInline
        muted
        loop
        style={{ position: 'fixed', opacity: 0.001, pointerEvents: 'none', width: '4px', height: '4px', left: '0px', bottom: '0px', zIndex: -100 }}
        src="data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAr9tZGF0AAACoAYF//+///AAAAMmF2Y0MBZAAK/+EAGWdkAAqs2V+WXAWyAAADAAIAAAMAYB4kSywBAAZo6+PLIsAAAAAYc3R0cwAAAAAAAAABAAAAAQAAAgAAAAAcc3RzYwAAAAAAAAABAAAAAQAAAAEAAAABAAAAFHN0c3oAAAAAAAACtwAAAAEAAAAUc3RjbwAAAAAAAAABAAAAMAAAAGJ1ZHRhAAAAWm1ldGEAAAAAAAAAIWhkbHIAAAAAAAAAAG1kaXJhcHBsAAAAAAAAAAAAAAAALWlsc3QAAAAlqXRvbwAAAB1kYXRhAAAAAQAAAABMYXZmNTQuNjMuMTA0"
      />
    </div>
  );
}
