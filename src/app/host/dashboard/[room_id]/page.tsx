'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { 
  Sparkles, 
  Users, 
  Share2, 
  Copy, 
  Check, 
  Smartphone, 
  AlertCircle, 
  LogOut,
  RefreshCw,
  Sliders,
  Volume2,
  Tv,
  Edit3,
  X,
  CreditCard,
  Plus,
  Trash2,
  Slash,
  Lock,
  Maximize2,
  Globe,
  FolderHeart,
  RotateCw
} from 'lucide-react';
import { Preset, Room, SignalPayload, EffectType, TierType, TIER_CONFIGS, getLocalizedPrice, getLocalizedTierName } from '@/lib/types';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import jsQR from 'jsqr';
import LandscapePhoneMockup from '@/components/LandscapePhoneMockup';
import { LOCALIZED_TEMPLATES, getDefaultsByLocale } from '@/lib/templates';
import { t, Locale, getLocalizedFonts } from '@/lib/translations';
import useFitText from '@/hooks/useFitText';

// Fallback host-aligned defaults
const fallbackDefaults: Preset[] = getDefaultsByLocale('ko');

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
  '부드러운 깜빡이': 1, 'Soft Blink': 1, 'ゆっくり점멸': 1, 'Parpadeo Suave': 1, '呼吸閃爍': 1, 'ゆっくり点滅': 1,
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
      className="absolute inset-0 flex items-center justify-center font-bold text-lg font-mono opacity-60"
      style={{ 
        color: preset.text_color,
        animation: 'preset-card-pulse 1.2s ease-in-out infinite'
      }}
    >
      {val}
    </div>
  );
}

export default function HostDashboard() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawRoomId = params.room_id as string;
  const roomId = rawRoomId ? rawRoomId.toUpperCase() : '';
  
  const [room, setRoom] = useState<Room | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);
  const [isNetworkError, setIsNetworkError] = useState(false);
  
  // Active Locale State
  const [activeLocale, setActiveLocale] = useState<Locale>('ko');
  const maxTextLength = (activeLocale === 'en' || activeLocale === 'es') ? 20 : 15;
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const defaults = getDefaultsByLocale(activeLocale);

  // Upgrade Plan Modal States
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeStep, setUpgradeStep] = useState<'select' | 'payment' | 'success'>('select');
  const [selectedUpgradeTier, setSelectedUpgradeTier] = useState<TierType | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradePlanType, setUpgradePlanType] = useState<'event' | 'store'>('event');

  // Auto-initialize plan type only once when the modal is opened
  useEffect(() => {
    if (isUpgradeModalOpen && room) {
      if (room.tier === 'store' || room.tier === 'store_annual') {
        setUpgradePlanType('store');
        setSelectedUpgradeTier(room.tier === 'store' ? 'store_annual' : null);
      } else {
        setUpgradePlanType('event');
        setSelectedUpgradeTier(null);
      }
    }
  }, [isUpgradeModalOpen]);

  // Time Extension Modal States
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [customAlert, setCustomAlert] = useState<{ isOpen: boolean; message: string; title?: string } | null>(null);
  const [customConfirm, setCustomConfirm] = useState<{ isOpen: boolean; message: string; title?: string; onConfirm: () => void } | null>(null);
  const showAlert = (message: string, title?: string) => {
    setCustomAlert({ isOpen: true, message, title });
  };
  const showConfirm = (message: string, onConfirm: () => void, title?: string) => {
    setCustomConfirm({ isOpen: true, message, onConfirm, title });
  };
  const [extendStep, setExtendStep] = useState<'info' | 'payment' | 'success'>('info');
  const [isExtending, setIsExtending] = useState(false);
  const [selectedExtendHours, setSelectedExtendHours] = useState<number>(24);

  // Promo Code States
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [verifiedCoupon, setVerifiedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isVerifyingCoupon, setIsVerifyingCoupon] = useState(false);

  const handleApplyPromoCode = async () => {
    if (!promoCodeInput.trim()) return;
    setIsVerifyingCoupon(true);
    setCouponError(null);
    try {
      const res = await fetch(`/api/coupon/verify?code=${encodeURIComponent(promoCodeInput.trim())}`);
      if (res.ok) {
        const data = await res.json();
        if (data.valid) {
          setVerifiedCoupon({
            code: data.code,
            discount_pct: data.discount_pct
          });
          setPromoCodeInput('');
        } else {
          const defaultErr = {
            ko: '유효하지 않거나 만료된 프로모션 코드입니다.',
            en: 'Invalid or expired promo code.',
            ja: '無効または期限切れのプロモーションコードです。',
            es: 'Código de descuento inválido o vencido.',
            'zh-TW': '無效或已過期的優惠代碼。',
            'zh-HK': '無效或已過期的優惠代碼。'
          }[activeLocale] || '유효하지 않거나 만료된 프로모션 코드입니다.';
          setCouponError(data.message?.[activeLocale] || defaultErr);
          setVerifiedCoupon(null);
        }
      } else {
        setCouponError('서버 연결 실패');
        setVerifiedCoupon(null);
      }
    } catch (err) {
      setCouponError('서버 연결 실패');
      setVerifiedCoupon(null);
    } finally {
      setIsVerifyingCoupon(false);
    }
  };

  // Passcode Settings States
  const [isPasscodeDrawerOpen, setIsPasscodeDrawerOpen] = useState(false);
  const [passcodeVal, setPasscodeVal] = useState('');
  const [isPasscodeUpdating, setIsPasscodeUpdating] = useState(false);
  const [passcodeUpdateError, setPasscodeUpdateError] = useState('');
  
  // Real-time states
  const [presets, setPresets] = useState<Preset[]>([]);
  const [activePresetIndex, setActivePresetIndex] = useState<number | null>(null);
  const [activeParticipants, setActiveParticipants] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [channelStatus, setChannelStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  // Live broadcast on-air preview state
  const [currentBroadcastPreset, setCurrentBroadcastPreset] = useState<Preset>({ 
    bg_color: '#0B0B0F', 
    text: 'GlowWave', 
    text_color: '#FFFFFF', 
    effect: 'none', 
    speed: 1000,
    font_family: 'sans-thin'
  });

  // Custom instant message state values
  const [customText, setCustomText] = useState('GLOW WAVE');
  const [customBgColor, setCustomBgColor] = useState('#EF4444');
  const [customTextColor, setCustomTextColor] = useState('#FFFFFF');
  const [customFontSize, setCustomFontSize] = useState<number>(100);
  const [customFontFamily, setCustomFontFamily] = useState<'sans-thin' | 'sans-thick' | 'serif' | 'neon' | 'pixel' | 'plump'>('sans-thin');
  const [customEffect, setCustomEffect] = useState<EffectType>('none');
  const [customSpeed, setCustomSpeed] = useState(25); // range 1-100
  const [customSpecialEffect, setCustomSpecialEffect] = useState<'none' | 'hearts' | 'confetti' | 'stars'>('none');
  const [customCountdownSeconds, setCustomCountdownSeconds] = useState<number>(5);
  const [customResultText, setCustomResultText] = useState<string>('START');
  const [isStandaloneFullscreen, setIsStandaloneFullscreen] = useState(false);

  // Safety transmitter lock & miniature preview toggles
  const [isTransmitterLocked, setIsTransmitterLocked] = useState(false);
  const [showMiniPreviews, setShowMiniPreviews] = useState(true);

  // Control & Share Modal states (Vault)
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [vaultTab, setVaultTab] = useState<'slots' | 'share'>('slots');
  const [savedSlots, setSavedSlots] = useState<{ name: string; presets: Preset[] }[]>([]);
  const [newSlotName, setNewSlotName] = useState('');
  const [shareMode, setShareMode] = useState<'send' | 'receive'>('send');

  // QR and Code Sharing states
  const [isSharingLoading, setIsSharingLoading] = useState(false);
  const [exportCode, setExportCode] = useState('');
  const [shareQrUrl, setShareQrUrl] = useState('');
  const [shareCodeInput, setShareCodeInput] = useState('');
  const [isCodeCopied, setIsCodeCopied] = useState(false);

  // Camera QR scan states
  const [isScanning, setIsScanning] = useState(false);
  const scannerVideoRef = useRef<HTMLVideoElement | null>(null);
  const scannerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const scannerStreamRef = useRef<MediaStream | null>(null);

  // Blackout Mode states
  const [isBlackout, setIsBlackout] = useState(false);
  const [lastActivePresetBeforeBlackout, setLastActivePresetBeforeBlackout] = useState<Preset | null>(null);

  const [activeCategory, setActiveCategory] = useState<'custom' | 'busking' | 'sports' | 'party' | 'anniversary' | 'store'>('custom');

  // Preset Live Edit States
  const [editingPresetIndex, setEditingPresetIndex] = useState<number | null>(null);
  const [editingPreset, setEditingPreset] = useState<Preset | null>(null);

  const getFontFamilyClass = (fontFamily?: string, localeOverride?: string) => {
    const loc = localeOverride || activeLocale;
    switch (fontFamily) {
      case 'sans-thin':
        return `font-sign-sans-thin-${loc} font-bold`;
      case 'sans-thick':
        return `font-sign-sans-thick-${loc} font-black`;
      case 'serif':
        return `font-sign-serif-${loc} font-bold`;
      case 'neon':
        return `font-sign-neon-${loc} font-black`;
      case 'pixel':
        return `font-sign-pixel-${loc}`;
      case 'plump':
        return `font-sign-plump-${loc} font-black`;
      default:
        return `font-sign-sans-thin-${loc} font-bold`;
    }
  };

  const handleFontSelect = (fontVal: 'sans-thin' | 'sans-thick' | 'serif' | 'neon' | 'pixel' | 'plump', isEdit: boolean) => {
    const isPremium = fontVal === 'neon' || fontVal === 'pixel' || fontVal === 'plump';
    if (isPremium && room?.tier === 'free') {
      const confirmFontMsg = {
        ko: '이 글꼴은 유료 요금제(Lite 이상) 전용입니다. 요금제를 업그레이드하시겠습니까?',
        en: 'This font is exclusive to paid plans (Lite or higher). Would you like to upgrade your plan?',
        ja: 'このフォントは有料プラン（Lite以上）専用です。プランをアップグレードしますか？',
        es: 'Esta fuente es exclusiva de los planes de pago (Lite o superior). ¿Deseas actualizar tu plan?',
        'zh-TW': '此字型為付費方案（Lite 以上）專用。是否要升級您的方案？',
        'zh-HK': '此字型為付費方案（Lite 以上）專用。是否要升級您的方案？',
      }[activeLocale] || '이 글꼴은 유료 요금제(Lite 이상) 전용입니다. 요금제를 업그레이드하시겠습니까?';
      if (confirm(confirmFontMsg)) {
        setSelectedUpgradeTier(null);
        setUpgradeStep('select');
        setIsUpgradeModalOpen(true);
      }
      return;
    }
    if (isEdit) {
      setEditingPreset(prev => ({ ...prev!, font_family: fontVal }));
    } else {
      setCustomFontFamily(fontVal);
    }
  };

  // Expiration countdown state
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Reset upgrade modal states on close
  useEffect(() => {
    if (!isUpgradeModalOpen) {
      setUpgradeStep('select');
      setSelectedUpgradeTier(null);
    }
  }, [isUpgradeModalOpen]);

  // Reset coupon state when modals are closed
  useEffect(() => {
    if (!isUpgradeModalOpen && !isExtendModalOpen) {
      setVerifiedCoupon(null);
      setPromoCodeInput('');
      setCouponError(null);
    }
  }, [isUpgradeModalOpen, isExtendModalOpen]);

  // Log Funnel logs for view_upgrade (Step 3) when modals open
  useEffect(() => {
    if (isUpgradeModalOpen || isExtendModalOpen) {
      fetch('/api/funnel/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'step3_view_upgrade' })
      }).catch(() => {});
    }
  }, [isUpgradeModalOpen, isExtendModalOpen]);

  // Log Funnel logs for payment_success (Step 4)
  useEffect(() => {
    if (upgradeStep === 'success' || extendStep === 'success') {
      fetch('/api/funnel/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: 'step4_payment_success' })
      }).catch(() => {});
    }
  }, [upgradeStep, extendStep]);

  // ESC key listener to close modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!isUpgrading) {
          setIsUpgradeModalOpen(false);
          if (upgradeStep === 'success') {
            setUpgradeStep('select');
            setSelectedUpgradeTier(null);
          }
        }
        setIsExtendModalOpen(false);
        setIsPasscodeDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isUpgradeModalOpen, isExtendModalOpen, isUpgrading, upgradeStep]);

  // Accidental Navigation Warning & Expiration Countdown Timer
  useEffect(() => {
    // 1. Native beforeunload handler to intercept page refresh or tab close
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ''; // Standard browser dialog prompt
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // 2. Room expiration ticker (6-hour for free, 24-hour for event paid, 365-day for store paid)
    if (!room?.created_at) return;
    const calculateTime = () => {
      const createdTime = new Date(room.created_at).getTime();
      const isSyncLocal = roomId.startsWith('SYNC-');
      let limitMs = 24 * 60 * 60 * 1000;
      if (room.tier === 'free') {
        limitMs = isSyncLocal ? 1 * 60 * 60 * 1000 : 2 * 60 * 60 * 1000;
      } else if (room.tier === 'store') {
        limitMs = 30 * 24 * 60 * 60 * 1000;
      } else if (room.tier === 'store_annual') {
        limitMs = 365 * 24 * 60 * 60 * 1000;
      }
      const expireTime = createdTime + limitMs;
      const now = Date.now();
      const diff = expireTime - now;

      if (diff <= 0) {
        setTimeRemaining(t('exp_expired', activeLocale));
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      let timeStr = '';
      if (days > 0) {
        timeStr = {
          ko: `${days}일 ${hours}시간`,
          en: `${days}d ${hours}h`,
          ja: `${days}日 ${hours}時間`,
          es: `${days}d ${hours}h`,
          'zh-TW': `${days}天 ${hours}小時`,
          'zh-HK': `${days}天 ${hours}小時`,
        }[activeLocale] || `${days}d ${hours}h`;
      } else {
        timeStr = {
          ko: `${hours}시간 ${minutes}분 ${seconds}초`,
          en: `${hours}h ${minutes}m ${seconds}s`,
          ja: `${hours}時間 ${minutes}分 ${seconds}秒`,
          es: `${hours}h ${minutes}m ${seconds}s`,
          'zh-TW': `${hours}小時 ${minutes}分 ${seconds}秒`,
          'zh-HK': `${hours}小時 ${minutes}分 ${seconds}秒`,
        }[activeLocale] || `${hours}시간 ${minutes}분 ${seconds}초`;
      }

      setTimeRemaining(timeStr);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(interval);
    };
  }, [room?.created_at, activeLocale]);

  // Supabase & SSE references
  const supabaseChannelRef = useRef<any>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const [originUrl, setOriginUrl] = useState('');

  const audienceUrl = originUrl && roomId ? `${originUrl}/room/${roomId}` : '';
  const qrCodeUrl = roomId ? `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(audienceUrl)}` : '';

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

  // 1. Authorization and Room Setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOriginUrl(window.location.origin);
      
      // Determine token: check URL search parameter first, then localStorage
      const queryToken = searchParams.get('token');
      const isSyncLocal = roomId.startsWith('SYNC-');
      const localTokenKey = isSyncLocal ? 'glowwave_local_sync_host_token' : `glowwave_token_${roomId}`;
      const localToken = localStorage.getItem(localTokenKey);
      
      const activeToken = queryToken || localToken;
      setToken(activeToken);

      if (queryToken) {
        // Persist token for magic link recovery
        localStorage.setItem(localTokenKey, queryToken);
      }
    }
  }, [searchParams, roomId]);

  // 2. Real-time Connection Engine Setup
  const connectRealtime = useCallback((roomCode: string) => {
    if (isSupabaseConfigured() && supabase) {
      // Connect to Supabase Realtime Channels (Broadcast type)
      console.log('[Dashboard] Connecting via Supabase Realtime Channel');
      setChannelStatus('connecting');

      const channel = supabase.channel(`room_${roomCode}`, {
        config: {
          broadcast: { self: true },
          presence: { key: 'host' }
        }
      });

      channel
        .on('presence', { event: 'sync' }, () => {
          const presenceState = channel.presenceState();
          let count = 0;
          Object.keys(presenceState).forEach((key) => {
            const presences = presenceState[key] as any[];
            presences.forEach((p) => {
              // Count only actual audience members
              if (p.role !== 'host') {
                count++;
              }
            });
          });
          setActiveParticipants(count);
          // Sync real-time count to Supabase Database for serverless cap verification
          if (supabase) {
            supabase.from('rooms').update({ current_participants: count }).eq('id', roomCode).then(({ error }) => {
              if (error) console.error('[Dashboard] Failed to sync current_participants to DB:', error);
            });
          }
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setChannelStatus('connected');
            supabaseChannelRef.current = channel;
            
            // Track host presence
            channel.track({ role: 'host', joined_at: new Date().toISOString() });
          } else {
            setChannelStatus('disconnected');
          }
        });
    } else {
      // Fallback to local Server-Sent Events stream (pass role=host to ignore in count)
      console.log('[Dashboard] Connecting via Local SSE Fallback Stream');
      setChannelStatus('connecting');
      
      const sseUrl = `/api/room/${roomCode}/stream?role=host`;
      const eventSource = new EventSource(sseUrl);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setChannelStatus('connected');
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.event === 'presence') {
            // Receive active connection counts from local SSE registry
            setActiveParticipants(data.count || 0);
          }
        } catch (err) {
          console.error('SSE JSON parse error:', err);
        }
      };

      eventSource.onerror = () => {
        setChannelStatus('disconnected');
      };
    }
  }, []);

  // 3. Fetch Room Details & Initialize Dashboard
  const initDashboard = useCallback(async () => {
    if (!roomId || !token) {
      if (token === null && loading === false) {
        setIsAuthorized(false);
      }
      return;
    }

    setLoading(true);
    setIsNetworkError(false);
    setAuthErrorMessage(null);

    try {
      const response = await fetch(`/api/room/${roomId}/status?token=${token}`);
      if (!response.ok) {
        let errorMsg = {
          ko: '이 방의 생성 세션 정보가 브라우저에 없습니다. 결제하셨던 이메일을 통한 [구매 내역 복구] 기능을 사용해 권한을 획득하십시오.',
          en: 'No host session found in this browser. Please use the [Restore Purchase] feature with your payment email to gain access.',
          ja: 'このルームの作成セッション情報がブラウザにありません。決済時のメールアドレスによる「購入履歴の復元」機能を使用して権限を取得してください。',
          es: 'No se encontró información de la sesión de creación en el navegador. Por favor, utiliza la función [Restaurar Compra] con tu correo electrónico de pago para obtener acceso.',
          'zh-TW': '瀏覽器中無此房間的建立階段資訊。請使用 [購買復元] 功能並輸入您結帳時使用的電子郵件以取得控制權限。',
          'zh-HK': '瀏覽器中無此房間的建立階段資訊。請使用 [購買復元] 功能並輸入您結帳時使用的電子郵件以取得控制權限。',
        }[activeLocale] || '이 방의 생성 세션 정보가 브라우저에 없습니다. 결제하셨던 이메일을 통한 [구매 내역 복구] 기능을 사용해 권한을 획득하십시오.';
        try {
          const errData = await response.json();
          if (errData.suggestion) {
            errorMsg = errData.suggestion; // Directly show the clean user-facing suggestion
          }
        } catch (e) {}

        // Clear credentials ONLY if it is a 404 (Room truly does not exist or expired).
        // If it is a 500/network error, keep credentials so they can retry/refresh!
        if (response.status === 404) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('glowwave_active_host_room_id');
            localStorage.removeItem(`glowwave_presets_${roomId}`);
            localStorage.removeItem(`glowwave_token_${roomId}`);
            localStorage.removeItem('glowwave_local_sync_room_id');
            localStorage.removeItem('glowwave_local_sync_host_token');
            localStorage.removeItem('glowwave_local_sync_room_created_at');
            localStorage.removeItem('glowwave_last_joined_room_id');
          }
          setAuthErrorMessage(errorMsg);
          setIsAuthorized(false);
          
          // Instantly redirect to the standalone local signboard remote
          router.replace('/local');
          return;
        } else {
          // It's a 500 or other server/database error
          setAuthErrorMessage(errorMsg);
          setIsNetworkError(true);
        }
        setLoading(false);
        return;
      }
      
      const roomData = await response.json();
      setRoom({
        id: roomData.room_id,
        host_session_token: token, // Placeholder
        email: roomData.email,
        tier: roomData.tier,
        status: roomData.status,
        max_participants: roomData.max_participants,
        created_at: roomData.created_at,
        passcode: roomData.passcode,
      });

      // Determine active locale
      let currentLocale: Locale = 'ko';
      const savedLocale = (localStorage.getItem(`glowwave_host_locale_${roomId}`) || 
                           localStorage.getItem('glowwave_host_locale') || 
                           localStorage.getItem('glowwave_home_locale') || 
                           localStorage.getItem('glowwave_local_locale')) as Locale;
      if (savedLocale && ['ko', 'en', 'ja', 'es', 'zh-TW', 'zh-HK'].includes(savedLocale)) {
        currentLocale = savedLocale;
        setActiveLocale(savedLocale);
      } else {
        const navLang = navigator.language.toLowerCase();
        if (navLang.startsWith('ko')) currentLocale = 'ko';
        else if (navLang.startsWith('ja')) currentLocale = 'ja';
        else if (navLang.startsWith('es')) currentLocale = 'es';
        else if (navLang.startsWith('zh-tw') || navLang.startsWith('zh-cn')) currentLocale = 'zh-TW';
        else if (navLang.startsWith('zh-hk')) currentLocale = 'zh-HK';
        else currentLocale = 'en';
        setActiveLocale(currentLocale);
        localStorage.setItem(`glowwave_host_locale_${roomId}`, currentLocale);
      }

      const hostDefaults = getDefaultsByLocale(currentLocale);

      let initialPreset: Preset | null = null;
      if (roomData.current_state) {
        initialPreset = roomData.current_state;
      }

      // Load presets from localStorage or import staged presets from Solo Standalone Mode
      const tempImportRaw = localStorage.getItem('glowwave_temp_import_presets');
      let loadedPresets: Preset[] = [];
      let isImported = false;

      if (tempImportRaw) {
        try {
          const importedPresets = JSON.parse(tempImportRaw) as Preset[];
          if (Array.isArray(importedPresets) && importedPresets.length > 0) {
            if (roomData.tier === 'free') {
              // Free tier: slice to 6 presets, downgrade premium fonts & effects
              loadedPresets = importedPresets.slice(0, 6).map(p => ({
                ...p,
                font_family: (p.font_family === 'neon' || p.font_family === 'pixel' || p.font_family === 'plump') 
                  ? 'sans-thin' 
                  : p.font_family,
                special_effect: (p.special_effect === 'hearts' || p.special_effect === 'confetti' || p.special_effect === 'stars') 
                  ? 'none' 
                  : p.special_effect
              }));
            } else {
              // Paid tier: keep all (up to 50)
              loadedPresets = importedPresets.slice(0, 50);
            }
            isImported = true;
            localStorage.setItem(`glowwave_presets_${roomId}`, JSON.stringify(loadedPresets));
          }
        } catch (e) {
          console.error('[Dashboard] Failed to import presets:', e);
        } finally {
          localStorage.removeItem('glowwave_temp_import_presets');
        }
      }

      if (!isImported) {
        const savedPresets = localStorage.getItem(`glowwave_presets_${roomId}`);
        if (savedPresets) {
          try {
            loadedPresets = JSON.parse(savedPresets);
          } catch (e) {
            loadedPresets = [...hostDefaults];
          }
        } else {
          loadedPresets = [...hostDefaults];
        }
      }

      // Automatically translate matching default presets to currentLocale
      if (loadedPresets.length === 0) {
        loadedPresets = [...hostDefaults];
      } else {
        loadedPresets = translateDefaultPresets(loadedPresets, currentLocale);
      }
      localStorage.setItem(`glowwave_presets_${roomId}`, JSON.stringify(loadedPresets));

      // Migrate presets: remove emojis, convert size to number, and set correct premium effects
      let migrated = false;
      const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
      
      loadedPresets = loadedPresets.map((p, idx) => {
        let changed = false;
        
        if (emojiRegex.test(p.text)) {
          p.text = p.text.replace(emojiRegex, '').trim();
          changed = true;
        }

        if ((p.font_family as any) === 'sans' || (p.font_family as any) === 'dot' || !p.font_family) {
          p.font_family = 'sans-thin';
          changed = true;
        }

        // Migrate string font size to numeric slider percentage (30 to 100)
        if (typeof p.font_size === 'string' || p.font_size === undefined) {
          if (p.font_size === 'small') p.font_size = 80;
          else if (p.font_size === 'medium') p.font_size = 100;
          else if (p.font_size === 'large') p.font_size = 100;
          else if (p.font_size === 'huge') p.font_size = 100;
          else p.font_size = 100; // 'auto' -> 100
          changed = true;
        }

        if (!isImported) {
          // Migrate index 0
          const def0 = hostDefaults[0];
          if (idx === 0 && (p.text === '앰비언트' || p.text === '단색' || (def0 && p.text !== def0.text))) {
            p.text = def0 ? def0.text : p.text;
            changed = true;
          }

          // Migrate index 1
          const def1 = hostDefaults[1];
          if (idx === 1 && (p.text === '사이키' || p.text === '부드러운 깜빡이' || (def1 && p.text !== def1.text))) {
            let needsUpdate = false;
            if (p.text !== (def1 ? def1.text : '부드러운 깜빡이')) {
              p.text = def1 ? def1.text : '부드러운 깜빡이';
              needsUpdate = true;
            }
            if (p.bg_color_secondary !== undefined && p.bg_color_secondary !== null) {
              delete p.bg_color_secondary;
              needsUpdate = true;
            }
            if (p.bg_color !== '#3B82F6') {
              p.bg_color = '#3B82F6';
              needsUpdate = true;
            }
            if (p.speed !== 1000) {
              p.speed = 1000;
              needsUpdate = true;
            }
            if (needsUpdate) {
              changed = true;
            }
          }

          // Migrate index 2
          const def2 = hostDefaults[2];
          if (idx === 2 && ((p.effect as string) === 'gradient' || p.text.includes('그라데이션') || p.text.includes('경찰') || p.text === '사이키' || (def2 && p.text !== def2.text))) {
            p.bg_color = '#FFFFFF';
            p.text = def2 ? def2.text : '사이키';
            p.text_color = '#EF4444';
            p.effect = 'blink';
            p.speed = 1527;
            p.bg_color_secondary = '#0B0B0F';
            p.font_size = 100;
            changed = true;
          }

          // Migrate index 3
          const def3 = hostDefaults[3];
          if (idx === 3 && (p.text === '카운트다운' || p.text === '당첨!' || (p.effect as string) === 'equalizer' || p.text.includes('사운드') || p.text.includes('이퀄라이저') || p.text.includes('당첨') || (def3 && p.text !== def3.text))) {
            let needsUpdate = false;
            if (p.text !== (def3 ? def3.text : '당첨!')) {
              p.text = def3 ? def3.text : '당첨!';
              needsUpdate = true;
            }
            if (p.effect !== 'luckydraw_wait') {
              p.effect = 'luckydraw_wait';
              p.bg_color = '#0B0B0F';
              p.text_color = '#FFD700';
              p.speed = 1000;
              p.bg_color_secondary = '#FFD700';
              p.result_text = def3 ? def3.result_text : '아쉽네요! 다음 기회에..';
              p.font_size = 100;
              needsUpdate = true;
            }
            if (needsUpdate) changed = true;
          }

          // Migrate index 5
          const def5 = hostDefaults[5];
          if (idx === 5 && (p.text === '당첨!' || p.text === '카운트다운' || (p.effect as string) === 'equalizer' || p.text.includes('사운드') || p.text.includes('이퀄라이저') || (def5 && p.text !== def5.text))) {
            let needsUpdate = false;
            if (p.text !== (def5 ? def5.text : '카운트다운')) {
              p.text = def5 ? def5.text : '카운트다운';
              needsUpdate = true;
            }
            if (p.effect !== 'countdown') {
              p.effect = 'countdown';
              p.bg_color = '#8B5CF6';
              p.text_color = '#FFFFFF';
              p.speed = 1000;
              p.countdown_seconds = 5;
              p.result_text = def5 ? def5.result_text : 'START';
              p.font_size = 100;
              needsUpdate = true;
            }
            if (needsUpdate) changed = true;
          }
        }

        if (changed) {
          migrated = true;
        }
        return p;
      });

      const hasSavedPresets = !!localStorage.getItem(`glowwave_presets_${roomId}`);
      if (migrated || isImported || !hasSavedPresets) {
        localStorage.setItem(`glowwave_presets_${roomId}`, JSON.stringify(loadedPresets));
      }

      setPresets(loadedPresets);

      // Save/update to recent rooms list
      if (typeof window !== 'undefined') {
        try {
          const recentRaw = localStorage.getItem('glowwave_recent_rooms');
          let recents = recentRaw ? JSON.parse(recentRaw) : [];
          recents = recents.filter((r: any) => r.roomId !== roomId);
          recents.unshift({
            roomId: roomId,
            role: 'host',
            createdAt: roomData.created_at || new Date().toISOString(),
            tier: roomData.tier
          });
          localStorage.setItem('glowwave_recent_rooms', JSON.stringify(recents.slice(0, 50)));
        } catch (e) {
          console.error('Failed to update recent rooms list:', e);
        }
      }

      if (initialPreset) {
        if (emojiRegex.test(initialPreset.text)) {
          initialPreset.text = initialPreset.text.replace(emojiRegex, '').trim();
        }
        setCurrentBroadcastPreset(initialPreset);
      } else if (loadedPresets.length > 0) {
        setCurrentBroadcastPreset(loadedPresets[0]);
      }

      // Hydrate saved theme slots from localStorage for host vault
      if (typeof window !== 'undefined') {
        const savedPackages = localStorage.getItem('glowwave_host_slots');
        if (savedPackages) {
          try {
            setSavedSlots(JSON.parse(savedPackages));
          } catch (e) {}
        }
      }

      setIsAuthorized(true);
      setLoading(false);
      setIsHydrated(true);

      // Connect Real-time Engine
      connectRealtime(roomId);

    } catch (err) {
      console.error('Failed to init dashboard:', err);
      setAuthErrorMessage('네트워크 연결이 일시적으로 원활하지 않습니다. 인터넷 연결을 확인해 주세요.');
      setIsNetworkError(true);
      setLoading(false);
      setIsHydrated(true);
    }
  }, [roomId, token, connectRealtime]);

  // 4. Initial Trigger Hook
  useEffect(() => {
    initDashboard();

    // 8-second interval polling for administrative status check (inactive lockout)
    const statusPoller = setInterval(async () => {
      if (!roomId || !token) return;
      try {
        const response = await fetch(`/api/room/${roomId}/status?token=${token}`);
        if (response.ok) {
          const roomData = await response.json();
          // Update room status in real-time to trigger lockout overlay if inactive
          setRoom(prev => {
            if (!prev) return prev;
            if (prev.status !== roomData.status) {
              return { ...prev, status: roomData.status };
            }
            return prev;
          });
        }
      } catch (err) {
        console.warn('[Status Poller] Failed check:', err);
      }
    }, 8000);

    return () => {
      clearInterval(statusPoller);
      // Cleanup SSE or Supabase
      if (supabaseChannelRef.current && supabase) {
        supabase.removeChannel(supabaseChannelRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [roomId, token, initDashboard]);

  // 5. Auto-reconnect & Sync on Visibility Change (Tab focus / Lock screen unlock)
  useEffect(() => {
    if (!roomId || !token || !isAuthorized) return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        console.log('[Dashboard] Tab active. Re-connecting real-time and syncing session status...');
        
        // Re-connect real-time stream
        connectRealtime(roomId);
        
        // Silent session validation
        try {
          const response = await fetch(`/api/room/${roomId}/status?token=${token}`);
          if (!response.ok) {
            if (response.status === 404) {
              console.warn('[Dashboard] Room not found or expired during visibility check.');
              let errorMsg = '존재하지 않거나 생성 후 24시간이 경과하여 만료된 방 번호입니다.';
              try {
                const errData = await response.json();
                if (errData.suggestion) {
                  errorMsg = errData.suggestion;
                }
              } catch (e) {}
              setAuthErrorMessage(errorMsg);
              if (typeof window !== 'undefined') {
                localStorage.removeItem('glowwave_active_host_room_id');
                localStorage.removeItem(`glowwave_presets_${roomId}`);
                localStorage.removeItem(`glowwave_token_${roomId}`);
              }
              setIsAuthorized(false);
            } else {
              console.warn('[Dashboard] Reconnect validation check returned error status:', response.status);
            }
            return;
          }
          
          const roomData = await response.json();
          // Update room details silently
          setRoom(prev => prev ? {
            ...prev,
            tier: roomData.tier,
            status: roomData.status,
            max_participants: roomData.max_participants,
            passcode: roomData.passcode,
          } : null);

        } catch (err) {
          console.warn('[Dashboard] Reconnect status check failed (network offline):', err);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [roomId, token, isAuthorized, connectRealtime]);

  const TIER_ORDER: Record<string, number> = {
    free: 0,
    lite: 1,
    pro: 2,
    max: 3
  };

  const getUpgradableTiers = () => {
    const currentTier = room?.tier || 'free';
    
    // 🚨 Support store-monthly to store-annual upgrade route
    if (currentTier === 'store') {
      return ['store_annual'] as TierType[];
    }
    if (currentTier === 'store_annual') {
      return [] as TierType[];
    }
    
    if (currentTier === 'max') {
      return [] as TierType[];
    }
    const currentOrder = TIER_ORDER[currentTier] ?? 0;
    return ['lite', 'pro', 'max'].filter(
      (key) => TIER_ORDER[key] > currentOrder
    ) as TierType[];
  };

  const handleExtendRoom = async () => {
    if (!roomId || !token) return;
    setIsExtending(true);
    try {
      const res = await fetch(`/api/room/extend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: roomId,
          host_session_token: token,
          extra_hours: selectedExtendHours,
          promo_code: verifiedCoupon ? verifiedCoupon.code : undefined
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '시간 연장 처리 중 오류가 발생했습니다.');
      }

      const data = await res.json();
      if (room) {
        setRoom({
          ...room,
          created_at: data.created_at
        });
      }
      setExtendStep('success');
    } catch (err: any) {
      console.error(err);
      const errPrefix = {
        ko: '오류',
        en: 'Error',
        ja: 'エラー',
        es: 'Error',
        'zh-TW': '錯誤',
        'zh-HK': '錯誤',
      }[activeLocale] || '오류';
      showAlert(`${errPrefix}: ${err.message}`);
    } finally {
      setIsExtending(false);
    }
  };

  const handleUpgrade = async () => {
    if (!roomId || !token || !selectedUpgradeTier) return;
    setIsUpgrading(true);
    try {
      const res = await fetch(`/api/room/upgrade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: roomId,
          host_session_token: token,
          new_tier: selectedUpgradeTier,
          promo_code: verifiedCoupon ? verifiedCoupon.code : undefined
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '업그레이드 처리 중 오류가 발생했습니다.');
      }

      // Refresh room details from database
      const syncResponse = await fetch(`/api/room/${roomId}/status?token=${token}`);
      if (syncResponse.ok) {
        const roomData = await syncResponse.json();
        setRoom({
          id: roomData.room_id,
          host_session_token: token,
          email: roomData.email,
          tier: roomData.tier,
          status: roomData.status,
          max_participants: roomData.max_participants,
          created_at: roomData.created_at,
          passcode: roomData.passcode,
        });
      }

      setUpgradeStep('success');
    } catch (err: any) {
      console.error(err);
      const errPrefix = {
        ko: '오류',
        en: 'Error',
        ja: 'エラー',
        es: 'Error',
        'zh-TW': '錯誤',
        'zh-HK': '錯誤',
      }[activeLocale] || '오류';
      showAlert(`${errPrefix}: ${err.message}`);
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleUpdatePasscode = async (newPasscode?: string) => {
    if (!roomId || !token) return;
    setIsPasscodeUpdating(true);
    setPasscodeUpdateError('');
    try {
      const res = await fetch(`/api/room/update-passcode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: roomId,
          host_session_token: token,
          passcode: newPasscode || null
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '비밀번호 변경 처리 중 오류가 발생했습니다.');
      }

      // Sync React state
      if (room) {
        setRoom({
          ...room,
          passcode: newPasscode || undefined
        });
      }
      if (newPasscode) {
        localStorage.setItem(`glowwave_passcode_${roomId}`, newPasscode);
      } else {
        localStorage.removeItem(`glowwave_passcode_${roomId}`);
      }
      setIsPasscodeDrawerOpen(false);
    } catch (err: any) {
      console.error(err);
      setPasscodeUpdateError(err.message || '비밀번호를 변경하지 못했습니다.');
    } finally {
      setIsPasscodeUpdating(false);
    }
  };

  // Helper to sync selected preset to live control panel inputs
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
        const defaultLoseText = {
          ko: '아쉽네요! 다음 기회에..',
          en: 'Better luck next time!',
          ja: '残念！次の機会に..',
          es: '¡Qué lástima! Otra vez será..',
          'zh-TW': '真可惜！下次再接再厲..',
          'zh-HK': '真可惜！下次再接再厲..',
        }[activeLocale] || '아쉽네요! 다음 기회에..';
        setCustomResultText(defaultLoseText);
      } else {
        setCustomResultText('START');
      }
    }
  };

  const handleSaveHostPreset = () => {
    // Check tier limit: Free tier is limited to 6 presets max
    if (room?.tier === 'free' && presets.length >= 6) {
      setSelectedUpgradeTier(null);
      setUpgradeStep('select');
      setIsUpgradeModalOpen(true);
      return;
    }

    const calculatedSpeed = getSpeedMs(customEffect, customSpeed);
    const newPreset: Preset = {
      bg_color: customBgColor,
      text: customText.trim() || 'GLOW WAVE',
      text_color: customTextColor,
      effect: customEffect,
      speed: calculatedSpeed,
      font_size: customFontSize,
      font_family: customFontFamily,
      special_effect: customSpecialEffect,
      countdown_seconds: customEffect === 'countdown' ? customCountdownSeconds : undefined,
      result_text: (customEffect === 'countdown' || customEffect === 'luckydraw_wait') ? customResultText : undefined
    };

    const updated = [...presets, newPreset];
    setPresets(updated);
    localStorage.setItem(`glowwave_presets_${roomId}`, JSON.stringify(updated));
    setActiveCategory('custom'); // Auto-switch to personal presets tab
    
    // Toast alert message localized
    const successMsg = {
      ko: '현재 즉석 라이브 설정이 내 프리셋에 추가되었습니다!',
      en: 'Current live setting has been added to My Presets!',
      ja: '現在の設定がマイプリセットに追加されました！',
      es: '¡El ajuste actual ha sido añadido a mis ajustes!',
      'zh-TW': '目前設定已新增至我的預設！',
      'zh-HK': '目前設定已新增至我的預設！'
    }[activeLocale] || '현재 즉석 라이브 설정이 내 프리셋에 추가되었습니다!';
    showAlert(successMsg);
  };

  // Slots Vault Handlers for Host
  const handleSaveSlotPackage = () => {
    const defaultName = {
      ko: `저장된 테마 #${savedSlots.length + 1}`,
      en: `Saved Theme #${savedSlots.length + 1}`,
      ja: `保存されたテーマ #${savedSlots.length + 1}`,
      es: `Tema Guardado #${savedSlots.length + 1}`,
      'zh-TW': `已儲存的主題 #${savedSlots.length + 1}`,
      'zh-HK': `已儲存的主題 #${savedSlots.length + 1}`,
    }[activeLocale] || `저장된 테마 #${savedSlots.length + 1}`;
    const name = newSlotName.trim() || defaultName;
    const newSlot = { name, presets: [...presets] };
    const updated = [...savedSlots, newSlot];
    setSavedSlots(updated);
    localStorage.setItem('glowwave_host_slots', JSON.stringify(updated));
    setNewSlotName('');
  };

  const handleLoadSlotPackage = (index: number) => {
    const slot = savedSlots[index];
    if (slot && slot.presets && slot.presets.length > 0) {
      let presetsToLoad = slot.presets;
      // Truncate to 6 presets on FREE tier
      if (room?.tier === 'free' && presetsToLoad.length > 6) {
        const freeLimitAlert = {
          ko: '무료 요금제 방은 최대 6개의 프리셋만 가질 수 있습니다. 슬롯에서 상위 6개 프리셋만 불러왔습니다.',
          en: 'Free tier rooms can have a maximum of 6 presets. Only the top 6 presets have been loaded.',
          ja: '無料プランのルームは最大6個のプリセットのみ保持できます。スロットから上位6個のプリセットのみを読み込みました。',
          es: 'Las salas de plan gratuito solo pueden tener un máximo de 6 ajustes. Solo se han cargado los primeros 6 ajustes.',
          'zh-TW': '免費方案房間最多只能有 6 個預設卡片。已僅載入前 6 個預設卡片。',
          'zh-HK': '免費方案房間最多只能有 6 個預設卡片。已僅載入前 6 個預設卡片。',
        }[activeLocale] || '무료 요금제 방은 최대 6개의 프리셋만 가질 수 있습니다. 슬롯에서 상위 6개 프리셋만 불러왔습니다.';
        showAlert(freeLimitAlert);
        presetsToLoad = presetsToLoad.slice(0, 6);
      }
      setPresets(presetsToLoad);
      localStorage.setItem(`glowwave_presets_${roomId}`, JSON.stringify(presetsToLoad));
      
      // Update room state in Supabase so listeners get updated
      if (isSupabaseConfigured() && supabase) {
        supabase.from('rooms').update({ current_state: presetsToLoad[0] }).eq('id', roomId);
      }

      setCurrentBroadcastPreset(presetsToLoad[0]);
      applyPresetToController(presetsToLoad[0]);
      setActivePresetIndex(0);
      setIsVaultOpen(false);
    }
  };

  const handleDeleteSlotPackage = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmDeleteSlot = {
      ko: '이 테마 보관 슬롯을 삭제하시겠습니까?',
      en: 'Are you sure you want to delete this saved theme slot?',
      ja: 'このテーマ保存スロットを削除しますか？',
      es: '¿Estás seguro de que deseas eliminar esta ranura de tema guardado?',
      'zh-TW': '確定要刪除此儲存的主題格嗎？',
      'zh-HK': '確定要刪除此儲存的主題格嗎？',
    }[activeLocale] || '이 테마 보관 슬롯을 삭제하시겠습니까?';
    if (confirm(confirmDeleteSlot)) {
      const updated = savedSlots.filter((_, idx) => idx !== index);
      setSavedSlots(updated);
      localStorage.setItem('glowwave_host_slots', JSON.stringify(updated));
    }
  };

  const handleResetDashboard = () => {
    if (confirm(t('confirm_reset_all', activeLocale))) {
      localStorage.removeItem(`glowwave_presets_${roomId}`);
      localStorage.removeItem('glowwave_host_slots');
      
      const loadedPresets = getDefaultsByLocale(activeLocale);
      setPresets(loadedPresets);
      setSavedSlots([]);
      setActivePresetIndex(0);
      setCurrentBroadcastPreset(loadedPresets[0]);
      applyPresetToController(loadedPresets[0]);
      
      if (isSupabaseConfigured() && supabase) {
        supabase.from('rooms').update({ current_state: loadedPresets[0] }).eq('id', roomId);
      }
      
      showAlert(t('reset_success', activeLocale));
      setIsVaultOpen(false);
    }
  };

  const handleLocaleChange = (newLocale: Locale) => {
    setActiveLocale(newLocale);
    localStorage.setItem(`glowwave_host_locale_${roomId}`, newLocale);
    localStorage.setItem('glowwave_host_locale', newLocale);
    localStorage.setItem('glowwave_home_locale', newLocale);
    localStorage.setItem('glowwave_local_locale', newLocale);

    let updated: Preset[] = [];
    if (presets.length === 0) {
      updated = getDefaultsByLocale(newLocale);
    } else {
      updated = translateDefaultPresets(presets, newLocale);
    }
    setPresets(updated);
    localStorage.setItem(`glowwave_presets_${roomId}`, JSON.stringify(updated));

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
            : (activePreset.effect === 'luckydraw_wait' && (!activePreset.result_text || activePreset.result_text === '아쉽네요! 다음 기회에..' || activePreset.result_text === 'Good luck next time!' || activePreset.result_text === '残念！また今度ね..' || activePreset.result_text === '¡Suerte la próxima!' || activePreset.result_text === '沒中，再接再厲！' || activePreset.result_text === '冇中，下次好運！'))
              ? newDefaults[idx].result_text
              : activePreset.result_text
        };
        setCurrentBroadcastPreset(activePreset);
        applyPresetToController(activePreset);
        
        if (isSupabaseConfigured() && supabase) {
          supabase.from('rooms').update({ current_state: activePreset }).eq('id', roomId);
        }
      }
    }
  };

  // Wireless Sharing Handlers for Host
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
      const url = `${window.location.origin}/host/setup?import=${data.shareKey}`;
      setShareQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(url)}`);
    } catch (e) {
      console.error(e);
      const shareGenFailMsg = {
        ko: '공유 코드 생성에 실패했습니다.',
        en: 'Failed to generate share code.',
        ja: '共有コードの生成に失敗しました。',
        es: 'Error al generar el código de compartición.',
        'zh-TW': '生成分享密碼失敗。',
        'zh-HK': '生成分享密碼失敗。',
      }[activeLocale] || '공유 코드 생성에 실패했습니다.';
      showAlert(shareGenFailMsg);
    } finally {
      setIsSharingLoading(false);
    }
  };

  const handleImportShareCode = async () => {
    const code = shareCodeInput.trim().toUpperCase();
    if (!code || code.length !== 6) {
      const invalidCodeMsg = {
        ko: '올바른 6자리 공유 코드를 입력하세요.',
        en: 'Please enter a valid 6-digit share code.',
        ja: '有効な6桁の共有コードを入力してください。',
        es: 'Por favor, introduce un código de compartición de 6 dígitos válido.',
        'zh-TW': '請輸入有效的 6 位數分享密碼。',
        'zh-HK': '請輸入有效的 6 位數分享密碼。',
      }[activeLocale] || '올바른 6자리 공유 코드를 입력하세요.';
      showAlert(invalidCodeMsg);
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
        let presetsToImport = data.presets;
        if (room?.tier === 'free' && presetsToImport.length > 6) {
          const freeLimitShareMsg = {
            ko: '무료 요금제 방은 최대 6개의 프리셋만 가질 수 있습니다. 공유받은 팩에서 상위 6개 프리셋만 가져왔습니다.',
            en: 'Free tier rooms can have a maximum of 6 presets. Only the top 6 presets from the shared pack have been imported.',
            ja: '無料プランのルームは最大6個のプリセットのみ保持できます。共有パックから上位6個のプリセットのみを取得しました。',
            es: 'Las salas de plan gratuito solo pueden tener un máximo de 6 ajustes. Solo se han importado los primeros 6 ajustes del paquete compartido.',
            'zh-TW': '免費方案房間最多只能有 6 個預設卡片。已僅載入共享包中前 6 個預設卡片。',
            'zh-HK': '免費方案房間最多只能有 6 個預設卡片。已僅載入共享包中前 6 個預設卡片。',
          }[activeLocale] || '무료 요금제 방은 최대 6개의 프리셋만 가질 수 있습니다. 공유받은 팩에서 상위 6개 프리셋만 가져왔습니다.';
          showAlert(freeLimitShareMsg);
          presetsToImport = presetsToImport.slice(0, 6);
        }
        
        setPresets(presetsToImport);
        localStorage.setItem(`glowwave_presets_${roomId}`, JSON.stringify(presetsToImport));
        setCurrentBroadcastPreset(presetsToImport[0]);
        applyPresetToController(presetsToImport[0]);
        setActivePresetIndex(0);
        
        setIsVaultOpen(false);
        setShareCodeInput('');
        const syncSuccessMsg = {
          ko: '공유받은 프리셋을 정상적으로 동기화했습니다! 🎉',
          en: 'Shared presets synchronized successfully! 🎉',
          ja: '共有されたプリセットが正常に同期されました！🎉',
          es: '¡Ajustes compartidos sincronizados con éxito! 🎉',
          'zh-TW': '已成功同步共享的預設卡片！🎉',
          'zh-HK': '已成功同步共享的預設卡片！🎉',
        }[activeLocale] || '공유받은 프리셋을 정상적으로 동기화했습니다! 🎉';
        showAlert(syncSuccessMsg);
      } else {
        throw new Error('올바르지 않은 프리셋 형식입니다.');
      }
    } catch (e: any) {
      console.error(e);
      const importFailFallback = {
        ko: '가져오기에 실패했습니다. 만료된 코드인지 확인해 보세요.',
        en: 'Failed to import. Please check if the code has expired.',
        ja: 'インポートに失敗しました。コードの期限が切れていないか確認してください。',
        es: 'Error al importar. Por favor, comprueba si el código ha expirado.',
        'zh-TW': '載入失敗。請檢查密碼是否已過期。',
        'zh-HK': '載入失敗。請檢查密碼是否已過期。',
      }[activeLocale] || '가져오기에 실패했습니다. 만료된 코드인지 확인해 보세요.';
      showAlert(e.message || importFailFallback);
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

  // QR Code Scanner Mechanics for Host
  const startScanning = async () => {
    setIsScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      scannerStreamRef.current = stream;
      if (scannerVideoRef.current) {
        scannerVideoRef.current.srcObject = stream;
        scannerVideoRef.current.setAttribute('playsinline', 'true');
        scannerVideoRef.current.play();
        requestAnimationFrame(tickScanner);
      }
    } catch (err) {
      console.error('Camera access error:', err);
      const camPermissionMsg = {
        ko: '카메라 접근 권한이 필요합니다. 브라우저 설정에서 카메라 권한을 허용해 주세요.',
        en: 'Camera access permission is required. Please allow camera permissions in browser settings.',
        ja: 'カメラへのアクセス権限が必要です。ブラウザの設定でカメラの権限を許可してください。',
        es: 'Se requiere permiso de acceso a la cámara. Por favor, permite el acceso en la configuración del navegador.',
        'zh-TW': '需要相機存取權限。請在瀏覽器設定中允許使用相機。',
        'zh-HK': '需要相機存取權限。請在瀏覽器設定中允許使用相機。',
      }[activeLocale] || '카메라 접근 권한이 필요합니다. 브라우저 설정에서 카메라 권한을 허용해 주세요.';
      showAlert(camPermissionMsg);
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
      console.log('Scanned QR Code:', code.data);
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
        setShareCodeInput(importKey);
        stopScanning();
        setIsSharingLoading(true);
        fetch(`/api/preset-share?key=${importKey.toUpperCase()}`)
          .then(res => {
            if (!res.ok) throw new Error('API failed');
            return res.json();
          })
          .then(data => {
            if (Array.isArray(data.presets) && data.presets.length > 0) {
              let presetsToImport = data.presets;
              if (room?.tier === 'free' && presetsToImport.length > 6) {
                const freeLimitShareMsg = {
                  ko: '무료 요금제 방은 최대 6개의 프리셋만 가질 수 있습니다. 공유받은 팩에서 상위 6개 프리셋만 가져왔습니다.',
                  en: 'Free tier rooms can have a maximum of 6 presets. Only the top 6 presets from the shared pack have been imported.',
                  ja: '無料プラン의룸은최대6개의프리셋만가질수있습니다.공유받은팩에서상위6개프리셋만가져왔습니다.',
                  es: 'Las salas de plan gratuito solo pueden tener un máximo de 6 ajustes. Solo se han importado los primeros 6 ajustes del paquete compartido.',
                  'zh-TW': '免費方案房間最多只能有 6 個預設卡片。已僅載入共享包中前 6 個預設卡片。',
                  'zh-HK': '免費方案房間最多只能有 6 個預設卡片。已僅載入共享包中前 6 個預設卡片。',
                }[activeLocale] || '무료 요금제 방은 최대 6개의 프리셋만 가질 수 있습니다. 공유받은 팩에서 상위 6개 프리셋만 가져왔습니다.';
                showAlert(freeLimitShareMsg);
                presetsToImport = presetsToImport.slice(0, 6);
              }
              setPresets(presetsToImport);
              localStorage.setItem(`glowwave_presets_${roomId}`, JSON.stringify(presetsToImport));
              setCurrentBroadcastPreset(presetsToImport[0]);
              applyPresetToController(presetsToImport[0]);
              setActivePresetIndex(0);
              setIsVaultOpen(false);
              setShareCodeInput('');
              const syncSuccessMsg = {
                ko: '공유받은 프리셋을 정상적으로 동기화했습니다! 🎉',
                en: 'Shared presets synchronized successfully! 🎉',
                ja: '共有されたプリセットが正常に同期されました！🎉',
                es: '¡Ajustes compartidos sincronizados con éxito! 🎉',
                'zh-TW': '已成功同步共享的預設卡片！🎉',
                'zh-HK': '已成功同步共享的預設卡片！🎉',
              }[activeLocale] || '공유받은 프리셋을 정상적으로 동기화했습니다! 🎉';
              showAlert(syncSuccessMsg);
            }
          })
          .catch(err => {
            console.error(err);
            const qrImportFailMsg = {
              ko: '가져오기에 실패했습니다. 만료된 코드이거나 네트워크 오류입니다.',
              en: 'Failed to import. The code may have expired or a network error occurred.',
              ja: 'インポートに失敗しました。コードの期限切れか、ネットワークエラーの可能性があります。',
              es: 'Error al importar. El código puede haber expirado o puede haber ocurrido un error de red.',
              'zh-TW': '載入失敗。密碼可能已過期或發生網路錯誤。',
              'zh-HK': '載入失敗。密碼可能已過期或發生網路錯誤。',
            }[activeLocale] || '가져오기에 실패했습니다. 만료된 코드이거나 네트워크 오류입니다.';
            showAlert(qrImportFailMsg);
          })
          .finally(() => {
            setIsSharingLoading(false);
          });
      } else {
        requestAnimationFrame(tickScanner);
      }
    } else {
      requestAnimationFrame(tickScanner);
    }
  };

  // Blackout Mode Trigger for Host Dashboard
  const handleBlackoutToggle = (value: boolean) => {
    if (value) {
      // Turn ON blackout
      setLastActivePresetBeforeBlackout(currentBroadcastPreset);
      const blackoutPreset: Preset = {
        bg_color: '#000000',
        text: '',
        text_color: '#000000',
        effect: 'none',
        speed: 1000,
        font_size: 100,
        font_family: 'sans-thin',
        special_effect: 'none',
        trigger_id: 'blackout-' + Date.now().toString(),
        blackout: true
      };
      setIsBlackout(true);
      triggerPreset(blackoutPreset, -1);
    } else {
      // Turn OFF blackout
      setIsBlackout(false);
      if (lastActivePresetBeforeBlackout) {
        triggerPreset(lastActivePresetBeforeBlackout, activePresetIndex !== null ? activePresetIndex : -1);
      } else {
        triggerPreset(presets[0] || defaults[0], 0);
      }
    }
  };

  // 4. Trigger Preset Broadcast Signal
  const triggerPreset = async (preset: Preset, index: number) => {
    if (!roomId || !token) return;

    // Turn off blackout automatically if sending a non-blackout preset
    if (isBlackout && !preset.blackout) {
      setIsBlackout(false);
    }

    // Inject unique trigger_id for animation & countdown reset
    const presetWithTrigger: Preset = {
      ...preset,
      trigger_id: Date.now().toString()
    };

    setActivePresetIndex(index);
    setCurrentBroadcastPreset(presetWithTrigger);
    
    // Synchronize to custom live controller inputs
    applyPresetToController(presetWithTrigger);

    if (isSupabaseConfigured() && supabaseChannelRef.current && supabase) {
      // Send directly over WebSockets in-memory broadcast
      supabaseChannelRef.current.send({
        type: 'broadcast',
        event: 'render',
        payload: presetWithTrigger
      });
      // Also update the current state in Supabase so newly joined spectators sync properly
      supabase.from('rooms').update({ current_state: presetWithTrigger }).eq('id', roomId).then(({ error }) => {
        if (error) console.error('[Dashboard] Error persisting current state:', error);
      });
      console.log(`[Dashboard] Broadcast preset: ${presetWithTrigger.text} via Supabase Channel`);
    } else {
      // Fallback: POST to Broadcast Route
      try {
        const response = await fetch(`/api/room/${roomId}/broadcast`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            host_session_token: token,
            preset: presetWithTrigger
          })
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || '전송 실패');
        }
        console.log(`[Dashboard] Broadcast preset: ${presetWithTrigger.text} via Local API`);
      } catch (err: any) {
        console.error('Trigger preset error:', err);
        const txErrorPrefix = {
          ko: '전송 오류',
          en: 'Transmission Error',
          ja: '送信エラー',
          es: 'Error de Transmisión',
          'zh-TW': '傳送錯誤',
          'zh-HK': '傳送錯誤',
        }[activeLocale] || '전송 오류';
        showAlert(`${txErrorPrefix}: ${err.message}`);
      }
    }
  };

  const handleDrawWinner = async () => {
    if (!roomId || !token) return;

    let candidateUuids: string[] = [];

    if (isSupabaseConfigured() && supabaseChannelRef.current && supabase) {
      try {
        const presenceState = supabaseChannelRef.current.presenceState();
        Object.keys(presenceState).forEach((key) => {
          const presences = presenceState[key] as any[];
          presences.forEach((p) => {
            if (p.role === 'audience' && p.uuid) {
              candidateUuids.push(p.uuid);
            }
          });
        });
      } catch (err) {
        console.error('Failed to parse Supabase presence for drawing:', err);
      }
    } else {
      try {
        const response = await fetch(`/api/room/${roomId}/participants?token=${token}`);
        if (response.ok) {
          const data = await response.json();
          candidateUuids = data.participants || [];
        }
      } catch (err) {
        console.error('Failed to fetch local participants for drawing:', err);
      }
    }

    candidateUuids = Array.from(new Set(candidateUuids));

    if (candidateUuids.length === 0) {
      console.log('[Dashboard] No participants active. Generating a mock winner ID for testing.');
      candidateUuids.push('mock-winner-uuid-' + Math.floor(Math.random() * 1000));
    }

    // Determine the number of winners to draw
    const drawCount = currentBroadcastPreset.lucky_draw_count || 1;
    
    // Draw unique winners
    const shuffled = [...candidateUuids].sort(() => 0.5 - Math.random());
    const winnerIds = shuffled.slice(0, drawCount);

    const drawResultPreset: Preset = {
      ...currentBroadcastPreset,
      effect: 'luckydraw',
      lucky_draw_winner_id: winnerIds[0], // backward compatibility for first winner
      lucky_draw_winner_ids: winnerIds,
      trigger_id: Date.now().toString()
    };

    setCurrentBroadcastPreset(drawResultPreset);

    if (isSupabaseConfigured() && supabaseChannelRef.current && supabase) {
      supabaseChannelRef.current.send({
        type: 'broadcast',
        event: 'render',
        payload: drawResultPreset
      });
      await supabase.from('rooms').update({ current_state: drawResultPreset }).eq('id', roomId);
    } else {
      try {
        await fetch(`/api/room/${roomId}/broadcast`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            host_session_token: token,
            preset: drawResultPreset
          })
        });
      } catch (err) {
        console.error('Failed to broadcast lucky draw result:', err);
      }
    }
  };

  const copyAudienceUrl = () => {
    if (!originUrl || !roomId) return;
    const url = `${originUrl}/room/${roomId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQrCode = async () => {
    if (!roomId) return;
    const targetQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(audienceUrl)}`;
    try {
      const response = await fetch(targetQrUrl);
      if (!response.ok) throw new Error("CORS or network error");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `glowwave_room_${roomId}_qr.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.warn("Direct blob QR download failed, falling back to new window:", err);
      window.open(targetQrUrl, '_blank');
    }
  };

  const handleRegenerateRoomId = () => {
    const confirmMsg = {
      ko: '접속 코드를 재생성하면 현재 연결된 모든 관객 기기가 강제 종료(퇴장)됩니다. 진행하시겠습니까?',
      en: 'Regenerating the room code will forcefully disconnect all active spectators. Do you want to proceed?',
      ja: '接続コードを再生成すると、現在接続されているすべての観客デバイスが強制終了されます。よろしいですか？',
      es: 'Regenerar el código de sala desconectará a todos los espectadores activos. ¿Desea proceder?',
      'zh-TW': '重新產生房間代碼將強制斷開所有作用中的觀眾。您確定要繼續嗎？',
      'zh-HK': '重新產生房間代碼將強制斷開所有作用中的觀眾。您確定要繼續嗎？'
    }[activeLocale] || '접속 코드를 재생성하면 현재 연결된 모든 관객 기기가 강제 종료됩니다. 진행하시겠습니까?';

    showConfirm(confirmMsg, async () => {
      try {
        const res = await fetch('/api/room/regenerate-id', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId,
            hostSessionToken: token
          })
        });

        if (!res.ok) {
          throw new Error('Failed to regenerate room ID');
        }

        const data = await res.json();
        if (data.success && data.new_room_id) {
          router.replace(`/host/dashboard/${data.new_room_id}?token=${token}`);
        } else {
          alert('Error: ' + (data.error || 'Unknown error'));
        }
      } catch (err) {
        console.error('Failed to regenerate room ID:', err);
        alert(activeLocale === 'ko' ? '방 코드 재발급에 실패했습니다.' : 'Failed to regenerate room code.');
      }
    });
  };

  if (loading || !isHydrated) {
    return (
      <div className="min-h-screen bg-[#0B0B0F] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
          <p className="text-sm text-zinc-400 font-medium h-5">
            {isHydrated ? (t('dashboard_loading', activeLocale) || '대시보드 로딩 중...') : ''}
          </p>
        </div>
      </div>
    );
  }

  // Network/Server connection error Screen
  if (isNetworkError) {
    return (
      <div className="min-h-screen bg-[#0B0B0F] text-foreground flex flex-col justify-center items-center px-6 text-center">
        <div className="glass-effect p-8 rounded-2xl max-w-md border border-indigo-500/20">
          <RefreshCw className="w-12 h-12 text-indigo-400 mx-auto mb-4 animate-spin" style={{ animationDuration: '3s' }} />
          <h2 className="text-xl font-bold text-white mb-2">
            {
              {
                ko: '서버 연결 일시 지연',
                en: 'Server Connection Delayed',
                ja: 'サーバー接続遅延',
                es: 'Conexión de servidor retrasada',
                'zh-TW': '伺服器連線延遲',
                'zh-HK': '伺服器連線延遲'
              }[activeLocale] || '서버 연결 일시 지연'
            }
          </h2>
          <p className="text-sm text-zinc-400 mb-6 whitespace-pre-line font-medium leading-relaxed">
            {authErrorMessage || 
              {
                ko: '인터넷 연결이 불안정하거나 서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.',
                en: 'Internet connection is unstable or the server response is delayed. Please try again in a moment.',
                ja: 'インターネット接続が不安定か、サーバーの応答が遅れています。しばらくしてからもう一度お試しください。',
                es: 'La conexión a Internet es inestable o la respuesta del servidor se retrasa. Por favor, inténtelo de nuevo en un momento.',
                'zh-TW': '網路連線不穩定或伺服器回應延遲。請稍後再試。',
                'zh-HK': '網路連線不穩定或伺服器回應延遲。請稍後再試。'
              }[activeLocale] || '인터넷 연결이 불안정하거나 서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.'
            }
          </p>
          <div className="flex flex-col gap-2 w-full">
            <button
              onClick={() => initDashboard()}
              className="py-3 px-4 rounded-xl bg-white text-black font-extrabold text-sm hover:bg-zinc-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
            >
              {
                {
                  ko: '다시 연결 시도 ⚡',
                  en: 'Retry Connection ⚡',
                  ja: '再接続を試行 ⚡',
                  es: 'Reintentar Conexión ⚡',
                  'zh-TW': '重新嘗試連線 ⚡',
                  'zh-HK': '重新嘗試連線 ⚡'
                }[activeLocale] || '다시 연결 시도 ⚡'
              }
            </button>
            <Link href="/" className="text-sm text-zinc-400 hover:text-white py-2 font-semibold">
              {
                {
                  ko: '메인 홈으로 가기',
                  en: 'Go to Home',
                  ja: 'メインホームへ戻る',
                  es: 'Ir al Inicio',
                  'zh-TW': '回首頁',
                  'zh-HK': '回首頁'
                }[activeLocale] || '메인 홈으로 가기'
              }
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Access Denied Screen
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#0B0B0F] text-foreground flex flex-col justify-center items-center px-6 text-center">
        <div className="glass-effect p-8 rounded-2xl max-w-md border border-red-500/10">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">
            {
              {
                ko: '권한이 없거나 만료된 방입니다',
                en: 'Unauthorized or Expired Room',
                ja: '権限がないか期限切れのルームです',
                es: 'Sala no autorizada o caducada',
                'zh-TW': '無權限或已過期的房間',
                'zh-HK': '無權限或已過期的房間'
              }[activeLocale] || '권한이 없거나 만료된 방입니다'
            }
          </h2>
          <p className="text-sm text-zinc-400 mb-6 whitespace-pre-line font-medium leading-relaxed">
            {authErrorMessage || 
              {
                ko: '이 방의 활성 세션 정보가 브라우저에 없습니다. 결제하셨던 이메일을 통한 [구매 내역 복구] 기능을 사용해 권한을 獲得하십시오.',
                en: 'Active session info for this room is missing. Please retrieve access using the [Restore Purchase] feature with your payment email.',
                ja: 'このルームの有効なセッション情報がブラウザにありません。決済されたメールアドレスを使用し「購入履歴の復元」機能で権限を取得してください。',
                es: 'No se encuentra información de sesión activa para esta sala. Recupere el acceso utilizando la función [Restaurar compra] con su correo electrónico de pago.',
                'zh-TW': '瀏覽器中無此房間的啟用工作階段資訊。請使用您付款時填寫的電子郵件，透過 [還原購買紀錄] 功能重新取得管理權限。',
                'zh-HK': '瀏覽器中無此房間的啟用工作階段資訊。請使用您付款時填寫的電子郵件，透過 [還原購買紀錄] 功能重新取得管理權限。'
              }[activeLocale] || '이 방의 활성 세션 정보가 브라우저에 없습니다. 결제하셨던 이메일을 통한 [구매 내역 복구] 기능을 사용해 권한을 획득하십시오.'
            }
          </p>
          <div className="flex flex-col gap-2">
            <Link href="/recovery" className="py-3 px-4 rounded-xl bg-white text-black font-semibold text-sm hover:bg-zinc-200 transition-all flex items-center justify-center">
              {
                {
                  ko: '구매 내역 복구하기',
                  en: 'Restore Purchase History',
                  ja: '購入履歴を復元する',
                  es: 'Restaurar historial de compras',
                  'zh-TW': '還原購買紀錄',
                  'zh-HK': '還原購買紀錄'
                }[activeLocale] || '구매 내역 복구하기'
              }
            </Link>
            <Link href="/" className="text-sm text-zinc-400 hover:text-white py-2 font-semibold">
              {
                {
                  ko: '메인 홈으로 가기',
                  en: 'Go to Home',
                  ja: 'メインホームへ戻る',
                  es: 'Ir al Inicio',
                  'zh-TW': '回首頁',
                  'zh-HK': '回首頁'
                }[activeLocale] || '메인 홈으로 가기'
              }
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (room && room.status === 'inactive') {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#030305] flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="absolute top-[10%] left-[-10%] w-[40vw] h-[40vw] bg-red-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[20%] right-[-10%] w-[45vw] h-[45vw] bg-amber-600/5 rounded-full blur-[140px] pointer-events-none" />
        <div className="max-w-md w-full bg-[#0c0c14]/90 border border-red-500/20 backdrop-blur-2xl p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-6 relative z-10 animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 animate-pulse">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-black text-white uppercase tracking-wider">송출 차단된 전광판</h2>
            <p className="text-xs text-zinc-400 font-bold font-mono">ROOM ID: {room.id}</p>
          </div>
          <div className="p-4 bg-black/40 border border-white/5 rounded-2xl text-[11px] text-zinc-400 font-bold leading-relaxed text-left space-y-2.5">
            <p>🚨 본 전광판 방은 관리자 통제 정책에 의해 실시간 송출 및 제어가 **일시적으로 차단/정지**되었습니다.</p>
            <p>만료일이 초과되었거나 비정상 서비스 활동이 감지되었을 수 있습니다. 복구 및 재이용 문의는 아래 이메일로 접수해 주시기 바랍니다.</p>
          </div>
          <div className="text-[10px] text-zinc-500 font-black tracking-widest uppercase">
            SUPPORT EMAIL: support@glowwave.app
          </div>
          <Link
            href="/"
            className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl transition-all block text-center"
          >
            메인 홈으로 이동
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030305] text-foreground flex flex-col justify-between bg-grid-pattern relative overflow-hidden">
      {/* Background Neon Aura Spheres */}
      <div className="absolute top-[10%] left-[-10%] neon-glow-circle-1 opacity-30" />
      <div className="absolute bottom-[20%] right-[-10%] neon-glow-circle-2 opacity-25" />

      {/* Header */}
      <header className="border-b border-white/5 bg-[#030305]/60 backdrop-blur-md relative z-30 pt-[calc(env(safe-area-inset-top,0px)+12px)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline font-black text-white tracking-tight font-outfit text-sm uppercase">GlowWave Host Remote</span>
            <span className="sm:hidden font-black text-white tracking-tight font-outfit text-xs sm:text-sm uppercase">GlowWave Host</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsVaultOpen(true)}
              className="p-2 sm:px-3 sm:py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
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
                className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold text-white cursor-pointer shadow-sm select-none transition-all"
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
            
            <button 
              onClick={() => {
                const exitConfirmMsg = {
                  ko: "정말 대시보드(리모컨)에서 나가시겠습니까?\n현재 실시간으로 연출 중인 전광판 송출이 중단되지는 않지만, 대시보드 제어 세션이 닫힙니다.",
                  en: "Are you sure you want to exit the remote dashboard?\nThe live signboard stream will continue, but your remote control session will end.",
                  ja: "本当にリモコンダッシュボードを終了しますか？\n現在リアルタイムで配信中の電光掲示板の配信は停止しません가、リモコン制御セッションは終了します。",
                  es: "¿Seguro que deseas salir del panel de control?\nLa transmisión del letrero en vivo continuará, pero tu sesión de control remoto finalizará.",
                  'zh-TW': "確定要結束控制器面板嗎？\n目前即時播放的電子看板不會中斷，但您的控制器連線階段將會結束。",
                  'zh-HK': "確定要結束控制器面板嗎？\n目前即時播放的電子看板不會中斷，但您的控制器連線階段將會結束。",
                }[activeLocale] || "정말 대시보드(리모컨)에서 나가시겠습니까?\n현재 실시간으로 연출 중인 전광판 송출이 중단되지는 않지만, 대시보드 제어 세션이 닫힙니다.";
                if (confirm(exitConfirmMsg)) {
                  router.push('/');
                }
              }}
              className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              title={
                {
                  ko: "나가기",
                  en: "Exit",
                  ja: "退出",
                  es: "Salir",
                  'zh-TW': "結束",
                  'zh-HK': "結束",
                }[activeLocale] || "나가기"
              }
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Unified HUD Status Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 w-full">
        <div className="glass-effect rounded-2xl p-4 flex flex-wrap justify-between items-center gap-4 bg-[#12121a] border border-white/5">
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">
                {
                  {
                    ko: '방 코드',
                    en: 'Room Code',
                    ja: 'ルームコード',
                    es: 'Código de sala',
                    'zh-TW': '房號',
                    'zh-HK': '房號'
                  }[activeLocale] || '방 코드'
                }
              </span>
              <span className="text-xl font-mono font-black text-white select-all">{roomId}</span>
            </div>
            
            <div className="hidden sm:block w-[1px] h-8 bg-white/5" />
            
            <div>
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">
                {
                  {
                    ko: '실시간 접속자',
                    en: 'Spectators',
                    ja: 'リアルタイム接続者',
                    es: 'Espectadores',
                    'zh-TW': '即時人數',
                    'zh-HK': '即時人數'
                  }[activeLocale] || '실시간 접속자'
                }
              </span>
              <span className="text-xl font-black text-white flex items-baseline gap-1">
                <span>{activeParticipants}</span>
                <span className="text-[10px] text-zinc-500 font-bold">
                  {activeLocale === 'ko' ? `/ ${room?.max_participants}명` : `/ ${room?.max_participants}`}
                </span>
              </span>
            </div>

            <div className="hidden sm:block w-[1px] h-8 bg-white/5" />

            <div>
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">
                {
                  {
                    ko: '사용 중인 요금제',
                    en: 'Active Plan',
                    ja: '利用中のプラン',
                    es: 'Plan Activo',
                    'zh-TW': '使用中方案',
                    'zh-HK': '使用中方案'
                  }[activeLocale] || '사용 중인 요금제'
                }
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-black text-white px-2 py-0.5 rounded-md bg-white/5 uppercase border border-white/5">
                  {
                    room?.tier === 'free' ? (activeLocale === 'ko' ? '일일체험' : 'FREE') :
                    room?.tier === 'store' ? (activeLocale === 'ko' ? '매장 월간' : 'STORE') :
                    room?.tier === 'store_annual' ? (activeLocale === 'ko' ? '매장 연간' : 'STORE ANNUAL') :
                    room?.tier?.toUpperCase()
                  }
                </span>
                {room?.tier !== 'max' && (
                  <button
                    onClick={() => {
                      setSelectedUpgradeTier(null);
                      setUpgradeStep('select');
                      setIsUpgradeModalOpen(true);
                    }}
                    className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300 cursor-pointer transition-colors"
                  >
                    {
                      {
                        ko: '업그레이드',
                        en: 'Upgrade Plan',
                        ja: 'アップグレード',
                        es: 'Actualizar',
                        'zh-TW': '升級方案',
                        'zh-HK': '升級方案'
                      }[activeLocale] || '업그레이드'
                    }
                  </button>
                )}
              </div>
            </div>

            {room && room.tier !== 'free' && (
              <>
                <div className="hidden sm:block w-[1px] h-8 bg-white/5" />
                <div>
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">
                    {
                      {
                        ko: '방 비밀번호',
                        en: 'Room Passcode',
                        ja: 'ルーム暗証番号',
                        es: 'Clave de sala',
                        'zh-TW': '房間密碼',
                        'zh-HK': '房間密碼'
                      }[activeLocale] || '방 비밀번호'
                    }
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-black text-white px-2 py-0.5 rounded-md bg-[#ffffff]/[0.03] border border-white/5 font-mono">
                      {room.passcode ? (typeof window !== 'undefined' ? (localStorage.getItem(`glowwave_passcode_${room.id}`) || '🔒 설정됨') : '🔒 설정됨') : (
                        {
                          ko: '설정 없음',
                          en: 'Not Set',
                          ja: '設定なし',
                          es: 'Sin configurar',
                          'zh-TW': '未設定',
                          'zh-HK': '未設定'
                        }[activeLocale] || '설정 없음'
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setPasscodeVal(room.passcode || '');
                        setPasscodeUpdateError('');
                        setIsPasscodeDrawerOpen(true);
                      }}
                      className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300 cursor-pointer transition-colors"
                    >
                      {
                        {
                          ko: '설정/변경',
                          en: 'Set/Change',
                          ja: '設定/変更',
                          es: 'Configurar',
                          'zh-TW': '設定/變更',
                          'zh-HK': '設定/變更'
                        }[activeLocale] || '설정/변경'
                      }
                    </button>
                  </div>
                </div>
              </>
            )}

            <div className="hidden sm:block w-[1px] h-8 bg-white/5" />

            <div className="flex items-center gap-3">
              <div>
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">
                  {
                    {
                      ko: '남은 시간',
                      en: 'Time Remaining',
                      ja: '残り時間',
                      es: 'Tiempo Restante',
                      'zh-TW': '剩餘時間',
                      'zh-HK': '剩餘時間'
                    }[activeLocale] || '남은 시간'
                  }
                </span>
                <span className={`text-xs sm:text-sm font-black font-mono tracking-tight block mt-1 ${
                  timeRemaining === '만료됨' || timeRemaining.startsWith('0시간') || timeRemaining.startsWith('1시간') || timeRemaining.startsWith('2시간')
                    ? 'text-red-500 animate-pulse' 
                    : 'text-zinc-300'
                }`}>
                  {timeRemaining || '--:--:--'}
                </span>
              </div>
              
              <button
                type="button"
                onClick={() => {
                  if (room?.tier === 'free') {
                    setSelectedUpgradeTier(null);
                    setUpgradeStep('select');
                    setIsUpgradeModalOpen(true);
                  } else {
                    if (room?.tier === 'store' || room?.tier === 'store_annual') {
                      setSelectedExtendHours(720);
                    } else {
                      setSelectedExtendHours(24);
                    }
                    setExtendStep('info');
                    setIsExtendModalOpen(true);
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all duration-200 cursor-pointer select-none border tracking-wider flex items-center gap-1 ${
                  timeRemaining === '만료됨' || timeRemaining.startsWith('0시간') || timeRemaining.startsWith('1시간') || timeRemaining.startsWith('2시간')
                    ? 'border-amber-500/20 text-amber-400 bg-amber-500/5 hover:bg-amber-500/15 hover:border-amber-500/40 shadow-sm'
                    : 'border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 hover:border-white/20'
                }`}
              >
                <span>
                  {
                    {
                      ko: '시간 연장',
                      en: 'Extend Time',
                      ja: '時間を延長',
                      es: 'Extender Tiempo',
                      'zh-TW': '延長時間',
                      'zh-HK': '延長時間'
                    }[activeLocale] || '시간 연장'
                  }
                </span>
                {(timeRemaining === '만료됨' || timeRemaining.startsWith('0시간') || timeRemaining.startsWith('1시간') || timeRemaining.startsWith('2시간')) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">
              {
                {
                  ko: '시스템 연결 상태',
                  en: 'System Connection',
                  ja: 'システム接続状態',
                  es: 'Conexión del Sistema',
                  'zh-TW': '系統連線狀態',
                  'zh-HK': '系統連線狀態'
                }[activeLocale] || '시스템 연결 상태'
              }
            </span>
            {channelStatus === 'connected' ? (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/30 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-wider backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>
                  {
                    {
                      ko: '연결됨',
                      en: 'Connected',
                      ja: '接続済み',
                      es: 'Conectado',
                      'zh-TW': '已連線',
                      'zh-HK': '已連線'
                    }[activeLocale] || '연결됨'
                  }
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-950/30 border border-amber-500/30 text-amber-400 text-xs font-bold tracking-wider backdrop-blur-md shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span>
                  {
                    {
                      ko: '연결 중',
                      en: 'Connecting',
                      ja: '接続中',
                      es: 'Conectando',
                      'zh-TW': '連線中',
                      'zh-HK': '連線中'
                    }[activeLocale] || '연결 중'
                  }
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex-1 flex flex-col lg:grid lg:grid-cols-12 lg:items-start gap-8 w-full">
        
        {/* Quick Triggers Dashboard */}
        <div className="order-1 lg:col-span-8 lg:col-start-1 lg:row-start-1 lg:self-start flex flex-col w-full min-w-0 glass-effect rounded-2xl p-4 sm:p-6 bg-[#12121a] h-fit">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-bold text-white font-outfit">{t('quick_preset_board', activeLocale)}</h2>
              </div>
              
              {/* 3 Toggle Controls next to 원터치 연출 보드 */}
              <div className="flex flex-wrap items-center gap-2">
                {/* 1. 카드 미리보기 */}
                <button
                  type="button"
                  onClick={() => setShowMiniPreviews(prev => !prev)}
                  className="flex items-center gap-2 bg-white/[0.02] border border-white/5 hover:border-white/10 px-3 py-1.5 rounded-xl text-[10px] font-bold text-zinc-300 hover:text-white cursor-pointer select-none transition-all"
                >
                  <span>{t('show_card_preview', activeLocale)}</span>
                  <div className={`relative w-8 h-4.5 rounded-full transition-all duration-200 ${showMiniPreviews ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]' : 'bg-zinc-800'}`}>
                    <div className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${showMiniPreviews ? 'translate-x-3.5' : 'translate-x-0'}`} />
                  </div>
                </button>

                {/* 2. 송출/수정 모드 토글 */}
                <button
                  type="button"
                  onClick={() => setIsTransmitterLocked(prev => !prev)}
                  className="flex items-center gap-2 bg-white/[0.02] border border-white/5 hover:border-white/10 px-3 py-1.5 rounded-xl text-[10px] font-bold text-zinc-300 hover:text-white cursor-pointer select-none transition-all"
                >
                  <span>{!isTransmitterLocked ? t('one_touch_instant_send', activeLocale) : t('edit_preset', activeLocale)}</span>
                  <div className={`relative w-8 h-4.5 rounded-full transition-all duration-200 ${!isTransmitterLocked ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-zinc-800'}`}>
                    <div className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${!isTransmitterLocked ? 'translate-x-3.5' : 'translate-x-0'}`} />
                  </div>
                </button>

                {/* 3. 화면 암전 토글 */}
                <button
                  type="button"
                  onClick={() => handleBlackoutToggle(!isBlackout)}
                  className="flex items-center gap-2 bg-white/[0.02] border border-white/5 hover:border-white/10 px-3 py-1.5 rounded-xl text-[10px] font-bold text-zinc-300 hover:text-white cursor-pointer select-none transition-all"
                >
                  <span>{t('blackout', activeLocale)}</span>
                  <div className={`relative w-8 h-4.5 rounded-full transition-all duration-200 ${isBlackout ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'bg-zinc-800'}`}>
                    <div className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${isBlackout ? 'translate-x-3.5' : 'translate-x-0'}`} />
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
                <span>{t('my_presets', activeLocale)}</span>
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
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

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
                    onClick={() => {
                      // Block premium templates/presets on Free tier
                      const isPremiumFont = preset.font_family === 'neon' || preset.font_family === 'pixel' || preset.font_family === 'plump';
                      const isPremiumEffect = preset.special_effect === 'hearts' || preset.special_effect === 'confetti' || preset.special_effect === 'stars';
                      if ((isPremiumFont || isPremiumEffect) && room?.tier === 'free') {
                        const confirmTemplateMsg = {
                          ko: '이 템플릿은 유료 요금제(Lite 이상) 전용 폰트 또는 특수 효과를 사용하고 있습니다. 요금제를 업그레이드하시겠습니까?',
                          en: 'This template uses fonts or special effects exclusive to paid plans (Lite or higher). Would you like to upgrade your plan?',
                          ja: 'このテンプレートは有料プラン（Lite以上）専用のフォントまたは特殊効果を使用しています。プランをアップグレードしますか？',
                          es: 'Esta plantilla utiliza fuentes o efectos especiales exclusivos de los planes de pago (Lite o superior). ¿Deseas actualizar tu plan?',
                          'zh-TW': '此範本使用付費方案（Lite 以上）專用字型或特殊效果。是否要升級您的方案？',
                          'zh-HK': '此範本使用付費方案（Lite 以上）專用字型或特殊效果。是否要升級您的方案？',
                        }[activeLocale] || '이 템플릿은 유료 요금제(Lite 이상) 전용 폰트 또는 특수 효과를 사용하고 있습니다. 요금제를 업그레이드하시겠습니까?';
                        if (confirm(confirmTemplateMsg)) {
                          setSelectedUpgradeTier(null);
                          setUpgradeStep('select');
                          setIsUpgradeModalOpen(true);
                        }
                        return;
                      }

                      if (isTransmitterLocked) {
                        applyPresetToController(preset);
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
                    {/* Visual launchpad active background animation indicator */}
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
                        {(preset.effect === 'luckydraw_wait' || preset.effect === 'luckydraw') && (
                          <div className="absolute inset-0 z-0 flex items-center justify-center bg-black/45 border border-amber-500/30 rounded-2xl animate-pulse">
                            <span className="text-[10px] text-amber-400 font-black tracking-widest font-mono">RAFFLE BOARD</span>
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
 
                    {/* Pencil Edit Icon: always visible but highly styled to prevent visual noise */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation(); // Avoid triggering preset
                        if (activeCategory === 'custom') {
                          setEditingPresetIndex(index);
                          setEditingPreset({ ...preset });
                        } else {
                          // Check tier limit: custom presets cannot exceed 6 on free tier
                          if (room?.tier === 'free' && presets.length >= 6) {
                            setSelectedUpgradeTier(null);
                            setUpgradeStep('select');
                            setIsUpgradeModalOpen(true);
                            return;
                          }
                          // Import template as a new custom preset
                          setEditingPresetIndex(presets.length);
                          setEditingPreset({ ...preset });
                        }
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/20 text-white/50 hover:text-white hover:bg-black/50 transition-all z-20 cursor-pointer shadow-sm border border-white/5"
                      title={
                        activeCategory === 'custom'
                          ? (
                              {
                                ko: '수정',
                                en: 'Edit',
                                ja: '編集',
                                es: 'Editar',
                                'zh-TW': '編輯',
                                'zh-HK': '編輯'
                              }[activeLocale] || '수정'
                            )
                          : (
                              {
                                ko: '내 프리셋으로 가져와 편집',
                                en: 'Import to My Presets and Edit',
                                ja: 'マイプリセットにインポートして編集',
                                es: 'Importar a mis ajustes y editar',
                                'zh-TW': '匯入到我的預設並編輯',
                                'zh-HK': '匯入到我的預設並編輯'
                              }[activeLocale] || '내 프리셋으로 가져와 편집'
                            )
                      }
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
                    // Check tier limit: Free is limited to 6 presets max
                    if (room?.tier === 'free' && presets.length >= 6) {
                      setSelectedUpgradeTier(null);
                      setUpgradeStep('select');
                      setIsUpgradeModalOpen(true);
                      return;
                    }
                    
                    // Else, open edit drawer to add custom preset
                    const newPreset: Preset = {
                      bg_color: '#EF4444',
                      text: {
                        ko: '새 연출',
                        en: 'New Preset',
                        ja: '新規演出',
                        es: 'Nueva escena',
                        'zh-TW': '新演出',
                        'zh-HK': '新演出'
                      }[activeLocale] || '새 연출',
                      text_color: '#FFFFFF',
                      effect: 'none',
                      speed: 1000
                    };
                    setEditingPresetIndex(presets.length);
                    setEditingPreset(newPreset);
                  }}
                  className="h-24 rounded-2xl border border-dashed border-white/10 hover:border-white/30 bg-transparent flex items-center justify-center p-6 transition-all hover:bg-white/[0.01] active:scale-[0.97] cursor-pointer text-zinc-500 hover:text-white"
                >
                  <div className="flex items-center gap-1.5">
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-bold">
                      {
                        {
                          ko: '새 연출 추가',
                          en: 'Add New Preset',
                          ja: '新規演出を追加',
                          es: 'Agregar escena',
                          'zh-TW': '新增演出',
                          'zh-HK': '新增演出'
                        }[activeLocale] || '새 연출 추가'
                      }
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Custom Customizer Input for On-the-fly Triggering */}
          <div className="order-3 lg:col-span-8 lg:col-start-1 lg:row-start-2 lg:self-start flex flex-col w-full min-w-0 glass-effect rounded-2xl p-4 sm:p-6 bg-[#12121a] h-fit">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-zinc-400" />
                <h2 className="text-sm font-bold text-white">{t('instant_live_broadcast', activeLocale)}</h2>
              </div>
              <span className="text-[9px] font-bold font-mono text-zinc-500">LIVE CONTROLLER</span>
            </div>
            
            <div className="flex flex-col gap-5">
              {/* Text Input & Send Button Row (Combined side-by-side) */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
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
                
                <div className="flex gap-2 shrink-0">
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
                    className="btn-primary h-[48px] px-5 sm:px-6 rounded-xl text-xs font-black flex items-center justify-center cursor-pointer flex-1 sm:flex-none transition-all hover:scale-102 duration-200"
                  >
                    {t('broadcast', activeLocale)}
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveHostPreset}
                    title={
                      {
                        ko: '내 프리셋에 추가',
                        en: 'Add to My Presets',
                        ja: 'マイプリセットに追加',
                        es: 'Añadir a mis ajustes',
                        'zh-TW': '新增至我的預設',
                        'zh-HK': '新增至我的預設'
                      }[activeLocale]
                    }
                    className="h-[48px] px-4 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 border border-zinc-700 hover:border-zinc-500 rounded-xl text-xs font-black text-white flex items-center justify-center gap-1.5 cursor-pointer transition-all hover:scale-102 duration-200 shrink-0"
                  >
                    <FolderHeart className="w-4 h-4 text-pink-400" />
                    <span>
                      {
                        {
                          ko: '프리셋 추가',
                          en: 'Add Preset',
                          ja: 'プリセット追加',
                          es: 'Añadir ajuste',
                          'zh-TW': '新增預設',
                          'zh-HK': '新增預設'
                        }[activeLocale] || '프리셋 추가'
                      }
                    </span>
                  </button>
                </div>
              </div>

              {/* iOS style Segmented Controls Row (Responsive Grid layout - Spaced 2-Row Layout) */}
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
                      
                      {/* Custom Color Picker for Paid Tiers / PRO Warning for Free Tiers */}
                      {room?.tier !== 'free' ? (
                        <div 
                          className="w-6.5 h-6.5 rounded-full overflow-hidden border border-white/10 hover:scale-110 transition-transform shadow-md cursor-pointer relative shrink-0" 
                          style={{ background: 'linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8b00ff)' }}
                          title={
                            {
                              ko: "커스텀 배경 색상 선택",
                              en: "Select Custom Background Color",
                              ja: "カスタム背景色の選択",
                              es: "Seleccionar Color de Fondo Personalizado",
                              'zh-TW': "選擇自訂背景顏色",
                              'zh-HK': "選擇自訂背景顏色",
                            }[activeLocale] || "커스텀 배경 색상 선택"
                          }
                        >
                          <input
                            type="color"
                            value={customBgColor}
                            onChange={(e) => setCustomBgColor(e.target.value)}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-150"
                          />
                        </div>
                      ) : (
                        <div 
                          className="w-6.5 h-6.5 rounded-full overflow-hidden border border-white/10 hover:scale-110 transition-transform shadow-md cursor-pointer relative shrink-0 flex items-center justify-center" 
                          style={{ background: 'linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8b00ff)' }}
                          title={
                            {
                              ko: "커스텀 배경 색상 선택 (PRO)",
                              en: "Select Custom Background Color (PRO)",
                              ja: "カスタム背景色の選択 (PRO)",
                              es: "Seleccionar Color de Fondo Personalizado (PRO)",
                              'zh-TW': "選擇自訂背景顏色 (PRO)",
                              'zh-HK': "選擇自訂背景顏色 (PRO)",
                            }[activeLocale] || "커스텀 배경 색상 선택 (PRO)"
                          }
                          onClick={() => {
                            const confirmCustomBgMsg = {
                              ko: '커스텀 배경 색상(팔레트)은 유료 요금제(Lite 이상) 전용 기능입니다. 요금제를 업그레이드하시겠습니까?',
                              en: 'Custom background color (palette) is exclusive to paid plans (Lite or higher). Would you like to upgrade your plan?',
                              ja: 'カスタム背景色（パレット）は有料プラン（Lite以上）専用の機能です。プランをアップグレードしますか？',
                              es: 'El color de fondo personalizado (paleta) es exclusivo de los planes de pago (Lite o superior). ¿Deseas actualizar tu plan?',
                              'zh-TW': '自訂背景顏色（調色盤）為付費方案（Lite 以上）專用功能。是否要升級您的方案？',
                              'zh-HK': '自訂背景顏色（調色盤）為付費方案（Lite 以上）專用功能。是否要升級您的方案？',
                            }[activeLocale] || '커스텀 배경 색상(팔레트)은 유료 요금제(Lite 이상) 전용 기능입니다. 요금제를 업그레이드하시겠습니까?';
                            if (confirm(confirmCustomBgMsg)) {
                              setSelectedUpgradeTier(null);
                              setUpgradeStep('select');
                              setIsUpgradeModalOpen(true);
                            }
                          }}
                        >
                          <span className="text-[7px] font-black text-white bg-violet-600 border border-violet-400 rounded-[2px] px-0.5 scale-90">
                            PRO
                          </span>
                        </div>
                      )}
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
                      
                      {/* Custom Color Palette (PRO Gate) */}
                      {room?.tier !== 'free' ? (
                        <div 
                          className="w-6.5 h-6.5 rounded-full overflow-hidden border border-white/10 hover:scale-110 transition-transform shadow-md cursor-pointer relative shrink-0" 
                          style={{ background: 'linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8b00ff)' }}
                          title={
                            {
                              ko: "커스텀 글자 색상 선택",
                              en: "Select Custom Text Color",
                              ja: "カスタム文字色の選択",
                              es: "Seleccionar Color de Texto Personalizado",
                              'zh-TW': "選擇自訂文字顏色",
                              'zh-HK': "選擇自訂文字顏色",
                            }[activeLocale] || "커스텀 글자 색상 선택"
                          }
                        >
                          <input
                            type="color"
                            value={customTextColor}
                            onChange={(e) => setCustomTextColor(e.target.value)}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-150"
                          />
                        </div>
                      ) : (
                        <div 
                          className="w-6.5 h-6.5 rounded-full overflow-hidden border border-white/10 hover:scale-110 transition-transform shadow-md cursor-pointer relative shrink-0 flex items-center justify-center" 
                          style={{ background: 'linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8b00ff)' }}
                          title={
                            {
                              ko: "커스텀 글자 색상 선택 (PRO)",
                              en: "Select Custom Text Color (PRO)",
                              ja: "カスタム文字色の選択 (PRO)",
                              es: "Seleccionar Color de Texto Personalizado (PRO)",
                              'zh-TW': "選擇自訂文字顏色 (PRO)",
                              'zh-HK': "選擇自訂文字顏色 (PRO)",
                            }[activeLocale] || "커스텀 글자 색상 선택 (PRO)"
                          }
                          onClick={() => {
                            const confirmCustomTextMsg = {
                              ko: '커스텀 글자 색상(팔레트)은 유료 요금제(Lite 이상) 전용 기능입니다. 요금제를 업그레이드하시겠습니까?',
                              en: 'Custom text color (palette) is exclusive to paid plans (Lite or higher). Would you like to upgrade your plan?',
                              ja: 'カスタム文字色（パレット）は有料プラン（Lite以上）専用の機能です。プランをアップグレードしますか？',
                              es: 'El color de texto personalizado (paleta) es exclusivo de los planes de pago (Lite o superior). ¿Deseas actualizar tu plan?',
                              'zh-TW': '自訂文字顏色（調色盤）為付費方案（Lite 以上）專用功能。是否要升級您的方案？',
                              'zh-HK': '自訂文字顏色（調色盤）為付費方案（Lite 以上）專用功能。是否要升級您的方案？',
                            }[activeLocale] || '커스텀 글자 색상(팔레트)은 유료 요금제(Lite 이상) 전용 기능입니다. 요금제를 업그레이드하시겠습니까?';
                            if (confirm(confirmCustomTextMsg)) {
                              setSelectedUpgradeTier(null);
                              setUpgradeStep('select');
                              setIsUpgradeModalOpen(true);
                            }
                          }}
                        >
                          <span className="text-[7px] font-black text-white bg-violet-600 border border-violet-400 rounded-[2px] px-0.5 scale-90">
                            PRO
                          </span>
                        </div>
                      )}
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
                          'zh-HK': '字型樣식',
                        }[activeLocale] || '글꼴 스타일'
                      }
                    </span>
                    <div className="flex flex-wrap gap-1 bg-black/45 p-1.5 rounded-xl border border-white/5 items-center">
                      {getLocalizedFonts(activeLocale).map((item) => {
                        const isPremium = item.val === 'neon' || item.val === 'pixel' || item.val === 'plump';
                        return (
                          <button
                            type="button"
                            key={item.val}
                            onClick={() => handleFontSelect(item.val as any, false)}
                            style={{ fontFamily: item.fontFamily, fontWeight: item.fontWeight as any }}
                            className={`flex-1 min-w-[70px] sm:min-w-[85px] py-2 px-1 rounded-lg text-xs md:text-sm transition-all cursor-pointer whitespace-nowrap text-center ${
                              customFontFamily === item.val
                                ? 'bg-white text-black font-extrabold shadow-sm'
                                : 'text-zinc-400 hover:text-white hover:bg-white/[0.02]'
                            }`}
                          >
                            <span className="flex flex-col items-center justify-center gap-0.5">
                              <span>{item.label}</span>
                              {isPremium && (
                                <span className="px-1 py-[0.5px] rounded-[3px] text-[7px] font-black tracking-wide uppercase bg-violet-500/20 border border-violet-500/30 text-violet-400">
                                  PRO
                                </span>
                              )}
                            </span>
                          </button>
                        );
                      })}
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
                          type="button"
                          key={item.val}
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
                        {
                          val: 'none',
                          label: {
                            ko: '없음',
                            en: 'None',
                            ja: 'なし',
                            es: 'Ninguno',
                            'zh-TW': '無',
                            'zh-HK': '無',
                          }[activeLocale] || '없음'
                        },
                        {
                          val: 'hearts',
                          label: {
                            ko: '하트',
                            en: 'Hearts',
                            ja: 'ハート',
                            es: 'Corazones',
                            'zh-TW': '愛心',
                            'zh-HK': '愛心',
                          }[activeLocale] || '하트',
                          isPremium: true
                        },
                        {
                          val: 'confetti',
                          label: {
                            ko: '꽃가루',
                            en: 'Confetti',
                            ja: '紙吹雪',
                            es: 'Confeti',
                            'zh-TW': '紙花',
                            'zh-HK': '紙花',
                          }[activeLocale] || '꽃가루',
                          isPremium: true
                        },
                        {
                          val: 'stars',
                          label: {
                            ko: '별빛',
                            en: 'Stars',
                            ja: '星空',
                            es: 'Estrellas',
                            'zh-TW': '星光',
                            'zh-HK': '星光',
                          }[activeLocale] || '별빛',
                          isPremium: true
                        }
                      ].map((item) => (
                        <button
                          type="button"
                          key={item.val}
                          onClick={() => {
                            const isPremium = item.val !== 'none';
                            if (isPremium && room?.tier === 'free') {
                              const confirmSpecialEffectMsg = {
                                ko: '특수 효과는 유료 요금제(Lite 이상) 전용입니다. 요금제를 업그레이드하시겠습니까?',
                                en: 'Special effects are exclusive to paid plans (Lite or higher). Would you like to upgrade your plan?',
                                ja: '特殊効果は有料プラン（Lite以上）専用です。プランをアップグレードしますか？',
                                es: 'Los efectos especiales son exclusivos de los planes de pago (Lite o superior). ¿Deseas actualizar tu plan?',
                                'zh-TW': '特殊效果為付費方案（Lite 以上）專用功能。是否要升級您的方案？',
                                'zh-HK': '特殊效果為付費方案（Lite 以上）專用功能。是否要升級您的方案？',
                              }[activeLocale] || '특수 효과는 유료 요금제(Lite 이상) 전용입니다. 요금제를 업그레이드하시겠습니까?';
                              if (confirm(confirmSpecialEffectMsg)) {
                                setSelectedUpgradeTier(null);
                                setUpgradeStep('select');
                                setIsUpgradeModalOpen(true);
                              }
                              return;
                            }
                            setCustomSpecialEffect(item.val as any);
                          }}
                          className={`py-2 px-0.5 rounded-lg text-xs md:text-sm font-bold transition-all cursor-pointer ${
                            customSpecialEffect === item.val
                              ? 'bg-white text-black font-extrabold shadow-sm'
                              : 'text-zinc-400 hover:text-white hover:bg-white/[0.02]'
                          }`}
                        >
                          <span className="flex items-center justify-center gap-1">
                            <span>{item.label}</span>
                            {item.isPremium && (
                              <span className="px-1 py-[0.5px] rounded-[3px] text-[7px] font-black tracking-wide uppercase bg-violet-500/20 border border-violet-500/30 text-violet-400 shrink-0">
                                PRO
                              </span>
                            )}
                          </span>
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
                          'zh-HK': '倒數時間'
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
                          {activeLocale === 'ko' ? `${sec}초` : (activeLocale === 'ja' ? `${sec}秒` : `${sec}s`)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-xs md:text-sm font-extrabold text-zinc-400 tracking-wider">
                      {
                        {
                          ko: '종료 시 출력 문구',
                          en: 'Message on End',
                          ja: '終了時の表示テキスト',
                          es: 'Texto al finalizar',
                          'zh-TW': '結束時顯示文字',
                          'zh-HK': '結束時顯示文字'
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
                          en: 'Winner Message (edit in instant slogan input)',
                          ja: '当選時の表示テキスト（即座スローガン入力欄で編集）',
                          es: 'Texto de ganador (editar en entrada de eslogan)',
                          'zh-TW': '中獎時文字（在即時口號輸入框修改）',
                          'zh-HK': '中獎時文字（在即時口號輸入框修改）'
                        }[activeLocale] || '당첨 시 문구 (즉석 구호 입력란에서 수정)'
                      }
                    </span>
                    <div className="flex items-center bg-black/30 px-4 rounded-xl border border-white/5 h-12 text-xs md:text-sm text-zinc-400 font-semibold select-none">
                      {customText || (
                        {
                          ko: '당첨!',
                          en: 'Winner!',
                          ja: '当選！',
                          es: '¡Ganador!',
                          'zh-TW': '中獎！',
                          'zh-HK': '中獎！'
                        }[activeLocale] || '당첨!'
                      )} ({
                        {
                          ko: '당첨',
                          en: 'Winner',
                          ja: '当選',
                          es: 'Ganador',
                          'zh-TW': '中獎',
                          'zh-HK': '中獎'
                        }[activeLocale] || '당첨'
                      })
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-xs md:text-sm font-extrabold text-zinc-400 tracking-wider">
                      {
                        {
                          ko: '낙첨 시 출력 문구',
                          en: 'Loser Message',
                          ja: '落選時の表示テキスト',
                          es: 'Texto de perdedor',
                          'zh-TW': '未中獎時顯示文字',
                          'zh-HK': '未中獎時顯示文字'
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
                          es: '¡Suerte para la próxima!',
                          'zh-TW': '真可惜！下次還有機會..',
                          'zh-HK': '真可惜！下次還有機會..'
                        }[activeLocale] || '아쉽네요! 다음 기회에..'
                      }
                      className="w-full bg-black/45 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white text-xs md:text-sm font-semibold h-12"
                      maxLength={maxTextLength}
                    />
                  </div>
                </div>
              )}

              {/* Speed range slider for custom controller */}
              {(customEffect === 'blink' || customEffect === 'marquee' || customEffect === 'luckydraw_wait') && (
                <div className="pt-4 border-t border-white/5 animate-in fade-in duration-200">
                  <div className="flex justify-between text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-2.5">
                    <span>
                      {
                        {
                          ko: '전송 애니메이션 속도 조절',
                          en: 'Animation Speed Adjust',
                          ja: 'アニメーション速度調節',
                          es: 'Ajustar velocidad de animación',
                          'zh-TW': '動畫速度調整',
                          'zh-HK': '動畫速度調整'
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
                          'zh-HK': '速度'
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
            </div>
          </div>

        {/* LIVE ON AIR Preview Card */}
        <div className="order-2 lg:col-span-4 lg:col-start-9 lg:row-start-1 lg:self-start flex flex-col w-full min-w-0 glass-effect rounded-2xl p-4 sm:p-6 items-center bg-[#12121a] h-fit">
            <div className="flex items-center gap-2 mb-2 self-start">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">LIVE ON AIR</h2>
            </div>
            <p className="text-[11px] text-zinc-500 mb-4 self-start">
              {
                {
                  ko: '현재 모든 관객 화면에 송출 중인 실시간 연출 화면입니다.',
                  en: 'This is the live screen currently broadcasting to all spectators.',
                  ja: '현재 모든 관객 화면에 송출 중인 실시간 연출 화면입니다.',
                  es: 'Esta es la pantalla en vivo que se está transmitiendo a todos los espectadores.',
                  'zh-TW': '目前正在向所有觀眾畫面播出的即時演出畫面。',
                  'zh-HK': '目前正在向所有觀眾畫面播出的即時演出畫面。'
                }[activeLocale] || '현재 모든 관객 화면에 송출 중인 실시간 연출 화면입니다.'
              }
            </p>
            <div className="w-full max-w-[420px] flex flex-col items-center">
              <div className="w-full flex justify-center py-2 border-y border-white/5 bg-black/20 rounded-xl relative group overflow-hidden">
                <LandscapePhoneMockup preset={currentBroadcastPreset} />
                
                {/* Desktop Hover Overlay */}
                <button
                  type="button"
                  onClick={() => setIsStandaloneFullscreen(true)}
                  className="hidden lg:flex absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity items-center justify-center gap-2 text-white font-bold text-xs cursor-pointer"
                >
                  <Maximize2 className="w-5 h-5 text-indigo-400" />
                  {
                    {
                      ko: '내 화면에 전체화면으로 띄우기',
                      en: 'Show in Fullscreen on My Device',
                      ja: '自分の画面에全画面で表示',
                      es: 'Mostrar en pantalla completa en mi dispositivo',
                      'zh-TW': '在我的螢幕上以全螢幕顯示',
                      'zh-HK': '在我的螢幕上以全螢幕顯示'
                    }[activeLocale] || '내 화면에 전체화면으로 띄우기'
                  }
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsStandaloneFullscreen(true)}
                className="mt-3 w-full py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 active:scale-[0.99] text-white font-bold text-xs tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer border border-white/10 hover:border-white/20 shadow-md"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>
                  {
                    {
                      ko: '내 기기를 전광판으로 사용 (전체화면)',
                      en: 'Use My Device as Signboard (Fullscreen)',
                      ja: '自分の機器を電光掲示板として使用 (全画面)',
                      es: 'Usar mi dispositivo como cartelera (Pantalla completa)',
                      'zh-TW': '將我的裝置當作電子看板使用（全螢幕）',
                      'zh-HK': '將我的裝置當作電子看板使用（全螢幕）'
                    }[activeLocale] || '내 기기를 전광판으로 사용 (전체화면)'
                  }
                </span>
              </button>
            </div>

            {currentBroadcastPreset.effect === 'luckydraw_wait' && (
              <div className="w-full mt-4 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleDrawWinner}
                  className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-black text-xs tracking-wider flex items-center justify-center gap-2 transition-all shadow-xl shadow-amber-500/20 animate-bounce cursor-pointer border border-amber-300"
                >
                  <span>
                    {
                      {
                        ko: '결과 발표 (추첨 완료)',
                        en: 'Announce Result (Draw Winner)',
                        ja: '結果発表 (抽選完了)',
                        es: 'Anunciar resultado (Sorteo finalizado)',
                        'zh-TW': '公佈結果（抽籤完成）',
                        'zh-HK': '公佈結果（抽籤完成）'
                      }[activeLocale] || '결과 발표 (추첨 완료)'
                    }
                  </span>
                </button>
                <p className="text-[10px] text-zinc-400 text-center leading-relaxed font-semibold">
                  {
                    {
                      ko: <>⚠️ [결과 발표] 버튼을 누르면 현재 접속해 있는 관객 중 <b>단 1명만</b> 무작위로 당첨자로 선정되어 해당 관객 스마트폰 화면에 당첨 문구가 나타나며, 나머지 관객 화면에는 꽝 문구가 나타납니다.</>,
                      en: <>⚠️ Clicking the [Announce Result] button will randomly select <b>only 1 winner</b> among connected spectators, displaying the winning slogan on their smartphone screen, while others see a loser message.</>,
                      ja: <>⚠️ [結果発表] ボタンを押すと、現在接続中の観客の中から<b>たった1人だけ</b>がランダムで当選者に選ばれ、その観客のスマホ画面に当選メッセージが表示され、残りの観客には落選メッセージが表示されます。</>,
                      es: <>⚠️ Al presionar el botón [Anunciar resultado], se seleccionará aleatoriamente a <b>solo 1 ganador</b> entre los espectadores conectados, mostrando el texto de ganador en su pantalla, mientras que los demás verán el texto de perdedor.</>,
                      'zh-TW': <>⚠️ 按下 [公佈結果] 按鈕，系統將在目前連線的觀眾中隨機抽取 <b>僅限 1 名</b> 中獎者，並在該觀眾的手機螢幕上顯示中獎文字，其餘觀眾螢幕上顯示未中獎文字。</>,
                      'zh-HK': <>⚠️ 按下 [公佈結果] 按鈕，系統將在目前連線의觀眾中隨機抽取 <b>僅限 1 名</b> 中獎者，並在該觀眾的手機螢幕上顯示中獎文字，其餘觀眾螢幕上顯示未中獎文字。</>
                    }[activeLocale] || <>⚠️ [결과 발표] 버튼을 누르면 현재 접속해 있는 관객 중 <b>단 1명만</b> 무작위로 당첨자로 선정되어 해당 관객 스마트폰 화면에 당첨 문구가 나타나며, 나머지 관객 화면에는 꽝 문구가 나타납니다.</>
                  }
                </p>
              </div>
            )}
          </div>

          {/* Admission QR Card */}
          <div className="order-4 lg:col-span-4 lg:col-start-9 lg:row-start-2 lg:self-start flex flex-col w-full min-w-0 glass-effect rounded-2xl p-4 sm:p-6 items-center text-center bg-[#12121a] h-fit">
            <Share2 className="w-6 h-6 text-indigo-400 mb-3" />
            <h2 className="text-lg font-bold text-white mb-1">
              {
                {
                  ko: '관객 입장안내 (Admission QR)',
                  en: 'Spectator Entry Guide (Admission QR)',
                  ja: '観客入場案内 (入場QR)',
                  es: 'Guía de Entrada de Espectadores (Admission QR)',
                  'zh-TW': '觀眾入場指南（入場 QR）',
                  'zh-HK': '觀眾入場指南（入場 QR）'
                }[activeLocale] || '관객 입장안내 (Admission QR)'
              }
            </h2>
            <p className="text-xs text-zinc-500 mb-6">
              {
                {
                  ko: '관객들이 카메라로 스캔하여 즉시 입장할 수 있도록 스크린에 QR을 띄우거나 링크를 복사해 주세요.',
                  en: 'Display the QR on the screen or copy the link so spectators can scan it and enter immediately.',
                  ja: '観客이カメラでスキャンして即時入場できるよう、スクリーンにQRを表示するかリンクをコピーしてください。',
                  es: 'Muestre el QR en la pantalla o copie el enlace para que los espectadores puedan escanearlo e ingresar de inmediato.',
                  'zh-TW': '請將 QR 顯示在螢幕上或複製連結，以便觀眾使用相機掃描即時入場。',
                  'zh-HK': '請將 QR 顯示在螢幕上或複製連結，以便觀眾使用相機掃描即時入場。'
                }[activeLocale] || '관객들이 카메라로 스캔하여 즉시 입장할 수 있도록 스크린에 QR을 띄우거나 링크를 복사해 주세요.'
              }
            </p>

            {/* QR Wrapper */}
            <div className="bg-white p-3 rounded-2xl mb-6 shadow-xl relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={qrCodeUrl} 
                alt="Admission QR Code" 
                className="w-48 h-48 rounded-lg select-none"
              />
            </div>

            {/* Sharing Link Box */}
            <div className="w-full flex items-center bg-black/60 border border-white/5 rounded-xl px-3 py-2 text-left mb-3">
              <span className="text-xs font-mono text-zinc-400 truncate flex-1 pr-2">
                {audienceUrl}
              </span>
              <button 
                onClick={copyAudienceUrl}
                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                title={t('copy', activeLocale)}
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex flex-col gap-2 w-full">
              <button
                onClick={copyAudienceUrl}
                className="w-full py-3 rounded-xl border border-white/5 bg-white/5 font-semibold text-white text-xs hover:bg-white/10 transition-all flex items-center justify-center cursor-pointer"
              >
                {
                  {
                    ko: '관객용 URL 링크 복사하기',
                    en: 'Copy Spectator URL Link',
                    ja: '観客用URLリンクをコピー',
                    es: 'Copiar enlace URL de espectadores',
                    'zh-TW': '複製觀眾用 URL 連結',
                    'zh-HK': '複製觀眾用 URL 連結'
                  }[activeLocale] || '관객용 URL 링크 복사하기'
                }
              </button>
              
              <button
                onClick={() => window.open(`/host/present/${roomId}?token=${token}`, '_blank')}
                className="w-full py-3 rounded-xl bg-indigo-500 font-bold text-white text-xs hover:bg-indigo-600 transition-all flex items-center justify-center cursor-pointer shadow-lg shadow-indigo-500/10"
              >
                {
                  {
                    ko: '새 창으로 관객 안내 스크린 열기',
                    en: 'Open Spectator Entry Screen in New Window',
                    ja: '別ウィンドウで観客案内画面を開く',
                    es: 'Abrir pantalla de guía en nueva ventana',
                    'zh-TW': '在新視窗開啟觀眾引導畫面',
                    'zh-HK': '在新視窗開啟觀眾引導畫面'
                  }[activeLocale] || '새 창으로 관객 안내 스크린 열기'
                }
              </button>
              
              <button
                onClick={downloadQrCode}
                className="w-full py-3 rounded-xl border border-white/10 bg-white/10 font-semibold text-white text-xs hover:bg-white/15 transition-all flex items-center justify-center cursor-pointer"
              >
                {
                  {
                    ko: '입장 QR 이미지 다운로드',
                    en: 'Download Admission QR Image',
                    ja: '入場QR画像をダウンロード',
                    es: 'Descargar imagen de QR de entrada',
                    'zh-TW': '下載入場 QR 圖片',
                    'zh-HK': '下載入場 QR 圖片'
                  }[activeLocale] || '입장 QR 이미지 다운로드'
                }
              </button>

              <button
                onClick={handleRegenerateRoomId}
                className="w-full py-3 rounded-xl border border-red-500/25 bg-red-500/5 hover:bg-red-500/10 text-red-400 hover:text-red-300 font-extrabold text-xs transition-all flex items-center justify-center cursor-pointer active:scale-95"
              >
                {
                  {
                    ko: '보안용 접속 코드 재발급',
                    en: 'Regenerate Security Room Code',
                    ja: 'セキュリティ接続コードの再発行',
                    es: 'Regenerar código de sala de seguridad',
                    'zh-TW': '重新發行安全連線代碼',
                    'zh-HK': '重新發行安全連線代碼'
                  }[activeLocale] || '보안용 접속 코드 재발급'
                }
              </button>
            </div>
          </div>

          {/* Host Guide Card */}
          <div className="order-5 lg:col-span-4 lg:col-start-9 lg:row-start-3 lg:self-start flex flex-col w-full min-w-0 glass-effect rounded-2xl p-6 text-xs text-zinc-500 leading-normal gap-2 bg-[#12121a] h-fit">
            <div className="font-bold text-zinc-400 mb-1 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5" />
              {
                {
                  ko: '현장 운영 팁 (Host Guide)',
                  en: 'On-site Operations Tips (Host Guide)',
                  ja: '現場運営のコツ (Host Guide)',
                  es: 'Consejos de Operación en el Sitio (Host Guide)',
                  'zh-TW': '現場營運提示（Host Guide）',
                  'zh-HK': '現場營運提示（Host Guide）'
                }[activeLocale] || '현장 운영 팁 (Host Guide)'
              }
            </div>
            <div>
              {
                {
                  ko: '1. 관객 입장 QR 코드를 무대 전광판이나 입구 배너에 크게 확대해서 게시하세요.',
                  en: '1. Display the spectator entry QR code largely on the stage screen or entrance banners.',
                  ja: '1. 観客入場QRコードをステージの電光掲시판이나入口のバナーに大きく拡大して掲示してください。',
                  es: '1. Muestre el código QR de entrada de espectadores en grande en la pantalla del escenario o banners de entrada.',
                  'zh-TW': '1. 請將觀眾入場 QR 碼放大顯示在舞台電子看板或入口橫幅上。',
                  'zh-HK': '1. 請將觀眾入場 QR 碼放大顯示在舞台電子看板或入口橫幅上。'
                }[activeLocale] || '1. 관객 입장 QR 코드를 무대 전광판이나 입구 배너에 크게 확대해서 게시하세요.'
              }
            </div>
            <div>
              {
                {
                  ko: '2. 행사 시작 전 관객에게 스마트폰 화면이 꺼지지 않도록 접속 화면을 그대로 켜두라 말씀하세요. W3C Wake Lock API가 작동하고 있어 열려 있는 한 꺼지지 않습니다.',
                  en: '2. Ask spectators to keep the page open so their screen stays active. The W3C Wake Lock API will keep it on.',
                  ja: '2. イベント開始前に、観客へスマホ画面が消えないように接続画面をそのまま開いておくようお伝えください。W3C Wake Lock APIが動作しているため、開いている限り消えません。',
                  es: '2. Pida a los espectadores que mantengan la página abierta para que su pantalla siga activa. W3C Wake Lock API la mantendrá encendida.',
                  'zh-TW': '2. 活動開始前，請告訴觀眾保持連線畫面開啟以防止手機螢幕變暗。由於 W3C Wake Lock API 正在運作，只要畫面開啟就不會自動關閉。',
                  'zh-HK': '2. 活動開始前，請告訴觀眾保持連線畫面開啟以防止手機螢幕變暗。由於 W3C Wake Lock API 正在運作，只要畫面開啟就不會自動關閉。'
                }[activeLocale] || '2. 행사 시작 전 관객에게 스마트폰 화면이 꺼지지 않도록 접속 화면을 그대로 켜두라 말씀하세요. W3C Wake Lock API가 작동하고 있어 열려 있는 한 꺼지지 않습니다.'
              }
            </div>
            <div>
              {
                {
                  ko: '3. 동시 접속 수가 요금제 한도에 도달하면 신규 접속 관객에게 대기 화면이 표시됩니다.',
                  en: '3. If the maximum connection limit is reached, a waiting screen will display for new spectators.',
                  ja: '3. 同時接続数がプランの制限に達すると、新規接続の観客には待機画面が表示されます。',
                  es: '3. Si se alcanza el límite de conexiones simultáneas, se mostrará una pantalla de espera para los nuevos espectadores.',
                  'zh-TW': '3. 當同時間連線人數達到方案上限時，新連線的觀眾將會看到排隊等待畫面。',
                  'zh-HK': '3. 當同時間連線人數達到方案上限時，新連線的觀眾將會看到排隊等待畫面。'
                }[activeLocale] || '3. 동시 접속 수가 요금제 한도에 도달하면 신규 접속 관객에게 대기 화면이 표시됩니다.'
              }
            </div>
          </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-zinc-950 py-4 text-center text-[10px] text-zinc-600 font-mono">
        Host Recovery Email: {room?.email} · Session Token: {token?.substring(0, 8)}...
      </footer>

      {/* 11. Preset Slide Drawer Editor */}
      {editingPresetIndex !== null && editingPreset !== null && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
            onClick={() => { setEditingPresetIndex(null); setEditingPreset(null); }} 
          />
          
          {/* Drawer Panel */}
          <div className="absolute inset-y-0 right-0 max-w-md w-full bg-[#12121a] border-l border-white/5 shadow-2xl flex flex-col justify-between z-10 animate-in slide-in-from-right duration-250">
            
            {/* Floating Preview Card on Left for Desktop/Tablet Screens */}
            <div className="hidden lg:block absolute right-[calc(100%+24px)] top-6 z-20 w-[420px]">
              <div className="glass-effect rounded-2xl p-5 bg-[#12121a]/95 border border-white/10 shadow-2xl flex flex-col items-center">
                <span className="text-[10px] font-black font-mono text-indigo-400 uppercase mb-3 tracking-widest">
                  {
                    {
                      ko: '실시간 연출 미리보기 (Floating Sync)',
                      en: 'Realtime Preview (Floating Sync)',
                      ja: 'リアルタイムプレビュー (Floating Sync)',
                      es: 'Vista previa en tiempo real (Floating Sync)',
                      'zh-TW': '即時效果預覽 (Floating Sync)',
                      'zh-HK': '即時效果預覽 (Floating Sync)'
                    }[activeLocale] || '실시간 연출 미리보기 (Floating Sync)'
                  }
                </span>
                <LandscapePhoneMockup preset={editingPreset} />
                <div className="mt-3.5 text-[9.5px] text-zinc-400 text-center font-semibold leading-normal">
                  {
                    {
                      ko: <>수정창 좌측 빈 공간에 연출 화면이 고정됩니다.<br/>스크롤을 내려도 항상 변경 사항을 실시간으로 확인할 수 있습니다.</>,
                      en: <>The preview screen is pinned to the left of the editing window.<br/>You can verify changes in real-time even when scrolling.</>,
                      ja: <>編集ウィンドウの左側の空きスペースに演出画面が固定されます。<br/>スクロールしても常に変更内容をリアルタイムで確認できます。</>,
                      es: <>La pantalla de vista previa está fijada a la izquierda de la ventana de edición.<br/>Puede ver los cambios en tiempo real incluso al desplazarse.</>,
                      'zh-TW': <>預覽畫面會固定在編輯視窗左側的空白處。<br/>即使向下滾動，也能隨時即時確認變更內容。</>,
                      'zh-HK': <>預覽畫面會固定在編輯視窗左側的空白處。<br/>即使向下滾動，也能隨時即時確認變更內容。</>
                    }[activeLocale] || <>수정창 좌측 빈 공간에 연출 화면이 고정됩니다.<br/>스크롤을 내려도 항상 변경 사항을 실시간으로 확인할 수 있습니다.</>
                  }
                </div>
              </div>
            </div>

            <div className="flex flex-col flex-1 overflow-y-auto">
              
              {/* Header */}
              <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>
                    {editingPresetIndex >= presets.length 
                      ? (
                          {
                            ko: '새 커스텀 프리셋 추가',
                            en: 'Add Custom Preset',
                            ja: 'カスタムプリセットを追加',
                            es: 'Agregar ajuste personalizado',
                            'zh-TW': '新增自訂預設',
                            'zh-HK': '新增自訂預設'
                          }[activeLocale] || '새 커스텀 프리셋 추가'
                        )
                      : (
                          {
                            ko: `프리셋 P${editingPresetIndex + 1} 편집`,
                            en: `Edit Preset P${editingPresetIndex + 1}`,
                            ja: `プリセット P${editingPresetIndex + 1} を編集`,
                            es: `Editar Ajuste P${editingPresetIndex + 1}`,
                            'zh-TW': `編輯預設 P${editingPresetIndex + 1}`,
                            'zh-HK': `編輯預設 P${editingPresetIndex + 1}`
                          }[activeLocale] || `프리셋 P${editingPresetIndex + 1} 편집`
                        )
                    }
                  </span>
                </h3>
                <button 
                  onClick={() => { setEditingPresetIndex(null); setEditingPreset(null); }}
                  className="text-zinc-500 hover:text-white p-1 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Landscape Live Preview Mockup Inside Drawer */}
              <div className="p-6 border-b border-white/5 bg-black/40 flex flex-col items-center lg:hidden">
                <span className="text-[10px] font-bold font-mono text-zinc-500 uppercase mb-3 tracking-wider">
                  {
                    {
                      ko: '실시간 연출 미리보기 (Mockup Sync)',
                      en: 'Realtime Preview (Mockup Sync)',
                      ja: 'リアルタイムプレビュー (Mockup Sync)',
                      es: 'Vista previa en tiempo real (Mockup Sync)',
                      'zh-TW': '即時效果預覽 (Mockup Sync)',
                      'zh-HK': '即時效果預覽 (Mockup Sync)'
                    }[activeLocale] || '실시간 연출 미리보기 (Mockup Sync)'
                  }
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
                        en: 'Text Output',
                        ja: '表示テキスト',
                        es: 'Texto de salida',
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
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    {
                      {
                        ko: '배경 색상',
                        en: 'Background Color',
                        ja: '背景色',
                        es: 'Color de fondo',
                        'zh-TW': '背景顏色',
                        'zh-HK': '背景顏色'
                      }[activeLocale] || '배경 색상'
                    }
                  </label>
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

                    {/* Custom Color Palette Picker for Paid Tiers */}
                    {room?.tier !== 'free' && (
                      <div 
                        className="h-9 rounded-lg overflow-hidden border border-white/10 hover:scale-105 transition-all shadow-md cursor-pointer relative flex items-center justify-center" 
                        style={{ background: 'linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8b00ff)' }}
                        title={t('custom_color_select', activeLocale)}
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
                    )}
                  </div>
                </div>

                {/* 모션 효과 */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    {
                      {
                        ko: '모션 효과',
                        en: 'Motion Effect',
                        ja: 'モーション効果',
                        es: 'Efecto de movimiento',
                        'zh-TW': '動態效果',
                        'zh-HK': '動態效果'
                      }[activeLocale] || '모션 효과'
                    }
                  </label>
                  <div className="grid grid-cols-5 gap-1 bg-black/40 p-1 rounded-xl border border-white/5 h-11 items-center font-medium">
                    {[
                      { val: 'none', label: t('static', activeLocale) },
                      { val: 'blink', label: t('blink', activeLocale) },
                      { val: 'marquee', label: t('scroll', activeLocale) },
                      { val: 'countdown', label: t('timer', activeLocale) },
                      { val: 'luckydraw_wait', label: t('raffle', activeLocale) }
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

                {/* Secondary Background Color Grid for Duo-Color Flash */}
                {(editingPreset.effect === 'blink' || editingPreset.effect === 'luckydraw_wait' || editingPreset.effect === 'luckydraw') && (
                  <div className="pt-3 border-t border-white/5 animate-in fade-in duration-200">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                      {
                        {
                          ko: '보조 배경 색상 (듀오 사이키/당첨 번쩍임/경계선 색상용)',
                          en: 'Secondary Background Color (duo flash/raffle border)',
                          ja: '補助背景色 (デュオ点滅/当選エフェクト/境界線用)',
                          es: 'Color de fondo secundario (doble parpadeo/borde de sorteo)',
                          'zh-TW': '輔助背景顏色（雙色閃爍/中獎特效/邊框用）',
                          'zh-HK': '輔助背景顏色（雙色閃爍/中獎特效/邊框用）'
                        }[activeLocale] || '보조 배경 색상 (듀오 사이키/당첨 번쩍임/경계선 색상용)'
                      }
                    </label>
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
                        <span>
                          {
                            {
                              ko: '단색 (부드러운 깜빡이)',
                              en: 'Solid Color (smooth fade)',
                              ja: '単色 (スムーズ点滅)',
                              es: 'Color sólido (desvanecimiento suave)',
                              'zh-TW': '單色（平滑閃爍）',
                              'zh-HK': '單色（平滑閃爍）'
                            }[activeLocale] || '단색 (부드러운 깜빡이)'
                          }
                        </span>
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

                      {/* Custom Color Palette Picker for Paid Tiers (Secondary Color) */}
                      {room?.tier !== 'free' && (
                        <div 
                          className="h-9 rounded-lg overflow-hidden border border-white/10 hover:scale-105 transition-all shadow-md cursor-pointer relative flex items-center justify-center" 
                          style={{ background: 'linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8b00ff)' }}
                          title={t('custom_secondary_color_select', activeLocale)}
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
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-2.5 leading-relaxed font-medium">
                      {
                        {
                          ko: <>💡 <b>단색 (부드러운 깜빡이)</b> 선택 시, 배경색이 서서히 밝아지고 어두워지는 자연스러운 페이드 점멸이 작동합니다. 보조 배경 색상을 지정하면 두 색상이 정밀 교대하며 강력하게 번쩍이는 <b>사이렌(사이키) 효과</b>가 적용됩니다.</>,
                          en: <>💡 Selecting <b>Solid Color (smooth fade)</b> triggers a smooth fading pulse. Specifying a secondary background color applies a high-energy <b>siren (psyche) strobe effect</b> alternating between both colors.</>,
                          ja: <>💡 <b>単色 (スムーズ点滅)</b> を選択すると、背景色が徐々に明暗を繰り返す自然なフェード点滅が動作します。補助背景色を指定すると、2つの色が交互に強力に点滅する<b>サイレン（サイケ）効果</b>が適用されます。</>,
                          es: <>💡 Al seleccionar <b>Color sólido (desvanecimiento suave)</b>, se activa un pulso de desvanecimiento suave. Al especificar un color de fondo secundario, se aplica un efecto estroboscópico de alta energía <b>sirena (psique)</b> que alterna entre ambos colores.</>,
                          'zh-TW': <>💡 選擇 <b>單色（平滑閃爍）</b> 時，背景色會呈現漸明漸暗的自然淡入淡出閃爍。若指定輔助背景色，則會交替顯示兩色，套用強烈的<b>警示燈（閃光）效果</b>。</>,
                          'zh-HK': <>💡 選擇 <b>單色（平滑閃爍）</b> 時，背景色會呈現漸明漸暗的自然淡入淡出閃爍。若指定輔助背景色，則會交替顯示兩色，套用強烈的<b>警示燈（閃光）效果</b>。</>
                        }[activeLocale] || <>💡 <b>단색 (부드러운 깜빡이)</b> 선택 시, 배경색이 서서히 밝아지고 어두워지는 자연스러운 페이드 점멸이 작동합니다. 보조 배경 색상을 지정하면 두 색상이 정밀 교대하며 강력하게 번쩍이는 <b>사이렌(사이키) 효과</b>가 적용됩니다.</>
                      }
                    </p>
                  </div>
                )}

                {/* Speed Slider in Preset Edit Drawer */}
                {(editingPreset.effect === 'blink' || editingPreset.effect === 'marquee' || editingPreset.effect === 'luckydraw_wait' || editingPreset.effect === 'luckydraw') && (
                  <div className="pt-3 border-t border-white/5 animate-in fade-in duration-200">
                    <div className="flex justify-between text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-2.5">
                      <span>
                        {
                          {
                            ko: '애니메이션 속도 조절',
                            en: 'Animation Speed Adjust',
                            ja: 'アニメーション速度調節',
                            es: 'Ajustar velocidad de animación',
                            'zh-TW': '動畫速度調整',
                            'zh-HK': '動畫速度調整'
                          }[activeLocale] || '애니메이션 속도 조절'
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
                            'zh-HK': '速度'
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

                {/* Countdown Options in Preset Edit Drawer */}
                {editingPreset.effect === 'countdown' && (
                  <div className="pt-3 border-t border-white/5 animate-in fade-in duration-200 flex flex-col gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                        {
                          {
                            ko: '카운트다운 지속 초 (Seconds)',
                            en: 'Countdown Duration (Seconds)',
                            ja: 'カウントダウン継続秒数 (Seconds)',
                            es: 'Duración de la cuenta regresiva (segundos)',
                            'zh-TW': '倒數持續秒數 (Seconds)',
                            'zh-HK': '倒數持續秒數 (Seconds)'
                          }[activeLocale] || '카운트다운 지속 초 (Seconds)'
                        }
                      </label>
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
                            {activeLocale === 'ko' ? `${sec}초` : (activeLocale === 'ja' ? `${sec}秒` : `${sec}s`)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                        {
                          {
                            ko: '종료 시 출력 문구 (Result Text)',
                            en: 'Message on End (Result Text)',
                            ja: '終了時の表示テキスト (Result Text)',
                            es: 'Texto al finalizar (Result Text)',
                            'zh-TW': '結束時顯示文字 (Result Text)',
                            'zh-HK': '結束時顯示文字 (Result Text)'
                          }[activeLocale] || '종료 시 출력 문구 (Result Text)'
                        }
                      </label>
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

                {/* Lucky Draw Options in Preset Edit Drawer */}
                {(editingPreset.effect === 'luckydraw_wait' || editingPreset.effect === 'luckydraw') && (
                  <div className="pt-3 border-t border-white/5 animate-in fade-in duration-200 flex flex-col gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                        {
                          {
                            ko: '당첨 시 출력 문구 (Winner Text)',
                            en: 'Winner Message (Winner Text)',
                            ja: '当選時の表示テキスト (Winner Text)',
                            es: 'Texto de ganador (Winner Text)',
                            'zh-TW': '中獎時顯示文字 (Winner Text)',
                            'zh-HK': '中獎時顯示文字 (Winner Text)'
                          }[activeLocale] || '당첨 시 출력 문구 (Winner Text)'
                        }
                      </label>
                      <input
                        type="text"
                        value={editingPreset.text || ''}
                        onChange={(e) => setEditingPreset(prev => ({ ...prev!, text: e.target.value.slice(0, maxTextLength) }))}
                        className="w-full bg-[#0B0B0F] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-white text-xs font-semibold"
                        maxLength={maxTextLength}
                        placeholder={
                          {
                            ko: '당첨!',
                            en: 'Winner!',
                            ja: '当選！',
                            es: '¡Ganador!',
                            'zh-TW': '中獎！',
                            'zh-HK': '中獎！'
                          }[activeLocale] || '당첨!'
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                        {
                          {
                            ko: '낙첨 시 출력 문구 (Loser Text)',
                            en: 'Loser Message (Loser Text)',
                            ja: '落選時の表示テキスト (Loser Text)',
                            es: 'Texto de perdedor (Loser Text)',
                            'zh-TW': '未中獎時顯示文字 (Loser Text)',
                            'zh-HK': '未中獎時顯示文字 (Loser Text)'
                          }[activeLocale] || '낙첨 시 출력 문구 (Loser Text)'
                        }
                      </label>
                      <input
                        type="text"
                        value={editingPreset.result_text || ''}
                        onChange={(e) => setEditingPreset(prev => ({ ...prev!, result_text: e.target.value.slice(0, maxTextLength) }))}
                        className="w-full bg-[#0B0B0F] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-white text-xs font-semibold"
                        maxLength={maxTextLength}
                        placeholder={
                          {
                            ko: '아쉽네요! 다음 기회에..',
                            en: 'Better luck next time!',
                            ja: '残念！次の機会に..',
                            es: '¡Suerte para la próxima!',
                            'zh-TW': '真可惜！下次還有機會..',
                            'zh-HK': '真可惜！下次還有機會..'
                          }[activeLocale] || '아쉽네요! 다음 기회에..'
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                        {
                          {
                            ko: '당첨 인원 수 (Winners Count)',
                            en: 'Winners Count',
                            ja: '当選人数 (Winners Count)',
                            es: 'Número de ganadores',
                            'zh-TW': '中獎人數 (Winners Count)',
                            'zh-HK': '中獎人數 (Winners Count)'
                          }[activeLocale] || '당첨 인원 수 (Winners Count)'
                        }
                      </label>
                      {room?.tier === 'free' ? (
                        <div className="flex items-center gap-2 bg-black/40 border border-white/5 rounded-lg px-4 py-2.5 text-xs text-zinc-500 font-semibold select-none">
                          <Lock className="w-3.5 h-3.5" />
                          <span>
                            {
                              {
                                ko: '1명 (무료 테스트 플랜 고정)',
                                en: '1 Person (Locked on Free Trial)',
                                ja: '1人 (無料テストプラン固定)',
                                es: '1 Persona (Bloqueado en prueba gratuita)',
                                'zh-TW': '1人（免費測試方案固定）',
                                'zh-HK': '1人（免費測試方案固定）'
                              }[activeLocale] || '1명 (무료 테스트 플랜 고정)'
                            }
                          </span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-5 gap-1 bg-black/40 p-1 rounded-full border border-white/5">
                          {[1, 2, 3, 5, 10].map((num) => (
                            <button
                              type="button"
                              key={num}
                              onClick={() => setEditingPreset(prev => ({ ...prev!, lucky_draw_count: num }))}
                              className={`py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                                (editingPreset.lucky_draw_count || 1) === num
                                  ? 'bg-white text-black font-extrabold shadow-sm'
                                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.02]'
                              }`}
                            >
                              {activeLocale === 'ko' ? `${num}명` : (
                                activeLocale === 'ja' ? `${num}人` : (
                                  activeLocale === 'es' ? `${num} pers.` : `${num} Pax`
                                )
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                      {room?.tier === 'free' && (
                        <p className="text-[9px] text-zinc-500 mt-1 font-medium">
                          {
                            {
                              ko: '💡 기본형(Lite) 이상의 요금제로 업그레이드하면 최대 10명까지 다중 추첨이 가능합니다.',
                              en: '💡 Upgrade to Lite or higher plan to draw up to 10 winners simultaneously.',
                              ja: '💡 ライト(Lite)以上のプランにアップグレードすると、最大10人まで同時抽選が可能です。',
                              es: '💡 Actualice al plan Lite o superior para sortear hasta 10 ganadores simultáneamente.',
                              'zh-TW': '💡 升級至基本型（Lite）以上方案，即可進行最多 10 人的多重抽籤。',
                              'zh-HK': '💡 升級至基本型（Lite）以上方案，即可進行最多 10 人的多重抽籤。'
                            }[activeLocale] || '💡 기본형(Lite) 이상의 요금제로 업그레이드하면 최대 10명까지 다중 추첨이 가능합니다.'
                          }
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* 글자 색상 */}
                <div className="pt-3 border-t border-white/5">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    {
                      {
                        ko: '글자 색상',
                        en: 'Text Color',
                        ja: '文字色',
                        es: 'Color del texto',
                        'zh-TW': '文字顏色',
                        'zh-HK': '文字顏色'
                      }[activeLocale] || '글자 색상'
                    }
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {[
                      '#FFFFFF', '#000000', '#FFD700', '#EF4444', '#10B981', '#3B82F6',
                      '#D946EF', '#00FFFF', '#EC4899', '#8B5CF6', '#F97316', '#F59E0B'
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

                    {/* Custom Color Palette Picker for Paid Tiers */}
                    {room?.tier !== 'free' ? (
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
                            'zh-HK': '選擇自訂文字顏色'
                          }[activeLocale] || '커스텀 글자 색상 선택'
                        }
                      >
                        <input
                          type="color"
                          value={editingPreset.text_color || '#FFFFFF'}
                          onChange={(e) => setEditingPreset(prev => ({ ...prev!, text_color: e.target.value }))}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-150"
                        />
                        {editingPreset.text_color && !['#FFFFFF', '#000000', '#FFD700', '#EF4444', '#10B981', '#3B82F6',
                          '#D946EF', '#00FFFF', '#EC4899', '#8B5CF6', '#F97316', '#F59E0B'].includes(editingPreset.text_color) && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          const confirmMsg = {
                            ko: '원하는 글자 색상을 자유롭게 선택하는 커스텀 색상 기능은 유료 요금제(Lite 이상) 전용 혜택입니다. 업그레이드하시겠습니까?',
                            en: 'Custom text color palette is exclusive to paid plans (Lite or higher). Would you like to upgrade?',
                            ja: 'お好みの文字色を自由に選択できるカスタムカラー機能は有料プラン（Lite以上）専用の特典です。アップグレードしますか？',
                            es: 'La paleta de colores de texto personalizados es exclusiva de los planes de pago (Lite o superior). ¿Desea actualizar su plan?',
                            'zh-TW': '自由選擇所需文字顏色的自訂顏色功能為付費方案（Lite 以上）專屬權益。是否要升級？',
                            'zh-HK': '自由選擇所需文字顏色的自訂顏色功能為付費方案（Lite 以上）專屬權益。是否要升級？'
                          }[activeLocale] || '커스텀 색상 기능은 유료 요금제 전용 혜택입니다. 업그레이드하시겠습니까?';
                          if (confirm(confirmMsg)) {
                            setSelectedUpgradeTier(null);
                            setUpgradeStep('select');
                            setIsUpgradeModalOpen(true);
                          }
                        }}
                        className="h-9 rounded-lg border border-white/10 bg-white/5 text-zinc-500 hover:text-white flex items-center justify-center cursor-pointer transition-all hover:scale-105"
                        title="Locked"
                      >
                        <Lock className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 글꼴 스타일 */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    {
                      {
                        ko: '글꼴 스타일',
                        en: 'Font Style',
                        ja: 'フォントスタイル',
                        es: 'Estilo de fuente',
                        'zh-TW': '字型樣式',
                        'zh-HK': '字型樣式'
                      }[activeLocale] || '글꼴 스타일'
                    }
                  </label>
                  <div className="flex flex-wrap gap-1 bg-black/40 p-1 rounded-xl border border-white/5 items-center font-medium">
                    {getLocalizedFonts(activeLocale).map((item) => {
                      const isPremium = item.val === 'neon' || item.val === 'pixel' || item.val === 'plump';
                      return (
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
                          <span className="flex flex-col items-center justify-center gap-0.5">
                            <span>{item.label}</span>
                            {isPremium && (
                              <span className="px-1 py-[0.5px] rounded-[3px] text-[7px] font-black tracking-wide uppercase bg-violet-500/20 border border-violet-500/30 text-violet-400">
                                PRO
                              </span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 특수 효과 */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    {
                      {
                        ko: '특수 효과',
                        en: 'Special Effect',
                        ja: '特殊効果',
                        es: 'Efecto especial',
                        'zh-TW': '特殊效果',
                        'zh-HK': '特殊效果'
                      }[activeLocale] || '특수 효과'
                    }
                  </label>
                  <div className="grid grid-cols-4 gap-1 bg-black/40 p-1 rounded-xl border border-white/5 h-11 items-center font-medium font-sans">
                    {[
                      { val: 'none', label: '없음' },
                      { val: 'hearts', label: '하트', isPremium: true },
                      { val: 'confetti', label: '꽃가루', isPremium: true },
                      { val: 'stars', label: '별빛', isPremium: true }
                    ].map((item) => (
                      <button
                        type="button"
                        key={item.val}
                        onClick={() => {
                          const isPremium = item.val !== 'none';
                          if (isPremium && room?.tier === 'free') {
                            const confirmSpecialEffectMsg = {
                              ko: '특수 효과는 유료 요금제(Lite 이상) 전용입니다. 요금제를 업그레이드하시겠습니까?',
                              en: 'Special effects are exclusive to paid plans (Lite or higher). Would you like to upgrade your plan?',
                              ja: '特殊効果は有料プラン（Lite以上）専用です。プランをアップグレードしますか？',
                              es: 'Los efectos especiales son exclusivos de los planes de pago (Lite o superior). ¿Deseas actualizar tu plan?',
                              'zh-TW': '特殊效果為付費方案（Lite 以上）專用功能。是否要升級您的方案？',
                              'zh-HK': '特殊效果為付費方案（Lite 以上）專用功能。是否要升級您的方案？',
                            }[activeLocale] || '특수 효과는 유료 요금제(Lite 이상) 전용입니다. 요금제를 업그레이드하시겠습니까?';
                            if (confirm(confirmSpecialEffectMsg)) {
                              setSelectedUpgradeTier(null);
                              setUpgradeStep('select');
                              setIsUpgradeModalOpen(true);
                            }
                            return;
                          }
                          setEditingPreset(prev => ({ ...prev!, special_effect: item.val as any }));
                        }}
                        className={`h-full rounded-lg text-[10px] transition-all cursor-pointer ${
                          (editingPreset.special_effect || 'none') === item.val
                            ? 'bg-white text-black shadow-sm font-extrabold'
                            : 'text-zinc-400 hover:text-white hover:bg-white/[0.02]'
                        }`}
                      >
                        <span className="flex items-center justify-center gap-1">
                          <span>{item.label}</span>
                          {item.isPremium && (
                            <span className="px-1 py-[0.5px] rounded-[3px] text-[7px] font-black tracking-wide uppercase bg-violet-500/20 border border-violet-500/30 text-violet-400 shrink-0">
                              PRO
                            </span>
                          )}
                        </span>
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
                          en: 'Font Size',
                          ja: 'フォントサイズ',
                          es: 'Tamaño de fuente',
                          'zh-TW': '字型大小',
                          'zh-HK': '字型大小'
                        }[activeLocale] || '글자 크기'
                      }
                    </span>
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
              <div className="flex flex-col gap-2">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (editingPresetIndex === null || !editingPreset) return;
                      const normalized: Preset = {
                        ...editingPreset,
                        text: editingPreset.text.trim(),
                        result_text: (editingPreset.effect === 'countdown') 
                          ? (editingPreset.result_text?.trim() || 'START')
                          : (editingPreset.effect === 'luckydraw_wait' || editingPreset.effect === 'luckydraw')
                            ? (editingPreset.result_text?.trim() || '아쉽네요! 다음 기회에..')
                            : editingPreset.result_text
                      };
                      const updated = [...presets];
                      if (editingPresetIndex === presets.length) {
                        updated.push(normalized);
                      } else {
                        updated[editingPresetIndex] = normalized;
                      }
                      setPresets(updated);
                      localStorage.setItem(`glowwave_presets_${roomId}`, JSON.stringify(updated));
                      setActiveCategory('custom'); // Auto-switch to personal presets tab
                      setEditingPresetIndex(null);
                      setEditingPreset(null);
                    }}
                    className="flex-1 py-3 rounded-xl border border-white/10 bg-white/5 text-white font-bold hover:bg-white/10 transition-all text-xs cursor-pointer"
                  >
                    {
                      {
                        ko: '저장만 하기',
                        en: 'Save Only',
                        ja: '保存のみ',
                        es: 'Solo guardar',
                        'zh-TW': '僅儲存',
                        'zh-HK': '僅儲存'
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
                        result_text: (editingPreset.effect === 'countdown') 
                          ? (editingPreset.result_text?.trim() || 'START')
                          : (editingPreset.effect === 'luckydraw_wait' || editingPreset.effect === 'luckydraw')
                            ? (editingPreset.result_text?.trim() || '아쉽네요! 다음 기회에..')
                            : editingPreset.result_text
                      };
                      const updated = [...presets];
                      if (editingPresetIndex === presets.length) {
                        updated.push(normalized);
                      } else {
                        updated[editingPresetIndex] = normalized;
                      }
                      setPresets(updated);
                      localStorage.setItem(`glowwave_presets_${roomId}`, JSON.stringify(updated));
                      triggerPreset(normalized, editingPresetIndex);
                      setActiveCategory('custom'); // Auto-switch to personal presets tab
                      setEditingPresetIndex(null);
                      setEditingPreset(null);
                    }}
                    className="btn-primary flex-1 py-3 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    {
                      {
                        ko: '저장 후 바로 송출',
                        en: 'Save & Broadcast',
                        ja: '保存して配信',
                        es: 'Guardar y transmitir',
                        'zh-TW': '儲存並即時傳送',
                        'zh-HK': '儲存並即時傳送'
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
                        result_text: (editingPreset.effect === 'countdown') 
                          ? (editingPreset.result_text?.trim() || 'START')
                          : (editingPreset.effect === 'luckydraw_wait' || editingPreset.effect === 'luckydraw')
                            ? (editingPreset.result_text?.trim() || '아쉽네요! 다음 기회에..')
                            : editingPreset.result_text
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
                        en: 'Broadcast Without Saving (One-time)',
                        ja: '保存せずに配信 (1回限り)',
                        es: 'Transmitir sin guardar (Una sola vez)',
                        'zh-TW': '不儲存直接傳送（一次性傳送）',
                        'zh-HK': '不儲存直接傳送（一次性傳送）'
                      }[activeLocale] || '저장 없이 바로 송출 (1회성 송출)'
                    }
                  </button>
                )}
              </div>

              {/* Reset, Delete, Cancel as simple clean links */}
              <div className="flex flex-col gap-2 items-center text-xs">
                {editingPresetIndex < 6 && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPreset({ ...defaults[editingPresetIndex] });
                    }}
                    className="text-zinc-500 hover:text-white transition-colors cursor-pointer underline underline-offset-4"
                  >
                    {
                      {
                        ko: '기본값으로 초기화',
                        en: 'Reset to Default',
                        ja: 'デフォルトに初期化',
                        es: 'Restablecer a valores predeterminados',
                        'zh-TW': '重設為預設值',
                        'zh-HK': '重設為預設值'
                      }[activeLocale] || '기본값으로 초기화'
                    }
                  </button>
                )}

                {editingPresetIndex >= 6 && editingPresetIndex < presets.length && (
                  <button
                    type="button"
                    onClick={() => {
                      const updated = presets.filter((_, idx) => idx !== editingPresetIndex);
                      setPresets(updated);
                      localStorage.setItem(`glowwave_presets_${roomId}`, JSON.stringify(updated));
                      
                      if (activePresetIndex === editingPresetIndex) {
                        setActivePresetIndex(null);
                      } else if (activePresetIndex !== null && activePresetIndex > editingPresetIndex) {
                        setActivePresetIndex(activePresetIndex - 1);
                      }
                      
                      setEditingPresetIndex(null);
                      setEditingPreset(null);
                    }}
                    className="text-red-500/80 hover:text-red-400 transition-colors cursor-pointer underline underline-offset-4"
                  >
                    {
                      {
                        ko: '이 커스텀 프리셋 삭제',
                        en: 'Delete Custom Preset',
                        ja: 'このカスタムプリセットを削除',
                        es: 'Eliminar este ajuste personalizado',
                        'zh-TW': '刪除此自訂預設',
                        'zh-HK': '刪除此自訂預設'
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
                      'zh-HK': '取消'
                    }[activeLocale] || '취소'
                  }
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 12. Upgrade Plan Modal Dialog */}
      {isUpgradeModalOpen && (
        <div 
          onClick={() => {
            if (!isUpgrading) {
              setIsUpgradeModalOpen(false);
              if (upgradeStep === 'success') {
                setUpgradeStep('select');
                setSelectedUpgradeTier(null);
              }
            }
          }}
          className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="glass-effect border border-white/10 rounded-3xl w-full max-w-md p-7 relative z-10 animate-in fade-in zoom-in-95 duration-150 text-left flex flex-col gap-6 text-white bg-[#12121a]"
          >
            
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-white/10">
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                {t('upgrade_plan', activeLocale)}
               </h3>
              {!isUpgrading && (
                <button
                  onClick={() => {
                    setIsUpgradeModalOpen(false);
                    if (upgradeStep === 'success') {
                      setUpgradeStep('select');
                      setSelectedUpgradeTier(null);
                    }
                  }}
                  className="text-zinc-400 hover:text-white px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-xs font-bold hover:bg-white/5"
                >
                  {t('close', activeLocale)}
                </button>
              )}
            </div>

            {/* Content Switcher */}
            {upgradeStep === 'select' && (() => {
              const freePlanLimitTitle = {
                ko: '무료 플랜 제한 안내',
                en: 'Free Plan Limitation Guide',
                ja: '無料プラン制限のご案内',
                es: 'Guía de Limitación del Plan Gratuito',
                'zh-TW': '免費方案限制說明',
                'zh-HK': '免費方案限制說明',
              }[activeLocale] || '무료 플랜 제한 안내';

              const sixHoursLimit = {
                ko: '6시간 제한',
                en: '6h limit',
                ja: '6時間制限',
                es: 'Límite de 6h',
                'zh-TW': '6小時限制',
                'zh-HK': '6小時限制',
              }[activeLocale] || '6시간 제한';

              const freePlanLimitDesc = {
                ko: <>현재 기본(무료) 플랜을 사용 중이며, <span className="text-white font-bold underline decoration-indigo-400 decoration-2 underline-offset-4">시간 연장이 불가능</span>합니다. 지속적인 이용을 위해 요금제 업그레이드가 필요합니다.</>,
                en: <>You are currently on the basic (free) plan, and <span className="text-white font-bold underline decoration-indigo-400 decoration-2 underline-offset-4">session extension is not allowed</span>. Upgrading your plan is required for continuous use.</>,
                ja: <>現在ベーシック（無料）プランを使用中であり、<span className="text-white font-bold underline decoration-indigo-400 decoration-2 underline-offset-4">時間の延長ができません</span>。継続してご利用いただくには、プランのアップグレードが必要です。</>,
                es: <>Actualmente estás en el plan básico (gratuito) y <span className="text-white font-bold underline decoration-indigo-400 decoration-2 underline-offset-4">no es posible extender el tiempo</span>. Se requiere actualizar el plan para seguir usándolo.</>,
                'zh-TW': <>目前使用的是基本（免費）方案，<span className="text-white font-bold underline decoration-indigo-400 decoration-2 underline-offset-4">無法延長時間</span>。如需持續使用，請升級方案。</>,
                'zh-HK': <>目前使用的是基本（免費）方案，<span className="text-white font-bold underline decoration-indigo-400 decoration-2 underline-offset-4">無法延長時間</span>。如需持續使用，請升級方案。</>,
              }[activeLocale] || <>현재 기본(무료) 플랜을 사용 중이며, <span className="text-white font-bold underline decoration-indigo-400 decoration-2 underline-offset-4">시간 연장이 불가능</span>합니다. 지속적인 이용을 위해 요금제 업그레이드가 필요합니다.</>;

              const benefits = {
                ko: {
                  title: '업그레이드 혜택',
                  list: [
                    '24시간 사용 연장',
                    '방 비밀번호 잠금',
                    '무제한 프리셋 저장',
                    '다중 추첨 (최대 10명)',
                    '프리미엄 폰트 제공',
                    '화려한 특수효과 잠금해제',
                  ],
                  capacity: '참여자 정원 증설 (Lite: 60명 / Pro: 250명)',
                },
                en: {
                  title: 'Upgrade Benefits',
                  list: [
                    '24-hour Session Extension',
                    'Password Lock Room',
                    'Unlimited Presets Saved',
                    'Multi-raffle (Up to 10)',
                    'Premium Fonts Provided',
                    'Stunning Effects Unlocked',
                  ],
                  capacity: 'Increase Participants (Lite: 60 / Pro: 250)',
                },
                ja: {
                  title: 'アップグレード特典',
                  list: [
                    '24時間使用延長',
                    'ルームパスワードロック',
                    'プリセット無制限保存',
                    '複数当選（最大10名）',
                    'プレミアムフォント提供',
                    '華やかな特殊効果解放',
                  ],
                  capacity: '参加定員の増加 (Lite: 60名 / Pro: 250名)',
                },
                es: {
                  title: 'Beneficios de Actualización',
                  list: [
                    'Extensión de Sesión de 24h',
                    'Bloqueo de Sala por Contraseña',
                    'Guardado Ilimitado de Ajustes',
                    'Sorteo Múltiple (Hasta 10)',
                    'Fuentes Premium Incluidas',
                    'Efectos Especiales Desbloqueados',
                  ],
                  capacity: 'Ampliar Capacidad (Lite: 60 / Pro: 250 pers.)',
                },
                'zh-TW': {
                  title: '升級權益',
                  list: [
                    '延長 24 小時使用時間',
                    '房間密碼鎖定',
                    '無限制儲存預設卡片',
                    '多重抽獎 (最多 10 人)',
                    '提供進階字型',
                    '解鎖華麗特效',
                  ],
                  capacity: '增加參與人數上限 (Lite: 60人 / Pro: 250人)',
                },
                'zh-HK': {
                  title: '升級權益',
                  list: [
                    '延長 24 小時使用時間',
                    '房間密碼鎖定',
                    '無限制儲存預設卡片',
                    '多重抽獎 (最多 10 人)',
                    '提供進階字型',
                    '解鎖華麗特效',
                  ],
                  capacity: '增加參與人數上限 (Lite: 60人 / Pro: 250人)',
                },
              }[activeLocale] || {
                title: '업그레이드 혜택',
                list: [
                  '24시간 사용 연장',
                  '방 비밀번호 잠금',
                  '무제한 프리셋 저장',
                  '다중 추첨 (최대 10명)',
                  '프리미엄 폰트 제공',
                  '화려한 특수효과 잠금해제',
                ],
                capacity: '참여자 정원 증설 (Lite: 60명 / Pro: 250명)',
              };

              const activeLimitTitle = {
                ko: '💡 실시간 한도 확장',
                en: '💡 Real-time Limit Extension',
                ja: '💡 リアルタイム定員拡張',
                es: '💡 Ampliación en Tiempo Real',
                'zh-TW': '💡 即時人數上限擴展',
                'zh-HK': '💡 即時人數上限擴展',
              }[activeLocale] || '💡 실시간 한도 확장';

              const activeLimitDesc = {
                ko: '인원 제한을 늘리기 위해 플랜을 즉시 올릴 수 있으며, 업그레이드 후에도 기존 입장 QR 코드 및 링크는 변경 없이 그대로 유지됩니다.',
                en: 'You can instantly upgrade your plan to increase the limit. The existing QR code and entry link remain completely unchanged after the upgrade.',
                ja: '定員枠を増やすために即座にアップグレード可能で、アップグレード後も既存の入場QRコードやリンクはそのまま維持されます。',
                es: 'Puedes actualizar el plan al instante para ampliar el límite; el código QR y enlace de entrada existentes se mantendrán sin cambios.',
                'zh-TW': '您可以立即升級方案以提高人數上限，升級後原有的入場 QR Code 與連結保持不變，無需重新製作。',
                'zh-HK': '您可以立即升級方案以提高人數上限，升級後原有的入場 QR Code 與連結保持不變，無需重新製作。',
              }[activeLocale] || '인원 제한을 늘리기 위해 플랜을 즉시 올릴 수 있으며, 업그레이드 후에도 기존 입장 QR 코드 및 링크는 변경 없이 그대로 유지됩니다.';

              const qrAddressUnchanged = {
                ko: '업그레이드 후에도 입장용 QR 코드와 링크 주소는 동일하게 유지됩니다.',
                en: 'Even after upgrading, the entrance QR code and link address remain the same.',
                ja: 'アップグレード後も入場用QRコードとリンクアドレスは同一に維持されます。',
                es: 'Incluso después de la actualización, el código QR y enlace de acceso se mantendrán iguales.',
                'zh-TW': '升級後，觀眾入場用的 QR Code 與連結網址將維持不變。',
                'zh-HK': '升級後，觀眾入場用的 QR Code 與連結網址將維持不變。',
              }[activeLocale] || '업그레이드 후에도 입장용 QR 코드와 링크 주소는 동일하게 유지됩니다.';

              const selectPlanTitle = {
                ko: '업그레이드할 플랜 선택',
                en: 'Select a Plan to Upgrade',
                ja: 'アップグレードするプランを選択',
                es: 'Selecciona un Plan para Actualizar',
                'zh-TW': '選擇要升級的方案',
                'zh-HK': '選擇要升級的方案',
              }[activeLocale] || '업그레이드할 플랜 선택';

              const activeConnLimitLabel = {
                ko: '동시 접속 한도: ',
                en: 'Active Limit: ',
                ja: '同時接続枠: ',
                es: 'Límite de Conexión: ',
                'zh-TW': '同時連線上限: ',
                'zh-HK': '同時連線上限: ',
              }[activeLocale] || '동시 접속 한도: ';

              const vatIncludedLabel = {
                ko: 'VAT 포함',
                en: 'VAT Included',
                ja: '税込',
                es: 'IVA incluido',
                'zh-TW': '含稅 (VAT)',
                'zh-HK': '含稅 (VAT)',
              }[activeLocale] || 'VAT 포함';

              const proceedToPaymentLabel = {
                ko: '결제 단계로 이동하기',
                en: 'Proceed to Payment',
                ja: '決済手続きへ進む',
                es: 'Proceder al Pago',
                'zh-TW': '前往結帳步驟',
                'zh-HK': '前往結帳步驟',
              }[activeLocale] || '결제 단계로 이동하기';

              const storeBenefits = {
                ko: {
                  title: '매장 전광판 플랜 혜택',
                  list: [
                    '365일 24시간 중단 없는 무제한 전광판 송출',
                    '기기 재부팅 시 자동 재접속 및 동기화',
                    '다중 원격 제어 및 어드민 관리자 대시보드',
                    '매장 맞춤형 템플릿 및 메뉴판 디자인',
                    '프리미엄 폰트 및 화려한 전광판 특수효과',
                    '광고 노출 및 워터마크 완벽 제거',
                  ],
                  capacity: '동시 화면 동기화 대수: 무제한',
                },
                en: {
                  title: 'Store Signage Plan Benefits',
                  list: [
                    '365 days 24/7 Uninterrupted Playback',
                    'Auto-reconnect & Sync on device reboot',
                    'Multi-remote Control & Admin Dashboard',
                    'Store-tailored Templates & Menu Boards',
                    'Premium Fonts & Stunning Special Effects',
                    'Ad-free & Complete Watermark Removal',
                  ],
                  capacity: 'Simultaneous Screen Sync: Unlimited',
                },
                ja: {
                  title: '店舗看板プラン特典',
                  list: [
                    '365日24時間無制限のサイネージ送出',
                    '再起動時の自動再接続＆画面同期',
                    '複数リモート制御＆管理者ダッシュボード',
                    '店舗向けテンプレート＆メニューボード',
                    'プレミアムフォント＆看板特殊効果',
                    '広告非表示＆ウォーターマーク完全除去',
                  ],
                  capacity: '同時画面同期数: 無制限',
                },
                es: {
                  title: 'Beneficios del Plan Letrero',
                  list: [
                    'Transmisión 24/7 sin interrupción por 365 días',
                    'Reconexión y sincronización automática al reiniciar',
                    'Control remoto múltiple y panel de administración',
                    'Plantillas personalizadas y menús de tienda',
                    'Fuentes premium y efectos de letrero dinámicos',
                    'Sin anuncios y eliminación total de marca de agua',
                  ],
                  capacity: 'Sincronización de pantallas: Ilimitada',
                },
                'zh-TW': {
                  title: '廣告看板方案權益',
                  list: [
                    '365 天 24 小時無間斷播放',
                    '裝置重啟時自動重新連線與同步',
                    '多重遠端控制與管理員控制台',
                    '店家專屬模板與菜單看板設計',
                    '提供進階字型與華麗特選特效',
                    '無廣告干擾及完全去除浮水印',
                  ],
                  capacity: '螢幕同步連線台數：無限制',
                },
                'zh-HK': {
                  title: '廣告看板方案權益',
                  list: [
                    '365 天 24 小時無間斷播放',
                    '裝置重啟時自動重新連線與同步',
                    '多重遠端控制與管理員控制台',
                    '店家專屬模板與菜單看板設計',
                    '提供進階字型與華麗特選特效',
                    '無廣告干擾及完全去除浮水印',
                  ],
                  capacity: '螢幕同步連線台數：無限制',
                },
              }[activeLocale] || {
                title: '매장 전광판 플랜 혜택',
                list: [
                  '365일 24시간 중단 없는 무제한 전광판 송출',
                  '기기 재부팅 시 자동 재접속 및 동기화',
                  '다중 원격 제어 및 어드민 관리자 대시보드',
                  '매장 맞춤형 템플릿 및 메뉴판 디자인',
                  '프리미엄 폰트 및 화려한 전광판 특수효과',
                  '광고 노출 및 워터마크 완벽 제거',
                ],
                capacity: '동시 화면 동기화 대수: 무제한',
              };

              const currentBenefits = benefits;

              return (
                <div className="flex flex-col gap-5 text-left">

                  {room?.tier === 'free' ? (
                    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent p-5 flex flex-col gap-3.5">
                      {/* Decorative glow background */}
                      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                      
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <div className="flex items-center gap-2 text-indigo-300 text-xs font-black uppercase tracking-wider">
                          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                          {freePlanLimitTitle}
                        </div>
                        <span className="text-[10px] text-zinc-400 font-bold bg-white/5 px-2 py-0.5 rounded-full">{sixHoursLimit}</span>
                      </div>

                      <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-medium">
                        {freePlanLimitDesc}
                      </p>

                      <div className="pt-2 mt-1 border-t border-white/5 flex flex-col gap-2">
                        <span className="text-[11px] font-black text-indigo-300 tracking-wider uppercase">{currentBenefits.title}</span>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[11px] font-semibold text-zinc-300">
                          {currentBenefits.list.map((bText, bIdx) => (
                            <div key={bIdx} className="flex items-center gap-1.5">
                              <svg className="w-3.5 h-3.5 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                              <span>{bText}</span>
                            </div>
                          ))}
                          <div className="flex items-center gap-1.5 col-span-2 mt-0.5 bg-indigo-500/10 border border-indigo-500/20 px-2 py-1.5 rounded-lg">
                            <svg className="w-3.5 h-3.5 text-indigo-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            <span className="text-zinc-300">{currentBenefits.capacity}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 p-4 flex flex-col gap-2">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
                      <div className="flex items-center gap-1.5 text-indigo-300 text-xs font-black uppercase tracking-wider">
                        {activeLimitTitle}
                      </div>
                      <p className="text-xs text-zinc-300 leading-normal">
                        {activeLimitDesc}
                      </p>
                    </div>
                  )}

                  {room?.tier === 'free' && (
                    <div className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/[0.02] border border-white/5 text-[10px] text-zinc-400 leading-normal">
                      <span>💡</span>
                      <span>{qrAddressUnchanged}</span>
                    </div>
                  )}
                  
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{selectPlanTitle}</span>
                  <div className="flex flex-col gap-3">
                    {getUpgradableTiers().map((tKey) => {
                      const config = TIER_CONFIGS[tKey];
                      const isSelected = selectedUpgradeTier === tKey;
                      const planName = getLocalizedTierName(tKey, activeLocale);
                      const formattedPrice = activeLocale === 'ko'
                        ? `${config.priceKrw.toLocaleString()}원`
                        : ['en', 'es'].includes(activeLocale)
                          ? `$${config.priceUsd} USD`
                          : `${getLocalizedPrice(tKey, activeLocale)} ($${config.priceUsd} USD)`;
                      return (
                        <button
                          key={tKey}
                          onClick={() => setSelectedUpgradeTier(tKey)}
                          className={`w-full p-5 rounded-2xl border transition-all text-left flex justify-between items-center cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-650 border-indigo-500 text-white shadow-lg shadow-indigo-650/20 scale-[1.02]'
                              : 'bg-white/[0.03] border-white/5 text-zinc-300 hover:bg-white/[0.08] hover:border-white/10 hover:scale-[1.01]'
                          }`}
                        >
                          <div>
                            <div className="font-black text-sm sm:text-base capitalize">{planName}</div>
                            <div className={`text-xs mt-1 font-medium ${isSelected ? 'text-indigo-100' : 'text-zinc-400'}`}>
                              {activeConnLimitLabel}<strong className={isSelected ? 'text-white' : 'text-zinc-200'}>{config.maxParticipants}{t('person_unit', activeLocale)}</strong>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono text-sm sm:text-base font-black tracking-tight">{formattedPrice}</div>
                            <div className={`text-[10px] mt-0.5 font-bold ${isSelected ? 'text-indigo-200' : 'text-zinc-500'}`}>{vatIncludedLabel}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => {
                      if (selectedUpgradeTier) setUpgradeStep('payment');
                    }}
                    disabled={!selectedUpgradeTier}
                    className="w-full py-4 mt-2 rounded-2xl bg-white text-black hover:bg-zinc-200 font-extrabold text-sm transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:pointer-events-none shadow-lg shadow-white/5"
                  >
                    {proceedToPaymentLabel}
                  </button>
                </div>
              );
            })()}

            {upgradeStep === 'payment' && selectedUpgradeTier && (() => {
              const paymentDesc = {
                ko: <>선택하신 <strong className="text-white capitalize">{selectedUpgradeTier} Plan</strong> 요금을 결제합니다.<br />결제 승인 즉시 동시 접속 인원 제한이 <strong className="text-indigo-300">{TIER_CONFIGS[selectedUpgradeTier].maxParticipants}명</strong>으로 증가합니다.</>,
                en: <>We will process the payment for your selected <strong className="text-white capitalize">{selectedUpgradeTier} Plan</strong>.<br />Upon approval, the connection limit will immediately increase to <strong className="text-indigo-300">{TIER_CONFIGS[selectedUpgradeTier].maxParticipants}</strong>.</>,
                ja: <>選択された <strong className="text-white capitalize">{selectedUpgradeTier} プラン</strong> の決済を行います。<br />決済承認後、直ちに同時接続人数枠が <strong className="text-indigo-300">{TIER_CONFIGS[selectedUpgradeTier].maxParticipants}人</strong> に拡大されます。</>,
                es: <>Se procesará el pago del <strong className="text-white capitalize">{selectedUpgradeTier} Plan</strong> seleccionado.<br />Tras la aprobación, el límite de conexión aumentará inmediatamente a <strong className="text-indigo-300">{TIER_CONFIGS[selectedUpgradeTier].maxParticipants}</strong>.</>,
                'zh-TW': <>將為您選購的 <strong className="text-white capitalize">{selectedUpgradeTier} 方案</strong> 進行結帳。<br />付款成功後，同時連線人數上限將立即調升至 <strong className="text-indigo-300">{TIER_CONFIGS[selectedUpgradeTier].maxParticipants} 人</strong>。</>,
                'zh-HK': <>將為您選購的 <strong className="text-white capitalize">{selectedUpgradeTier} 方案</strong> 進行結帳。<br />付款成功後，同時連線人數上限將立即調升至 <strong className="text-indigo-300">{TIER_CONFIGS[selectedUpgradeTier].maxParticipants} 人</strong>。</>,
              }[activeLocale] || <>선택하신 <strong className="text-white capitalize">{selectedUpgradeTier} Plan</strong> 요금을 결제합니다.<br />결제 승인 즉시 동시 접속 인원 제한이 <strong className="text-indigo-300">{TIER_CONFIGS[selectedUpgradeTier].maxParticipants}명</strong>으로 증가합니다.</>;

              const simulatorTitle = {
                ko: '가상 결제 모듈 시뮬레이터',
                en: 'Checkout Module Simulator',
                ja: '仮想決済モジュールシミュレータ',
                es: 'Simulador de Módulo de Pago',
                'zh-TW': '虛擬結帳模擬器',
                'zh-HK': '虛擬結帳模擬器',
              }[activeLocale] || '가상 결제 모듈 시뮬레이터';

              const targetPlanLabel = {
                ko: '결제 대상 플랜',
                en: 'Selected Plan',
                ja: '対象プラン',
                es: 'Plan Seleccionado',
                'zh-TW': '結帳方案',
                'zh-HK': '結帳方案',
              }[activeLocale] || '결제 대상 플랜';

              const extendedCapacityLabel = {
                ko: '증설 인원 한도',
                en: 'Extended Capacity',
                ja: '拡張接続枠',
                es: 'Límite de Capacidad',
                'zh-TW': '擴增人數上限',
                'zh-HK': '擴增人數上限',
              }[activeLocale] || '증설 인원 한도';

              const paymentAmtLabel = {
                ko: '결제 금액',
                en: 'Total Amount',
                ja: '決済金額',
                es: 'Total a Pagar',
                'zh-TW': '應付金額',
                'zh-HK': '應付金額',
              }[activeLocale] || '결제 금액';

              const previousStepLabel = {
                ko: '이전으로',
                en: 'Back',
                ja: '戻る',
                es: 'Atrás',
                'zh-TW': '上一步',
                'zh-HK': '上一步',
              }[activeLocale] || '이전으로';

              const completePaymentLabel = {
                ko: '결제 승인 완료',
                en: 'Complete Payment',
                ja: '決済を承認する',
                es: 'Completar Pago',
                'zh-TW': '完成付款',
                'zh-HK': '完成付款',
              }[activeLocale] || '결제 승인 완료';

              const approvingLabel = {
                ko: '승인 중...',
                en: 'Processing...',
                ja: '承認中...',
                es: 'Procesando...',
                'zh-TW': '授權中...',
                'zh-HK': '授權中...',
              }[activeLocale] || '승인 중...';

              const formattedPrice = activeLocale === 'ko'
                ? `${TIER_CONFIGS[selectedUpgradeTier].priceKrw.toLocaleString()}원`
                : ['en', 'es'].includes(activeLocale)
                  ? `$${TIER_CONFIGS[selectedUpgradeTier].priceUsd} USD`
                  : `${getLocalizedPrice(selectedUpgradeTier, activeLocale)} ($${TIER_CONFIGS[selectedUpgradeTier].priceUsd} USD)`;

              return (
                <div className="flex flex-col gap-5 text-left">
                  <div className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                    {paymentDesc}
                  </div>

                  {/* Promo Code Input Form */}
                  <div className="bg-black/30 border border-white/5 rounded-xl p-3 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        {activeLocale === 'ko' ? '프로모션 코드' : 'Promo Code'}
                      </span>
                      {verifiedCoupon && (
                        <span className="text-[9px] text-emerald-400 font-extrabold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          {verifiedCoupon.code} {verifiedCoupon.discount_pct}% 할인 적용됨
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoCodeInput}
                        onChange={(e) => setPromoCodeInput(e.target.value)}
                        placeholder={activeLocale === 'ko' ? '예: WELCOME20' : 'e.g. WELCOME20'}
                        disabled={isVerifyingCoupon || verifiedCoupon}
                        className="flex-1 bg-[#0B0B0F] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono uppercase"
                      />
                      <button
                        type="button"
                        onClick={handleApplyPromoCode}
                        disabled={isVerifyingCoupon || verifiedCoupon || !promoCodeInput.trim()}
                        className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-40 disabled:hover:bg-zinc-800"
                      >
                        {isVerifyingCoupon ? '...' : activeLocale === 'ko' ? '적용' : 'Apply'}
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-[10px] text-red-400 font-bold mt-0.5">{couponError}</p>
                    )}
                    {verifiedCoupon && (
                      <button
                        type="button"
                        onClick={() => {
                          setVerifiedCoupon(null);
                          setPromoCodeInput('');
                          setCouponError(null);
                        }}
                        className="text-[9px] text-zinc-500 hover:text-zinc-300 font-semibold self-start underline cursor-pointer"
                      >
                        {activeLocale === 'ko' ? '코드 취소하기' : 'Remove promo code'}
                      </button>
                    )}
                  </div>

                  {/* PG Checkout Simulator Card */}
                  <div className="bg-black/40 border border-white/5 rounded-2xl p-5 flex flex-col gap-3.5">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{simulatorTitle}</span>
                    
                    <div className="flex justify-between items-center text-xs sm:text-sm border-b border-white/5 pb-2.5">
                      <span className="text-zinc-400">{targetPlanLabel}</span>
                      <span className="text-white font-extrabold capitalize">{selectedUpgradeTier} Plan</span>
                    </div>

                    <div className="flex justify-between items-center text-xs sm:text-sm border-b border-white/5 pb-2.5">
                      <span className="text-zinc-400">{extendedCapacityLabel}</span>
                      <span className="text-emerald-400 font-extrabold">{TIER_CONFIGS[selectedUpgradeTier].maxParticipants}{t('person_unit', activeLocale)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs sm:text-sm">
                      <span className="text-zinc-400">{paymentAmtLabel}</span>
                      <div className="flex flex-col items-end">
                        {verifiedCoupon ? (
                          <>
                            <span className="text-zinc-500 text-[10px] line-through font-mono">
                              {formattedPrice}
                            </span>
                            <span className="text-emerald-400 font-extrabold text-sm font-mono animate-pulse">
                              {(() => {
                                const basePrice = TIER_CONFIGS[selectedUpgradeTier].priceKrw;
                                const discounted = Math.round(basePrice * (1 - verifiedCoupon.discount_pct / 100));
                                if (activeLocale === 'ko') {
                                  return `${discounted.toLocaleString()}원`;
                                } else {
                                  const usdBase = TIER_CONFIGS[selectedUpgradeTier].priceUsd;
                                  const discountedUsd = usdBase * (1 - verifiedCoupon.discount_pct / 100);
                                  return `$${discountedUsd.toFixed(1)} USD`;
                                }
                              })()}
                            </span>
                          </>
                        ) : (
                          <span className="text-indigo-300 font-black font-mono">{formattedPrice}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setUpgradeStep('select')}
                      disabled={isUpgrading}
                      className="flex-1 py-4 rounded-2xl bg-white/5 text-zinc-400 font-bold hover:bg-white/10 hover:text-white transition-all text-sm cursor-pointer disabled:opacity-50 border border-white/5"
                    >
                      {previousStepLabel}
                    </button>
                    
                    <button
                      onClick={handleUpgrade}
                      disabled={isUpgrading}
                      className="flex-1 py-4 rounded-2xl bg-white text-black font-extrabold text-sm hover:bg-zinc-200 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-lg"
                    >
                      {isUpgrading ? (
                        <span>{approvingLabel}</span>
                      ) : (
                        <span>{completePaymentLabel}</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })()}

            {upgradeStep === 'success' && selectedUpgradeTier && (() => {
              const successTitle = {
                ko: '플랜 업그레이드 성공',
                en: 'Upgrade Successful',
                ja: 'アップグレード成功',
                es: 'Actualización Exitosa',
                'zh-TW': '方案升級成功',
                'zh-HK': '方案升級成功',
              }[activeLocale] || '플랜 업그레이드 성공';

              const successDesc = {
                ko: <>요금제 플랜 업그레이드가 완료되었습니다.<br />전광판 동시 접속 정원이 즉시 <strong className="text-white">{TIER_CONFIGS[selectedUpgradeTier].maxParticipants}명</strong>으로 확장되었습니다.</>,
                en: <>Your plan upgrade is complete.<br />The spectator connection limit has been expanded to <strong className="text-white">{TIER_CONFIGS[selectedUpgradeTier].maxParticipants}</strong> immediately.</>,
                ja: <>プランのアップグレードが完了しました。<br />同時接続人数枠がただちに <strong className="text-white">{TIER_CONFIGS[selectedUpgradeTier].maxParticipants}人</strong> に拡張されました。</>,
                es: <>La actualización del plan se ha completado.<br />El límite de conexión de espectadores se ha ampliado inmediatamente a <strong className="text-white">{TIER_CONFIGS[selectedUpgradeTier].maxParticipants}</strong>.</>,
                'zh-TW': <>方案升級已完成！<br />連線人數上限已立即調升至 <strong className="text-white">{TIER_CONFIGS[selectedUpgradeTier].maxParticipants} 人</strong>。</>,
                'zh-HK': <>方案升級已完成！<br />連線人數上限已立即調升至 <strong className="text-white">{TIER_CONFIGS[selectedUpgradeTier].maxParticipants} 人</strong>。</>,
              }[activeLocale] || <>요금제 플랜 업그레이드가 완료되었습니다.<br />전광판 동시 접속 정원이 즉시 <strong className="text-white">{TIER_CONFIGS[selectedUpgradeTier].maxParticipants}명</strong>으로 확장되었습니다.</>;

              const noticeTitle = {
                ko: '안내',
                en: 'Notice',
                ja: 'ご案内',
                es: 'Aviso',
                'zh-TW': '說明',
                'zh-HK': '說明',
              }[activeLocale] || '안내';

              const noticeDesc = {
                ko: '기존에 열려 있는 관람객 접속용 QR 코드와 링크 주소는 그대로 동일하게 유지되므로, 관람객들이 새로 고침을 하거나 재스캔을 하지 않아도 정상 작동합니다.',
                en: 'The existing QR code and entry link remain exactly the same. Spectators do not need to scan again or refresh to stay connected.',
                ja: '既存の観客用QRコードやリンクはそのまま維持されるため、観客が再スキャンやリロードを行わなくても正常に動作し続けます。',
                es: 'El código QR y enlace de acceso existentes se mantendrán iguales; los espectadores no necesitan recargar ni volver a escanear.',
                'zh-TW': '原有的觀眾入場 QR Code 與連結網址維持不變，觀眾無需重新整理頁面或重新掃描即可正常連線。',
                'zh-HK': '原有的觀眾入場 QR Code 與連結網址維持不變，觀眾無需重新整理頁面或重新掃描即可正常連線。',
              }[activeLocale] || '기존에 열려 있는 관람객 접속용 QR 코드와 링크 주소는 그대로 동일하게 유지되므로, 관람객들이 새로 고침을 하거나 재스캔을 하지 않아도 정상 작동합니다.';

              return (
                <div className="flex flex-col items-center text-center gap-5 py-4">
                  <span className="text-xs font-black text-emerald-400 uppercase tracking-widest px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    Success
                  </span>
                  
                  <h4 className="text-lg sm:text-xl font-black text-white">{successTitle}</h4>
                  
                  <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-sm">
                    {successDesc}
                  </p>

                  <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl text-xs text-zinc-400 leading-relaxed max-w-sm text-left">
                    <strong className="text-zinc-300 block mb-1">{noticeTitle}</strong>
                    {noticeDesc}
                  </div>

                  <button
                    onClick={() => {
                      setIsUpgradeModalOpen(false);
                      setUpgradeStep('select');
                      setSelectedUpgradeTier(null);
                    }}
                    className="w-full py-4 mt-2 rounded-2xl bg-white text-black font-extrabold text-sm hover:bg-zinc-200 transition-all cursor-pointer shadow-lg"
                  >
                    {t('back_to_dashboard', activeLocale)}
                  </button>
                </div>
              );
            })()}

          </div>
        </div>
      )}

      {/* 13. Room Time Extension Modal Dialog */}
      {isExtendModalOpen && room && (() => {
        const modalTitle = {
          ko: '방 시간 연장 (Extend Session)',
          en: 'Extend Session Time',
          ja: 'ルーム時間延長 (Extend Session)',
          es: 'Extender Tiempo de Sala (Extend Session)',
          'zh-TW': '延長房間時間 (Extend Session)',
          'zh-HK': '延長房間時間 (Extend Session)',
        }[activeLocale] || '방 시간 연장 (Extend Session)';

        const noticeTitle = {
          ko: '안내',
          en: 'Notice',
          ja: 'ご案内',
          es: 'Aviso',
          'zh-TW': '說明',
          'zh-HK': '說明',
        }[activeLocale] || '안내';

        const isStoreTier = room.tier === 'store' || room.tier === 'store_annual';
        const durationTextKo = isStoreTier 
          ? (selectedExtendHours === 8760 ? '365일(1년)' : '30일(1달)') 
          : '24시간';
        const durationTextEn = isStoreTier 
          ? (selectedExtendHours === 8760 ? '365 days (1 year)' : '30 days (1 month)') 
          : '24 hours';
        const durationTextJa = isStoreTier 
          ? (selectedExtendHours === 8760 ? '365日(1年)' : '30日(1ヶ月)') 
          : '24時間';
        const durationTextEs = isStoreTier 
          ? (selectedExtendHours === 8760 ? '365 días (1 año)' : '30 días (1 mes)') 
          : '24 horas';
        const durationTextZh = isStoreTier 
          ? (selectedExtendHours === 8760 ? '365 天 (1 年)' : '30 天 (1 個月)') 
          : '24 小時';

        const extendInfoDesc = {
          ko: <>방의 활성 시간을 <strong className="text-white">{durationTextKo} 연장</strong>합니다.<br />연장 후에도 기존에 접속해 있던 관객들의 링크 및 QR 코드는 변경 없이 그대로 유지됩니다.</>,
          en: <>Extends the active room session by <strong className="text-white">{durationTextEn}</strong>.<br />The existing entry links and QR codes remain unchanged and work seamlessly.</>,
          ja: <>ルームの有効時間を <strong className="text-white">{durationTextJa}延長</strong> します。<br />延長後も既存の観客用リンクやQRコードは変更なくそのまま維持されます。</>,
          es: <>Extiende la duración activa de la sala por <strong className="text-white">{durationTextEs}</strong>.<br />El enlace de acceso y código QR se mantendrán sin cambios.</>,
          'zh-TW': <>延長房間有效時間 <strong className="text-white">{durationTextZh}</strong>。<br />延長後觀眾原本使用的連結與 QR Code 均維持不變，可繼續 사용 가능합니다.</>,
          'zh-HK': <>延長房間有效時間 <strong className="text-white">{durationTextZh}</strong>。<br />延長後觀眾原本使用的連結與 QR Code 均維持不變，可繼續 사용 가능합니다.</>,
        }[activeLocale] || <>방의 활성 시간을 <strong className="text-white">{durationTextKo} 연장</strong>합니다.</>;

        const currentPlanLabel = {
          ko: '현재 티어',
          en: 'Current Plan',
          ja: '現在のプラン',
          es: 'Plan Actual',
          'zh-TW': '目前方案',
          'zh-HK': '目前方案',
        }[activeLocale] || '현재 티어';

        const currentExpiryLabel = {
          ko: '현재 만료 예정 시각',
          en: 'Current Expiration',
          ja: '現在の有効期限',
          es: 'Expiración Actual',
          'zh-TW': '目前到期時間',
          'zh-HK': '目前到期時間',
        }[activeLocale] || '현재 만료 예정 시각';

        const extendedExpiryLabel = {
          ko: '연장 후 만료 예정 시각',
          en: 'Extended Expiration',
          ja: '延長後の有効期限',
          es: 'Nueva Expiración',
          'zh-TW': '延長後到期時間',
          'zh-HK': '延長後到期時間',
        }[activeLocale] || '연장 후 만료 예정 시각';

        const proceedToPaymentLabel = {
          ko: '결제 단계로 이동하기',
          en: 'Proceed to Payment',
          ja: '決済手続きへ進む',
          es: 'Proceder al Pago',
          'zh-TW': '前往結帳步驟',
          'zh-HK': '前往結帳步驟',
        }[activeLocale] || '결제 단계로 이동하기';

        return (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-effect border border-white/10 rounded-3xl w-full max-w-md p-7 relative z-10 animate-in fade-in zoom-in-95 duration-150 text-left flex flex-col gap-6 text-white bg-[#12121a]">
              
              {/* Header */}
              <div className="flex justify-between items-center pb-4 border-b border-white/10">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  {modalTitle}
                </h3>
                {!isExtending && extendStep !== 'success' && (
                  <button
                    onClick={() => setIsExtendModalOpen(false)}
                    className="text-zinc-400 hover:text-white px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-xs font-bold hover:bg-white/5"
                  >
                    {t('close', activeLocale)}
                  </button>
                )}
              </div>

              {/* Content Switcher */}
              {extendStep === 'info' && (() => {
                let tierDurationMs = 24 * 60 * 60 * 1000;
                if (room.tier === 'free') {
                  tierDurationMs = 6 * 60 * 60 * 1000;
                } else if (room.tier === 'store') {
                  tierDurationMs = 30 * 24 * 60 * 60 * 1000;
                } else if (room.tier === 'store_annual') {
                  tierDurationMs = 365 * 24 * 60 * 60 * 1000;
                }
                const isStoreTier = room.tier === 'store' || room.tier === 'store_annual';

                return (
                  <div className="flex flex-col gap-5 text-left">
                    <div className="text-xs sm:text-sm text-zinc-300 leading-relaxed bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-2xl">
                      <span className="font-extrabold text-indigo-300 block mb-1">{noticeTitle}</span>
                      {extendInfoDesc}
                    </div>

                    {isStoreTier && (
                      <div className="flex flex-col gap-2 bg-black/40 border border-white/5 p-3 rounded-2xl">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">
                          {activeLocale === 'ko' ? '연장 플랜 선택' : 'Select Extension Duration'}
                        </span>
                        <div className="flex gap-2 p-1 rounded-xl bg-black/30 border border-white/5">
                          <button
                            type="button"
                            onClick={() => setSelectedExtendHours(720)}
                            className={`flex-1 py-2 text-center rounded-lg text-xs font-bold transition-all cursor-pointer select-none ${
                              selectedExtendHours === 720
                                ? 'bg-white text-black shadow font-black'
                                : 'text-zinc-400 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            {activeLocale === 'ko' ? '30일 연장 (월간)' : '30-Day (Monthly)'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedExtendHours(8760)}
                            className={`flex-1 py-2 text-center rounded-lg text-xs font-bold transition-all cursor-pointer select-none ${
                              selectedExtendHours === 8760
                                ? 'bg-white text-black shadow font-black'
                                : 'text-zinc-400 hover:text-white hover:bg-white/5'
                            }`}
                          >
                            {activeLocale === 'ko' ? '365일 연장 (연간)' : '365-Day (Annual)'}
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <div className="bg-black/30 border border-white/5 rounded-2xl p-4 flex flex-col gap-2.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">{currentPlanLabel}</span>
                        <span className="text-white font-extrabold uppercase">
                          {
                            room.tier === 'store' ? (activeLocale === 'ko' ? '매장 월간 플랜' : 'STORE MONTHLY') :
                            room.tier === 'store_annual' ? (activeLocale === 'ko' ? '매장 연간 플랜' : 'STORE ANNUAL') :
                            `${room.tier.toUpperCase()} Plan`
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">{currentExpiryLabel}</span>
                        <span className="text-zinc-300 font-mono">
                          {new Date(new Date(room.created_at).getTime() + tierDurationMs).toLocaleString(activeLocale === 'zh-TW' ? 'zh-TW' : (activeLocale === 'zh-HK' ? 'zh-HK' : activeLocale))}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-white/5 pt-2">
                        <span className="text-indigo-400 font-bold">{extendedExpiryLabel}</span>
                        <span className="text-indigo-300 font-mono font-bold">
                          {new Date(Math.max(Date.now(), new Date(room.created_at).getTime() + tierDurationMs) + selectedExtendHours * 60 * 60 * 1000).toLocaleString(activeLocale === 'zh-TW' ? 'zh-TW' : (activeLocale === 'zh-HK' ? 'zh-HK' : activeLocale))}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setExtendStep('payment')}
                      className="w-full py-4 rounded-2xl bg-white text-black hover:bg-zinc-200 font-extrabold text-sm transition-all duration-200 cursor-pointer shadow-lg shadow-white/5"
                    >
                      {proceedToPaymentLabel}
                    </button>
                  </div>
                );
              })()}

              {extendStep === 'payment' && (() => {
                const isStoreTier = room.tier === 'store' || room.tier === 'store_annual';
                const durationTextKo = isStoreTier 
                  ? (selectedExtendHours === 8760 ? '365일(1년)' : '30일(1달)') 
                  : '24시간';
                const durationTextEn = isStoreTier 
                  ? (selectedExtendHours === 8760 ? '365-day' : '30-day') 
                  : '24-hour';
                const durationTextJa = isStoreTier 
                  ? (selectedExtendHours === 8760 ? '365日(1年)' : '30일(1ヶ月)') 
                  : '24時間';
                const durationTextEs = isStoreTier 
                  ? (selectedExtendHours === 8760 ? '365 días' : '30 días') 
                  : '24 horas';
                const durationTextZh = isStoreTier 
                  ? (selectedExtendHours === 8760 ? '365 天' : '30 天') 
                  : '24 小時';

                const extendPayDesc = {
                  ko: <>방 연장 {durationTextKo} 이용권을 결제합니다.<br />기존 이용 요금 대비 <strong className="text-indigo-300">20% 할인된 장기 고객 혜택가</strong>가 자동 적용됩니다.</>,
                  en: <>Process payment for a {durationTextEn} session extension.<br />A <strong className="text-indigo-300">20% loyalty discount</strong> is automatically applied.</>,
                  ja: <>ルーム{durationTextJa}延長チケットの決済を行います。<br />通常の利用料金から <strong className="text-indigo-300">20%割引された延長特別価格</strong> が自動適用されます。</>,
                  es: <>Se procesará el pago del pase de extensión de {durationTextEs}.<br />Se aplica un <strong className="text-indigo-300">20% de descuento automático</strong> por fidelidad.</>,
                  'zh-TW': <>付款購買 {durationTextZh} 延長時間。<br />系統已自動套用 <strong className="text-indigo-300">8 折의續用優惠價</strong>。</>,
                  'zh-HK': <>付款購買 {durationTextZh} 延長時間。<br />系統已自動套用 <strong className="text-indigo-300">8 折의續用優惠價</strong>。</>,
                }[activeLocale] || <>방 연장 {durationTextKo} 이용권을 결제합니다.</>;

                const simulatorTitle = {
                  ko: '가상 결제 모듈 시뮬레이터',
                  en: 'Checkout Module Simulator',
                  ja: '仮想決済モジュールシミュレー타',
                  es: 'Simulador de Módulo de Pago',
                  'zh-TW': '虛擬結帳模擬器',
                  'zh-HK': '虛擬結帳模擬器',
                }[activeLocale] || '가상 결제 모듈 시뮬레이터';

                const productLabel = {
                  ko: '결제 대상 상품',
                  en: 'Product',
                  ja: '決済対象商品',
                  es: 'Producto',
                  'zh-TW': '購買項目',
                  'zh-HK': '購買項目',
                }[activeLocale] || '결제 대상 상품';

                const productVal = {
                  ko: isStoreTier 
                    ? (selectedExtendHours === 8760 ? '매장 전용 365일(1년) 시간 연장 이용권' : '매장 전용 30일(1달) 시간 연장 이용권')
                    : '24시간 시간 연장 이용권',
                  en: isStoreTier
                    ? (selectedExtendHours === 8760 ? 'Store 365-Day Session Extension Pass' : 'Store 30-Day Session Extension Pass')
                    : '24-Hour Session Extension Pass',
                  ja: isStoreTier
                    ? (selectedExtendHours === 8760 ? '店舗365일룸延長チケット' : '店舗30일룸延長チケット')
                    : '24시간룸연장티켓',
                  es: isStoreTier
                    ? (selectedExtendHours === 8760 ? 'Pase de Extensión de 365 Días' : 'Pase de Extensión de 30 Días')
                    : 'Pase de Extensión de 24 Horas',
                  'zh-TW': isStoreTier
                    ? (selectedExtendHours === 8760 ? '商戶 365 天延長使用券' : '商戶 30 天延長使用券')
                    : '24 小時延長使用券',
                  'zh-HK': isStoreTier
                    ? (selectedExtendHours === 8760 ? '商戶 365 天延長使用券' : '商戶 30 天延長使用券')
                    : '24 小時延長使用券',
                }[activeLocale] || '시간 연장 이용권';

                const originalPriceLabel = {
                  ko: '정가',
                  en: 'Regular Price',
                  ja: '定価',
                  es: 'Precio Original',
                  'zh-TW': '原價',
                  'zh-HK': '原價',
                }[activeLocale] || '정가';

                const discountLabel = {
                  ko: '연장 할인 (20%)',
                  en: 'Extension Discount (20%)',
                  ja: '延長割引 (20%)',
                  es: 'Descuento por Extensión (20%)',
                  'zh-TW': '續用優惠 (2 折)',
                  'zh-HK': '續用優惠 (2 折)',
                }[activeLocale] || '연장 할인 (20%)';

                const finalAmtLabel = {
                  ko: '최종 결제 금액',
                  en: 'Total Price',
                  ja: '最終決済金額',
                  es: 'Total Final',
                  'zh-TW': '最終結帳金額',
                  'zh-HK': '最終結帳金額',
                }[activeLocale] || '최종 결제 금액';

                const refundWarningTitle = {
                  ko: '경고 (환불/취소 정책 동의)',
                  en: 'Warning (Refund & Cancellation Policy)',
                  ja: '警告（払い戻し・キャンセルポリシーへの同意）',
                  es: 'Advertencia (Términos de Cancelación y Reembolso)',
                  'zh-TW': '警告 (同意退款與取消政策)',
                  'zh-HK': '警告 (同意退款與取消政策)',
                }[activeLocale] || '경고 (환불/취소 정책 동의)';

                const refundWarningBody = {
                  ko: '방 시간 연장은 결제 완료 즉시 예약 리소스가 즉시 할당되어 선택한 기간의 연장 처리가 실행되므로, 단순 변심으로 인한 환불 및 결제 취소가 엄격히 불가능합니다. 이에 동의하시는 경우에만 결제를 진행해 주세요.',
                  en: 'Session extensions allocate resources immediately upon checkout. Therefore, refunds or cancellations due to change of mind are strictly prohibited. Proceed only if you agree.',
                  ja: 'ルームの時間延長は、決済完了と同時にリソースが即時割り当てられて延長処理が実行されるため、お客様都合による払い戻しや決済のキャンセルは一切お受けできません。同意の上で決済を進めてください。',
                  es: 'La extensión de tiempo asigna recursos al instante tras el pago; por lo tanto, no se permiten reembolsos ni cancelaciones por cambio de opinión. Procede solo si estás de acuerdo.',
                  'zh-TW': '房間延長服務於付款後會立即分配系統資源並完成延展，因此購買後無法以任何個人理由申請退款或取消交易。請在同意此項政策的前提下進行結帳。',
                  'zh-HK': '房間延長服務於付款後會立即分配系統資源並完成延展，因此購買後無法以任何個人理由申請退款或取消交易。請在同意此項政策的前提下進行結帳。',
                }[activeLocale] || '방 시간 연장은 결제 완료 즉시 예약 리소스가 즉시 할당되어 24시간 연장 처리가 실행되므로, 단순 변심으로 인한 환불 및 결제 취소가 엄격히 불가능합니다. 이에 동의하시는 경우에만 결제를 진행해 주세요.';

                const previousStepLabel = {
                  ko: '이전으로',
                  en: 'Back',
                  ja: '戻る',
                  es: 'Atrás',
                  'zh-TW': '上一步',
                  'zh-HK': '上一步',
                }[activeLocale] || '이전으로';

                const completePaymentLabel = {
                  ko: '결제 승인 완료',
                  en: 'Complete Payment',
                  ja: '決済を承認する',
                  es: 'Completar Pago',
                  'zh-TW': '完成付款',
                  'zh-HK': '完成付款',
                }[activeLocale] || '결제 승인 완료';

                const approvingLabel = {
                  ko: '승인 중...',
                  en: 'Processing...',
                  ja: '承認中...',
                  es: 'Procesando...',
                  'zh-TW': '授權中...',
                  'zh-HK': '授權中...',
                }[activeLocale] || '승인 중...';

                const getFormattedLocalPrice = (tier: TierType, loc: string, mult: number = 1) => {
                  if (tier === 'free') {
                    return {
                      ko: '무료',
                      en: 'Free',
                      ja: '無料',
                      es: 'Gratis',
                      'zh-TW': '免費',
                      'zh-HK': '免費'
                    }[loc] || '무료';
                  }
                  const baseUsd = TIER_CONFIGS[tier].priceUsd;
                  const usdVal = baseUsd * mult;
                  
                  if (loc === 'ko') {
                    const krwVal = Math.round(TIER_CONFIGS[tier].priceKrw * mult);
                    return mult === 0.2 ? `-${krwVal.toLocaleString()}원` : `${krwVal.toLocaleString()}원`;
                  }
                  
                  const basePrices: Record<Exclude<TierType, 'free'>, { jpy: number; twd: number; hkd: number }> = {
                    lite: { jpy: 600, twd: 130, hkd: 30 },
                    pro: { jpy: 3000, twd: 650, hkd: 150 },
                    max: { jpy: 6000, twd: 1300, hkd: 300 },
                    store: { jpy: 600, twd: 130, hkd: 30 },
                    store_annual: { jpy: 4500, twd: 990, hkd: 230 }
                  };

                  let localPriceStr = '';
                  const lowerLoc = loc.toLowerCase();
                  const priceConfig = basePrices[tier];
                  if (lowerLoc.startsWith('ja')) {
                    const jpyVal = Math.round(priceConfig.jpy * mult);
                    localPriceStr = `${jpyVal.toLocaleString()}円`;
                  } else if (lowerLoc.startsWith('zh-tw') || lowerLoc.includes('tw')) {
                    const twdVal = Math.round(priceConfig.twd * mult);
                    localPriceStr = `NT$${twdVal.toLocaleString()}`;
                  } else if (lowerLoc.startsWith('zh-hk') || lowerLoc.includes('hk')) {
                    const hkdVal = Math.round(priceConfig.hkd * mult);
                    localPriceStr = `HK$${hkdVal.toLocaleString()}`;
                  }
                  
                  const usdFormatted = mult === 0.2 ? `-$${usdVal.toFixed(2)} USD` : `$${usdVal.toFixed(2)} USD`;
                  if (!localPriceStr) return usdFormatted;
                  
                  return mult === 0.2 
                    ? `-${localPriceStr} (${usdFormatted})`
                    : `${localPriceStr} (${usdFormatted})`;
                };

                const targetTierForPrice = (room.tier === 'store' || room.tier === 'store_annual')
                  ? (selectedExtendHours === 8760 ? 'store_annual' : 'store')
                  : room.tier;
                const regularPriceStr = getFormattedLocalPrice(targetTierForPrice, activeLocale, 1);
                const discountStr = getFormattedLocalPrice(targetTierForPrice, activeLocale, 0.2);
                const finalAmtStr = getFormattedLocalPrice(targetTierForPrice, activeLocale, 0.8);

                return (
                  <div className="flex flex-col gap-5 text-left">
                    <div className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                      {extendPayDesc}
                    </div>

                  {/* Promo Code Input Form */}
                  <div className="bg-black/30 border border-white/5 rounded-xl p-3 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                        {activeLocale === 'ko' ? '프로모션 코드' : 'Promo Code'}
                      </span>
                      {verifiedCoupon && (
                        <span className="text-[9px] text-emerald-400 font-extrabold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          {verifiedCoupon.code} {verifiedCoupon.discount_pct}% 할인 적용됨
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoCodeInput}
                        onChange={(e) => setPromoCodeInput(e.target.value)}
                        placeholder={activeLocale === 'ko' ? '예: WELCOME20' : 'e.g. WELCOME20'}
                        disabled={isVerifyingCoupon || verifiedCoupon}
                        className="flex-1 bg-[#0B0B0F] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono uppercase"
                      />
                      <button
                        type="button"
                        onClick={handleApplyPromoCode}
                        disabled={isVerifyingCoupon || verifiedCoupon || !promoCodeInput.trim()}
                        className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-40 disabled:hover:bg-zinc-800"
                      >
                        {isVerifyingCoupon ? '...' : activeLocale === 'ko' ? '적용' : 'Apply'}
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-[10px] text-red-400 font-bold mt-0.5">{couponError}</p>
                    )}
                    {verifiedCoupon && (
                      <button
                        type="button"
                        onClick={() => {
                          setVerifiedCoupon(null);
                          setPromoCodeInput('');
                          setCouponError(null);
                        }}
                        className="text-[9px] text-zinc-500 hover:text-zinc-300 font-semibold self-start underline cursor-pointer"
                      >
                        {activeLocale === 'ko' ? '코드 취소하기' : 'Remove promo code'}
                      </button>
                    )}
                  </div>

                  <div className="bg-black/40 border border-white/5 rounded-2xl p-5 flex flex-col gap-3.5">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{simulatorTitle}</span>
                    
                    <div className="flex justify-between items-center text-xs sm:text-sm border-b border-white/5 pb-2.5">
                      <span className="text-zinc-400">{productLabel}</span>
                      <span className="text-white font-extrabold">{productVal}</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs sm:text-sm border-b border-white/5 pb-2.5">
                      <span className="text-zinc-400">{originalPriceLabel}</span>
                      <span className="text-zinc-500 line-through font-mono">
                        {regularPriceStr}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs sm:text-sm border-b border-white/5 pb-2.5">
                      <span className="text-zinc-400">{discountLabel}</span>
                      <span className="text-red-400 font-bold">
                        {discountStr}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs sm:text-sm">
                      <span className="text-zinc-400">{finalAmtLabel}</span>
                      <div className="flex flex-col items-end">
                        {verifiedCoupon ? (
                          <>
                            <span className="text-zinc-500 text-[10px] line-through font-mono">
                              {finalAmtStr}
                            </span>
                            <span className="text-emerald-400 font-extrabold text-sm font-mono animate-pulse">
                              {(() => {
                                const config = TIER_CONFIGS[targetTierForPrice];
                                if (!config) return '';
                                const baseExt = Math.round(config.priceKrw * 0.8);
                                const discounted = Math.round(baseExt * (1 - verifiedCoupon.discount_pct / 100));
                                if (activeLocale === 'ko') {
                                  return `${discounted.toLocaleString()}원`;
                                } else {
                                  const usdBase = config.priceUsd * 0.8;
                                  const discountedUsd = usdBase * (1 - verifiedCoupon.discount_pct / 100);
                                  return `$${discountedUsd.toFixed(1)} USD`;
                                }
                              })()}
                            </span>
                          </>
                        ) : (
                          <span className="text-indigo-300 font-black font-mono">
                            {finalAmtStr}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                    {/* 환불 취소 불가 고지 */}
                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-xs text-red-400 leading-relaxed">
                      <span className="font-extrabold block mb-1">{refundWarningTitle}</span>
                      {refundWarningBody}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setExtendStep('info')}
                        disabled={isExtending}
                        className="flex-1 py-4 rounded-2xl bg-white/5 text-zinc-400 font-bold hover:bg-white/10 hover:text-white transition-all text-sm cursor-pointer disabled:opacity-50 border border-white/5"
                      >
                        {previousStepLabel}
                      </button>
                      
                      <button
                        onClick={handleExtendRoom}
                        disabled={isExtending}
                        className="flex-1 py-4 rounded-2xl bg-white text-black font-extrabold text-sm hover:bg-zinc-200 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-lg"
                      >
                        {isExtending ? (
                          <span>{approvingLabel}</span>
                        ) : (
                          <span>{completePaymentLabel}</span>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })()}

              {extendStep === 'success' && (() => {
                const successTitle = {
                  ko: '시간 연장 완료',
                  en: 'Extension Complete',
                  ja: '時間延長完了',
                  es: 'Extensión Completada',
                  'zh-TW': '時間延長完成',
                  'zh-HK': '時間延長完成',
                }[activeLocale] || '시간 연장 완료';

                const successDesc = {
                  ko: <>방 시간이 성공적으로 <strong className="text-white">24시간 연장</strong>되었습니다.<br />관람객 접속용 링크 및 QR 코드는 변함 없이 기존 것 그대로 정상 가동됩니다.</>,
                  en: <>The session has been successfully extended by <strong className="text-white">24 hours</strong>.<br />The existing entry links and QR codes remain fully functional.</>,
                  ja: <>ルームの有効期限が <strong className="text-white">24時間延長</strong> されました。<br />観客のアクセス用リンクやQRコードは変更なく、そのままご利用いただけます。</>,
                  es: <>La sala se ha extendido con éxito por <strong className="text-white">24 horas</strong>.<br />Los enlaces y códigos QR existentes siguen siendo totalmente válidos.</>,
                  'zh-TW': <>房間有效時間已成功延長 <strong className="text-white">24 小時</strong>。<br />觀眾入場用連結與 QR Code 均維持不變。</>,
                  'zh-HK': <>房間有效時間已成功延長 <strong className="text-white">24 小時</strong>。<br />觀眾入場用連結與 QR Code 均維持不變。</>,
                }[activeLocale] || <>방 시간이 성공적으로 <strong className="text-white">24시간 연장</strong>되었습니다.<br />관람객 접속용 링크 및 QR 코드는 변함 없이 기존 것 그대로 정상 가동됩니다.</>;

                return (
                  <div className="flex flex-col items-center text-center gap-5 py-4">
                    <span className="text-xs font-black text-emerald-400 uppercase tracking-widest px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      Success
                    </span>
                    
                    <h4 className="text-lg sm:text-xl font-black text-white">{successTitle}</h4>
                    
                    <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-sm">
                      {successDesc}
                    </p>

                    <button
                      onClick={() => {
                        setIsExtendModalOpen(false);
                        setExtendStep('info');
                      }}
                      className="w-full py-4 mt-2 rounded-2xl bg-white text-black font-extrabold text-sm hover:bg-zinc-200 transition-all cursor-pointer shadow-lg"
                    >
                      {t('back_to_dashboard', activeLocale)}
                    </button>
                  </div>
                );
              })()}

            </div>
          </div>
        );
      })()}

      {/* 14. Passcode Settings Modal Dialog */}
      {isPasscodeDrawerOpen && room && (() => {
        const passcodeModalTitle = {
          ko: '방 비밀번호 설정 (Security Passcode)',
          en: 'Room Passcode Settings (Security Passcode)',
          ja: 'ルームパスコード設定 (Security Passcode)',
          es: 'Contraseña de la Sala (Security Passcode)',
          'zh-TW': '房間密碼設定 (Security Passcode)',
          'zh-HK': '房間密碼設定 (Security Passcode)',
        }[activeLocale] || '방 비밀번호 설정 (Security Passcode)';

        const passcodeDesc = {
          ko: '방에 비밀번호를 설정하여 허가되지 않은 사용자의 무단 입장을 방지할 수 있습니다. 4~6자리의 숫자로 입력하세요.',
          en: 'Set a passcode for your room to prevent unauthorized access. Enter 4 to 6 digits.',
          ja: 'パスコードを設定することで、第三者の無断入場を防ぐことができます。4〜6桁の数字を入力してください。',
          es: 'Configura una contraseña para evitar accesos no autorizados. Ingresa de 4 a 6 dígitos.',
          'zh-TW': '設定房間密碼可防止未授權的用戶進入。請輸入 4 到 6 位數字。',
          'zh-HK': '設定房間密碼可防止未授權的用戶進入。請輸入 4 到 6 位數字。',
        }[activeLocale] || '방에 비밀번호를 설정하여 허가되지 않은 사용자의 무단 입장을 방지할 수 있습니다. 4~6자리의 숫자로 입력하세요.';

        const passcodeLabel = {
          ko: '입장 비밀번호',
          en: 'Entrance Passcode',
          ja: '入場パスコード',
          es: 'Contraseña de Acceso',
          'zh-TW': '入場密碼',
          'zh-HK': '入場密碼',
        }[activeLocale] || '입장 비밀번호';

        const passcodePlaceholder = {
          ko: '비밀번호 없이 즉시 입장하려면 비워두세요',
          en: 'Leave empty to allow entry without password',
          ja: 'パスコードなしで入場する場合は空欄にしてください',
          es: 'Deja vacío para entrar sin contraseña',
          'zh-TW': '若不設密碼直接入場請留空',
          'zh-HK': '若不設密碼直接入場請留空',
        }[activeLocale] || '비밀번호 없이 즉시 입장하려면 비워두세요';

        const removePasscodeLabel = {
          ko: '비밀번호 해제',
          en: 'Remove Passcode',
          ja: 'パスコード解除',
          es: 'Eliminar Contraseña',
          'zh-TW': '解除密碼',
          'zh-HK': '解除密碼',
        }[activeLocale] || '비밀번호 해제';

        const validationError = {
          ko: t('err_passcode_length', activeLocale) || '비밀번호는 4~6자리의 숫자여야 합니다.',
          en: 'Passcode must be a 4 to 6 digit number.',
          ja: 'パスコードは4〜6桁の数字である必要があります。',
          es: 'La contraseña debe ser un número de 4 a 6 dígitos.',
          'zh-TW': '密碼必須為 4 到 6 位數字。',
          'zh-HK': '密碼必須為 4 到 6 位數字。',
        }[activeLocale] || t('err_passcode_length', activeLocale) || '비밀번호는 4~6자리의 숫자여야 합니다.';

        const saveLabel = {
          ko: isPasscodeUpdating ? '저장 중...' : '저장 완료',
          en: isPasscodeUpdating ? 'Saving...' : 'Save',
          ja: isPasscodeUpdating ? '保存中...' : '保存',
          es: isPasscodeUpdating ? 'Guardando...' : 'Guardar',
          'zh-TW': isPasscodeUpdating ? '儲存中...' : '儲存',
          'zh-HK': isPasscodeUpdating ? '儲存中...' : '儲存',
        }[activeLocale] || (isPasscodeUpdating ? '저장 중...' : '저장 완료');

        return (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-effect border border-white/10 rounded-3xl w-full max-w-md p-7 relative z-10 animate-in fade-in zoom-in-95 duration-150 text-left flex flex-col gap-6 text-white bg-[#12121a]">
              {/* Header */}
              <div className="flex justify-between items-center pb-4 border-b border-white/10">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  {passcodeModalTitle}
                </h3>
                {!isPasscodeUpdating && (
                  <button
                    type="button"
                    onClick={() => setIsPasscodeDrawerOpen(false)}
                    className="text-zinc-400 hover:text-white px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-xs font-bold hover:bg-white/5"
                  >
                    {t('close', activeLocale)}
                  </button>
                )}
              </div>

              {/* Form */}
              <div className="flex flex-col gap-4 text-left">
                <div className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  {passcodeDesc}
                </div>

                <div className="bg-black/30 border border-white/5 rounded-2xl p-4 flex flex-col gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">{passcodeLabel}</label>
                    <input
                      type="text"
                      value={passcodeVal}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        if (val.length <= 6) {
                          setPasscodeVal(val);
                        }
                      }}
                      placeholder={passcodePlaceholder}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-center text-white tracking-widest text-sm font-black focus:outline-none focus:border-indigo-500 uppercase font-mono"
                      maxLength={6}
                      disabled={isPasscodeUpdating}
                    />
                  </div>
                  {passcodeUpdateError && (
                    <p className="text-xs text-red-400 font-bold">{passcodeUpdateError}</p>
                  )}
                </div>

                <div className="flex gap-3 mt-2">
                  {room.passcode && (
                    <button
                      type="button"
                      onClick={() => handleUpdatePasscode('')}
                      disabled={isPasscodeUpdating}
                      className="flex-1 py-4 rounded-2xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all font-extrabold text-sm border border-red-500/20 disabled:opacity-50"
                    >
                      {removePasscodeLabel}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (passcodeVal && (passcodeVal.length < 4 || passcodeVal.length > 6)) {
                        setPasscodeUpdateError(validationError);
                        return;
                      }
                      handleUpdatePasscode(passcodeVal);
                    }}
                    disabled={isPasscodeUpdating}
                    className="flex-1 py-4 rounded-2xl bg-white text-black hover:bg-zinc-200 transition-all font-extrabold text-sm disabled:opacity-50"
                  >
                    {saveLabel}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Vault (보관 & 공유) Modal */}
      {isVaultOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#12121a] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>{t('vault_share', activeLocale)}</span>
              </h3>
              <button 
                onClick={() => {
                  stopScanning();
                  setIsVaultOpen(false);
                }}
                className="p-1 text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-white/5 bg-black/20">
              <button
                type="button"
                onClick={() => {
                  stopScanning();
                  setVaultTab('slots');
                }}
                className={`flex-1 py-3 text-xs font-bold transition-all cursor-pointer ${
                  vaultTab === 'slots' 
                    ? 'text-white border-b-2 border-white bg-white/[0.02]' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {{
                  ko: '내 기기에 보관',
                  en: 'Save on Device',
                  ja: '端末に保存',
                  es: 'Guardar en Dispositivo',
                  'zh-TW': '儲存至本機',
                  'zh-HK': '儲存至本機',
                }[activeLocale] || '내 기기에 보관'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setVaultTab('share');
                }}
                className={`flex-1 py-3 text-xs font-bold transition-all cursor-pointer ${
                  vaultTab === 'share' 
                    ? 'text-white border-b-2 border-white bg-white/[0.02]' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {t('wireless_transfer', activeLocale)}
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {vaultTab === 'slots' ? (
                <div className="space-y-6">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">{t('save_current_theme', activeLocale)}</span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newSlotName}
                        onChange={(e) => setNewSlotName(e.target.value.slice(0, maxTextLength))}
                        placeholder={t('enter_theme_name', activeLocale)}
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-white/40 focus:bg-black/50 text-sm font-semibold transition-colors"
                        maxLength={maxTextLength}
                      />
                      <button
                        type="button"
                        onClick={handleSaveSlotPackage}
                        className="px-4 py-2.5 bg-white hover:bg-zinc-200 text-black rounded-xl text-xs font-bold transition-all cursor-pointer select-none"
                      >
                        {t('save', activeLocale)}
                      </button>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1.5 leading-relaxed">
                      {{
                        ko: '💡 현재 원터치 연출 보드에 있는 프리셋들이 이 브라우저의 보관함에 슬롯으로 안전하게 저장됩니다.',
                        en: "💡 Presets currently on the Quick Preset Board will be safely saved as a slot in this browser's local cache.",
                        ja: '💡 クイック演出ボードにある現在のプリセットが、ブラウザの保管庫にスロットとして安全に保存されます。',
                        es: '💡 Los ajustes del Tablero de Efectos se guardarán de forma segura en las ranuras de almacenamiento de este navegador.',
                        'zh-TW': '💡 單鍵快速演出板上的演出設定將會安全地儲存至瀏覽器快取的主題格中。',
                        'zh-HK': '💡 單擊快速演出板上的演出設定將會安全地儲存至瀏覽器快取的主題格中。',
                      }[activeLocale] || '💡 현재 원터치 연출 보드에 있는 프리셋들이 이 브라우저의 보관함에 슬롯으로 안전하게 저장됩니다.'}
                    </p>
                  </div>

                  <div className="border-t border-white/5 pt-4">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-3">{t('saved_theme_slots', activeLocale)}</span>
                    {savedSlots.length === 0 ? (
                      <div className="text-center py-8 border border-dashed border-white/5 rounded-2xl bg-black/10">
                        <p className="text-xs text-zinc-500 font-bold">{t('no_saved_slots', activeLocale)}</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                        {savedSlots.map((slot, index) => {
                          const presetsCountStr = {
                            ko: `${slot.presets.length}개의 프리셋`,
                            en: `${slot.presets.length} presets`,
                            ja: `${slot.presets.length}個のプリセット`,
                            es: `${slot.presets.length} presets`,
                            'zh-TW': `${slot.presets.length} 個預設卡片`,
                            'zh-HK': `${slot.presets.length} 個預設卡片`,
                          }[activeLocale] || `${slot.presets.length}개의 프리셋`;
                          return (
                            <div 
                              key={index}
                              onClick={() => handleLoadSlotPackage(index)}
                              className="group flex items-center justify-between p-3.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all cursor-pointer"
                            >
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-bold text-white truncate">{slot.name}</span>
                                <span className="text-[9px] text-zinc-400 font-bold mt-0.5">{presetsCountStr}</span>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteSlotPackage(index, e)}
                                className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-all cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Integration of Backup warnings & Reset */}
                  <div className="pt-6 border-t border-white/5 space-y-6">
                    <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl text-left flex items-start gap-3">
                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b] mt-1.5" />
                      <div className="flex-1">
                        <span className="text-xs text-zinc-300 font-bold block mb-1">{t('browser_cache_warning_title', activeLocale)}</span>
                        <span className="text-xs text-zinc-400 leading-relaxed block">
                          {t('browser_cache_warning_desc', activeLocale)}
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
              ) : (
                <div className="space-y-6">
                  {/* Share mode selector (Send or Receive) */}
                  <div className="grid grid-cols-2 gap-2 bg-black/20 p-1.5 rounded-xl border border-white/5">
                    <button
                      type="button"
                      onClick={() => {
                        stopScanning();
                        setShareMode('send');
                      }}
                      className={`py-2 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        shareMode === 'send' 
                          ? 'bg-white text-black shadow-md' 
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {t('send_export', activeLocale)}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShareMode('receive');
                      }}
                      className={`py-2 text-center text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        shareMode === 'receive' 
                          ? 'bg-white text-black shadow-md' 
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {t('import', activeLocale)}
                    </button>
                  </div>

                  {shareMode === 'send' ? (
                    <div className="space-y-5 flex flex-col items-center">
                      <div className="text-center">
                        <p className="text-xs font-bold text-zinc-300">{t('wireless_transfer_desc', activeLocale)}</p>
                        <p className="text-[10px] text-zinc-500 mt-1 font-bold">{t('share_code_valid_desc', activeLocale)}</p>
                      </div>

                      {exportCode ? (
                        <div className="space-y-5 w-full flex flex-col items-center">
                          {/* 6 Digit Code Display */}
                          <div className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-center relative group">
                            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">{t('wireless_share_code', activeLocale)}</span>
                            <span className="text-3xl font-mono font-black text-white bg-white/[0.03] rounded-xl px-4 py-2 border border-white/5 inline-block select-all tracking-wider">{exportCode}</span>
                            <button
                              type="button"
                              onClick={handleCopyShareCodeText}
                              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/5 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-all cursor-pointer"
                              title="코드 복사"
                            >
                              {isCodeCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                            </button>
                          </div>

                          {/* QR Code */}
                          {shareQrUrl && (
                            <div className="bg-white p-4 rounded-2xl flex items-center justify-center shadow-lg">
                              <img src={shareQrUrl} alt="Preset Share QR Code" className="w-40 h-40" />
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleGenerateShareCode}
                          disabled={isSharingLoading}
                          className="w-full py-3.5 bg-white hover:bg-zinc-200 text-black rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50 cursor-pointer animate-pulse"
                        >
                          {isSharingLoading ? t('generating_code', activeLocale) : t('generate_share_code', activeLocale)}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">{t('import_with_code', activeLocale)}</span>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={shareCodeInput}
                            onChange={(e) => setShareCodeInput(e.target.value.slice(0, 6))}
                            placeholder={t('enter_6digit_code', activeLocale)}
                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white uppercase focus:outline-none focus:border-white/40 focus:bg-black/50 text-sm font-semibold tracking-wider font-mono transition-colors"
                            maxLength={6}
                          />
                          <button
                            type="button"
                            onClick={handleImportShareCode}
                            disabled={isSharingLoading}
                            className="px-4 py-2.5 bg-white hover:bg-zinc-200 text-black rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                          >
                            {t('load', activeLocale)}
                          </button>
                        </div>
                      </div>

                      {/* QR Scan Area */}
                      <div className="border-t border-white/5 pt-4 space-y-4">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">{t('import_with_qr', activeLocale)}</span>
                        {isScanning ? (
                          <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-white/10 bg-black flex items-center justify-center">
                            <video ref={scannerVideoRef} className="absolute inset-0 w-full h-full object-cover" />
                            <canvas ref={scannerCanvasRef} className="hidden" />
                            <div className="absolute inset-0 border-2 border-white/50 m-8 rounded-xl pointer-events-none animate-pulse flex items-center justify-center">
                              <div className="w-full h-0.5 bg-white shadow-[0_0_10px_#ffffff]" style={{ animation: 'scanner-sweep 2s linear infinite' }} />
                            </div>
                            <button
                              type="button"
                              onClick={stopScanning}
                              className="absolute bottom-4 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
                            >
                              {t('stop_scan', activeLocale)}
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={startScanning}
                            className="w-full py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <span>{t('scan_qr_camera', activeLocale)}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Standalone Fullscreen View Overlay */}
      {isStandaloneFullscreen && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center animate-in fade-in duration-200">
          <HostFullscreenSignboard 
            preset={currentBroadcastPreset} 
            onClose={() => setIsStandaloneFullscreen(false)} 
            activeLocale={activeLocale}
          />
        </div>
      )}

      {/* Custom Alert Modal */}
      {customAlert?.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setCustomAlert(null)} />
          <div className="glass-effect rounded-2xl w-full max-w-sm p-6 relative z-10 animate-in fade-in zoom-in-95 duration-150 border border-white/10 bg-[#12121a] text-center">
            <h3 className="text-sm font-bold text-white mb-2">
              {customAlert.title || (activeLocale === 'ko' ? '알림' : 'Notification')}
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed mb-6 whitespace-pre-line">
              {customAlert.message}
            </p>
            <button
              onClick={() => setCustomAlert(null)}
              className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition-colors"
            >
              {activeLocale === 'ko' ? '확인' : 'OK'}
            </button>
          </div>
        </div>
      )}

      {/* Custom Confirm Modal */}
      {customConfirm?.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setCustomConfirm(null)} />
          <div className="glass-effect rounded-2xl w-full max-w-sm p-6 relative z-10 animate-in fade-in zoom-in-95 duration-150 border border-white/10 bg-[#12121a] text-center">
            <h3 className="text-sm font-bold text-white mb-2">
              {customConfirm.title || (activeLocale === 'ko' ? '확인' : 'Confirm')}
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed mb-6 whitespace-pre-line">
              {customConfirm.message}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCustomConfirm(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white font-bold text-xs transition-colors"
              >
                {activeLocale === 'ko' ? '취소' : 'Cancel'}
              </button>
              <button
                onClick={() => {
                  customConfirm.onConfirm();
                  setCustomConfirm(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition-colors"
              >
                {activeLocale === 'ko' ? '확인' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 12. Host Standalone Fullscreen Signboard Component
function HostFullscreenSignboard({ preset, onClose, activeLocale }: { preset: Preset; onClose: () => void; activeLocale: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const wakeLockRef = useRef<any>(null);

  // Countdown logic if preset effect is countdown
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
      ? {
          ko: '추첨 대기 중',
          en: 'Waiting for draw...',
          ja: '抽選待機中',
          es: 'Esperando sorteo...',
          'zh-TW': '等待抽獎中',
          'zh-HK': '等待抽獎中',
        }[activeLocale] || '추첨 대기 중'
      : (preset.text || '');

  const [isForcedLandscape, setIsForcedLandscape] = useState(false);

  // Use dynamic fitting hook to sync text sizes proportional to viewport container dimensions
  const { containerRef, fontSize } = useFitText(
    displayText,
    preset.effect || 'none',
    preset.font_size || 100,
    isForcedLandscape
  );

  // Exiting triggers
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
        if (wakeLockRef.current) {
          console.log('[HostWakeLock] Already active, skipping request');
          return;
        }
        const lock = await (navigator as any).wakeLock.request('screen');
        lock.addEventListener('release', () => {
          console.log('[HostWakeLock] Released by browser/system');
          wakeLockRef.current = null;
        });
        wakeLockRef.current = lock;
        console.log('[HostWakeLock] Screen Wake Lock is active');
      } catch (err: any) {
        console.warn(`[HostWakeLock] Failed to lock screen sleep: ${err.message}`);
      }
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        console.log('[HostWakeLock] Screen Wake Lock released');
      } catch (err: any) {
        console.error(err);
      }
    }
  };

  // Start sleep-prevention looping video immediately since this is triggered by user gesture click
  useEffect(() => {
    requestWakeLock();
    if (videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.warn('[WakeLock] Host video sleep prevention loop playback blocked:', err);
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

  // Monitor visibility change to re-request Wake Lock
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

  // Special effect particles
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



  // Floating controls visibility auto-hide
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

  const exitBtnText = {
    ko: '닫기 (Exit)',
    en: 'Exit',
    ja: '閉じる (Exit)',
    es: 'Cerrar (Exit)',
    'zh-TW': '關閉 (Exit)',
    'zh-HK': '關閉 (Exit)',
  }[activeLocale] || '닫기 (Exit)';

  const dblClickInstruction = {
    ko: '화면을 더블클릭하거나 ESC 키를 누르면 종료됩니다.',
    en: 'Double-click screen or press ESC to exit.',
    ja: '画面をダブルクリックするか、ESCキーを押すと終了します。',
    es: 'Haz doble clic en la pantalla o presiona ESC para salir.',
    'zh-TW': '按兩下畫面或按 ESC 鍵即可退出。',
    'zh-HK': '雙擊畫面或按 ESC 鍵即可退出。',
  }[activeLocale] || '화면을 더블클릭하거나 ESC 키를 누르면 종료됩니다.';

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

      {/* Floating Exit buttons overlay */}
      <div className={`absolute top-[calc(env(safe-area-inset-top,0px)+20px)] left-6 z-40 transition-opacity duration-300 flex items-center gap-2 ${showExitBtn ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <button
          onClick={onClose}
          className="py-2.5 px-5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 text-white font-bold text-xs tracking-wider flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 transition-all"
        >
          <span>{exitBtnText}</span>
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
        {dblClickInstruction}
      </div>

      {/* Invisible silent video loop to force-keep iOS devices awake */}
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
