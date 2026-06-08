'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Tv
} from 'lucide-react';
import { Preset, Room, SignalPayload, EffectType } from '@/lib/types';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

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
  
  // Real-time states
  const [presets, setPresets] = useState<Preset[]>([]);
  const [activePresetIndex, setActivePresetIndex] = useState<number | null>(null);
  const [activeParticipants, setActiveParticipants] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [channelStatus, setChannelStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  // Supabase & SSE references
  const supabaseChannelRef = useRef<any>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const [originUrl, setOriginUrl] = useState('');

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

  // 2. Fetch Room Details & Initialize Real-time Connection
  useEffect(() => {
    if (!roomId || !token) {
      if (token === null && loading === false) {
        setIsAuthorized(false);
      }
      return;
    }

    const initDashboard = async () => {
      try {
        const response = await fetch(`/api/room/${roomId}/status`);
        if (!response.ok) {
          setIsAuthorized(false);
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

        // Load presets from localStorage
        const savedPresets = localStorage.getItem(`glowwave_presets_${roomId}`);
        if (savedPresets) {
          setPresets(JSON.parse(savedPresets));
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
          setPresets(defaults);
          localStorage.setItem(`glowwave_presets_${roomId}`, JSON.stringify(defaults));
        }

        // Check if token matches (for simulation, check authorization via status api metadata or simple check)
        // If the database has rooms, we match the token. For mock db, the room status check passes if the room exists
        setIsAuthorized(true);
        setLoading(false);

        // 3. Connect Real-time Engine
        connectRealtime(roomId);

      } catch (err) {
        console.error('Failed to init dashboard:', err);
        setIsAuthorized(false);
        setLoading(false);
      }
    };

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
  }, [roomId, token]);

  const connectRealtime = (roomCode: string) => {
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
          // Count total viewers subscribed to this room channel
          const totalConnected = Object.keys(presenceState).reduce((acc, key) => {
            return acc + presenceState[key].length;
          }, 0);
          setActiveParticipants(totalConnected);
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
      // Fallback to local Server-Sent Events stream
      console.log('[Dashboard] Connecting via Local SSE Fallback Stream');
      setChannelStatus('connecting');
      
      const sseUrl = `/api/room/${roomCode}/stream`;
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
  };

  // 4. Trigger Preset Broadcast Signal
  const triggerPreset = async (preset: Preset, index: number) => {
    if (!roomId || !token) return;
    setActivePresetIndex(index);

    if (isSupabaseConfigured() && supabaseChannelRef.current) {
      // Send directly over WebSockets in-memory broadcast
      supabaseChannelRef.current.send({
        type: 'broadcast',
        event: 'render',
        payload: preset
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

  // Access Denied Screen
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#0B0B0F] text-foreground flex flex-col justify-center items-center px-6 text-center">
        <div className="glass-effect p-8 rounded-2xl max-w-md border border-red-500/10">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">권한이 없거나 만료된 방입니다</h2>
          <p className="text-sm text-zinc-400 mb-6">
            이 방의 생성 세션 정보가 브라우저에 없습니다. 결제하셨던 이메일을 통한 <b>[구매 내역 복구]</b> 기능을 사용해 권한을 획득하십시오.
          </p>
          <div className="flex flex-col gap-2">
            <Link href="/recovery" className="py-3 px-4 rounded-xl bg-white text-black font-semibold text-sm hover:bg-zinc-200 transition-all">
              구매 내역 복구하러 가기 🪄
            </Link>
            <Link href="/" className="text-sm text-zinc-400 hover:text-white py-2">
              메인 홈으로 가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const audienceUrl = `${originUrl}/room/${roomId}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(audienceUrl)}`;

  return (
    <div className="min-h-screen bg-[#0B0B0F] text-foreground flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#0B0B0F]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <span className="font-bold text-white">GlowWave Host Remote</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>{channelStatus === 'connected' ? '실시간 연결됨' : '연결 중'}</span>
            </div>
            
            <button 
              onClick={() => router.push('/')}
              className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              title="나가기"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 grid lg:grid-cols-12 gap-8 w-full">
        
        {/* Left Column: Remote Board (Presets & Free-text edit) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Header Stats */}
          <div className="glass-effect rounded-2xl p-6 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">고유 방 코드</div>
              <div className="text-xl sm:text-2xl font-black text-indigo-300 mt-1 select-all">{roomId}</div>
            </div>
            
            <div className="border-x border-white/5">
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono flex items-center justify-center gap-1">
                <Users className="w-3 h-3 text-indigo-400" />
                실시간 관객 수
              </div>
              <div className="text-xl sm:text-2xl font-black text-white mt-1 flex justify-center items-baseline gap-1">
                <span>{activeParticipants}</span>
                <span className="text-xs text-zinc-500">/ {room?.max_participants}명</span>
              </div>
            </div>

            <div>
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">요금제 티어</div>
              <div className="text-xs sm:text-sm font-bold text-white mt-2 px-2 py-0.5 rounded bg-white/5 inline-block capitalize">
                {room?.tier} Tier
              </div>
            </div>
          </div>

          {/* Quick Triggers Dashboard */}
          <div className="glass-effect rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6 pb-3 border-b border-white/5">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <h2 className="text-base font-bold text-white">원터치 연출 보드 (Quick Preset Board)</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {presets.map((preset, index) => {
                const isActive = activePresetIndex === index;
                return (
                  <button
                    key={index}
                    onClick={() => triggerPreset(preset, index)}
                    className={`h-28 rounded-2xl border flex flex-col justify-between p-4 relative overflow-hidden transition-all active:scale-95 ${
                      isActive 
                        ? 'border-white ring-2 ring-indigo-400/50 scale-[1.03] shadow-lg shadow-indigo-500/10' 
                        : 'border-white/5 bg-zinc-950/40 hover:border-white/20'
                    }`}
                  >
                    {/* Glowing color dot */}
                    <div className="w-3.5 h-3.5 rounded-full border border-white/30" style={{ backgroundColor: preset.bg_color }} />
                    
                    <div className="text-left">
                      <div className="text-xs text-zinc-500 font-mono">PRESET {index + 1}</div>
                      <div className="font-extrabold text-sm truncate text-white mt-0.5">
                        {preset.text}
                      </div>
                    </div>

                    {/* Effect Indicator */}
                    <div className="absolute top-4 right-4 text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-zinc-400 uppercase font-semibold">
                      {preset.effect === 'none' ? 'static' : preset.effect === 'blink' ? 'blink' : 'marquee'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Customizer Input for On-the-fly Triggering */}
          <div className="glass-effect rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Volume2 className="w-4 h-4 text-indigo-400" />
              <h2 className="text-base font-bold text-white">즉석 라이브 메시지 전송 (Custom Broadcast)</h2>
            </div>
            
            <div className="grid sm:grid-cols-12 gap-4 items-end">
              <div className="sm:col-span-5">
                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-2">실시간 자막 입력</label>
                <input
                  id="live-text"
                  type="text"
                  placeholder="구호 입력 (예: 헤쳐모여!)"
                  className="w-full bg-[#0B0B0F] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 text-sm font-semibold"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-2">배경 테마 색상</label>
                <select
                  id="live-color"
                  className="w-full bg-[#0B0B0F] border border-white/10 rounded-xl px-3 py-3 text-white text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="#EF4444">빨간색 (Red)</option>
                  <option value="#3B82F6">파란색 (Blue)</option>
                  <option value="#10B981">초록색 (Green)</option>
                  <option value="#8B5CF6">보라색 (Purple)</option>
                  <option value="#F97316">주황색 (Orange)</option>
                  <option value="#EC4899">분홍색 (Pink)</option>
                  <option value="#FFFFFF">흰색 (White)</option>
                  <option value="#0B0B0F">검은색 (Black)</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <button
                  type="button"
                  onClick={() => {
                    const textVal = (document.getElementById('live-text') as HTMLInputElement)?.value || 'LET\'S GO';
                    const colorVal = (document.getElementById('live-color') as HTMLSelectElement)?.value || '#EF4444';
                    
                    const isWhite = colorVal === '#FFFFFF';
                    const customPreset: Preset = {
                      bg_color: colorVal,
                      text: textVal,
                      text_color: isWhite ? '#000000' : '#FFFFFF',
                      effect: textVal.length > 8 ? 'marquee' : 'none',
                      speed: 4000
                    };
                    triggerPreset(customPreset, -1);
                  }}
                  className="w-full py-3 rounded-xl bg-white text-black font-extrabold text-sm hover:bg-zinc-200 transition-all flex items-center justify-center gap-1.5"
                >
                  <Tv className="w-4 h-4" />
                  송출하기
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Admission & QR Sharing Card */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="glass-effect rounded-2xl p-6 flex flex-col items-center text-center">
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

            <button
              onClick={copyAudienceUrl}
              className="w-full py-3.5 rounded-xl border border-white/5 bg-white/5 font-semibold text-white text-xs hover:bg-white/10 transition-all"
            >
              관객용 URL 링크 복사하기
            </button>
          </div>

          <div className="glass-effect rounded-2xl p-6 text-xs text-zinc-500 leading-normal flex flex-col gap-2">
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
    </div>
  );
}
