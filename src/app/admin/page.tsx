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
  ArrowLeft,
  Edit,
  Plus,
  Trash,
  Eye,
  Lock
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
  const [activeTab, setActiveTab] = useState<'analytics' | 'rooms' | 'payments' | 'templates' | 'trends'>('analytics');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<string>('all');

  // Real-time custom preset trends state
  const [trendsStats, setTrendsStats] = useState<any>({
    fontUsage: {},
    effectUsage: {},
    textSamples: [],
    liveHotRooms: [],
    segmentation: { b2cCount: 0, b2bCount: 0, total: 0 },
    visualThemes: [],
    featuresAdoption: { luckyDrawCount: 0, countdownCount: 0, totalActiveStates: 0 }
  });

  // Localized templates CRUD states
  const [localizedTemplates, setLocalizedTemplates] = useState<any>(null);
  const [selectedLang, setSelectedLang] = useState<string>('ko');
  const [selectedCat, setSelectedCat] = useState<string>('anniversary');
  const [editingPresetIndex, setEditingPresetIndex] = useState<number | null>(null);
  const [editingPreset, setEditingPreset] = useState<any>(null);
  const [isAddingPreset, setIsAddingPreset] = useState<boolean>(false);

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
        if (data.stats) {
          setTrendsStats(data.stats);
        }
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

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/admin/templates');
      if (res.ok) {
        const data = await res.json();
        setLocalizedTemplates(data.templates);
      }
    } catch (err) {
      console.error('Fetch templates error:', err);
    }
  };

  const handleSaveTemplates = async (updatedTemplates: any) => {
    setActionLoading('templates-save');
    try {
      const res = await fetch('/api/admin/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templates: updatedTemplates })
      });
      if (res.ok) {
        setLocalizedTemplates(updatedTemplates);
        alert('기본 템플릿 변경사항이 시스템 디스크에 성공적으로 영구 반영되었습니다!');
      } else {
        alert('템플릿 저장 실패');
      }
    } catch (err) {
      console.error('Save templates error:', err);
      alert('템플릿 저장 중 네트워크 오류 발생');
    } finally {
      setActionLoading(null);
    }
  };

  // Fetch templates when auth is successful
  useEffect(() => {
    if (isAuthenticated === true) {
      fetchTemplates();
    }
  }, [isAuthenticated]);

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
        <div className="flex items-center gap-1.5 sm:gap-2 bg-white/5 border border-white/10 p-1.5 rounded-2xl max-w-2xl mb-8 overflow-x-auto shrink-0">
          <button
            onClick={() => { setActiveTab('analytics'); setSearchQuery(''); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${
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
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${
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
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'payments' 
                ? 'bg-violet-600 text-white font-extrabold shadow-md' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            결제 장부
          </button>
          <button
            onClick={() => { setActiveTab('templates'); setSearchQuery(''); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'templates' 
                ? 'bg-violet-600 text-white font-extrabold shadow-md' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            기본 템플릿 관리
          </button>
          <button
            onClick={() => { setActiveTab('trends'); setSearchQuery(''); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'trends' 
                ? 'bg-violet-600 text-white font-extrabold shadow-md' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            사용 트렌드 분석
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
              
              {/* Product Plan Distribution (Free trial, event, monthly, annual) */}
              <div className="bg-[#0c0c14]/80 backdrop-blur-xl border border-white/5 p-6 rounded-3xl">
                <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-violet-400" /> 등급별 전광판 분포 (실물 집계)
                </h3>
                <div className="space-y-4">
                  {[
                    { key: 'free', label: '무료 일일 체험 (Free Trial)', color: 'bg-zinc-600', text: 'text-zinc-400' },
                    { key: 'event', label: '다인용 이벤트 플랜 (Event Plan)', color: 'bg-sky-500', text: 'text-sky-400' },
                    { key: 'store', label: '매장 월간 플랜 (Store Monthly)', color: 'bg-violet-500', text: 'text-violet-400' },
                    { key: 'store_annual', label: '매장 연간 플랜 (Store Annual)', color: 'bg-emerald-500', text: 'text-emerald-400' }
                  ].map(plan => {
                    const count = (trendsStats.tierCounts && trendsStats.tierCounts[plan.key]) || 0;
                    const total = (trendsStats.segmentation?.total) || rooms.length;
                    const percent = total > 0 ? Math.round((count / total) * 100) : 0;
                    return (
                      <div key={plan.key} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold">
                          <span className={plan.text}>{plan.label}</span>
                          <span className="font-mono">{count}개 ({percent}%)</span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                          <div className={`h-full ${plan.color}`} style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Locale Language Distribution */}
              <div className="bg-[#0c0c14]/80 backdrop-blur-xl border border-white/5 p-6 rounded-3xl">
                <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-5 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" /> 접속 언어권 분포 (User Locale Share)
                </h3>
                <div className="space-y-3.5">
                  {[
                    { key: 'ko', label: '🇰🇷 한국어 (Korean)' },
                    { key: 'en', label: '🇺🇸 영어 (English)' },
                    { key: 'ja', label: '🇯🇵 일본어 (Japanese)' },
                    { key: 'es', label: '🇪🇸 스페인어 (Spanish)' },
                    { key: 'zh-TW', label: '🇹🇼 대만 번체 (Traditional)' },
                    { key: 'zh-HK', label: '🇭🇰 홍콩 광둥어 (Cantonese)' }
                  ].map(lang => {
                    const count = (trendsStats.localeUsage && trendsStats.localeUsage[lang.key]) || 0;
                    const total = (trendsStats.segmentation?.total) || rooms.length;
                    const percent = total > 0 ? Math.round((count / total) * 100) : 0;
                    return (
                      <div key={lang.key} className="flex items-center justify-between text-xs font-bold">
                        <span className="text-zinc-300">{lang.label}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-24 bg-white/5 h-1.5 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: `${percent}%` }} />
                          </div>
                          <span className="w-12 text-right font-mono">{percent}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Loyalty & Sync Retention */}
              <div className="bg-[#0c0c14]/80 backdrop-blur-xl border border-white/5 p-6 rounded-3xl flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-5 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-zinc-400" /> 동기화 재사용 리텐션 (User Retention)
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-[#06060c] p-3 rounded-xl border border-white/5">
                      <span className="text-xs text-zinc-400 font-bold">총 고유 사용자 (메일 기준)</span>
                      <span className="text-sm font-extrabold text-white font-mono">
                        {trendsStats.retention?.totalUsers || 0}명
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-[#06060c] p-3 rounded-xl border border-white/5">
                      <span className="text-xs text-zinc-400 font-bold">재사용 및 결제 고객</span>
                      <span className="text-sm font-extrabold text-emerald-400 font-mono">
                        {trendsStats.retention?.retainedUsers || 0}명
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/5 flex items-center gap-5">
                  <div className="w-16 h-16 rounded-full border-4 border-violet-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-black font-outfit">{trendsStats.retention?.retentionRate || 0}%</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-white">동기화 재방문율</h4>
                    <p className="text-[10px] text-zinc-500 mt-1 font-bold">이메일 복구 동기화 기능을 거쳐 동일 메일로 2회 이상 방을 개설하거나 결제한 단골 비율입니다.</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Quick Actions Panel */}
            <div className="bg-[#0c0c14]/80 backdrop-blur-xl border border-white/5 p-6 rounded-3xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-sm font-black text-white">데이터 내보내기 및 백업</h3>
                <p className="text-xs text-zinc-500 mt-1 font-bold">세무 정산 및 마케팅 조사를 위한 엑셀 호환 CSV 리포트를 내보냅니다.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleExportRoomsCSV}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 px-3.5 py-2 rounded-xl text-xs font-bold text-zinc-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  전광판 개설 목록 (.csv)
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

            {/* 4단: User Registry Table - PO/PM Master View */}
            <div className="bg-[#0c0c14]/80 backdrop-blur-xl border border-white/5 p-6 rounded-3xl">
              <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2 font-mono">
                <Users className="w-4 h-4 text-violet-400" /> 고유 사용자 식별 명부 및 활동 기여도 (User Registry)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-zinc-300 border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                      <th className="py-2.5">사용자 이메일</th>
                      <th>전체 방 개설 수</th>
                      <th>유료 결제 건수</th>
                      <th>최종 활동 기록</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs font-medium">
                    {(trendsStats.userRegistry || []).map((user: any, idx: number) => (
                      <tr key={idx} className="hover:bg-white/[0.01]">
                        <td className="py-3 font-extrabold text-zinc-300 font-mono">{user.email}</td>
                        <td className="font-mono text-zinc-400 font-extrabold">{user.room_count}개 개설</td>
                        <td>
                          <span className={`px-2 py-0.5 rounded text-[8px] border font-black ${
                            user.paid_count > 0 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-white/5 text-zinc-400 border-white/5'
                          }`}>
                            {user.paid_count > 0 ? `유료 충전 ${user.paid_count}회` : '무료 체험'}
                          </span>
                        </td>
                        <td className="text-zinc-500 text-[10px] font-mono">
                          {new Date(user.last_active).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {(!trendsStats.userRegistry || trendsStats.userRegistry.length === 0) && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-zinc-500 text-[10px] font-bold">
                          확인 가능한 사용자 가입 메일 내역이 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
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
                            <div className="flex flex-col gap-1 select-none">
                              <span 
                                onClick={() => {
                                  const newStatus = room.status === 'active' ? 'inactive' : 'active';
                                  handleUpdateRoom(room.id, undefined, newStatus);
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase cursor-pointer border transition-all text-center block w-32 ${
                                  room.status === 'active'
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                                    : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                                }`}
                                title="클릭 시 송출 상태를 차단하거나 정상화합니다."
                              >
                                {room.status === 'active' ? '● 송출 활성화' : '○ 송출 임시차단'}
                              </span>
                              <span className="text-[8px] text-zinc-500 font-bold block">
                                {room.status === 'active' ? '정상 브로드캐스팅 중' : '사용자 화면 차단됨'}
                              </span>
                            </div>
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
                            <div className="flex flex-col gap-1">
                              <select
                                value={pay.payment_status}
                                disabled={isMutating}
                                onChange={(e) => handleUpdatePayment(pay.id, e.target.value as any)}
                                className={`px-2 py-1 rounded-lg text-[9px] font-black border bg-[#030305] focus:outline-none cursor-pointer ${
                                  pay.payment_status === 'completed'
                                    ? 'text-emerald-400 border-emerald-500/20'
                                    : pay.payment_status === 'failed'
                                    ? 'text-red-400 border-red-500/20'
                                    : 'text-amber-400 border-amber-500/20'
                                }`}
                              >
                                <option value="pending" className="text-amber-400">🕒 입금 대기 (Pending)</option>
                                <option value="completed" className="text-emerald-400">✅ 결제 완료 승인 (Completed)</option>
                                <option value="failed" className="text-red-400">❌ 결제 실패 거절 (Failed)</option>
                              </select>
                              <span className="text-[8px] text-zinc-500 font-bold block">
                                {pay.payment_status === 'completed' ? '정상 등급 활성화' : (pay.payment_status === 'failed' ? '입금 거절/주문 취소' : '대기 상태')}
                              </span>
                            </div>
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

        {/* Tab 4: System Base Templates Manager (CRUD) */}
        {activeTab === 'templates' && localizedTemplates && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0c0c14]/80 backdrop-blur-xl border border-white/5 p-6 rounded-2xl">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Globe className="w-4 h-4 text-violet-400" /> 시스템 기본 프리셋 템플릿 매니저
                </h2>
                <p className="text-[10px] text-zinc-500 mt-1 font-medium">
                  여기의 변경사항은 시스템 코드 파일에 영구적으로 반영되며, 전 세계 모든 사용자의 전광판 대시보드에 실시간 반영됩니다.
                </p>
              </div>
              <button
                onClick={() => handleSaveTemplates(localizedTemplates)}
                disabled={actionLoading === 'templates-save'}
                className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-extrabold text-xs tracking-wider rounded-xl cursor-pointer shadow-lg shadow-violet-600/20 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                {actionLoading === 'templates-save' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                디스크 파일에 변경 최종 저장 및 즉시 배포
              </button>
            </div>

            {/* Language Selection Filter */}
            <div className="flex items-center gap-1.5 p-1 bg-white/5 border border-white/5 rounded-xl overflow-x-auto shrink-0">
              {[
                { code: 'ko', name: '🇰🇷 한국어 (Korean)' },
                { code: 'en', name: '🇺🇸 영어 (English)' },
                { code: 'ja', name: '🇯🇵 일본어 (Japanese)' },
                { code: 'es', name: '🇪🇸 스페인어 (Spanish)' },
                { code: 'zh-TW', name: '🇹🇼 대만어 (Traditional)' },
                { code: 'zh-HK', name: '🇭🇰 홍콩어 (Cantonese)' }
              ].map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setSelectedLang(lang.code);
                    setEditingPresetIndex(null);
                    setEditingPreset(null);
                    setIsAddingPreset(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wide transition-all shrink-0 cursor-pointer ${
                    selectedLang === lang.code
                      ? 'bg-white/10 text-white font-black shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {lang.name}
                </button>
              ))}
            </div>

            {/* Category selection */}
            <div className="flex items-center gap-1 bg-black/20 p-1 rounded-xl border border-white/5 max-w-lg overflow-x-auto shrink-0">
              {[
                { id: 'anniversary', label: '🎂 이벤트/기념일' },
                { id: 'busking', label: '🎤 공연/버스킹' },
                { id: 'sports', label: '⚽ 스포츠/응원' },
                { id: 'party', label: '🎉 페스티벌/파티' },
                { id: 'store', label: '☕ 매장/안내' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCat(cat.id);
                    setEditingPresetIndex(null);
                    setEditingPreset(null);
                    setIsAddingPreset(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all shrink-0 cursor-pointer ${
                    selectedCat === cat.id
                      ? 'bg-violet-600/20 text-violet-400 border border-violet-500/20 font-extrabold'
                      : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Main Manager Body: Preset Grid & Edit Editor Forms */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Grid: Preset list Cards */}
              <div className="lg:col-span-8 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Preset items cards list */}
                  {((localizedTemplates[selectedLang] || []).find((c: any) => c.id === selectedCat)?.presets || []).map((preset: any, idx: number) => {
                    const isSelected = editingPresetIndex === idx && !isAddingPreset;
                    return (
                      <div
                        key={idx}
                        className={`bg-[#0c0c14]/80 backdrop-blur-xl border p-5 rounded-2xl flex flex-col justify-between transition-all relative overflow-hidden ${
                          isSelected
                            ? 'border-violet-500/50 shadow-lg shadow-violet-950/20 ring-1 ring-violet-500/20'
                            : 'border-white/5 hover:border-white/10'
                        }`}
                      >
                        {/* Live Preset Preview Card */}
                        <div
                          className="w-full h-24 rounded-xl flex items-center justify-center font-black relative overflow-hidden border border-white/5 select-none"
                          style={{
                            backgroundColor: preset.bg_color || '#000000',
                            color: preset.text_color || '#FFFFFF',
                            fontFamily: preset.font_family === 'serif' ? 'Noto Serif KR, Georgia, serif' : (preset.font_family === 'plump' ? 'yg-jalnan, Impact, sans-serif' : 'sans-serif')
                          }}
                        >
                          <span className="text-center text-sm px-4 truncate max-w-full uppercase tracking-wider">{preset.text || 'TEXT'}</span>
                        </div>

                        {/* Preset Card Details Info */}
                        <div className="mt-4 flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="text-[10px] text-zinc-400 font-extrabold font-mono flex items-center gap-1.5">
                              <Layers className="w-3.5 h-3.5 text-zinc-600" />
                              <span>Effect: <span className="text-violet-400 font-black">{preset.effect}</span></span>
                            </div>
                            <div className="text-[9px] text-zinc-500 font-bold font-mono">
                              Font: {preset.font_family || 'default'} · bg: {preset.bg_color}
                            </div>
                          </div>

                          {/* Quick Edit Controls */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPresetIndex(idx);
                                setEditingPreset({ ...preset });
                                setIsAddingPreset(false);
                              }}
                              className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white rounded-lg transition-all cursor-pointer"
                              title="수정"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (!confirm('이 프리셋 카드를 기본 템플릿 목록에서 삭제하시겠습니까? (최종 저장 버튼을 눌러야 디스크에 반영됩니다)')) return;
                                const copy = { ...localizedTemplates };
                                const category = copy[selectedLang].find((c: any) => c.id === selectedCat);
                                if (category) {
                                  category.presets.splice(idx, 1);
                                  setLocalizedTemplates(copy);
                                  setEditingPresetIndex(null);
                                  setEditingPreset(null);
                                }
                              }}
                              className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg transition-all cursor-pointer"
                              title="삭제"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Add New Preset Trigger Card */}
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPresetIndex(null);
                      setEditingPreset({
                        bg_color: '#0B0B0F',
                        text: selectedLang === 'en' || selectedLang === 'es' ? 'Welcome' : '생일축하해',
                        text_color: '#FFFFFF',
                        effect: 'none',
                        speed: 1000,
                        font_family: 'sans-thin',
                        font_size: 100,
                        locale: selectedLang
                      });
                      setIsAddingPreset(true);
                    }}
                    className="border border-dashed border-white/10 hover:border-violet-500/30 bg-[#0c0c14]/40 hover:bg-[#0c0c14]/80 p-8 rounded-2xl flex flex-col justify-center items-center gap-3 transition-all min-h-[170px] cursor-pointer group"
                  >
                    <Plus className="w-6 h-6 text-zinc-500 group-hover:text-violet-400 transition-colors" />
                    <span className="text-[10px] font-black text-zinc-500 group-hover:text-violet-400 uppercase tracking-widest transition-colors">새 프리셋 템플릿 추가</span>
                  </button>
                </div>
              </div>

              {/* Right Panel: CRUD Editor form */}
              <div className="lg:col-span-4">
                {(editingPreset || isAddingPreset) ? (
                  <div className="bg-[#0c0c14]/80 backdrop-blur-xl border border-white/5 p-6 rounded-2xl flex flex-col gap-5 sticky top-24">
                    <div>
                      <h3 className="text-xs font-black text-white uppercase tracking-wider">
                        {isAddingPreset ? '🆕 템플릿 카드 추가' : `✏️ 프리셋 P${(editingPresetIndex || 0) + 1} 상세 편집`}
                      </h3>
                      <p className="text-[9px] text-zinc-500 mt-1 font-medium">실시간으로 디자인 스펙을 조정하세요.</p>
                    </div>

                    {/* Preview Area */}
                    <div
                      className="w-full h-24 rounded-xl flex items-center justify-center font-black overflow-hidden border border-white/5 relative select-none"
                      style={{
                        backgroundColor: editingPreset.bg_color || '#000000',
                        color: editingPreset.text_color || '#FFFFFF',
                        fontFamily: editingPreset.font_family === 'serif' ? 'Noto Serif KR, Georgia, serif' : (editingPreset.font_family === 'plump' ? 'yg-jalnan, Impact, sans-serif' : 'sans-serif')
                      }}
                    >
                      <span className="text-center text-sm px-4 truncate max-w-full uppercase tracking-wider">{editingPreset.text || 'PREVIEW'}</span>
                    </div>

                    {/* Form Controls */}
                    <div className="space-y-4">
                      {/* Output Text */}
                      <div>
                        <div className="flex justify-between mb-1.5">
                          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">출력 텍스트</label>
                          <span className="text-[9px] font-mono text-zinc-500 font-bold">
                            {(editingPreset.text || '').length}/{(selectedLang === 'en' || selectedLang === 'es') ? 20 : 15}
                          </span>
                        </div>
                        <input
                          type="text"
                          value={editingPreset.text || ''}
                          onChange={(e) => setEditingPreset((prev: any) => ({ ...prev, text: e.target.value.slice(0, (selectedLang === 'en' || selectedLang === 'es') ? 20 : 15) }))}
                          placeholder="전광판 문구 입력"
                          className="w-full bg-[#030305] border border-white/10 rounded-xl px-4 py-2 text-xs font-semibold text-white focus:outline-none focus:border-violet-500 transition-colors"
                        />
                      </div>

                      {/* bg color primary */}
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">기본 배경 색상</label>
                        <div className="grid grid-cols-6 gap-1 bg-black/40 p-1.5 rounded-xl border border-white/5">
                          {[
                            '#EF4444', '#F97316', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6', 
                            '#6366F1', '#8B5CF6', '#D946EF', '#EC4899', '#FFFFFF', '#0B0B0F'
                          ].map((hex) => {
                            const isSelected = editingPreset.bg_color === hex;
                            return (
                              <button
                                key={hex}
                                type="button"
                                onClick={() => setEditingPreset((prev: any) => ({ ...prev, bg_color: hex }))}
                                className={`h-6 rounded-lg border cursor-pointer relative transition-all flex items-center justify-center ${
                                  isSelected ? 'border-white scale-105 shadow-md' : 'border-white/5 hover:border-white/20'
                                }`}
                                style={{ backgroundColor: hex }}
                              >
                                {isSelected && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                                )}
                              </button>
                            );
                          })}
                          <div
                            className="h-6 rounded-lg overflow-hidden border border-white/10 hover:scale-105 transition-all shadow-md cursor-pointer relative flex items-center justify-center"
                            style={{ background: 'linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8b00ff)' }}
                            title="배경 커스텀 색상 선택"
                          >
                            <input
                              type="color"
                              value={editingPreset.bg_color || '#000000'}
                              onChange={(e) => setEditingPreset((prev: any) => ({ ...prev, bg_color: e.target.value }))}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-150"
                            />
                            {editingPreset.bg_color && !['#EF4444', '#F97316', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6',
                              '#6366F1', '#8B5CF6', '#D946EF', '#EC4899', '#FFFFFF', '#0B0B0F'].includes(editingPreset.bg_color) && (
                              <span className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Text Color picker */}
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">글자 색상</label>
                        <div className="grid grid-cols-6 gap-1 bg-black/40 p-1.5 rounded-xl border border-white/5">
                          {[
                            '#FFFFFF', '#000000', '#FFD700', '#EF4444', '#10B981', '#3B82F6',
                            '#D946EF', '#00FFFF', '#EC4899', '#8B5CF6', '#F97316', '#F59E0B'
                          ].map((hex) => {
                            const isSelected = editingPreset.text_color === hex;
                            return (
                              <button
                                key={hex}
                                type="button"
                                onClick={() => setEditingPreset((prev: any) => ({ ...prev, text_color: hex }))}
                                className={`h-6 rounded-lg border cursor-pointer relative transition-all flex items-center justify-center ${
                                  isSelected ? 'border-white scale-105 shadow-md' : 'border-white/5 hover:border-white/20'
                                }`}
                                style={{ backgroundColor: hex }}
                              >
                                {isSelected && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                                )}
                              </button>
                            );
                          })}
                          <div
                            className="h-6 rounded-lg overflow-hidden border border-white/10 hover:scale-105 transition-all shadow-md cursor-pointer relative flex items-center justify-center"
                            style={{ background: 'linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8b00ff)' }}
                            title="글자 커스텀 색상 선택"
                          >
                            <input
                              type="color"
                              value={editingPreset.text_color || '#FFFFFF'}
                              onChange={(e) => setEditingPreset((prev: any) => ({ ...prev, text_color: e.target.value }))}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-150"
                            />
                            {editingPreset.text_color && !['#FFFFFF', '#000000', '#FFD700', '#EF4444', '#10B981', '#3B82F6',
                              '#D946EF', '#00FFFF', '#EC4899', '#8B5CF6', '#F97316', '#F59E0B'].includes(editingPreset.text_color) && (
                              <span className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* bg_color_secondary */}
                      {(editingPreset.effect === 'blink' || editingPreset.effect === 'luckydraw_wait' || editingPreset.effect === 'luckydraw') && (
                        <div className="pt-3 border-t border-white/5 animate-in fade-in duration-200">
                          <div className="flex justify-between items-center mb-2">
                            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">보조 배경 색상</label>
                            {editingPreset.bg_color_secondary && (
                              <button
                                type="button"
                                onClick={() => setEditingPreset((prev: any) => {
                                  const copy = { ...prev };
                                  delete copy.bg_color_secondary;
                                  return copy;
                                })}
                                className="text-[9px] text-red-400 font-bold hover:underline cursor-pointer"
                              >
                                보조색 해제 (단색 전환)
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-6 gap-1 bg-black/40 p-1.5 rounded-xl border border-white/5">
                            {[
                              '#EF4444', '#F97316', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6', 
                              '#6366F1', '#8B5CF6', '#D946EF', '#EC4899', '#FFFFFF', '#0B0B0F'
                            ].map((hex) => {
                              const isSelected = editingPreset.bg_color_secondary === hex;
                              return (
                                <button
                                  key={hex}
                                  type="button"
                                  onClick={() => setEditingPreset((prev: any) => ({ ...prev, bg_color_secondary: hex }))}
                                  className={`h-6 rounded-lg border cursor-pointer relative transition-all flex items-center justify-center ${
                                    isSelected ? 'border-white scale-105 shadow-md' : 'border-white/5 hover:border-white/20'
                                  }`}
                                  style={{ backgroundColor: hex }}
                                >
                                  {isSelected && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                                  )}
                                </button>
                              );
                            })}
                            <div
                              className="h-6 rounded-lg overflow-hidden border border-white/10 hover:scale-105 transition-all shadow-md cursor-pointer relative flex items-center justify-center"
                              style={{ background: 'linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #8b00ff)' }}
                              title="보조 커스텀 색상 선택"
                            >
                              <input
                                type="color"
                                value={editingPreset.bg_color_secondary || '#000000'}
                                onChange={(e) => setEditingPreset((prev: any) => ({ ...prev, bg_color_secondary: e.target.value }))}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-150"
                              />
                              {editingPreset.bg_color_secondary && !['#EF4444', '#F97316', '#F59E0B', '#10B981', '#06B6D4', '#3B82F6',
                                '#6366F1', '#8B5CF6', '#D946EF', '#EC4899', '#FFFFFF', '#0B0B0F'].includes(editingPreset.bg_color_secondary) && (
                                <span className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Motion Effect */}
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">애니메이션 효과</label>
                        <select
                          value={editingPreset.effect || 'none'}
                          onChange={(e) => setEditingPreset((prev: any) => ({ ...prev, effect: e.target.value }))}
                          className="w-full bg-[#030305] border border-white/10 rounded-xl px-4 py-2 text-xs font-semibold text-white focus:outline-none focus:border-violet-500 transition-colors cursor-pointer"
                        >
                          <option value="none">단색 고정 (None)</option>
                          <option value="blink">전면 부드러운 깜빡이 (Blink)</option>
                          <option value="marquee">가로 스크롤 흘러가기 (Scroll)</option>
                          <option value="countdown">카운트다운 타이머 (Timer)</option>
                          <option value="luckydraw_wait">럭키드로우 추첨 대기 (Raffle Wait)</option>
                        </select>
                      </div>

                      {/* countdown specific inputs */}
                      {editingPreset.effect === 'countdown' && (
                        <div className="pt-3 border-t border-white/5 space-y-4 animate-in fade-in duration-200">
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">카운트다운 초 설정</label>
                            <div className="grid grid-cols-5 gap-1 bg-black/40 p-1 rounded-full border border-white/5">
                              {[3, 5, 10, 30, 60].map((sec) => (
                                <button
                                  type="button"
                                  key={sec}
                                  onClick={() => setEditingPreset((prev: any) => ({ ...prev, countdown_seconds: sec }))}
                                  className={`py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                                    (editingPreset.countdown_seconds || 10) === sec
                                      ? 'bg-white text-black font-extrabold shadow-sm'
                                      : 'text-zinc-400 hover:text-white'
                                  }`}
                                >
                                  {sec}초
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">종료 시 출력 문구 (Result Text)</label>
                            <input
                              type="text"
                              value={editingPreset.result_text || ''}
                              onChange={(e) => setEditingPreset((prev: any) => ({ ...prev, result_text: e.target.value.slice(0, 15) }))}
                              placeholder="START"
                              className="w-full bg-[#030305] border border-white/10 rounded-xl px-4 py-2 text-xs font-semibold text-white focus:outline-none focus:border-violet-500 transition-colors"
                            />
                          </div>
                        </div>
                      )}

                      {/* luckydraw specific inputs */}
                      {(editingPreset.effect === 'luckydraw_wait' || editingPreset.effect === 'luckydraw') && (
                        <div className="pt-3 border-t border-white/5 space-y-4 animate-in fade-in duration-200">
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">낙첨 시 출력 문구 (Loser Text)</label>
                            <input
                              type="text"
                              value={editingPreset.result_text || ''}
                              onChange={(e) => setEditingPreset((prev: any) => ({ ...prev, result_text: e.target.value.slice(0, 15) }))}
                              placeholder="아쉽네요! 다음 기회에.."
                              className="w-full bg-[#030305] border border-white/10 rounded-xl px-4 py-2 text-xs font-semibold text-white focus:outline-none focus:border-violet-500 transition-colors"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">추첨 당첨자 수</label>
                            <div className="grid grid-cols-5 gap-1 bg-black/40 p-1 rounded-full border border-white/5">
                              {[1, 2, 3, 5, 10].map((num) => (
                                <button
                                  type="button"
                                  key={num}
                                  onClick={() => setEditingPreset((prev: any) => ({ ...prev, lucky_draw_count: num }))}
                                  className={`py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                                    (editingPreset.lucky_draw_count || 1) === num
                                      ? 'bg-white text-black font-extrabold shadow-sm'
                                      : 'text-zinc-400 hover:text-white'
                                  }`}
                                >
                                  {num}명
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Font selection */}
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">글꼴 스타일</label>
                        <select
                          value={editingPreset.font_family || 'sans-thin'}
                          onChange={(e) => setEditingPreset((prev: any) => ({ ...prev, font_family: e.target.value }))}
                          className="w-full bg-[#030305] border border-white/10 rounded-xl px-4 py-2 text-xs font-semibold text-white focus:outline-none focus:border-violet-500 transition-colors cursor-pointer"
                        >
                          <option value="sans-thin">현대적 고딕 (Sans Thin)</option>
                          <option value="sans-thick">볼드 고딕 (Sans Thick)</option>
                          <option value="serif">클래식 명조 (Serif)</option>
                          <option value="plump">통통한 자이언트 (Plump)</option>
                        </select>
                      </div>

                      {/* special_effect */}
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">화면 특수 장식 효과 (Special Effect)</label>
                        <select
                          value={editingPreset.special_effect || 'none'}
                          onChange={(e) => setEditingPreset((prev: any) => ({ ...prev, special_effect: e.target.value }))}
                          className="w-full bg-[#030305] border border-white/10 rounded-xl px-4 py-2 text-xs font-semibold text-white focus:outline-none focus:border-violet-500 transition-colors cursor-pointer"
                        >
                          <option value="none">효과 없음 (None)</option>
                          <option value="stars">반짝이는 별빛 (Stars)</option>
                          <option value="hearts">두근두근 하트 (Hearts)</option>
                          <option value="snow">살포시 내리는 눈 (Snow)</option>
                          <option value="confetti">축하 꽃가루 폭죽 (Confetti)</option>
                        </select>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPresetIndex(null);
                          setEditingPreset(null);
                          setIsAddingPreset(false);
                        }}
                        className="flex-1 py-2 border border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!editingPreset.text || !editingPreset.text.trim()) {
                            alert('출력 텍스트를 입력해주세요.');
                            return;
                          }

                          const copy = { ...localizedTemplates };
                          const category = copy[selectedLang].find((c: any) => c.id === selectedCat);
                          if (category) {
                            if (isAddingPreset) {
                              category.presets.push({ ...editingPreset });
                            } else if (editingPresetIndex !== null) {
                              category.presets[editingPresetIndex] = { ...editingPreset };
                            }
                            setLocalizedTemplates(copy);
                            setEditingPresetIndex(null);
                            setEditingPreset(null);
                            setIsAddingPreset(false);
                            alert(isAddingPreset ? '새 템플릿 카드가 임시 반영되었습니다! (배포 버튼을 눌러 확정해 주세요)' : '템플릿 변경사항이 임시 반영되었습니다! (배포 버튼을 눌러 확정해 주세요)');
                          }
                        }}
                        className="flex-1 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer text-center shadow-lg shadow-violet-600/20"
                      >
                        적용
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#0c0c14]/40 border border-dashed border-white/5 p-12 rounded-2xl flex flex-col justify-center items-center text-center gap-2">
                    <Layers className="w-8 h-8 text-zinc-600 mb-2" />
                    <span className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">수정할 카드 미선택</span>
                    <p className="text-[9px] text-zinc-600 max-w-[200px]">왼쪽 그리드에서 연필 아이콘을 누르거나 새 카드를 추가하면 여기에 세부 속성 편집기가 활성화됩니다.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Real-time Custom Preset Usage Trends Monitor */}
        {activeTab === 'trends' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Header Description */}
            <div className="bg-[#0c0c14]/80 backdrop-blur-xl border border-white/5 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" /> 실시간 커스텀 프리셋 트렌드 통계 보드
                </h2>
                <p className="text-[10px] text-zinc-500 mt-1 font-medium">
                  PO/PM 의사결정용 데이터 전문 센터: 참관 몰입도, 유통 세그먼트 비율 및 AI 성장 조언 피드를 표출합니다.
                </p>
              </div>
              <button
                type="button"
                onClick={fetchData}
                className="w-full sm:w-auto px-4 py-2 border border-white/10 hover:bg-white/5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm text-zinc-300 hover:text-white"
              >
                <RefreshCw className="w-3.5 h-3.5" /> 통계 데이터 갱신
              </button>
            </div>

            {/* AI PO/PM Actionable Insights Briefing Card */}
            <div className="bg-[#0c0c14]/80 backdrop-blur-xl border border-violet-500/20 p-6 rounded-2xl shadow-xl shadow-violet-950/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/10 rounded-full blur-2xl" />
              <h3 className="text-xs font-black text-violet-400 uppercase tracking-widest mb-3 flex items-center gap-2 font-outfit">
                <ShieldAlert className="w-4 h-4 text-violet-400 animate-pulse" /> AI PO/PM ACTIONABLE INSIGHT REPORT (수익 성장 피드)
              </h3>
              <p className="text-[10px] text-zinc-300 leading-relaxed">
                {(() => {
                  const seg = trendsStats.segmentation || { b2cCount: 0, b2bCount: 0, total: 1 };
                  const b2cRatio = (seg.b2cCount / Math.max(1, seg.total)) * 100;
                  const b2bRatio = (seg.b2bCount / Math.max(1, seg.total)) * 100;
                  const luckyAdoption = trendsStats.featuresAdoption?.luckyDrawCount || 0;

                  if (b2cRatio > 60) {
                    return `현재 1인 Stand-alone용 모바일 연동 트래픽(B2C) 점유율이 ${b2cRatio.toFixed(0)}%로 제품의 전체 트래픽을 주도하고 있습니다. 틱톡/인스타그램 릴스 인증샷에 최적화된 세로형 네온 효과 템플릿과 '글꼴 스타일팩'을 인앱 유료 애드온(Add-on)으로 판매하여 매출전환(ARPU) 극대화를 시도하는 전략을 추천합니다.`;
                  }
                  if (b2bRatio > 50) {
                    return `현재 매장 정보 안내 및 상업 이벤트 목적의 호스트 세션(B2B) 점유율이 ${b2bRatio.toFixed(0)}%로 안정적입니다. 식당 메뉴판 템플릿, 매장 대기 순번 및 주문 알림 연동 API 모듈을 'B2B 프리미엄 구독 플랜'으로 패키징하여 월간 반복 매출(MRR)의 폭발적 성장을 견인할 가치가 매우 큽니다.`;
                  }
                  if (luckyAdoption > 0) {
                    return `실시간 관객 소통용 추첨기(Lucky Draw) 채택 건수가 ${luckyAdoption}건 감지되었습니다. 축하 페스티벌 및 기업 네트워킹 이벤트 주최자를 위한 '기업 로고 워터마크 노출' 및 '관객 당첨 결과 CSV 엑셀 다운로드' 등 고부가가치 플러그인을 기업 전용 단기 패키지(Event Plan)로 묶어 유료 요금제 결제를 적극 유도하십시오.`;
                  }
                  return "현재 유저 사용 유형이 분산되어 균형을 이루고 있습니다. 사용자들이 가장 오랜 시간 켜두는 '인기 테마 컬러 조합'을 기본 프리셋 템플릿 상단에 자동 배치하여, 대시보드 이탈율(Churn)을 낮추고 장기 리텐션을 유지하십시오.";
                })()}
              </p>
            </div>

            {/* 1단: BI Segmentation Metrics & Feature Adoption Rates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Segmentation Card (B2B vs B2C Gauge) */}
              <div className="bg-[#0c0c14]/80 backdrop-blur-xl border border-white/5 p-6 rounded-2xl">
                <h3 className="text-xs font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-zinc-400" /> B2B vs B2C 고객 점유율 세그멘테이션
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-violet-400">B2B (호스트/매장 세션)</span>
                    <span className="text-emerald-400">B2C (1인용 싱크 세션)</span>
                  </div>
                  {/* Gauge Bar */}
                  {(() => {
                    const seg = trendsStats.segmentation || { b2cCount: 0, b2bCount: 0, total: 0 };
                    const b2bPct = seg.total > 0 ? (seg.b2bCount / seg.total) * 100 : 50;
                    const b2cPct = seg.total > 0 ? (seg.b2cCount / seg.total) * 100 : 50;
                    return (
                      <div className="space-y-2">
                        <div className="w-full h-4 bg-black/40 rounded-full overflow-hidden border border-white/5 flex">
                          <div className="h-full bg-violet-600 transition-all" style={{ width: `${b2bPct}%` }} title={`B2B: ${b2bPct.toFixed(0)}%`} />
                          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${b2cPct}%` }} title={`B2C: ${b2cPct.toFixed(0)}%`} />
                        </div>
                        <div className="flex justify-between text-[9px] text-zinc-500 font-bold font-mono">
                          <span>${seg.b2bCount} Rooms (${b2bPct.toFixed(0)}%)</span>
                          <span>${seg.b2cCount} Rooms (${b2cPct.toFixed(0)}%)</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Revenue Contribution Share Card */}
              <div className="bg-[#0c0c14]/80 backdrop-blur-xl border border-white/5 p-6 rounded-2xl flex flex-col justify-between">
                <h3 className="text-xs font-black text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                  <DollarSign className="w-3.5 h-3.5 text-amber-400" /> 플랜별 매출 기여도 (Revenue Contribution Share)
                </h3>
                <div className="space-y-3.5">
                  {(() => {
                    const breakdown: Record<string, number> = { event: 0, store: 0, store_annual: 0 };
                    let totalPaidAmt = 0;
                    (payments || []).forEach(p => {
                      if (p.payment_status === 'completed') {
                        breakdown[p.tier] = (breakdown[p.tier] || 0) + p.amount;
                        totalPaidAmt += p.amount;
                      }
                    });

                    return [
                      { key: 'event', label: '다인용 이벤트 플랜 (Event)', color: 'bg-sky-500' },
                      { key: 'store', label: '매장 월간 플랜 (Store Monthly)', color: 'bg-violet-500' },
                      { key: 'store_annual', label: '매장 연간 플랜 (Store Annual)', color: 'bg-emerald-500' }
                    ].map(plan => {
                      const amt = breakdown[plan.key] || 0;
                      const pct = totalPaidAmt > 0 ? Math.round((amt / totalPaidAmt) * 100) : 0;
                      return (
                        <div key={plan.key} className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold">
                            <span className="text-zinc-400">{plan.label}</span>
                            <span className="text-white font-mono">{amt.toLocaleString()}원 ({pct}%)</span>
                          </div>
                          <div className="h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                            <div className={`h-full ${plan.color}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>

            {/* 2단: Live Event Engagement Tracker (Highly engaging rooms) */}
            <div className="bg-[#0c0c14]/80 backdrop-blur-xl border border-white/5 p-6 rounded-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-violet-400 animate-pulse" /> 실시간 참관 흥행 랭킹 (Live Event Tracker)
                </h3>
                <span className="text-[8px] px-2 py-0.5 rounded border border-red-500/20 bg-red-500/10 text-red-400 font-black animate-pulse uppercase tracking-widest">
                  Live Event On Air
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-zinc-300 border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                      <th className="py-2.5">Room ID</th>
                      <th>현재 연출 화면 (Masked)</th>
                      <th>참관 관객수 (Engagement)</th>
                      <th>요금제 Tier</th>
                      <th>개설 시간</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs font-medium">
                    {(trendsStats.liveHotRooms || []).map((room: any) => (
                      <tr key={room.id} className="hover:bg-white/[0.01]">
                        <td className="py-3 font-extrabold text-zinc-400 font-mono">{room.id}</td>
                        <td>
                          <div 
                            className="inline-flex px-3 py-1.5 rounded-lg font-black border border-black/40 text-[10px] tracking-wider font-mono max-w-[150px] truncate"
                            style={{ backgroundColor: room.bg, color: room.color }}
                          >
                            {room.text}
                          </div>
                        </td>
                        <td>
                          <span className="inline-flex items-center gap-1 text-indigo-400 font-black font-outfit">
                            <Users className="w-3 h-3 text-indigo-500" /> {room.active_clients}명 접속중
                          </span>
                        </td>
                        <td>
                          <span className={`px-2 py-0.5 rounded text-[8px] border font-black uppercase \${
                            room.tier !== 'free'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              : 'bg-white/5 text-zinc-400 border-white/5'
                          }`}>
                            {room.tier}
                          </span>
                        </td>
                        <td className="text-zinc-500 text-[10px] font-mono">
                          {new Date(room.time).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                    {(!trendsStats.liveHotRooms || trendsStats.liveHotRooms.length === 0) && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-zinc-500 text-[10px] font-bold">
                          현재 다수 참관중(Active Spectating)이 발생한 대형 룸 세션이 확인되지 않습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3단: Design System & Color Combinations Rankings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Popular Color Combos */}
              <div className="bg-[#0c0c14]/80 backdrop-blur-xl border border-white/5 p-6 rounded-2xl md:col-span-1">
                <h3 className="text-xs font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-zinc-400" /> 인기 비주얼 테마 조합 (Top Color Combos)
                </h3>
                <div className="space-y-3">
                  {(trendsStats.visualThemes || []).map((combo: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between bg-black/25 p-2 rounded-xl border border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-black text-zinc-500 w-4">#{idx+1}</span>
                        {/* Compact Visual Preview Block */}
                        <div 
                          className="w-12 h-6 rounded border border-black/20 text-[7px] font-black flex items-center justify-center font-mono select-none"
                          style={{ backgroundColor: combo.bg, color: combo.color }}
                        >
                          SIGN
                        </div>
                      </div>
                      <span className="text-[10px] text-zinc-400 font-extrabold font-mono">{combo.count}회 채택</span>
                    </div>
                  ))}
                  {(!trendsStats.visualThemes || trendsStats.visualThemes.length === 0) && (
                    <p className="text-[10px] text-zinc-600 text-center py-6">수집된 컬러 콤보 통계가 없습니다.</p>
                  )}
                </div>
              </div>

              {/* Font Popularity Share */}
              <div className="bg-[#0c0c14]/80 backdrop-blur-xl border border-white/5 p-6 rounded-2xl md:col-span-1">
                <h3 className="text-xs font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-violet-400" /> 글꼴 스타일 선호도 (Font Usage)
                </h3>
                <div className="space-y-4">
                  {Object.entries(trendsStats.fontUsage || {}).sort((a: any, b: any) => b[1] - a[1]).map(([font, count]: any) => (
                    <div key={font} className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-zinc-300 font-mono">
                          {font === 'sans-thin' && '현대적 고딕 (Sans Thin)'}
                          {font === 'sans-thick' && '볼드 고딕 (Sans Thick)'}
                          {font === 'serif' && '클래식 명조 (Serif)'}
                          {font === 'plump' && '통통한 자이언트 (Plump)'}
                          {!['sans-thin', 'sans-thick', 'serif', 'plump'].includes(font) && font}
                        </span>
                        <span className="text-violet-400 font-black">{count}개 방 적용</span>
                      </div>
                      <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full" 
                          style={{ width: `${Math.max(5, Math.min(100, (count / Math.max(1, rooms.length)) * 100))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {(!trendsStats.fontUsage || Object.keys(trendsStats.fontUsage).length === 0) && (
                    <p className="text-[10px] text-zinc-600 text-center py-6">수집된 실시간 폰트 적용 통계가 없습니다.</p>
                  )}
                </div>
              </div>

              {/* Motion Effect Share */}
              <div className="bg-[#0c0c14]/80 backdrop-blur-xl border border-white/5 p-6 rounded-2xl md:col-span-1">
                <h3 className="text-xs font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" /> 인기 애니메이션 모션 선호도 (Motion Usage)
                </h3>
                <div className="space-y-4">
                  {Object.entries(trendsStats.effectUsage || {}).sort((a: any, b: any) => b[1] - a[1]).map(([effect, count]: any) => (
                    <div key={effect} className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-zinc-300 font-mono">
                          {effect === 'none' && '단색 고정 (None)'}
                          {effect === 'blink' && '부드러운 깜빡이 (Blink)'}
                          {effect === 'marquee' && '가로 스크롤 (Scroll)'}
                          {effect === 'countdown' && '카운트다운 타이머 (Timer)'}
                          {effect === 'luckydraw_wait' && '추첨 대기 (Raffle Wait)'}
                          {effect === 'luckydraw' && '추첨 연출 (Raffle Go)'}
                          {!['none', 'blink', 'marquee', 'countdown', 'luckydraw_wait', 'luckydraw'].includes(effect) && effect}
                        </span>
                        <span className="text-emerald-400 font-black">{count}개 방 적용</span>
                      </div>
                      <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" 
                          style={{ width: `${Math.max(5, Math.min(100, (count / Math.max(1, rooms.length)) * 100))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {(!trendsStats.effectUsage || Object.keys(trendsStats.effectUsage).length === 0) && (
                    <p className="text-[10px] text-zinc-600 text-center py-6">수집된 실시간 애니메이션 효과 통계가 없습니다.</p>
                  )}
                </div>
              </div>
            </div>

            {/* 4단: Real-time masked custom texts stream feed board */}
            <div className="bg-[#0c0c14]/80 backdrop-blur-xl border border-white/5 p-6 rounded-2xl">
              <h3 className="text-xs font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-zinc-400" /> 실시간 송출 텍스트 피드 (Masked Text Stream)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(trendsStats.textSamples || []).map((sample: any, idx: number) => (
                  <div 
                    key={idx}
                    className="border border-white/5 bg-[#030305]/60 rounded-xl p-3.5 flex flex-col justify-between hover:border-white/10 transition-all"
                  >
                    {/* Compact Sign Preview */}
                    <div 
                      className="w-full py-3 px-4 rounded-lg flex items-center justify-center font-black overflow-hidden border border-black/20 text-xs text-center"
                      style={{ backgroundColor: sample.bg, color: sample.color }}
                    >
                      <span className="truncate max-w-full">{sample.text}</span>
                    </div>

                    {/* Metadata indicators */}
                    <div className="flex items-center justify-between mt-3 text-[9px] text-zinc-500 font-bold font-mono uppercase">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] border font-black ${
                        sample.tier !== 'free' 
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-white/5 text-zinc-400 border-white/5'
                      }`}>
                        {sample.tier}
                      </span>
                      <span>{new Date(sample.time).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
                {(!trendsStats.textSamples || trendsStats.textSamples.length === 0) && (
                  <div className="col-span-full py-12 text-center text-zinc-600 text-[10px] font-bold">
                    현재 활성화되어 송출되고 있는 텍스트 샘플이 없습니다.
                  </div>
                )}
              </div>
            </div>
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
