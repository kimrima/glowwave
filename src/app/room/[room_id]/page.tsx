'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  RotateCw, 
  Smartphone, 
  Loader2,
  Lock,
  WifiOff
} from 'lucide-react';
import { Preset } from '@/lib/types';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import useFitText from '@/hooks/useFitText';

export default function AudienceRoom() {
  const params = useParams();
  const router = useRouter();
  const rawRoomId = params.room_id as string;
  const roomId = rawRoomId ? rawRoomId.toUpperCase() : '';

  const [showSafariTip, setShowSafariTip] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

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
      default:
        return 'font-sign-sans-thin font-bold';
    }
  };

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
    }, 3000);
  };

  // Current Signboard Display State
  const [currentPreset, setCurrentPreset] = useState<Preset>({
    bg_color: '#0B0B0F',
    text: '연결 중...',
    text_color: '#FFFFFF',
    effect: 'none',
    speed: 1000
  });

  // Countdown timer state
  const [countdownVal, setCountdownVal] = useState<number | string>(currentPreset.countdown_seconds || 10);

  // Trigger countdown timer decrement when currentPreset effect is set to countdown
  useEffect(() => {
    if (currentPreset.effect === 'countdown') {
      const startSec = currentPreset.countdown_seconds || 10;
      setCountdownVal(startSec);
      const timer = setInterval(() => {
        setCountdownVal((prev) => {
          if (typeof prev === 'number') {
            if (prev <= 1) {
              return currentPreset.result_text || 'START';
            }
            return prev - 1;
          }
          return prev;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [currentPreset.text, currentPreset.effect, currentPreset.countdown_seconds, currentPreset.result_text, currentPreset.trigger_id]);

  // Persistent Client Audience UUID
  const [audienceUuid, setAudienceUuid] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      let uuid = localStorage.getItem('glowwave_audience_uuid');
      if (!uuid) {
        uuid = 'x-xxxx-xxxx-xxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
        localStorage.setItem('glowwave_audience_uuid', uuid);
      }
      setAudienceUuid(uuid);
    }
  }, []);

  const isCountdown = currentPreset.effect === 'countdown';
  const isLuckyDraw = currentPreset.effect === 'luckydraw';
  const isLuckyDrawWait = currentPreset.effect === 'luckydraw_wait';
  const isWinner = isLuckyDraw && currentPreset.lucky_draw_winner_id === audienceUuid;

  // Compute text to display on screen
  const displayText = isCountdown 
    ? String(countdownVal) 
    : isLuckyDrawWait
      ? '추첨 대기 중'
      : isLuckyDraw
        ? (isWinner ? (currentPreset.text || '👑 축하합니다! 당첨!') : (currentPreset.result_text || '아쉽네요! 다음 기회에..'))
        : currentPreset.text;

  // Use dynamic fitting hook to sync text sizes proportional to viewport container clientWidth/clientHeight
  const { containerRef, fontSize } = useFitText(
    displayText,
    currentPreset.effect,
    currentPreset.font_size || 100
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isHardCapped, setIsHardCapped] = useState(false);
  const [isRoomInactive, setIsRoomInactive] = useState(false);
  const [isIOSUserAndNotStandalone, setIsIOSUserAndNotStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

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
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);
    const isStandalone = (window.navigator as any).standalone === true || window.matchMedia('(display-mode: standalone)').matches;
    if (ios) {
      setShowSafariTip(true);
      if (!isStandalone) {
        setIsIOSUserAndNotStandalone(true);
      }
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
      setShowSafariTip(true);
    }
  };

  const validateAndConnect = async (isReconnect = false) => {
    if (!roomId) return;
    if (!isReconnect) setLoading(true);

    try {
      const response = await fetch(`/api/room/${roomId}/status`);
      if (!response.ok) {
        if (isReconnect && response.status >= 500) {
          console.warn('[Room] Reconnect status check returned server error:', response.status);
          return;
        }

        let errorMsg = '방 정보를 불러오는 과정에서 오류가 발생했습니다.';
        try {
          const errData = await response.json();
          if (errData.suggestion) {
            errorMsg = errData.suggestion;
          } else if (response.status === 404) {
            errorMsg = '존재하지 않거나 만료된 방 번호입니다. 방은 생성 후 24시간 동안만 유지됩니다.';
          }
        } catch (e) {}
        
        setError(errorMsg);
        if (response.status === 404 && typeof window !== 'undefined') {
          localStorage.removeItem('glowwave_last_joined_room_id');
        }
        setLoading(false);
        return;
      }

      const roomData = await response.json();
      
      if (roomData.current_state) {
        setCurrentPreset(roomData.current_state);
      }
      
      if (roomData.status !== 'active') {
        setIsRoomInactive(true);
        setLoading(false);
        return;
      }
      setIsRoomInactive(false);

      if (!isReconnect && roomData.current_participants >= roomData.max_participants) {
        setIsHardCapped(true);
        setLoading(false);
        return;
      }
      setIsHardCapped(false);

      if (typeof window !== 'undefined') {
        localStorage.setItem('glowwave_last_joined_room_id', roomId);
      }

      if (!isReconnect) {
        connectRealtime(roomId);
        requestWakeLock();
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      if (isReconnect) {
        console.warn('[Room] Reconnect network check failed. Ignoring to let sockets/streams retry.');
        return;
      }
      setError('네트워크 상태를 확인해 주세요.');
      setLoading(false);
    }
  };

  const connectRealtime = (roomCode: string) => {
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
            channel.track({ role: 'audience', uuid: audienceUuid, joined_at: new Date().toISOString() });
          }
        });
        
      supabaseChannelRef.current = channel;
    } else {
      console.log('[Room] Connecting to Local SSE Stream');
      const eventSource = new EventSource(`/api/room/${roomCode}/stream?role=audience&uuid=${audienceUuid}`);
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
      };
    }
  };

  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        console.log('[WakeLock] Screen Wake Lock is active');
      } catch (err: any) {
        console.warn(`[WakeLock] Failed to lock screen sleep: ${err.message}`);
      }
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

  useEffect(() => {
    if (audienceUuid) {
      validateAndConnect();
    }

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        await requestWakeLock();
        if (roomId && audienceUuid) {
          validateAndConnect(true);
          connectRealtime(roomId);
        }
      } else {
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
  }, [roomId, audienceUuid]);

  const handleViralClick = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('glowwave_referred_discount', 'true');
      document.cookie = "glowwave_referred_discount=true; max-age=604800; path=/";
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

  if (isHardCapped) {
    return (
      <div className="fixed inset-0 bg-[#0B0B0F] flex items-center justify-center px-6 text-center text-white z-50">
        <div className="glass-effect p-8 rounded-2xl max-w-sm border border-yellow-500/20">
          <Lock className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-lg font-extrabold text-white mb-2">접속 인원 제한 초과</h2>
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
      
      {/* Landscape forced Warning overlay */}
      <div className="fixed inset-0 bg-[#0B0B0F] flex flex-col justify-center items-center text-center px-6 text-white z-50 md:hidden portrait-overlay">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            router.push('/');
          }}
          className="absolute top-6 left-6 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[11px] font-extrabold text-zinc-300 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1.5 cursor-pointer z-50"
        >
          &larr; 뒤로가기
        </button>
        <div className="relative mb-6">
          <Smartphone className="w-16 h-16 text-indigo-400 animate-pulse" />
          <RotateCw className="w-6 h-6 text-indigo-300 absolute -bottom-1 -right-1 animate-spin" style={{ animationDuration: '3s' }} />
        </div>
        <h2 className="text-xl font-black text-white mb-2">스마트폰을 가로로 돌려주세요</h2>
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

      {/* Floating Control Toolbar */}
      <div className={`absolute top-6 left-6 z-40 flex items-center gap-2 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFullscreen();
          }}
          className="px-3.5 py-2 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 text-[10px] text-white/80 hover:text-white hover:bg-black/70 transition-all font-bold cursor-pointer"
        >
          {isFullscreen ? '화면 축소' : '전체화면 전환'}
        </button>
        {isIOS && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowSafariTip(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 text-[10px] text-white/80 hover:text-white hover:bg-black/70 transition-all font-bold cursor-pointer"
          >
            아이폰 사파리 팁
          </button>
        )}
      </div>

      {/* iOS Safari Home Screen Tooltip */}
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
            아이폰 사파리 브라우저는 기본 주소창과 탭이 숨겨지지 않습니다. 아래 방법으로 앱처럼 실행하시면 완벽한 전체화면으로 이용 가능합니다.
          </p>
          <div className="bg-white/5 rounded-xl p-3 text-[10px] flex flex-col gap-2 text-zinc-400 leading-normal border border-white/5">
            <div>1. 사파리 화면 하단 [공유 버튼]을 누릅니다.</div>
            <div>2. 목록 중 [홈 화면에 추가]를 클릭합니다.</div>
            <div>3. 바탕화면에 설치된 아이콘을 눌러 실행하면 완벽한 전체화면 앱으로 구동됩니다.</div>
          </div>
        </div>
      )}

      {/* Main Display Screen */}
      <div 
        key={currentPreset.trigger_id || 'audience'}
        ref={containerRef}
        className={`w-full h-full flex items-center justify-center transition-colors duration-300 ${
          isDuoSiren ? 'animate-siren' : currentPreset.effect === 'blink' ? 'animate-blink' : ''
        } ${
          isWinner ? 'animate-blink' : ''
        }`}
        style={{ 
          backgroundColor: isWinner ? '#FFD700' : isLuckyDraw ? '#0B0B0F' : isLuckyDrawWait ? '#0B0B0F' : currentPreset.bg_color,
          border: isLuckyDrawWait ? '8px solid #FFD700' : 'none',
          '--blink-duration': isWinner ? '150ms' : `${currentPreset.speed || 1000}ms`,
          '--siren-color-1': currentPreset.bg_color,
          '--siren-color-2': currentPreset.bg_color_secondary || '#3B82F6'
        } as React.CSSProperties}
      >
        {currentPreset.effect === 'marquee' ? (
          <div className="w-full overflow-hidden whitespace-nowrap flex items-center">
            <span 
              className={`animate-marquee inline-block select-none leading-none ${getFontFamilyClass(currentPreset.font_family)}`}
              style={{ 
                color: currentPreset.text_color,
                fontSize,
                '--marquee-duration': `${currentPreset.speed || 6000}ms`
              } as React.CSSProperties}
            >
              {displayText} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {displayText}
            </span>
          </div>
        ) : (
          <div 
            className={`text-center whitespace-nowrap overflow-hidden px-8 select-none max-w-full leading-none tracking-tighter ${getFontFamilyClass(currentPreset.font_family)}`}
            style={{ 
              color: isWinner ? '#000000' : isLuckyDraw ? '#F3F4F6' : isLuckyDrawWait ? '#FFD700' : currentPreset.text_color,
              fontSize,
              zIndex: 10,
              animation: isLuckyDrawWait ? 'preset-card-pulse 1.2s ease-in-out infinite' : undefined
            }}
          >
            {displayText}
          </div>
        )}

        {/* Floating high-tension warning overlay on Waiting */}
        {isLuckyDrawWait && (
          <div className="absolute top-[20%] text-center text-xs tracking-widest text-[#FFD700] uppercase font-bold font-outfit animate-pulse">
            R A F F L E &nbsp; I N &nbsp; P R O G R E S S
          </div>
        )}

        {/* Viral Referral Watermark Link Layer */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            handleViralClick();
          }}
          className={`absolute bottom-6 right-6 px-3.5 py-1.5 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 text-[10px] text-white/50 hover:text-white hover:bg-black/70 hover:scale-105 active:scale-95 transition-all z-40 cursor-pointer flex items-center gap-1 font-semibold duration-500 ${
            showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
        >
          <span>나도 이런 파티 연출하기</span>
        </button>

      </div>

      {/* Initial entry user activation overlay */}
      {showEnterOverlay && (
        <div className="fixed inset-0 bg-[#030305] z-50 flex flex-col justify-center items-center text-center px-6 text-white bg-grid-pattern relative overflow-hidden">
          {/* Background Aura Spheres */}
          <div className="absolute top-[20%] left-[-15%] w-[60vw] h-[60vw] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse z-0 pointer-events-none" style={{ animationDuration: '6s' }} />
          <div className="absolute bottom-[20%] right-[-15%] w-[50vw] h-[50vw] bg-purple-500/10 blur-[120px] rounded-full animate-pulse z-0 pointer-events-none" style={{ animationDuration: '8s' }} />
          
          <div className="relative z-10 flex flex-col justify-center items-center">
          
          <div className="relative mb-6">
            <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center font-bold text-white text-lg">GW</div>
          </div>
          
          <h2 className="text-xl font-black text-white mb-2">전광판 동기화 준비 완료</h2>
          
          {isIOSUserAndNotStandalone ? (
            <div className="glass-effect p-6 rounded-2xl max-w-sm border border-white/5 bg-[#12121a] mb-6 flex flex-col gap-4 text-left">
              <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                <Smartphone className="w-4.5 h-4.5" />
                <h3 className="font-bold text-xs text-white">아이폰(iOS) 전체화면 설정 권장</h3>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">
                아이폰 Safari 브라우저는 주소창과 메뉴바를 숨길 수 없어 일반 브라우저로 접속 시 전광판이 잘려 보입니다. 
                아래 순서대로 <b>'홈 화면에 추가'</b>하여 실행하시면 완벽한 전체화면 앱으로 이용 가능합니다.
              </p>
              <div className="bg-white/5 rounded-xl p-3 text-[10px] flex flex-col gap-2 text-zinc-300 leading-normal border border-white/5 font-medium">
                <div className="flex gap-1.5">
                  <span className="text-zinc-500 font-bold">1.</span>
                  <span>화면 하단 중앙의 <b>[공유 버튼]</b>을 클릭합니다.</span>
                </div>
                <div className="flex gap-1.5 border-t border-white/5 pt-1.5">
                  <span className="text-zinc-500 font-bold">2.</span>
                  <span>메뉴 중 <b>[홈 화면에 추가]</b>를 선택합니다.</span>
                </div>
                <div className="flex gap-1.5 border-t border-white/5 pt-1.5">
                  <span className="text-zinc-500 font-bold">3.</span>
                  <span>바탕화면에 생성된 <b>GlowWave 아이콘</b>으로 재접속해 주세요.</span>
                </div>
              </div>
              <p className="text-[9px] text-zinc-500 text-center font-medium">
                ※ 홈 화면에 추가하지 않고 그냥 브라우저로 이용하려면 아래 버튼을 누르세요.
              </p>
            </div>
          ) : (
            <p className="text-xs text-zinc-500 leading-relaxed max-w-xs mb-8">
              아래 [입장하기] 버튼을 누르면 전광판 화면이 시작되며 가로 전체화면 모드 및 화면 켜짐 유지가 실행됩니다.
            </p>
          )}
          
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
            입장하기
          </button>
        </div>
      </div>
      )}
    </div>
  );
}
