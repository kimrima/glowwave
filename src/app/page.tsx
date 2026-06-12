'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Preset, EffectType } from '@/lib/types';
import LandscapePhoneMockup from '@/components/LandscapePhoneMockup';
import QRScannerModal from '@/components/QRScannerModal';

const getSpeedFactor = (ms: number, effect: string) => {
  if (effect === 'blink') {
    return Math.max(1, Math.min(100, Math.round(((2000 - ms) * 99) / 1950 + 1)));
  }
  if (effect === 'marquee') {
    return Math.max(1, Math.min(100, Math.round(((15000 - ms) * 99) / 14000 + 1)));
  }
  if (effect === 'gradient') {
    return Math.max(1, Math.min(100, Math.round(((20000 - ms) * 99) / 19000 + 1)));
  }
  return 50;
};

const getSpeedMs = (factor: number, effect: string) => {
  if (effect === 'blink') {
    return Math.round(2000 - (factor - 1) * (1950 / 99));
  }
  if (effect === 'marquee') {
    return Math.round(15000 - (factor - 1) * (14000 / 99));
  }
  if (effect === 'gradient') {
    return Math.round(20000 - (factor - 1) * (19000 / 99));
  }
  return 1000;
};

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
  const [demoSpeedStep, setDemoSpeedStep] = useState(3);
  const [demoPreset, setDemoPreset] = useState<Preset>({
    bg_color: '#8B5CF6',
    text: 'GLOWWAVE',
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
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#030305]/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-black text-xl tracking-tight text-white font-outfit">
            <span>GlowWave</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8 text-xs text-zinc-400 font-bold uppercase tracking-wider font-outfit">
            <a href="#features" className="hover:text-white transition-colors">주요 기능</a>
            <a href="#trial" className="hover:text-white transition-colors">실시간 무료 체험</a>
            <Link href="/recovery" className="hover:text-white transition-colors">구매 복구</Link>
          </nav>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsQRScannerOpen(true)}
              className="btn-secondary text-xs px-4 py-2.5 rounded-xl text-zinc-300 hover:text-white transition-all cursor-pointer font-outfit"
            >
              QR 스캔 참여
            </button>
            <Link 
              href="/host/setup" 
              className="btn-primary text-xs px-4 py-2.5 rounded-xl text-black hover:bg-zinc-200 transition-all cursor-pointer font-outfit"
            >
              방 만들기
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-12 md:pt-24 md:pb-20 bg-grid-pattern">
        {/* Background Neon Aura Spheres */}
        <div className="absolute top-[10%] left-[10%] neon-glow-circle-1" />
        <div className="absolute top-[30%] right-[10%] neon-glow-circle-2" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          
          <div className="text-center max-w-3xl mx-auto mb-16 relative">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/5 bg-white/[0.02] text-zinc-400 text-[10px] font-bold mb-6 tracking-widest uppercase font-mono">
              <span>100ms ultra-low latency signaling</span>
            </div>
            
            <h1 className="text-4xl sm:text-6xl font-black tracking-tighter leading-[1.15] mb-6 text-white font-outfit text-gradient">
              앱 설치 없이 스마트폰을<br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">하나의 무대 조명</span>으로
            </h1>
            
            <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto leading-relaxed font-semibold">
              현장 QR 코드 스캔 또는 참여 코드를 통해 수백 명의 관객 스마트폰 화면 색상과 구호를 실시간 동기화하여 압도적인 시각 효과를 연출하세요.
            </p>
          </div>

          {/* Core Side-by-Side Action Cards - Bento Grid Style */}
          <div className="grid md:grid-cols-12 gap-6 max-w-4xl mx-auto mb-10">
            {/* Host Action Card (Bento Style: larger width for visual hierarchy) */}
            <div className="glass-effect rounded-3xl p-8 flex flex-col justify-between border border-white/5 bg-[#0a0a0f]/40 hover:border-indigo-500/20 hover:shadow-[0_0_50px_rgba(99,102,241,0.08)] transition-all duration-300 md:col-span-7 relative group overflow-hidden active-spring-pad">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all duration-300" />
              <div className="mb-10 relative z-10">
                <span className="text-[9px] font-mono text-indigo-400 font-extrabold uppercase tracking-widest">For Event Host</span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-3 mb-3 font-outfit">새 전광판 개설하기</h2>
                <p className="text-xs text-zinc-400 leading-relaxed font-semibold">
                  버스킹 크루, 파티 DJ, 동아리 이벤트를 위해 나만의 실시간 제어 리모컨을 만듭니다. 별도의 회원가입 없이 즉시 방 코드를 획득하고 연출을 시작해 보세요.
                </p>
              </div>
              <Link 
                href="/host/setup" 
                className="w-full py-4 rounded-xl text-center text-xs tracking-wider flex items-center justify-center gap-2 bg-white text-black font-extrabold shadow-lg hover:bg-zinc-200 transition-all z-10"
              >
                방 개설 및 세팅 시작하기
              </Link>
            </div>

            {/* Spectator Action Card (Bento Style: compact entry form) */}
            <div className="glass-effect rounded-3xl p-8 flex flex-col justify-between border border-white/5 bg-[#0a0a0f]/40 hover:border-emerald-500/20 hover:shadow-[0_0_50px_rgba(16,185,129,0.08)] transition-all duration-300 md:col-span-5 relative group overflow-hidden active-spring-pad">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all duration-300" />
              <div className="relative z-10 mb-6">
                <span className="text-[9px] font-mono text-emerald-400 font-extrabold uppercase tracking-widest">For Audience</span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-3 mb-3 font-outfit">관객으로 참여하기</h2>
                <p className="text-xs text-zinc-400 leading-relaxed mb-6 font-semibold">
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
                    placeholder="입장 코드 6자리"
                    className="flex-1 bg-black/60 border border-white/10 rounded-xl px-4 py-3.5 text-center text-white tracking-widest text-xs font-black focus:outline-none focus:border-indigo-500 uppercase font-mono transition-all"
                    maxLength={6}
                  />
                  <button
                    type="submit"
                    className="px-5 py-3.5 rounded-xl text-xs font-extrabold shrink-0 flex items-center justify-center gap-1.5 cursor-pointer bg-white text-black hover:bg-zinc-200 transition-all"
                  >
                    참여
                  </button>
                </form>
                {joinError && <p className="text-[10px] text-red-500 mb-4 text-center font-bold">{joinError}</p>}
              </div>

              <button
                type="button"
                onClick={() => setIsQRScannerOpen(true)}
                className="w-full py-3.5 rounded-xl border border-dashed border-white/10 bg-white/5 text-zinc-300 font-extrabold text-xs hover:bg-white/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer relative z-10"
              >
                카메라로 QR 코드 스캔하기
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* Interactive Live Trial Section */}
      <section id="trial" className="py-16 md:py-24 border-t border-white/5 relative bg-black/40 bg-grid-pattern overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 neon-glow-circle-1 opacity-50" />
        
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-4 font-outfit text-gradient">실시간 시뮬레이터로 미리 체험해 보세요</h2>
            <p className="text-xs text-zinc-400 font-semibold max-w-md mx-auto leading-relaxed">왼쪽 조명 컨트롤러의 테크니컬 스펙을 변경해 보세요. 오른쪽 베젤리스 스마트폰 화면에 실시간 속도와 연출이 동기화됩니다.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto items-center">
            {/* Live Controller Mockup */}
            <div className="glass-effect rounded-3xl p-6 sm:p-8 flex flex-col gap-6 bg-[#0a0a0f]/50 border border-white/5 shadow-2xl">
              <div className="pb-4 border-b border-white/5 flex justify-between items-center">
                <span className="text-[9px] text-zinc-500 font-black font-mono tracking-widest uppercase">SIMULATION CONSOLE</span>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
              </div>

              <div>
                <label className="block text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-3">배경 색상 선택</label>
                <div className="grid grid-cols-6 gap-3">
                  {colors.map((c) => (
                    <button
                      key={c.hex}
                      onClick={() => handleDemoPresetChange('bg_color', c.hex)}
                      className={`h-9 w-9 rounded-full border-2 transition-all cursor-pointer mx-auto flex items-center justify-center ${
                        demoPreset.bg_color === c.hex 
                          ? 'border-white scale-110 shadow-lg' 
                          : 'border-white/10 hover:scale-105 hover:border-white/30'
                      }`}
                      style={{ 
                        backgroundColor: c.hex,
                      }}
                      title={c.name}
                    >
                      {demoPreset.bg_color === c.hex && (
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.hex === '#FFFFFF' ? '#000000' : '#FFFFFF' }} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-2">전송할 텍스트 입력</label>
                <div className="relative">
                  <input
                    type="text"
                    value={demoPreset.text}
                    onChange={(e) => handleDemoPresetChange('text', e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20 text-xs font-semibold"
                    placeholder="구호를 입력하세요 (최대 15자)"
                    maxLength={15}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-mono text-zinc-600 font-bold">
                    {demoPreset.text.length}/15
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-2">텍스트 색상</label>
                  <div className="flex gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5">
                    <button
                      type="button"
                      onClick={() => handleDemoPresetChange('text_color', '#FFFFFF')}
                      className={`flex-1 py-2 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                        demoPreset.text_color === '#FFFFFF'
                          ? 'bg-white text-black shadow-sm'
                          : 'text-zinc-500 hover:text-white hover:bg-white/[0.01]'
                      }`}
                    >
                      밝은색
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDemoPresetChange('text_color', '#000000')}
                      className={`flex-1 py-2 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                        demoPreset.text_color === '#000000'
                          ? 'bg-white text-black shadow-sm'
                          : 'text-zinc-500 hover:text-white hover:bg-white/[0.01]'
                      }`}
                    >
                      어두운색
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-2">애니메이션 효과</label>
                  <div className="flex gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
                    {(['none', 'blink', 'marquee'] as EffectType[]).map((eff) => (
                      <button
                        key={eff}
                        type="button"
                        onClick={() => {
                          let newSpeed = 1000;
                          if (eff === 'blink') newSpeed = 400;
                          else if (eff === 'marquee') newSpeed = 6000;
                          setDemoPreset(prev => ({
                            ...prev,
                            effect: eff,
                            speed: newSpeed
                          }));
                        }}
                        className={`flex-1 py-2 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                          demoPreset.effect === eff 
                            ? 'bg-white text-black shadow-sm' 
                            : 'text-zinc-500 hover:text-white hover:bg-white/[0.01]'
                        }`}
                      >
                        {eff === 'none' ? '정적' : eff === 'blink' ? '깜빡이' : '흐르기'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Speed Range Slider */}
              {demoPreset.effect !== 'none' && (
                <div className="pt-3 border-t border-white/5 animate-in fade-in duration-200">
                  <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2.5">
                    <span>속도 조절</span>
                    <span className="text-white font-extrabold">
                      {getSpeedFactor(demoPreset.speed, demoPreset.effect)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={getSpeedFactor(demoPreset.speed, demoPreset.effect)}
                    onChange={(e) => {
                      const factor = parseInt(e.target.value);
                      const ms = getSpeedMs(factor, demoPreset.effect);
                      handleDemoPresetChange('speed', ms);
                    }}
                    className="premium-slider"
                  />
                </div>
              )}
            </div>

            {/* Simulated Smartphone Mockup */}
            <div className="flex justify-center items-center hover:scale-[1.02] transition-transform duration-300">
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
              <div className="text-[10px] font-mono text-zinc-500 font-bold mb-4">
                01
              </div>
              <h3 className="text-base font-bold text-white mb-2">화면 꺼짐 강제 방지</h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                W3C Wake Lock API를 지원하여, 화면을 터치하지 않아도 스마트폰 화면이 절전 모드로 어두워지거나 꺼지지 않습니다.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.01]">
              <div className="text-[10px] font-mono text-zinc-500 font-bold mb-4">
                02
              </div>
              <h3 className="text-base font-bold text-white mb-2">백그라운드 자동 복귀</h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                전화 수신 등으로 홈 화면에 나갔다가 복귀할 때도, 브라우저 가시성 감지 센서가 즉시 작동하여 실시간 싱크를 0.2초 내 복원합니다.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.01]">
              <div className="text-[10px] font-mono text-zinc-500 font-bold mb-4">
                03
              </div>
              <h3 className="text-base font-bold text-white mb-2">초과 유저 하드캡 차단</h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                요금제별 접속 한도에 도달하면 신규 접속자를 대기 오버레이로 친절하게 안내하여 트래픽 오버 및 서비스 마비를 자동 방어합니다.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.01]">
              <div className="text-[10px] font-mono text-zinc-500 font-bold mb-4">
                04
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

