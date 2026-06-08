'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, 
  Smartphone, 
  Zap, 
  Lock, 
  RefreshCw, 
  ArrowRight, 
  Play, 
  Search, 
  SmartphoneIcon,
  HelpCircle,
  Camera
} from 'lucide-react';
import { Preset, EffectType } from '@/lib/types';
import LandscapePhoneMockup from '@/components/LandscapePhoneMockup';
import QRScannerModal from '@/components/QRScannerModal';

export default function Home() {
  const router = useRouter();

  // Active host room states for resume/cleanup
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [activeRoomToken, setActiveRoomToken] = useState<string | null>(null);
  const [isRoomStillActive, setIsRoomStillActive] = useState<boolean>(false);

  // Active spectator room states for resume/cleanup
  const [lastJoinedRoomId, setLastJoinedRoomId] = useState<string | null>(null);
  const [isAudienceRoomActive, setIsAudienceRoomActive] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedActiveId = localStorage.getItem('glowwave_active_host_room_id');
      if (savedActiveId) {
        setActiveRoomId(savedActiveId);
        const savedToken = localStorage.getItem(`glowwave_token_${savedActiveId}`);
        setActiveRoomToken(savedToken);
        
        // Verify if room is active on the server/DB
        fetch(`/api/room/${savedActiveId}/status`)
          .then((res) => {
            if (res.ok) return res.json();
            throw new Error('Expired');
          })
          .then((data) => {
            if (data.status === 'active') {
              setIsRoomStillActive(true);
            } else {
              cleanExpiredRoom(savedActiveId);
            }
          })
          .catch(() => {
            cleanExpiredRoom(savedActiveId);
          });
      }

      // Check last joined audience room
      const savedJoinedId = localStorage.getItem('glowwave_last_joined_room_id');
      if (savedJoinedId) {
        setLastJoinedRoomId(savedJoinedId);
        fetch(`/api/room/${savedJoinedId}/status`)
          .then((res) => {
            if (res.ok) return res.json();
            throw new Error('Expired');
          })
          .then((data) => {
            if (data.status === 'active') {
              // Only show audience banner if it is not the same as the host's room
              if (savedJoinedId !== savedActiveId) {
                setIsAudienceRoomActive(true);
              }
            } else {
              localStorage.removeItem('glowwave_last_joined_room_id');
              setLastJoinedRoomId(null);
            }
          })
          .catch(() => {
            localStorage.removeItem('glowwave_last_joined_room_id');
            setLastJoinedRoomId(null);
          });
      }
    }
  }, [activeRoomId]);

  const cleanExpiredRoom = (id: string) => {
    localStorage.removeItem('glowwave_active_host_room_id');
    localStorage.removeItem(`glowwave_presets_${id}`);
    localStorage.removeItem(`glowwave_token_${id}`);
    setActiveRoomId(null);
    setActiveRoomToken(null);
    setIsRoomStillActive(false);
  };
  
  // Interactive Live Trial State
  const [demoPreset, setDemoPreset] = useState<Preset>({
    bg_color: '#8B5CF6',
    text: 'CROWDGLOW',
    text_color: '#FFFFFF',
    effect: 'none',
    speed: 1000
  });

  // Modal for Room Join
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [joinRoomCode, setJoinRoomCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);

  const handleQRScanSuccess = (roomId: string) => {
    setIsQRScannerOpen(false);
    router.push(`/room/${roomId}`);
  };

  const handleJoinRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinRoomCode || joinRoomCode.trim().length !== 6) {
      setJoinError('6자리 올바른 방 코드를 입력하세요.');
      return;
    }
    router.push(`/room/${joinRoomCode.trim().toUpperCase()}`);
  };

  const handleDemoPresetChange = (key: keyof Preset, value: any) => {
    setDemoPreset(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const colors = [
    { name: '보라색', hex: '#8B5CF6' },
    { name: '빨간색', hex: '#EF4444' },
    { name: '파란색', hex: '#3B82F6' },
    { name: '초록색', hex: '#10B981' },
    { name: '주황색', hex: '#F59E0B' },
    { name: '분홍색', hex: '#EC4899' },
  ];

  return (
    <div className="min-h-screen bg-[#0B0B0F] text-foreground selection:bg-white/20 flex flex-col justify-between">
      
      {/* JSON-LD SEO/GEO Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "GlowWave (GlowWave)",
            "operatingSystem": "WEB",
            "applicationCategory": "EventApplication",
            "description": "별도의 앱 설치 없이 QR 코드 스캔만으로 관객 스마트폰 화면 색상과 텍스트를 실시간 동기화하는 소규모 이벤트용 조명 연출 웹서비스",
            "offers": {
              "@type": "Offer",
              "price": "3.99",
              "priceCurrency": "USD",
              "priceSpecification": {
                "@type": "UnitPriceSpecification",
                "price": "3.99",
                "priceCurrency": "USD",
                "referenceQuantity": {
                  "@type": "QuantitativeValue",
                  "value": "1",
                  "unitCode": "Room"
                }
              }
            }
          })
        }}
      />

      {isRoomStillActive && activeRoomId && activeRoomToken && (
        <div className="bg-indigo-600 text-white py-2.5 px-6 text-center text-xs font-semibold flex items-center justify-center gap-2 animate-in slide-in-from-top duration-300 relative z-50">
          <span>이전의 활성화된 방이 존재합니다 (방 코드: {activeRoomId})</span>
          <Link
            href={`/host/dashboard/${activeRoomId}?token=${activeRoomToken}`}
            className="px-2.5 py-0.5 rounded bg-white text-indigo-600 hover:bg-zinc-100 transition-all font-bold text-[11px]"
          >
            대시보드로 돌아가기 &rarr;
          </Link>
        </div>
      )}

      {isAudienceRoomActive && lastJoinedRoomId && (
        <div className="bg-emerald-600 text-white py-2.5 px-6 text-center text-xs font-semibold flex items-center justify-center gap-2 animate-in slide-in-from-top duration-300 relative z-50">
          <span>이전에 참여하던 전광판 방이 존재합니다 (방 코드: {lastJoinedRoomId})</span>
          <Link
            href={`/room/${lastJoinedRoomId}`}
            className="px-2.5 py-0.5 rounded bg-white text-emerald-600 hover:bg-zinc-100 transition-all font-bold text-[11px]"
          >
            관객으로 재진입하기 &rarr;
          </Link>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0B0B0F]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-white">
            <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
            <span>GlowWave</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8 text-sm text-zinc-400 font-medium">
            <a href="#features" className="hover:text-white transition-colors">주요 기능</a>
            <a href="#trial" className="hover:text-white transition-colors">실시간 무료 체험</a>
            <Link href="/recovery" className="hover:text-white transition-colors">구매 복구</Link>
          </nav>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsJoinModalOpen(true)}
              className="text-sm font-medium px-4 py-2 rounded-lg text-zinc-300 hover:text-white hover:bg-white/5 transition-all"
            >
              참여하기
            </button>
            <Link 
              href="/host/setup" 
              className="text-sm font-semibold px-4 py-2 rounded-lg bg-white text-black hover:bg-zinc-200 transition-all shadow-lg hover:shadow-white/5"
            >
              방 만들기 ⚡
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 md:pt-32 md:pb-24">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/5 text-indigo-300 text-xs font-semibold mb-6">
            <Zap className="w-3.5 h-3.5" />
            <span>100ms 초저지연 실시간 스마트폰 화면 제어</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.15] mb-8 text-gradient">
            앱 설치 없이 스마트폰을<br />
            하나의 콘서트 조명으로
          </h1>

          <p className="text-base sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-10">
            소규모 버스킹 크루, 클럽 DJ, 대학 동아리, 야외 응원단까지.<br />
            현장 QR 코드 스캔만으로 수백 명의 스마트폰 화면 색상과 구호를 실시간 동기화하여 압도적인 무대를 연출하세요.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/host/setup" 
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white text-black font-bold flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all shadow-xl hover:shadow-white/10"
            >
              무료로 방 만들기 <ArrowRight className="w-5 h-5" />
            </Link>
            <button 
              onClick={() => setIsJoinModalOpen(true)}
              className="w-full sm:w-auto px-8 py-4 rounded-xl border border-white/10 bg-white/5 font-semibold text-white flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
            >
              관객으로 참여하기
            </button>
          </div>
        </div>
      </section>

      {/* Interactive Live Trial Section */}
      <section id="trial" className="py-16 border-t border-white/5 relative bg-zinc-950/20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-4">실시간 시뮬레이터로 미리 체험해보세요</h2>
            <p className="text-zinc-400">오른쪽 화면(스마트폰 목업)이 관객의 화면이라고 생각하고 왼쪽 컨트롤러를 조작해 보세요.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Live Controller Mockup */}
            <div className="glass-effect rounded-2xl p-6 flex flex-col gap-6">
              <div className="flex items-center gap-2 pb-4 border-b border-white/5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-xs text-zinc-500 font-mono ml-2">HOST CONTROLLER</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">배경 색상 선택</label>
                <div className="grid grid-cols-6 gap-2">
                  {colors.map((c) => (
                    <button
                      key={c.hex}
                      onClick={() => handleDemoPresetChange('bg_color', c.hex)}
                      className={`h-10 rounded-lg border transition-all ${
                        demoPreset.bg_color === c.hex ? 'border-white scale-110' : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">전송할 텍스트 입력</label>
                <input
                  type="text"
                  value={demoPreset.text}
                  onChange={(e) => handleDemoPresetChange('text', e.target.value)}
                  className="w-full bg-[#0B0B0F] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm"
                  placeholder="텍스트를 입력해 보세요."
                  maxLength={15}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">텍스트 색상</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                    <input
                      type="radio"
                      name="textColor"
                      checked={demoPreset.text_color === '#FFFFFF'}
                      onChange={() => handleDemoPresetChange('text_color', '#FFFFFF')}
                      className="accent-indigo-500"
                    />
                    흰색
                  </label>
                  <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                    <input
                      type="radio"
                      name="textColor"
                      checked={demoPreset.text_color === '#000000'}
                      onChange={() => handleDemoPresetChange('text_color', '#000000')}
                      className="accent-indigo-500"
                    />
                    검은색
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">애니메이션 효과</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['none', 'blink', 'marquee'] as EffectType[]).map((eff) => (
                    <button
                      key={eff}
                      onClick={() => handleDemoPresetChange('effect', eff)}
                      className={`py-2 px-3 rounded-lg border text-xs font-medium uppercase transition-all ${
                        demoPreset.effect === eff 
                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300' 
                          : 'border-white/5 bg-white/5 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {eff === 'none' ? '정적 (Static)' : eff === 'blink' ? '반짝임 (Blink)' : '흐르기 (Marquee)'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Simulated Smartphone Mockup */}
            <div className="flex justify-center items-center">
              <LandscapePhoneMockup preset={demoPreset} />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features" className="py-16 md:py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-4">CS 제로를 지향하는 디테일한 기술 사양</h2>
            <p className="text-zinc-400 max-w-xl mx-auto">1인 기획자, 개발사도 안심하고 단독 운영이 가능하도록 예외 케이스를 설계했습니다.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="p-6 rounded-xl border border-white/5 bg-zinc-950/20">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">화면 꺼짐 강제 방지</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                W3C Wake Lock API를 활용하여, 10분간 화면을 터치하지 않아도 스마트폰 화면이 꺼지거나 어두워지지 않습니다.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-white/5 bg-zinc-950/20">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4">
                <RefreshCw className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">백그라운드 자동 복귀</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                전화나 메신저 확인 후 브라우저 복귀 시 즉시 동기화가 재연결되어 0.2초 이내에 현 시점 상태로 강제 복구됩니다.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-white/5 bg-zinc-950/20">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">초과 유저 하드캡 차단</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                요금제별 지정된 동시접속자가 도달할 경우 Edge 단에서 초과 접속자를 부드럽게 대기 오버레이로 즉시 블로킹합니다.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-white/5 bg-zinc-950/20">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4">
                <SmartphoneIcon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">자동 가로 고정 유도</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                관객이 스마트폰을 세로로 들면 가로 회전 유도 팝업 오버레이를 강제 노출하여 최대 면적의 빛을 확보하도록 돕습니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-zinc-950 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 font-bold text-lg text-white">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>GlowWave</span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8 text-sm text-zinc-500">
            <span>DIY Concert Smartphone Light System</span>
            <span>·</span>
            <span>Free real-time phone led signboard</span>
            <span>·</span>
            <span>홍대 버스킹 스마트폰 전광판 동기화 툴</span>
          </div>
          
          <p className="text-xs text-zinc-600">
            &copy; 2026 Anti-gravity. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Join Room Modal */}
      {isJoinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsJoinModalOpen(false)} />
          
          <div className="glass-effect rounded-2xl w-full max-w-md p-6 relative z-10 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-xl font-bold text-white mb-2">방 참여하기 🔑</h3>
            <p className="text-sm text-zinc-400 mb-6">현장 스크린에 표시된 6자리 방 코드(영어 대문자/숫자)를 입력하여 동기화 모드로 접속합니다.</p>
            
            {/* QR Scanner Trigger Button */}
            <button
              type="button"
              onClick={() => {
                setIsJoinModalOpen(false);
                setIsQRScannerOpen(true);
              }}
              className="w-full py-3 rounded-xl border border-dashed border-indigo-500/20 bg-indigo-500/5 text-indigo-300 font-semibold text-xs hover:bg-indigo-500/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer mb-4"
            >
              <Camera className="w-4 h-4" />
              QR 코드로 스캔해서 참여하기 📸
            </button>

            <form onSubmit={handleJoinRoomSubmit} className="flex flex-col gap-4">
              <div>
                <input
                  type="text"
                  value={joinRoomCode}
                  onChange={(e) => {
                    setJoinRoomCode(e.target.value.toUpperCase());
                    setJoinError('');
                  }}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-center text-white tracking-widest text-2xl font-bold focus:outline-none focus:border-indigo-500 uppercase"
                  placeholder="CODE9"
                  maxLength={6}
                  autoFocus
                />
                {joinError && <p className="text-xs text-red-500 mt-2 text-center">{joinError}</p>}
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setIsJoinModalOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-white/5 text-zinc-300 font-medium hover:bg-white/10 transition-all text-sm"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-white text-black font-bold hover:bg-zinc-200 transition-all text-sm flex items-center justify-center gap-1"
                >
                  참여 <Play className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isQRScannerOpen && (
        <QRScannerModal
          onScanSuccess={handleQRScanSuccess}
          onClose={() => setIsQRScannerOpen(false)}
        />
      )}

    </div>
  );
}

