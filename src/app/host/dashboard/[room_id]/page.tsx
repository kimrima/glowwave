'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Trash2
} from 'lucide-react';
import { Preset, Room, SignalPayload, EffectType, TierType, TIER_CONFIGS } from '@/lib/types';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import LandscapePhoneMockup from '@/components/LandscapePhoneMockup';

const defaults: Preset[] = [
  { bg_color: '#0B0B0F', text: '앰비언트 🕯️', text_color: '#FFFFFF', effect: 'none', speed: 1000 },
  { bg_color: '#EF4444', text: '사이키 ⚡', text_color: '#FFFFFF', effect: 'blink', speed: 200 },
  { bg_color: '#3B82F6', text: '웨이브 🌊', text_color: '#FFFFFF', effect: 'marquee', speed: 4000 },
  { bg_color: '#8B5CF6', text: '카운트다운 ⏱️', text_color: '#FFFFFF', effect: 'countdown', speed: 1000 },
  { bg_color: '#F97316', text: '스크롤 💬', text_color: '#FFFFFF', effect: 'marquee', speed: 3000 },
  { bg_color: '#10B981', text: '이퀄라이저 📊', text_color: '#FFFFFF', effect: 'equalizer', speed: 1000 },
];

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
  
  // Real-time states
  const [presets, setPresets] = useState<Preset[]>([]);
  const [activePresetIndex, setActivePresetIndex] = useState<number | null>(null);
  const [activeParticipants, setActiveParticipants] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [channelStatus, setChannelStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  // Live broadcast on-air preview state
  const [currentBroadcastPreset, setCurrentBroadcastPreset] = useState<Preset>({ 
    bg_color: '#0B0B0F', 
    text: 'GlowWave 🌊', 
    text_color: '#FFFFFF', 
    effect: 'none', 
    speed: 1000 
  });

  // Custom instant message state values
  const [customText, setCustomText] = useState('열정 🔥');
  const [customBgColor, setCustomBgColor] = useState('#EF4444');
  const [customFontSize, setCustomFontSize] = useState<'auto' | 'small' | 'medium' | 'large' | 'huge'>('auto');
  const [customFontFamily, setCustomFontFamily] = useState<'sans' | 'serif' | 'neon' | 'dot'>('sans');

  // Preset Live Edit States
  const [editingPresetIndex, setEditingPresetIndex] = useState<number | null>(null);
  const [editingPreset, setEditingPreset] = useState<Preset | null>(null);

  // Supabase & SSE references
  const supabaseChannelRef = useRef<any>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const [originUrl, setOriginUrl] = useState('');

  const audienceUrl = originUrl && roomId ? `${originUrl}/room/${roomId}` : '';
  const qrCodeUrl = roomId ? `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(audienceUrl)}` : '';
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
      const response = await fetch(`/api/room/${roomId}/status`);
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
      });

      if (roomData.current_state) {
        setCurrentBroadcastPreset(roomData.current_state);
      }

      // Load presets from localStorage
      const savedPresets = localStorage.getItem(`glowwave_presets_${roomId}`);
      let loadedPresets: Preset[] = [];
      if (savedPresets) {
        loadedPresets = JSON.parse(savedPresets);
        setPresets(loadedPresets);
      } else {
        // Defaults if empty
        const defaults: Preset[] = [
          { bg_color: '#EF4444', text: '열정 🔥', text_color: '#FFFFFF', effect: 'none', speed: 1000 },
          { bg_color: '#3B82F6', text: '파도 타기 🌊', text_color: '#FFFFFF', effect: 'marquee', speed: 4000 },
          { bg_color: '#EC4899', text: '소리 질러! 🎉', text_color: '#FFFFFF', effect: 'blink', speed: 600 },
          { bg_color: '#10B981', text: '싱크 클럽 ⚡', text_color: '#FFFFFF', effect: 'blink', speed: 400 },
          { bg_color: '#F59E0B', text: '박수 👏👏', text_color: '#000000', effect: 'none', speed: 1000 },
          { bg_color: '#8B5CF6', text: 'GLOW', text_color: '#FFFFFF', effect: 'none', speed: 1000 },
        ];
        loadedPresets = defaults;
        setPresets(defaults);
        localStorage.setItem(`glowwave_presets_${roomId}`, JSON.stringify(defaults));
      }

      if (loadedPresets.length > 0) {
        setCurrentBroadcastPreset(loadedPresets[0]);
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
          const response = await fetch(`/api/room/${roomId}/status`);
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
      (key) => TIER_ORDER[key] > currentOrder
    ) as TierType[];
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
      const syncResponse = await fetch(`/api/room/${roomId}/status`);
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

  // 4. Trigger Preset Broadcast Signal
  const triggerPreset = async (preset: Preset, index: number) => {
    if (!roomId || !token) return;
    setActivePresetIndex(index);
    setCurrentBroadcastPreset(preset);

    if (isSupabaseConfigured() && supabaseChannelRef.current && supabase) {
      // Send directly over WebSockets in-memory broadcast
      supabaseChannelRef.current.send({
        type: 'broadcast',
        event: 'render',
        payload: preset
      });
      // Also update the current state in Supabase so newly joined spectators sync properly
      supabase.from('rooms').update({ current_state: preset }).eq('id', roomId).then(({ error }) => {
        if (error) console.error('[Dashboard] Error persisting current state:', error);
      });
      console.log(`[Dashboard] Broadcast preset: ${preset.text} via Supabase Channel`);
    } else {
      // Fallback: POST to Broadcast Route
      try {
        const response = await fetch(`/api/room/${roomId}/broadcast`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            host_session_token: token,
            preset
          })
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || '전송 실패');
        }
        console.log(`[Dashboard] Broadcast preset: ${preset.text} via Local API`);
      } catch (err: any) {
        console.error('Trigger preset error:', err);
        alert(`전송 오류: ${err.message}`);
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
    <div className="min-h-screen bg-[#0B0B0F] text-foreground flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#0B0B0F]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <span className="font-bold text-white tracking-tight">GlowWave Host Remote</span>
          </div>
          
          <button 
            onClick={() => router.push('/')}
            className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
            title="나가기"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Unified HUD Status Bar */}
      <section className="max-w-7xl mx-auto px-6 pt-6 w-full">
        <div className="glass-effect rounded-2xl p-4 flex flex-wrap justify-between items-center gap-4 bg-[#12121a] border border-white/5">
          <div className="flex flex-wrap items-center gap-6">
            <div>
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Event Code</span>
              <span className="text-xl font-mono font-black text-white select-all">{roomId}</span>
            </div>
            
            <div className="hidden sm:block w-[1px] h-8 bg-white/5" />
            
            <div>
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Live Audience</span>
              <span className="text-xl font-black text-white flex items-baseline gap-1">
                <span>{activeParticipants}</span>
                <span className="text-[10px] text-zinc-500 font-bold">/ {room?.max_participants}명</span>
              </span>
            </div>

            <div className="hidden sm:block w-[1px] h-8 bg-white/5" />

            <div>
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Active Plan</span>
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
                    Upgrade ⚡
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">System Status</span>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>{channelStatus === 'connected' ? 'CONNECTED' : 'CONNECTING'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid */}
      <main className="max-w-7xl mx-auto px-6 py-6 flex-1 grid lg:grid-cols-12 gap-8 w-full">
        
        {/* Left Column: Cockpit (Presets & Free-text edit) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Quick Triggers Dashboard */}
          <div className="glass-effect rounded-2xl p-6 bg-[#12121a]">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-zinc-400" />
                <h2 className="text-sm font-bold text-white">원터치 연출 보드 (Quick Preset Board)</h2>
              </div>
              <span className="text-[9px] font-bold font-mono text-zinc-500">P1 - P6 SELECTORS</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {presets.map((preset, index) => {
                const isActive = activePresetIndex === index;
                return (
                  <div
                    key={index}
                    onClick={() => triggerPreset(preset, index)}
                    className={`h-24 rounded-2xl border flex items-center justify-center p-6 relative overflow-hidden transition-all active:scale-[0.97] cursor-pointer ${
                      isActive 
                        ? 'bg-white/[0.03] ring-1 ring-white/10' 
                        : 'border-white/5 bg-black/20 hover:border-white/10 hover:bg-white/[0.01]'
                    }`}
                    style={isActive ? { 
                      boxShadow: preset.bg_color === '#0B0B0F' 
                        ? '0 0 20px rgba(255,255,255,0.1)' 
                        : `0 0 22px ${preset.bg_color}44`,
                      borderColor: preset.bg_color === '#0B0B0F' ? '#FFFFFF' : preset.bg_color
                    } : undefined}
                  >
                    {/* Background color subtle glow corner */}
                    <div className="absolute top-2.5 left-3 w-3 h-3 rounded-full" style={{ backgroundColor: preset.bg_color }} />
                    
                    <div className="text-center">
                      <div className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                        {preset.text}
                      </div>
                    </div>

                    {/* Small edit pencil icon in the top right, appears on hover or low-contrast */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation(); // Avoid triggering preset
                        setEditingPresetIndex(index);
                        setEditingPreset({ ...preset });
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/5 text-zinc-500 hover:text-white hover:bg-white/15 transition-all z-20 cursor-pointer"
                      title="수정"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}

              {/* + Custom Preset Card Slot */}
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
                    text: '새 연출 ⚡',
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
            </div>
          </div>

          {/* Custom Customizer Input for On-the-fly Triggering */}
          <div className="glass-effect rounded-2xl p-6 bg-[#12121a]">
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
                    onChange={(e) => setCustomText(e.target.value)}
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
                    const customPreset: Preset = {
                      bg_color: customBgColor,
                      text: customText || 'LET\'S GO',
                      text_color: isWhite ? '#000000' : '#FFFFFF',
                      effect: customText.length > 8 ? 'marquee' : 'none',
                      speed: 4000,
                      font_size: customFontSize,
                      font_family: customFontFamily
                    };
                    triggerPreset(customPreset, -1);
                  }}
                  className="btn-primary h-[48px] px-6 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Tv className="w-3.5 h-3.5" />
                  송출하기
                </button>
              </div>

              {/* Button Grids Controls Row (Segmented list) */}
              <div className="grid md:grid-cols-3 gap-6 pt-3 border-t border-white/5">
                {/* 배경 테마 */}
                <div>
                  <label className="block text-[9px] font-bold text-zinc-400 uppercase mb-2">배경 테마</label>
                  <div className="grid grid-cols-4 gap-1.5 bg-black/40 p-1.5 rounded-xl border border-white/5">
                    {[
                      '#EF4444', '#3B82F6', '#10B981', '#8B5CF6', '#F97316', '#EC4899', '#FFFFFF', '#0B0B0F'
                    ].map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => setCustomBgColor(hex)}
                        className={`h-7 rounded-lg border cursor-pointer transition-all ${
                          customBgColor === hex
                            ? 'border-white scale-105'
                            : 'border-transparent hover:scale-102 hover:bg-white/5'
                        }`}
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                </div>

                {/* 글자 크기 */}
                <div>
                  <label className="block text-[9px] font-bold text-zinc-400 uppercase mb-2">글자 크기</label>
                  <div className="grid grid-cols-5 gap-1 bg-black/40 p-1.5 rounded-xl border border-white/5 h-[44px] items-center">
                    {[
                      { val: 'auto', label: 'Auto' },
                      { val: 'small', label: '80%' },
                      { val: 'medium', label: '100%' },
                      { val: 'large', label: '140%' },
                      { val: 'huge', label: '180%' }
                    ].map((item) => (
                      <button
                        type="button"
                        key={item.val}
                        onClick={() => setCustomFontSize(item.val as any)}
                        className={`py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          customFontSize === item.val
                            ? 'bg-white text-black shadow-sm'
                            : 'text-zinc-400 hover:text-white hover:bg-white/[0.02]'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 글꼴 스타일 */}
                <div>
                  <label className="block text-[9px] font-bold text-zinc-400 uppercase mb-2">글꼴 스타일</label>
                  <div className="grid grid-cols-4 gap-1 bg-black/40 p-1.5 rounded-xl border border-white/5 h-[44px] items-center">
                    {[
                      { val: 'sans', label: '고딕' },
                      { val: 'serif', label: '명조' },
                      { val: 'neon', label: '네온' },
                      { val: 'dot', label: '도트' }
                    ].map((item) => (
                      <button
                        type="button"
                        key={item.val}
                        onClick={() => setCustomFontFamily(item.val as any)}
                        className={`py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                          customFontFamily === item.val
                            ? 'bg-white text-black shadow-sm'
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
          </div>
        </div>

        {/* Right Column: Live Preview & Admission QR Sharing */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* LIVE ON AIR Preview Card */}
          <div className="glass-effect rounded-2xl p-6 flex flex-col items-center bg-[#12121a]">
            <div className="flex items-center gap-2 mb-2 self-start">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">LIVE ON AIR</h2>
            </div>
            <p className="text-[11px] text-zinc-500 mb-4 self-start">현재 모든 관객 화면에 송출 중인 실시간 연출 화면입니다.</p>
            <div className="w-full flex justify-center py-2 border-y border-white/5 bg-black/20 rounded-xl">
              <LandscapePhoneMockup preset={currentBroadcastPreset} />
            </div>
          </div>

          <div className="glass-effect rounded-2xl p-6 flex flex-col items-center text-center bg-[#12121a]">
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
                className="w-full py-3 rounded-xl border border-white/5 bg-white/5 font-semibold text-white text-xs hover:bg-white/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                관객용 URL 링크 복사하기 📋
              </button>
              
              <button
                onClick={() => window.open(`/host/present/${roomId}`, '_blank')}
                className="w-full py-3 rounded-xl bg-indigo-500 font-bold text-white text-xs hover:bg-indigo-600 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-500/10"
              >
                새 창으로 관객 안내 스크린 열기 📺
              </button>
              
              <button
                onClick={downloadQrCode}
                className="w-full py-3 rounded-xl border border-white/10 bg-white/10 font-semibold text-white text-xs hover:bg-white/15 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                입장 QR 이미지 다운로드 📥
              </button>
            </div>
          </div>

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
            <div className="flex flex-col flex-1 overflow-y-auto">
              
              {/* Header */}
              <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-400" />
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
              <div className="p-6 border-b border-white/5 bg-black/40 flex flex-col items-center">
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
                    value={editingPreset.text}
                    onChange={(e) => setEditingPreset(prev => ({ ...prev!, text: e.target.value }))}
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
                    ].map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => setEditingPreset(prev => ({ ...prev!, bg_color: hex }))}
                        className={`h-9 rounded-lg border cursor-pointer transition-all ${
                          editingPreset.bg_color === hex 
                            ? 'border-white scale-105' 
                            : 'border-transparent hover:scale-102'
                        }`}
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                </div>

                {/* Text Color Option */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">글자 색상</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingPreset(prev => ({ ...prev!, text_color: '#FFFFFF' }))}
                      className={`flex-1 py-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                        editingPreset.text_color === '#FFFFFF'
                          ? 'border-white bg-white text-black font-extrabold'
                          : 'border-white/5 bg-transparent text-zinc-400 hover:text-white'
                      }`}
                    >
                      밝은색
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingPreset(prev => ({ ...prev!, text_color: '#000000' }))}
                      className={`flex-1 py-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                        editingPreset.text_color === '#000000'
                          ? 'border-white bg-white text-black font-extrabold'
                          : 'border-white/5 bg-transparent text-zinc-400 hover:text-white'
                      }`}
                    >
                      어두운색
                    </button>
                  </div>
                </div>

                {/* Font Family Selector */}
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">글꼴 스타일</label>
                  <div className="grid grid-cols-4 gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
                    {[
                      { val: 'sans', label: '고딕' },
                      { val: 'serif', label: '명조' },
                      { val: 'neon', label: '네온' },
                      { val: 'dot', label: '도트' }
                    ].map((item) => (
                      <button
                        type="button"
                        key={item.val}
                        onClick={() => setEditingPreset(prev => ({ ...prev!, font_family: item.val as any }))}
                        className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          (editingPreset.font_family || 'sans') === item.val
                            ? 'bg-white text-black shadow-sm'
                            : 'text-zinc-400 hover:text-white hover:bg-white/[0.02]'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font Size & Motion Effect in Two columns */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">글자 크기 비율</label>
                    <div className="grid grid-cols-5 gap-0.5 bg-black/40 p-1 rounded-xl border border-white/5">
                      {[
                        { val: 'auto', label: 'Auto' },
                        { val: 'small', label: '80%' },
                        { val: 'medium', label: '100%' },
                        { val: 'large', label: '140%' },
                        { val: 'huge', label: '180%' }
                      ].map((item) => (
                        <button
                          type="button"
                          key={item.val}
                          onClick={() => setEditingPreset(prev => ({ ...prev!, font_size: item.val as any }))}
                          className={`py-1.5 rounded-lg text-[9px] font-bold transition-all cursor-pointer ${
                            (editingPreset.font_size || 'auto') === item.val
                              ? 'bg-white text-black shadow-sm'
                              : 'text-zinc-400 hover:text-white hover:bg-white/[0.02]'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">모션 효과</label>
                    <div className="grid grid-cols-5 gap-0.5 bg-black/40 p-1 rounded-xl border border-white/5">
                      {[
                        { val: 'none', label: '정적' },
                        { val: 'blink', label: '깜빡이' },
                        { val: 'marquee', label: '흐르기' },
                        { val: 'equalizer', label: '이퀄' },
                        { val: 'countdown', label: '타이머' }
                      ].map((item) => (
                        <button
                          type="button"
                          key={item.val}
                          onClick={() => setEditingPreset(prev => ({ ...prev!, effect: item.val as any }))}
                          className={`py-1.5 rounded-lg text-[9px] font-bold transition-all cursor-pointer ${
                            editingPreset.effect === item.val
                              ? 'bg-white text-black shadow-sm'
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
            </div>

            {/* Footer Buttons */}
            <div className="p-6 border-t border-white/5 bg-black/20 flex flex-col gap-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (editingPresetIndex === null || !editingPreset) return;
                    const updated = [...presets];
                    if (editingPresetIndex === presets.length) {
                      updated.push(editingPreset);
                    } else {
                      updated[editingPresetIndex] = editingPreset;
                    }
                    setPresets(updated);
                    localStorage.setItem(`glowwave_presets_${roomId}`, JSON.stringify(updated));
                    setEditingPresetIndex(null);
                    setEditingPreset(null);
                  }}
                  className="flex-1 py-3 rounded-xl bg-white/10 text-white font-bold hover:bg-white/15 transition-all text-xs cursor-pointer"
                >
                  저장만 하기
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (editingPresetIndex === null || !editingPreset) return;
                    const updated = [...presets];
                    if (editingPresetIndex === presets.length) {
                      updated.push(editingPreset);
                    } else {
                      updated[editingPresetIndex] = editingPreset;
                    }
                    setPresets(updated);
                    localStorage.setItem(`glowwave_presets_${roomId}`, JSON.stringify(updated));
                    triggerPreset(editingPreset, editingPresetIndex);
                    setEditingPresetIndex(null);
                    setEditingPreset(null);
                  }}
                  className="btn-primary flex-1 py-3 rounded-xl text-xs font-bold cursor-pointer"
                >
                  저장 후 바로 송출 ⚡
                </button>
              </div>

              {/* Reset to Defaults (for system defaults) */}
              {editingPresetIndex < 6 && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingPreset({ ...defaults[editingPresetIndex] });
                  }}
                  className="w-full py-2.5 rounded-xl border border-white/5 bg-white/5 text-zinc-400 font-semibold hover:bg-white/10 transition-all text-xs cursor-pointer"
                >
                  기본값으로 초기화 🔄
                </button>
              )}

              {/* Delete Custom Preset */}
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
                  className="w-full py-2.5 rounded-xl border border-red-500/10 bg-red-500/5 text-red-400 font-semibold hover:bg-red-500/15 transition-all text-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  프리셋 삭제
                </button>
              )}

              <button
                type="button"
                onClick={() => { setEditingPresetIndex(null); setEditingPreset(null); }}
                className="w-full py-2.5 rounded-xl bg-white/5 text-zinc-400 font-semibold hover:bg-white/10 transition-all text-xs cursor-pointer"
              >
                취소 (변경 사항 무시)
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 12. Upgrade Plan Modal Dialog */}
      {isUpgradeModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-effect border border-white/10 rounded-2xl w-full max-w-md p-6 relative z-10 animate-in fade-in zoom-in-95 duration-150 text-center flex flex-col gap-5 text-white bg-[#12121a]">
            
            {/* Header */}
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                실시간 플랜 업그레이드
              </h3>
              {!isUpgrading && upgradeStep !== 'success' && (
                <button
                  onClick={() => setIsUpgradeModalOpen(false)}
                  className="text-zinc-500 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                  title="닫기"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Content Switcher */}
            {upgradeStep === 'select' && (
              <div className="flex flex-col gap-4 text-left">
                <div className="text-xs text-zinc-400 leading-relaxed bg-white/5 border border-white/5 p-3 rounded-xl">
                  💡 <b>안내:</b> 인원 제한을 늘리기 위해 플랜을 올릴 수 있습니다. 업그레이드 후에도 <b>기존 입장 QR 코드 및 링크는 변경 없이 그대로 유지</b>되며 실시간으로 한도가 확장됩니다.
                </div>
                
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest font-mono">업그레이드 가능한 플랜 선택</span>
                <div className="flex flex-col gap-2">
                  {getUpgradableTiers().map((tKey) => {
                    const config = TIER_CONFIGS[tKey];
                    return (
                      <button
                        key={tKey}
                        onClick={() => setSelectedUpgradeTier(tKey)}
                        className={`w-full p-4 rounded-xl border transition-all text-left flex justify-between items-center cursor-pointer ${
                          selectedUpgradeTier === tKey
                            ? 'bg-indigo-500/10 border-indigo-500 text-white'
                            : 'bg-white/5 border-white/5 text-zinc-300 hover:bg-white/10 hover:border-white/10'
                        }`}
                      >
                        <div>
                          <div className="font-extrabold text-xs capitalize">{tKey === 'lite' ? 'Lite Plan 🎈' : tKey === 'pro' ? 'Pro Plan 🌊' : 'Max Plan ⚡'}</div>
                          <div className="text-[10px] text-zinc-500 mt-1">동시 접속 한도: {config.maxParticipants}명</div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-xs text-indigo-300 font-extrabold">{config.priceKrw.toLocaleString()}원</div>
                          <div className="text-[8px] text-zinc-600 mt-0.5">VAT 포함</div>
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
                  className="btn-primary w-full py-3.5 mt-2 rounded-xl text-xs font-extrabold cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                >
                  결제 단계로 이동하기 ➡️
                </button>
              </div>
            )}

            {upgradeStep === 'payment' && selectedUpgradeTier && (
              <div className="flex flex-col gap-4 text-left">
                <div className="text-xs text-zinc-400 leading-normal">
                  선택하신 <b>{selectedUpgradeTier.toUpperCase()} Plan</b> 요금을 결제합니다. 결제 승인 즉시 인원 제한이 <b>{TIER_CONFIGS[selectedUpgradeTier].maxParticipants}명</b>으로 증가합니다.
                </div>

                {/* PG Checkout Simulator Card */}
                <div className="bg-black/50 border border-white/5 rounded-2xl p-4 flex flex-col gap-3">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest font-mono">가상 결제 모듈 시뮬레이터</span>
                  
                  <div className="flex justify-between items-center font-mono text-xs border-b border-white/5 pb-2">
                    <span className="text-zinc-400">결제 대상 플랜</span>
                    <span className="text-white font-bold capitalize">{selectedUpgradeTier} Plan</span>
                  </div>

                  <div className="flex justify-between items-center font-mono text-xs border-b border-white/5 pb-2">
                    <span className="text-zinc-400">증설 인원 한도</span>
                    <span className="text-emerald-400 font-bold">{TIER_CONFIGS[selectedUpgradeTier].maxParticipants}명</span>
                  </div>
                  
                  <div className="flex justify-between items-center font-mono text-xs">
                    <span className="text-zinc-400">결제 금액</span>
                    <span className="text-indigo-300 font-bold">{TIER_CONFIGS[selectedUpgradeTier].priceKrw.toLocaleString()}원</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setUpgradeStep('select')}
                    disabled={isUpgrading}
                    className="flex-1 py-3 rounded-xl bg-white/5 text-zinc-400 font-semibold hover:bg-white/10 transition-all text-xs cursor-pointer disabled:opacity-50"
                  >
                    이전으로
                  </button>
                  
                  <button
                    onClick={handleUpgrade}
                    disabled={isUpgrading}
                    className="btn-primary flex-1 py-3 rounded-xl text-xs font-extrabold cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 animate-pulse"
                  >
                    {isUpgrading ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        승인 중...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-3 h-3" />
                        결제 승인 완료 💳
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {upgradeStep === 'success' && selectedUpgradeTier && (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Check className="w-6 h-6" />
                </div>
                
                <h4 className="text-base font-extrabold text-white">플랜 업그레이드 성공! 🎉</h4>
                
                <p className="text-xs text-zinc-400 leading-relaxed max-w-xs">
                  요금제 플랜 업그레이드가 성공적으로 확인되었습니다.<br />
                  전광판 동시 접속 정원이 즉시 <b>{TIER_CONFIGS[selectedUpgradeTier].maxParticipants}명</b>으로 확장되었습니다.
                </p>

                <div className="bg-white/5 border border-white/5 p-3 rounded-xl text-[10px] text-zinc-500 leading-normal max-w-xs text-left">
                  📌 <b>안내:</b> 기존에 열려 있는 관람객 접속용 QR 코드와 링크 주소는 그대로 동일하게 유지되므로, 관람객들이 새로 고침을 하거나 재스캔을 하지 않아도 정상 작동합니다.
                </div>

                <button
                  onClick={() => {
                    setIsUpgradeModalOpen(false);
                    setUpgradeStep('select');
                    setSelectedUpgradeTier(null);
                  }}
                  className="w-full py-3.5 mt-2 rounded-xl bg-white text-black font-extrabold text-xs hover:bg-zinc-200 transition-all cursor-pointer"
                >
                  대시보드로 돌아가기
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
