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
  Edit3,
  Globe
} from 'lucide-react';
import jsQR from 'jsqr';
import { Preset, EffectType } from '@/lib/types';
import LandscapePhoneMockup from '@/components/LandscapePhoneMockup';
import { LOCALIZED_TEMPLATES, getDefaultsByLocale } from '@/lib/templates';
import { t, Locale, getLocalizedFonts } from '@/lib/translations';
import useFitText from '@/hooks/useFitText';

// Fallback host-aligned defaults
const defaults: Preset[] = getDefaultsByLocale('ko');

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
  let text = '대시보드 로딩 중...';
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('glowwave_local_locale') || 
                  localStorage.getItem('glowwave_host_locale') || 
                  localStorage.getItem('glowwave_home_locale');
    const lang = saved || navigator.language.toLowerCase();
    if (lang.startsWith('ja')) text = 'ダッシュボード読み込み中...';
    else if (lang.startsWith('es')) text = 'Cargando tablero...';
    else if (lang.startsWith('zh-tw') || lang.startsWith('zh-cn') || lang.includes('tw')) text = '儀表板載入中...';
    else if (lang.startsWith('zh-hk') || lang.includes('hk')) text = '儀表板載入中...';
    else if (lang.startsWith('ko')) text = '대시보드 로딩 중...';
    else text = 'Loading dashboard...';
  }
  return (
    <div className="min-h-screen bg-[#030305] flex items-center justify-center text-white font-sans">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
        <p className="text-xs text-zinc-400 font-medium">{text}</p>
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

  // Active Locale State
  const [activeLocale, setActiveLocale] = useState<Locale>('ko');
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

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
  const [customTextColor, setCustomTextColor] = useState('#FFFFFF');
  const [customFontSize, setCustomFontSize] = useState<number>(100);
  const [customFontFamily, setCustomFontFamily] = useState<'sans-thin' | 'sans-thick' | 'serif' | 'neon' | 'pixel' | 'plump'>('sans-thin');
  const [customEffect, setCustomEffect] = useState<EffectType>('none');
  const [customSpeed, setCustomSpeed] = useState(5); // Range 1 to 100
  const [customSpecialEffect, setCustomSpecialEffect] = useState<'none' | 'hearts' | 'confetti' | 'stars'>('none');
  const [customCountdownSeconds, setCustomCountdownSeconds] = useState<number>(5);
  const [customResultText, setCustomResultText] = useState<string>('START');

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

  const getFontFamilyClass = (fontFamily?: string, localeOverride?: string) => {
    const loc = localeOverride || activeLocale;
    switch (fontFamily) {
      case 'sans-thin': return `font-sign-sans-thin-${loc} font-bold`;
      case 'sans-thick': return `font-sign-sans-thick-${loc} font-black`;
      case 'serif': return `font-sign-serif-${loc} font-bold`;
      case 'neon': return `font-sign-neon-${loc} font-black`;
      case 'pixel': return `font-sign-pixel-${loc}`;
      case 'plump': return `font-sign-plump-${loc} font-black`;
      default: return `font-sign-sans-thin-${loc} font-bold`;
    }
  };

  const getSpeedFactor = (effect: EffectType, ms: number) => {
    if (effect === 'blink' || effect === 'luckydraw' || effect === 'luckydraw_wait') {
      return Math.max(1, Math.min(100, Math.round(((6000 - ms) * 99) / 5900 + 1)));
    }
    if (effect === 'marquee') {
      return Math.max(1, Math.min(100, Math.round(((45000 - ms) * 99) / 43500 + 1)));
    }
    return 50;
  };

  const getSpeedMs = (effect: EffectType, factor: number) => {
    if (effect === 'blink' || effect === 'luckydraw' || effect === 'luckydraw_wait') {
      return Math.round(6000 - (factor - 1) * (5900 / 99));
    }
    if (effect === 'marquee') {
      return Math.round(45000 - (factor - 1) * (43500 / 99));
    }
    return 1000;
  };

  // Helper to import presets from API by key
  const handleImportByScannedKey = (key: string) => {
    setIsImportLoading(true);
    setImportError('');
    setImportMessage(
      {
        ko: '공유받은 프리셋 연출 팩을 다운로드하고 있습니다...',
        en: 'Downloading shared preset pack...',
        ja: '共有されたプリセットパックをダウンロードしています...',
        es: 'Descargando el paquete de ajustes compartidos...',
        'zh-TW': '正在下載共享預設包...',
        'zh-HK': '正在下載共享預設包...',
      }[activeLocale] || '공유받은 프리셋 연출 팩을 다운로드하고 있습니다...'
    );
    const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;

    fetch(`/api/preset-share?key=${key.toUpperCase()}`)
      .then(res => {
        if (!res.ok) {
          return res.json().then(d => { throw new Error(d.error || (
            {
              ko: '가져오기 실패',
              en: 'Import failed',
              ja: 'インポート失敗',
              es: 'Fallo al importar',
              'zh-TW': '匯入失敗',
              'zh-HK': '匯入失敗',
            }[activeLocale] || '가져오기 실패'
          )) });
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

          setImportMessage(
            {
              ko: '가져오기 성공! 잠시 후 자동으로 전광판이 열립니다. 🎉',
              en: 'Import successful! The signboard will open automatically. 🎉',
              ja: 'インポートに成功しました！間もなく電光掲示板が自動で開きます。🎉',
              es: '¡Importación exitosa! El letrero se abrirá automáticamente. 🎉',
              'zh-TW': '匯入成功！電子看板即將自動開啟。🎉',
              'zh-HK': '匯入成功！電子看板即將自動開啟。🎉',
            }[activeLocale] || '가져오기 성공! 잠시 후 자동으로 전광판이 열립니다. 🎉'
          );
          
          setTimeout(() => {
            setIsImportLoading(false);
            setIsStandaloneFullscreen(true);
          }, 1200);
        } else {
          throw new Error(
            {
              ko: '올바르지 않은 프리셋 데이터 형식입니다.',
              en: 'Invalid preset data format.',
              ja: '無効なプリセットデータの形式です。',
              es: 'Formato de datos de ajuste no válido.',
              'zh-TW': '無效的預設資料格式。',
              'zh-HK': '無效的預設資料格式。',
            }[activeLocale] || '올바르지 않은 프리셋 데이터 형식입니다.'
          );
        }
      })
      .then(null, err => {
        console.error(err);
        setImportError(err.message || (
          {
            ko: '만료되었거나 올바르지 않은 공유 코드입니다.',
            en: 'Expired or invalid share code.',
            ja: '期限切れまたは無効な共有コードです。',
            es: 'Código de compartición vencido o no válido.',
            'zh-TW': '共享代碼已過期或無效。',
            'zh-HK': '共享代碼已過期或無效。',
          }[activeLocale] || '만료되었거나 올바르지 않은 공유 코드입니다.'
        ));
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
      alert(
        {
          ko: '카메라 접근 권한이 필요합니다. 브라우저 설정에서 카메라 권한을 허용해 주세요.',
          en: 'Camera access is required. Please allow camera permissions in your browser settings.',
          ja: 'カメラへのアクセス権限が必要です。ブラウザの設定でカメラの权限を許可してください。',
          es: 'Se requiere acceso a la cámara. Permita los permisos de la cámara en la configuración del navegador.',
          'zh-TW': '需要相機存取權限。請在瀏覽器設定中允許相機權限。',
          'zh-HK': '需要相機存取權限。請在瀏覽器設定中允許相機權限。',
        }[activeLocale] || '카메라 접근 권한이 필요합니다. 브라우저 설정에서 카메라 권한을 허용해 주세요.'
      );
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
      let currentLocale: Locale = 'ko';
      const savedLocale = (localStorage.getItem('glowwave_local_locale') || 
                           localStorage.getItem('glowwave_host_locale') || 
                           localStorage.getItem('glowwave_home_locale')) as Locale;
      if (savedLocale && ['ko', 'en', 'ja', 'es', 'zh-TW', 'zh-HK'].includes(savedLocale)) {
        currentLocale = savedLocale;
        setActiveLocale(savedLocale);
        localStorage.setItem('glowwave_local_locale', savedLocale);
      } else {
        const navLang = navigator.language.toLowerCase();
        if (navLang.startsWith('ko')) currentLocale = 'ko';
        else if (navLang.startsWith('ja')) currentLocale = 'ja';
        else if (navLang.startsWith('es')) currentLocale = 'es';
        else if (navLang.startsWith('zh-tw') || navLang.startsWith('zh-cn')) currentLocale = 'zh-TW';
        else if (navLang.startsWith('zh-hk')) currentLocale = 'zh-HK';
        else currentLocale = 'en';
        setActiveLocale(currentLocale);
        localStorage.setItem('glowwave_local_locale', currentLocale);
      }

      const localDefaults = getDefaultsByLocale(currentLocale);
      const saved = localStorage.getItem('glowwave_local_presets');
      let presetsList: Preset[] = [];
      if (saved) {
        try {
          presetsList = JSON.parse(saved);
        } catch (e) {
          presetsList = [...localDefaults];
        }
      } else {
        presetsList = [...localDefaults];
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
      let activePreset: Preset = presetsList[0] || localDefaults[0];
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
    setCustomTextColor(preset.text_color || '#FFFFFF');
    setCustomFontSize(preset.font_size || 100);
    setCustomFontFamily((preset.font_family as any) || 'sans-thin');
    setCustomEffect(preset.effect || 'none');
    setCustomSpeed(getSpeedFactor(preset.effect || 'none', preset.speed || 1000));
    setCustomSpecialEffect(preset.special_effect || 'none');
    
    if (preset.countdown_seconds) {
      setCustomCountdownSeconds(preset.countdown_seconds);
    } else {
      setCustomCountdownSeconds(5);
    }

    if (preset.result_text) {
      setCustomResultText(preset.result_text);
    } else {
      if (preset.effect === 'countdown') {
        setCustomResultText('START');
      } else if (preset.effect === 'luckydraw_wait' || preset.effect === 'luckydraw') {
        setCustomResultText(t('lucky_draw_vibe', activeLocale));
      } else {
        setCustomResultText('START');
      }
    }
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
    if (confirm(t('confirm_reset_all', activeLocale))) {
      localStorage.removeItem('glowwave_local_presets');
      localStorage.removeItem('glowwave_local_active_preset');
      localStorage.removeItem('glowwave_local_slots');
      
      const defaultList = getDefaultsByLocale(activeLocale);
      setPresets(defaultList);
      setCurrentBroadcastPreset(defaultList[0]);
      applyPresetToController(defaultList[0]);
      setActivePresetIndex(0);
      setSavedSlots([]);
      
      localStorage.setItem('glowwave_local_presets', JSON.stringify(defaultList));
      localStorage.setItem('glowwave_local_active_preset', JSON.stringify(defaultList[0]));
      localStorage.setItem('glowwave_local_slots', JSON.stringify([]));
      alert(t('reset_success', activeLocale));
      setIsVaultOpen(false);
    }
  };

  const handleLocaleChange = (newLocale: Locale) => {
    setActiveLocale(newLocale);
    localStorage.setItem('glowwave_local_locale', newLocale);
    localStorage.setItem('glowwave_host_locale', newLocale);
    localStorage.setItem('glowwave_home_locale', newLocale);

    // If presets list is empty or matches defaults of any language, translate them
    const isOnlyDefaults = presets.length <= 6 && presets.every(p => 
      ['ko', 'en', 'ja', 'es', 'zh-TW', 'zh-HK'].some(loc => 
        getDefaultsByLocale(loc as Locale).some(d => d.text === p.text)
      )
    );

    if (isOnlyDefaults || presets.length === 0) {
      const newDefaults = getDefaultsByLocale(newLocale);
      setPresets(newDefaults);
      localStorage.setItem('glowwave_local_presets', JSON.stringify(newDefaults));
      setCurrentBroadcastPreset(newDefaults[0]);
      applyPresetToController(newDefaults[0]);
      setActivePresetIndex(0);
    }
  };

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
    if (confirm(t('confirm_delete_preset', activeLocale))) {
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
    const name = newSlotName.trim() || (
      {
        ko: `저장된 테마 #${savedSlots.length + 1}`,
        en: `Saved Theme #${savedSlots.length + 1}`,
        ja: `保存されたテーマ #${savedSlots.length + 1}`,
        es: `Tema guardado #${savedSlots.length + 1}`,
        'zh-TW': `儲存的主題 #${savedSlots.length + 1}`,
        'zh-HK': `儲存的主題 #${savedSlots.length + 1}`,
      }[activeLocale] || `저장된 테마 #${savedSlots.length + 1}`
    );
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
    if (confirm(t('confirm_delete_slot', activeLocale))) {
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
      alert(
        {
          ko: '공유 코드 생성에 실패했습니다.',
          en: 'Failed to generate share code.',
          ja: '共有コードの生成に失敗しました。',
          es: 'Error al generar el código de compartición.',
          'zh-TW': '生成共享代碼失敗。',
          'zh-HK': '生成共享代碼失敗。',
        }[activeLocale] || '공유 코드 생성에 실패했습니다.'
      );
    } finally {
      setIsSharingLoading(false);
    }
  };

  const handleImportShareCode = async () => {
    const code = shareCodeInput.trim().toUpperCase();
    if (!code || code.length !== 6) {
      alert(
        {
          ko: '올바른 6자리 공유 코드를 입력하세요.',
          en: 'Please enter a valid 6-digit share code.',
          ja: '正しい6桁の共有コードを入力してください。',
          es: 'Ingrese un código de compartición válido de 6 dígitos.',
          'zh-TW': '請輸入有效的 6 位數共享代碼。',
          'zh-HK': '請輸入有效的 6 位數共享代碼。',
        }[activeLocale] || '올바른 6자리 공유 코드를 입력하세요.'
      );
      return;
    }

    setIsSharingLoading(true);
    try {
      const res = await fetch(`/api/preset-share?key=${code}`);
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || (
          {
            ko: '가져오기 실패',
            en: 'Import failed',
            ja: 'インポート失敗',
            es: 'Fallo al importar',
            'zh-TW': '匯入失敗',
            'zh-HK': '匯入失敗',
          }[activeLocale] || '가져오기 실패'
        ));
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
        alert(
          {
            ko: '공유받은 프리셋을 정상적으로 동기화했습니다! 🎉',
            en: 'Shared presets successfully synchronized! 🎉',
            ja: '共有されたプリセットが正常に同期されました！🎉',
            es: '¡Ajustes compartidos sincronizados con éxito! 🎉',
            'zh-TW': '共享預設已成功同步！🎉',
            'zh-HK': '共享預設已成功同步！🎉',
          }[activeLocale] || '공유받은 프리셋을 정상적으로 동기화했습니다! 🎉'
        );
      } else {
        throw new Error(
          {
            ko: '올바르지 않은 프리셋 형식입니다.',
            en: 'Invalid preset format.',
            ja: '無効なプリセット形式です。',
            es: 'Formato de ajuste no válido.',
            'zh-TW': '無效的預設格式。',
            'zh-HK': '無效的預設格式。',
          }[activeLocale] || '올바르지 않은 프리셋 형식입니다.'
        );
      }
    } catch (e: any) {
      console.error(e);
      alert(
        {
          ko: e.message || '가져오기에 실패했습니다. 만료된 코드인지 확인해 보세요.',
          en: e.message || 'Import failed. Please check if the code has expired.',
          ja: e.message || 'インポートに失敗しました。期限切れのコードでないか確認してください。',
          es: e.message || 'Error al importar. Verifique si el código ha expirado.',
          'zh-TW': e.message || '匯入失敗。請檢查代碼是否已過期。',
          'zh-HK': e.message || '匯入失敗。請檢查代碼是否已過期。',
        }[activeLocale] || '가져오기에 실패했습니다. 만료된 코드인지 확인해 보세요.'
      );
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
      <header className="border-b border-white/5 bg-[#030305]/60 backdrop-blur-md relative z-30 pt-[calc(env(safe-area-inset-top,0px)+12px)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
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
            <div className="flex items-center gap-2.5">
              <span className="font-black text-white tracking-tight font-outfit text-sm uppercase">GlowWave Local</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20 font-black tracking-wider uppercase">
                {
                  {
                    ko: '1인 모드',
                    en: 'Solo Mode',
                    ja: '1人モード',
                    es: 'Modo Solo',
                    'zh-TW': '單人模式',
                    'zh-HK': '單人模式',
                  }[activeLocale] || '1인 모드'
                }
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setVaultTab('slots');
                setIsVaultOpen(true);
              }}
              className="flex items-center bg-white/5 hover:bg-white/10 border border-white/10 px-4.5 py-2 rounded-xl text-xs font-bold text-white cursor-pointer shadow-md select-none transition-all"
            >
              {t('vault_share', activeLocale)}
            </button>

            {/* Language Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-3.5 py-2 rounded-xl text-xs font-bold text-white cursor-pointer shadow-md select-none transition-all"
              >
                <Globe className="w-3.5 h-3.5 text-zinc-400" />
                <span className="uppercase">{activeLocale}</span>
              </button>
              {isLangDropdownOpen && (
                <>
                  {/* Invisible backdrop to close the dropdown when clicking outside */}
                  <div 
                    className="fixed inset-0 z-40 cursor-default" 
                    onClick={() => setIsLangDropdownOpen(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-40 rounded-2xl border border-white/10 bg-[#0c0c14]/95 backdrop-blur-lg p-1.5 shadow-2xl transition-all duration-200 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    {[
                      { code: 'ko', label: '한국어 (KR)' },
                      { code: 'en', label: 'English (US)' },
                      { code: 'ja', label: '日本語 (JP)' },
                      { code: 'es', label: 'Español (ES)' },
                      { code: 'zh-TW', label: '繁體中文 (TW)' },
                      { code: 'zh-HK', label: '繁體中文 (HK)' }
                    ].map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => {
                          handleLocaleChange(lang.code as Locale);
                          setIsLangDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          activeLocale === lang.code
                            ? 'bg-white text-black font-extrabold'
                            : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Unified HUD Status Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 w-full relative z-10">
        <div className="glass-effect rounded-2xl p-4 flex flex-wrap justify-between items-center gap-4 bg-[#12121a] border border-white/5">
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">{t('room_mode', activeLocale)}</span>
              <span className="text-sm font-mono font-black text-white">{t('solo_offline', activeLocale)}</span>
            </div>
            
            <div className="hidden sm:block w-[1px] h-8 bg-white/5" />
            
            <div>
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">{t('data_storage', activeLocale)}</span>
              <span className="text-sm font-black text-white">{t('browser_storage_unlimited', activeLocale)}</span>
            </div>

            <div className="hidden sm:block w-[1px] h-8 bg-white/5" />

            <div>
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">{t('subscription_plan', activeLocale)}</span>
              <span className="text-xs font-black text-white px-2 py-0.5 rounded-md bg-white/5 uppercase border border-white/5">
                {t('forever_free', activeLocale)}
              </span>
            </div>

            <div className="hidden sm:block w-[1px] h-8 bg-white/5" />

            <div>
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">{t('time_remaining', activeLocale)}</span>
              <span className="text-sm font-black text-zinc-300">{t('unlimited', activeLocale)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">{t('system_connection', activeLocale)}</span>
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/30 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-wider backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>{t('local_standalone', activeLocale)}</span>
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
              <h2 className="text-sm font-bold text-white font-outfit">{t('quick_preset_board', activeLocale)}</h2>
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
                {t('my_presets', activeLocale)}
              </button>
              {(LOCALIZED_TEMPLATES[activeLocale] || LOCALIZED_TEMPLATES['ko']).map((cat) => (
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
              {(activeCategory === 'custom' ? presets : ((LOCALIZED_TEMPLATES[activeLocale] || LOCALIZED_TEMPLATES['ko']).find(c => c.id === activeCategory)?.presets || [])).map((preset, index) => {
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
                      title={activeCategory === 'custom' ? t('edit', activeLocale) : t('import_edit', activeLocale)}
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
                      text: t('new_preset', activeLocale),
                      text_color: '#FFFFFF',
                      effect: 'none',
                      speed: 1000
                    };
                    setEditingPresetIndex(presets.length);
                    setEditingPreset(newPreset);
                  }}
                  className="h-24 rounded-2xl border border-dashed border-white/10 hover:border-white/30 bg-transparent flex items-center justify-center p-6 transition-all hover:bg-white/[0.01] active:scale-[0.97] cursor-pointer text-zinc-500 hover:text-white"
                >
                  <span className="text-sm font-bold">
                    {
                      {
                        ko: '새 연출 추가',
                        en: 'Add Preset',
                        ja: 'プリセットを追加',
                        es: 'Añadir ajuste',
                        'zh-TW': '新增預設',
                        'zh-HK': '新增預設',
                      }[activeLocale] || '새 연출 추가'
                    }
                  </span>
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
            <p className="text-[11px] text-zinc-500 mb-4 self-start">
              {
                {
                  ko: '현재 전광판으로 내보내고 있는 실시간 화면 미리보기입니다.',
                  en: 'This is a real-time preview of the current signboard screen.',
                  ja: '現在電光掲示板に表示されているリアルタイムプレビューです。',
                  es: 'Esta es una vista previa en tiempo real del letrero actual.',
                  'zh-TW': '這是目前電子看板的即時預覽。',
                  'zh-HK': '這是目前電子看板的即時預覽。',
                }[activeLocale] || '현재 전광판으로 내보내고 있는 실시간 화면 미리보기입니다.'
              }
            </p>
            
            <div className="w-full max-w-[420px] flex flex-col items-center">
              <div className="w-full flex justify-center py-2 border-y border-white/5 bg-black/20 rounded-xl relative group overflow-hidden">
                <LandscapePhoneMockup preset={currentBroadcastPreset} />
                
                <button
                  type="button"
                  onClick={() => setIsStandaloneFullscreen(true)}
                  className="hidden lg:flex absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center text-white font-bold text-xs cursor-pointer"
                >
                  {t('fullscreen_my_screen', activeLocale)}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsStandaloneFullscreen(true)}
                className="mt-3 w-full py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 active:scale-[0.99] text-white font-bold text-xs tracking-wider flex items-center justify-center transition-all cursor-pointer border border-white/10 hover:border-white/20 shadow-md"
              >
                {t('use_device_signboard', activeLocale)}
              </button>
            </div>

            {currentBroadcastPreset.effect === 'luckydraw_wait' && (
              <div className="w-full mt-4 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleDrawWinner}
                  className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-black text-xs tracking-wider flex items-center justify-center transition-all shadow-xl shadow-amber-500/20 cursor-pointer border border-amber-300"
                >
                  {t('publish_draw_result', activeLocale)}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Item 3: 즉석 라이브 메시지 전송 */}
        <div className="order-3 lg:col-span-8 flex flex-col w-full min-w-0">
          <div className="glass-effect rounded-2xl p-4 sm:p-6 bg-[#12121a] border border-white/5">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/5">
              <h2 className="text-sm font-bold text-white">{t('instant_live_broadcast', activeLocale)}</h2>
            </div>
            
            <div className="flex flex-col gap-5">
              <div className="flex gap-3 items-center">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value.slice(0, 15))}
                    placeholder={
                      {
                        ko: '즉석 구호 입력 (예: 소리질러!)',
                        en: 'Enter instant text (e.g. Make some noise!)',
                        ja: 'スローガン入力 (例：声を出せ！)',
                        es: 'Texto instantáneo (ej: ¡Haz ruido!)',
                        'zh-TW': '輸入即時文字 (例：叫出來！)',
                        'zh-HK': '輸入即時文字 (例：叫出來！)',
                      }[activeLocale] || '즉석 구호 입력 (예: 소리질러!)'
                    }
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
                    const calculatedSpeed = getSpeedMs(customEffect, customSpeed);
                    
                    const customPreset: Preset = {
                      bg_color: customBgColor,
                      text: customText.trim() || (customEffect === 'luckydraw_wait' ? t('raffle_win', activeLocale) : 'GLOW WAVE'),
                      text_color: customTextColor,
                      effect: customEffect,
                      speed: calculatedSpeed,
                      font_size: customFontSize,
                      font_family: customFontFamily,
                      special_effect: customSpecialEffect,
                      countdown_seconds: customEffect === 'countdown' ? customCountdownSeconds : undefined,
                      result_text: (customEffect === 'countdown' || customEffect === 'luckydraw_wait') ? customResultText : undefined
                    };
                    triggerPreset(customPreset, -1);
                  }}
                  className="btn-primary h-[48px] px-6 rounded-xl text-xs font-black flex items-center justify-center cursor-pointer shrink-0"
                >
                  {t('broadcast', activeLocale)}
                </button>
              </div>

              {/* Controls Grid */}
              <div className="flex flex-col gap-6 pt-5 border-t border-white/5">
                {/* Row 1: Theme, Text Color, Text Size */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* 배경 테마 */}
                  <div className="lg:col-span-4 flex flex-col gap-2">
                    <span className="text-xs md:text-sm font-extrabold text-zinc-400 tracking-wider">{t('bg_color', activeLocale)}</span>
                    <div className="flex flex-wrap items-center gap-2 bg-black/45 p-2 rounded-xl border border-white/5 min-h-12">
                      {[
                        '#EF4444', '#3B82F6', '#10B981', '#8B5CF6', '#F97316', '#EC4899', '#FFFFFF', '#0B0B0F'
                      ].map((hex) => (
                        <button
                          key={hex}
                          type="button"
                          onClick={() => {
                            setCustomBgColor(hex);
                            setCustomTextColor(hex === '#FFFFFF' ? '#000000' : '#FFFFFF');
                          }}
                          className={`w-6.5 h-6.5 rounded-full border cursor-pointer transition-all ${
                            customBgColor === hex
                              ? 'border-white scale-110 shadow-md'
                              : hex === '#0B0B0F'
                                ? 'border-white/25 hover:scale-105'
                                : 'border-transparent hover:scale-105'
                          }`}
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                      
                      <div 
                        className="w-6.5 h-6.5 rounded-full overflow-hidden border border-white/10 hover:scale-110 transition-transform shadow-md cursor-pointer relative shrink-0" 
                        style={{ background: 'linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8b00ff)' }}
                        title={
                          {
                            ko: '커스텀 색상 선택',
                            en: 'Select custom color',
                            ja: 'カスタム色の選択',
                            es: 'Seleccionar color personalizado',
                            'zh-TW': '選擇自訂顏色',
                            'zh-HK': '選擇自訂顏色',
                          }[activeLocale] || '커스텀 색상 선택'
                        }
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

                  {/* 글자 색상 */}
                  <div className="lg:col-span-4 flex flex-col gap-2">
                    <span className="text-xs md:text-sm font-extrabold text-zinc-400 tracking-wider">{t('text_color', activeLocale)}</span>
                    <div className="flex flex-wrap items-center gap-2 bg-black/45 p-2 rounded-xl border border-white/5 min-h-12">
                      {[
                        '#FFFFFF', '#000000', '#FFD700', '#EF4444', '#10B981', '#3B82F6'
                      ].map((hex) => (
                        <button
                          key={hex}
                          type="button"
                          onClick={() => setCustomTextColor(hex)}
                          className={`w-6.5 h-6.5 rounded-full border cursor-pointer transition-all ${
                            customTextColor === hex
                              ? 'border-white scale-110 shadow-md'
                              : hex === '#000000'
                                ? 'border-white/25 hover:scale-105'
                                : 'border-transparent hover:scale-105'
                          }`}
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                      
                      {/* Custom Color Palette */}
                      <div 
                        className="w-6.5 h-6.5 rounded-full overflow-hidden border border-white/10 hover:scale-110 transition-transform shadow-md cursor-pointer relative shrink-0" 
                        style={{ background: 'linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8b00ff)' }}
                        title={
                          {
                            ko: '커스텀 글자 색상 선택',
                            en: 'Select custom text color',
                            ja: 'カスタム文字色の選択',
                            es: 'Seleccionar color de texto personalizado',
                            'zh-TW': '選擇自訂文字顏色',
                            'zh-HK': '選擇自訂文字顏色',
                          }[activeLocale] || '커스텀 글자 색상 선택'
                        }
                      >
                        <input
                          type="color"
                          value={customTextColor}
                          onChange={(e) => setCustomTextColor(e.target.value)}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-150"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 글자 크기 */}
                  <div className="lg:col-span-4 flex flex-col gap-2">
                    <div className="flex justify-between text-xs md:text-sm font-extrabold text-zinc-400 tracking-wider">
                      <span>
                        {
                          {
                            ko: '글자 크기',
                            en: 'Text Size',
                            ja: '文字サイズ',
                            es: 'Tamaño de texto',
                            'zh-TW': '文字大小',
                            'zh-HK': '文字大小',
                          }[activeLocale] || '글자 크기'
                        }
                      </span>
                      <span className="text-indigo-400 font-extrabold">{customFontSize}%</span>
                    </div>
                    <div className="flex items-center bg-black/45 px-3 rounded-xl border border-white/5 h-12">
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
                </div>

                {/* Row 2: Font Style, Motion Effect */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-5 border-t border-white/5">
                  {/* 글꼴 스타일 */}
                  <div className="lg:col-span-6 flex flex-col gap-2">
                    <span className="text-xs md:text-sm font-extrabold text-zinc-400 tracking-wider">
                      {
                        {
                          ko: '글꼴 스타일',
                          en: 'Font Style',
                          ja: 'フォントスタイル',
                          es: 'Estilo de fuente',
                          'zh-TW': '字型樣式',
                          'zh-HK': '字型樣式',
                        }[activeLocale] || '글꼴 스타일'
                      }
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 bg-black/45 p-1.5 rounded-xl border border-white/5 items-center">
                      {getLocalizedFonts(activeLocale).map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => handleFontSelect(item.val as any, false)}
                          style={{ fontFamily: item.fontFamily, fontWeight: item.fontWeight as any }}
                          className={`py-2 px-0.5 rounded-lg text-xs md:text-sm transition-all cursor-pointer whitespace-nowrap ${
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

                  {/* 모션 효과 */}
                  <div className="lg:col-span-6 flex flex-col gap-2">
                    <span className="text-xs md:text-sm font-extrabold text-zinc-400 tracking-wider">
                      {
                        {
                          ko: '모션 효과',
                          en: 'Motion Effect',
                          ja: 'モーション効果',
                          es: 'Efecto de movimiento',
                          'zh-TW': '動態效果',
                          'zh-HK': '動態效果',
                        }[activeLocale] || '모션 효과'
                      }
                    </span>
                    <div className="grid grid-cols-5 gap-1.5 bg-black/45 p-1.5 rounded-xl border border-white/5 h-12 items-center">
                      {[
                        { val: 'none', label: t('static', activeLocale) },
                        { val: 'blink', label: t('blink', activeLocale) },
                        { val: 'marquee', label: t('scroll', activeLocale) },
                        { val: 'countdown', label: t('timer', activeLocale) },
                        { val: 'luckydraw_wait', label: t('raffle', activeLocale) }
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => {
                            setCustomEffect(item.val as any);
                            setCustomSpeed(getSpeedFactor(item.val as any, 1000));
                          }}
                          className={`h-full rounded-lg text-xs md:text-sm font-bold transition-all cursor-pointer ${
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
                </div>

                {/* Row 3: Special Effect */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-5 border-t border-white/5">
                  {/* 특수 효과 */}
                  <div className="lg:col-span-12 flex flex-col gap-2">
                    <span className="text-xs md:text-sm font-extrabold text-zinc-400 tracking-wider">{t('special_effect', activeLocale)}</span>
                    <div className="grid grid-cols-4 gap-1.5 bg-black/45 p-1.5 rounded-xl border border-white/5 items-center min-h-12">
                      {[
                        { val: 'none', label: t('none', activeLocale) },
                        { val: 'hearts', label: t('hearts', activeLocale) },
                        { val: 'confetti', label: t('confetti', activeLocale) },
                        { val: 'stars', label: t('stars', activeLocale) }
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => setCustomSpecialEffect(item.val as any)}
                          className={`py-2 px-0.5 rounded-lg text-xs md:text-sm font-bold transition-all cursor-pointer ${
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

              {/* Countdown Settings */}
              {customEffect === 'countdown' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5 border-t border-white/5 animate-in fade-in duration-200">
                  <div className="flex flex-col gap-2">
                    <span className="text-xs md:text-sm font-extrabold text-zinc-400 tracking-wider">
                      {
                        {
                          ko: '카운트다운 시간',
                          en: 'Countdown Time',
                          ja: 'カウントダウン時間',
                          es: 'Tiempo de cuenta regresiva',
                          'zh-TW': '倒數時間',
                          'zh-HK': '倒數時間',
                        }[activeLocale] || '카운트다운 시간'
                      }
                    </span>
                    <div className="grid grid-cols-5 gap-1.5 bg-black/45 p-1.5 rounded-xl border border-white/5 h-12 items-center">
                      {[3, 5, 10, 30, 60].map((sec) => (
                        <button
                          type="button"
                          key={sec}
                          onClick={() => setCustomCountdownSeconds(sec)}
                          className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            customCountdownSeconds === sec
                              ? 'bg-white text-black shadow-sm font-extrabold'
                              : 'text-zinc-400 hover:text-white hover:bg-white/[0.02]'
                          }`}
                        >
                          {
                            {
                              ko: `${sec}초`,
                              en: `${sec}s`,
                              ja: `${sec}秒`,
                              es: `${sec}s`,
                              'zh-TW': `${sec}秒`,
                              'zh-HK': `${sec}秒`,
                            }[activeLocale] || `${sec}초`
                          }
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-xs md:text-sm font-extrabold text-zinc-400 tracking-wider">
                      {
                        {
                          ko: '종료 시 출력 문구',
                          en: 'Completion Message',
                          ja: '終了時表示文言',
                          es: 'Mensaje de finalización',
                          'zh-TW': '結束顯示文字',
                          'zh-HK': '結束顯示文字',
                        }[activeLocale] || '종료 시 출력 문구'
                      }
                    </span>
                    <input
                      type="text"
                      value={customResultText}
                      onChange={(e) => setCustomResultText(e.target.value.slice(0, 15))}
                      placeholder="START"
                      className="w-full bg-black/45 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white text-xs md:text-sm font-semibold h-12"
                      maxLength={15}
                    />
                  </div>
                </div>
              )}

              {/* Lucky Draw Settings */}
              {customEffect === 'luckydraw_wait' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5 border-t border-white/5 animate-in fade-in duration-200">
                  <div className="flex flex-col gap-2">
                    <span className="text-xs md:text-sm font-extrabold text-zinc-400 tracking-wider">
                      {
                        {
                          ko: '당첨 시 문구 (즉석 구호 입력란에서 수정)',
                          en: 'Winner Message (Edit in main text field)',
                          ja: '当選時の表示（メイン入力欄で編集）',
                          es: 'Mensaje ganador (Editar en campo principal)',
                          'zh-TW': '中獎訊息（在主輸入欄編輯）',
                          'zh-HK': '中獎訊息（在主輸入欄編輯）',
                        }[activeLocale] || '당첨 시 문구 (즉석 구호 입력란에서 수정)'
                      }
                    </span>
                    <div className="flex items-center bg-black/30 px-4 rounded-xl border border-white/5 h-12 text-xs md:text-sm text-zinc-400 font-semibold select-none">
                      {customText || '당첨!'}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-xs md:text-sm font-extrabold text-zinc-400 tracking-wider">
                      {
                        {
                          ko: '낙첨 시 출력 문구',
                          en: 'Non-winner Message',
                          ja: '落選時の表示文言',
                          es: 'Mensaje de no ganador',
                          'zh-TW': '未中獎顯示文字',
                          'zh-HK': '未中獎顯示文字',
                        }[activeLocale] || '낙첨 시 출력 문구'
                      }
                    </span>
                    <input
                      type="text"
                      value={customResultText}
                      onChange={(e) => setCustomResultText(e.target.value.slice(0, 15))}
                      placeholder={
                        {
                          ko: '아쉽네요! 다음 기회에..',
                          en: 'Better luck next time!',
                          ja: '残念！次の機会に..',
                          es: '¡Más suerte la próxima vez!',
                          'zh-TW': '真可惜！下次還有機會..',
                          'zh-HK': '真可惜！下次還有機會..',
                        }[activeLocale] || '아쉽네요! 다음 기회에..'
                      }
                      className="w-full bg-black/45 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white text-xs md:text-sm font-semibold h-12"
                      maxLength={15}
                    />
                  </div>
                </div>
              )}

              {/* Speed Controller */}
              {(customEffect === 'blink' || customEffect === 'marquee' || customEffect === 'luckydraw_wait') && (
                <div className="pt-4 border-t border-white/5 animate-in fade-in duration-200">
                  <div className="flex justify-between text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-2.5">
                    <span>
                      {
                        {
                          ko: '전송 애니메이션 속도 조절',
                          en: 'Adjust Transmission Animation Speed',
                          ja: '送信アニメーション速度の調整',
                          es: 'Ajustar velocidad de animación de transmisión',
                          'zh-TW': '調整傳送動畫速度',
                          'zh-HK': '調整傳送動畫速度',
                        }[activeLocale] || '전송 애니메이션 속도 조절'
                      }
                    </span>
                    <span className="text-indigo-400 font-extrabold">
                      {
                        {
                          ko: '속도',
                          en: 'Speed',
                          ja: '速度',
                          es: 'Velocidad',
                          'zh-TW': '速度',
                          'zh-HK': '速度',
                        }[activeLocale] || '속도'
                      }: {customSpeed}%
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
                  {
                    {
                      ko: '현재 설정을 내 프리셋에 추가',
                      en: 'Add current setting to my presets',
                      ja: '現在の設定をマイプリセットに追加',
                      es: 'Añadir ajuste actual a mis ajustes',
                      'zh-TW': '將目前設定新增至我的預設',
                      'zh-HK': '將目前設定新增至我的預設',
                    }[activeLocale] || '현재 설정을 내 프리셋에 추가'
                  }
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Item 4: 1인 모드 이용 가이드 & 보관 안내 (Short impact text card) */}
        <div className="order-4 lg:col-span-4 flex flex-col gap-6 w-full min-w-0">
          <div className="glass-effect rounded-2xl p-6 text-xs text-zinc-400 leading-relaxed flex flex-col gap-4 bg-[#12121a] border border-white/5">
            <h3 className="font-bold text-white text-sm">
              {
                {
                  ko: '1인 모드 이용 가이드 & 보관 안내',
                  en: 'Solo Mode User Guide & Storage Info',
                  ja: '1人モード利用ガイド＆保存案内',
                  es: 'Guía de usuario de Modo Solo e información de almacenamiento',
                  'zh-TW': '單人模式使用指南與儲存說明',
                  'zh-HK': '單人模式使用指南與儲存說明',
                }[activeLocale] || '1인 모드 이용 가이드 & 보관 안내'
              }
            </h3>
            
            <div className="flex flex-col gap-3.5">
              <div>
                <strong className="text-zinc-200 block text-[11px] mb-1">
                  {
                    {
                      ko: '더블 탭으로 나가기',
                      en: 'Double-tap to Exit',
                      ja: 'ダブルタップで終了',
                      es: 'Doble toque para salir',
                      'zh-TW': '連點兩下退出',
                      'zh-HK': '連點兩下退出',
                    }[activeLocale] || '더블 탭으로 나가기'
                  }
                </strong>
                <p className="text-[10.5px]">
                  {
                    {
                      ko: '전광판 화면을 **더블 클릭** (또는 ESC 키)하면 대시보드로 돌아옵니다.',
                      en: 'Double-click the signboard screen (or press ESC) to return to the dashboard.',
                      ja: '電光掲示板画面をダブルクリック（またはESCキー）するとダッシュボードに戻ります。',
                      es: 'Haga doble clic en la pantalla del letrero (o presione ESC) para volver al tablero.',
                      'zh-TW': '連按兩下電子看板畫面（或按 ESC 鍵）即可返回儀表板。',
                      'zh-HK': '連按兩下電子看板畫面（或按 ESC 鍵）即可返回儀表板。',
                    }[activeLocale] || '전광판 화면을 **더블 클릭** (또는 ESC 키)하면 대시보드로 돌아옵니다.'
                  }
                </p>
              </div>
              
              <div>
                <strong className="text-zinc-200 block text-[11px] mb-1">
                  {
                    {
                      ko: '화면 자동 켜짐 유지',
                      en: 'Keep Screen Awake',
                      ja: '画面の常時点灯を維持',
                      es: 'Mantener pantalla encendida',
                      'zh-TW': '螢幕自動保持開啟',
                      'zh-HK': '螢幕自動保持開啟',
                    }[activeLocale] || '화면 자동 켜짐 유지'
                  }
                </strong>
                <p className="text-[10.5px]">
                  {
                    {
                      ko: '전광판이 켜진 동안에는 폰이 **절전 모드로 들어가지 않고** 화면이 유지됩니다.',
                      en: 'While the signboard is active, your phone will not go to sleep, and the screen stays on.',
                      ja: '電光掲示板が表示されている間は、スマートフォンがスリープモードに入らず画面が点灯し続けます。',
                      es: 'Mientras el letrero esté activo, su teléfono no entrará en modo de suspensión y la pantalla permanecerá encendida.',
                      'zh-TW': '電子看板開啟期間，手機不會進入休眠狀態，螢幕將保持開啟。',
                      'zh-HK': '電子看板開啟期間，手機不會进入休眠狀態，螢幕將保持開啟。',
                    }[activeLocale] || '전광판이 켜진 동안에는 폰이 **절전 모드로 들어가지 않고** 화면이 유지됩니다.'
                  }
                </p>
              </div>
              
              <div className="border-t border-white/5 pt-3">
                <strong className="text-zinc-200 block text-[11px] mb-1">
                  {
                    {
                      ko: '기기에 안전하게 자동 보존',
                      en: 'Automatically Saved Safely to Device',
                      ja: '端末に安全に自動保存',
                      es: 'Guardado automático seguro en el dispositivo',
                      'zh-TW': '安全自動儲存於裝置',
                      'zh-HK': '安全自動儲存於裝置',
                    }[activeLocale] || '기기에 안전하게 자동 보존'
                  }
                </strong>
                <p className="text-[10.5px]">
                  {
                    {
                      ko: '수정한 프리셋들은 **브라우저에 자동 저장**됩니다. 방문 기록(캐시/쿠키)을 청소하면 데이터가 소멸할 수 있으니, 소중한 디자인 세트는 상단의 **[보관 & 공유]** 메뉴에서 모바일로 백업해 두세요!',
                      en: 'Modified presets are automatically saved in the browser. Clearing browser history/cache may delete data, so backup your precious design sets on mobile using the [Vault & Share] menu!',
                      ja: '編集したプリセットはブラウザに自動保存されます。履歴（キャッシュ/クッキー）を削除するとデータが消える可能性があるため、大切なデザインは上部の【保管＆共有】メニューからモバイルにバックアップしてください！',
                      es: 'Los ajustes modificados se guardan automáticamente en el navegador. Limpiar el historial (caché/cookies) puede borrar los datos, ¡así que haga una copia de seguridad en el menú [Bóveda y Compartir]!',
                      'zh-TW': '修改後的預設會自動儲存於瀏覽器中。清除瀏覽器紀錄（快取/Cookie）可能會導致資料遺失，請務必使用上方の [保管與分享] 選單將珍貴的設計備份至行動裝置！',
                      'zh-HK': '修改後的預設會自動儲存於瀏覽器中。清除瀏覽器紀錄（快取/Cookie）可能會導致資料遺失，請務必使用上方的 [保管與分享] 選單將珍貴의設計備份至行動裝置！',
                    }[activeLocale] || '수정한 프리셋들은 **브라우저에 자동 저장**됩니다. 방문 기록(캐시/쿠키)을 청소하면 데이터가 소멸할 수 있으니, 소중한 디자인 세트는 상단의 **[보관 & 공유]** 메뉴에서 모바일로 백업해 두세요!'
                  }
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
                      const isDark = hex === '#0B0B0F';
                      return (
                        <button
                          key={hex}
                          type="button"
                          onClick={() => setEditingPreset(prev => ({ ...prev!, bg_color: hex }))}
                          className={`h-9 rounded-lg border cursor-pointer transition-all relative flex items-center justify-center ${
                            isSelected 
                              ? 'border-white scale-105 shadow-md' 
                              : `border-white/10 hover:border-white/30 ${isDark ? 'border-white/25 bg-black' : ''}`
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
                        const isDark = hex === '#0B0B0F';
                        return (
                          <button
                            key={hex}
                            type="button"
                            onClick={() => setEditingPreset(prev => ({ ...prev!, bg_color_secondary: hex }))}
                            className={`h-9 rounded-lg border cursor-pointer transition-all relative flex items-center justify-center ${
                              isSelected 
                                ? 'border-white scale-105 shadow-md' 
                                : `border-white/10 hover:border-white/30 ${isDark ? 'border-white/25 bg-black' : ''}`
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
                  <div className="grid grid-cols-6 gap-2">
                    {[
                      '#FFFFFF', '#000000', '#FFD700', '#EF4444', '#10B981', '#3B82F6'
                    ].map((hex) => {
                      const isSelected = editingPreset.text_color === hex;
                      const dotColor = hex === '#FFFFFF' ? '#000000' : '#FFFFFF';
                      const isDark = hex === '#000000';
                      return (
                        <button
                          key={hex}
                          type="button"
                          onClick={() => setEditingPreset(prev => ({ ...prev!, text_color: hex }))}
                          className={`h-9 rounded-lg border cursor-pointer transition-all relative flex items-center justify-center ${
                            isSelected 
                              ? 'border-white scale-105 shadow-md' 
                              : `border-white/10 hover:border-white/30 ${isDark ? 'border-white/25 bg-black' : ''}`
                          }`}
                          style={{ backgroundColor: hex }}
                        >
                          {isSelected && (
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dotColor }} />
                          )}
                        </button>
                      );
                    })}

                    {/* Custom Color Palette */}
                    <div 
                      className="h-9 rounded-lg overflow-hidden border border-white/10 hover:scale-105 transition-all shadow-md cursor-pointer relative flex items-center justify-center" 
                      style={{ background: 'linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8b00ff)' }}
                      title="커스텀 글자 색상 선택"
                    >
                      <input
                        type="color"
                        value={editingPreset.text_color}
                        onChange={(e) => setEditingPreset(prev => ({ ...prev!, text_color: e.target.value }))}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-150"
                      />
                      {!['#FFFFFF', '#000000', '#FFD700', '#EF4444', '#10B981', '#3B82F6'].includes(editingPreset.text_color) && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                      )}
                    </div>
                  </div>
                </div>

                {/* 글꼴 스타일 */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">글꼴 스타일</label>
                  <div className="grid grid-cols-3 gap-1 bg-black/40 p-1 rounded-xl border border-white/5 items-center font-medium">
                    {getLocalizedFonts(activeLocale).map((item) => (
                      <button
                        type="button"
                        key={item.val}
                        onClick={() => handleFontSelect(item.val as any, true)}
                        style={{ fontFamily: item.fontFamily, fontWeight: item.fontWeight as any }}
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
            className="absolute inset-0 bg-black/90 backdrop-blur-lg transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsVaultOpen(false)}
          />

          <div className="bg-neutral-950/95 border border-white/10 rounded-[2rem] max-w-2xl w-full p-6 sm:p-8 relative z-10 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto font-sans text-left">
            <button 
              onClick={() => setIsVaultOpen(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white p-2 hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-black text-white leading-tight tracking-tight font-outfit">보관함 및 연출 공유</h2>
              <p className="text-sm text-zinc-400 mt-2 font-medium">
                전광판 프리셋을 기기에 안전하게 저장하거나 다른 기기로 전송합니다.
              </p>
            </div>

            {/* Modal Internal Tabs */}
            <div className="flex border-b border-white/10 gap-1.5 mb-8 overflow-x-auto pb-1.5 scrollbar-none">
              {[
                { tab: 'slots', label: '내 기기에 보관' },
                { tab: 'share', label: '무선 전송 (보내기/받기)' },
                { tab: 'sync', label: '여러 기기 연결 (싱크)' }
              ].map((t) => (
                <button
                  key={t.tab}
                  type="button"
                  onClick={() => setVaultTab(t.tab as any)}
                  className={`px-5 py-2.5 text-xs sm:text-sm font-extrabold rounded-xl transition-all active:scale-95 shrink-0 whitespace-nowrap ${
                    vaultTab === t.tab 
                      ? 'bg-white/10 border border-white/15 text-white shadow-md' 
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab 1: Slots Vault */}
            {vaultTab === 'slots' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="bg-black/40 border border-white/5 rounded-2xl p-5">
                  <h4 className="text-sm font-bold text-white mb-1.5">내 기기 브라우저 보관함</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    현재 프리셋 구성을 슬롯에 보관해 두고 필요할 때 클릭 한 번으로 빠르게 다시 불러옵니다.
                  </p>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSlotName}
                    onChange={(e) => setNewSlotName(e.target.value.slice(0, 15))}
                    placeholder="저장할 테마 이름 입력"
                    className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/40 focus:bg-black/60 text-sm font-semibold transition-colors"
                    maxLength={15}
                  />
                  <button
                    onClick={handleSaveSlotPackage}
                    className="px-5 py-3 rounded-xl bg-white hover:bg-zinc-200 text-black text-sm font-extrabold transition-all cursor-pointer shrink-0 shadow-md active:scale-95"
                  >
                    슬롯 저장
                  </button>
                </div>

                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {savedSlots.length > 0 ? (
                    savedSlots.map((slot, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleLoadSlotPackage(idx)}
                        className="group flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 rounded-2xl cursor-pointer transition-all active:scale-[0.99]"
                      >
                        <div className="min-w-0 pr-4">
                          <span className="text-sm font-semibold text-white block truncate">{slot.name}</span>
                          <span className="text-xs text-zinc-400 font-medium font-mono mt-1 block">프리셋 {slot.presets?.length || 0}개 수록</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">불러오기 &rarr;</span>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteSlotPackage(idx, e)}
                            className="p-2 text-zinc-500 hover:text-red-400 hover:bg-white/5 rounded-lg transition-all cursor-pointer active:scale-90"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.01] p-10 text-center text-zinc-500 font-bold text-xs">
                      보관된 테마가 없습니다. 이름을 입력하고 슬롯을 추가해 보세요.
                    </div>
                  )}
                </div>

                {/* Integration of Backup warnings & Reset */}
                <div className="pt-6 border-t border-white/5 space-y-6">
                  <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl text-left flex items-start gap-3">
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b] mt-1.5" />
                    <div className="flex-1">
                      <span className="text-xs text-zinc-300 font-bold block mb-1">브라우저 캐시 주의</span>
                      <span className="text-xs text-zinc-400 leading-relaxed block">
                        가입이 없는 로컬 전용 모드로, 인터넷 캐시/쿠키 청소 시 저장된 보관함 슬롯도 함께 지워집니다. 안전한 보관을 위해 가끔 <b>[무선 전송 (보내기/받기)]</b> 탭에서 다른 기기로 백업하여 안전하게 복사해 두시길 권장합니다.
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-left gap-4">
                    <div className="min-w-0 pr-4">
                      <span className="text-xs text-zinc-400 font-bold block">대시보드 리셋</span>
                      <span className="text-xs text-zinc-500 mt-1 block">모든 프리셋과 보관함을 초기 기본값으로 리셋합니다.</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetDashboard}
                      className="py-2.5 px-4 rounded-xl border border-white/10 text-zinc-400 hover:text-red-400 hover:border-red-500/30 bg-white/5 hover:bg-red-500/10 cursor-pointer text-xs font-bold transition-all text-center active:scale-95 shrink-0 hover:shadow-[0_0_12px_rgba(239,68,68,0.1)]"
                    >
                      전체 초기 리셋
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Wireless Sharing */}
            {vaultTab === 'share' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="bg-black/40 border border-white/5 rounded-2xl p-5">
                  <h4 className="text-sm font-bold text-white mb-1.5">기기 간 무선 전송</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
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
                    className={`flex-1 py-2.5 text-xs font-extrabold rounded-lg transition-all active:scale-95 ${
                      shareMode === 'send' 
                        ? 'bg-white/10 text-white shadow border border-white/10' 
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    내 프리셋 보내기 (QR 생성)
                  </button>
                  <button
                    type="button"
                    onClick={() => setShareMode('receive')}
                    className={`flex-1 py-2.5 text-xs font-extrabold rounded-lg transition-all active:scale-95 ${
                      shareMode === 'receive' 
                        ? 'bg-white/10 text-white shadow border border-white/10' 
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    다른 프리셋 가져오기 (스캔/입력)
                  </button>
                </div>

                {/* Sub-tab A: Send (공유하기) */}
                {shareMode === 'send' && (
                  <div className="space-y-4 animate-in fade-in duration-150">
                    <div className="bg-black/50 border border-white/5 p-6 rounded-2xl flex flex-col items-center gap-4 text-center min-h-[180px] justify-center relative">
                      {isSharingLoading ? (
                        <span className="text-sm text-zinc-400 animate-pulse">임시 무선 연동 토큰 생성 중...</span>
                      ) : shareQrUrl ? (
                        <div className="flex flex-col items-center gap-4 animate-in fade-in duration-200">
                          <div className="bg-white p-3 rounded-2xl shadow-2xl">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={shareQrUrl} alt="Preset Share QR" className="w-40 h-40 rounded-xl" />
                          </div>
                          <span className="text-xs text-zinc-300 font-bold">
                            📱 상대방 스마트폰 카메라로 비추면 즉시 내 프리셋이 복사 적용됩니다!
                          </span>
                          
                          <div className="flex items-center gap-2 mt-1 bg-black/45 px-4 py-2.5 rounded-xl border border-white/10">
                            <span className="text-sm font-mono text-white font-extrabold uppercase tracking-widest">{exportCode}</span>
                            <button
                              onClick={handleCopyShareCodeText}
                              className="text-xs text-zinc-300 hover:text-white font-extrabold transition-colors active:scale-95 pl-2 border-l border-white/15"
                            >
                              {isCodeCopied ? '복사 완료' : '코드 복사'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="py-6 px-4 text-center space-y-4">
                          <p className="text-xs text-zinc-400 leading-relaxed">
                            현재 기기에 세팅된 원터치 프리셋 패키지를 다른 폰으로 바로 전송할 수 있는 QR 코드를 만듭니다.
                          </p>
                          <button
                            onClick={handleGenerateShareCode}
                            className="w-full py-4 rounded-xl bg-white text-black font-extrabold text-xs shadow-lg hover:bg-zinc-200 transition-all cursor-pointer flex items-center justify-center active:scale-95"
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
                  <div className="space-y-4 animate-in fade-in duration-150">
                    {isScanning ? (
                      <div className="flex flex-col items-center gap-4 bg-black/40 border border-white/5 p-5 rounded-2xl">
                        <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-white/10 flex items-center justify-center">
                          <video
                            ref={scannerVideoRef}
                            className="w-full h-full object-cover"
                            playsInline
                            muted
                          />
                          {/* Custom Neon laser scanning line overlay */}
                          <div className="absolute inset-x-0 h-0.5 bg-white/80 animate-bounce top-1/2 shadow-[0_0_8px_#ffffff]" />
                          <canvas ref={scannerCanvasRef} className="hidden" />
                        </div>
                        <button
                          type="button"
                          onClick={stopScanning}
                          className="w-full py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-bold transition-all cursor-pointer active:scale-95"
                        >
                          스캔 취소
                        </button>
                      </div>
                    ) : (
                      <div className="bg-black/40 border border-white/5 p-5 rounded-2xl space-y-5">
                        <div className="space-y-2">
                          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">방법 A: 카메라로 즉시 스캔</span>
                          <button
                            type="button"
                            onClick={startScanning}
                            className="w-full py-3.5 rounded-xl border border-dashed border-white/15 hover:border-white/30 hover:bg-white/[0.02] text-zinc-300 hover:text-white font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                          >
                            카메라 QR 스캔 켜기
                          </button>
                        </div>

                        <div className="h-[1px] bg-white/5" />

                        <div className="space-y-2">
                          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">방법 B: 6자리 코드 입력</span>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={shareCodeInput}
                              onChange={(e) => setShareCodeInput(e.target.value.toUpperCase())}
                              placeholder="6자리 코드 입력 (예: X8Y3ZA)"
                              className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white tracking-widest text-center text-sm font-black focus:outline-none focus:border-white/40 focus:bg-black/65 uppercase font-mono"
                              maxLength={6}
                            />
                            <button
                              onClick={handleImportShareCode}
                              className="px-5 rounded-xl bg-white text-black text-xs font-black hover:bg-zinc-200 transition-colors cursor-pointer shrink-0 active:scale-95"
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
                <div className="bg-black/40 border border-white/5 rounded-2xl p-5">
                  <h4 className="text-sm font-bold text-white mb-1.5">여러 기기 연결 (싱크)</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    현재 프리셋 세팅을 가져와 다수의 관객 스마트폰 화면들을 실시간 조종하는 멀티 싱크 방을 개설합니다.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Option A */}
                  <div className="glass-effect rounded-2xl p-5 border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-all flex flex-col justify-between text-left active:scale-[0.99] min-h-[220px]">
                    <div>
                      <span className="text-[10px] font-mono text-zinc-400 font-extrabold uppercase block tracking-wider mb-2">FREE PLAN</span>
                      <h3 className="text-base font-black text-white mb-2">일부 제한 연동 (무료 방)</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                        상위 6개 프리셋만 동기화하여 무료 방을 개설합니다. (유료 폰트 및 파티클은 자동 제외)
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleStartImportRoom('free')}
                      className="w-full py-3 rounded-xl border border-white/10 hover:bg-white/5 text-zinc-300 font-bold text-xs transition-all cursor-pointer text-center active:scale-95"
                    >
                      무료 방 개설
                    </button>
                  </div>

                  {/* Option B */}
                  <div className="rounded-2xl p-5 border border-white/15 bg-white/[0.02] hover:bg-white/[0.04] transition-all flex flex-col justify-between text-left relative overflow-hidden group shadow-lg shadow-white/5 active:scale-[0.99] min-h-[220px]">
                    <div>
                      <span className="text-[10px] font-mono text-white font-extrabold block tracking-wider mb-2">PREMIUM PLAN</span>
                      <h3 className="text-base font-black text-white mb-2">무손실 100% 연동 (유료 방)</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                        모든 연출 프리셋과 프리미엄 폰트, 별빛/하트 등 특수 효과를 완벽하게 유지하여 개설합니다.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleStartImportRoom('premium')}
                      className="w-full py-3 rounded-xl bg-white hover:bg-zinc-200 text-black font-extrabold text-xs transition-all cursor-pointer text-center active:scale-95"
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
    const loc = preset.locale || 'ko';
    switch (fontFamily) {
      case 'sans-thin': return `font-sign-sans-thin-${loc} font-bold`;
      case 'sans-thick': return `font-sign-sans-thick-${loc} font-black`;
      case 'serif': return `font-sign-serif-${loc} font-bold`;
      case 'neon': return `font-sign-neon-${loc} font-black`;
      case 'pixel': return `font-sign-pixel-${loc}`;
      case 'plump': return `font-sign-plump-${loc} font-black`;
      default: return `font-sign-sans-thin-${loc} font-bold`;
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
