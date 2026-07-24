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
  Globe,
  FolderHeart,
  ArrowLeft,
  Smartphone,
  Copy,
  ExternalLink,
  QrCode,
  RotateCw
} from 'lucide-react';
import jsQR from 'jsqr';
import { Preset, EffectType, TierType, TIER_CONFIGS } from '@/lib/types';
import LandscapePhoneMockup from '@/components/LandscapePhoneMockup';
import { LOCALIZED_TEMPLATES, getDefaultsByLocale } from '@/lib/templates';
import { t, Locale, getLocalizedFonts } from '@/lib/translations';
import useFitText from '@/hooks/useFitText';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { CustomAlertModal, CustomConfirmModal } from '@/components/CustomModal';

const LOCAL_SYNC_TRANSLATIONS: Record<Locale, {
  start_sync: string;
  stop_sync: string;
  sync_active: string;
  sync_active_desc: string;
  copy_link: string;
  copied: string;
  qr_code: string;
  qr_tip: string;
  qr_toggle_show: string;
  qr_toggle_hide: string;
  warning_safari: string;
}> = {
  ko: {
    start_sync: '📱 스마트폰/태블릿 실시간 연동 시작',
    stop_sync: '실시간 연동 해제 (종료)',
    sync_active: '실시간 모바일 연동 활성화됨',
    sync_active_desc: '아래 QR 코드를 다른 스마트폰/태블릿 카메라로 스캔하거나 링크를 복사하여 브라우저에 띄우면, 현재 컨트롤러에서 조작하는 자막과 연출이 0.1초 만에 실시간으로 전광판처럼 동기화됩니다.',
    copy_link: '연동 화면 주소 복사',
    copied: '복사 완료!',
    qr_code: '연동 QR 코드',
    qr_tip: '스마트폰 카메라로 비추면 바로 전광판으로 작동합니다.',
    qr_toggle_show: 'QR 코드 보기',
    qr_toggle_hide: 'QR 코드 숨기기',
    warning_safari: '※ 기기의 화면이 꺼지지 않도록 화면을 계속 켜두세요.'
  },
  en: {
    start_sync: '📱 Start Mobile/Tablet Sync',
    stop_sync: 'Disconnect Real-time Sync',
    sync_active: 'Real-time Sync Active',
    sync_active_desc: 'Scan the QR code with another smartphone/tablet camera or copy the link to open it in a browser. The screens will sync as a signboard in 0.1s.',
    copy_link: 'Copy Sync Screen URL',
    copied: 'Copied!',
    qr_code: 'Sync QR Code',
    qr_tip: 'Point your phone camera to use it as a signboard instantly.',
    qr_toggle_show: 'Show QR Code',
    qr_toggle_hide: 'Hide QR Code',
    warning_safari: '* Keep the screen on so the signboard remains active.'
  },
  ja: {
    start_sync: '📱 スマホ/タブレット連동開始',
    stop_sync: 'リアルタイム連動解除 (終了)',
    sync_active: 'リアルタイム連動が有効です',
    sync_active_desc: '他のスマホやタブレットのカメラでQRコードをスキャンするか、リンクをコピーしてブラウザで開いてください。操作内容が0.1秒で同期されます。',
    copy_link: '連動画面のURLをコピー',
    copied: 'コピー完了！',
    qr_code: '連動用QRコード',
    qr_tip: 'カメラでスキャンすると、すぐに電光掲示板として動作します。',
    qr_toggle_show: 'QRコードを表示',
    qr_toggle_hide: 'QRコードを非表示',
    warning_safari: '※ 画面が消えないように、そのまま表示しておいてください。'
  },
  es: {
    start_sync: '📱 Iniciar Sincronización Móvil',
    stop_sync: 'Desconectar Sincronización',
    sync_active: 'Sincronización Activa',
    sync_active_desc: 'Escanee el código QR con otra cámara de teléfono/tableta o copie el enlace para abrirlo en el navegador. La pantalla se sincronizará en 0.1s.',
    copy_link: 'Copiar Enlace de Sincronización',
    copied: '¡Copiado!',
    qr_code: 'Código QR de Sincronización',
    qr_tip: 'Apunte con la cámara para usarlo como letrero al instante.',
    qr_toggle_show: 'Mostrar código QR',
    qr_toggle_hide: 'Ocultar código QR',
    warning_safari: '* Mantenga la pantalla encendida para que el letrero no se apague.'
  },
  'zh-TW': {
    start_sync: '📱 啟動行動裝置/平板連動',
    stop_sync: '解除實時連動 (結束)',
    sync_active: '實時行動連動已啟用',
    sync_active_desc: '使用其他手機/平板相機掃描下方 QR Code，或複製連結在瀏覽器中開啟，即可在 0.1 秒內同步呈現電子看板畫面。',
    copy_link: '複製連動畫面連結',
    copied: '複製成功！',
    qr_code: '連動 QR Code',
    qr_tip: '用手機相機掃描即可立即用作電子看板。',
    qr_toggle_show: '顯示 QR Code',
    qr_toggle_hide: '隱藏 QR Code',
    warning_safari: '※ 請保持螢幕開啟以防止看板關閉。'
  },
  'zh-HK': {
    start_sync: '📱 啟動行動裝置/平板連動',
    stop_sync: '解除實時連動 (結束)',
    sync_active: '實時行動連動已啟用',
    sync_active_desc: '使用其他手機/平板相機掃描下方 QR Code，或複製連結在瀏覽器中開啟，即可在 0.1 秒內同步呈現電子看板畫面。',
    copy_link: '複製連動畫面連結',
    copied: '複製成功！',
    qr_code: '連動 QR Code',
    qr_tip: '用手機相機掃描即可立即用作電子看板。',
    qr_toggle_show: '顯示 QR Code',
    qr_toggle_hide: '隱藏 QR Code',
    warning_safari: '※ 請保持螢幕開啟以防止看板關閉。'
  }
};

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
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  let text = '';
  if (mounted && typeof window !== 'undefined') {
    const saved = localStorage.getItem('glowwave_local_locale') || 
                  localStorage.getItem('glowwave_host_locale') || 
                  localStorage.getItem('glowwave_home_locale');
    const lang = (saved || navigator.language || '').toLowerCase();
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
        <p className="text-xs text-zinc-400 font-medium h-4">{text}</p>
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

const DEFAULT_PRESET_TEXTS = new Set([
  // Korean
  '단색', '부드러운 깜빡이', '경찰 사이렌', '사이키', '당첨!', '스크롤', '카운트다운', '앰비언트',
  // English
  'Solid Color', 'Soft Blink', 'Psychedelic', 'Winner!', 'Scroll', 'Countdown',
  // Japanese
  '単色', 'ゆっくり点滅', 'サイケデリック', 'アタリ！', 'スクロール', 'カウントダウン',
  // Spanish
  'Color Sólido', 'Parpadeo Suave', '¡A BAILAR!', '¡GANADOR!', 'Desplazar', 'Cuenta Atrás',
  // Traditional Chinese (TW)
  '單色', '呼吸閃爍', '狂歡霓虹', '中獎！', '滾動跑馬燈', '倒數計時',
  // Traditional Chinese (HK)
  '單色', '呼吸閃爍', '狂歡霓虹', '中獎！', '滾動跑馬燈', '倒數計時'
]);

const DEFAULT_PRESET_MAP: Record<string, number> = {
  // Index 0: Solid Color
  '단색': 0, 'Solid Color': 0, '単色': 0, 'Color Sólido': 0, '單色': 0, '앰비언트': 0,
  // Index 1: Soft Blink
  '부드러운 깜빡이': 1, 'Soft Blink': 1, 'ゆっくり点滅': 1, 'Parpadeo Suave': 1, '呼吸閃爍': 1,
  // Index 2: Psychedelic
  '사이키': 2, 'Psychedelic': 2, 'サイケデリック': 2, '¡A BAILAR!': 2, '狂歡霓虹': 2,
  // Index 3: Winner!
  '당첨!': 3, 'Winner!': 3, 'アタリ！': 3, '¡GANADOR!': 3, '中獎！': 3,
  // Index 4: Scroll
  '스크롤': 4, 'Scroll': 4, 'Desplazar': 4, '滾動跑馬燈': 4,
  // Index 5: Countdown
  '카운트다운': 5, 'Countdown': 5, 'カウントダウン': 5, 'Cuenta Atrás': 5, '倒數計時': 5
};

const translateDefaultPresets = (presetsList: Preset[], targetLocale: Locale): Preset[] => {
  const targetDefaults = getDefaultsByLocale(targetLocale);
  const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
  return presetsList.map(p => {
    const cleaned = p.text.replace(emojiRegex, '').trim();
    if (cleaned in DEFAULT_PRESET_MAP) {
      const idx = DEFAULT_PRESET_MAP[cleaned];
      const defaultPreset = targetDefaults[idx];
      if (defaultPreset) {
        return {
          ...p,
          text: defaultPreset.text,
          result_text: (p.effect === 'countdown' && (!p.result_text || p.result_text === 'START' || p.result_text === '시작' || p.result_text === 'スタート' || p.result_text === '¡EMPEZAR!' || p.result_text === '開始'))
            ? defaultPreset.result_text
            : (p.effect === 'luckydraw_wait' && (!p.result_text || p.result_text === '아쉽네요! 다음 기회에..' || p.result_text === 'Good luck next time!' || p.result_text === '残念！また今度ね..' || p.result_text === '¡Suerte la próxima!' || p.result_text === '沒中，再接再厲！' || p.result_text === '冇中，下次好運！'))
              ? defaultPreset.result_text
              : p.result_text
        };
      }
    }
    return p;
  });
};

function LocalSignboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Active Locale State
  const [activeLocale, setActiveLocale] = useState<Locale>('ko');
  
  // Dynamic system templates cache to bypass compile caching on client-side
  const [systemTemplates, setSystemTemplates] = useState<Record<Locale, any>>(LOCALIZED_TEMPLATES);

  useEffect(() => {
    const fetchLiveTemplates = async () => {
      try {
        const res = await fetch('/api/admin/templates');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.templates) {
            setSystemTemplates(data.templates);
            console.log('[GlowWave Local] Loaded fresh template presets from live API.');
          }
        }
      } catch (err) {
        console.warn('[GlowWave Local] Live templates fetch error, using statically bundled fallback:', err);
      }
    };
    fetchLiveTemplates();
  }, []);
  const maxTextLength = (activeLocale === 'en' || activeLocale === 'es') ? 20 : 15;
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

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

  // Real-time mobile sync state
  const [syncRoomId, setSyncRoomId] = useState<string>('');
  const [customAlert, setCustomAlert] = useState<{ isOpen: boolean; message: string; title?: string } | null>(null);
  const [customConfirm, setCustomConfirm] = useState<{ isOpen: boolean; message: string; title?: string; onConfirm: () => void } | null>(null);
  const showAlert = (message: string, title?: string) => {
    setCustomAlert({ isOpen: true, message, title });
  };
  const showConfirm = (message: string, onConfirm: () => void, title?: string) => {
    setCustomConfirm({ isOpen: true, message, onConfirm, title });
  };
  const [syncHostToken, setSyncHostToken] = useState<string>('');
  const [isSyncCreating, setIsSyncCreating] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isSyncQrVisible, setIsSyncQrVisible] = useState<boolean>(false);
  const [syncRoomTier, setSyncRoomTier] = useState<string>('free');
  const [syncRoomCreatedAt, setSyncRoomCreatedAt] = useState<string>('');
  const [syncRoomActiveParticipants, setSyncRoomActiveParticipants] = useState<number>(0);
  const [syncTimeRemaining, setSyncTimeRemaining] = useState<string>('');
  const [syncRoomPasscode, setSyncRoomPasscode] = useState<string>('');

  // Real-time mobile sync refs for persistent connection
  const supabaseChannelRef = useRef<any>(null);
  const localSseRef = useRef<EventSource | null>(null);

  // Sync Room Recovery states
  const [syncRecoveryEmail, setSyncRecoveryEmail] = useState('');
  const [syncRecoveryOtp, setSyncRecoveryOtp] = useState('');
  const [syncRecoveryOtpSent, setSyncRecoveryOtpSent] = useState(false);
  const [isSyncRecoveryLoading, setIsSyncRecoveryLoading] = useState(false);
  const [syncRecoveryRooms, setSyncRecoveryRooms] = useState<any[]>([]);
  const [syncRecoveryMessage, setSyncRecoveryMessage] = useState('');

  // Reset Sync Recovery state when Vault open status changes
  useEffect(() => {
    if (!isVaultOpen) {
      setSyncRecoveryEmail('');
      setSyncRecoveryOtp('');
      setSyncRecoveryOtpSent(false);
      setSyncRecoveryRooms([]);
      setSyncRecoveryMessage('');
    }
  }, [isVaultOpen]);

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
      showAlert(
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

      // Automatically translate matching default presets to currentLocale
      if (presetsList.length === 0) {
        presetsList = [...localDefaults];
      } else {
        presetsList = translateDefaultPresets(presetsList, currentLocale);
      }
      localStorage.setItem('glowwave_local_presets', JSON.stringify(presetsList));

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

      // Translate activePreset if it is a default one
      const activeTrimmed = activePreset.text.trim();
      if (activeTrimmed in DEFAULT_PRESET_MAP) {
        const idx = DEFAULT_PRESET_MAP[activeTrimmed];
        const newDefaults = getDefaultsByLocale(currentLocale);
        if (newDefaults[idx]) {
          activePreset = {
            ...activePreset,
            text: newDefaults[idx].text,
            result_text: (activePreset.effect === 'countdown' && (!activePreset.result_text || activePreset.result_text === 'START' || activePreset.result_text === '시작' || activePreset.result_text === 'スタート' || activePreset.result_text === '¡EMPEZAR!' || activePreset.result_text === '開始'))
              ? newDefaults[idx].result_text
              : (activePreset.effect === 'luckydraw_wait' && (!activePreset.result_text || activePreset.result_text === '아쉽네요! 다음 기회에..' || activePreset.result_text === 'Good luck next time!' || activePreset.result_text === '残念！また今度ね..' || activePreset.result_text === '¡Suerte la próxima!' || activePreset.result_text === '沒中，再接再厲！' || activePreset.result_text === '冇中，下次好運！'))
                ? newDefaults[idx].result_text
                : activePreset.result_text
          };
        }
      }

      setCurrentBroadcastPreset(activePreset);
      applyPresetToController(activePreset);

      const savedPackages = localStorage.getItem('glowwave_local_slots');
      if (savedPackages) {
        try {
          setSavedSlots(JSON.parse(savedPackages));
        } catch (e) {}
      }

      // Restore mobile sync room and token from localStorage or URL parameter
      const params = new URLSearchParams(window.location.search);
      const urlRoomId = params.get('room_id');
      
      let targetRoomId = '';
      let targetHostToken = '';
      let targetTier = 'free';
      let targetCreatedAt = '';

      if (urlRoomId && urlRoomId.startsWith('SYNC-')) {
        targetRoomId = urlRoomId;
        const savedRoomId = localStorage.getItem('glowwave_local_sync_room_id');
        if (savedRoomId === urlRoomId) {
          targetHostToken = localStorage.getItem('glowwave_local_sync_host_token') || '';
          targetTier = localStorage.getItem('glowwave_local_sync_room_tier') || 'free';
          targetCreatedAt = localStorage.getItem('glowwave_local_sync_room_created_at') || '';
        } else {
          const recentRaw = localStorage.getItem('glowwave_recent_rooms');
          if (recentRaw) {
            try {
              const recents = JSON.parse(recentRaw);
              const matched = recents.find((r: any) => r.roomId === urlRoomId);
              if (matched) {
                targetHostToken = matched.host_session_token || matched.hostSessionToken || '';
                targetTier = matched.tier || 'free';
                targetCreatedAt = matched.createdAt || matched.created_at || '';
              }
            } catch (e) {}
          }
          localStorage.setItem('glowwave_local_sync_room_id', urlRoomId);
          localStorage.setItem('glowwave_local_sync_host_token', targetHostToken);
          localStorage.setItem('glowwave_local_sync_room_tier', targetTier);
          if (targetCreatedAt) {
            localStorage.setItem('glowwave_local_sync_room_created_at', targetCreatedAt);
          }
        }
      } else {
        targetRoomId = localStorage.getItem('glowwave_local_sync_room_id') || '';
        targetHostToken = localStorage.getItem('glowwave_local_sync_host_token') || '';
        targetTier = localStorage.getItem('glowwave_local_sync_room_tier') || 'free';
        targetCreatedAt = localStorage.getItem('glowwave_local_sync_room_created_at') || '';
      }

      if (targetRoomId && targetRoomId.startsWith('SYNC-')) {
        setSyncRoomId(targetRoomId);
        setSyncHostToken(targetHostToken);
        setSyncRoomTier(targetTier);
        if (targetCreatedAt) {
          setSyncRoomCreatedAt(targetCreatedAt);
        }
      }

      // Check import search query
      const importKey = params.get('import');
      if (importKey) {
        handleImportByScannedKey(importKey);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      // Log local dashboard loaded funnel step (step2_create)
      fetch('/api/funnel/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'step2_create' })
      }).catch(() => {});

      setIsHydrated(true);
    }
  }, []);

  // Poll sync room status & Maintain real-time socket/SSE connection for participants and zero-latency preset pushes
  useEffect(() => {
    if (!syncRoomId) {
      // Cleanup on disconnect
      if (supabaseChannelRef.current && supabase) {
        supabase.removeChannel(supabaseChannelRef.current);
        supabaseChannelRef.current = null;
      }
      if (localSseRef.current) {
        localSseRef.current.close();
        localSseRef.current = null;
      }
      return;
    }

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/room/status?ids=${syncRoomId}`);
        if (!res.ok) {
          if (res.status === 404) {
            handleStopMobileSync();
          }
          return;
        }
        const data = await res.json();
        const roomInfo = data.rooms?.[0];
        if (roomInfo) {
          if (roomInfo.is_expired) {
            handleStopMobileSync();
          } else {
            setSyncRoomTier(roomInfo.tier);
            setSyncRoomCreatedAt(roomInfo.created_at);
            setSyncRoomPasscode(roomInfo.passcode || '');
            // If local SSE mode, we fallback to polling for participants count if SSE doesn't push it
            if (!isSupabaseConfigured()) {
              setSyncRoomActiveParticipants(roomInfo.current_participants || 0);
            }
          }
        } else {
          // Room was likely deleted by the administrator, reset to local standalone
          handleStopMobileSync();
        }
      } catch (e) {
        console.error('Failed to fetch sync room status:', e);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000);

    // Setup persistent real-time channel
    if (isSupabaseConfigured() && supabase) {
      console.log('[Local Sync] Establishing persistent Supabase Realtime channel for room:', syncRoomId);
      const channel = supabase.channel(`room_${syncRoomId}`, {
        config: {
          broadcast: { ack: false }
        }
      });

      channel
        .on('presence', { event: 'sync' }, () => {
          const presenceState = channel.presenceState();
          let count = 0;
          Object.keys(presenceState).forEach((key) => {
            const presences = presenceState[key] as any[];
            presences.forEach((p) => {
              if (p.role !== 'host') count++;
            });
          });
          console.log('[Local Sync] Supabase Realtime presence count updated:', count);
          setSyncRoomActiveParticipants(count);
          // Sync real-time count to Supabase Database for serverless cap verification
          if (supabase) {
            supabase.from('rooms').update({ current_participants: count }).eq('id', syncRoomId).then(({ error }) => {
              if (error) console.error('[Local Sync] Failed to sync current_participants to DB:', error);
            });
          }
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('[Local Sync] Subscribed to Supabase Realtime channel');
            // Track dashboard presence as host
            channel.track({ role: 'host', joined_at: new Date().toISOString() });
          }
        });

      supabaseChannelRef.current = channel;
    } else {
      // Setup Local SSE Stream connection for zero-latency sync in mock database mode
      console.log('[Local Sync] Establishing persistent Local SSE Stream for room:', syncRoomId);
      const sse = new EventSource(`/api/room/${syncRoomId}/stream?role=host`);
      localSseRef.current = sse;

      sse.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.event === 'presence') {
            console.log('[Local Sync] SSE presence count updated:', data.count);
            setSyncRoomActiveParticipants(data.count || 0);
          }
        } catch (err) {
          console.error('[Local Sync] Failed to parse SSE event:', err);
        }
      };

      sse.onerror = (err) => {
        console.error('[Local Sync] Local SSE connection error:', err);
      };
    }

    return () => {
      clearInterval(interval);
      if (supabaseChannelRef.current && supabase) {
        supabase.removeChannel(supabaseChannelRef.current);
        supabaseChannelRef.current = null;
      }
      if (localSseRef.current) {
        localSseRef.current.close();
        localSseRef.current = null;
      }
    };
  }, [syncRoomId]);

  // Calculate trial countdown timer
  useEffect(() => {
    if (!syncRoomId || !syncRoomCreatedAt || !['free', 'lite', 'pro', 'max'].includes(syncRoomTier)) {
      setSyncTimeRemaining('');
      return;
    }

    const updateTimer = () => {
      const created = new Date(syncRoomCreatedAt).getTime();
      const limit = syncRoomTier === 'free' ? 1 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
      const now = Date.now();
      const diff = created + limit - now;

      if (diff <= 0) {
        setSyncTimeRemaining('Expired');
        handleStopMobileSync();
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        const pad = (n: number) => String(n).padStart(2, '0');
        setSyncTimeRemaining(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [syncRoomId, syncRoomCreatedAt, syncRoomTier]);

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

    // Real-time mobile sync broadcast
    if (syncRoomId && syncHostToken) {
      if (isSupabaseConfigured() && supabaseChannelRef.current && supabase) {
        // Zero-latency instant WebSocket push (takes ~0.1s)
        supabaseChannelRef.current.send({
          type: 'broadcast',
          event: 'render',
          payload: presetWithTrigger
        });
        // Also persist state asynchronously in background
        supabase.from('rooms').update({ current_state: presetWithTrigger }).eq('id', syncRoomId).then(({ error }) => {
          if (error) console.error('[Local Sync] Failed to persist state in Supabase DB:', error);
        });
      } else {
        // Fallback: POST to Broadcast Route (for Local SSE mode)
        fetch(`/api/room/${syncRoomId}/broadcast`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            host_session_token: syncHostToken,
            preset: presetWithTrigger
          })
        }).catch((err) => console.error('[Local Sync] Failed to broadcast:', err));
      }
    }
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

    // Real-time mobile sync broadcast
    if (syncRoomId && syncHostToken) {
      if (isSupabaseConfigured() && supabaseChannelRef.current && supabase) {
        // Zero-latency instant WebSocket push (takes ~0.1s)
        supabaseChannelRef.current.send({
          type: 'broadcast',
          event: 'render',
          payload: drawResultPreset
        });
        // Also persist state asynchronously in background
        supabase.from('rooms').update({ current_state: drawResultPreset }).eq('id', syncRoomId).then(({ error }) => {
          if (error) console.error('[Local Sync] Failed to persist winner state in Supabase DB:', error);
        });
      } else {
        fetch(`/api/room/${syncRoomId}/broadcast`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            host_session_token: syncHostToken,
            preset: drawResultPreset
          })
        }).catch((err) => console.error('[Local Sync] Failed to draw winner:', err));
      }
    }
  };

  const handleResetDashboard = () => {
    showConfirm(
      t('confirm_reset_all', activeLocale),
      () => {
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
        showAlert(t('reset_success', activeLocale));
        setIsVaultOpen(false);
      },
      activeLocale === 'ko' ? '대시보드 초기화' : 'Reset Dashboard'
    );
  };

  const handleStartMobileSync = async (isRegenerate = false) => {
    if (isSyncCreating) return;
    setIsSyncCreating(true);
    try {
      // Reuse existing local sync room if it is still within 1-hour duration to prevent API spamming
      if (!isRegenerate) {
        const savedRoomId = localStorage.getItem('glowwave_local_sync_room_id');
        const savedHostToken = localStorage.getItem('glowwave_local_sync_host_token');
        const savedCreatedAt = localStorage.getItem('glowwave_local_sync_room_created_at');
        
        if (savedRoomId && savedHostToken && savedCreatedAt) {
          const createdAt = new Date(savedCreatedAt);
          if (Date.now() - createdAt.getTime() < 1 * 60 * 60 * 1000) {
            setSyncRoomId(savedRoomId);
            setSyncHostToken(savedHostToken);
            setSyncRoomTier(localStorage.getItem('glowwave_local_sync_room_tier') || 'free');
            setSyncRoomCreatedAt(savedCreatedAt);
            
            showAlert(
              activeLocale === 'ko'
                ? '기존에 생성된 일일무료체험방 세션이 존재하여 해당 방으로 자동 연결됩니다.'
                : 'An active free trial room exists. Reconnecting to your existing room.'
            );
            
            setIsVaultOpen(false);
            setIsSyncCreating(false);
            return;
          }
        }
      }

      if (isRegenerate && syncRoomId) {
        // 보안용 접속 코드 재발급 API 호출!
        const res = await fetch('/api/room/regenerate-id', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: syncRoomId,
            hostSessionToken: syncHostToken
          })
        });

        if (!res.ok) {
          throw new Error('Failed to regenerate room ID');
        }

        const data = await res.json();
        if (data.success && data.new_room_id) {
          const oldRoomId = syncRoomId;
          setSyncRoomId(data.new_room_id);
          
          // 로컬 스토리지 정보 갱신
          localStorage.setItem('glowwave_local_sync_room_id', data.new_room_id);

          // 최근 방 목록(glowwave_recent_rooms)에도 방 ID 교체
          try {
            const recentRaw = localStorage.getItem('glowwave_recent_rooms');
            if (recentRaw) {
              const recents = JSON.parse(recentRaw);
              const target = recents.find((r: any) => r.roomId === oldRoomId);
              if (target) {
                target.roomId = data.new_room_id;
              }
              localStorage.setItem('glowwave_recent_rooms', JSON.stringify(recents));
            }
          } catch (e) {
            console.error('Failed to update recent rooms list:', e);
          }

          showAlert(activeLocale === 'ko' ? '연동 코드가 재발급되었습니다. 새 코드로 기기를 연동해 주세요.' : 'Connection code regenerated. Please pair again.');
        } else {
          throw new Error(data.error || 'Regenerate API returned fail');
        }
      } else {
        // 기존 룸 신규 생성 로직 그대로 작동
        const bodyPayload: {
          email: string;
          tier: string;
          passcode: string;
          is_sync: boolean;
          created_at?: string;
        } = {
          email: 'anonymous-local@glowwave.app',
          tier: 'free',
          passcode: '',
          is_sync: true
        };

        const res = await fetch('/api/room/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyPayload)
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData.error || 'Failed to create sync room';
          if (errMsg.includes('이미 활성화된 1인 체험방')) {
            const localizedMsg = {
              ko: '이미 활성화된 1인 체험방이 존재합니다. 기존 방의 만료 시간(1시간)이 지난 후에 새로운 무료 방을 개설할 수 있습니다.',
              en: 'An active Free Trial Room already exists. You can create a new one after the existing one expires (1 hour).',
              ja: 'アクティブな1人体験ルームがすでに存在します。既存のルーム가満了（1時間）した後に新しい無料ルームを作成できます。',
              es: 'Ya existe una sala de prueba gratuita activa. Puedes crear una nueva después de que la existente expire (1 hora).',
              'zh-TW': '已存在使用中的單人體驗房。您可以在現有房間過期（1 小時）後建立新的免費房間。',
              'zh-HK': '已存在使用中的單人體驗房。您可以在現有房間過期（1 小時）後建立新的免費房間。'
            }[activeLocale] || errMsg;
            throw new Error(localizedMsg);
          }
          throw new Error(errMsg);
        }
        const data = await res.json();
        setSyncRoomId(data.room_id);
        setSyncHostToken(data.host_session_token);
        setSyncRoomTier(data.tier || 'free');
        setSyncRoomPasscode(data.passcode || '');
        
        const createdAtToSave = new Date().toISOString();
        setSyncRoomCreatedAt(createdAtToSave);
        
        localStorage.setItem('glowwave_local_sync_room_id', data.room_id);
        localStorage.setItem('glowwave_local_sync_host_token', data.host_session_token);
        localStorage.setItem('glowwave_local_sync_room_created_at', createdAtToSave);

        try {
          const recentRaw = localStorage.getItem('glowwave_recent_rooms');
          let recents = recentRaw ? JSON.parse(recentRaw) : [];
          recents = recents.filter((r: any) => r.roomId !== data.room_id);
          recents.unshift({
            roomId: data.room_id,
            role: 'host',
            tier: data.tier || 'free',
            createdAt: createdAtToSave,
            hostSessionToken: data.host_session_token // 복원용 세션 매핑
          });
          localStorage.setItem('glowwave_recent_rooms', JSON.stringify(recents.slice(0, 50)));
        } catch (e) {
          console.error('[local] Failed to update glowwave_recent_rooms:', e);
        }

        // Initialize room broadcast with the current preset
        await fetch(`/api/room/${data.room_id}/broadcast`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            host_session_token: data.host_session_token,
            preset: currentBroadcastPreset
          })
        });
      }
      
      // Close vault modal on successful sync start
      setIsVaultOpen(false);
    } catch (err: any) {
      showAlert(
        activeLocale === 'ko' 
          ? `실시간 연동 시작/재발급 실패: ${err.message}` 
          : `Failed to start or regenerate sync: ${err.message}`
      );
    } finally {
      setIsSyncCreating(false);
    }
  };

  const handleStopMobileSync = () => {
    setSyncRoomId('');
    setSyncHostToken('');
    setSyncRoomTier('free');
    setSyncRoomCreatedAt('');
    setSyncRoomActiveParticipants(0);
    setSyncTimeRemaining('');
    setSyncRoomPasscode('');
  };

  const handleRecoverSyncRooms = async () => {
    const email = syncRecoveryEmail.trim().toLowerCase();
    if (!email) {
      setSyncRecoveryMessage(
        activeLocale === 'ko' 
          ? '이메일 주소를 입력해 주세요.' 
          : 'Please enter your email address.'
      );
      return;
    }

    setIsSyncRecoveryLoading(true);
    setSyncRecoveryMessage('');
    setSyncRecoveryRooms([]);

    try {
      const res = await fetch(`/api/room/recover?email=${encodeURIComponent(email)}`);
      if (!res.ok) {
        let errDesc = activeLocale === 'ko' ? '활성화된 방을 찾지 못했습니다.' : 'No active rooms found for this email.';
        try {
          const errData = await res.json();
          if (errData.error) errDesc = errData.error;
        } catch (e) {}
        throw new Error(errDesc);
      }
      
      setSyncRecoveryOtpSent(true);
      setSyncRecoveryMessage(
        activeLocale === 'ko'
          ? '입력하신 이메일로 6자리 일회용 보안코드(OTP) 메일이 발송되었습니다.'
          : 'A 6-digit one-time password (OTP) mail has been sent to your email.'
      );
    } catch (err: any) {
      console.error(err);
      setSyncRecoveryMessage(
        activeLocale === 'ko'
          ? (err.message || '조회 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')
          : 'An error occurred during lookup. Please try again.'
      );
    } finally {
      setIsSyncRecoveryLoading(false);
    }
  };

  const handleVerifySyncRoomsOtp = async () => {
    const email = syncRecoveryEmail.trim().toLowerCase();
    const otp = syncRecoveryOtp.trim();
    if (!otp) {
      setSyncRecoveryMessage(
        activeLocale === 'ko' ? '보안코드를 입력해 주세요.' : 'Please enter the security code.'
      );
      return;
    }

    setIsSyncRecoveryLoading(true);
    setSyncRecoveryMessage('');

    try {
      const res = await fetch(`/api/room/recover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      if (!res.ok) {
        let errDesc = activeLocale === 'ko' ? '올바르지 않거나 만료된 보안코드입니다.' : 'Invalid or expired OTP code.';
        try {
          const errData = await res.json();
          if (errData.error) errDesc = errData.error;
        } catch (e) {}
        throw new Error(errDesc);
      }

      const data = await res.json();
      if (data.rooms && data.rooms.length > 0) {
        const sortedRooms = [...data.rooms].sort((a, b) => {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        setSyncRecoveryRooms(sortedRooms);
        setSyncRecoveryMessage(
          activeLocale === 'ko'
            ? `${data.rooms.length}개의 활성화된 방을 찾았습니다.`
            : `Found ${data.rooms.length} active room(s).`
        );
      } else {
        setSyncRecoveryMessage(
          activeLocale === 'ko' ? '활성화된 방이 없습니다.' : 'No active rooms found.'
        );
      }
    } catch (err: any) {
      console.error(err);
      setSyncRecoveryMessage(
        activeLocale === 'ko'
          ? (err.message || '인증 중 오류가 발생했습니다. 다시 시도해 주세요.')
          : 'Authentication failed. Please try again.'
      );
    } finally {
      setIsSyncRecoveryLoading(false);
    }
  };

  const handleSelectRecoveredRoom = async (room: any) => {
    setSyncRoomId(room.room_id);
    setSyncHostToken(room.host_session_token);
    setSyncRoomTier(room.tier);
    setSyncRoomCreatedAt(room.created_at);
    setSyncRoomActiveParticipants(0);
    setSyncRoomPasscode(room.passcode || '');
    
    // Close vault modal on successful recovery
    setIsVaultOpen(false);
    
    localStorage.setItem('glowwave_local_sync_room_id', room.room_id);
    localStorage.setItem('glowwave_local_sync_host_token', room.host_session_token);
    localStorage.setItem('glowwave_local_sync_room_created_at', room.created_at);

    // Add to recent rooms list so it shows on home page
    try {
      const recentRaw = localStorage.getItem('glowwave_recent_rooms');
      let recents = recentRaw ? JSON.parse(recentRaw) : [];
      recents = recents.filter((r: any) => r.roomId !== room.room_id);
      recents.unshift({
        roomId: room.room_id,
        role: 'host',
        tier: room.tier,
        createdAt: room.created_at
      });
      localStorage.setItem('glowwave_recent_rooms', JSON.stringify(recents.slice(0, 50)));
    } catch (e) {
      console.error('[local] Failed to update glowwave_recent_rooms on recovery:', e);
    }
    
    // Initialize room broadcast with the current preset
    await fetch(`/api/room/${room.room_id}/broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host_session_token: room.host_session_token,
        preset: currentBroadcastPreset
      })
    }).catch((err) => console.error('[Local Recovery] Failed to broadcast initial state:', err));

    setSyncRecoveryRooms([]);
    setSyncRecoveryEmail('');
    setSyncRecoveryMessage('');

    showAlert(
      activeLocale === 'ko'
        ? '성공적으로 전광판이 복구 및 동기화되었습니다! 🎉'
        : 'Room successfully recovered and synced! 🎉'
    );
  };

  const handleLocaleChange = (newLocale: Locale) => {
    setActiveLocale(newLocale);
    localStorage.setItem('glowwave_local_locale', newLocale);
    localStorage.setItem('glowwave_host_locale', newLocale);
    localStorage.setItem('glowwave_home_locale', newLocale);

    let updated: Preset[] = [];
    if (presets.length === 0) {
      updated = getDefaultsByLocale(newLocale);
    } else {
      updated = translateDefaultPresets(presets, newLocale);
    }
    setPresets(updated);
    localStorage.setItem('glowwave_local_presets', JSON.stringify(updated));

    // Update active preset if it matches a default one
    let activePreset = currentBroadcastPreset;
    const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
    const cleanedText = activePreset.text.replace(emojiRegex, '').trim();
    if (cleanedText in DEFAULT_PRESET_MAP) {
      const idx = DEFAULT_PRESET_MAP[cleanedText];
      const newDefaults = getDefaultsByLocale(newLocale);
      if (newDefaults[idx]) {
        activePreset = {
          ...activePreset,
          text: newDefaults[idx].text,
          result_text: (activePreset.effect === 'countdown' && (!activePreset.result_text || activePreset.result_text === 'START' || activePreset.result_text === '시작' || activePreset.result_text === 'スタート' || activePreset.result_text === '¡EMPEZAR!' || activePreset.result_text === '開始'))
            ? newDefaults[idx].result_text
            : (activePreset.effect === 'luckydraw_wait' && (!activePreset.result_text || activePreset.result_text === '아쉽네요! 다음 기회에..' || activePreset.result_text === 'Good luck next time!' || activePreset.result_text === '残念！また今도ね..' || activePreset.result_text === '¡Suerte la próxima!' || activePreset.result_text === '沒中，再接再厲！' || activePreset.result_text === '冇中，下次好運！'))
              ? newDefaults[idx].result_text
              : activePreset.result_text
        };
        setCurrentBroadcastPreset(activePreset);
        applyPresetToController(activePreset);
        localStorage.setItem('glowwave_local_active_preset', JSON.stringify(activePreset));
      }
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
    showConfirm(
      t('confirm_delete_preset', activeLocale),
      () => {
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
      },
      activeLocale === 'ko' ? '프리셋 삭제' : 'Delete Preset'
    );
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
    showConfirm(
      t('confirm_delete_slot', activeLocale),
      () => {
        const updated = savedSlots.filter((_, idx) => idx !== index);
        setSavedSlots(updated);
        localStorage.setItem('glowwave_local_slots', JSON.stringify(updated));
      },
      activeLocale === 'ko' ? '슬롯 삭제' : 'Delete Slot'
    );
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
      showAlert(
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
      showAlert(
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
        showAlert(
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
      showAlert(
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
  const handleStartImportRoom = (tierType: 'free' | 'premium', planType?: 'store') => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('glowwave_temp_import_presets', JSON.stringify(presets));
      if (planType === 'store') {
        router.push('/host/setup?import=premium&plan=store');
      } else if (tierType === 'premium') {
        router.push('/host/setup?import=premium');
      } else {
        router.push('/host/setup?import=free');
      }
    }
  };

  if (!isHydrated) {
    return <LocalSignboardFallback />;
  }

  return (
    <div className="min-h-screen bg-[#030305] text-foreground flex flex-col justify-between bg-grid-pattern relative overflow-hidden font-sans">
      
      {/* Background Neon Aura Spheres */}
      <div className="absolute top-[10%] left-[-10%] neon-glow-circle-1 opacity-30" />
      <div className="absolute bottom-[20%] right-[-10%] neon-glow-circle-2 opacity-25" />

      {/* Header */}
      <header className="border-b border-white/5 bg-[#030305]/60 backdrop-blur-md relative z-30 pt-[calc(env(safe-area-inset-top,0px)+12px)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <Link 
              href="/"
              className="text-zinc-400 hover:text-white transition-all text-xs font-extrabold flex items-center gap-1.5 cursor-pointer select-none bg-white/5 hover:bg-white/10 p-2 sm:px-3 sm:py-1.5 rounded-xl border border-white/10 shadow-sm"
              title={
                {
                  ko: '뒤로가기',
                  en: 'Back',
                  ja: '戻る',
                  es: 'Volver',
                  'zh-TW': '返回',
                  'zh-HK': '返回',
                }[activeLocale] || '뒤로가기'
              }
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">
                {
                  {
                    ko: '뒤로가기',
                    en: 'Back',
                    ja: '戻る',
                    es: 'Volver',
                    'zh-TW': '返回',
                    'zh-HK': '返回',
                  }[activeLocale] || '뒤로가기'
                }
              </span>
            </Link>
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              <span className="hidden sm:inline font-black text-white tracking-tight font-outfit text-xs sm:text-sm uppercase">GlowWave Local</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20 font-black tracking-wider uppercase whitespace-nowrap">
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

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => {
                setVaultTab('sync');
                setIsVaultOpen(true);
              }}
              className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/5 hover:from-indigo-500/20 hover:to-purple-500/15 border border-indigo-500/30 text-indigo-200 hover:text-white p-2 sm:px-4 sm:py-2 rounded-xl text-xs font-extrabold cursor-pointer shadow-lg shadow-indigo-500/5 select-none transition-all hover:scale-[1.02]"
              title={activeLocale === 'ko' ? '화면 연동 (모바일/스크린)' : 'Sync Screen'}
            >
              <Smartphone className="w-4 h-4 text-indigo-300" />
              <span className="hidden sm:inline">
                {
                  {
                    ko: '화면 연동 (모바일/스크린)',
                    en: 'Sync Screen (Mobile/Screen)',
                    ja: '画面同期 (モバイル/スクリーン)',
                    es: 'Sincronizar Pantalla',
                    'zh-TW': '螢幕同步連動',
                    'zh-HK': '螢幕同步連動'
                  }[activeLocale] || '화면 연동 (모바일/스크린)'
                }
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setVaultTab('slots');
                setIsVaultOpen(true);
              }}
              className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 p-2 sm:px-4 sm:py-2 rounded-xl text-xs font-bold text-white cursor-pointer shadow-md select-none transition-all"
              title={t('vault_share', activeLocale)}
            >
              <FolderHeart className="w-4 h-4 text-zinc-300" />
              <span className="hidden sm:inline">{t('vault_share', activeLocale)}</span>
            </button>

            {/* Language Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold text-white cursor-pointer shadow-md select-none transition-all"
              >
                <Globe className="w-3.5 h-3.5 text-zinc-400" />
                <span className="hidden sm:inline uppercase">{activeLocale}</span>
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
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 w-full relative z-10 animate-in fade-in slide-in-from-top-2 duration-300">
        <div className={`glass-effect rounded-2xl p-4 flex flex-wrap justify-between items-center gap-4 bg-[#12121a] border transition-colors duration-300 ${syncRoomId ? 'border-violet-500/20 shadow-xl shadow-violet-950/5' : 'border-white/5'}`}>
          <div className="flex flex-wrap items-center gap-6">
            {/* 1. 방 코드 */}
            <div>
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">
                {activeLocale === 'ko' ? '방 코드' : 'Room Code'}
              </span>
              <span className="text-xl font-mono font-black text-white select-all">
                {syncRoomId || 'STANDALONE'}
              </span>
            </div>
            
            <div className="hidden sm:block w-[1px] h-8 bg-white/5" />
            
            {/* 2. 실시간 접속자 */}
            <div>
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">
                {activeLocale === 'ko' ? '실시간 접속자' : 'Spectators'}
              </span>
              <span className="text-xl font-black text-white flex items-baseline gap-1">
                <span>{syncRoomId ? syncRoomActiveParticipants : 0}</span>
                <span className="text-[10px] text-zinc-500 font-bold">
                  {activeLocale === 'ko' ? '/ 1명' : '/ 1 Screen'}
                </span>
              </span>
            </div>

            <div className="hidden sm:block w-[1px] h-8 bg-white/5" />

            {/* 3. 사용 중인 요금제 */}
            <div>
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">
                {activeLocale === 'ko' ? '사용 중인 요금제' : 'Active Plan'}
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                {syncRoomId ? (
                  <span className={`text-xs font-black text-white px-2 py-0.5 rounded-md uppercase border ${
                    ['store', 'store_annual'].includes(syncRoomTier)
                      ? 'bg-violet-500/10 border-violet-500/20 text-violet-400'
                      : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                  }`}>
                    {['store', 'store_annual'].includes(syncRoomTier)
                      ? (activeLocale === 'ko' ? '매장 전용 24/7 플랜' : 'STORE 24/7')
                      : (activeLocale === 'ko' ? '기기 연동 무료체험' : 'SYNC TRIAL')}
                  </span>
                ) : (
                  <span className="text-xs font-black text-white px-2 py-0.5 rounded-md bg-white/5 uppercase border border-white/5">
                    {activeLocale === 'ko' ? '평생 무료 (1인용)' : 'FOREVER FREE'}
                  </span>
                )}
                {syncRoomId && !['store', 'store_annual'].includes(syncRoomTier) && (
                  <button
                    onClick={() => handleStartImportRoom('premium', 'store')}
                    className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300 cursor-pointer transition-colors"
                  >
                    {activeLocale === 'ko' ? '업그레이드' : 'Upgrade Plan'}
                  </button>
                )}
              </div>
            </div>

            <div className="hidden sm:block w-[1px] h-8 bg-white/5" />

            {/* 4. 방 비밀번호 */}
            <div>
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">
                {activeLocale === 'ko' ? '방 비밀번호' : 'Room Passcode'}
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-black text-white px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/5 font-mono">
                  {syncRoomId ? (
                    syncRoomPasscode ? '🔒 설정됨' : (activeLocale === 'ko' ? '설정 없음' : 'Not Set')
                  ) : '-'}
                </span>
                {syncRoomId && (
                  <button
                    onClick={() => setIsVaultOpen(true)}
                    className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300 cursor-pointer transition-colors"
                  >
                    {activeLocale === 'ko' ? '설정/변경' : 'Set/Change'}
                  </button>
                )}
              </div>
            </div>

            <div className="hidden sm:block w-[1px] h-8 bg-white/5" />

            {/* 5. 남은 시간 */}
            <div>
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">
                {activeLocale === 'ko' ? '남은 시간' : 'Time Remaining'}
              </span>
              <div className="flex items-center gap-3">
                <span className={`text-xs sm:text-sm font-black font-mono tracking-tight block ${
                  syncRoomId && (syncTimeRemaining === '만료됨' || syncTimeRemaining.startsWith('00:'))
                    ? 'text-red-500 animate-pulse'
                    : 'text-zinc-300'
                }`}>
                  {syncRoomId ? (syncTimeRemaining || '--:--:--') : (activeLocale === 'ko' ? '무제한 (만료 없음)' : 'Unlimited')}
                </span>
                {syncRoomId && (
                  <button
                    onClick={() => {
                      if (!['store', 'store_annual'].includes(syncRoomTier)) {
                        handleStartImportRoom('premium', 'store');
                      } else {
                        showAlert(activeLocale === 'ko' ? '매장용 24/7 요금제는 연중무휴로 작동하며 기간 만료가 존재하지 않습니다.' : 'Store 24/7 plan runs continuously with no expiration.');
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition-all text-[9px] font-bold tracking-wider cursor-pointer"
                  >
                    {activeLocale === 'ko' ? '시간 연장' : 'Extend'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 6. 시스템 연결 상태 */}
          <div className="flex items-center gap-3">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">{activeLocale === 'ko' ? '시스템 연결 상태' : 'System Connection'}</span>
            {syncRoomId ? (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-950/30 border border-violet-500/30 text-violet-400 text-xs font-bold tracking-wider backdrop-blur-md shadow-[0_0_15px_rgba(139,92,246,0.15)] transition-all duration-300">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
                </span>
                <span>{activeLocale === 'ko' ? '연결됨' : 'Connected'}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/30 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-wider backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all duration-300">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>{activeLocale === 'ko' ? '로컬 독립 실행' : 'Standalone'}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex-1 flex flex-col lg:grid lg:grid-cols-12 lg:items-start gap-8 w-full relative z-10">
        
        {/* Left Column Wrapper */}
        <div className="lg:col-span-8 flex flex-col gap-6 w-full min-w-0">
          
          {/* Item 1: Templates (원터치 연출 보드) */}
          <div className="flex flex-col w-full min-w-0">
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
              {(systemTemplates[activeLocale] || systemTemplates['ko']).map((cat: any) => (
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
              {(activeCategory === 'custom' ? presets : ((systemTemplates[activeLocale] || systemTemplates['ko']).find((c: any) => c.id === activeCategory)?.presets || [])).map((preset: any, index: number) => {
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
          {/* Item 3: 즉석 라이브 메시지 전송 */}
        <div className="flex flex-col w-full min-w-0">
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
                    onChange={(e) => setCustomText(e.target.value.slice(0, maxTextLength))}
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
                    maxLength={maxTextLength}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold font-mono text-zinc-600">
                    {customText.length}/{maxTextLength}
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
                    <div className="flex flex-wrap gap-1 bg-black/45 p-1 rounded-xl border border-white/5 items-center">
                      {getLocalizedFonts(activeLocale).map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => handleFontSelect(item.val as any, false)}
                          style={{ fontFamily: item.fontFamily, fontWeight: item.fontWeight as any }}
                          className={`flex-1 min-w-[70px] sm:min-w-[85px] py-2 px-1 rounded-lg text-xs md:text-sm transition-all cursor-pointer whitespace-nowrap text-center ${
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
                      onChange={(e) => setCustomResultText(e.target.value.slice(0, maxTextLength))}
                      placeholder="START"
                      className="w-full bg-black/45 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white text-xs md:text-sm font-semibold h-12"
                      maxLength={maxTextLength}
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
                      onChange={(e) => setCustomResultText(e.target.value.slice(0, maxTextLength))}
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
                      maxLength={maxTextLength}
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
      </div>

      {/* Right Column Wrapper */}
      <div className="lg:col-span-4 flex flex-col gap-6 w-full min-w-0">

        {/* Relocated original Item 4 block (rendered at the bottom of Right Column) */}
        <div className="hidden lg:col-span-4 flex-col gap-6 w-full min-w-0">
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
                      'zh-TW': '修改後的預設會自動儲存於瀏覽器中。清除瀏覽器紀錄（快取/Cookie）可能會導致資料遺失，請務必使用上方的 [保管與分享] 選單將珍貴的設計備份至行動裝置！',
                      'zh-HK': '修改後的預設會自動儲存於瀏覽器中。清除瀏覽器紀錄（快取/Cookie）可能會導致資料遺失，請務必使用上方的 [保管與分享] 選單將珍貴的設計備份至行動裝置！',
                    }[activeLocale] || '수정한 프리셋들은 **브라우저에 자동 저장**됩니다. 방문 기록(캐시/쿠키)을 청소하면 데이터가 소멸할 수 있으니, 소중한 디자인 세트는 상단의 **[보관 & 공유]** 메뉴에서 모바일로 백업해 두세요!'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Item 2: LIVE ON AIR Preview Card */}
        <div className="flex flex-col w-full min-w-0">
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

          {/* Real-time Sync Control Panel */}
          {syncRoomId && (
            <div className="glass-effect rounded-2xl p-6 mt-6 flex flex-col bg-[#12121a] border border-violet-500/20 shadow-xl shadow-violet-950/5 relative overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300 text-center">
              
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                <h3 className="text-xs font-black text-violet-400 uppercase tracking-widest font-mono">
                  {activeLocale === 'ko' ? '기기 연결 QR 코드' : 'Device Connection QR'}
                </h3>
              </div>

              {/* QR Code Container */}
              <div className="bg-white p-3 rounded-2xl shadow-xl flex flex-col items-center shrink-0 w-[208px] mx-auto mb-5 relative group">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`${window.location.origin}/room/${syncRoomId}`)}`} 
                  alt="Sync Room QR" 
                  className="w-44 h-44 rounded-lg select-none"
                />
                <span className="text-[11px] font-black text-black tracking-widest mt-2 font-mono">CODE: {syncRoomId}</span>
              </div>

              {/* Connection URL with Copy Button */}
              <div className="w-full space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-mono text-zinc-500 font-bold block">
                    {activeLocale === 'ko' ? '접속 코드 주소' : 'Spectator Link'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/room/${syncRoomId}`}
                      className="flex-1 bg-[#09090D] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-zinc-400 font-mono focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/room/${syncRoomId}`);
                        showAlert(activeLocale === 'ko' ? '링크가 클립보드에 복사되었습니다.' : 'Link copied to clipboard.');
                      }}
                      className="px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-zinc-300 hover:text-white transition-all text-xs font-bold shrink-0 cursor-pointer"
                    >
                      {activeLocale === 'ko' ? '복사' : 'Copy'}
                    </button>
                  </div>
                </div>

                {/* Upgrade Banner for Free Trial */}
                {!['store', 'store_annual', 'premium_lite', 'premium_pro', 'premium_max'].includes(syncRoomTier) && (
                  <div className="p-4 bg-violet-500/5 border border-violet-500/10 rounded-xl space-y-3 mt-2 text-left">
                    <div className="text-[11px] font-extrabold text-violet-300">
                      {activeLocale === 'ko' ? 'GlowWave 프리미엄 업그레이드' : 'GlowWave Premium Upgrade'}
                    </div>
                    <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">
                      {activeLocale === 'ko' 
                        ? '동시 접속 인원 제한을 풀 수 있는 [다인용 응원 플랜]과 끊김 없이 24시간 재생되는 [매장 전용 플랜]을 지원합니다.'
                        : 'Supports [Multi-device Plan] for more participants and [Store Plan] for 24/7 continuous signages.'}
                    </p>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleStartImportRoom('premium')}
                        className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs transition-all text-center tracking-wide cursor-pointer active:scale-95 shadow-md shadow-indigo-950/20"
                      >
                        {activeLocale === 'ko' ? '다인용 프리미엄 플랜으로 업그레이드' : 'Upgrade to Multi-device Plan'}
                      </button>
                      <button
                        onClick={() => handleStartImportRoom('premium', 'store')}
                        className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-xs transition-all text-center tracking-wide cursor-pointer active:scale-95 shadow-md shadow-violet-950/20"
                      >
                        {activeLocale === 'ko' ? '매장 전용 24/7 플랜으로 업그레이드' : 'Upgrade to Store 24/7 Plan'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Control Buttons */}
              <div className="flex flex-col gap-2 border-t border-white/5 pt-4 mt-4">
                <button
                  onClick={() => {
                    const confirmMsg = activeLocale === 'ko' 
                      ? '연동 코드를 재발급하면 현재 연결되어 있던 스마트폰과의 연동이 해제됩니다. 진행하시겠습니까?' 
                      : 'Regenerating the connection code will disconnect your currently paired device. Proceed?';
                    showConfirm(confirmMsg, () => handleStartMobileSync(true));
                  }}
                  className="w-full py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white transition-all text-xs font-bold text-center cursor-pointer active:scale-95"
                >
                  {activeLocale === 'ko' ? '연동 코드 재발급' : 'Regenerate Connection Code'}
                </button>
                <button
                  onClick={handleStopMobileSync}
                  className="w-full py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 transition-all text-xs font-bold text-center cursor-pointer active:scale-95"
                >
                  {activeLocale === 'ko' ? '실시간 연동 해제' : 'Disconnect Sync'}
                </button>
              </div>
            </div>
          )}

          {/* Item 4: 1인 모드 이용 가이드 & 보관 안내 (Short impact text card) */}
          <div className="glass-effect rounded-2xl p-6 text-xs text-zinc-400 leading-relaxed flex flex-col gap-4 bg-[#12121a] border border-white/5 mt-6">
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
                      'zh-TW': '連點難下退出',
                      'zh-HK': '連點難下退出',
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
                      ja: '電光掲示板が表示されている間は, スマートフォン가스립모드에 들어가지 않고 화면이 점등됩니다.',
                      es: 'Mientras el letrero esté activo, su teléfono no entrará en modo de suspensión y la pantalla permanecerá encendida.',
                      'zh-TW': '電子看板開啟期間, 手機不會進入休眠狀態, 螢幕將保持開啟.',
                      'zh-HK': '電子看板開啟期間, 手機不會进入休眠狀態, 螢幕將保持開啟.',
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
                      ja: '端末에安全에自動保存',
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
                      ja: '編集したプリセットはブラウザに自動保存されます. 履歴（キャッシュ/クッキー）を削除するとデータが消える可能性があるため, 대단한 디자인은 상단의 【保管＆共有】메뉴에서 모바일로 백업하세요!',
                      es: 'Los ajustes modificados se guardan automáticamente en el navegador. Limpiar el historial (caché/cookies) puede borrar los datos, ¡así que haga una copia de seguridad en el menú [Bóveda y Compartir]!',
                      'zh-TW': '修改後的預設會自動儲存於瀏覽器中. 清除瀏覽器紀錄（快取/Cookie）可能會導致資料遺失, 請務必사용한 上方의 [保管與分享] 選單將珍貴의設計備份至行動裝置！',
                      'zh-HK': '修改後的預設會自動儲存於瀏覽器中. 清除瀏覽기기록（快取/Cookie）可能會導致資料遺失, 請務必사용한 上方의 [保管與分享] 選單將珍貴의設計備份至行動裝置！',
                    }[activeLocale] || '수정한 프리셋들은 **브라우저에 자동 저장**됩니다. 방문 기록(캐시/쿠키)을 청소하면 데이터가 소멸할 수 있으니, 소중한 디자인 세트는 상단의 **[보관 & 공유]** 메뉴에서 모바일로 백업해 두세요!'
                  }
                </p>
              </div>
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
            locale={activeLocale}
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
                <span className="text-[10px] font-black font-mono text-indigo-400 uppercase mb-3 tracking-widest">
                  {t('live_direction_preview', activeLocale)}
                </span>
                <LandscapePhoneMockup preset={editingPreset} />
                <div className="mt-3.5 text-[9.5px] text-zinc-400 text-center font-semibold leading-normal">
                  {t('preview_floating_sync_desc', activeLocale)}
                </div>
              </div>
            </div>

            <div className="flex flex-col flex-1 overflow-y-auto">
              {/* Header */}
              <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
                <h3 className="text-sm font-bold text-white">
                  {editingPresetIndex >= presets.length ? t('edit_title_add', activeLocale) : `${t('edit_title_preset', activeLocale)} P${editingPresetIndex + 1}`}
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
                <span className="text-[10px] font-bold font-mono text-zinc-500 uppercase mb-3 tracking-wider">
                  {t('live_direction_preview', activeLocale)}
                </span>
                <LandscapePhoneMockup preset={editingPreset} />
              </div>

              {/* Form Controls */}
              <div className="p-6 flex flex-col gap-5">
                {/* Output Text */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    {
                      {
                        ko: '출력 문구',
                        en: 'Display Text',
                        ja: '表示テキスト',
                        es: 'Texto de pantalla',
                        'zh-TW': '顯示文字',
                        'zh-HK': '顯示文字'
                      }[activeLocale] || '출력 문구'
                    }
                  </label>
                  <input
                    type="text"
                    value={editingPreset.text || ''}
                    onChange={(e) => setEditingPreset(prev => ({ ...prev!, text: e.target.value.slice(0, maxTextLength) }))}
                    className="w-full bg-[#0B0B0F] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-white text-sm font-semibold"
                    maxLength={maxTextLength}
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
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">{t('animation_effect', activeLocale)}</label>
                  <div className="grid grid-cols-5 gap-1 bg-black/40 p-1 rounded-xl border border-white/5 h-11 items-center font-medium">
                    {[
                      { val: 'none', label: t('static', activeLocale) || '정적' },
                      { val: 'blink', label: t('blink', activeLocale) || '깜빡' },
                      { val: 'marquee', label: t('scroll', activeLocale) || '흐름' },
                      { val: 'countdown', label: t('timer', activeLocale) || '타이머' },
                      { val: 'luckydraw_wait', label: t('raffle', activeLocale) || '추첨' }
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
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">{t('secondary_bg_color', activeLocale)}</label>
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
                        <span>{t('single_color_fade', activeLocale)}</span>
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
                        title={
                          {
                            ko: '커스텀 보조 색상 선택',
                            en: 'Select custom secondary color',
                            ja: 'カスタム補助色の選択',
                            es: 'Seleccionar color secundario personalizado',
                            'zh-TW': '選擇自訂輔助顏色',
                            'zh-HK': '選擇自訂輔助顏色',
                          }[activeLocale] || '커스텀 보조 색상 선택'
                        }
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
                      <span>
                        {
                          {
                            ko: '애니메이션 속도 조절',
                            en: 'Animation Speed',
                            ja: 'アニメーション速度調整',
                            es: 'Ajustar velocidad de animación',
                            'zh-TW': '調整動畫速度',
                            'zh-HK': '調整動畫速度',
                          }[activeLocale] || '애니메이션 속도 조절'
                        }
                      </span>
                      <span className="text-indigo-400 font-extrabold font-mono">
                        {
                          {
                            ko: '속도',
                            en: 'Speed',
                            ja: '速度',
                            es: 'Velocidad',
                            'zh-TW': '速度',
                            'zh-HK': '速度',
                          }[activeLocale] || '속도'
                        }: {getSpeedFactor(editingPreset.effect, editingPreset.speed)}%
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
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">{t('countdown_duration', activeLocale)}</label>
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

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">{t('countdown_end_text', activeLocale)}</label>
                      <input
                        type="text"
                        value={editingPreset.result_text || ''}
                        onChange={(e) => setEditingPreset(prev => ({ ...prev!, result_text: e.target.value.slice(0, maxTextLength) }))}
                        className="w-full bg-[#0B0B0F] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-white text-xs font-semibold"
                        maxLength={maxTextLength}
                        placeholder="START"
                      />
                    </div>
                  </div>
                )}

                {/* Lucky Draw Options */}
                {(editingPreset.effect === 'luckydraw_wait' || editingPreset.effect === 'luckydraw') && (
                  <div className="pt-3 border-t border-white/5 animate-in fade-in duration-200 flex flex-col gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">{t('winner_text', activeLocale)}</label>
                      <input
                        type="text"
                        value={editingPreset.text || ''}
                        onChange={(e) => setEditingPreset(prev => ({ ...prev!, text: e.target.value.slice(0, maxTextLength) }))}
                        className="w-full bg-[#0B0B0F] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-white text-xs font-semibold"
                        maxLength={maxTextLength}
                        placeholder={t('raffle_win_default', activeLocale) || '당첨!'}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">{t('lose_text', activeLocale)}</label>
                      <input
                        type="text"
                        value={editingPreset.result_text || ''}
                        onChange={(e) => setEditingPreset(prev => ({ ...prev!, result_text: e.target.value.slice(0, maxTextLength) }))}
                        className="w-full bg-[#0B0B0F] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-white text-xs font-semibold"
                        maxLength={maxTextLength}
                        placeholder={t('lucky_draw_vibe', activeLocale) || '아쉽네요! 다음 기회에..'}
                      />
                    </div>
                  </div>
                )}

                {/* 글자 색상 */}
                <div className="pt-3 border-t border-white/5">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">{t('text_color', activeLocale)}</label>
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
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">{t('font', activeLocale)}</label>
                  <div className="flex flex-wrap gap-1 bg-black/40 p-1 rounded-xl border border-white/5 items-center font-medium">
                    {getLocalizedFonts(activeLocale).map((item) => (
                      <button
                        type="button"
                        key={item.val}
                        onClick={() => handleFontSelect(item.val as any, true)}
                        style={{ fontFamily: item.fontFamily, fontWeight: item.fontWeight as any }}
                        className={`flex-1 min-w-[75px] py-2 px-1 rounded-lg text-xs transition-all cursor-pointer text-center ${
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
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">{t('special_effect', activeLocale)}</label>
                  <div className="grid grid-cols-4 gap-1 bg-black/40 p-1 rounded-xl border border-white/5 h-11 items-center font-medium">
                    {[
                      { val: 'none', label: t('none', activeLocale) || '없음' },
                      { val: 'hearts', label: t('hearts', activeLocale) || '하트' },
                      { val: 'confetti', label: t('confetti', activeLocale) || '꽃가루' },
                      { val: 'stars', label: t('stars', activeLocale) || '별빛' }
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
                    <span className="text-indigo-400 font-extrabold font-mono">{editingPreset.font_size || 100}%</span>
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
                  {
                    {
                      ko: '저장만 하기',
                      en: 'Save only',
                      ja: '保存のみ',
                      es: 'Solo guardar',
                      'zh-TW': '僅儲存',
                      'zh-HK': '僅儲存',
                    }[activeLocale] || '저장만 하기'
                  }
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
                  {
                    {
                      ko: '저장 후 바로 송출',
                      en: 'Save & Broadcast',
                      ja: '保存して即送信',
                      es: 'Guardar y emitir',
                      'zh-TW': '儲存並立即傳送',
                      'zh-HK': '儲存並立即傳送',
                    }[activeLocale] || '저장 후 바로 송출'
                  }
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
                  {
                    {
                      ko: '저장 없이 바로 송출 (1회성 송출)',
                      en: 'Broadcast without saving (One-time)',
                      ja: '保存せずに即送信 (1回限り)',
                      es: 'Emitir sin guardar (Solo una vez)',
                      'zh-TW': '不儲存直接傳送 (一次性)',
                      'zh-HK': '不儲存直接傳送 (一次性)',
                    }[activeLocale] || '저장 없이 바로 송출 (1회성 송출)'
                  }
                </button>
              )}

              <div className="flex flex-col gap-2 items-center text-xs pt-1">
                {editingPresetIndex < 6 && (
                  <button
                    type="button"
                    onClick={() => setEditingPreset({ ...defaults[editingPresetIndex] })}
                    className="text-zinc-500 hover:text-white transition-colors cursor-pointer underline underline-offset-4"
                  >
                    {
                      {
                        ko: '기본값으로 초기화',
                        en: 'Reset to default',
                        ja: 'デフォルトに戻す',
                        es: 'Restablecer valores predeterminados',
                        'zh-TW': '重設為預設值',
                        'zh-HK': '重設為預設值',
                      }[activeLocale] || '기본값으로 초기화'
                    }
                  </button>
                )}

                {editingPresetIndex >= 6 && editingPresetIndex < presets.length && (
                  <button
                    type="button"
                    onClick={() => handleDeleteLocalPreset(editingPresetIndex)}
                    className="text-red-500/80 hover:text-red-400 transition-colors cursor-pointer underline underline-offset-4"
                  >
                    {
                      {
                        ko: '이 커스텀 프리셋 삭제',
                        en: 'Delete this custom preset',
                        ja: 'このカスタムプリセットを削除',
                        es: 'Eliminar este ajuste personalizado',
                        'zh-TW': '刪除此自訂預設',
                        'zh-HK': '刪除此自訂預設',
                      }[activeLocale] || '이 커스텀 프리셋 삭제'
                    }
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => { setEditingPresetIndex(null); setEditingPreset(null); }}
                  className="text-zinc-500 hover:text-white transition-colors cursor-pointer underline underline-offset-4"
                >
                  {
                    {
                      ko: '취소',
                      en: 'Cancel',
                      ja: 'キャンセル',
                      es: 'Cancelar',
                      'zh-TW': '取消',
                      'zh-HK': '取消',
                    }[activeLocale] || '취소'
                  }
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

          <div className="bg-neutral-950/95 border border-white/10 rounded-[2rem] max-w-4xl w-full p-6 sm:p-8 relative z-10 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto font-sans text-left">
            <button 
              onClick={() => setIsVaultOpen(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white p-2 hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-black text-white leading-tight tracking-tight font-outfit">{t('vault_modal_title', activeLocale)}</h2>
              <p className="text-sm text-zinc-400 mt-2 font-medium">
                {t('vault_modal_desc', activeLocale)}
              </p>
            </div>

            {/* Modal Internal Tabs */}
            <div className="flex border-b border-white/10 gap-1.5 mb-8 overflow-x-auto pb-1.5 scrollbar-none">
              {[
                { tab: 'slots', label: t('tab_my_device', activeLocale) },
                { tab: 'share', label: t('tab_wireless', activeLocale) },
                { tab: 'sync', label: t('tab_sync_multiple', activeLocale) }
              ].map((tItem) => (
                <button
                  key={tItem.tab}
                  type="button"
                  onClick={() => setVaultTab(tItem.tab as any)}
                  className={`px-5 py-2.5 text-xs sm:text-sm font-extrabold rounded-xl transition-all active:scale-95 shrink-0 whitespace-nowrap ${
                    vaultTab === tItem.tab 
                      ? 'bg-white/10 border border-white/15 text-white shadow-md' 
                      : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]'
                  }`}
                >
                  {tItem.label}
                </button>
              ))}
            </div>

            {/* Tab 1: Slots Vault */}
            {vaultTab === 'slots' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="bg-black/40 border border-white/5 rounded-2xl p-5">
                  <h4 className="text-sm font-bold text-white mb-1.5">{t('vault_slots_title', activeLocale)}</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {t('vault_slots_desc', activeLocale)}
                  </p>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSlotName}
                    onChange={(e) => setNewSlotName(e.target.value.slice(0, maxTextLength))}
                    placeholder={t('input_theme_placeholder', activeLocale)}
                    className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/40 focus:bg-black/60 text-sm font-semibold transition-colors"
                    maxLength={maxTextLength}
                  />
                  <button
                    onClick={handleSaveSlotPackage}
                    className="px-5 py-3 rounded-xl bg-white hover:bg-zinc-200 text-black text-sm font-extrabold transition-all cursor-pointer shrink-0 shadow-md active:scale-95"
                  >
                    {t('btn_save_slot', activeLocale)}
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
                          <span className="text-xs text-zinc-400 font-medium font-mono mt-1 block">
                            {t('presets_count_label', activeLocale).replace('{cnt}', String(slot.presets?.length || 0))}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{t('load_action', activeLocale)} &rarr;</span>
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
                      {t('no_saved_slots_desc', activeLocale)}
                    </div>
                  )}
                </div>

                {/* Integration of Backup warnings & Reset */}
                <div className="pt-6 border-t border-white/5 space-y-6">
                  <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl text-left flex items-start gap-3">
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b] mt-1.5" />
                    <div className="flex-1">
                      <span className="text-xs text-zinc-300 font-bold block mb-1">{t('browser_cache_warning_title_local', activeLocale)}</span>
                      <span className="text-xs text-zinc-400 leading-relaxed block">
                        {t('browser_cache_warning_desc_local', activeLocale)}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-left gap-4">
                    <div className="min-w-0 pr-4">
                      <span className="text-xs text-zinc-400 font-bold block">{t('reset_dashboard', activeLocale)}</span>
                      <span className="text-xs text-zinc-500 mt-1 block">{t('reset_dashboard_desc', activeLocale)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetDashboard}
                      className="py-2.5 px-4 rounded-xl border border-white/10 text-zinc-400 hover:text-red-400 hover:border-red-500/30 bg-white/5 hover:bg-red-500/10 cursor-pointer text-xs font-bold transition-all text-center active:scale-95 shrink-0 hover:shadow-[0_0_12px_rgba(239,68,68,0.1)]"
                    >
                      {t('factory_reset', activeLocale)}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Wireless Sharing */}
            {vaultTab === 'share' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="bg-black/40 border border-white/5 rounded-2xl p-5">
                  <h4 className="text-sm font-bold text-white mb-1.5">{t('wireless_transfer_title', activeLocale)}</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {t('wireless_transfer_desc', activeLocale)}
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
                    {t('btn_send_presets_qr', activeLocale)}
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
                    {t('btn_receive_presets_scan', activeLocale)}
                  </button>
                </div>

                {/* Sub-tab A: Send (공유하기) */}
                {shareMode === 'send' && (
                  <div className="space-y-4 animate-in fade-in duration-150">
                    <div className="bg-black/50 border border-white/5 p-6 rounded-2xl flex flex-col items-center gap-4 text-center min-h-[180px] justify-center relative">
                      {isSharingLoading ? (
                        <span className="text-sm text-zinc-400 animate-pulse">{t('token_generating', activeLocale)}</span>
                      ) : shareQrUrl ? (
                        <div className="flex flex-col items-center gap-4 animate-in fade-in duration-200">
                          <div className="bg-white p-3 rounded-2xl shadow-2xl">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={shareQrUrl} alt="Preset Share QR" className="w-40 h-40 rounded-xl" />
                          </div>
                          <span className="text-xs text-zinc-300 font-bold">
                            {t('send_instructions', activeLocale)}
                          </span>
                          
                          <div className="flex items-center gap-2 mt-1 bg-black/45 px-4 py-2.5 rounded-xl border border-white/10">
                            <span className="text-sm font-mono text-white font-extrabold uppercase tracking-widest">{exportCode}</span>
                            <button
                              onClick={handleCopyShareCodeText}
                              className="text-xs text-zinc-300 hover:text-white font-extrabold transition-colors active:scale-95 pl-2 border-l border-white/15"
                            >
                              {isCodeCopied ? t('copy_complete', activeLocale) : t('copy_code', activeLocale)}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="py-6 px-4 text-center space-y-4">
                          <p className="text-xs text-zinc-400 leading-relaxed">
                            {t('send_desc', activeLocale)}
                          </p>
                          <button
                            onClick={handleGenerateShareCode}
                            className="w-full py-4 rounded-xl bg-white text-black font-extrabold text-xs shadow-lg hover:bg-zinc-200 transition-all cursor-pointer flex items-center justify-center active:scale-95"
                          >
                            {t('btn_generate_qr_code', activeLocale)}
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
                          {t('btn_cancel_scan', activeLocale)}
                        </button>
                      </div>
                    ) : (
                      <div className="bg-black/40 border border-white/5 p-5 rounded-2xl space-y-5">
                        <div className="space-y-2">
                          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">{t('receive_method_a', activeLocale)}</span>
                          <button
                            type="button"
                            onClick={startScanning}
                            className="w-full py-3.5 rounded-xl border border-dashed border-white/15 hover:border-white/30 hover:bg-white/[0.02] text-zinc-300 hover:text-white font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                          >
                            {t('btn_enable_qr_scan', activeLocale)}
                          </button>
                        </div>

                        <div className="h-[1px] bg-white/5" />

                        <div className="space-y-2">
                          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">{t('receive_method_b', activeLocale)}</span>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={shareCodeInput}
                              onChange={(e) => setShareCodeInput(e.target.value.toUpperCase())}
                              placeholder={t('input_6digit_placeholder', activeLocale)}
                              className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white tracking-widest text-center text-sm font-black focus:outline-none focus:border-white/40 focus:bg-black/65 uppercase font-mono"
                              maxLength={6}
                            />
                            <button
                              onClick={handleImportShareCode}
                              className="px-5 rounded-xl bg-white text-black text-xs font-black hover:bg-zinc-200 transition-colors cursor-pointer shrink-0 active:scale-95"
                            >
                              {t('btn_import', activeLocale)}
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
            {vaultTab === 'sync' && (() => {
              const syncOptionATitle = {
                ko: '기기 연동 무료 체험 (1시간)',
                en: 'Free Sync Trial (1 Hour)',
                ja: '接続無料体験 (1時間)',
                es: 'Prueba de Sincronización Gratis (1 Hora)',
                'zh-TW': '行動裝置連動免費體驗 (1 小時)',
                'zh-HK': '行動裝置連動免費體驗 (1 小時)',
              }[activeLocale] || '기기 연동 무료 체험 (1시간)';

              const syncOptionADesc = {
                ko: 'PC에서 대시보드 조작 시 스마트폰/태블릿 등 외부 기기의 실제 연출 화면을 테스트해볼 수 있게 1대 기기 한정으로 1시간 동안 연동 QR을 열어주는 무료 체험용 기능입니다. (모바일 기기에서 대시보드를 직접 사용 중이시라면 필요 없는 기능입니다.)',
                en: 'Generates a private link for 1 hour to test and preview your settings on a real phone/tablet while editing on PC. Connects 1 device only. (Not needed if you are already using the dashboard on a mobile device.)',
                ja: 'PCで操作する際、スマホやタブレット等の実機でどのように演出されるかをテストできるよう、1台限定で1時間連動QRを開く無料体験機能です。（モバイル実機で直接ダッシュボードを使用中の場合は不要な機能です。）',
                es: 'Genera un enlace privado por 1 hora para probar su diseño en un teléfono/tableta real mientras edita en PC. Conecta 1 dispositivo. (No es necesario si ya usa el panel en un dispositivo móvil.)',
                'zh-TW': '當在 PC 上操作控制板時，可生成 1 小時專屬 QR Code 供單台手機/平板連線，即時測試看板效果。（若已在行動裝置上使用控制板，則不需此功能。）',
                'zh-HK': '當在 PC 上操作控制板時，可生成 1 小時專屬 QR Code 供單台手機/平板連線，即時測試看板效果。（若已在行動裝置上使用控制板，則不需此功能。）',
              }[activeLocale] || 'PC에서 대시보드 조작 시 스마트폰/태블릿 등 외부 기기의 실제 연출 화면을 테스트해볼 수 있게 1대 기기 한정으로 1시간 동안 연동 QR을 열어주는 무료 체험용 기능입니다.';

              const syncOptionBTitle = {
                ko: '매장 전용 24/7 플랜',
                en: 'Store 24/7 Signage Plan',
                ja: '店舗専用 24/7 プラン',
                es: 'Plan de Letrero para Tiendas 24/7',
                'zh-TW': '店家專屬 24/7 方案',
                'zh-HK': '店家專屬 24/7 方案',
              }[activeLocale] || '매장 전용 24/7 플랜';

              const syncOptionBDesc = {
                ko: '카페, 주점, 매장 홍보용. 연중무휴 24시간 끊김 없이 연속 작동하며, 최대 3대 기기 제한 해제 및 모든 프리미엄 유료 기능을 무제한으로 사용 가능한 매장 전용 구독형 플랜입니다. (입장 비밀번호 설정 가능)',
                en: 'Ideal for cafés, pubs, and retail. Runs continuously 24/7 without disconnects, supports up to 3 screens, and unlocks all premium features. Supports secure passcode entry.',
                ja: 'カフェ、居酒屋、店舗プロモーション用。接続切れなしで24時間連続稼働, 最大3대의 デバイス制限解除, すべてのプレミアム機能が制限なしで利用可能な店舗専用サブスクプランです。（入場用パスコードロック対応）',
                es: 'Ideal para cafés, pubs y tiendas. Funciona las 24 horas sin desconexiones, admite hasta 3 pantallas y desbloquea todas las funciones premium con contraseña.',
                'zh-TW': '適用於咖啡廳、餐酒館及店家宣傳。全年無休 24 小時不斷線運작, 支援最多 3 台螢幕連線並解鎖所有付費功能。（支援設定入場密碼）',
                'zh-HK': '適用於咖啡廳、餐酒館及店家宣傳。全年無休 24 小時不斷線連續運作, 支援最多 3 台螢幕連線並解鎖所有付費功能。（支援設定入場密碼）',
              }[activeLocale] || '카페, 주점, 매장 홍보용. 연중무휴 24시간 끊김 없이 연속 작동하며, 입장 비밀번호 잠금 설정을 지원합니다.';

              const syncOptionABtn = {
                ko: '무료 체험방 개설',
                en: 'Create Free Trial Room',
                ja: '無料体験ルーム開拓',
                es: 'Abrir Sala de Prueba',
                'zh-TW': '開啟免費體驗房',
                'zh-HK': '開啟免費體驗房',
              }[activeLocale] || '무료 체험방 개설';

              const syncOptionBBtn = {
                ko: '매장 플랜 개설 (월 4,900원~)',
                en: 'Get Store Plan ($3.99/mo~)',
                ja: '店舗プラン開拓 (月600円〜)',
                es: 'Obtener Plan de Tienda ($3.99/mes~)',
                'zh-TW': '啟用店家方案 (月 NT$130~)',
                'zh-HK': '啟用店家方案 (月 HK$30~)',
              }[activeLocale] || '매장 플랜 개설 (월 4,900원~)';

              return (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div className="bg-black/40 border border-white/5 rounded-2xl p-5">
                    <h4 className="text-sm font-bold text-white mb-1.5">{t('sync_tab_title', activeLocale)}</h4>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {t('sync_tab_desc', activeLocale)}
                    </p>
                  </div>

                  {syncRoomId ? (
                    /* Active Sync Connection Panel (Simplified without redundant info & emojis) */
                    <div className="glass-effect rounded-2xl p-5 border border-white/10 bg-[#12121a] flex flex-col items-center gap-5 text-center">
                      <div className="text-xs font-black text-violet-400 uppercase tracking-widest font-mono">
                        {activeLocale === 'ko' ? '기기 연결 QR 코드' : 'Device Connection QR'}
                      </div>
                      
                      <div className="bg-white p-3 rounded-2xl shadow-xl flex flex-col items-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.origin}/room/${syncRoomId}`)}`} 
                          alt="Sync Room QR" 
                          className="w-28 h-28 rounded-lg"
                        />
                        <span className="text-[10px] font-black text-black tracking-widest mt-2 font-mono">{syncRoomId}</span>
                      </div>

                      <div className="w-full space-y-4">
                        <div className="space-y-1.5 text-left">
                          <label className="text-[9px] font-mono text-zinc-500 font-bold block">
                            {activeLocale === 'ko' ? '접속 코드 주소' : 'Spectator Link'}
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              readOnly
                              value={`${window.location.origin}/room/${syncRoomId}`}
                              className="flex-1 bg-[#09090D] border border-white/10 rounded-xl px-3 py-2 text-[10px] text-zinc-400 font-mono focus:outline-none"
                            />
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/room/${syncRoomId}`);
                                showAlert(activeLocale === 'ko' ? '링크가 클립보드에 복사되었습니다.' : 'Link copied to clipboard.');
                              }}
                              className="px-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-zinc-300 hover:text-white transition-all text-[10px] font-bold shrink-0 cursor-pointer"
                            >
                              {activeLocale === 'ko' ? '복사' : 'Copy'}
                            </button>
                          </div>
                        </div>

                        {!['store', 'store_annual'].includes(syncRoomTier) && (
                          <div className="p-3.5 bg-violet-500/5 border border-violet-500/10 rounded-xl space-y-2 text-left">
                            <div className="text-[10px] font-extrabold text-violet-300">
                              {activeLocale === 'ko' ? '매장 전용 24/7 무중단 플랜' : 'Store Signage 24/7 Plan'}
                            </div>
                            <p className="text-[9px] text-zinc-500 font-medium leading-relaxed">
                              {activeLocale === 'ko' 
                                ? '연중무휴 24시간 끊김 없이 작동하며, 최대 3대 연결 및 입장 비밀번호 설정이 가능합니다.'
                                : 'Runs 24/7 without disconnects, supports up to 3 screens, and locks with passcode.'}
                            </p>
                            <button
                              onClick={() => handleStartImportRoom('premium', 'store')}
                              className="w-full py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-[10px] transition-all text-center tracking-wide cursor-pointer active:scale-95"
                            >
                              {activeLocale === 'ko' ? '매장 전용 24/7 플랜으로 업그레이드' : 'Upgrade to Store 24/7 Plan'}
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="w-full flex flex-col gap-2 border-t border-white/5 pt-4 mt-2">
                        <button
                          onClick={() => handleStartMobileSync(true)}
                          disabled={isSyncCreating}
                          className="w-full py-2 rounded-xl border border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white transition-all text-[10px] font-bold text-center cursor-pointer active:scale-95"
                        >
                          {activeLocale === 'ko' ? '새 연동용 큐알 재생성' : 'Regenerate QR'}
                        </button>
                        <button
                          onClick={handleStopMobileSync}
                          className="w-full py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 transition-all text-[10px] font-bold text-center cursor-pointer active:scale-95"
                        >
                          {activeLocale === 'ko' ? '실시간 연동 해제' : 'Disconnect Sync'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Standard Pricing Selection */
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {/* Option A: Free Trial */}
                      <div className="glass-effect rounded-2xl p-5 border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-all flex flex-col justify-between text-left active:scale-[0.99] min-h-[250px]">
                        <div>
                          <span className="text-[10px] font-mono text-amber-400 font-extrabold uppercase block tracking-wider mb-2">1H FREE TRIAL</span>
                          <h3 className="text-base font-black text-white mb-2">{syncOptionATitle}</h3>
                          <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                            {syncOptionADesc}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleStartMobileSync(false)}
                          disabled={isSyncCreating}
                          className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-extrabold text-xs transition-all border border-zinc-700/50 shadow-md cursor-pointer text-center active:scale-95 mt-auto"
                        >
                          {isSyncCreating ? (activeLocale === 'ko' ? '개설 중...' : 'Creating...') : syncOptionABtn}
                        </button>
                      </div>

                      {/* Option B: Event Multi-user Sync */}
                      <div className="glass-effect rounded-2xl p-5 border border-amber-500/20 bg-amber-500/[0.02] hover:bg-amber-500/[0.04] transition-all flex flex-col justify-between text-left active:scale-[0.99] min-h-[250px]">
                        <div>
                          <span className="text-[10px] font-mono text-amber-500 font-extrabold uppercase block tracking-wider mb-2">EVENT MULTI-USER SYNC</span>
                          <h3 className="text-base font-black text-white mb-2">
                            {{
                              ko: '이벤트용 다인용 방 연동',
                              en: 'Event Multi-user Sync',
                              ja: 'イベント用ルーム連動',
                              es: 'Sincronizar Evento Multiusuario',
                              'zh-TW': '活動多用戶房間連動',
                              'zh-HK': '活動多用戶房間連動',
                            }[activeLocale] || '이벤트용 다인용 방 연동'}
                          </h3>
                          <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                            {{
                              ko: '관객이 접속하여 실시간 자막을 보내고 추첨에 참여할 수 있는 다인용 방으로 1인 전광판 프리셋을 연동해 이동합니다.',
                              en: 'Import your presets to a multi-user room where spectators can join, send live text, and enter lucky draws.',
                              ja: '観客が接続してリアルタイムでメッセージを送信したり、抽選に参加したりできる複数人向けルームに同期して移動します。',
                              es: 'Sincronice sus ajustes en una sala multiusuario donde los espectadores pueden unirse, enviar textos y sorteos.',
                              'zh-TW': '將預設卡片連動至多用戶活動房間，支援觀眾連線傳送文字及參與即時抽獎。',
                              'zh-HK': '將預設卡片連動至多用戶活動房間，支援觀眾連線傳送文字 및 參與即時抽獎。',
                            }[activeLocale] || '관객이 접속하여 실시간 자막을 보내고 추첨에 참여할 수 있는 다인용 방으로 1인 전광판 프리셋을 연동해 이동합니다.'}
                          </p>
                        </div>

                        <div className="space-y-2 mt-auto">
                          <button
                            type="button"
                            onClick={() => handleStartImportRoom('free')}
                            className="w-full py-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-white/5 font-bold text-xs transition-all cursor-pointer text-center active:scale-95"
                          >
                            {{
                              ko: '일반 무료 연동 (일부 제한)',
                              en: 'Free Sync (Limited)',
                              ja: '一般無料連동 (一部制限)',
                              es: 'Sincronización Gratis (Limitada)',
                              'zh-TW': '一般免費連動 (部分限制)',
                              'zh-HK': '一般免費連動 (部分限制)',
                            }[activeLocale] || '일반 무료 연동 (일부 제한)'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStartImportRoom('premium')}
                            className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs transition-all cursor-pointer text-center active:scale-95"
                          >
                            {{
                              ko: '프리미엄 연동 (무손실)',
                              en: 'Premium Sync (Lossless)',
                              ja: 'プレミアム連동 (無損失)',
                              es: 'Sincronización Premium (Sin Pérdida)',
                              'zh-TW': '尊榮付費連動 (無損轉移)',
                              'zh-HK': '尊榮付費連動 (無損轉移)',
                            }[activeLocale] || '프리미엄 연동 (무손실)'}
                          </button>
                        </div>
                      </div>

                      {/* Option C: Store Signage Subscription */}
                      <div className="rounded-2xl p-5 border border-indigo-500/20 bg-indigo-500/[0.02] hover:bg-indigo-500/[0.04] transition-all flex flex-col justify-between text-left relative overflow-hidden group shadow-lg shadow-white/5 active:scale-[0.99] min-h-[250px]">
                        <div>
                          <span className="text-[10px] font-mono text-indigo-400 font-extrabold block tracking-wider mb-2">STORE SIGNAGE PLAN</span>
                          <h3 className="text-base font-black text-white mb-2">{syncOptionBTitle}</h3>
                          <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                            {syncOptionBDesc}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleStartImportRoom('premium', 'store')}
                          className="w-full py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-extrabold text-xs transition-all cursor-pointer text-center active:scale-95 mt-auto"
                        >
                          {syncOptionBBtn}
                        </button>
                      </div>
                    </div>

                    {/* Room Recovery Form */}
                    <div className="glass-effect rounded-2xl p-5 border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-all text-left">
                      <h4 className="text-xs font-black text-white mb-2 flex items-center gap-1.5 font-sans">
                        🔑 {activeLocale === 'ko' ? '기존 방(결제한 방) 동기화 복구하기' : 'Restore/Recover Existing Paid Room'}
                      </h4>
                      <p className="text-[11px] text-zinc-400 mb-3 leading-relaxed">
                        {activeLocale === 'ko' 
                          ? '결제시 입력하셨던 이메일 주소를 입력하시면, 현재 활성화되어 있는 방의 연동 키와 주소를 확인하여 복구할 수 있습니다.'
                          : 'Enter the email address you used during payment to look up and restore your active room sessions.'}
                      </p>
                      
                      {!syncRecoveryOtpSent ? (
                        /* Step 1: Input Email */
                        <div className="flex gap-2">
                          <input
                            type="email"
                            placeholder="your-email@example.com"
                            value={syncRecoveryEmail}
                            onChange={(e) => setSyncRecoveryEmail(e.target.value)}
                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-zinc-300 font-sans focus:outline-none focus:border-violet-500/50"
                          />
                          <button
                            type="button"
                            onClick={handleRecoverSyncRooms}
                            disabled={isSyncRecoveryLoading}
                            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 disabled:text-zinc-500 text-white font-bold text-xs transition-all cursor-pointer text-center active:scale-95 shrink-0"
                          >
                            {isSyncRecoveryLoading 
                              ? (activeLocale === 'ko' ? '조회 중...' : 'Checking...') 
                              : (activeLocale === 'ko' ? '방 조회' : 'Lookup Rooms')}
                          </button>
                        </div>
                      ) : (
                        /* Step 2: Input OTP */
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              maxLength={6}
                              placeholder={activeLocale === 'ko' ? '6자리 보안코드 입력' : '6-digit OTP code'}
                              value={syncRecoveryOtp}
                              onChange={(e) => setSyncRecoveryOtp(e.target.value)}
                              className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-zinc-300 font-mono tracking-widest text-center focus:outline-none focus:border-violet-500/50"
                            />
                            <button
                              type="button"
                              onClick={handleVerifySyncRoomsOtp}
                              disabled={isSyncRecoveryLoading}
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:text-zinc-500 text-white font-bold text-xs transition-all cursor-pointer text-center active:scale-95 shrink-0"
                            >
                              {isSyncRecoveryLoading 
                                ? (activeLocale === 'ko' ? '인증 중...' : 'Verifying...') 
                                : (activeLocale === 'ko' ? '보안코드 확인' : 'Verify Code')}
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSyncRecoveryOtpSent(false);
                              setSyncRecoveryOtp('');
                              setSyncRecoveryMessage('');
                              setSyncRecoveryRooms([]);
                            }}
                            className="text-[10px] text-zinc-500 hover:text-zinc-300 font-semibold underline cursor-pointer"
                          >
                            {activeLocale === 'ko' ? '← 이메일 재입력하기' : '← Re-enter email'}
                          </button>
                        </div>
                      )}
                      
                      {syncRecoveryMessage && (
                        <p className="text-[10px] text-amber-400 mt-2 font-medium">{syncRecoveryMessage}</p>
                      )}
                      
                      {syncRecoveryRooms.length > 0 && (
                        <div className="mt-3 space-y-2 border-t border-white/5 pt-3">
                          <label className="text-[10px] font-mono text-zinc-400 font-bold block">
                            {activeLocale === 'ko' ? '복구 가능한 방 목록 (클릭 시 복구)' : 'Recoverable Rooms (Click to restore)'}
                          </label>
                          <div className="grid grid-cols-1 gap-2">
                                                        {(() => {
                              // Local helper to calculate remaining duration
                              const getRemainingTimeForList = (tier: string, createdAt: string) => {
                                const createdTime = new Date(createdAt).getTime();
                                let limitMs = 24 * 60 * 60 * 1000;
                                if (tier === 'free') {
                                  limitMs = 2 * 60 * 60 * 1000;
                                } else if (tier === 'store') {
                                  limitMs = 30 * 24 * 60 * 60 * 1000;
                                } else if (tier === 'store_annual') {
                                  limitMs = 365 * 24 * 60 * 60 * 1000;
                                }
                                const diff = (createdTime + limitMs) - Date.now();
                                if (diff <= 0) return activeLocale === 'ko' ? '만료됨' : 'Expired';
                                
                                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                                
                                if (days > 0) {
                                  return activeLocale === 'ko' ? `${days}일 ${hours}시간 남음` : `${days}d ${hours}h left`;
                                }
                                return activeLocale === 'ko' ? `${hours}시간 ${minutes}분 남음` : `${hours}h ${minutes}m left`;
                              };

                              // Local helper to render custom tier badge styles
                              const getTierBadge = (tier: string) => {
                                const badgeStyles: Record<string, { text: string; css: string }> = {
                                  free: {
                                    text: activeLocale === 'ko' ? '일일체험' : 'Free Trial',
                                    css: 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                                  },
                                  store: {
                                    text: activeLocale === 'ko' ? '매장 월간' : 'Store Monthly',
                                    css: 'bg-violet-950/40 border-violet-500/30 text-violet-400'
                                  },
                                  store_annual: {
                                    text: activeLocale === 'ko' ? '매장 연간' : 'Store Annual',
                                    css: 'bg-fuchsia-950/40 border-fuchsia-500/30 text-fuchsia-400'
                                  },
                                  lite: {
                                    text: 'LITE',
                                    css: 'bg-zinc-800 border-zinc-700 text-zinc-300'
                                  },
                                  pro: {
                                    text: 'PRO',
                                    css: 'bg-blue-950/40 border-blue-500/30 text-blue-400'
                                  },
                                  max: {
                                    text: 'MAX',
                                    css: 'bg-amber-950/40 border-amber-500/30 text-amber-400'
                                  }
                                };

                                const info = badgeStyles[tier] || { text: tier.toUpperCase(), css: 'bg-zinc-800 border-zinc-700 text-zinc-300' };
                                return (
                                  <span className={`px-2 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-wider ${info.css}`}>
                                    {info.text}
                                  </span>
                                );
                              };

                              return syncRecoveryRooms.map((room) => (
                                <button
                                  key={room.room_id}
                                  type="button"
                                  onClick={() => handleSelectRecoveredRoom(room)}
                                  className="w-full p-3.5 rounded-2xl border border-white/10 hover:border-violet-500/40 hover:bg-white/[0.02] bg-white/[0.01] transition-all text-left flex justify-between items-center group active:scale-[0.99]"
                                 GelwWave-custom-style="true"
                                >
                                  <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-black text-white group-hover:text-violet-400 transition-colors">
                                        ID: {room.room_id}
                                      </span>
                                      {getTierBadge(room.tier)}
                                    </div>
                                    <div className="flex flex-col gap-0.5 text-[10px] text-zinc-400 font-mono">
                                      <span>
                                        {activeLocale === 'ko' ? '만든 날짜:' : 'Created:'} {new Date(room.created_at).toLocaleDateString()}
                                      </span>
                                      <span className="text-zinc-500 font-semibold">
                                        {activeLocale === 'ko' ? '남은 시간:' : 'Time Left:'} <span className="text-zinc-300">{getRemainingTimeForList(room.tier, room.created_at)}</span>
                                      </span>
                                    </div>
                                  </div>
                                  <span className="text-[10px] font-bold text-violet-400 group-hover:translate-x-0.5 transition-transform shrink-0">
                                    {activeLocale === 'ko' ? '이 방 복구하기 →' : 'Restore →'}
                                  </span>
                                </button>
                              ));
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  )}
                </div>
              );
            })()}

          </div>
        </div>
      )}

      {/* Automatic URL Import Progress Overlay */}
      {isImportLoading && (
        <div className="fixed inset-0 z-50 bg-[#030305]/95 flex flex-col items-center justify-center p-6 text-center select-none font-sans">
          <div className="w-12 h-12 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin mb-6" />
          
          {importError ? (
            <div className="max-w-md animate-in fade-in duration-300">
              <h3 className="text-lg font-black text-white mb-2">{t('import_failed_title', activeLocale)}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed mb-6 font-semibold">{importError}</p>
              <button
                onClick={() => setIsImportLoading(false)}
                className="py-3 px-6 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-xs hover:bg-white/10 transition-all cursor-pointer"
              >
                {t('btn_close_to_dashboard', activeLocale)}
              </button>
            </div>
          ) : (
            <div className="animate-in fade-in duration-300">
              <h3 className="text-base font-black text-white mb-2">{t('sync_connect_title', activeLocale)}</h3>
              <p className="text-xs text-zinc-400 font-medium">{importMessage}</p>
            </div>
          )}
        </div>
      )}

      {customConfirm && (
        <CustomConfirmModal
          isOpen={customConfirm.isOpen}
          title={customConfirm.title}
          message={customConfirm.message}
          onConfirm={() => {
            customConfirm.onConfirm();
            setCustomConfirm(null);
          }}
          onCancel={() => setCustomConfirm(null)}
          okLabel={activeLocale === 'ko' ? '확인' : 'OK'}
          cancelLabel={activeLocale === 'ko' ? '취소' : 'Cancel'}
        />
      )}

      {customAlert && (
        <CustomAlertModal
          isOpen={customAlert.isOpen}
          title={customAlert.title}
          message={customAlert.message}
          onClose={() => setCustomAlert(null)}
          okLabel={activeLocale === 'ko' ? '확인' : 'OK'}
        />
      )}
    </div>
  );
}


// Local Fullscreen Signboard Component (Matches HostFullscreenSignboard exactly)
interface LocalFullscreenSignboardProps {
  preset: Preset;
  onClose: () => void;
  locale: Locale;
}

function LocalFullscreenSignboard({ preset, onClose, locale }: LocalFullscreenSignboardProps) {
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
      ? (t('raffle_board', locale) || '추첨 대기 중')
      : (preset.text || '');

  const [isForcedLandscape, setIsForcedLandscape] = useState(false);

  // FitText Hook
  const { containerRef, fontSize } = useFitText(
    displayText,
    preset.effect || 'none',
    preset.font_size || 100,
    isForcedLandscape
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

  // Dynamically control html/body height and trigger automatic scroll force to push away mobile address bars
  useEffect(() => {
    const htmlEl = document.documentElement;
    const bodyEl = document.body;
    if (isForcedLandscape) {
      // 1. Stretch HTML/Body 0.5% larger than 100dvh to invite browser scrolling capability
      htmlEl.style.height = '100.5dvh';
      htmlEl.style.overflow = 'hidden';
      bodyEl.style.height = '100.5dvh';
      bodyEl.style.overflow = 'hidden';

      // 2. Perform automatic scroll force to slide away the mobile browser masked bottom bar immediately
      const forceScroll = () => {
        window.scrollTo(0, 150);
      };
      
      // Execute multiple times with micro-delays to survive mobile browser layout shifts
      forceScroll();
      const t1 = setTimeout(forceScroll, 50);
      const t2 = setTimeout(forceScroll, 200);
      const t3 = setTimeout(forceScroll, 500);

      // 3. Register touchmove interceptor to lock down the scrolled viewport position
      const handleTouchMove = (e: TouchEvent) => {
        if (e.touches.length > 1 || (e.target as HTMLElement).closest('.rotate-90-forced')) {
          e.preventDefault();
        }
        e.preventDefault();
      };
      document.addEventListener('touchmove', handleTouchMove, { passive: false });

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        document.removeEventListener('touchmove', handleTouchMove);
        htmlEl.style.height = '';
        htmlEl.style.overflow = '';
        bodyEl.style.height = '';
        bodyEl.style.overflow = '';
      };
    } else {
      htmlEl.style.height = '';
      htmlEl.style.overflow = '';
      bodyEl.style.height = '';
      bodyEl.style.overflow = '';
    }
  }, [isForcedLandscape]);

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
      className={`${
        isForcedLandscape ? 'rotate-90-forced fixed inset-0 z-10 w-full h-full' : 'relative w-full min-h-[100dvh] bg-[#0B0B0F]'
      } flex items-center justify-center select-none ${
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
      <div className={`absolute top-[calc(env(safe-area-inset-top,0px)+20px)] left-6 z-40 transition-opacity duration-300 flex items-center gap-2 ${showExitBtn ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <button
          onClick={onClose}
          className="py-2.5 px-5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 text-white font-bold text-xs tracking-wider flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 transition-all"
        >
          {t('close', locale)} (Exit)
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsForcedLandscape(!isForcedLandscape);
          }}
          className={`py-2.5 px-4 rounded-full backdrop-blur-md border font-extrabold text-xs tracking-wider flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 transition-all ${
            isForcedLandscape
              ? 'bg-indigo-600 border-indigo-400 text-white shadow-indigo-600/50'
              : 'bg-black/60 hover:bg-black/80 border-white/10 text-white'
          }`}
        >
          <RotateCw className="w-3.5 h-3.5 text-indigo-300" />
          <span>{isForcedLandscape ? '세로 복귀' : '회전 잠금 해제 없이 즉시 가로로 사용'}</span>
        </button>
      </div>

      <div className={`absolute bottom-6 left-6 z-40 text-[10px] text-zinc-500 transition-opacity duration-300 ${showExitBtn ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {
          {
            ko: '화면을 더블클릭하거나 ESC 키를 누르면 종료됩니다.',
            en: 'Double-click the screen or press ESC to exit.',
            ja: '画面をダブルクリックするか、ESCキーを押すと終了します。',
            es: 'Haga doble clic en la pantalla o presione ESC para salir.',
            'zh-TW': '連按兩下螢幕或按 ESC 鍵即可退出。',
            'zh-HK': '連按兩下螢幕或按 ESC 鍵即可退出。'
          }[locale] || '화면을 더블클릭하거나 ESC 키를 누르면 종료됩니다.'
        }
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
