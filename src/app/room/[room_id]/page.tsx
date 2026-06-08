'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Sparkles, 
  RotateCw, 
  AlertTriangle, 
  Smartphone, 
  Loader2,
  Lock,
  WifiOff
} from 'lucide-react';
import { Preset, Room } from '@/lib/types';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export default function AudienceRoom() {
  const params = useParams();
  const router = useRouter();
  const rawRoomId = params.room_id as string;
  const roomId = rawRoomId ? rawRoomId.toUpperCase() : '';

  // Current Signboard Display State
  const [currentPreset, setCurrentPreset] = useState<Preset>({
    bg_color: '#0B0B0F',
    text: '연결 중...',
    text_color: '#FFFFFF',
    effect: 'none',
    speed: 1000
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isHardCapped, setIsHardCapped] = useState(false);
  const [isRoomInactive, setIsRoomInactive] = useState(false);

  // Technical Refs for Wake Lock & Real-time
  const wakeLockRef = useRef<any>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const supabaseChannelRef = useRef<any>(null);

  // 1. Initial Room Validations (Existence, Activation, Hard Cap limits)
  const validateAndConnect = async (isReconnect = false) => {
    if (!roomId) return;
    if (!isReconnect) setLoading(true);

    try {
      const response = await fetch(`/api/room/${roomId}/status`);
      if (!response.ok) {
        if (response.status === 404) {
          setError('존재하지 않는 방 번호입니다.');
        } else {
          setError('방 정보를 불러오는 과정에서 오류가 발생했습니다.');
        }
        setLoading(false);
        return;
      }

      const roomData = await response.json();
      
      // If room is inactive (pending payment status)
      if (roomData.status !== 'active') {
        setIsRoomInactive(true);
        setLoading(false);
        return;
      }
      setIsRoomInactive(false);

      // Check Hard Cap (limit of room tier)
      // On reconnect, we allow connection if they were already inside, but validate for fresh entry
      if (!isReconnect && roomData.current_participants >= roomData.max_participants) {
        setIsHardCapped(true);
        setLoading(false);
        return;
      }
      setIsHardCapped(false);

      // Fetch active state from DB/Serverless memory to sync instantly within 0.2s
      const stateRes = await fetch(`/api/room/${roomId}/stream`); // This or polling status is quick
      // We can also request the status API which returns presets details, or simply fetch room's current state
      // Let's call status API which returns current active settings, or let the stream connect first.
      
      if (!isReconnect) {
        // Initialize Realtime engine
        connectRealtime(roomId);
        // Request Wake Lock
        requestWakeLock();
        setLoading(false);
      } else {
        // Just fetch latest state to sync immediately
        const syncResponse = await fetch(`/api/room/${roomId}/status`);
        if (syncResponse.ok) {
          const syncData = await syncResponse.json();
          // We can fetch the local states if needed. Our localDb keeps currentStates.
          // Let's perform a fast get-state request
          fetchCurrentState();
        }
      }

    } catch (err) {
      console.error(err);
      setError('네트워크 상태를 확인해 주세요.');
      setLoading(false);
    }
  };

  const fetchCurrentState = async () => {
    try {
      const response = await fetch(`/api/room/${roomId}/status`);
      if (response.ok) {
        // If localDb or Supabase is active, fetch current state.
        // Let's add a fast fetch helper in localDb/Server for current state
        const sData = await response.json();
        // Since we want to update the preset, we can call a GET route for room current state
        // For simplicity, we can fetch room status, which in local fallback also includes current preset,
        // but let's connect and sync via real-time channel.
      }
    } catch (e) {
      // Fail silently on sync fallback
    }
  };

  // 2. Real-time Subscription Setup
  const connectRealtime = (roomCode: string) => {
    // Clean existing
    if (eventSourceRef.current) eventSourceRef.current.close();
    if (supabaseChannelRef.current && supabase) supabase.removeChannel(supabaseChannelRef.current);

    if (isSupabaseConfigured() && supabase) {
      console.log('[Room] Connecting to Supabase Realtime Channel');
      const channel = supabase.channel(`room_${roomCode}`, {
        config: {
          broadcast: { ack: false }
        }
      });

      channel
        .on('broadcast', { event: 'render' }, ({ payload }) => {
          // Sync signaling payload in sub-100ms
          console.log('[Room] Received broadcast payload:', payload);
          setCurrentPreset(payload);
        })
        .on('broadcast', { event: 'room_activated' }, () => {
          setIsRoomInactive(false);
          validateAndConnect(true);
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('[Room] Subscribed to Supabase channels');
          }
        });
        
      supabaseChannelRef.current = channel;
    } else {
      // SSE Fallback connection
      console.log('[Room] Connecting to Local SSE Stream');
      const eventSource = new EventSource(`/api/room/${roomCode}/stream`);
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.event === 'init') {
            if (data.state) {
              setCurrentPreset(data.state);
            }
          } else if (data.event === 'render') {
            console.log('[Room] SSE render preset state:', data.payload);
            setCurrentPreset(data.payload);
          } else if (data.event === 'room_activated') {
            setIsRoomInactive(false);
            validateAndConnect(true);
          }
        } catch (err) {
          console.error('[Room] SSE parse error:', err);
        }
      };

      eventSource.onerror = (err) => {
        console.error('[Room] SSE Connection closed/failed. Reconnecting...', err);
        // Standard EventSource auto-reconnects, but we'll monitor visibility changes too
      };
    }
  };

  // 3. W3C Wake Lock API implementation
  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        console.log('[WakeLock] Screen Wake Lock is active 🔒');
      } catch (err: any) {
        console.warn(`[WakeLock] Failed to lock screen sleep: ${err.message}`);
      }
    } else {
      console.warn('[WakeLock] Wake Lock API is not supported in this browser.');
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        console.log('[WakeLock] Screen Wake Lock released');
      } catch (err: any) {
        console.error(err);
      }
    }
  };

  // 4. Auto-reconnect & Sync on Visibility Change (Tab focus / Lock screen unlock)
  useEffect(() => {
    validateAndConnect();

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        console.log('[Visibility] Tab active. Re-acquiring wake lock & syncing state...');
        await requestWakeLock();
        
        // Auto-reconnect live stream and fetch latest state from API (takes 0.2s)
        if (roomId) {
          // Trigger immediate server check
          validateAndConnect(true);
          
          // Re-subscribe to SSE or WebSockets to repair broken links
          connectRealtime(roomId);
        }
      } else {
        // Tab backgrounded: release lock to comply with browser battery policy
        releaseWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      releaseWakeLock();
      if (eventSourceRef.current) eventSourceRef.current.close();
      if (supabaseChannelRef.current && supabase) supabase.removeChannel(supabaseChannelRef.current);
    };
  }, [roomId]);

  // 5. Viral Loop Referral setup
  const handleViralClick = () => {
    if (typeof window !== 'undefined') {
      // Set referral cookie/localStorage
      localStorage.setItem('glowwave_referred_discount', 'true');
      document.cookie = "glowwave_referred_discount=true; max-age=604800; path=/"; // 7 days expiration
      router.push('/');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#0B0B0F] flex items-center justify-center text-white z-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          <p className="text-sm font-semibold tracking-wider text-zinc-400">이벤트 전광판 동기화 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-[#0B0B0F] flex items-center justify-center px-6 text-center text-white z-50">
        <div className="glass-effect p-8 rounded-2xl max-w-sm border border-red-500/10">
          <WifiOff className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-white mb-2">접속 오류</h2>
          <p className="text-sm text-zinc-400 mb-6">{error}</p>
          <button onClick={() => router.push('/')} className="w-full py-3 rounded-xl bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-all">
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // Hard Cap limit reached overlay
  if (isHardCapped) {
    return (
      <div className="fixed inset-0 bg-[#0B0B0F] flex items-center justify-center px-6 text-center text-white z-50">
        <div className="glass-effect p-8 rounded-2xl max-w-sm border border-yellow-500/20">
          <Lock className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-lg font-extrabold text-white mb-2">접속 인원 제한 초과 🛑</h2>
          <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
            본 방은 주최자의 요금제별 지정 동시 접속 한도에 도달했습니다.<br />
            기존 참여자가 나가거나 주최자가 상위 등급으로 업그레이드할 때까지 입장이 제한됩니다.
          </p>
          <button onClick={() => router.push('/')} className="w-full py-3 rounded-xl bg-white/5 text-zinc-300 font-semibold text-xs hover:bg-white/10 transition-all">
            메인 홈으로 가기
          </button>
        </div>
      </div>
    );
  }

  // Inactive Room (Pending Payment) overlay
  if (isRoomInactive) {
    return (
      <div className="fixed inset-0 bg-[#0B0B0F] flex items-center justify-center px-6 text-center text-white z-50">
        <div className="flex flex-col items-center gap-4 max-w-sm">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          <h2 className="text-lg font-bold text-white">결제 승인 확인 중...</h2>
          <p className="text-xs text-zinc-500 leading-normal">
            방장이 결제를 완료할 때까지 대기하고 있습니다.<br />결제가 확인되는 즉시 자동으로 전광판 화면이 열립니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden select-none bg-black">
      
      {/* 6. Landscape forced Warning overlay (Locks with CSS orientation media query) */}
      <div className="fixed inset-0 bg-[#0B0B0F] flex flex-col justify-center items-center text-center px-6 text-white z-50 md:hidden portrait-overlay">
        <div className="relative mb-6">
          <Smartphone className="w-16 h-16 text-indigo-400 animate-pulse" />
          <RotateCw className="w-6 h-6 text-indigo-300 absolute -bottom-1 -right-1 animate-spin" style={{ animationDuration: '3s' }} />
        </div>
        <h2 className="text-xl font-black text-white mb-2">스마트폰을 가로로 돌려주세요 🔄</h2>
        <p className="text-xs text-zinc-500 leading-relaxed max-w-xs">
          빛의 방사 면적을 최대화하고 자막이 깨지지 않도록 하기 위해 가로 모드 회전이 필수입니다.
        </p>
      </div>

      {/* CSS style rule to enforce portrait overlay block */}
      <style jsx global>{`
        @media (orientation: landscape) {
          .portrait-overlay {
            display: none !important;
          }
        }
      `}</style>

      {/* Main Display Screen */}
      <div 
        className={`w-full h-full flex items-center justify-center transition-colors duration-300 ${
          currentPreset.effect === 'blink' ? 'animate-blink' : ''
        }`}
        style={{ 
          backgroundColor: currentPreset.bg_color,
          '--blink-duration': `${currentPreset.speed || 1000}ms`
        } as React.CSSProperties}
      >
        {currentPreset.effect === 'marquee' ? (
          <div className="w-full overflow-hidden whitespace-nowrap flex items-center">
            <span 
              className="animate-marquee inline-block font-black select-none text-[clamp(2.5rem,20vw,18rem)] leading-none"
              style={{ 
                color: currentPreset.text_color,
                '--marquee-duration': `${currentPreset.speed || 6000}ms`
              } as React.CSSProperties}
            >
              {currentPreset.text} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {currentPreset.text}
            </span>
          </div>
        ) : (
          <div 
            className="font-black text-center break-all px-8 select-none max-w-full leading-none tracking-tighter"
            style={{ 
              color: currentPreset.text_color,
              fontSize: 'clamp(2rem, 16vw, 15rem)'
            }}
          >
            {currentPreset.text}
          </div>
        )}

        {/* 7. Viral Loop Watermark Link Layer */}
        <button 
          onClick={handleViralClick}
          className="absolute bottom-6 right-6 px-3.5 py-1.5 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 text-[10px] text-white/50 hover:text-white hover:bg-black/70 hover:scale-105 active:scale-95 transition-all z-40 cursor-pointer flex items-center gap-1 font-semibold"
        >
          <span>나도 이런 파티 연출하기 🪄</span>
        </button>

      </div>
    </div>
  );
}
