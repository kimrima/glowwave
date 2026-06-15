'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Sparkles, Users, Tv, RefreshCw, AlertCircle, X, ShieldAlert } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export default function PresentationView() {
  const params = useParams();
  const router = useRouter();
  const rawRoomId = params.room_id as string;
  const roomId = rawRoomId ? rawRoomId.toUpperCase() : '';

  const [loading, setLoading] = useState(true);
  const [isValidRoom, setIsValidRoom] = useState<boolean | null>(null);
  const [activeParticipants, setActiveParticipants] = useState<number>(0);
  const [channelStatus, setChannelStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [originUrl, setOriginUrl] = useState('');
  const [passcode, setPasscode] = useState<string | null>(null);

  const supabaseChannelRef = useRef<any>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOriginUrl(window.location.origin);
    }
  }, []);

  useEffect(() => {
    if (!roomId) return;

    const verifyRoomAndConnect = async () => {
      try {
        const queryToken = new URLSearchParams(window.location.search).get('token');
        const localToken = localStorage.getItem(`glowwave_token_${roomId}`) || '';
        const token = queryToken || localToken;

        const response = await fetch(`/api/room/${roomId}/status?token=${token}`);
        if (!response.ok) {
          setIsValidRoom(false);
          setLoading(false);
          return;
        }

        const roomData = await response.json();
        setIsValidRoom(true);
        setPasscode(roomData.passcode || null);
        setLoading(false);

        // Connect real-time counter
        connectRealtime(roomId);

      } catch (err) {
        console.error('Failed to verify room:', err);
        setIsValidRoom(false);
        setLoading(false);
      }
    };

    verifyRoomAndConnect();

    return () => {
      if (supabaseChannelRef.current && supabase) {
        supabase.removeChannel(supabaseChannelRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [roomId]);

  const connectRealtime = (roomCode: string) => {
    if (isSupabaseConfigured() && supabase) {
      console.log('[Present] Connecting via Supabase Realtime Channel');
      setChannelStatus('connecting');

      const channel = supabase.channel(`room_${roomCode}`, {
        config: {
          broadcast: { self: true },
          presence: { key: 'presenter' }
        }
      });

      channel
        .on('presence', { event: 'sync' }, () => {
          const presenceState = channel.presenceState();
          let count = 0;
          Object.keys(presenceState).forEach((key) => {
            const presences = presenceState[key] as any[];
            presences.forEach((p) => {
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
            channel.track({ role: 'host', joined_at: new Date().toISOString() });
          } else {
            setChannelStatus('disconnected');
          }
        });
    } else {
      console.log('[Present] Connecting via Local SSE Fallback Stream');
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

  const handleClose = () => {
    if (typeof window !== 'undefined') {
      window.close();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0B0F] flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
          <p className="text-sm text-zinc-400 font-medium">안내 스크린 활성화 중...</p>
        </div>
      </div>
    );
  }

  if (!isValidRoom) {
    return (
      <div className="min-h-screen bg-[#0B0B0F] text-foreground flex flex-col justify-center items-center px-6 text-center">
        <div className="glass-effect p-8 rounded-2xl max-w-md border border-red-500/10">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">존재하지 않거나 만료된 방입니다</h2>
          <p className="text-sm text-zinc-400 mb-6">입력하신 방 코드의 활성 세션 정보를 찾을 수 없습니다.</p>
          <button 
            onClick={handleClose} 
            className="py-3 px-6 rounded-xl bg-white text-black font-semibold text-sm hover:bg-zinc-200 transition-all"
          >
            화면 닫기
          </button>
        </div>
      </div>
    );
  }

  const audienceUrl = `${originUrl}/room/${roomId}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(audienceUrl)}`;

  return (
    <div className="min-h-screen bg-[#0B0B0F] text-white flex flex-col justify-between p-6 relative overflow-hidden">
      {/* Background glowing decorations */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Header */}
      <header className="flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <span className="font-bold text-xl tracking-tight text-white">GlowWave</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>실시간 안내 송출 중</span>
          </div>
          
          <button 
            onClick={handleClose}
            className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
            title="화면 닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Presentation Area */}
      <main className="flex-1 flex flex-col items-center justify-center text-center my-6 z-10">
        <div className="glass-effect rounded-3xl p-8 max-w-lg w-full border border-white/10 shadow-2xl shadow-indigo-500/5 flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-1">
            <Tv className="w-8 h-8 text-indigo-400 mb-1" />
            <h1 className="text-2xl font-black tracking-tight text-white">관객 입장안내</h1>
            <p className="text-xs text-zinc-400">카메라로 아래 QR 코드를 스캔하여 전광판에 참여하세요!</p>
          </div>

          {/* QR Code */}
          <div className="bg-white p-5 rounded-3xl shadow-2xl relative group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={qrCodeUrl} 
              alt="Join QR Code" 
              className="w-64 h-64 sm:w-80 sm:h-80 rounded-2xl select-none mx-auto"
            />
          </div>

          {/* Room Code Display for Manual Entry */}
          <div className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 flex flex-col items-center justify-center gap-1 font-sans">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">QR 스캔이 잘 안 되거나 너무 먼 경우</span>
            <div className="flex flex-wrap items-center justify-center gap-4 my-1">
              <div className="flex items-center gap-2">
                <span className="text-3xl font-black text-indigo-300 font-mono tracking-widest">{roomId}</span>
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">입장 코드</span>
              </div>
              {passcode && (
                <div className="flex items-center gap-2 sm:border-l sm:border-white/10 sm:pl-4">
                  <span className="text-3xl font-black text-amber-400 font-mono tracking-widest">{passcode}</span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold">비밀번호</span>
                </div>
              )}
            </div>
            <span className="text-[10px] text-zinc-400">GlowWave 홈페이지에서 코드를 직접 입력하고 참여해 주세요!</span>
          </div>

          {/* Instructions Box */}
          <div className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 flex flex-col gap-3 text-left">
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
              <p className="text-xs text-zinc-300">스마트폰 기본 카메라 앱을 열어 QR 코드를 비춰주세요.</p>
            </div>
            <div className="flex items-start gap-2 border-t border-white/5 pt-2">
              <span className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
              <p className="text-xs text-zinc-300">접속 시 나타나는 <b>[입장하기]</b> 버튼을 누르면 전광판 화면에 동기화됩니다.</p>
            </div>
            <div className="flex items-start gap-2 border-t border-white/5 pt-2">
              <span className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
              <p className="text-xs text-zinc-300">행사 진행 중 화면이 꺼지지 않도록 탭 상태를 계속 유지해 주세요.</p>
            </div>
          </div>

          {/* Live Participant Count */}
          <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
            <Users className="w-4 h-4 text-indigo-300" />
            <span className="text-xs text-zinc-400 font-semibold">현재 입장한 관객 수:</span>
            <span className="text-sm font-black text-indigo-300 font-mono animate-pulse">{activeParticipants}명</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-[10px] text-zinc-600 font-mono z-10">
        ROOM CODE: <span className="text-indigo-400 font-bold">{roomId}</span> · URL: {audienceUrl}
      </footer>
    </div>
  );
}
