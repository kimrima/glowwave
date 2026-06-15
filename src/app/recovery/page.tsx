'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  Mail, 
  Search, 
  ArrowLeft, 
  Key, 
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Loader2
} from 'lucide-react';

interface RecoveredRoom {
  room_id: string;
  tier: string;
  created_at: string;
  host_session_token: string;
}

export default function RecoveryPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [recoveredRooms, setRecoveredRooms] = useState<RecoveredRoom[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setMessage('');
    setRecoveredRooms([]);
    setHasSearched(false);

    try {
      const response = await fetch('/api/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '복구 요청 실패');
      }

      setMessage(data.message);
      setRecoveredRooms(data.rooms || []);
      setHasSearched(true);
    } catch (err: any) {
      console.error(err);
      setMessage(err.message || '네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0F] text-foreground flex flex-col justify-between">
      
      {/* Header */}
      <header className="border-b border-white/5 bg-[#0B0B0F]/80 backdrop-blur-md pt-[env(safe-area-inset-top,0px)]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-white">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <span>GlowWave</span>
          </Link>
          <Link href="/" className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 font-medium transition-all">
            <ArrowLeft className="w-3.5 h-3.5" />
            메인으로 돌아가기
          </Link>
        </div>
      </header>

      {/* Main Box */}
      <main className="max-w-md mx-auto w-full px-6 py-16 flex-1 flex flex-col justify-center">
        <div className="glass-effect rounded-2xl p-6 border border-white/5 flex flex-col gap-6">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 mx-auto mb-4">
              <Key className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-white mb-2">구매 내역 & 대시보드 복구</h1>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
              결제 완료 후 페이지가 튕겼거나 대시보드 관리자 링크를 분실하신 경우, 결제 시 입력했던 이메일을 적어 방장 권한을 복구하세요.
            </p>
          </div>

          <form onSubmit={handleRecover} className="flex flex-col gap-4">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                이메일 주소 입력
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="결제 영수증용 이메일 주소"
                className="w-full bg-[#0B0B0F] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 text-sm font-semibold"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-white text-black font-extrabold text-sm hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  내역 조회 중...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  구매 내역 찾기
                </>
              )}
            </button>
          </form>

          {/* Results Block */}
          {hasSearched && (
            <div className="border-t border-white/5 pt-5 flex flex-col gap-4">
              {recoveredRooms.length > 0 ? (
                <>
                  <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-[11px] text-emerald-400 flex items-start gap-2 leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      이메일 매직 링크 시뮬레이션 완료! 이메일 발송 로그가 서버 콘솔에 정상 기록되었습니다. 아래의 링크들을 이용해 즉시 방장 리모컨 대시보드로 다시 복구할 수 있습니다.
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {recoveredRooms.map((room) => (
                      <div 
                        key={room.room_id} 
                        className="bg-black/40 border border-white/5 p-3.5 rounded-xl flex items-center justify-between hover:border-white/15 transition-all"
                      >
                        <div>
                          <div className="font-bold text-white text-xs flex items-center gap-1.5">
                            방 코드: {room.room_id}
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/15 text-indigo-300 font-semibold capitalize">
                              {room.tier}
                            </span>
                          </div>
                          <div className="text-[10px] text-zinc-500 mt-1">
                            생성일: {new Date(room.created_at).toLocaleString()}
                          </div>
                        </div>
                        
                        <Link 
                          href={`/host/dashboard/${room.room_id}?token=${room.host_session_token}`}
                          className="py-1.5 px-3 rounded-lg bg-white/5 text-zinc-300 font-bold hover:bg-white/10 hover:text-white transition-all text-[11px] flex items-center gap-1"
                        >
                          대시보드 <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center text-xs text-zinc-500 flex flex-col items-center gap-2">
                  <AlertCircle className="w-8 h-8 text-zinc-600" />
                  <div>입력하신 이메일 {email}로 생성되어 활성화된 방을 찾을 수 없습니다.</div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-zinc-950 py-6 text-center text-[10px] text-zinc-600">
        &copy; 2026 Anti-gravity. Safe & instant magic link recovery.
      </footer>

    </div>
  );
}
