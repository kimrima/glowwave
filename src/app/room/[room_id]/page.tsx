'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
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
    const loc = currentPreset?.locale || 'ko';
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
    requestWakeLock();
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

  // Memoized special effect particles to avoid re-generating random attributes on every render
  const specialEffectParticles = useMemo(() => {
    const effect = currentPreset.special_effect;
    if (!effect || effect === 'none') return [];
    
    const count = effect === 'stars' ? 35 : effect === 'confetti' ? 45 : 30; // Hearts: 30, Stars: 35, Confetti: 45
    const particles = [];
    
    for (let i = 0; i < count; i++) {
      if (effect === 'hearts') {
        particles.push({
          id: i,
          left: `${Math.random() * 100}%`,
          fontSize: `${18 + Math.random() * 26}px`,
          delay: `${Math.random() * 6}s`,
          duration: `${4 + Math.random() * 5}s`,
          sway: `${2 + Math.random() * 3}s`,
          color: ['#EF4444', '#EC4899', '#F472B6', '#F43F5E', '#D946EF'][Math.floor(Math.random() * 5)]
        });
      } else if (effect === 'confetti') {
        particles.push({
          id: i,
          left: `${Math.random() * 100}%`,
          fontSize: `${12 + Math.random() * 20}px`,
          delay: `${Math.random() * 5}s`,
          duration: `${3 + Math.random() * 4}s`,
          sway: `${1.5 + Math.random() * 2}s`,
          color: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#14B8A6'][Math.floor(Math.random() * 7)]
        });
      } else if (effect === 'stars') {
        particles.push({
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
    return particles;
  }, [currentPreset.special_effect]);

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
  const isWinner = isLuckyDraw && (
    currentPreset.lucky_draw_winner_id === audienceUuid ||
    (currentPreset.lucky_draw_winner_ids && currentPreset.lucky_draw_winner_ids.includes(audienceUuid))
  );
  const isBlink = currentPreset.effect === 'blink';
  const isDuoSiren = (isBlink && !!currentPreset.bg_color_secondary) || isWinner;

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

  // Passcode States
  const [passcodeLocked, setPasscodeLocked] = useState(false);
  const [enteredPasscode, setEnteredPasscode] = useState('');
  const [passcodeChecking, setPasscodeChecking] = useState(false);
  const [passcodeErrorMsg, setPasscodeErrorMsg] = useState('');
  const [wakeLockError, setWakeLockError] = useState(false);
  const [showLowPowerToast, setShowLowPowerToast] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isHardCapped, setIsHardCapped] = useState(false);
  const [isRoomInactive, setIsRoomInactive] = useState(false);
  const [isIOSUserAndNotStandalone, setIsIOSUserAndNotStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isChromeIOS, setIsChromeIOS] = useState(false);

  // Technical Refs for Wake Lock & Real-time
  const wakeLockRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const supabaseChannelRef = useRef<any>(null);
  const fullscreenRef = useRef<HTMLDivElement>(null);

  // Fullscreen Change Listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    // Check iOS and Standalone Mode on first render
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);
    const isChrome = /CriOS/i.test(navigator.userAgent);
    setIsChromeIOS(isChrome);
    const isStandaloneMode = (window.navigator as any).standalone === true || window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(isStandaloneMode);
    
    if (ios) {
      if (!isStandaloneMode) {
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
    if (!fullscreenRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await fullscreenRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
      // Re-request wake lock since entering/exiting fullscreen can reset it
      setTimeout(() => {
        requestWakeLock();
      }, 300);
    } catch (err) {
      console.warn('Fullscreen API block:', err);
      setShowSafariTip(true);
    }
  };

  const handlePasscodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enteredPasscode) return;
    setPasscodeChecking(true);
    setPasscodeErrorMsg('');

    try {
      const response = await fetch(`/api/room/${roomId}/verify-passcode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: enteredPasscode })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '비밀번호가 올바르지 않습니다.');
      }

      // Success
      if (typeof window !== 'undefined') {
        localStorage.setItem(`glowwave_passcode_${roomId}`, enteredPasscode);
      }
      setPasscodeLocked(false);
      
      // Load and connect
      connectRealtime(roomId, enteredPasscode);
      requestWakeLock();
    } catch (err: any) {
      console.error(err);
      setPasscodeErrorMsg(err.message || '인증 실패');
    } finally {
      setPasscodeChecking(false);
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

      // Verify Passcode if room is password-locked
      let verifiedPass = '';
      if (roomData.has_passcode) {
        const savedPass = localStorage.getItem(`glowwave_passcode_${roomId}`) || '';
        if (savedPass) {
          // Verify saved passcode
          const verifyRes = await fetch(`/api/room/${roomId}/verify-passcode`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ passcode: savedPass })
          });
          if (verifyRes.ok) {
            verifiedPass = savedPass;
            setPasscodeLocked(false);
          } else {
            // Saved passcode is invalid
            localStorage.removeItem(`glowwave_passcode_${roomId}`);
            setPasscodeLocked(true);
            setLoading(false);
            return;
          }
        } else {
          // No saved passcode
          setPasscodeLocked(true);
          setLoading(false);
          return;
        }
      } else {
        setPasscodeLocked(false);
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('glowwave_last_joined_room_id', roomId);
        
        // Add to recent rooms list
        try {
          const recentRaw = localStorage.getItem('glowwave_recent_rooms');
          let recents = recentRaw ? JSON.parse(recentRaw) : [];
          recents = recents.filter((r: any) => r.roomId !== roomId);
          recents.unshift({
            roomId: roomId,
            role: 'audience',
            createdAt: new Date().toISOString()
          });
          localStorage.setItem('glowwave_recent_rooms', JSON.stringify(recents.slice(0, 50)));
        } catch (e) {
          console.error('Failed to update recent rooms list:', e);
        }
      }

      if (!isReconnect) {
        connectRealtime(roomId, verifiedPass);
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

  const connectRealtime = (roomCode: string, validatedPasscode?: string) => {
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
      const passParam = validatedPasscode ? `&passcode=${encodeURIComponent(validatedPasscode)}` : '';
      const eventSource = new EventSource(`/api/room/${roomCode}/stream?role=audience&uuid=${audienceUuid}${passParam}`);
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
        if (wakeLockRef.current) {
          console.log('[WakeLock] Already active, skipping request');
          return;
        }
        const lock = await (navigator as any).wakeLock.request('screen');
        lock.addEventListener('release', () => {
          console.log('[WakeLock] Released by browser/system');
          wakeLockRef.current = null;
        });
        wakeLockRef.current = lock;
        console.log('[WakeLock] Screen Wake Lock is active');
        setWakeLockError(false);
        setShowLowPowerToast(false);
      } catch (err: any) {
        console.warn(`[WakeLock] Failed to lock screen sleep: ${err.message}`);
        if (!wakeLockRef.current) {
          setWakeLockError(true);
          setShowLowPowerToast(true);
        }
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

  // Toast timer auto-dismissal
  useEffect(() => {
    if (showLowPowerToast) {
      const timer = setTimeout(() => {
        setShowLowPowerToast(false);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [showLowPowerToast]);

  // Robust interaction-based wake lock re-requesting
  useEffect(() => {
    const handleGesture = () => {
      requestWakeLock();
      if (videoRef.current) {
        videoRef.current.play().catch((err) => {
          console.warn('[WakeLock] iOS video sleep prevention loop playback blocked:', err);
        });
      }
    };
    window.addEventListener('click', handleGesture);
    window.addEventListener('touchstart', handleGesture);
    return () => {
      window.removeEventListener('click', handleGesture);
      window.removeEventListener('touchstart', handleGesture);
    };
  }, []);

  useEffect(() => {
    if (audienceUuid) {
      validateAndConnect();
    }

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        await requestWakeLock();
        if (videoRef.current) {
          videoRef.current.play().catch(() => {});
        }
        if (roomId && audienceUuid) {
          const cachedPass = typeof window !== 'undefined' ? localStorage.getItem(`glowwave_passcode_${roomId}`) || '' : '';
          validateAndConnect(true);
          connectRealtime(roomId, cachedPass);
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

  if (passcodeLocked) {
    return (
      <div className="fixed inset-0 bg-[#0B0B0F] flex items-center justify-center px-6 text-center text-white z-50">
        <form onSubmit={handlePasscodeSubmit} className="glass-effect p-8 rounded-3xl max-w-sm w-full border border-white/5 flex flex-col gap-6 bg-[#12121a]">
          <div className="flex flex-col gap-2">
            <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
              <Lock className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black text-white mt-2">비밀번호가 필요한 방입니다</h2>
            <p className="text-xs text-zinc-400 leading-relaxed font-semibold">
              이 방은 입장 비밀번호 보안이 활성화되어 있습니다.<br />
              방장이 제공한 숫자 4~6자리 비밀번호를 입력해 주세요.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <input
              type="password"
              pattern="[0-9]*"
              inputMode="numeric"
              value={enteredPasscode}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                if (val.length <= 6) {
                  setEnteredPasscode(val);
                  setPasscodeErrorMsg('');
                }
              }}
              placeholder="숫자 비밀번호 입력"
              className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3.5 text-center text-white tracking-widest text-base font-black focus:outline-none focus:border-indigo-500 uppercase font-mono"
              maxLength={6}
              disabled={passcodeChecking}
              autoFocus
            />
            {passcodeErrorMsg && (
              <p className="text-xs text-red-500 font-bold mt-1">{passcodeErrorMsg}</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="flex-1 py-3.5 rounded-xl bg-white/5 text-zinc-400 font-bold hover:bg-white/10 hover:text-white transition-all text-xs border border-white/5 cursor-pointer"
            >
              홈으로 가기
            </button>
            <button
              type="submit"
              disabled={passcodeChecking || enteredPasscode.length < 4}
              className="flex-1 py-3.5 rounded-xl bg-white text-black font-extrabold text-xs hover:bg-zinc-200 transition-all disabled:opacity-50 cursor-pointer"
            >
              {passcodeChecking ? '검증 중...' : '입장하기'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Define a local reference to roomData if needed, but since roomData was block scoped in validateAndConnect, we use a fallback label.
  return (
    <div 
      ref={fullscreenRef} 
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
          className="absolute top-[calc(env(safe-area-inset-top,0px)+24px)] left-6 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[11px] font-extrabold text-zinc-300 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1.5 cursor-pointer z-50"
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
      <div className={`absolute top-[calc(env(safe-area-inset-top,0px)+24px)] left-6 z-40 flex flex-wrap items-center gap-2 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {!isStandalone && (
          !isIOS ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFullscreen();
              }}
              className="px-3.5 py-2 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 text-[10px] text-white/80 hover:text-white hover:bg-black/70 transition-all font-bold cursor-pointer"
            >
              {isFullscreen ? '화면 축소' : '전체화면 전환'}
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowSafariTip(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 text-[10px] text-white/80 hover:text-white hover:bg-black/70 transition-all font-bold cursor-pointer"
            >
              아이폰 전체화면 가이드
            </button>
          )
        )}
        {wakeLockError && (
          <span className="px-3.5 py-2 rounded-xl bg-amber-500/20 backdrop-blur-md border border-amber-500/30 text-[9px] text-amber-300 font-extrabold flex items-center gap-1.5 select-none shadow-lg animate-pulse">
            ⚠️ 저전력 모드로 인해 화면이 꺼질 수 있습니다.
          </span>
        )}
      </div>

      {/* iOS Safari/Chrome Home Screen Tooltip */}
      {showSafariTip && !isStandalone && (
        <div className={`fixed top-[calc(env(safe-area-inset-top,0px)+24px)] left-6 right-6 md:left-auto md:w-80 bg-black/95 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-xs text-zinc-300 shadow-2xl z-50 animate-in fade-in slide-in-from-top-4 duration-200 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-indigo-400" />
              {isChromeIOS ? '아이폰 Chrome 전체화면 팁' : '아이폰 Safari 전체화면 팁'}
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
          <p className="leading-relaxed mb-3 text-zinc-400 font-medium">
            {isChromeIOS 
              ? '아이폰 크롬 브라우저는 기본 주소창과 메뉴바가 숨겨지지 않습니다. 아래 방법으로 앱처럼 실행하시면 완벽한 전체화면으로 이용 가능합니다.'
              : '아이폰 사파리 브라우저는 기본 주소창과 탭이 숨겨지지 않습니다. 아래 방법으로 앱처럼 실행하시면 완벽한 전체화면으로 이용 가능합니다.'
            }
          </p>
          <div className="bg-white/5 rounded-xl p-3 text-[10px] flex flex-col gap-2 text-zinc-400 leading-normal border border-white/5 font-medium">
            {isChromeIOS ? (
              <>
                <div>1. 크롬 화면의 <b>[공유 버튼]</b>(우측 상단 주소창 옆 또는 하단 메뉴의 공유 아이콘)을 누릅니다.</div>
                <div>2. 목록 중 <b>[홈 화면에 추가]</b>를 클릭합니다.</div>
                <div>3. 바탕화면에 설치된 아이콘을 눌러 실행하면 완벽한 전체화면 앱으로 구동됩니다.</div>
              </>
            ) : (
              <>
                <div>1. 사파리 화면 하단 중앙의 <b>[공유 버튼]</b>(네모에서 위로 화살표가 나가는 모양)을 누릅니다.</div>
                <div>2. 목록 중 <b>[홈 화면에 추가]</b>를 클릭합니다.</div>
                <div>3. 바탕화면에 설치된 아이콘을 눌러 실행하면 완벽한 전체화면 앱으로 구동됩니다.</div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Main Display Screen */}
      <div 
        ref={containerRef}
        className={`w-full h-full flex items-center justify-center relative ${
          (isDuoSiren || currentPreset.effect === 'blink') ? '' : 'transition-colors duration-300'
        } ${
          isDuoSiren ? 'animate-siren' : currentPreset.effect === 'blink' ? 'animate-blink' : ''
        }`}
        style={{ 
          backgroundColor: currentPreset.blackout ? '#000000' : ((isLuckyDraw && !isWinner) ? '#0B0B0F' : (isDuoSiren ? undefined : currentPreset.bg_color)),
          border: (isLuckyDrawWait && !currentPreset.blackout) ? `8px solid ${currentPreset.bg_color_secondary || '#FFD700'}` : 'none',
          '--blink-duration': `${currentPreset.speed || 1000}ms`,
          '--siren-color-1': currentPreset.bg_color,
          '--siren-color-2': currentPreset.bg_color_secondary || '#FFD700'
        } as React.CSSProperties}
      >
        {/* Blackout Overlay to cover all texts, effects, and marquee */}
        {currentPreset.blackout && (
          <div className="absolute inset-0 bg-black z-50 pointer-events-none" />
        )}
        {/* Special Effects Particle Layer */}
        {currentPreset.special_effect && currentPreset.special_effect !== 'none' && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {specialEffectParticles.map((p) => {
              if (currentPreset.special_effect === 'hearts') {
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
              } else if (currentPreset.special_effect === 'confetti') {
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
              } else if (currentPreset.special_effect === 'stars') {
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

        {currentPreset.effect === 'marquee' ? (
          <div key={currentPreset.trigger_id} className="w-full overflow-hidden flex items-center whitespace-nowrap relative z-10 py-[2vh]">
            {/* Track 1 */}
            <div 
              className={`animate-marquee-seamless select-none leading-[1.2] flex shrink-0 gap-[4rem] pr-[4rem] ${getFontFamilyClass(currentPreset.font_family)}`}
              style={{ 
                color: currentPreset.text_color,
                fontSize,
                '--marquee-duration': `${currentPreset.speed || 6000}ms`
              } as React.CSSProperties}
            >
              <span>{displayText}</span>
              <span>{displayText}</span>
              <span>{displayText}</span>
              <span>{displayText}</span>
            </div>
            {/* Track 2 */}
            <div 
              className={`animate-marquee-seamless select-none leading-[1.2] flex shrink-0 gap-[4rem] pr-[4rem] ${getFontFamilyClass(currentPreset.font_family)}`}
              style={{ 
                color: currentPreset.text_color,
                fontSize,
                '--marquee-duration': `${currentPreset.speed || 6000}ms`
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
            className={`text-center whitespace-nowrap px-8 select-none max-w-full leading-[1.2] tracking-tighter relative z-10 ${getFontFamilyClass(currentPreset.font_family)}`}
            style={{ 
              color: currentPreset.text_color,
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
          <span>나만의 전광판 만들기(무료)</span>
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
          
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-[10px] text-amber-300 leading-normal max-w-xs text-left mb-6 font-semibold flex items-start gap-1.5 z-10 animate-in fade-in duration-200">
            <span className="shrink-0 mt-0.5">⚠️</span>
            <span>스마트폰의 <b>[저전력 모드]</b>가 켜져 있으면 화면 꺼짐 방지가 정상 작동하지 않습니다. 원활한 연출을 위해 저전력 모드를 해제해 주세요.</span>
          </div>
          
          {isIOSUserAndNotStandalone ? (
            <div className="glass-effect p-6 rounded-2xl max-w-sm border border-white/5 bg-[#12121a] mb-6 flex flex-col gap-4 text-left font-sans">
              <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                <Smartphone className="w-4.5 h-4.5" />
                <h3 className="font-bold text-xs text-white">아이폰(iOS) 전체화면 설정 권장</h3>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">
                {isChromeIOS 
                  ? '아이폰 크롬 브라우저는 주소창과 메뉴바를 숨길 수 없어 일반 브라우저로 접속 시 전광판이 잘려 보입니다. 아래 순서대로 홈 화면에 추가하여 실행하시면 완벽한 전체화면 앱으로 이용 가능합니다.'
                  : '아이폰 사파리 브라우저는 주소창과 메뉴바를 숨길 수 없어 일반 브라우저로 접속 시 전광판이 잘려 보입니다. 아래 순서대로 홈 화면에 추가하여 실행하시면 완벽한 전체화면 앱으로 이용 가능합니다.'
                }
              </p>
              <div className="bg-white/5 rounded-xl p-3 text-[10px] flex flex-col gap-2 text-zinc-300 leading-normal border border-white/5 font-medium">
                {isChromeIOS ? (
                  <>
                    <div className="flex gap-1.5">
                      <span className="text-zinc-500 font-bold">1.</span>
                      <span>크롬 화면의 <b>[공유 버튼]</b>(우측 상단 주소창 옆 또는 하단 메뉴의 공유 아이콘)을 클릭합니다.</span>
                    </div>
                    <div className="flex gap-1.5 border-t border-white/5 pt-1.5">
                      <span className="text-zinc-500 font-bold">2.</span>
                      <span>메뉴 목록 중 <b>[홈 화면에 추가]</b>를 선택합니다.</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex gap-1.5">
                      <span className="text-zinc-500 font-bold">1.</span>
                      <span>사파리 화면 하단 중앙의 <b>[공유 버튼]</b>(네모에 위 화살표 모양)을 클릭합니다.</span>
                    </div>
                    <div className="flex gap-1.5 border-t border-white/5 pt-1.5">
                      <span className="text-zinc-500 font-bold">2.</span>
                      <span>메뉴 목록 중 <b>[홈 화면에 추가]</b>를 선택합니다.</span>
                    </div>
                  </>
                )}
                <div className="flex gap-1.5 border-t border-white/5 pt-1.5">
                  <span className="text-zinc-500 font-bold">3.</span>
                  <span>바탕화면에 생성된 <b>GlowWave 아이콘</b>으로 재접속해 주세요.</span>
                </div>
              </div>
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 text-[9px] text-indigo-300 leading-normal font-bold">
                💡 이미 홈 화면에 GlowWave 앱을 추가하셨다면, 홈 화면에서 앱을 직접 실행하시고 입장 코드 <span className="text-white font-mono bg-white/10 px-1 rounded">{roomId}</span>를 입력하여 참여하시는 것이 가장 편리합니다!
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
              if (videoRef.current) {
                videoRef.current.play().catch((err) => {
                  console.warn('[WakeLock] Entry click video playback blocked:', err);
                });
              }
              resetControlsTimer();
            }}
            className="px-8 py-4 rounded-xl bg-white text-black font-extrabold text-sm hover:bg-zinc-200 transition-all shadow-xl hover:shadow-white/10 flex items-center gap-1.5 cursor-pointer"
          >
            입장하기
          </button>
        </div>
      </div>
      )}

      {/* Floating Low Power Mode Warning Toast */}
      {showLowPowerToast && (
        <div className="fixed top-[calc(env(safe-area-inset-top,0px)+16px)] left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm bg-amber-500/10 backdrop-blur-md border border-amber-500/20 rounded-2xl p-4 shadow-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="p-1 rounded-lg bg-amber-500/20 text-amber-300 shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1 text-left">
            <h4 className="text-xs font-bold text-amber-300">화면 꺼짐 안내</h4>
            <p className="text-[10px] text-zinc-300 font-medium leading-relaxed mt-0.5">
              기기의 <strong>저전력 모드</strong>가 켜져 있으면 화면이 꺼질 수 있습니다. 꺼짐 방지를 위해 설정을 해제해 주세요.
            </p>
          </div>
          <button 
            onClick={() => setShowLowPowerToast(false)}
            className="text-zinc-500 hover:text-white font-bold text-xs p-1"
          >
            ✕
          </button>
        </div>
      )}

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
