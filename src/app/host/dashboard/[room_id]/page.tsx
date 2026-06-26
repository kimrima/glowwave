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
  Maximize2
} from 'lucide-react';
import { Preset, Room, SignalPayload, EffectType, TierType, TIER_CONFIGS } from '@/lib/types';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import jsQR from 'jsqr';
import LandscapePhoneMockup from '@/components/LandscapePhoneMockup';
import { TEMPLATE_CATEGORIES } from '@/lib/templates';
import useFitText from '@/hooks/useFitText';

const defaults: Preset[] = [
  { bg_color: '#0B0B0F', text: '단색', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thin', font_size: 100 },
  { bg_color: '#3B82F6', text: '부드러운 깜빡이', text_color: '#FFFFFF', effect: 'blink', speed: 1527, font_family: 'sans-thin', font_size: 100 },
  { bg_color: '#FFFFFF', text: '사이키', text_color: '#EF4444', effect: 'blink', speed: 1527, bg_color_secondary: '#0B0B0F', font_family: 'sans-thin', font_size: 100 },
  { bg_color: '#0B0B0F', text: '당첨!', text_color: '#FFD700', effect: 'luckydraw_wait', speed: 1527, bg_color_secondary: '#FFD700', result_text: '아쉽네요! 다음 기회에..', font_family: 'sans-thin', font_size: 100, lucky_draw_count: 1 },
  { bg_color: '#F97316', text: '스크롤', text_color: '#FFFFFF', effect: 'marquee', speed: 30061, font_family: 'sans-thin', font_size: 100 },
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
  
  // Upgrade Plan Modal States
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeStep, setUpgradeStep] = useState<'select' | 'payment' | 'success'>('select');
  const [selectedUpgradeTier, setSelectedUpgradeTier] = useState<TierType | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Time Extension Modal States
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [extendStep, setExtendStep] = useState<'info' | 'payment' | 'success'>('info');
  const [isExtending, setIsExtending] = useState(false);

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

  const handleFontSelect = (fontVal: 'sans-thin' | 'sans-thick' | 'serif' | 'neon' | 'pixel' | 'plump', isEdit: boolean) => {
    const isPremium = fontVal === 'neon' || fontVal === 'pixel' || fontVal === 'plump';
    if (isPremium && room?.tier === 'free') {
      if (confirm('이 글꼴은 유료 요금제(Lite 이상) 전용입니다. 요금제를 업그레이드하시겠습니까?')) {
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

  // Accidental Navigation Warning & Expiration Countdown Timer
  useEffect(() => {
    // 1. Native beforeunload handler to intercept page refresh or tab close
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ''; // Standard browser dialog prompt
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // 2. Room expiration ticker (6-hour for free, 24-hour for paid)
    if (!room?.created_at) return;
    const calculateTime = () => {
      const createdTime = new Date(room.created_at).getTime();
      const limitMs = room.tier === 'free' ? 6 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
      const expireTime = createdTime + limitMs;
      const now = Date.now();
      const diff = expireTime - now;

      if (diff <= 0) {
        setTimeRemaining('만료됨');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(`${hours}시간 ${minutes}분 ${seconds}초`);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(interval);
    };
  }, [room?.created_at]);

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
      const localTokenKey = `glowwave_token_${roomId}`;
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
        let errorMsg = '이 방의 생성 세션 정보가 브라우저에 없습니다. 결제하셨던 이메일을 통한 [구매 내역 복구] 기능을 사용해 권한을 획득하십시오.';
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
          }
          setAuthErrorMessage(errorMsg);
          setIsAuthorized(false);
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
            loadedPresets = [...defaults];
          }
        } else {
          loadedPresets = [...defaults];
        }
      }

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
          // Migrate index 0: '앰비언트' -> '단색'
          if (idx === 0 && p.text === '앰비언트') {
            p.text = '단색';
            changed = true;
          }

          // Migrate index 1: '사이키' -> '부드러운 깜빡이' (single-color fading blink)
          if (idx === 1 && (p.text === '사이키' || p.text === '부드러운 깜빡이')) {
            let needsUpdate = false;
            if (p.text !== '부드러운 깜빡이') {
              p.text = '부드러운 깜빡이';
              needsUpdate = true;
            }
            if (p.bg_color_secondary !== undefined && p.bg_color_secondary !== null) {
              delete p.bg_color_secondary;
              needsUpdate = true;
            }
            if (p.bg_color !== '#3B82F6') {
              p.bg_color = '#3B82F6'; // New default blue color
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

          // Migrate index 2: to '사이키' white/black flash
          if (idx === 2 && ((p.effect as string) === 'gradient' || p.text.includes('그라데이션') || p.text.includes('경찰') || p.text === '사이키')) {
            p.bg_color = '#FFFFFF';
            p.text = '사이키';
            p.text_color = '#EF4444';
            p.effect = 'blink';
            p.speed = 1527;
            p.bg_color_secondary = '#0B0B0F';
            p.font_size = 100;
            changed = true;
          }

          // Migrate index 3: If it was the old default '카운트다운' or equalizer/raffle, change to new default '당첨!' (Lucky draw wait)
          if (idx === 3 && (p.text === '카운트다운' || p.text === '당첨!' || (p.effect as string) === 'equalizer' || p.text.includes('사운드') || p.text.includes('이퀄라이저') || p.text.includes('당첨'))) {
            let needsUpdate = false;
            if (p.text !== '당첨!') {
              p.text = '당첨!';
              needsUpdate = true;
            }
            if (p.effect !== 'luckydraw_wait') {
              p.effect = 'luckydraw_wait';
              p.bg_color = '#0B0B0F';
              p.text_color = '#FFD700';
              p.speed = 1000;
              p.bg_color_secondary = '#FFD700';
              p.result_text = '아쉽네요! 다음 기회에..';
              p.font_size = 100;
              needsUpdate = true;
            }
            if (needsUpdate) changed = true;
          }

          // Migrate index 5: If it was the old default '당첨!' (or old equalizer), change to new default '카운트다운'
          if (idx === 5 && (p.text === '당첨!' || p.text === '카운트다운' || (p.effect as string) === 'equalizer' || p.text.includes('사운드') || p.text.includes('이퀄라이저'))) {
            let needsUpdate = false;
            if (p.text !== '카운트다운') {
              p.text = '카운트다운';
              needsUpdate = true;
            }
            if (p.effect !== 'countdown') {
              p.effect = 'countdown';
              p.bg_color = '#8B5CF6';
              p.text_color = '#FFFFFF';
              p.speed = 1000;
              p.countdown_seconds = 5;
              p.result_text = 'START';
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

      // Connect Real-time Engine
      connectRealtime(roomId);

    } catch (err) {
      console.error('Failed to init dashboard:', err);
      setAuthErrorMessage('네트워크 연결이 일시적으로 원활하지 않습니다. 인터넷 연결을 확인해 주세요.');
      setIsNetworkError(true);
      setLoading(false);
    }
  }, [roomId, token, connectRealtime]);

  // 4. Initial Trigger Hook
  useEffect(() => {
    initDashboard();

    return () => {
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
    const currentOrder = TIER_ORDER[currentTier] ?? 0;
    return Object.keys(TIER_CONFIGS).filter(
      (key) => TIER_ORDER[key] > currentOrder && key !== 'max'
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
          host_session_token: token
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
      alert(`오류: ${err.message}`);
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
          new_tier: selectedUpgradeTier
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
      alert(`오류: ${err.message}`);
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
        setCustomResultText('아쉽네요! 다음 기회에..');
      } else {
        setCustomResultText('START');
      }
    }
  };

  // Slots Vault Handlers for Host
  const handleSaveSlotPackage = () => {
    const name = newSlotName.trim() || `저장된 테마 #${savedSlots.length + 1}`;
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
        alert('무료 요금제 방은 최대 6개의 프리셋만 가질 수 있습니다. 슬롯에서 상위 6개 프리셋만 불러왔습니다.');
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
    if (confirm('이 테마 보관 슬롯을 삭제하시겠습니까?')) {
      const updated = savedSlots.filter((_, idx) => idx !== index);
      setSavedSlots(updated);
      localStorage.setItem('glowwave_host_slots', JSON.stringify(updated));
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
        let presetsToImport = data.presets;
        if (room?.tier === 'free' && presetsToImport.length > 6) {
          alert('무료 요금제 방은 최대 6개의 프리셋만 가질 수 있습니다. 공유받은 팩에서 상위 6개 프리셋만 가져왔습니다.');
          presetsToImport = presetsToImport.slice(0, 6);
        }
        
        setPresets(presetsToImport);
        localStorage.setItem(`glowwave_presets_${roomId}`, JSON.stringify(presetsToImport));
        setCurrentBroadcastPreset(presetsToImport[0]);
        applyPresetToController(presetsToImport[0]);
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
                alert('무료 요금제 방은 최대 6개의 프리셋만 가질 수 있습니다. 공유받은 팩에서 상위 6개 프리셋만 가져왔습니다.');
                presetsToImport = presetsToImport.slice(0, 6);
              }
              setPresets(presetsToImport);
              localStorage.setItem(`glowwave_presets_${roomId}`, JSON.stringify(presetsToImport));
              setCurrentBroadcastPreset(presetsToImport[0]);
              applyPresetToController(presetsToImport[0]);
              setActivePresetIndex(0);
              setIsVaultOpen(false);
              setShareCodeInput('');
              alert('공유받은 프리셋을 정상적으로 동기화했습니다! 🎉');
            }
          })
          .catch(err => {
            console.error(err);
            alert('가져오기에 실패했습니다. 만료된 코드이거나 네트워크 오류입니다.');
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
        alert(`전송 오류: ${err.message}`);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0B0F] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
          <p className="text-sm text-zinc-400 font-medium">대시보드 세션 검증 중...</p>
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
          <h2 className="text-xl font-bold text-white mb-2">서버 연결 일시 지연</h2>
          <p className="text-sm text-zinc-400 mb-6 whitespace-pre-line font-medium leading-relaxed">
            {authErrorMessage || "인터넷 연결이 불안정하거나 서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요."}
          </p>
          <div className="flex flex-col gap-2 w-full">
            <button
              onClick={() => initDashboard()}
              className="py-3 px-4 rounded-xl bg-white text-black font-extrabold text-sm hover:bg-zinc-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
            >
              다시 연결 시도 ⚡
            </button>
            <Link href="/" className="text-sm text-zinc-400 hover:text-white py-2 font-semibold">
              메인 홈으로 가기
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
          <h2 className="text-xl font-bold text-white mb-2">권한이 없거나 만료된 방입니다</h2>
          <p className="text-sm text-zinc-400 mb-6 whitespace-pre-line font-medium leading-relaxed">
            {authErrorMessage || "이 방의 활성 세션 정보가 브라우저에 없습니다. 결제하셨던 이메일을 통한 [구매 내역 복구] 기능을 사용해 권한을 획득하십시오."}
          </p>
          <div className="flex flex-col gap-2">
            <Link href="/recovery" className="py-3 px-4 rounded-xl bg-white text-black font-semibold text-sm hover:bg-zinc-200 transition-all flex items-center justify-center">
              구매 내역 복구하기
            </Link>
            <Link href="/" className="text-sm text-zinc-400 hover:text-white py-2 font-semibold">
              메인 홈으로 가기
            </Link>
          </div>
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
      <header className="border-b border-white/5 bg-[#030305]/60 backdrop-blur-md relative z-10 pt-[calc(env(safe-area-inset-top,0px)+12px)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-black text-white tracking-tight font-outfit text-sm uppercase">GlowWave Host Remote</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsVaultOpen(true)}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <span>보관 & 공유</span>
            </button>
            
            <button 
              onClick={() => {
                if (confirm("정말 대시보드(리모컨)에서 나가시겠습니까?\n현재 실시간으로 연출 중인 전광판 송출이 중단되지는 않지만, 대시보드 제어 세션이 닫힙니다.")) {
                  router.push('/');
                }
              }}
              className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              title="나가기"
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
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">방 코드</span>
              <span className="text-xl font-mono font-black text-white select-all">{roomId}</span>
            </div>
            
            <div className="hidden sm:block w-[1px] h-8 bg-white/5" />
            
            <div>
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">실시간 접속자</span>
              <span className="text-xl font-black text-white flex items-baseline gap-1">
                <span>{activeParticipants}</span>
                <span className="text-[10px] text-zinc-500 font-bold">/ {room?.max_participants}명</span>
              </span>
            </div>

            <div className="hidden sm:block w-[1px] h-8 bg-white/5" />

            <div>
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">사용 중인 요금제</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs font-black text-white px-2 py-0.5 rounded-md bg-white/5 uppercase border border-white/5">
                  {room?.tier}
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
                    업그레이드
                  </button>
                )}
              </div>
            </div>

            {room && room.tier !== 'free' && (
              <>
                <div className="hidden sm:block w-[1px] h-8 bg-white/5" />
                <div>
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">방 비밀번호</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-black text-white px-2 py-0.5 rounded-md bg-[#ffffff]/[0.03] border border-white/5 font-mono">
                      {room.passcode ? room.passcode : '설정 없음'}
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
                      설정/변경
                    </button>
                  </div>
                </div>
              </>
            )}

            <div className="hidden sm:block w-[1px] h-8 bg-white/5" />

            <div className="flex items-center gap-3">
              <div>
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">남은 시간</span>
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
                <span>시간 연장</span>
                {(timeRemaining === '만료됨' || timeRemaining.startsWith('0시간') || timeRemaining.startsWith('1시간') || timeRemaining.startsWith('2시간')) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">시스템 연결 상태</span>
            {channelStatus === 'connected' ? (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/30 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-wider backdrop-blur-md shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>연결됨</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-950/30 border border-amber-500/30 text-amber-400 text-xs font-bold tracking-wider backdrop-blur-md shadow-[0_0_15px_rgba(245,158,11,0.15)]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span>연결 중</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex-1 flex flex-col lg:grid lg:grid-cols-12 lg:items-start gap-8 w-full">
        
        {/* Left Column: Quick Preset Board & Custom Broadcast (Combined to avoid grid row misalignment) */}
        <div className="order-1 lg:col-span-8 flex flex-col gap-8 w-full min-w-0">
          
          {/* Quick Triggers Dashboard */}
          <div className="glass-effect rounded-2xl p-4 sm:p-6 bg-[#12121a]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-bold text-white font-outfit">원터치 연출 보드 (Quick Preset Board)</h2>
              </div>
              
              {/* 3 Toggle Controls next to 원터치 연출 보드 */}
              <div className="flex flex-wrap items-center gap-2">
                {/* 1. 카드 미리보기 */}
                <button
                  type="button"
                  onClick={() => setShowMiniPreviews(prev => !prev)}
                  className="flex items-center gap-2 bg-white/[0.02] border border-white/5 hover:border-white/10 px-3 py-1.5 rounded-xl text-[10px] font-bold text-zinc-300 hover:text-white cursor-pointer select-none transition-all"
                >
                  <span>카드 미리보기</span>
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
                  <span>{!isTransmitterLocked ? '원터치 바로송출' : '클릭 시 수정모드'}</span>
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
                  <span>화면 암전</span>
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
              {(activeCategory === 'custom' ? presets : (TEMPLATE_CATEGORIES.find(c => c.id === activeCategory)?.presets || [])).map((preset, index) => {
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
                        if (confirm('이 템플릿은 유료 요금제(Lite 이상) 전용 폰트 또는 특수 효과를 사용하고 있습니다. 요금제를 업그레이드하시겠습니까?')) {
                          setSelectedUpgradeTier(null);
                          setUpgradeStep('select');
                          setIsUpgradeModalOpen(true);
                        }
                        return;
                      }

                      if (isTransmitterLocked) {
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
                          // Import template as a new custom preset in edit drawer
                          setEditingPresetIndex(presets.length);
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
                  <div className="flex items-center gap-1.5">
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-bold">새 연출 추가</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Custom Customizer Input for On-the-fly Triggering */}
          <div className="glass-effect rounded-2xl p-4 sm:p-6 bg-[#12121a]">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-zinc-400" />
                <h2 className="text-sm font-bold text-white">즉석 라이브 메시지 전송 (Custom Broadcast)</h2>
              </div>
              <span className="text-[9px] font-bold font-mono text-zinc-500">LIVE CONTROLLER</span>
            </div>
            
            <div className="flex flex-col gap-5">
              {/* Text Input & Send Button Row (Combined side-by-side) */}
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
                    const calculatedSpeed = getSpeedMs(customEffect, customSpeed);
                    
                    const customPreset: Preset = {
                      bg_color: customBgColor,
                      text: customText.trim() || (customEffect === 'luckydraw_wait' ? '당첨!' : 'GLOW WAVE'),
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
                  송출하기
                </button>
              </div>

              {/* iOS style Segmented Controls Row (Responsive Grid layout - Spaced 2-Row Layout) */}
              <div className="flex flex-col gap-6 pt-5 border-t border-white/5">
                {/* Row 1: Theme, Text Color, Text Size */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* 배경 테마 */}
                  <div className="lg:col-span-4 flex flex-col gap-2">
                    <span className="text-xs md:text-sm font-extrabold text-zinc-400 tracking-wider">배경 테마</span>
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
                          title="커스텀 색상 선택"
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
                          title="커스텀 배경 색상 선택 (PRO)"
                          onClick={() => {
                            if (confirm('커스텀 배경 색상(팔레트)은 유료 요금제(Lite 이상) 전용 기능입니다. 요금제를 업그레이드하시겠습니까?')) {
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
                    <span className="text-xs md:text-sm font-extrabold text-zinc-400 tracking-wider">글자 색상</span>
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
                          title="커스텀 글자 색상 선택"
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
                          title="커스텀 글자 색상 선택 (PRO)"
                          onClick={() => {
                            if (confirm('커스텀 글자 색상(팔레트)은 유료 요금제(Lite 이상) 전용 기능입니다. 요금제를 업그레이드하시겠습니까?')) {
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
                      <span>글자 크기</span>
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
                    <span className="text-xs md:text-sm font-extrabold text-zinc-400 tracking-wider">글꼴 스타일</span>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 bg-black/45 p-1.5 rounded-xl border border-white/5 items-center">
                      {[
                        { val: 'sans-thin', label: '기본고딕', style: { fontFamily: "'Pretendard', -apple-system, sans-serif", fontWeight: 700 } },
                        { val: 'sans-thick', label: '꽉찬고딕', style: { fontFamily: "'GmarketSansBold', sans-serif", fontWeight: 900 } },
                        { val: 'serif', label: '나눔명조', style: { fontFamily: "'Nanum Myeongjo', serif", fontWeight: 700 } },
                        { val: 'neon', label: '스포티', isPremium: true, style: { fontFamily: "'LeeSaManRu-Bold', sans-serif", fontWeight: 900 } },
                        { val: 'pixel', label: '레트로도트', isPremium: true, style: { fontFamily: "'NeoDunggeunmo', sans-serif", fontWeight: 400 } },
                        { val: 'plump', label: '둥글몽글', isPremium: true, style: { fontFamily: "'TmonMonsori', sans-serif", fontWeight: 900 } }
                      ].map((item) => (
                        <button
                          type="button"
                          key={item.val}
                          onClick={() => handleFontSelect(item.val as any, false)}
                          style={item.style}
                          className={`py-2 px-0.5 rounded-lg text-xs md:text-sm transition-all cursor-pointer whitespace-nowrap ${
                            customFontFamily === item.val
                              ? 'bg-white text-black font-extrabold shadow-sm'
                              : 'text-zinc-400 hover:text-white hover:bg-white/[0.02]'
                          }`}
                        >
                          <span className="flex flex-col items-center justify-center gap-0.5">
                            <span>{item.label}</span>
                            {item.isPremium && (
                              <span className="px-1 py-[0.5px] rounded-[3px] text-[7px] font-black tracking-wide uppercase bg-violet-500/20 border border-violet-500/30 text-violet-400">
                                PRO
                              </span>
                            )}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 모션 효과 */}
                  <div className="lg:col-span-6 flex flex-col gap-2">
                    <span className="text-xs md:text-sm font-extrabold text-zinc-400 tracking-wider">모션 효과</span>
                    <div className="grid grid-cols-5 gap-1.5 bg-black/45 p-1.5 rounded-xl border border-white/5 h-12 items-center">
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
                    <span className="text-xs md:text-sm font-extrabold text-zinc-400 tracking-wider">특수 효과</span>
                    <div className="grid grid-cols-4 gap-1.5 bg-black/45 p-1.5 rounded-xl border border-white/5 items-center min-h-12">
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
                              if (confirm('특수 효과는 유료 요금제(Lite 이상) 전용입니다. 요금제를 업그레이드하시겠습니까?')) {
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
                    <span className="text-xs md:text-sm font-extrabold text-zinc-400 tracking-wider">카운트다운 시간</span>
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
                          {sec}초
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-xs md:text-sm font-extrabold text-zinc-400 tracking-wider">종료 시 출력 문구</span>
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
                    <span className="text-xs md:text-sm font-extrabold text-zinc-400 tracking-wider">당첨 시 문구 (즉석 구호 입력란에서 수정)</span>
                    <div className="flex items-center bg-black/30 px-4 rounded-xl border border-white/5 h-12 text-xs md:text-sm text-zinc-400 font-semibold select-none">
                      {customText || '당첨!'} (당첨)
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-xs md:text-sm font-extrabold text-zinc-400 tracking-wider">낙첨 시 출력 문구</span>
                    <input
                      type="text"
                      value={customResultText}
                      onChange={(e) => setCustomResultText(e.target.value.slice(0, 15))}
                      placeholder="아쉽네요! 다음 기회에.."
                      className="w-full bg-black/45 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white text-xs md:text-sm font-semibold h-12"
                      maxLength={15}
                    />
                  </div>
                </div>
              )}

              {/* Speed range slider for custom controller */}
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
            </div>
          </div>
        </div>

        {/* Item 2 & 4: LIVE ON AIR Preview Card & Admission QR (Combined to eliminate grid vertical gaps) */}
        <div className="order-2 lg:col-span-4 flex flex-col gap-6 w-full min-w-0">
          {/* LIVE ON AIR Preview Card */}
          <div className="glass-effect rounded-2xl p-4 sm:p-6 flex flex-col items-center bg-[#12121a]">
            <div className="flex items-center gap-2 mb-2 self-start">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">LIVE ON AIR</h2>
            </div>
            <p className="text-[11px] text-zinc-500 mb-4 self-start">현재 모든 관객 화면에 송출 중인 실시간 연출 화면입니다.</p>
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
                  내 화면에 전체화면으로 띄우기
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsStandaloneFullscreen(true)}
                className="mt-3 w-full py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 active:scale-[0.99] text-white font-bold text-xs tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer border border-white/10 hover:border-white/20 shadow-md"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>내 기기를 전광판으로 사용 (전체화면)</span>
              </button>
            </div>

            {currentBroadcastPreset.effect === 'luckydraw_wait' && (
              <div className="w-full mt-4 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleDrawWinner}
                  className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-black text-xs tracking-wider flex items-center justify-center gap-2 transition-all shadow-xl shadow-amber-500/20 animate-bounce cursor-pointer border border-amber-300"
                >
                  <span>결과 발표 (추첨 완료)</span>
                </button>
                <p className="text-[10px] text-zinc-400 text-center leading-relaxed font-semibold">
                  ⚠️ [결과 발표] 버튼을 누르면 현재 접속해 있는 관객 중 <b>단 1명만</b> 무작위로 당첨자로 선정되어 해당 관객 스마트폰 화면에 당첨 문구가 나타나며, 나머지 관객 화면에는 꽝 문구가 나타납니다.
                </p>
              </div>
            )}
          </div>

          {/* Admission QR Card */}
          <div className="glass-effect rounded-2xl p-4 sm:p-6 flex flex-col items-center text-center bg-[#12121a]">
            <Share2 className="w-6 h-6 text-indigo-400 mb-3" />
            <h2 className="text-lg font-bold text-white mb-1">관객 입장안내 (Admission QR)</h2>
            <p className="text-xs text-zinc-500 mb-6">관객들이 카메라로 스캔하여 즉시 입장할 수 있도록 스크린에 QR을 띄우거나 링크를 복사해 주세요.</p>

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
                title="복사"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex flex-col gap-2 w-full">
              <button
                onClick={copyAudienceUrl}
                className="w-full py-3 rounded-xl border border-white/5 bg-white/5 font-semibold text-white text-xs hover:bg-white/10 transition-all flex items-center justify-center cursor-pointer"
              >
                관객용 URL 링크 복사하기
              </button>
              
              <button
                onClick={() => window.open(`/host/present/${roomId}?token=${token}`, '_blank')}
                className="w-full py-3 rounded-xl bg-indigo-500 font-bold text-white text-xs hover:bg-indigo-600 transition-all flex items-center justify-center cursor-pointer shadow-lg shadow-indigo-500/10"
              >
                새 창으로 관객 안내 스크린 열기
              </button>
              
              <button
                onClick={downloadQrCode}
                className="w-full py-3 rounded-xl border border-white/10 bg-white/10 font-semibold text-white text-xs hover:bg-white/15 transition-all flex items-center justify-center cursor-pointer"
              >
                입장 QR 이미지 다운로드
              </button>
            </div>
          </div>

          {/* Host Guide Card */}
          <div className="glass-effect rounded-2xl p-6 text-xs text-zinc-500 leading-normal flex flex-col gap-2 bg-[#12121a]">
            <div className="font-bold text-zinc-400 mb-1 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5" />
              현장 운영 팁 (Host Guide)
            </div>
            <div>1. 관객 입장 QR 코드를 무대 전광판이나 입구 배너에 크게 확대해서 게시하세요.</div>
            <div>2. 행사 시작 전 관객에게 스마트폰 화면이 꺼지지 않도록 접속 화면을 그대로 켜두라 말씀하세요. W3C Wake Lock API가 작동하고 있어 열려 있는 한 꺼지지 않습니다.</div>
            <div>3. 동시 접속 수가 요금제 한도에 도달하면 신규 접속 관객에게 대기 화면이 표시됩니다.</div>
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
                <span className="text-[10px] font-black font-mono text-indigo-400 uppercase mb-3 tracking-widest">실시간 연출 미리보기 (Floating Sync)</span>
                <LandscapePhoneMockup preset={editingPreset} />
                <div className="mt-3.5 text-[9.5px] text-zinc-400 text-center font-semibold leading-normal">
                  수정창 좌측 빈 공간에 연출 화면이 고정됩니다.<br/>
                  스크롤을 내려도 항상 변경 사항을 실시간으로 확인할 수 있습니다.
                </div>
              </div>
            </div>

            <div className="flex flex-col flex-1 overflow-y-auto">
              
              {/* Header */}
              <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>
                    {editingPresetIndex >= presets.length ? '새 커스텀 프리셋 추가' : `프리셋 P${editingPresetIndex + 1} 편집`}
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
                <span className="text-[10px] font-bold font-mono text-zinc-500 uppercase mb-3 tracking-wider">실시간 연출 미리보기 (Mockup Sync)</span>
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

                    {/* Custom Color Palette Picker for Paid Tiers */}
                    {room?.tier !== 'free' && (
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
                    )}
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

                {/* Secondary Background Color Grid for Duo-Color Flash */}
                {(editingPreset.effect === 'blink' || editingPreset.effect === 'luckydraw_wait' || editingPreset.effect === 'luckydraw') && (
                  <div className="pt-3 border-t border-white/5 animate-in fade-in duration-200">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">보조 배경 색상 (듀오 사이키/당첨 번쩍임/경계선 색상용)</label>
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

                      {/* Custom Color Palette Picker for Paid Tiers (Secondary Color) */}
                      {room?.tier !== 'free' && (
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
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-2.5 leading-relaxed font-medium">
                      💡 <b>단색 (부드러운 깜빡이)</b> 선택 시, 배경색이 서서히 밝아지고 어두워지는 자연스러운 페이드 점멸이 작동합니다. 보조 배경 색상을 지정하면 두 색상이 정밀 교대하며 강력하게 번쩍이는 <b>사이렌(사이키) 효과</b>가 적용됩니다.
                    </p>
                  </div>
                )}

                {/* Speed Slider in Preset Edit Drawer */}
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

                {/* Countdown Options in Preset Edit Drawer */}
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
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">종료 시 출력 문구 (Result Text)</label>
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

                {/* Lucky Draw Options in Preset Edit Drawer */}
                {(editingPreset.effect === 'luckydraw_wait' || editingPreset.effect === 'luckydraw') && (
                  <div className="pt-3 border-t border-white/5 animate-in fade-in duration-200 flex flex-col gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">당첨 시 출력 문구 (Winner Text)</label>
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
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">낙첨 시 출력 문구 (Loser Text)</label>
                      <input
                        type="text"
                        value={editingPreset.result_text || ''}
                        onChange={(e) => setEditingPreset(prev => ({ ...prev!, result_text: e.target.value.slice(0, 15) }))}
                        className="w-full bg-[#0B0B0F] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-white text-xs font-semibold"
                        maxLength={15}
                        placeholder="아쉽네요! 다음 기회에.."
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">당첨 인원 수 (Winners Count)</label>
                      {room?.tier === 'free' ? (
                        <div className="flex items-center gap-2 bg-black/40 border border-white/5 rounded-lg px-4 py-2.5 text-xs text-zinc-500 font-semibold select-none">
                          <Lock className="w-3.5 h-3.5" />
                          <span>1명 (무료 테스트 플랜 고정)</span>
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
                              {num}명
                            </button>
                          ))}
                        </div>
                      )}
                      {room?.tier === 'free' && (
                        <p className="text-[9px] text-zinc-500 mt-1 font-medium">💡 기본형(Lite) 이상의 요금제로 업그레이드하면 최대 10명까지 다중 추첨이 가능합니다.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* 글자 색상 */}
                <div className="pt-3 border-t border-white/5">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">글자 색상</label>
                  <div className="grid grid-cols-3 gap-2 h-10 items-center font-medium">
                    <button
                      type="button"
                      onClick={() => setEditingPreset(prev => ({ ...prev!, text_color: '#FFFFFF' }))}
                      className={`h-full rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        editingPreset.text_color === '#FFFFFF'
                          ? 'border-white bg-white/10 text-white font-extrabold shadow-sm'
                          : 'border-white/5 bg-transparent text-zinc-400 hover:text-white'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full bg-white border border-black/20" />
                      <span>흰색</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingPreset(prev => ({ ...prev!, text_color: '#000000' }))}
                      className={`h-full rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        editingPreset.text_color === '#000000'
                          ? 'border-white bg-white/10 text-white font-extrabold shadow-sm'
                          : 'border-white/5 bg-transparent text-zinc-400 hover:text-white'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full bg-black border border-white/20" />
                      <span>검은색</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingPreset(prev => ({ ...prev!, text_color: '#FFD700' }))}
                      className={`h-full rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        editingPreset.text_color === '#FFD700'
                          ? 'border-white bg-white/10 text-white font-extrabold shadow-sm'
                          : 'border-white/5 bg-transparent text-zinc-400 hover:text-white'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full bg-[#FFD700] border border-white/10" />
                      <span>노란색</span>
                    </button>
                  </div>
                </div>

                {/* 글꼴 스타일 */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">글꼴 스타일</label>
                  <div className="grid grid-cols-3 gap-1 bg-black/40 p-1 rounded-xl border border-white/5 items-center font-medium">
                    {[
                      { val: 'sans-thin', label: '기본고딕', style: { fontFamily: "'Pretendard', -apple-system, sans-serif", fontWeight: 700 } },
                      { val: 'sans-thick', label: '꽉찬고딕', style: { fontFamily: "'GmarketSansBold', sans-serif", fontWeight: 900 } },
                      { val: 'serif', label: '나눔명조', style: { fontFamily: "'Nanum Myeongjo', serif", fontWeight: 700 } },
                      { val: 'neon', label: '스포티', isPremium: true, style: { fontFamily: "'LeeSaManRu-Bold', sans-serif", fontWeight: 900 } },
                      { val: 'pixel', label: '레트로도트', isPremium: true, style: { fontFamily: "'NeoDunggeunmo', sans-serif", fontWeight: 400 } },
                      { val: 'plump', label: '둥글몽글', isPremium: true, style: { fontFamily: "'TmonMonsori', sans-serif", fontWeight: 900 } }
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
                        <span className="flex flex-col items-center justify-center gap-0.5">
                          <span>{item.label}</span>
                          {item.isPremium && (
                            <span className="px-1 py-[0.5px] rounded-[3px] text-[7px] font-black tracking-wide uppercase bg-violet-500/20 border border-violet-500/30 text-violet-400">
                              PRO
                            </span>
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 특수 효과 */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">특수 효과</label>
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
                            if (confirm('특수 효과는 유료 요금제(Lite 이상) 전용입니다. 요금제를 업그레이드하시겠습니까?')) {
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
                    저장만 하기
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
                    저장 없이 바로 송출 (1회성 송출)
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
                    기본값으로 초기화
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

      {/* 12. Upgrade Plan Modal Dialog */}
      {isUpgradeModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-effect border border-white/10 rounded-3xl w-full max-w-md p-7 relative z-10 animate-in fade-in zoom-in-95 duration-150 text-left flex flex-col gap-6 text-white bg-[#12121a]">
            
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-white/10">
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                플랜 업그레이드
              </h3>
              {!isUpgrading && upgradeStep !== 'success' && (
                <button
                  onClick={() => setIsUpgradeModalOpen(false)}
                  className="text-zinc-400 hover:text-white px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-xs font-bold hover:bg-white/5"
                >
                  닫기
                </button>
              )}
            </div>

            {/* Content Switcher */}
            {upgradeStep === 'select' && (
              <div className="flex flex-col gap-5 text-left">
                {room?.tier === 'free' ? (
                  <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent p-5 flex flex-col gap-3.5">
                    {/* Decorative glow background */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <div className="flex items-center gap-2 text-indigo-300 text-xs font-black uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                        무료 플랜 제한 안내
                      </div>
                      <span className="text-[10px] text-zinc-400 font-bold bg-white/5 px-2 py-0.5 rounded-full">6시간 제한</span>
                    </div>

                    <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-medium">
                      현재 기본(무료) 플랜을 사용 중이며, <span className="text-white font-bold underline decoration-indigo-400 decoration-2 underline-offset-4">시간 연장이 불가능</span>합니다. 지속적인 이용을 위해 요금제 업그레이드가 필요합니다.
                    </p>

                    <div className="pt-2 mt-1 border-t border-white/5 flex flex-col gap-2">
                      <span className="text-[11px] font-black text-indigo-300 tracking-wider uppercase">업그레이드 혜택</span>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[11px] font-semibold text-zinc-300">
                        <div className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          <span>24시간 사용 연장</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          <span>방 비밀번호 잠금</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          <span>무제한 프리셋 저장</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          <span>다중 추첨 (최대 10명)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          <span>프리미엄 폰트 제공</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          <span>화려한 특수효과 잠금해제</span>
                        </div>
                        <div className="flex items-center gap-1.5 col-span-2 mt-0.5 bg-indigo-500/10 border border-indigo-500/20 px-2 py-1.5 rounded-lg">
                          <svg className="w-3.5 h-3.5 text-indigo-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                          <span className="text-zinc-300">참여자 정원 증설 (Lite: 60명 / Pro: 250명)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 p-4 flex flex-col gap-2">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
                    <div className="flex items-center gap-1.5 text-indigo-300 text-xs font-black uppercase tracking-wider">
                      💡 실시간 한도 확장
                    </div>
                    <p className="text-xs text-zinc-300 leading-normal">
                      인원 제한을 늘리기 위해 플랜을 즉시 올릴 수 있으며, 업그레이드 후에도 <strong className="text-white">기존 입장 QR 코드 및 링크는 변경 없이 그대로 유지</strong>됩니다.
                    </p>
                  </div>
                )}

                {room?.tier === 'free' && (
                  <div className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/[0.02] border border-white/5 text-[10px] text-zinc-400 leading-normal">
                    <span>💡</span>
                    <span>업그레이드 후에도 <strong>입장용 QR 코드와 링크 주소는 동일하게 유지</strong>됩니다.</span>
                  </div>
                )}
                
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">업그레이드할 플랜 선택</span>
                <div className="flex flex-col gap-3">
                  {getUpgradableTiers().map((tKey) => {
                    const config = TIER_CONFIGS[tKey];
                    const isSelected = selectedUpgradeTier === tKey;
                    const planName = tKey === 'lite' ? 'Lite Plan' : tKey === 'pro' ? 'Pro Plan' : 'Max Plan';
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
                            동시 접속 한도: <strong className={isSelected ? 'text-white' : 'text-zinc-200'}>{config.maxParticipants}명</strong>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-sm sm:text-base font-black tracking-tight">{config.priceKrw.toLocaleString()}원</div>
                          <div className={`text-[10px] mt-0.5 font-bold ${isSelected ? 'text-indigo-200' : 'text-zinc-500'}`}>VAT 포함</div>
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
                  결제 단계로 이동하기
                </button>
              </div>
            )}

            {upgradeStep === 'payment' && selectedUpgradeTier && (
              <div className="flex flex-col gap-5 text-left">
                <div className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  선택하신 <strong className="text-white capitalize">{selectedUpgradeTier} Plan</strong> 요금을 결제합니다.<br />
                  결제 승인 즉시 동시 접속 인원 제한이 <strong className="text-indigo-300">{TIER_CONFIGS[selectedUpgradeTier].maxParticipants}명</strong>으로 증가합니다.
                </div>

                {/* PG Checkout Simulator Card */}
                <div className="bg-black/40 border border-white/5 rounded-2xl p-5 flex flex-col gap-3.5">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">가상 결제 모듈 시뮬레이터</span>
                  
                  <div className="flex justify-between items-center text-xs sm:text-sm border-b border-white/5 pb-2.5">
                    <span className="text-zinc-400">결제 대상 플랜</span>
                    <span className="text-white font-extrabold capitalize">{selectedUpgradeTier} Plan</span>
                  </div>

                  <div className="flex justify-between items-center text-xs sm:text-sm border-b border-white/5 pb-2.5">
                    <span className="text-zinc-400">증설 인원 한도</span>
                    <span className="text-emerald-400 font-extrabold">{TIER_CONFIGS[selectedUpgradeTier].maxParticipants}명</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs sm:text-sm">
                    <span className="text-zinc-400">결제 금액</span>
                    <span className="text-indigo-300 font-black font-mono">{TIER_CONFIGS[selectedUpgradeTier].priceKrw.toLocaleString()}원</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setUpgradeStep('select')}
                    disabled={isUpgrading}
                    className="flex-1 py-4 rounded-2xl bg-white/5 text-zinc-400 font-bold hover:bg-white/10 hover:text-white transition-all text-sm cursor-pointer disabled:opacity-50 border border-white/5"
                  >
                    이전으로
                  </button>
                  
                  <button
                    onClick={handleUpgrade}
                    disabled={isUpgrading}
                    className="flex-1 py-4 rounded-2xl bg-white text-black font-extrabold text-sm hover:bg-zinc-200 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-lg"
                  >
                    {isUpgrading ? (
                      <span>승인 중...</span>
                    ) : (
                      <span>결제 승인 완료</span>
                    )}
                  </button>
                </div>
              </div>
            )}

            {upgradeStep === 'success' && selectedUpgradeTier && (
              <div className="flex flex-col items-center text-center gap-5 py-4">
                <span className="text-xs font-black text-emerald-400 uppercase tracking-widest px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  Success
                </span>
                
                <h4 className="text-lg sm:text-xl font-black text-white">플랜 업그레이드 성공</h4>
                
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-sm">
                  요금제 플랜 업그레이드가 완료되었습니다.<br />
                  전광판 동시 접속 정원이 즉시 <strong className="text-white">{TIER_CONFIGS[selectedUpgradeTier].maxParticipants}명</strong>으로 확장되었습니다.
                </p>

                <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl text-xs text-zinc-400 leading-relaxed max-w-sm text-left">
                  <strong className="text-zinc-300 block mb-1">안내</strong>
                  기존에 열려 있는 관람객 접속용 QR 코드와 링크 주소는 그대로 동일하게 유지되므로, 관람객들이 새로 고침을 하거나 재스캔을 하지 않아도 정상 작동합니다.
                </div>

                <button
                  onClick={() => {
                    setIsUpgradeModalOpen(false);
                    setUpgradeStep('select');
                    setSelectedUpgradeTier(null);
                  }}
                  className="w-full py-4 mt-2 rounded-2xl bg-white text-black font-extrabold text-sm hover:bg-zinc-200 transition-all cursor-pointer shadow-lg"
                >
                  대시보드로 돌아가기
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* 13. Room Time Extension Modal Dialog */}
      {isExtendModalOpen && room && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-effect border border-white/10 rounded-3xl w-full max-w-md p-7 relative z-10 animate-in fade-in zoom-in-95 duration-150 text-left flex flex-col gap-6 text-white bg-[#12121a]">
            
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-white/10">
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                방 시간 연장 (Extend Session)
              </h3>
              {!isExtending && extendStep !== 'success' && (
                <button
                  onClick={() => setIsExtendModalOpen(false)}
                  className="text-zinc-400 hover:text-white px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-xs font-bold hover:bg-white/5"
                >
                  닫기
                </button>
              )}
            </div>

            {/* Content Switcher */}
            {extendStep === 'info' && (
              <div className="flex flex-col gap-5 text-left">
                <div className="text-xs sm:text-sm text-zinc-300 leading-relaxed bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-2xl">
                  <span className="font-extrabold text-indigo-300 block mb-1">안내</span>
                  방의 활성 시간을 <strong className="text-white">24시간 연장</strong>합니다.<br />
                  연장 후에도 기존에 접속해 있던 관객들의 링크 및 QR 코드는 변경 없이 그대로 유지됩니다.
                </div>
                
                <div className="bg-black/30 border border-white/5 rounded-2xl p-4 flex flex-col gap-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">현재 티어</span>
                    <span className="text-white font-extrabold uppercase">{room.tier} Plan</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">현재 만료 예정 시각</span>
                    <span className="text-zinc-300 font-mono">
                      {new Date(new Date(room.created_at).getTime() + 24 * 60 * 60 * 1000).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-white/5 pt-2">
                    <span className="text-indigo-400 font-bold">연장 후 만료 예정 시각</span>
                    <span className="text-indigo-300 font-mono font-bold">
                      {new Date(Math.max(Date.now(), new Date(room.created_at).getTime() + 24 * 60 * 60 * 1000) + 24 * 60 * 60 * 1000).toLocaleString()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setExtendStep('payment')}
                  className="w-full py-4 rounded-2xl bg-white text-black hover:bg-zinc-200 font-extrabold text-sm transition-all duration-200 cursor-pointer shadow-lg shadow-white/5"
                >
                  결제 단계로 이동하기
                </button>
              </div>
            )}

            {extendStep === 'payment' && (
              <div className="flex flex-col gap-5 text-left">
                <div className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  방 연장 24시간 이용권을 결제합니다.<br />
                  기존 이용 요금 대비 <strong className="text-indigo-300">20% 할인된 장기 고객 혜택가</strong>가 자동 적용됩니다.
                </div>

                <div className="bg-black/40 border border-white/5 rounded-2xl p-5 flex flex-col gap-3.5">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">가상 결제 모듈 시뮬레이터</span>
                  
                  <div className="flex justify-between items-center text-xs sm:text-sm border-b border-white/5 pb-2.5">
                    <span className="text-zinc-400">결제 대상 상품</span>
                    <span className="text-white font-extrabold">24시간 시간 연장 이용권</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs sm:text-sm border-b border-white/5 pb-2.5">
                    <span className="text-zinc-400">정가</span>
                    <span className="text-zinc-500 line-through font-mono">
                      {TIER_CONFIGS[room.tier].priceKrw.toLocaleString()}원
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs sm:text-sm border-b border-white/5 pb-2.5">
                    <span className="text-zinc-400">연장 할인 (20%)</span>
                    <span className="text-red-400 font-bold">
                      -{Math.round(TIER_CONFIGS[room.tier].priceKrw * 0.2).toLocaleString()}원
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs sm:text-sm">
                    <span className="text-zinc-400">최종 결제 금액</span>
                    <span className="text-indigo-300 font-black font-mono">
                      {Math.round(TIER_CONFIGS[room.tier].priceKrw * 0.8).toLocaleString()}원
                    </span>
                  </div>
                </div>

                {/* 환불 취소 불가 고지 */}
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-xs text-red-400 leading-relaxed">
                  <span className="font-extrabold block mb-1">경고 (환불/취소 정책 동의)</span>
                  방 시간 연장은 결제 완료 즉시 예약 리소스가 즉시 할당되어 24시간 연장 처리가 실행되므로, 단순 변심으로 인한 **환불 및 결제 취소가 엄격히 불가능**합니다. 이에 동의하시는 경우에만 결제를 진행해 주세요.
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setExtendStep('info')}
                    disabled={isExtending}
                    className="flex-1 py-4 rounded-2xl bg-white/5 text-zinc-400 font-bold hover:bg-white/10 hover:text-white transition-all text-sm cursor-pointer disabled:opacity-50 border border-white/5"
                  >
                    이전으로
                  </button>
                  
                  <button
                    onClick={handleExtendRoom}
                    disabled={isExtending}
                    className="flex-1 py-4 rounded-2xl bg-white text-black font-extrabold text-sm hover:bg-zinc-200 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-lg"
                  >
                    {isExtending ? (
                      <span>승인 중...</span>
                    ) : (
                      <span>결제 승인 완료</span>
                    )}
                  </button>
                </div>
              </div>
            )}

            {extendStep === 'success' && (
              <div className="flex flex-col items-center text-center gap-5 py-4">
                <span className="text-xs font-black text-emerald-400 uppercase tracking-widest px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  Success
                </span>
                
                <h4 className="text-lg sm:text-xl font-black text-white">시간 연장 완료</h4>
                
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-sm">
                  방 시간이 성공적으로 **24시간 연장**되었습니다.<br />
                  관람객 접속용 링크 및 QR 코드는 변함 없이 기존 것 그대로 정상 가동됩니다.
                </p>

                <button
                  onClick={() => {
                    setIsExtendModalOpen(false);
                    setExtendStep('info');
                  }}
                  className="w-full py-4 mt-2 rounded-2xl bg-white text-black font-extrabold text-sm hover:bg-zinc-200 transition-all cursor-pointer shadow-lg"
                >
                  대시보드로 돌아가기
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* 14. Passcode Settings Modal Dialog */}
      {isPasscodeDrawerOpen && room && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-effect border border-white/10 rounded-3xl w-full max-w-md p-7 relative z-10 animate-in fade-in zoom-in-95 duration-150 text-left flex flex-col gap-6 text-white bg-[#12121a]">
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-white/10">
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                방 비밀번호 설정 (Security Passcode)
              </h3>
              {!isPasscodeUpdating && (
                <button
                  type="button"
                  onClick={() => setIsPasscodeDrawerOpen(false)}
                  className="text-zinc-400 hover:text-white px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-xs font-bold hover:bg-white/5"
                >
                  닫기
                </button>
              )}
            </div>

            {/* Form */}
            <div className="flex flex-col gap-4 text-left">
              <div className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                방에 비밀번호를 설정하여 허가되지 않은 사용자의 무단 입장을 방지할 수 있습니다. 4~6자리의 숫자로 입력하세요.
              </div>

              <div className="bg-black/30 border border-white/5 rounded-2xl p-4 flex flex-col gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">입장 비밀번호</label>
                  <input
                    type="text"
                    value={passcodeVal}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      if (val.length <= 6) {
                        setPasscodeVal(val);
                      }
                    }}
                    placeholder="비밀번호 없이 즉시 입장하려면 비워두세요"
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
                    비밀번호 해제
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (passcodeVal && (passcodeVal.length < 4 || passcodeVal.length > 6)) {
                      setPasscodeUpdateError('비밀번호는 4~6자리의 숫자여야 합니다.');
                      return;
                    }
                    handleUpdatePasscode(passcodeVal);
                  }}
                  disabled={isPasscodeUpdating}
                  className="flex-1 py-4 rounded-2xl bg-white text-black hover:bg-zinc-200 transition-all font-extrabold text-sm disabled:opacity-50"
                >
                  {isPasscodeUpdating ? '저장 중...' : '저장 완료'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vault (보관 & 공유) Modal */}
      {isVaultOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#12121a] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>보관 & 공유</span>
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
                내 기기에 보관
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
                무선 전송
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {vaultTab === 'slots' ? (
                <div className="space-y-6">
                  <div>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">현재 연출팩 저장</span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newSlotName}
                        onChange={(e) => setNewSlotName(e.target.value.slice(0, 15))}
                        placeholder="저장할 테마 이름 입력"
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-white/40 focus:bg-black/50 text-sm font-semibold transition-colors"
                        maxLength={15}
                      />
                      <button
                        type="button"
                        onClick={handleSaveSlotPackage}
                        className="px-4 py-2.5 bg-white hover:bg-zinc-200 text-black rounded-xl text-xs font-bold transition-all cursor-pointer select-none"
                      >
                        저장
                      </button>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1.5 leading-relaxed">
                      💡 현재 원터치 연출 보드에 있는 프리셋들이 이 브라우저의 보관함에 슬롯으로 안전하게 저장됩니다.
                    </p>
                  </div>

                  <div className="border-t border-white/5 pt-4">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-3">저장된 테마 슬롯 목록</span>
                    {savedSlots.length === 0 ? (
                      <div className="text-center py-8 border border-dashed border-white/5 rounded-2xl bg-black/10">
                        <p className="text-xs text-zinc-500 font-bold">보관된 슬롯이 없습니다.</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                        {savedSlots.map((slot, index) => (
                          <div 
                            key={index}
                            onClick={() => handleLoadSlotPackage(index)}
                            className="group flex items-center justify-between p-3.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all cursor-pointer"
                          >
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold text-white truncate">{slot.name}</span>
                              <span className="text-[9px] text-zinc-400 font-bold mt-0.5">{slot.presets.length}개의 프리셋</span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteSlotPackage(index, e)}
                              className="p-1.5 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-all cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
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
                      전송하기 (내보내기)
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
                      가져오기
                    </button>
                  </div>

                  {shareMode === 'send' ? (
                    <div className="space-y-5 flex flex-col items-center">
                      <div className="text-center">
                        <p className="text-xs font-bold text-zinc-300">현재 원터치 연출 보드의 프리셋을 다른 기기로 무선 공유합니다.</p>
                        <p className="text-[10px] text-zinc-500 mt-1 font-bold">공유 코드는 생성 시점으로부터 24시간 동안 유효합니다.</p>
                      </div>

                      {exportCode ? (
                        <div className="space-y-5 w-full flex flex-col items-center">
                          {/* 6 Digit Code Display */}
                          <div className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-center relative group">
                            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">무선 공유 코드</span>
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
                          {isSharingLoading ? '코드 생성 중...' : '무선 공유 코드 생성'}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">공유 코드로 가져오기</span>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={shareCodeInput}
                            onChange={(e) => setShareCodeInput(e.target.value.slice(0, 6))}
                            placeholder="6자리 공유 코드 입력 (예: AB3D9E)"
                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white uppercase focus:outline-none focus:border-white/40 focus:bg-black/50 text-sm font-semibold tracking-wider font-mono transition-colors"
                            maxLength={6}
                          />
                          <button
                            type="button"
                            onClick={handleImportShareCode}
                            disabled={isSharingLoading}
                            className="px-4 py-2.5 bg-white hover:bg-zinc-200 text-black rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                          >
                            불러오기
                          </button>
                        </div>
                      </div>

                      {/* QR Scan Area */}
                      <div className="border-t border-white/5 pt-4 space-y-4">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">QR 코드로 가져오기</span>
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
                              스캔 중단
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={startScanning}
                            className="w-full py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <span>카메라로 QR 코드 스캔 📷</span>
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
          />
        </div>
      )}
    </div>
  );
}

// 12. Host Standalone Fullscreen Signboard Component
function HostFullscreenSignboard({ preset, onClose }: { preset: Preset; onClose: () => void }) {
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
      ? '추첨 대기 중'
      : (preset.text || '');

  // Use dynamic fitting hook to sync text sizes proportional to viewport container dimensions
  const { containerRef, fontSize } = useFitText(
    displayText,
    preset.effect || 'none',
    preset.font_size || 100
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

      {/* Floating Exit buttons overlay */}
      <div className={`absolute top-6 left-6 z-40 transition-opacity duration-300 ${showExitBtn ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <button
          onClick={onClose}
          className="py-2.5 px-5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 text-white font-bold text-xs tracking-wider flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 transition-all"
        >
          <span>닫기 (Exit)</span>
        </button>
      </div>

      <div className={`absolute bottom-6 left-6 z-40 text-[10px] text-zinc-500 transition-opacity duration-300 ${showExitBtn ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        화면을 더블클릭하거나 ESC 키를 누르면 종료됩니다.
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
