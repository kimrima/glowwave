'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Mail, 
  Search, 
  ArrowLeft, 
  Key, 
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  ShieldAlert
} from 'lucide-react';

interface RecoveredRoom {
  room_id: string;
  tier: string;
  created_at: string;
  host_session_token: string;
}

// Support multilang localization
const recoveryTranslations = {
  ko: {
    nav_main: '메인으로 돌아가기',
    title: '구매 내역 & 대시보드 복구',
    desc: '결제 완료 후 페이지가 튕겼거나 대시보드 관리자 링크를 분실하신 경우, 결제 시 입력했던 이메일을 적어 방장 권한을 복구하세요.',
    email_label: '이메일 주소 입력',
    email_placeholder: '결제 영수증용 이메일 주소',
    btn_search: '복구 인증코드 발송',
    searching: '이메일 조회 중...',
    otp_sent_msg: '일회용 복구 인증번호(OTP)가 입력하신 이메일로 발송되었습니다. (인메모리 메일 로그가 콘솔 및 관리자 CS 보드에 등록됨) 6자리 코드를 입력해 주세요.',
    otp_label: '6자리 인증코드 입력',
    otp_placeholder: '예: 123456',
    btn_verify: '인증 완료 및 복구하기',
    verifying: '보안 코드 인증 중...',
    success_msg: '인증에 성공했습니다! 아래의 대시보드 리모컨 버튼을 클릭하여 즉시 복구할 수 있습니다.',
    room_code: '방 코드',
    btn_dashboard: '대시보드 리모컨',
    no_room: '입력하신 이메일로 생성된 활성 방을 찾을 수 없습니다.',
    error_network: '네트워크 통신 오류가 발생했습니다.',
    error_invalid_otp: '인증코드가 올바르지 않거나 만료되었습니다. 다시 시도해 주세요.',
    btn_back: '이전으로',
    created_at: '생성일'
  },
  en: {
    nav_main: 'Back to Home',
    title: 'Purchase & Dashboard Recovery',
    desc: 'If the page disconnected after payment or you lost your remote control link, enter your payment email to recover host access.',
    email_label: 'Enter Email Address',
    email_placeholder: 'Billing Email Address',
    btn_search: 'Send Recovery Code',
    searching: 'Looking up email...',
    otp_sent_msg: 'A 6-digit recovery OTP code has been issued. Check your email (or admin CS dashboard) and enter the code below.',
    otp_label: 'Enter 6-Digit OTP Code',
    otp_placeholder: 'e.g. 123456',
    btn_verify: 'Verify & Restore Access',
    verifying: 'Verifying secure code...',
    success_msg: 'Verification successful! Click the dashboard button below to instantly restore access.',
    room_code: 'Room Code',
    btn_dashboard: 'Dashboard Remote',
    no_room: 'No active rooms were found under this email address.',
    error_network: 'A network communication error occurred.',
    error_invalid_otp: 'The recovery code is incorrect or has expired. Please try again.',
    btn_back: 'Back',
    created_at: 'Created At'
  },
  ja: {
    nav_main: 'メインに戻る',
    title: '購入履歴＆ダッシュボード復旧',
    desc: '決済完了後に接続が切れた場合やダッシュボードの管理リンクを紛失した場合は、決済時のメールアドレスを入力して管理者権限を復旧してくださいお。',
    email_label: 'メールアドレス入力',
    email_placeholder: '決済用メールアドレス',
    btn_search: '復旧コードを送信',
    searching: '履歴照会中...',
    otp_sent_msg: '復旧用認証番号(OTP)をメールアドレス宛に発行しました。認証コードを入力してください。',
    otp_label: '6桁の認証番号を入力',
    otp_placeholder: '例: 123456',
    btn_verify: '認証を完了して復旧',
    verifying: 'セキュリティコード検証中...',
    success_msg: '認証に成功しました！以下のダッシュボードボタンをクリックして、すぐに管理画面にアクセスできます。',
    room_code: 'ルームコード',
    btn_dashboard: 'ダッシュボード',
    no_room: '入力されたメールアドレスで作成されたアクティブなルームが見つかりません。',
    error_network: 'ネットワーク通信エラーが発生しました。',
    error_invalid_otp: '認証番号が正しくないか、有効期限が切れています。もう一度お試しください。',
    btn_back: '戻る',
    created_at: '作成日'
  },
  es: {
    nav_main: 'Volver al Inicio',
    title: 'Recuperación de Compra y Panel',
    desc: 'Si la página se desconectó después del pago o perdió su enlace de control remoto, ingrese su correo de pago para recuperar el acceso de host.',
    email_label: 'Ingrese correo electrónico',
    email_placeholder: 'Correo electrónico de facturación',
    btn_search: 'Enviar código de recuperación',
    searching: 'Buscando...',
    otp_sent_msg: 'Se ha emitido un código de recuperación de 6 dígitos (OTP). Ingrese el código a continuación.',
    otp_label: 'Ingrese el código OTP de 6 dígitos',
    otp_placeholder: 'ej. 123456',
    btn_verify: 'Verificar y recuperar sala',
    verifying: 'Verificando código...',
    success_msg: '¡Verificación exitosa! Haga clic en el botón del panel a continuación para restaurar el acceso de inmediato.',
    room_code: 'Código de sala',
    btn_dashboard: 'Panel Remoto',
    no_room: 'No se encontraron salas activas con esta dirección de correo electrónico.',
    error_network: 'Ocurrió un error de comunicación de red.',
    error_invalid_otp: 'El código de recuperación es incorrecto o ha caducado. Por favor, inténtelo de nuevo.',
    btn_back: 'Atrás',
    created_at: 'Creado el'
  },
  'zh-TW': {
    nav_main: '返回首頁',
    title: '購買紀錄與控制面板復原',
    desc: '付款後若連線中斷或遺失管理員連結，請輸入付款時的電子郵件，以重新取得主辦人管理權限。',
    email_label: '輸入電子郵件地址',
    email_placeholder: '付款收據用電子郵件',
    btn_search: '發送復原驗證碼',
    searching: '查詢中...',
    otp_sent_msg: '復原驗證碼(OTP)已傳送。請在下方輸入6位數安全驗證碼。',
    otp_label: '輸入6位數驗證碼',
    otp_placeholder: '例: 123456',
    btn_verify: '驗證並復原房間',
    verifying: '安全碼驗證中...',
    success_msg: '驗證成功！點擊下方的控制面板按鈕即可立即復原權限。',
    room_code: '房間代碼',
    btn_dashboard: '控制面板',
    no_room: '找不到使用此電子郵件地址建立的啟用中房間。',
    error_network: '發生網路通訊錯誤。',
    error_invalid_otp: '驗證碼錯誤或已過期。請重試。',
    btn_back: '返回',
    created_at: '建立時間'
  },
  'zh-HK': {
    nav_main: '返回首頁',
    title: '購買紀錄與控制面板復原',
    desc: '付款後若連線中斷或遺失管理員連結，請輸入付款時的電子郵件，以重新取得主辦人管理權限。',
    email_label: '輸入電子郵件地址',
    email_placeholder: '付款收據用電子郵件',
    btn_search: '發送復原驗證碼',
    searching: '查詢中...',
    otp_sent_msg: '復原驗證碼(OTP)已傳送。請在下方輸入6位數安全驗證碼。',
    otp_label: '輸入6位數驗證碼',
    otp_placeholder: '例: 123456',
    btn_verify: '驗證並復原房間',
    verifying: '安全碼驗證中...',
    success_msg: '驗證成功！點擊下方的控制面板按鈕即可立即復原權限。',
    room_code: '房間代碼',
    btn_dashboard: '控制面板',
    no_room: '找不到使用此電子郵件地址建立的啟用中房間。',
    error_network: '發生網路通訊錯誤。',
    error_invalid_otp: '驗證碼錯誤或已過期。請重試。',
    btn_back: '返回',
    created_at: '建立時間'
  }
};

export default function RecoveryPage() {
  const [activeLocale, setActiveLocale] = useState<'ko' | 'en' | 'ja' | 'es' | 'zh-TW' | 'zh-HK'>('ko');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setCheckoutStep] = useState<'email' | 'otp' | 'done'>('email');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [recoveredRooms, setRecoveredRooms] = useState<RecoveredRoom[]>([]);

  // Automatically detect browser locale or saved user preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 1. Check URL query string
      const searchParams = new URLSearchParams(window.location.search);
      const queryLang = searchParams.get('lang');
      if (queryLang && ['ko', 'en', 'ja', 'es', 'zh-TW', 'zh-HK'].includes(queryLang)) {
        setActiveLocale(queryLang as any);
        return;
      }
      
      // 2. Check localStorage saved preferences first
      const savedLocale = localStorage.getItem('glowwave_local_locale') || 
                          localStorage.getItem('glowwave_host_locale') || 
                          localStorage.getItem('glowwave_home_locale');
      if (savedLocale && ['ko', 'en', 'ja', 'es', 'zh-TW', 'zh-HK'].includes(savedLocale)) {
        setActiveLocale(savedLocale as any);
        return;
      }
      
      // 3. Fallback to navigator settings
      const lang = navigator.language.toLowerCase();
      if (lang.startsWith('ko')) setActiveLocale('ko');
      else if (lang.startsWith('ja')) setActiveLocale('ja');
      else if (lang.startsWith('es')) setActiveLocale('es');
      else if (lang.startsWith('zh-tw') || lang.startsWith('zh-cn')) setActiveLocale('zh-TW');
      else if (lang.startsWith('zh-hk')) setActiveLocale('zh-HK');
      else setActiveLocale('en');
    }
  }, []);

  const loc = recoveryTranslations[activeLocale] || recoveryTranslations.ko;

  // Step 1: Send OTP code to email
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setErrorMessage('');
    setRecoveredRooms([]);

    try {
      const response = await fetch(`/api/room/recover?email=${encodeURIComponent(email.trim())}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.code === 'ROOM_NOT_FOUND' ? loc.no_room : (data.error || 'Request failed'));
      }

      if (data.otp_sent) {
        setCheckoutStep('otp');
        setSuccessMessage(loc.otp_sent_msg);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || loc.error_network);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and fetch session tokens
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) return;

    setLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/room/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.code === 'INVALID_OTP' ? loc.error_invalid_otp : (data.error || 'Verification failed'));
      }

      if (data.success && data.rooms) {
        setRecoveredRooms(data.rooms);
        setCheckoutStep('done');
        setSuccessMessage(loc.success_msg);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || loc.error_network);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0F] text-foreground flex flex-col justify-between">
      
      {/* Header */}
      <header className="border-b border-white/5 bg-[#0B0B0F]/80 backdrop-blur-md pt-[calc(env(safe-area-inset-top,0px)+12px)]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-white">
            <span>GlowWave</span>
          </Link>
          <Link href="/" className="text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 font-medium transition-all">
            <ArrowLeft className="w-3.5 h-3.5" />
            {loc.nav_main}
          </Link>
        </div>
      </header>

      {/* Main Box */}
      <main className="max-w-md mx-auto w-full px-6 py-16 flex-1 flex flex-col justify-center">
        <div className="glass-effect rounded-2xl p-6 border border-white/5 flex flex-col gap-6 bg-[#12121a]">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 mx-auto mb-4">
              <Key className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-white mb-2">{loc.title}</h1>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
              {loc.desc}
            </p>
          </div>

          {/* Step 1: Input Email */}
          {step === 'email' && (
            <form onSubmit={handleRequestOtp} className="flex flex-col gap-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  {loc.email_label}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={loc.email_placeholder}
                  className="w-full bg-[#0B0B0F] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 text-sm font-semibold font-mono"
                />
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10 text-red-400 text-xs font-semibold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-white text-black font-extrabold text-sm hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {loc.searching}
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    {loc.btn_search}
                  </>
                )}
              </button>
            </form>
          )}

          {/* Step 2: Input OTP Verification Code */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
              {successMessage && (
                <div className="p-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/15 text-[11px] text-indigo-300 flex items-start gap-2 leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div>{successMessage}</div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" />
                  {loc.otp_label}
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder={loc.otp_placeholder}
                  className="w-full bg-[#0B0B0F] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 text-sm font-black text-center tracking-widest font-mono"
                />
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10 text-red-400 text-xs font-semibold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCheckoutStep('email')}
                  className="flex-1 py-3 rounded-xl bg-white/5 text-zinc-400 font-bold hover:bg-white/10 hover:text-white transition-all text-xs"
                >
                  {loc.btn_back}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-indigo-600 text-white font-extrabold rounded-xl hover:bg-indigo-500 transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                      {loc.verifying}
                    </>
                  ) : (
                    loc.btn_verify
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Done - Show Dashboard links */}
          {step === 'done' && (
            <div className="flex flex-col gap-4">
              <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-[11px] text-emerald-400 flex items-start gap-2 leading-relaxed">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>{successMessage}</div>
              </div>

              <div className="flex flex-col gap-2.5">
                {recoveredRooms.map((room) => (
                  <div 
                    key={room.room_id} 
                    className="bg-black/40 border border-white/5 p-3.5 rounded-xl flex items-center justify-between hover:border-white/15 transition-all"
                  >
                    <div>
                      <div className="font-bold text-white text-xs flex items-center gap-1.5 font-mono">
                        {loc.room_code}: {room.room_id}
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/15 text-indigo-300 font-semibold capitalize font-sans">
                          {room.tier}
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-1">
                        {loc.created_at}: {new Date(room.created_at).toLocaleString()}
                      </div>
                    </div>
                    
                    <Link 
                      href={`/host/dashboard/${room.room_id}?token=${room.host_session_token}`}
                      className="py-1.5 px-3 rounded-lg bg-white/5 text-zinc-300 font-bold hover:bg-white/10 hover:text-white transition-all text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      {loc.btn_dashboard} <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-zinc-950 py-6 text-center text-[10px] text-zinc-600">
        &copy; 2026 Anti-gravity. Safe & secure magic code verification.
      </footer>

    </div>
  );
}
