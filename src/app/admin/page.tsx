'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  DollarSign, 
  Users, 
  Percent, 
  TrendingUp, 
  Download, 
  Trash2, 
  Check, 
  Globe, 
  LogOut, 
  RefreshCw, 
  Search, 
  Database,
  ShieldAlert,
  BarChart3,
  Calendar,
  Layers,
  ArrowLeft
} from 'lucide-react';
import { Room, Payment, TierType, TIER_CONFIGS } from '@/lib/types';

export default function AdminPage() {
  const router = useRouter();
  
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Data state
  const [rooms, setRooms] = useState<Room[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [cleanupMessage, setCleanupMessage] = useState('');

  // UI state
  const [activeTab, setActiveTab] = useState<'analytics' | 'rooms' | 'payments'>('analytics');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Fetch data on auth success
  useEffect(() => {
    if (isAuthenticated === true) {
      fetchData();
      fetchAnalytics();
    }
  }, [isAuthenticated]);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/admin/check');
      const data = await res.json();
      setIsAuthenticated(!!data.authenticated);
    } catch (err) {
      setIsAuthenticated(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      
      const data = await res.json();
      if (res.ok) {
        setIsAuthenticated(true);
      } else {
        setLoginError(data.error || '접속 정보가 올바르지 않습니다.');
      }
    } catch (err) {
      setLoginError('로그인 중 네트워크 오류가 발생했습니다.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      setIsAuthenticated(false);
      setRooms([]);
      setPayments([]);
      setAnalytics(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/data');
      if (res.ok) {
        const data = await res.json();
        setRooms(data.rooms || []);
        setPayments(data.payments || []);
      }
    } catch (err) {
      console.error('Fetch data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/admin/analytics');
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data.analytics);
      }
    } catch (err) {
      console.error('Fetch analytics error:', err);
    }
  };

  // Admin Actions
  const handleUpdateRoom = async (roomId: string, tier?: TierType, status?: 'active' | 'inactive') => {
    setActionLoading(`room-update-${roomId}`);
    try {
      const res = await fetch('/api/admin/update-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, tier, status })
      });
      if (res.ok) {
        await fetchData();
        await fetchAnalytics();
      }
    } catch (err) {
      console.error('Update room error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm('정말 이 방을 영구적으로 삭제하시겠습니까? 연결된 화면이 즉시 만료됩니다.')) return;
    setActionLoading(`room-delete-${roomId}`);
    try {
      const res = await fetch('/api/admin/delete-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId })
      });
      if (res.ok) {
        await fetchData();
        await fetchAnalytics();
      }
    } catch (err) {
      console.error('Delete room error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdatePayment = async (paymentId: string, status: 'pending' | 'completed' | 'failed') => {
    setActionLoading(`payment-update-${paymentId}`);
    try {
      const res = await fetch('/api/admin/update-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, payment_status: status })
      });
      if (res.ok) {
        await fetchData();
        await fetchAnalytics();
      }
    } catch (err) {
      console.error('Update payment error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('결제 이력을 삭제하시겠습니까?')) return;
    setActionLoading(`payment-delete-${paymentId}`);
    try {
      const res = await fetch('/api/admin/delete-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId })
      });
      if (res.ok) {
        await fetchData();
        await fetchAnalytics();
      }
    } catch (err) {
      console.error('Delete payment error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleManualCleanup = async () => {
    setCleanupMessage('만료된 데이터 정리 중...');
    try {
      const res = await fetch('/api/admin/cleanup', { method: 'POST' });
      if (res.ok) {
        setCleanupMessage('정리가 성공적으로 완료되었습니다.');
        await fetchData();
        await fetchAnalytics();
      } else {
        setCleanupMessage('정리 작업 실패');
      }
    } catch (err) {
      setCleanupMessage('정리 중 네트워크 오류 발생');
    } finally {
      setTimeout(() => setCleanupMessage(''), 3000);
    }
  };

  // CSV Exporters
  const handleExportPaymentsCSV = () => {
    if (!payments || payments.length === 0) return;
    const headers = ['Payment ID', 'Email', 'Room ID', 'Tier', 'Amount (KRW)', 'Status', 'Created At'];
    const rows = payments.map(p => [
      p.id,
      p.email || 'N/A',
      p.room_id,
      p.tier,
      p.amount,
      p.payment_status,
      new Date(p.created_at).toLocaleString()
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' }); // Add BOM for Excel Korean rendering
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `glowwave_payments_export_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportRoomsCSV = () => {
    if (!rooms || rooms.length === 0) return;
    const headers = ['Room ID', 'Email', 'Tier', 'Status', 'Max Capacity', 'Created At'];
    const rows = rooms.map(r => [
      r.id,
      r.email || 'N/A',
      r.tier,
      r.status,
      r.max_participants,
      new Date(r.created_at).toLocaleString()
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `glowwave_rooms_export_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filters & Searches
  const filteredRooms = rooms.filter(room => {
    const matchesSearch = 
      room.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (room.email && room.email.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || room.status === statusFilter;
    const matchesTier = tierFilter === 'all' || room.tier === tierFilter;

    return matchesSearch && matchesStatus && matchesTier;
  });

  const filteredPayments = payments.filter(pay => {
    return (
      pay.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pay.room_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pay.email && pay.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  // Render Loader
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#030305] text-white flex flex-col justify-center items-center">
        <RefreshCw className="w-8 h-8 text-violet-500 animate-spin" />
        <p className="mt-4 text-xs font-bold text-zinc-400 tracking-wider">보안 상태 확인 중...</p>
      </div>
    );
  }

  // Render Login
  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-[#030305] text-white flex flex-col justify-center items-center relative overflow-hidden bg-grid-pattern px-4">
        <div className="absolute top-[30%] left-[20%] w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[20%] right-[10%] w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />

        <div className="w-full max-w-md bg-[#0a0a0f]/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative z-10">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-extrabold text-zinc-400 hover:text-white mb-4 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5 transition-all">
              <ArrowLeft className="w-3.5 h-3.5" /> 메인 홈으로
            </Link>
            <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-violet-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent font-outfit">
              GLOWWAVE OPERATIONS
            </h1>
            <p className="text-xs text-zinc-400 mt-2 font-bold font-outfit tracking-wide uppercase">ADMIN SECURITY ENCLAVE</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[11px] font-black text-zinc-400 uppercase tracking-widest mb-2">ACCESS PASSWORD</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="관리자 비밀번호 입력"
                className="w-full bg-[#0c0c14] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500 transition-colors text-white placeholder-zinc-600"
              />
            </div>

            {loginError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-2.5 rounded-xl font-bold">
                ⚠️ {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-violet-600 hover:bg-violet-500 active:bg-violet-700 disabled:opacity-50 text-white font-extrabold text-sm py-3 px-4 rounded-xl cursor-pointer shadow-lg shadow-violet-600/20 transition-all flex justify-center items-center gap-2"
            >
              {loginLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                '관리자 콘솔 접속'
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Render Dashboard
  return (
    <div className="min-h-screen bg-[#030305] text-white flex flex-col relative overflow-hidden bg-grid-pattern font-sans">
      
      {/* Background neon elements */}
      <div className="absolute top-[10%] left-[-10%] neon-glow-circle-1 opacity-20" />
      <div className="absolute bottom-[20%] right-[-10%] neon-glow-circle-2 opacity-15" />

      {/* Header */}
      <header className="border-b border-white/5 bg-[#030305]/60 backdrop-blur-md sticky top-0 z-30 pt-[calc(env(safe-area-inset-top,0px)+12px)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="font-black text-white tracking-tight font-outfit text-sm uppercase flex items-center gap-2">
              <Database className="w-4 h-4 text-violet-400" />
              GlowWave Admin <span className="text-[10px] text-zinc-500 font-extrabold">BI PLATFORM</span>
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button 
              onClick={handleManualCleanup}
              className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm relative"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">DB 정리 유도</span>
              {cleanupMessage && (
                <span className="absolute top-12 right-0 bg-[#0c0c14] border border-white/10 px-3 py-1.5 rounded-lg text-[10px] text-zinc-300 shadow-xl whitespace-nowrap z-50">
                  {cleanupMessage}
                </span>
              )}
            </button>

            <button 
              onClick={handleLogout}
              className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="로그아웃"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">로그아웃</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main body */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 flex-1 relative z-10">
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2 bg-white/5 border border-white/10 p-1.5 rounded-2xl max-w-md mb-8">
          <button
            onClick={() => { setActiveTab('analytics'); setSearchQuery(''); }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'analytics' 
                ? 'bg-violet-600 text-white font-extrabold shadow-md' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            비즈니스 분석
          </button>
          <button
            onClick={() => { setActiveTab('rooms'); setSearchQuery(''); }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'rooms' 
                ? 'bg-violet-600 text-white font-extrabold shadow-md' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            활성 세션 관리
          </button>
          <button
            onClick={() => { setActiveTab('payments'); setSearchQuery(''); }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'payments' 
                ? 'bg-violet-600 text-white font-extrabold shadow-md' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            결제 장부
          </button>
        </div>

        {/* Tab 1: Business Intelligence Analytics */}
        {activeTab === 'analytics' && analytics && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-[#0c0c14]/80 backdrop-blur-xl border border-white/5 p-5 rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-violet-400" /> 총 매출액
                </span>
                <span className="text-xl sm:text-2xl font-black mt-3 bg-gradient-to-r from-violet-400 to-indigo-300 bg-clip-text text-transparent font-outfit">
                  {analytics.financials.totalRevenue.toLocaleString()}원
                </span>
              </div>
              <div className="bg-[#0c0c14]/80 backdrop-blur-xl border border-white/5 p-5 rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> MRR (최근 30일)
                </span>
                <span className="text-xl sm:text-2xl font-black mt-3 bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent font-outfit">
                  {analytics.financials.mrr.toLocaleString()}원
                </span>
              </div>
              <div className="bg-[#0c0c14]/80 backdrop-blur-xl border border-white/5 p-5 rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-zinc-400" /> 건당 ARPU
                </span>
                <span className="text-xl sm:text-2xl font-black mt-3 font-outfit text-white">
                  {analytics.financials.arpu.toLocaleString()}원
                </span>
              </div>
              <div className="bg-[#0c0c14]/80 backdrop-blur-xl border border-white/5 p-5 rounded-2xl flex flex-col justify-between">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5 text-amber-400" /> 유료 결제 전환율
                </span>
                <span className="text-xl sm:text-2xl font-black mt-3 font-outfit text-amber-400">
                  {analytics.conversions.conversionRate}%
                </span>
              </div>
              <div className="bg-[#0c0c14]/80 backdrop-blur-xl border border-white/5 p-5 rounded-2xl flex flex-col justify-between col-span-2 lg:col-span-1">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-indigo-400" /> 실시간 참관자수
                </span>
                <div className="flex items-baseline gap-2 mt-3">
                  <span className="text-xl sm:text-2xl font-black font-outfit text-indigo-400">
                    {analytics.liveMetrics.activeSpectatorsCount}명
                  </span>
                  <span className="text-[10px] text-zinc-500 font-bold">({analytics.liveMetrics.activeRoomsCount}개 방 활성)</span>
                </div>
              </div>
            </div>

            {/* Visual Analytics Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Product Plan Distribution */}
              <div className="bg-[#0c0c14]/80 backdrop-blur-xl border border-white/5 p-6 rounded-3xl">
                <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-violet-400" /> 등급별 전광판 분포 (총 {analytics.conversions.totalRooms}개)
                </h3>
                <div className="space-y-4">
                  {[
                    { key: 'free', label: '무료 플랜 (Free)', color: 'bg-zinc-600', text: 'text-zinc-400' },
                    { key: 'lite', label: '기본형 (Lite)', color: 'bg-sky-500', text: 'text-sky-400' },
                    { key: 'pro', label: '프리미엄 (Pro)', color: 'bg-violet-500', text: 'text-violet-400' },
                    { key: 'max', label: '맥스형 (Max)', color: 'bg-emerald-500', text: 'text-emerald-400' }
                  ].map(plan => {
                    const count = analytics.conversions.planDistribution[plan.key] || 0;
                    const percent = analytics.conversions.totalRooms > 0 
                      ? Math.round((count / analytics.conversions.totalRooms) * 100) 
                      : 0;
                    return (
                      <div key={plan.key} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold">
                          <span className={plan.text}>{plan.label}</span>
                          <span>{count}개 ({percent}%)</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <div className={`h-full ${plan.color}`} style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Product Market Fit (Category Popularity) */}
              <div className="bg-[#0c0c14]/80 backdrop-blur-xl border border-white/5 p-6 rounded-3xl">
                <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-5 flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-emerald-400" /> 카테고리 프리셋 점유율 (PMF)
                </h3>
                <div className="space-y-3.5">
                  {[
                    { key: 'anniversary', label: '💍 婚禮/紀念日', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30' },
                    { key: 'busking', label: '🎤 演唱會/祭典', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
                    { key: 'sports', label: '⚽ 體育/応援', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
                    { key: 'party', label: '🎉 派對/慶祝', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
                    { key: 'store', label: '🏪 商家/廣告', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
                    { key: 'custom', label: '⚙️ 사용자 커스텀', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' }
                  ].map(cat => {
                    const percent = analytics.productUsage.categoryShares[cat.key] || 0;
                    return (
                      <div key={cat.key} className="flex items-center justify-between text-xs font-bold">
                        <span className="text-zinc-300">{cat.label}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-24 bg-white/5 h-1.5 rounded-full overflow-hidden">
                            <div className="h-full bg-violet-600" style={{ width: `${percent}%` }} />
                          </div>
                          <span className="w-10 text-right">{percent}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Loyalty & Customer Retention */}
              <div className="bg-[#0c0c14]/80 backdrop-blur-xl border border-white/5 p-6 rounded-3xl flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-5 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-zinc-400" /> 리텐션 및 재방문 고객 비율
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-[#06060c] p-3 rounded-xl border border-white/5">
                      <span className="text-xs text-zinc-400 font-bold">총 고유 고객수 (이메일 기준)</span>
                      <span className="text-sm font-extrabold text-white">{analytics.retention.uniqueEmailCount}명</span>
                    </div>
                    <div className="flex justify-between items-center bg-[#06060c] p-3 rounded-xl border border-white/5">
                      <span className="text-xs text-zinc-400 font-bold">2회 이상 방 개설 고객</span>
                      <span className="text-sm font-extrabold text-emerald-400">{analytics.retention.repeatEmailCount}명</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/5 flex items-center gap-5">
                  <div className="w-16 h-16 rounded-full border-4 border-violet-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-black font-outfit">{analytics.retention.repeatCustomerRate}%</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-white">단골 고객 재개설율</h4>
                    <p className="text-[10px] text-zinc-500 mt-1 font-bold">이메일 매칭을 통해 재방문 결제 및 무료 테스트 유저의 비율을 계산한 리텐션 수치입니다.</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Quick Actions Panel */}
            <div className="bg-[#0c0c14]/80 backdrop-blur-xl border border-white/5 p-6 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-sm font-black text-white">데이터 내보내기 및 정산</h3>
                <p className="text-xs text-zinc-500 mt-1 font-bold">세무 신고, 사업 지표 분석, 마케팅 조사를 위한 엑셀 호환 CSV 자료를 출력합니다.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleExportRoomsCSV}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 px-3.5 py-2 rounded-xl text-xs font-bold text-zinc-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  방 목록 백업 (.csv)
                </button>
                <button
                  onClick={handleExportPaymentsCSV}
                  className="bg-violet-600 hover:bg-violet-500 text-white px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-violet-600/10"
                >
                  <Download className="w-3.5 h-3.5" />
                  결제 데이터 정산 (.csv)
                </button>
              </div>
            </div>

          </div>
        )}

        {/* Search Bar (Only shown on Tab 2 and Tab 3) */}
        {activeTab !== 'analytics' && (
          <div className="mb-6 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-zinc-500" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={activeTab === 'rooms' ? "이메일 또는 방 ID 검색" : "이메일, 방 ID, 결제 ID 검색"}
                className="w-full bg-[#0c0c14]/80 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>

            {activeTab === 'rooms' && (
              <div className="flex gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-[#0c0c14]/80 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-zinc-300 focus:outline-none focus:border-violet-500 transition-all cursor-pointer"
                >
                  <option value="all">상태 전체</option>
                  <option value="active">Active (송출 중)</option>
                  <option value="inactive">Inactive (대기 중)</option>
                </select>

                <select
                  value={tierFilter}
                  onChange={(e) => setTierFilter(e.target.value)}
                  className="bg-[#0c0c14]/80 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-zinc-300 focus:outline-none focus:border-violet-500 transition-all cursor-pointer"
                >
                  <option value="all">요금제 전체</option>
                  <option value="free">Free (테스트)</option>
                  <option value="lite">Lite (기본형)</option>
                  <option value="pro">Pro (프리미엄)</option>
                  <option value="max">Max (맥스형)</option>
                </select>
              </div>
            )}

            {activeTab === 'payments' && (
              <button
                onClick={handleExportPaymentsCSV}
                className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-violet-600/10 self-start md:self-auto"
              >
                <Download className="w-3.5 h-3.5" />
                이력 다운로드 (CSV)
              </button>
            )}
          </div>
        )}

        {/* Tab 2: Rooms Sessions Manager */}
        {activeTab === 'rooms' && (
          <div className="bg-[#0c0c14]/80 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in duration-200">
            {loading ? (
              <div className="p-12 text-center text-zinc-500 text-xs font-bold flex flex-col justify-center items-center">
                <RefreshCw className="w-6 h-6 text-violet-500 animate-spin mb-3" />
                세션 정보를 불러오는 중...
              </div>
            ) : filteredRooms.length === 0 ? (
              <div className="p-12 text-center text-zinc-500 text-xs font-bold">
                조회된 활성 세션(방)이 없습니다.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 text-zinc-400 font-black tracking-wider uppercase text-[10px] border-b border-white/5">
                    <tr>
                      <th className="px-6 py-4">방 ID / 생성 일시</th>
                      <th className="px-6 py-4">이메일</th>
                      <th className="px-6 py-4">구독 등급</th>
                      <th className="px-6 py-4">참관인</th>
                      <th className="px-6 py-4">송출 상태</th>
                      <th className="px-6 py-4 text-right">제어</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredRooms.map((room) => {
                      const isMutating = actionLoading?.includes(room.id);
                      return (
                        <tr key={room.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-extrabold text-white">{room.id}</div>
                            <div className="text-[10px] text-zinc-500 mt-1 font-bold">
                              {new Date(room.created_at).toLocaleString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-bold text-zinc-300">
                            {room.email || 'N/A'}
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={room.tier}
                              disabled={isMutating}
                              onChange={(e) => handleUpdateRoom(room.id, e.target.value as TierType, undefined)}
                              className="bg-[#030305] border border-white/10 rounded-lg px-2.5 py-1 text-xs font-bold text-zinc-300 focus:outline-none cursor-pointer focus:border-violet-500"
                            >
                              <option value="free">Free (15명)</option>
                              <option value="lite">Lite (60명)</option>
                              <option value="pro">Pro (250명)</option>
                              <option value="max">Max (800명)</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 font-bold text-zinc-400">
                            {room.active_clients || 0}명 / {room.max_participants}명
                          </td>
                          <td className="px-6 py-4">
                            <span 
                              onClick={() => {
                                const newStatus = room.status === 'active' ? 'inactive' : 'active';
                                handleUpdateRoom(room.id, undefined, newStatus);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase cursor-pointer select-none border transition-all ${
                                room.status === 'active'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                  : 'bg-zinc-800 text-zinc-400 border-white/5 hover:bg-zinc-700'
                              }`}
                            >
                              {room.status === 'active' ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              disabled={isMutating}
                              onClick={() => handleDeleteRoom(room.id)}
                              className="p-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg transition-all cursor-pointer"
                              title="세션 만료/삭제"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Payments & Financial Logs */}
        {activeTab === 'payments' && (
          <div className="bg-[#0c0c14]/80 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in duration-200">
            {loading ? (
              <div className="p-12 text-center text-zinc-500 text-xs font-bold flex flex-col justify-center items-center">
                <RefreshCw className="w-6 h-6 text-violet-500 animate-spin mb-3" />
                장부 내역을 조회 중...
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="p-12 text-center text-zinc-500 text-xs font-bold">
                등록된 결제 거래 내역이 없습니다.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 text-zinc-400 font-black tracking-wider uppercase text-[10px] border-b border-white/5">
                    <tr>
                      <th className="px-6 py-4">결제 ID / 승인 시각</th>
                      <th className="px-6 py-4">방 ID</th>
                      <th className="px-6 py-4">이메일</th>
                      <th className="px-6 py-4">구매 등급</th>
                      <th className="px-6 py-4">결제액</th>
                      <th className="px-6 py-4">진행 상태</th>
                      <th className="px-6 py-4 text-right">삭제</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredPayments.map((pay) => {
                      const isMutating = actionLoading?.includes(pay.id);
                      return (
                        <tr key={pay.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-extrabold text-zinc-300 text-[11px] truncate max-w-[120px]">{pay.id}</div>
                            <div className="text-[10px] text-zinc-500 mt-1 font-bold">
                              {new Date(pay.created_at).toLocaleString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-extrabold text-white">
                            {pay.room_id}
                          </td>
                          <td className="px-6 py-4 font-bold text-zinc-400">
                            {pay.email || 'N/A'}
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-0.5 rounded text-[10px] bg-white/5 border border-white/10 font-bold uppercase text-zinc-300">
                              {pay.tier}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-extrabold text-white">
                            {pay.amount.toLocaleString()}원
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={pay.payment_status}
                              disabled={isMutating}
                              onChange={(e) => handleUpdatePayment(pay.id, e.target.value as any)}
                              className={`px-2 py-1 rounded-lg text-[10px] font-black border bg-[#030305] focus:outline-none cursor-pointer ${
                                pay.payment_status === 'completed'
                                  ? 'text-emerald-400 border-emerald-500/20'
                                  : pay.payment_status === 'failed'
                                  ? 'text-red-400 border-red-500/20'
                                  : 'text-amber-400 border-amber-500/20'
                              }`}
                            >
                              <option value="pending" className="text-amber-400">Pending</option>
                              <option value="completed" className="text-emerald-400">Completed (승인)</option>
                              <option value="failed" className="text-red-400">Failed</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              disabled={isMutating}
                              onClick={() => handleDeletePayment(pay.id)}
                              className="p-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg transition-all cursor-pointer"
                              title="기록 소거"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 bg-[#030305] text-center text-[10px] text-zinc-600 font-bold font-outfit uppercase tracking-widest relative z-10">
        © 2026 GLOWWAVE ADMIN ENCLAVE. ALL RIGHTS SECURED.
      </footer>

    </div>
  );
}
