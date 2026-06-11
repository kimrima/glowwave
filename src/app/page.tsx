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

  // Modal/Scanner for Room Join
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
              onClick={() => setIsQRScannerOpen(true)}
              className="text-sm font-semibold px-4 py-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
            >
              QR 스캔 참여 📸
            </button>
            <Link 
              href="/host/setup" 
              className="text-sm font-bold px-4 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 transition-all cursor-pointer"
            >
              방 만들기 ⚡
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-12 md:pt-24 md:pb-20">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/5 bg-white/[0.02] text-zinc-400 text-[11px] font-bold mb-6 tracking-wide">
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              <span>100ms 초저지연 실시간 스마트폰 화면 제어</span>
            </div>
            
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.2] mb-6 text-white">
              앱 설치 없이 스마트폰을<br />
              하나의 무대 조명으로
            </h1>
            
            <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto leading-relaxed font-medium">
              현장 QR 코드 스캔 또는 참여 코드를 통해 수백 명의 관객 스마트폰 화면 색상과 구호를 실시간 동기화하여 압도적인 시각 효과를 연출하세요.
            </p>
          </div>

          {/* Core Side-by-Side Action Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-10">
            {/* Host Action Card */}
            <div className="glass-effect rounded-2xl p-8 flex flex-col justify-between border border-white/5 bg-[#12121a] hover:border-white/10 transition-all">
              <div className="mb-8">
                <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wider">For Event Host</span>
                <h2 className="text-2xl font-black text-white mt-2 mb-3">새 전광판 개설하기 ⚡</h2>
                <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                  버스킹 크루, 파티 DJ, 동아리 이벤트를 위해 나만의 실시간 제어 리모컨을 만듭니다. 별도의 회원가입 없이 즉시 방 코드를 획득하고 연출을 시작해 보세요.
                </p>
              </div>
              <Link 
                href="/host/setup" 
                className="w-full py-4 rounded-xl text-center text-xs tracking-wider flex items-center justify-center gap-2 hover:scale-[1.01] transition-transform bg-white text-black font-bold"
              >
                방 개설 및 세팅 시작하기 <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Spectator Action Card */}
            <div className="glass-effect rounded-2xl p-8 flex flex-col justify-between border border-white/5 bg-[#12121a] hover:border-white/10 transition-all">
              <div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">For Audience</span>
                <h2 className="text-2xl font-black text-white mt-2 mb-3">관객으로 참여하기 🔑</h2>
                <p className="text-xs text-zinc-400 leading-relaxed mb-6 font-medium">
                  스크린에 안내된 6자리 코드(대문자/숫자)를 입력하거나 카메라를 켜서 QR 코드를 스캔하세요.
                </p>
                
                {/* Direct join code input interface */}
                <form onSubmit={handleJoinRoomSubmit} className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={joinRoomCode}
                    onChange={(e) => {
                      setJoinRoomCode(e.target.value.toUpperCase());
                      setJoinError('');
                    }}
                    placeholder="입장 코드 입력 (6자리)"
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-center text-white tracking-widest text-sm font-bold focus:outline-none focus:border-indigo-500 uppercase font-mono"
                    maxLength={6}
                  />
                  <button
                    type="submit"
                    className="px-6 py-3.5 rounded-xl text-xs font-extrabold shrink-0 flex items-center justify-center gap-1.5 cursor-pointer bg-white text-black hover:bg-zinc-200 transition-all"
                  >
                    참여 <Play className="w-3 h-3 fill-current" />
                  </button>
                </form>
                {joinError && <p className="text-[11px] text-red-500 mb-4 text-center font-bold">{joinError}</p>}
              </div>

              <button
                type="button"
                onClick={() => setIsQRScannerOpen(true)}
                className="w-full py-3.5 rounded-xl border border-dashed border-white/10 bg-white/5 text-zinc-300 font-bold text-xs hover:bg-white/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                카메라로 QR 코드 스캔하기 📸
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* Interactive Live Trial Section */}
      <section id="trial" className="py-16 border-t border-white/5 relative bg-zinc-950/20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-4">실시간 시뮬레이터로 미리 체험해보세요</h2>
            <p className="text-xs text-zinc-400 font-medium">왼쪽 조명 컨트롤러의 색상과 연출 단추를 클릭해 보세요. 오른쪽 스마트폰 화면에 즉각적으로 연동됩니다.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto items-center">
            {/* Live Controller Mockup */}
            <div className="glass-effect rounded-2xl p-6 flex flex-col gap-6">
              <div className="pb-4 border-b border-white/5">
                <span className="text-[10px] text-zinc-500 font-bold font-mono">SIMULATION REMOTE CONTROL</span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">배경 색상 선택</label>
                <div className="grid grid-cols-6 gap-2">
                  {colors.map((c) => (
                    <button
                      key={c.hex}
                      onClick={() => handleDemoPresetChange('bg_color', c.hex)}
                      className={`h-9 rounded-lg border transition-all cursor-pointer ${
                        demoPreset.bg_color === c.hex ? 'border-white scale-110' : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">전송할 텍스트 입력</label>
                <input
                  type="text"
                  value={demoPreset.text}
                  onChange={(e) => handleDemoPresetChange('text', e.target.value)}
                  className="w-full bg-[#0B0B0F] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm font-semibold"
                  placeholder="텍스트를 입력해 보세요."
                  maxLength={15}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">텍스트 색상</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleDemoPresetChange('text_color', '#FFFFFF')}
                    className={`flex-1 py-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                      demoPreset.text_color === '#FFFFFF'
                        ? 'border-white bg-white text-black'
                        : 'border-white/5 bg-transparent text-zinc-400 hover:text-white'
                    }`}
                  >
                    밝은색
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDemoPresetChange('text_color', '#000000')}
                    className={`flex-1 py-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                      demoPreset.text_color === '#000000'
                        ? 'border-white bg-white text-black'
                        : 'border-white/5 bg-transparent text-zinc-400 hover:text-white'
                    }`}
                  >
                    어두운색
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">애니메이션 효과</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['none', 'blink', 'marquee'] as EffectType[]).map((eff) => (
                    <button
                      key={eff}
                      onClick={() => handleDemoPresetChange('effect', eff)}
                      className={`py-2 px-3 rounded-lg border text-xs font-semibold uppercase transition-all cursor-pointer ${
                        demoPreset.effect === eff 
                          ? 'border-white bg-white/5 text-white font-extrabold' 
                          : 'border-white/5 bg-transparent text-zinc-400 hover:text-white'
                      }`}
                    >
                      {eff === 'none' ? '정적' : eff === 'blink' ? '깜빡이' : '흐르기'}
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
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-4">CS 제로를 지향하는 디테일한 기술 사양</h2>
            <p className="text-xs text-zinc-400 max-w-xl mx-auto font-medium">1인 기획자, 개발사도 안심하고 대형 이벤트를 단독 운영할 수 있도록 설계했습니다.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.01]">
              <div className="w-9 h-9 rounded-xl border border-white/5 bg-white/5 flex items-center justify-center text-white mb-4">
                <Smartphone className="w-4.5 h-4.5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">화면 꺼짐 강제 방지</h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                W3C Wake Lock API를 지원하여, 화면을 터치하지 않아도 스마트폰 화면이 절전 모드로 어두워지거나 꺼지지 않습니다.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.01]">
              <div className="w-9 h-9 rounded-xl border border-white/5 bg-white/5 flex items-center justify-center text-white mb-4">
                <RefreshCw className="w-4.5 h-4.5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">백그라운드 자동 복귀</h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                전화 수신 등으로 홈 화면에 나갔다가 복귀할 때도, 브라우저 가시성 감지 센서가 즉시 작동하여 실시간 싱크를 0.2초 내 복원합니다.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.01]">
              <div className="w-9 h-9 rounded-xl border border-white/5 bg-white/5 flex items-center justify-center text-white mb-4">
                <Lock className="w-4.5 h-4.5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">초과 유저 하드캡 차단</h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                요금제별 접속 한도에 도달하면 신규 접속자를 대기 오버레이로 친절하게 안내하여 트래픽 오버 및 서비스 마비를 자동 방어합니다.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.01]">
              <div className="w-9 h-9 rounded-xl border border-white/5 bg-white/5 flex items-center justify-center text-white mb-4">
                <SmartphoneIcon className="w-4.5 h-4.5" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">자동 가로 고정 유도</h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                스마트폰을 세로로 들면 가로 회전 가이드 팝업을 노출하여 전광판 문구 잘림을 방지하고 최대의 발광 면적을 확보하게 돕습니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#07070a] py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 font-bold text-base text-white">
            <Sparkles className="w-4.5 h-4.5 text-indigo-400" />
            <span>GlowWave</span>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8 text-[11px] text-zinc-500 font-semibold font-mono">
            <span>DIY Concert Smartphone Light System</span>
            <span>·</span>
            <span>Free real-time phone led signboard</span>
            <span>·</span>
            <span>스마트폰 전광판 동기화 서비스</span>
          </div>
          
          <p className="text-[11px] text-zinc-600 font-medium">
            &copy; 2026 Anti-gravity. All rights reserved.
          </p>
        </div>
      </footer>



      {isQRScannerOpen && (
        <QRScannerModal
          onScanSuccess={handleQRScanSuccess}
          onClose={() => setIsQRScannerOpen(false)}
        />
      )}

    </div>
  );
}

