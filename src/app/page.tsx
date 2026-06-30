'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Preset, EffectType } from '@/lib/types';
import LandscapePhoneMockup from '@/components/LandscapePhoneMockup';
import QRScannerModal from '@/components/QRScannerModal';
import { t, Locale } from '@/lib/translations';
import { Globe } from 'lucide-react';

const getSpeedFactor = (ms: number, effect: string) => {
  if (effect === 'blink') {
    return Math.max(1, Math.min(100, Math.round(((6000 - ms) * 99) / 5900 + 1)));
  }
  if (effect === 'marquee') {
    return Math.max(1, Math.min(100, Math.round(((45000 - ms) * 99) / 43500 + 1)));
  }
  if (effect === 'gradient') {
    return Math.max(1, Math.min(100, Math.round(((45000 - ms) * 99) / 44000 + 1)));
  }
  return 50;
};

const getSpeedMs = (factor: number, effect: string) => {
  if (effect === 'blink') {
    return Math.round(6000 - (factor - 1) * (5900 / 99));
  }
  if (effect === 'marquee') {
    return Math.round(45000 - (factor - 1) * (43500 / 99));
  }
  if (effect === 'gradient') {
    return Math.round(45000 - (factor - 1) * (44000 / 99));
  }
  return 1000;
};

export default function Home() {
  const router = useRouter();

  // Active Locale State
  const [activeLocale, setActiveLocale] = useState<Locale>('ko');
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLocale = (localStorage.getItem('glowwave_home_locale') || 
                           localStorage.getItem('glowwave_host_locale') || 
                           localStorage.getItem('glowwave_local_locale')) as Locale;
      if (savedLocale && ['ko', 'en', 'ja', 'es', 'zh-TW', 'zh-HK'].includes(savedLocale)) {
        setActiveLocale(savedLocale);
      } else {
        const navLang = navigator.language.toLowerCase();
        let detectedLocale: Locale = 'en';
        if (navLang.startsWith('ko')) detectedLocale = 'ko';
        else if (navLang.startsWith('ja')) detectedLocale = 'ja';
        else if (navLang.startsWith('es')) detectedLocale = 'es';
        else if (navLang.startsWith('zh-tw') || navLang.startsWith('zh-cn')) detectedLocale = 'zh-TW';
        else if (navLang.startsWith('zh-hk')) detectedLocale = 'zh-HK';
        
        setActiveLocale(detectedLocale);
        localStorage.setItem('glowwave_home_locale', detectedLocale);
      }
    }
  }, []);

  const handleLocaleChange = (newLocale: Locale) => {
    setActiveLocale(newLocale);
    localStorage.setItem('glowwave_home_locale', newLocale);
    localStorage.setItem('glowwave_host_locale', newLocale);
    localStorage.setItem('glowwave_local_locale', newLocale);
  };

  const formatTimeLeft = (detail: RoomDetail) => {
    if (detail.isExpired) return t('exp_expired', activeLocale);
    const diff = detail.diff;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
      return `${hours}${t('exp_hours_left', activeLocale)} ${minutes}${t('exp_mins_left', activeLocale)}`;
    }
    return `${minutes}${t('exp_mins_left', activeLocale)}`;
  };

  // Active host room states for resume/cleanup
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [activeRoomToken, setActiveRoomToken] = useState<string | null>(null);
  const [isRoomStillActive, setIsRoomStillActive] = useState<boolean>(false);

  // Active spectator room states for resume/cleanup
  const [lastJoinedRoomId, setLastJoinedRoomId] = useState<string | null>(null);
  const [isAudienceRoomActive, setIsAudienceRoomActive] = useState<boolean>(false);
  const [recentRooms, setRecentRooms] = useState<any[]>([]);
  
  interface RoomDetail {
    tier: string;
    createdAt: string;
    isExpired: boolean;
    diff: number;
    loaded: boolean;
  }
  const [roomDetails, setRoomDetails] = useState<Record<string, RoomDetail>>({});
  const [isStatusChecked, setIsStatusChecked] = useState<boolean>(false);

  const sortedRecentRooms = [...recentRooms].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  const activeRecentRooms = sortedRecentRooms.filter(room => {
    // 1. Client-side static time check (instant filter on mount)
    const createdTime = room.createdAt ? new Date(room.createdAt).getTime() : Date.now();
    const tier = room.tier || 'free';
    const limitMs = tier === 'free' ? 6 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    const diff = (createdTime + limitMs) - Date.now();
    if (diff <= 0) return false; // Definitely expired!

    // 2. Server status check response (once fetched)
    const detail = roomDetails[room.roomId];
    if (detail && detail.loaded && detail.isExpired) {
      return false;
    }
    return true;
  });

  const hostRooms = activeRecentRooms.filter(r => r.role === 'host');
  const audienceRooms = activeRecentRooms.filter(r => r.role === 'audience');

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

      // Load recent rooms list
      const recentRaw = localStorage.getItem('glowwave_recent_rooms');
      let loaded: any[] = [];
      if (recentRaw) {
        try {
          loaded = JSON.parse(recentRaw);
        } catch (e) {}
      }
      
      // Fallback migration for existing single room items
      if (loaded.length === 0) {
        if (savedActiveId) {
          loaded.push({
            roomId: savedActiveId,
            role: 'host',
            createdAt: new Date().toISOString()
          });
        }
        if (savedJoinedId && savedJoinedId !== savedActiveId) {
          loaded.push({
            roomId: savedJoinedId,
            role: 'audience',
            createdAt: new Date().toISOString()
          });
        }
        if (loaded.length > 0) {
          localStorage.setItem('glowwave_recent_rooms', JSON.stringify(loaded));
        }
      }
      if (loaded.length === 0) {
        setIsStatusChecked(true);
      }
      setRecentRooms(loaded);
    }
  }, [activeRoomId]);

  useEffect(() => {
    if (recentRooms.length === 0) return;

    const uniqueRoomIds = Array.from(new Set(recentRooms.map(r => r.roomId)));

    const fetchStatuses = async () => {
      const results: Record<string, RoomDetail> = {};
      let updatedRecentRooms = [...recentRooms];
      let hasChanges = false;
      
      await Promise.all(
        uniqueRoomIds.map(async (id) => {
          try {
            const res = await fetch(`/api/room/${id}/status`);
            if (res.ok) {
              const data = await res.json();
              
              const createdTime = new Date(data.created_at).getTime();
              const limitMs = data.tier === 'free' ? 6 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
              const expireTime = createdTime + limitMs;
              const diff = expireTime - Date.now();
              
              let isExpired = false;
              if (diff <= 0 || data.status !== 'active') {
                isExpired = true;
                // Remove from recentRooms if expired
                updatedRecentRooms = updatedRecentRooms.filter(r => r.roomId !== id);
                hasChanges = true;
              } else {
                // Update active room details in loaded list if missing/mismatched
                const matched = updatedRecentRooms.find(r => r.roomId === id);
                if (matched && (!matched.tier || matched.createdAt !== data.created_at)) {
                  matched.tier = data.tier;
                  matched.createdAt = data.created_at;
                  hasChanges = true;
                }
              }

              results[id] = {
                tier: data.tier,
                createdAt: data.created_at,
                isExpired,
                diff,
                loaded: true
              };
            } else {
              results[id] = {
                tier: 'free',
                createdAt: new Date().toISOString(),
                isExpired: true,
                diff: 0,
                loaded: true
              };
              updatedRecentRooms = updatedRecentRooms.filter(r => r.roomId !== id);
              hasChanges = true;
            }
          } catch (e) {
            results[id] = {
              tier: 'free',
              createdAt: new Date().toISOString(),
              isExpired: true,
              diff: 0,
              loaded: true
            };
            updatedRecentRooms = updatedRecentRooms.filter(r => r.roomId !== id);
            hasChanges = true;
          }
        })
      );

      setRoomDetails(prev => ({ ...prev, ...results }));

      if (hasChanges && typeof window !== 'undefined') {
        localStorage.setItem('glowwave_recent_rooms', JSON.stringify(updatedRecentRooms));
        setRecentRooms(updatedRecentRooms);
      }
      setIsStatusChecked(true);
    };

    fetchStatuses();
  }, [recentRooms]);

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
      setJoinError(t('err_join_code', activeLocale));
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

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#030305]/60 backdrop-blur-md pt-[calc(env(safe-area-inset-top,0px)+12px)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-black text-xl tracking-tight text-white font-outfit">
            <span>GlowWave</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8 text-xs text-zinc-400 font-bold uppercase tracking-wider font-outfit">
            <a href="#features" className="hover:text-white transition-colors">{t('nav_features', activeLocale)}</a>
            <a href="#trial" className="hover:text-white transition-colors">{t('nav_trial', activeLocale)}</a>
            <Link href="/recovery" className="hover:text-white transition-colors">{t('nav_recovery', activeLocale)}</Link>
          </nav>

          <div className="flex items-center gap-3">
            {/* Language Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 rounded-xl text-xs font-bold text-white cursor-pointer shadow-md select-none transition-all"
              >
                <Globe className="w-3.5 h-3.5 text-zinc-400" />
                <span className="uppercase">{activeLocale}</span>
              </button>
              {isLangDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40 cursor-default" 
                    onClick={() => setIsLangDropdownOpen(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-40 rounded-2xl border border-white/10 bg-[#0c0c14]/95 backdrop-blur-lg p-1.5 shadow-2xl transition-all duration-200 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    {[
                      { code: 'ko', label: '한국어 (KR)' },
                      { code: 'en', label: 'English (US)' },
                      { code: 'ja', label: '日本語 (JP)' },
                      { code: 'es', label: 'Español (ES)' },
                      { code: 'zh-TW', label: '繁體中文 (TW)' },
                      { code: 'zh-HK', label: '繁體中文 (HK)' }
                    ].map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => {
                          handleLocaleChange(lang.code as Locale);
                          setIsLangDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          activeLocale === lang.code
                            ? 'bg-white text-black font-extrabold'
                            : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button 
              onClick={() => setIsQRScannerOpen(true)}
              className="btn-secondary text-xs px-4 py-2 rounded-xl text-zinc-300 hover:text-white transition-all cursor-pointer font-outfit"
            >
              {t('btn_qr_join', activeLocale)}
            </button>
            <Link 
              href="/host/setup" 
              className="btn-primary text-xs px-4 py-2 rounded-xl text-black hover:bg-zinc-200 transition-all cursor-pointer font-outfit"
            >
              {t('btn_create_room', activeLocale)}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-12 md:pt-24 md:pb-20 bg-grid-pattern">
        {/* Background Neon Aura Spheres */}
        <div className="absolute top-[10%] left-[10%] neon-glow-circle-1" />
        <div className="absolute top-[30%] right-[10%] neon-glow-circle-2" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          
          <div className="text-center max-w-3xl mx-auto mb-16 relative">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/5 bg-white/[0.02] text-zinc-400 text-[10px] font-bold mb-6 tracking-widest uppercase font-mono">
              <span>100ms ultra-low latency signaling</span>
            </div>
            
            <h1 className="text-4xl sm:text-6xl font-black tracking-tighter leading-[1.15] mb-6 text-white font-outfit text-gradient">
              {t('hero_title_1', activeLocale)}<br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">{t('hero_title_2', activeLocale)}</span>
            </h1>
            
            <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto leading-relaxed font-semibold">
              {t('hero_desc', activeLocale)}
            </p>
          </div>

          {/* Recent Signboard List (Role-separated & Top-positioned) */}
          <div className="max-w-4xl mx-auto mb-12 px-2 animate-in fade-in duration-300">
              <div className="grid md:grid-cols-2 gap-6">
                
                {/* Hosted Rooms Column */}
                <div className="flex flex-col gap-3">
                  <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 font-mono text-left">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                    <span>{t('bento_hosted_title', activeLocale)}</span>
                  </h3>
                  <div className="flex flex-col gap-3">
                    {!isStatusChecked ? (
                      <div className="glass-effect rounded-2xl p-4 border border-white/5 bg-white/[0.01] animate-pulse flex items-center justify-between">
                        <div className="flex flex-col gap-2 w-2/3">
                          <div className="h-4 bg-white/10 rounded w-1/3" />
                          <div className="h-3 bg-white/5 rounded w-1/2" />
                        </div>
                        <div className="h-8 bg-white/10 rounded w-20" />
                      </div>
                    ) : hostRooms.length > 0 ? (
                      hostRooms.map((item) => {
                        const details = roomDetails[item.roomId];
                        return (
                          <div 
                            key={item.roomId} 
                            className="glass-effect rounded-2xl p-4 border border-indigo-500/10 hover:border-indigo-500/20 bg-indigo-500/[0.01] flex items-center justify-between transition-all duration-300"
                          >
                            <div className="flex flex-col gap-0.5 text-left min-w-0 pr-3">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h4 className="text-base font-mono font-black text-white tracking-wider truncate">
                                    {item.roomId}
                                  </h4>
                                  {details ? (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded font-extrabold capitalize bg-zinc-800 text-zinc-400">
                                      {item.tier === 'free' ? t('free', activeLocale) : item.tier === 'lite' ? 'Lite' : 'Pro'}
                                    </span>
                                  ) : item.tier ? (
                                    <span className="text-[9px] px-1.5 py-0.2 rounded font-extrabold capitalize bg-zinc-800 text-zinc-400">
                                      {item.tier === 'free' ? t('free', activeLocale) : item.tier === 'lite' ? 'Lite' : 'Pro'}
                                    </span>
                                  ) : null}
                                </div>
                                
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[9px] text-zinc-500 font-mono">
                                    {new Date(item.createdAt).toLocaleDateString(activeLocale === 'ko' ? 'ko-KR' : 'en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                  <span className="text-[9px] text-zinc-500">·</span>
                                  {details ? (
                                    <span className={`text-[9px] font-bold font-mono ${details.isExpired ? 'text-red-500' : 'text-emerald-400'}`}>
                                      {formatTimeLeft(details)}
                                    </span>
                                  ) : (
                                    <span className="text-[9px] text-zinc-500 font-mono">{t('exp_checking', activeLocale)}</span>
                                  )}
                                </div>
                              </div>
                              <Link
                                href={`/host/dashboard/${item.roomId}`}
                                className="px-3.5 py-2 rounded-xl text-[10px] font-black bg-indigo-600 hover:bg-indigo-500 text-white transition-all flex items-center gap-1 shrink-0"
                              >
                                {t('bento_btn_dashboard', activeLocale)} &rarr;
                              </Link>
                            </div>
                          );
                        })
                      ) : (
                        <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-6 text-center text-zinc-500 font-semibold text-[10px] leading-relaxed">
                          {t('bento_empty_hosted', activeLocale)}
                        </div>
                      )}
                    </div>
                </div>

                {/* Attended Rooms Column */}
                <div className="flex flex-col gap-3">
                  <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 font-mono text-left">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{t('bento_attended_title', activeLocale)}</span>
                  </h3>
                  <div className="flex flex-col gap-3">
                    {!isStatusChecked ? (
                      <div className="glass-effect rounded-2xl p-4 border border-white/5 bg-white/[0.01] animate-pulse flex items-center justify-between">
                        <div className="flex flex-col gap-2 w-2/3">
                          <div className="h-4 bg-white/10 rounded w-1/3" />
                          <div className="h-3 bg-white/5 rounded w-1/2" />
                        </div>
                        <div className="h-8 bg-white/10 rounded w-20" />
                      </div>
                    ) : audienceRooms.length > 0 ? (
                      audienceRooms.map((item) => {
                        const details = roomDetails[item.roomId];
                        return (
                          <div 
                            key={item.roomId} 
                            className="glass-effect rounded-2xl p-4 border border-emerald-500/10 hover:border-emerald-500/20 bg-emerald-500/[0.01] flex items-center justify-between transition-all duration-300"
                          >
                            <div className="flex flex-col gap-0.5 text-left min-w-0 pr-3">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="text-base font-mono font-black text-white tracking-wider truncate">
                                  {item.roomId}
                                </h4>
                                {details && (
                                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold capitalize ${
                                    details.tier === 'free' 
                                      ? 'bg-zinc-800 text-zinc-400' 
                                      : details.tier === 'lite'
                                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                        : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                  }`}>
                                    {details.tier === 'free' ? t('free', activeLocale) : details.tier === 'lite' ? 'Lite' : 'Pro'}
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[9px] text-zinc-500 font-mono">
                                  {new Date(item.createdAt).toLocaleDateString(activeLocale === 'ko' ? 'ko-KR' : 'en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                                <span className="text-[9px] text-zinc-500">·</span>
                                {details ? (
                                  <span className={`text-[9px] font-bold font-mono ${details.isExpired ? 'text-red-500' : 'text-emerald-400'}`}>
                                    {formatTimeLeft(details)}
                                  </span>
                                ) : (
                                  <span className="text-[9px] text-zinc-500 font-mono">{t('exp_checking', activeLocale)}</span>
                                )}
                              </div>
                            </div>
                            <Link
                              href={`/room/${item.roomId}`}
                              className="px-3.5 py-2 rounded-xl text-[10px] font-black bg-emerald-600 hover:bg-emerald-500 text-white transition-all flex items-center gap-1 shrink-0"
                            >
                              {t('bento_btn_spectate', activeLocale)} &rarr;
                            </Link>
                          </div>
                        );
                      })
                    ) : (
                      <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-6 text-center text-zinc-500 font-semibold text-[10px] leading-relaxed">
                        {t('bento_empty_attended', activeLocale)}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

          {/* Core Action Cards - Bento Grid Style */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-10">
            {/* 1. Solo Standalone Action Card */}
            <div className="glass-effect rounded-3xl p-6 flex flex-col justify-between border border-white/5 bg-[#0a0a0f]/40 hover:border-indigo-500/20 hover:shadow-[0_0_50px_rgba(99,102,241,0.08)] transition-all duration-300 relative group overflow-hidden active-spring-pad text-left">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all duration-300" />
              <div className="mb-6 relative z-10">
                <span className="text-[9px] font-mono text-pink-400 font-extrabold uppercase tracking-widest">Standalone Signboard</span>
                <h2 className="text-xl font-black text-white mt-3 mb-3 font-outfit">{t('card_standalone_title', activeLocale)}</h2>
                <p className="text-xs text-zinc-400 leading-relaxed font-semibold">
                  {t('card_standalone_desc', activeLocale)}
                </p>
              </div>
              <Link 
                href="/local" 
                className="w-full py-3.5 rounded-xl text-center text-xs tracking-wider flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-indigo-500 text-white font-extrabold shadow-lg hover:opacity-95 transition-all z-10"
              >
                {t('card_standalone_btn', activeLocale)}
              </Link>
            </div>

            {/* 2. Host Action Card */}
            <div className="glass-effect rounded-3xl p-6 flex flex-col justify-between border border-white/5 bg-[#0a0a0f]/40 hover:border-indigo-500/20 hover:shadow-[0_0_50px_rgba(99,102,241,0.08)] transition-all duration-300 relative group overflow-hidden active-spring-pad text-left">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all duration-300" />
              <div className="mb-6 relative z-10">
                <span className="text-[9px] font-mono text-indigo-400 font-extrabold uppercase tracking-widest">For Event Host</span>
                <h2 className="text-xl font-black text-white mt-3 mb-3 font-outfit">{t('card_host_title', activeLocale)}</h2>
                <p className="text-xs text-zinc-400 leading-relaxed font-semibold">
                  {t('card_host_desc', activeLocale)}
                </p>
              </div>
              <Link 
                href="/host/setup" 
                className="w-full py-3.5 rounded-xl text-center text-xs tracking-wider flex items-center justify-center gap-2 bg-white text-black font-extrabold shadow-lg hover:bg-zinc-200 transition-all z-10"
              >
                {t('card_host_btn', activeLocale)}
              </Link>
            </div>

            {/* 3. Spectator Action Card */}
            <div className="glass-effect rounded-3xl p-6 flex flex-col justify-between border border-white/5 bg-[#0a0a0f]/40 hover:border-emerald-500/20 hover:shadow-[0_0_50px_rgba(16,185,129,0.08)] transition-all duration-300 relative group overflow-hidden active-spring-pad text-left">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all duration-300" />
              <div className="relative z-10 mb-4">
                <span className="text-[9px] font-mono text-emerald-400 font-extrabold uppercase tracking-widest">For Audience</span>
                <h2 className="text-xl font-black text-white mt-3 mb-3 font-outfit">{t('card_audience_title', activeLocale)}</h2>
                <p className="text-xs text-zinc-400 leading-relaxed mb-4 font-semibold">
                  {t('card_audience_desc', activeLocale)}
                </p>
                
                {/* Direct join code input interface */}
                <form onSubmit={handleJoinRoomSubmit} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={joinRoomCode}
                    onChange={(e) => {
                      setJoinRoomCode(e.target.value.toUpperCase());
                      setJoinError('');
                    }}
                    placeholder={t('card_audience_input', activeLocale)}
                    className="flex-1 bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-center text-white tracking-widest text-xs font-black focus:outline-none focus:border-indigo-500 uppercase font-mono transition-all"
                    maxLength={6}
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl text-xs font-extrabold shrink-0 flex items-center justify-center gap-1.5 cursor-pointer bg-white text-black hover:bg-zinc-200 transition-all"
                  >
                    {t('card_audience_btn', activeLocale)}
                  </button>
                </form>
                {joinError && <p className="text-[10px] text-red-500 mb-2 text-center font-bold">{joinError}</p>}
              </div>

              <button
                type="button"
                onClick={() => setIsQRScannerOpen(true)}
                className="w-full py-2.5 rounded-xl border border-dashed border-white/10 bg-white/5 text-zinc-300 font-extrabold text-xs hover:bg-white/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer relative z-10"
              >
                {t('card_audience_qr_btn', activeLocale)}
              </button>
            </div>
          </div>



        </div>
      </section>

      {/* Interactive Live Trial Section */}
      <section id="trial" className="py-16 md:py-24 border-t border-white/5 relative bg-black/40 bg-grid-pattern overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 neon-glow-circle-1 opacity-50" />
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-4 font-outfit text-gradient">{t('sim_title', activeLocale)}</h2>
            <p className="text-xs text-zinc-400 font-semibold max-w-md mx-auto leading-relaxed">{t('sim_desc', activeLocale)}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto items-center">
            {/* Live Controller Mockup */}
            <div className="glass-effect rounded-3xl p-6 sm:p-8 flex flex-col gap-6 bg-[#0a0a0f]/50 border border-white/5 shadow-2xl">
              <div className="pb-4 border-b border-white/5 flex justify-between items-center">
                <span className="text-[9px] text-zinc-500 font-black font-mono tracking-widest uppercase">SIMULATION CONSOLE</span>
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
              </div>

              <div>
                <label className="block text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-3">{t('sim_bg_select', activeLocale)}</label>
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
                <label className="block text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-2">{t('sim_text_input', activeLocale)}</label>
                <div className="relative">
                  <input
                    type="text"
                    value={demoPreset.text}
                    onChange={(e) => handleDemoPresetChange('text', e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/20 text-xs font-semibold"
                    placeholder={t('sim_text_placeholder', activeLocale)}
                    maxLength={15}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-mono text-zinc-600 font-bold">
                    {demoPreset.text.length}/15
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-2">{t('sim_text_color', activeLocale)}</label>
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
                      {t('sim_text_light', activeLocale)}
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
                      {t('sim_text_dark', activeLocale)}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-2">{t('sim_effect', activeLocale)}</label>
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
                        {eff === 'none' ? t('sim_effect_static', activeLocale) : eff === 'blink' ? t('sim_effect_blink', activeLocale) : t('sim_effect_marquee', activeLocale)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Speed Range Slider */}
              {demoPreset.effect !== 'none' && (
                <div className="pt-3 border-t border-white/5 animate-in fade-in duration-200">
                  <div className="flex justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2.5">
                    <span>{t('sim_speed', activeLocale)}</span>
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-4 font-outfit text-gradient">{t('features_title', activeLocale)}</h2>
            <p className="text-xs text-zinc-400 max-w-xl mx-auto font-medium">{t('features_desc', activeLocale)}</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.01]">
              <div className="text-[10px] font-mono text-zinc-500 font-bold mb-4">
                01
              </div>
              <h3 className="text-base font-bold text-white mb-2">{t('f1_title', activeLocale)}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                {t('f1_desc', activeLocale)}
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.01]">
              <div className="text-[10px] font-mono text-zinc-500 font-bold mb-4">
                02
              </div>
              <h3 className="text-base font-bold text-white mb-2">{t('f2_title', activeLocale)}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                {t('f2_desc', activeLocale)}
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.01]">
              <div className="text-[10px] font-mono text-zinc-500 font-bold mb-4">
                03
              </div>
              <h3 className="text-base font-bold text-white mb-2">{t('f3_title', activeLocale)}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                {t('f3_desc', activeLocale)}
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.01]">
              <div className="text-[10px] font-mono text-zinc-500 font-bold mb-4">
                04
              </div>
              <h3 className="text-base font-bold text-white mb-2">{t('f4_title', activeLocale)}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                {t('f4_desc', activeLocale)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#07070a] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-6">
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

