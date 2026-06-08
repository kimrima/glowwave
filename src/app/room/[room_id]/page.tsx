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

  // Container ref for Fullscreen API
  const containerRef = useRef<HTMLDivElement>(null);
  const [showSafariTip, setShowSafariTip] = useState(false); // Hide by default, show on click or first load
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Immersive UI and auto-hide states
  const [showEnterOverlay, setShowEnterOverlay] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const controlsTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetControlsTimer = () => {
    setShowControls(true);
    if (controlsTimerRef.current) {
      clearTimeout(controlsTimerRef.current);
    }
    controlsTimerRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000); // 3 seconds inactivity threshold
  };

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

  // Fullscreen Change Listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    // Automatically show Safari hint to iOS users on first render
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIOS) {
      setShowSafariTip(true);
    }

    resetControlsTimer();

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current);
      }
    };
  }, []);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn('Fullscreen API block:', err);
      // Fallback hint
      setShowSafariTip(true);
    }
  };

  // 1. Initial Room Validations (Existence, Activation, Hard Cap limits)
  const validateAndConnect = async (isReconnect = false) => {
    if (!roomId) return;
    if (!isReconnect) setLoading(true);

    try {
      const response = await fetch(`/api/room/${roomId}/status`);
      if (!response.ok) {
        if (response.status === 404) {
          setError('존재하지 않거나 만료된 방 번호입니다. 방은 생성 후 24시간 동안만 유지됩니다.');
          if (typeof window !== 'undefined') {
            localStorage.removeItem('glowwave_last_joined_room_id');
          }
        } else {
          setError('방 정보를 불러오는 과정에서 오류가 발생했습니다.');
        }
        setLoading(false);
        return;
      }

      const roomData = await response.json();
      
      if (roomData.current_state) {
        setCurrentPreset(roomData.current_state);
      }
      
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

      // Save to localStorage for recovery/re-entry
      if (typeof window !== 'undefined') {
        localStorage.setItem('glowwave_last_joined_room_id', roomId);
      }

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
            // Track presence as role=audience so host can filter and count
            channel.track({ role: 'audience', joined_at: new Date().toISOString() });
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
          } else if (data.event === 'room_expired') {
            setError('이 방은 생성 후 24시간이 지나 만료되었습니다.');
            if (typeof window !== 'undefined') {
              localStorage.removeItem('glowwave_last_joined_room_id');
            }
            setLoading(false);
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
    <div 
      ref={containerRef} 
      className="fixed inset-0 overflow-hidden select-none bg-black cursor-none"
      onClick={resetControlsTimer}
      onMouseMove={resetControlsTimer}
      onTouchStart={resetControlsTimer}
    >
      
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

      {/* Floating Control Toolbar with Auto-Hide transition */}
      <div className={`absolute top-6 left-6 z-40 flex items-center gap-2 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFullscreen();
          }}
          className="px-3.5 py-2 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 text-[10px] text-white/80 hover:text-white hover:bg-black/70 transition-all font-bold cursor-pointer"
        >
          {isFullscreen ? '화면 축소 📱' : '전체화면 전환 📺'}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowSafariTip(true);
          }}
          className="px-3.5 py-2 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 text-[10px] text-white/80 hover:text-white hover:bg-black/70 transition-all font-bold cursor-pointer"
        >
          아이폰 사파리 팁 💡
        </button>
      </div>

      {/* iOS Safari Home Screen Tooltip with Auto-Hide transition */}
      {showSafariTip && (
        <div className={`fixed top-6 left-6 right-6 md:left-auto md:w-80 bg-black/95 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-xs text-zinc-300 shadow-2xl z-50 animate-in fade-in slide-in-from-top-4 duration-200 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-indigo-400" />
              아이폰 Safari 전체화면 팁
            </span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowSafariTip(false);
              }} 
              className="text-zinc-500 hover:text-white font-bold font-mono text-sm px-1.5"
            >
              ×
            </button>
          </div>
          <p className="leading-relaxed mb-3 text-zinc-400">
            아이폰 사파리 브라우저는 기본 주소창과 탭이 숨겨지지 않습니다. 아래 방법으로 앱처럼 실행하시면 완벽한 전체화면으로 이용 가능합니다!
          </p>
          <div className="bg-white/5 rounded-xl p-3 text-[10px] flex flex-col gap-2 text-zinc-400 leading-normal border border-white/5">
            <div>1. 사파리 화면 하단 **[공유 버튼 📤]**을 누릅니다.</div>
            <div>2. 목록 중 **[홈 화면에 추가 ➕]**를 클릭합니다.</div>
            <div>3. 바탕화면에 설치된 **아이콘**을 눌러 실행하면 완벽한 전체화면 앱으로 구동됩니다!</div>
          </div>
        </div>
      )}

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
              className={`animate-marquee inline-block font-black select-none leading-none ${
                currentPreset.font_family === 'neon' ? 'font-neon' : currentPreset.font_family === 'dot' ? 'font-dot' : ''
              }`}
              style={{ 
                color: currentPreset.text_color,
                fontFamily: currentPreset.font_family === 'serif' ? 'Georgia, serif' : undefined,
                fontSize: currentPreset.font_size === 'small' ? 'clamp(1rem, 7vw, 5rem)'
                        : currentPreset.font_size === 'medium' ? 'clamp(1.5rem, 11vw, 9rem)'
                        : currentPreset.font_size === 'large' ? 'clamp(2rem, 18vw, 16rem)'
                        : currentPreset.font_size === 'huge' ? 'clamp(3rem, 24vw, 22rem)'
                        : 'clamp(2.5rem,20vw,18rem)', // auto default
                '--marquee-duration': `${currentPreset.speed || 6000}ms`
              } as React.CSSProperties}
            >
              {currentPreset.text} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {currentPreset.text}
            </span>
          </div>
        ) : (
          <div 
            className={`font-black text-center break-all px-8 select-none max-w-full leading-none tracking-tighter ${
              currentPreset.font_family === 'neon' ? 'font-neon' : currentPreset.font_family === 'dot' ? 'font-dot' : ''
            }`}
            style={{ 
              color: currentPreset.text_color,
              fontFamily: currentPreset.font_family === 'serif' ? 'Georgia, serif' : undefined,
              fontSize: currentPreset.font_size === 'small' ? 'clamp(1rem, 7vw, 5rem)'
                      : currentPreset.font_size === 'medium' ? 'clamp(1.5rem, 11vw, 9rem)'
                      : currentPreset.font_size === 'large' ? 'clamp(2rem, 18vw, 16rem)'
                      : currentPreset.font_size === 'huge' ? 'clamp(3rem, 24vw, 22rem)'
                      : 'clamp(2rem, 16vw, 15rem)' // auto default
            }}
          >
            {currentPreset.text}
          </div>
        )}

        {/* 7. Viral Loop Watermark Link Layer */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            handleViralClick();
          }}
          className="absolute bottom-6 right-6 px-3.5 py-1.5 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 text-[10px] text-white/50 hover:text-white hover:bg-black/70 hover:scale-105 active:scale-95 transition-all z-40 cursor-pointer flex items-center gap-1 font-semibold"
        >
          <span>나도 이런 파티 연출하기 🪄</span>
        </button>

      </div>

      {/* 8. Initial entry user activation overlay for Fullscreen & WakeLock support */}
      {showEnterOverlay && (
        <div className="fixed inset-0 bg-[#0B0B0F] z-50 flex flex-col justify-center items-center text-center px-6 text-white">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />
          
          <div className="relative mb-6 animate-pulse">
            <Sparkles className="w-12 h-12 text-indigo-400" />
          </div>
          
          <h2 className="text-xl font-bold text-white mb-2">전광판 동기화 준비 완료</h2>
          <p className="text-xs text-zinc-500 leading-relaxed max-w-xs mb-8">
            아래 [입장하기] 버튼을 누르면 전광판 화면이 시작되며 가로 전체화면 모드 및 화면 켜짐 유지가 실행됩니다.
          </p>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowEnterOverlay(false);
              toggleFullscreen();
              requestWakeLock();
              resetControlsTimer();
            }}
            className="px-8 py-4 rounded-xl bg-white text-black font-extrabold text-sm hover:bg-zinc-200 transition-all shadow-xl hover:shadow-white/10 flex items-center gap-1.5 cursor-pointer"
          >
            입장하기 ⚡
          </button>
        </div>
      )}
    </div>
  );
}
