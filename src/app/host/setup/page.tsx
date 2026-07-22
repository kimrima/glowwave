'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Globe, ChevronDown, X, ArrowLeft } from 'lucide-react';
import { Preset, TierType, TIER_CONFIGS, getLocalizedPrice, getLocalizedTierName } from '@/lib/types';
import LandscapePhoneMockup from '@/components/LandscapePhoneMockup';
import { t, Locale } from '@/lib/translations';
import { getDefaultsByLocale } from '@/lib/templates';

export default function HostSetup() {
  const router = useRouter();

  // Active Locale State
  const [activeLocale, setActiveLocale] = useState<Locale>('ko');
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  const defaultPresets = getDefaultsByLocale(activeLocale);

  const [selectedTier, setSelectedTier] = useState<TierType>('free');
  const [customAlert, setCustomAlert] = useState<{ isOpen: boolean; message: string; title?: string } | null>(null);
  const showAlert = (message: string, title?: string) => {
    setCustomAlert({ isOpen: true, message, title });
  };
  const [planType, setPlanType] = useState<'event' | 'store'>('event');
  const [hostEmail, setHostEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState('');

  // Email Typo Suggestion States
  const [emailSuggestion, setEmailSuggestion] = useState<string | null>(null);
  const checkEmailTypo = (val: string) => {
    const parts = val.split('@');
    if (parts.length !== 2) {
      setEmailSuggestion(null);
      return;
    }
    const domain = parts[1].toLowerCase().trim();
    const suggestions: Record<string, string> = {
      'gamil.com': 'gmail.com',
      'gmeil.com': 'gmail.com',
      'gamil.co.kr': 'gmail.com',
      'gmail.con': 'gmail.com',
      'naver.con': 'naver.com',
      'naever.com': 'naver.com',
      'nvaer.com': 'naver.com',
      'daun.net': 'daum.net',
      'daum.con': 'daum.net',
      'hanmail.con': 'hanmail.net',
      'hanmail.co.kr': 'hanmail.net',
      'nate.con': 'nate.com'
    };
    if (suggestions[domain]) {
      setEmailSuggestion(`${parts[0]}@${suggestions[domain]}`);
    } else {
      setEmailSuggestion(null);
    }
  };
  
  // Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'toss' | 'stripe'>('toss');
  const [checkoutStep, setCheckoutStep] = useState<'input' | 'done'>('input');
  const [createdRoomInfo, setCreatedRoomInfo] = useState<{ room_id: string; host_session_token: string } | null>(null);

  // CS Inquiries Translations
  const csTranslations: Record<string, any> = {
    ko: {
      btn_open: '1:1 결제 오류 / 환불 및 기능 문의 접수처',
      title: '💬 1:1 고객 문의 / 환불 접수',
      email_label: '답변받을 이메일 주소',
      category_label: '문의 분류',
      cat_refund: '결제 환불 신청',
      cat_recovery: '방 복구 / 연장 오류',
      cat_bug: '버그 / 기술적 결함 문의',
      cat_etc: '기타 제안 및 문의',
      room_id_label: '방 코드 (Room ID) - 선택 사항',
      room_placeholder: '예: 8-자리 방 코드',
      message_label: '상세 문의 / 요청 사항',
      message_placeholder: '환불 사유나 오류 상황을 구체적으로 기재해 주시면 보다 원활하게 해결됩니다.',
      cancel: '취소',
      submit: '문의 접수하기',
      submitting: '제출 중...',
      alert_success: '고객 문의가 성공적으로 접수되었습니다. 관리자가 검토 후 순차적으로 처리해 드립니다.',
      alert_success_title: '접수 완료',
      alert_error: '문의 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      alert_network: '네트워크 통신 오류가 발생했습니다.',
      alert_ok: '확인'
    },
    en: {
      btn_open: '1:1 Payment Issue / Refund & Support Desk',
      title: '💬 1:1 Customer Support / Refund Request',
      email_label: 'Your Email Address',
      category_label: 'Category',
      cat_refund: 'Payment Refund Request',
      cat_recovery: 'Room Recovery / Extension Issue',
      cat_bug: 'Bug / Technical Glitch Report',
      cat_etc: 'Other Questions & Suggestions',
      room_id_label: 'Room Code (Room ID) - Optional',
      room_placeholder: 'e.g. 8-digit Room Code',
      message_label: 'Detailed Message / Request Reason',
      message_placeholder: 'Please describe your request or issue specifically for faster resolution.',
      cancel: 'Cancel',
      submit: 'Submit Ticket',
      submitting: 'Submitting...',
      alert_success: 'Your inquiry has been successfully submitted. Our team will review and reply soon.',
      alert_success_title: 'Submitted',
      alert_error: 'An error occurred during submission. Please try again later.',
      alert_network: 'A network communication error occurred.',
      alert_ok: 'OK'
    },
    ja: {
      btn_open: '1:1 決済エラー / 返金および機能問い合わせ窓口',
      title: '💬 1:1 顧客サポート / 返金申請',
      email_label: '返信用メールアドレス',
      category_label: 'お問い合わせ区分',
      cat_refund: '決済返金申請',
      cat_recovery: 'ルーム復旧 / 延長エラー',
      cat_bug: 'バグ / 技術的欠陥の報告',
      cat_etc: 'その他の提案および問い合わせ',
      room_id_label: 'ルームコード (Room ID) - 任意',
      room_placeholder: '例: 8桁のルームコード',
      message_label: '詳細内容 / 要望事項',
      message_placeholder: '返金理由やエラー状況を具体的にご記載いただくと、よりスムーズに対応できます。',
      cancel: 'キャンセル',
      submit: '問い合わせを送信',
      submitting: '送信中...',
      alert_success: 'お問い合わせが正常に受け付けられました。順次確認のうえ対応いたします。',
      alert_success_title: '受付完了',
      alert_error: '送信中にエラーが発生しました。しばらくしてからもう一度お試しください。',
      alert_network: 'ネットワーク通信エラーが発生しました。',
      alert_ok: '確認'
    },
    es: {
      btn_open: 'Mesa de soporte 1:1 / Problema de pago y reembolso',
      title: '💬 Soporte al cliente 1:1 / Solicitud de reembolso',
      email_label: 'Su dirección de correo electrónico',
      category_label: 'Categoría',
      cat_refund: 'Solicitud de reembolso de pago',
      cat_recovery: 'Problema de recuperación / extensión de sala',
      cat_bug: 'Reportar error / falla técnica',
      cat_etc: 'Otras preguntas y sugerencias',
      room_id_label: 'Código de sala (Room ID) - Opcional',
      room_placeholder: 'ej. Código de sala de 8 dígitos',
      message_label: 'Mensaje detallado / Razón del problema',
      message_placeholder: 'Describa su solicitud o problema específicamente para una resolución más rápida.',
      cancel: 'Cancelar',
      submit: 'Enviar ticket',
      submitting: 'Enviando...',
      alert_success: 'Su consulta ha sido enviada con éxito. Nuestro equipo la revisará y responderá pronto.',
      alert_success_title: 'Enviado',
      alert_error: 'Ocurrió un error al enviar. Por favor, inténtelo de nuevo más tarde.',
      alert_network: 'Ocurrió un error de comunicación de red.',
      alert_ok: 'Aceptar'
    },
    'zh-TW': {
      btn_open: '1:1 付款錯誤 / 退款與功能諮詢管道',
      title: '💬 1:1 客戶諮詢 / 退款申請',
      email_label: '回覆用電子郵件地址',
      category_label: '諮詢類別',
      cat_refund: '付款退款申請',
      cat_recovery: '房間復原 / 延期錯誤',
      cat_bug: '回報漏洞 / 技術性缺陷',
      cat_etc: '其他提案與諮詢',
      room_id_label: '房間代碼 (Room ID) - 選填',
      room_placeholder: '例: 8位數房間代碼',
      message_label: '詳細諮詢內容 / 請求事項',
      message_placeholder: '請具體填寫退款原因或錯誤狀況，以便我們更快速地為您解決。',
      cancel: '取消',
      submit: '送出諮詢',
      submitting: '送出中...',
      alert_success: '客戶諮詢已成功送出。管理員審查後將依序為您處理。',
      alert_success_title: '送出成功',
      alert_error: '送出諮詢時發生錯誤。請稍後再試。',
      alert_network: '發生網路通訊錯誤。',
      alert_ok: '確認'
    },
    'zh-HK': {
      btn_open: '1:1 付款錯誤 / 退款與功能諮詢管道',
      title: '💬 1:1 客戶諮詢 / 退款申請',
      email_label: '回覆用電子郵件地址',
      category_label: '諮詢類別',
      cat_refund: '付款退款申請',
      cat_recovery: '房間復原 / 延期錯誤',
      cat_bug: '回報漏洞 / 技術性缺陷',
      cat_etc: '其他提案與諮詢',
      room_id_label: '房間代碼 (Room ID) - 選填',
      room_placeholder: '例: 8位數房間代碼',
      message_label: '詳細諮詢內容 / 請求事項',
      message_placeholder: '請具體填寫退款原因或錯誤狀況，以便我們更快速地為您解決。',
      cancel: '取消',
      submit: '送出諮詢',
      submitting: '送出中...',
      alert_success: '客戶諮詢已成功送出。管理員審查後將依序為您處理。',
      alert_success_title: '送出成功',
      alert_error: '送出諮詢時發生錯誤。請稍後再試。',
      alert_network: '發生網路通訊錯誤。',
      alert_ok: '確認'
    }
  };

  const csLoc = csTranslations[activeLocale] || csTranslations.ko;

  // CS Inquiries Modal States
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquiryCategory, setInquiryCategory] = useState<'refund' | 'recovery' | 'bug' | 'etc'>('refund');
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquiryRoomId, setInquiryRoomId] = useState('');
  const [inquirySubmitting, setInquirySubmitting] = useState(false);

  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryEmail.trim() || !inquiryMessage.trim()) return;
    setInquirySubmitting(true);
    try {
      const res = await fetch('/api/cs/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inquiryEmail.trim(),
          category: inquiryCategory,
          message: inquiryMessage.trim(),
          room_id: inquiryRoomId.trim() || undefined
        })
      });
      if (res.ok) {
        showAlert(csLoc.alert_success, csLoc.alert_success_title);
        setIsInquiryOpen(false);
        setInquiryMessage('');
        setInquiryRoomId('');
      } else {
        showAlert(csLoc.alert_error);
      }
    } catch (err) {
      showAlert(csLoc.alert_network);
    } finally {
      setInquirySubmitting(false);
    }
  };

  // Import Status from Solo Signboard
  const [importStatus, setImportStatus] = useState<'free' | 'premium' | null>(null);
  const [importedPresetCount, setImportedPresetCount] = useState<number>(0);

  // Promo Code States
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [verifiedCoupon, setVerifiedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isVerifyingCoupon, setIsVerifyingCoupon] = useState(false);

  const handleApplyPromoCode = async () => {
    if (!promoCodeInput.trim()) return;
    setIsVerifyingCoupon(true);
    setCouponError(null);
    try {
      const res = await fetch(`/api/coupon/verify?code=${encodeURIComponent(promoCodeInput.trim())}`);
      if (res.ok) {
        const data = await res.json();
        if (data.valid) {
          setVerifiedCoupon({
            code: data.code,
            discount_pct: data.discount_pct
          });
          setPromoCodeInput('');
        } else {
          const defaultErr = {
            ko: '유효하지 않거나 만료된 프로모션 코드입니다.',
            en: 'Invalid or expired promo code.',
            ja: '無効または期限切れのプロモーションコードです。',
            es: 'Código de descuento inválido o vencido.',
            'zh-TW': '無效或已過期的優惠代碼。',
            'zh-HK': '無效或已過期的優惠代碼。'
          }[activeLocale] || '유효하지 않거나 만료된 프로모션 코드입니다.';
          setCouponError(data.message?.[activeLocale] || defaultErr);
          setVerifiedCoupon(null);
        }
      } else {
        setCouponError('서버 연결 실패');
        setVerifiedCoupon(null);
      }
    } catch (err) {
      setCouponError('서버 연결 실패');
      setVerifiedCoupon(null);
    } finally {
      setIsVerifyingCoupon(false);
    }
  };

  // 1. Initial State Hydration
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLocale = (localStorage.getItem('glowwave_host_locale') || 
                           localStorage.getItem('glowwave_home_locale') || 
                           localStorage.getItem('glowwave_local_locale')) as Locale;
      if (savedLocale && ['ko', 'en', 'ja', 'es', 'zh-TW', 'zh-HK'].includes(savedLocale)) {
        setActiveLocale(savedLocale);
      } else {
        const navLang = navigator.language.toLowerCase();
        let currentLocale: Locale = 'ko';
        if (navLang.startsWith('ko')) currentLocale = 'ko';
        else if (navLang.startsWith('ja')) currentLocale = 'ja';
        else if (navLang.startsWith('es')) currentLocale = 'es';
        else if (navLang.startsWith('zh-tw') || navLang.startsWith('zh-cn')) currentLocale = 'zh-TW';
        else if (navLang.startsWith('zh-hk')) currentLocale = 'zh-HK';
        else currentLocale = 'en';
        setActiveLocale(currentLocale);
      }
    }
  }, []);

  // Log Funnel logs for checkout (Step 3 & Step 4)
  useEffect(() => {
    if (isCheckoutOpen) {
      if (checkoutStep === 'input') {
        fetch('/api/funnel/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ step: 'step3_view_upgrade' })
        }).catch(() => {});
      } else if (checkoutStep === 'done') {
        fetch('/api/funnel/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ step: 'step4_payment_success' })
        }).catch(() => {});
      }
    }
  }, [isCheckoutOpen, checkoutStep]);

  // Check URL parameters for preset importing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const importParam = params.get('import') as 'free' | 'premium' | null;
      const planParam = params.get('plan');

      if (planParam === 'store') {
        setPlanType('store');
        setSelectedTier('store');
      } else {
        setPlanType('event');
      }

      if (importParam) {
        setImportStatus(importParam);
        if (importParam === 'premium') {
          if (planParam === 'store') {
            setSelectedTier('store');
          } else {
            setSelectedTier('lite'); // Pre-select Lite for premium import path
          }
        } else {
          setSelectedTier('free');
        }

        // Check for staged presets
        const staged = localStorage.getItem('glowwave_temp_import_presets');
        if (staged) {
          try {
            const parsed = JSON.parse(staged);
            if (Array.isArray(parsed)) {
              setImportedPresetCount(parsed.length);
            }
          } catch (e) {}
        }
      }
    }
  }, []);

  // Auto-fill email from localStorage if returning host
  useEffect(() => {
    const savedEmail = localStorage.getItem('glowwave_host_email');
    if (savedEmail) {
      setHostEmail(savedEmail);
    }
  }, []);

  const handleStartSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Email Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!hostEmail || !emailRegex.test(hostEmail)) {
      const invalidEmailMsg = {
        ko: '유효한 이메일 주소를 입력해 주세요.',
        en: 'Please enter a valid email address.',
        ja: '有効なメールアドレスを入力してください。',
        es: 'Por favor, ingrese un correo electrónico válido.',
        'zh-TW': '請輸入有效的電子郵件地址。',
        'zh-HK': '請輸入有效的電子郵件地址。'
      }[activeLocale] || '유효한 이메일 주소를 입력해 주세요.';
      setEmailError(invalidEmailMsg);
      return;
    }
    setEmailError('');

    // Passcode Validation
    if (selectedTier !== 'free' && passcode && (passcode.length < 4 || passcode.length > 6)) {
      const invalidPasscodeMsg = {
        ko: '비밀번호는 4~6자리의 숫자여야 합니다.',
        en: 'Passcode must be a 4 to 6 digit number.',
        ja: 'パスコードは4〜6桁の数字である必要があります。',
        es: 'La contraseña debe ser un número de 4 a 6 dígitos.',
        'zh-TW': '密碼必須為 4 到 6 位數字。',
        'zh-HK': '密碼必須為 4 到 6 位數字。'
      }[activeLocale] || '비밀번호는 4~6자리의 숫자여야 합니다.';
      setPasscodeError(invalidPasscodeMsg);
      return;
    }
    setPasscodeError('');
    setIsProcessing(true);

    try {
      // 1. Call Create Room API
      const response = await fetch('/api/room/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: hostEmail,
          tier: selectedTier,
          passcode: selectedTier !== 'free' && passcode ? passcode : undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.code === 'ACTIVE_FREE_ROOM_EXISTS' || (data.error && data.error.includes('이미 활성화된'))) {
          const localizedDuplicationMsg = {
            ko: '이미 활성화된 다인용 Free 플랜 방이 존재합니다. 기존 방의 만료 시간(3시간)이 지난 후에 새로운 무료 방을 개설할 수 있습니다.',
            en: 'An active Multi-device Free plan room already exists. You can create a new free room after the existing one expires (3 hours).',
            ja: 'アクティブなマルチデバイス無料プランのルームがすでに存在します。既存のルームが満了（3時間）した後に新しい無料ルームを作成できます。',
            es: 'Ya existe una sala activa del plan gratuito para múltiples dispositivos. Puedes crear una nueva sala gratuita después de que la existente expire (3 horas).',
            'zh-TW': '已存在使用中的多用戶免費方案房間。您可以在現有房間過期（3 小時）後建立新的免費房間。',
            'zh-HK': '已存在使用中的多用戶免費方案房間。您可以在現有房間過期（3 小時）後建立新的免費房間。'
          }[activeLocale] || data.error;
          throw new Error(localizedDuplicationMsg);
        }

        const roomCreateFailedMsg = {
          ko: '방 생성 실패',
          en: 'Failed to create room',
          ja: 'ルーム作成に失敗しました',
          es: 'Error al crear la sala',
          'zh-TW': '建立房間失敗',
          'zh-HK': '建立房間失敗'
        }[activeLocale] || '방 생성 실패';
        throw new Error(data.error || roomCreateFailedMsg);
      }

      setCreatedRoomInfo({
        room_id: data.room_id,
        host_session_token: data.host_session_token,
      });

      if (selectedTier !== 'free' && passcode) {
        localStorage.setItem(`glowwave_passcode_${data.room_id}`, passcode);
      }

      // Save email in localStorage for future convenience
      localStorage.setItem('glowwave_host_email', hostEmail);

      // Check for staged presets from 1-person dashboard import path
      const staged = localStorage.getItem('glowwave_temp_import_presets');
      let presetsToSave = defaultPresets;
      if (staged) {
        try {
          let parsed = JSON.parse(staged);
          if (Array.isArray(parsed) && parsed.length > 0) {
            if (selectedTier === 'free') {
              // 무료 티어의 경우 일반 무료 연동 (상위 6개 제한 + 유료 폰트 및 파티클 제외)
              parsed = parsed.slice(0, 6).map(p => {
                const updatedPreset = { ...p };
                if (updatedPreset.font_family && !['sans-thin', 'sans-thick'].includes(updatedPreset.font_family)) {
                  updatedPreset.font_family = 'sans-thin';
                }
                if (updatedPreset.special_effect && updatedPreset.special_effect !== 'none') {
                  updatedPreset.special_effect = 'none';
                }
                return updatedPreset;
              });
            }
            presetsToSave = parsed;
          }
        } catch (e) {}
      }

      // Save presets and authorization to LocalStorage
      localStorage.setItem(`glowwave_presets_${data.room_id}`, JSON.stringify(presetsToSave));
      localStorage.setItem(`glowwave_token_${data.room_id}`, data.host_session_token);
      localStorage.setItem('glowwave_active_host_room_id', data.room_id);

      // Add to recent rooms list so it shows on home page
      try {
        const recentRaw = localStorage.getItem('glowwave_recent_rooms');
        let recents = recentRaw ? JSON.parse(recentRaw) : [];
        recents = recents.filter((r: any) => r.roomId !== data.room_id);
        recents.unshift({
          roomId: data.room_id,
          role: 'host',
          tier: selectedTier,
          createdAt: new Date().toISOString()
        });
        localStorage.setItem('glowwave_recent_rooms', JSON.stringify(recents.slice(0, 50)));
      } catch (e) {
        console.error('[setup] Failed to update glowwave_recent_rooms for free room:', e);
      }

      if (selectedTier === 'free') {
        // 1인용 연동 진입인 경우에도 로컬 동기화 정보 설정 없이 호스트 대시보드로 이동하여 상태 독립 보장
        if (importStatus) {
          // 1인 대시보드 활성 프리셋 동기화 브로드캐스트
          const activeLocalPreset = localStorage.getItem('glowwave_local_active_preset');
          if (activeLocalPreset) {
            try {
              let parsedActive = JSON.parse(activeLocalPreset);
              if (parsedActive.font_family && !['sans-thin', 'sans-thick'].includes(parsedActive.font_family)) {
                parsedActive.font_family = 'sans-thin';
              }
              if (parsedActive.special_effect && parsedActive.special_effect !== 'none') {
                parsedActive.special_effect = 'none';
              }
              await fetch(`/api/room/${data.room_id}/broadcast`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  host_session_token: data.host_session_token,
                  preset: parsedActive
                })
              });
            } catch (e) {}
          }
          setIsProcessing(false);
          router.push(`/host/dashboard/${data.room_id}?token=${data.host_session_token}`);
        } else {
          // 일반적인 프리 무료 방 생성은 기존대로 호스트 대시보드로 이동
          setIsProcessing(false);
          router.push(`/host/dashboard/${data.room_id}`);
        }
      } else {
        // Paid tier opens PG checkout input directly
        setCheckoutStep('input');
        setIsCheckoutOpen(true);
        setIsProcessing(false);
      }
    } catch (err: any) {
      console.error(err);
      const roomCreateErr = {
        ko: '방 생성 중 오류가 발생했습니다.',
        en: 'An error occurred during room creation.',
        ja: 'ルーム作成中にエラーが発生しました。',
        es: 'Ocurrió un error al crear la sala.',
        'zh-TW': '建立房間時發生錯誤。',
        'zh-HK': '建立房間時發生錯誤。'
      }[activeLocale] || '방 생성 중 오류가 발생했습니다.';
      showAlert(err.message || roomCreateErr);
      setIsProcessing(false);
    }
  };

  const simulatePaymentSuccess = async () => {
    if (!createdRoomInfo) return;
    setIsProcessing(true);
    
    try {
      // Simulate PG webhook callback to activate the room in DB
      const response = await fetch('/api/payment/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: createdRoomInfo.room_id,
          status: 'success',
          promo_code: verifiedCoupon ? verifiedCoupon.code : undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        const webhookFailedMsg = {
          ko: '결제 웹훅 통신 실패',
          en: 'Payment webhook communication failed',
          ja: '決済ウェブフック通信に失敗しました',
          es: 'Fallo en la comunicación del webhook de pago',
          'zh-TW': '付款回呼通訊失敗',
          'zh-HK': '付款回呼通訊失敗'
        }[activeLocale] || '결제 웹훅 통신 실패';
        throw new Error(data.error || webhookFailedMsg);
      }

      // Check for staged presets from 1-person dashboard import path
      const staged = localStorage.getItem('glowwave_temp_import_presets');
      let presetsToSave = defaultPresets;
      if (staged) {
        try {
          const parsed = JSON.parse(staged);
          if (Array.isArray(parsed) && parsed.length > 0) {
            presetsToSave = parsed;
          }
        } catch (e) {}
      }

      // Save default or imported presets and authorization to LocalStorage
      localStorage.setItem(`glowwave_presets_${createdRoomInfo.room_id}`, JSON.stringify(presetsToSave));
      localStorage.setItem(`glowwave_token_${createdRoomInfo.room_id}`, createdRoomInfo.host_session_token);
      localStorage.setItem('glowwave_active_host_room_id', createdRoomInfo.room_id);

      // Add to recent rooms list so it shows on home page
      try {
        const recentRaw = localStorage.getItem('glowwave_recent_rooms');
        let recents = recentRaw ? JSON.parse(recentRaw) : [];
        recents = recents.filter((r: any) => r.roomId !== createdRoomInfo.room_id);
        recents.unshift({
          roomId: createdRoomInfo.room_id,
          role: 'host',
          tier: selectedTier,
          createdAt: new Date().toISOString()
        });
        localStorage.setItem('glowwave_recent_rooms', JSON.stringify(recents.slice(0, 50)));
      } catch (e) {
        console.error('[setup] Failed to update glowwave_recent_rooms:', e);
      }

      // If imported from 1-person sync dashboard, configure local sync settings and return back to /local
      if (importStatus) {
        // Broadcast current active local preset if exists
        const activeLocalPreset = localStorage.getItem('glowwave_local_active_preset');
        if (activeLocalPreset) {
          try {
            const parsedActive = JSON.parse(activeLocalPreset);
            await fetch(`/api/room/${createdRoomInfo.room_id}/broadcast`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                host_session_token: createdRoomInfo.host_session_token,
                preset: parsedActive
              })
            });
          } catch (e) {}
        }

        setTimeout(() => {
          setIsProcessing(false);
          setIsCheckoutOpen(false);
          router.push(`/host/dashboard/${createdRoomInfo.room_id}?token=${createdRoomInfo.host_session_token}`);
        }, 1500);
      } else {
        setTimeout(() => {
          setIsProcessing(false);
          setIsCheckoutOpen(false);
          router.push(`/host/dashboard/${createdRoomInfo.room_id}`);
        }, 1500);
      }
    } catch (err: any) {
      console.error(err);
      const paymentErr = {
        ko: '결제 처리 중 오류가 발생했습니다.',
        en: 'An error occurred during payment processing.',
        ja: '決済処理中にエラーが発生しました。',
        es: 'Ocurrió un error al procesar el pago.',
        'zh-TW': '付款處理時發生錯誤。',
        'zh-HK': '付款處理時發生錯誤。'
      }[activeLocale] || '결제 처리 중 오류가 발생했습니다.';
      showAlert(err.message || paymentErr);
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030305] text-foreground flex flex-col justify-between bg-grid-pattern relative overflow-hidden">
      {/* Background Neon Aura Spheres */}
      <div className="absolute top-[10%] left-[-10%] neon-glow-circle-1 opacity-40" />
      <div className="absolute bottom-[10%] right-[-10%] neon-glow-circle-2 opacity-30" />

      {/* Header */}
      <header className="border-b border-white/5 bg-[#030305]/60 backdrop-blur-md relative z-50 pt-[calc(env(safe-area-inset-top,0px)+12px)]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="text-zinc-400 hover:text-white transition-all text-xs font-extrabold flex items-center gap-1.5 cursor-pointer select-none bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 shadow-sm"
            >
              {
                {
                  ko: '← 뒤로가기',
                  en: '← Back',
                  ja: '← 戻る',
                  es: '← Volver',
                  'zh-TW': '← 返回',
                  'zh-HK': '← 返回',
                }[activeLocale] || '← 뒤로가기'
              }
            </Link>
            <Link href="/" className="flex items-center gap-2 font-black text-xl tracking-tight text-white font-outfit">
              <span>GlowWave</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-zinc-300 hover:text-white text-xs font-bold transition-all cursor-pointer select-none"
              >
                <Globe className="w-3.5 h-3.5" />
                <span className="uppercase">{activeLocale}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isLangDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40 bg-transparent" 
                    onClick={() => setIsLangDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-1.5 w-28 bg-[#0F0F15]/95 border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    {[
                      { val: 'ko', label: '한국어' },
                      { val: 'en', label: 'English' },
                      { val: 'ja', label: '日本語' },
                      { val: 'es', label: 'Español' },
                      { val: 'zh-TW', label: '繁體中文' },
                      { val: 'zh-HK', label: '繁體中文 (HK)' }
                    ].map((loc) => (
                      <button
                        key={loc.val}
                        type="button"
                        onClick={() => {
                          setActiveLocale(loc.val as Locale);
                          localStorage.setItem('glowwave_host_locale', loc.val);
                          localStorage.setItem('glowwave_home_locale', loc.val);
                          localStorage.setItem('glowwave_local_locale', loc.val);
                          setIsLangDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs font-bold transition-colors ${
                          activeLocale === loc.val 
                            ? 'bg-white/10 text-white font-extrabold' 
                            : 'text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {loc.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="text-[10px] text-zinc-500 font-black font-mono tracking-widest animate-pulse hidden sm:block">
              SETUP BUILDER v1.2
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1 grid lg:grid-cols-12 gap-8 lg:gap-12 w-full items-center relative z-10 overflow-hidden">
        
        {/* Left Column: Welcome & Showcase */}
        <div className="lg:col-span-6 flex flex-col gap-6 pr-0 lg:pr-8 py-4">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
              <span>{t('setup_badge', activeLocale)}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight tracking-tight">
              {activeLocale === 'ko' ? (
                <>
                  어두운 행사장을 빛낼<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">우리만의 모바일 전광판</span>
                </>
              ) : (
                <>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">{t('setup_title', activeLocale)}</span><br />
                  <span className="text-sm text-zinc-400 font-bold">{t('setup_subtitle', activeLocale)}</span>
                </>
              )}
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed max-w-md">
              {t('setup_desc', activeLocale)}
            </p>
          </div>

          {/* Phone Mockup Showcase: Replace preview with solid indigo GLOWWAVE */}
          <div className="flex flex-col items-center lg:items-start">
            <span className="text-[10px] font-bold font-mono text-zinc-500 uppercase mb-4 tracking-wider">{t('setup_preview_label', activeLocale)}</span>
            <LandscapePhoneMockup preset={{ bg_color: '#6366F1', text: 'GLOWWAVE', text_color: '#FFFFFF', effect: 'none', speed: 1000 }} />
          </div>
        </div>

        {/* Right Column: Setup Form */}
        <div className="lg:col-span-6 w-full max-w-lg mx-auto flex flex-col justify-center">
          <form onSubmit={handleStartSetup} className="glass-effect rounded-2xl p-5 sm:p-8 flex flex-col gap-6 bg-[#12121a] w-full">
            <h2 className="text-xl font-bold text-white mb-2">
              {t('setup_title', activeLocale)}
            </h2>

            {/* Dynamic Import Alert/Warning Banner */}
            {importStatus && (
              <div className={`rounded-xl p-4 border animate-in fade-in slide-in-from-top-2 duration-300 text-left font-sans ${
                selectedTier === 'free'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                  : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-200'
              }`}>
                <h4 className="text-xs font-black flex items-center gap-1.5 mb-1 text-white">
                  {selectedTier === 'free' ? (
                    <>
                      <span className="shrink-0 text-amber-400">⚠️</span>
                      <span>{t('setup_import_free_title', activeLocale)}</span>
                    </>
                  ) : (
                    <>
                      <span className="shrink-0 text-indigo-400">⚡</span>
                      <span>{t('setup_import_premium_title', activeLocale)}</span>
                    </>
                  )}
                </h4>
                <p className="text-[10px] text-zinc-400 leading-relaxed font-semibold">
                  {selectedTier === 'free' ? (
                    <span>
                      {t('setup_import_free_desc', activeLocale).replace('{cnt}', String(importedPresetCount))}
                    </span>
                  ) : (
                    <span>
                      {t('setup_import_premium_desc', activeLocale).replace('{cnt}', String(importedPresetCount))}
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* Email Input Step (No login logic) */}
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                {t('setup_email_label', activeLocale)}
              </label>
              <input
                type="email"
                required
                value={hostEmail}
                onChange={(e) => {
                  setHostEmail(e.target.value);
                  setEmailError('');
                  checkEmailTypo(e.target.value);
                }}
                placeholder="event@glowwave.com"
                className="w-full bg-[#0B0B0F] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-white text-sm"
              />
              {emailSuggestion && (
                <button
                  type="button"
                  onClick={() => {
                    setHostEmail(emailSuggestion);
                    setEmailSuggestion(null);
                  }}
                  className="text-amber-400 text-[10px] font-bold mt-2 hover:underline text-left block bg-amber-400/5 border border-amber-400/10 rounded-lg p-2 w-full animate-pulse"
                >
                  💡 혹시 이메일이 <span className="font-black text-white underline">{emailSuggestion}</span> 인가요? 클릭하여 자동 수정
                </button>
              )}
              {emailError ? (
                <p className="text-xs text-red-400 mt-2">
                  {emailError}
                </p>
              ) : (
                <p className="text-[10px] text-zinc-500 mt-2 font-medium">{t('setup_email_tip', activeLocale)}</p>
              )}
            </div>

            {/* Passcode Input Field (Paid Tiers Only) */}
            {selectedTier !== 'free' && (
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 animate-in fade-in slide-in-from-top-3 duration-200">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                  {t('setup_passcode_label', activeLocale)}
                </label>
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    if (val.length <= 6) {
                      setPasscode(val);
                      setPasscodeError('');
                    }
                  }}
                  placeholder={
                    {
                      ko: '예: 1234',
                      en: 'e.g. 1234',
                      ja: '例: 1234',
                      es: 'ej. 1234',
                      'zh-TW': '예: 1234',
                      'zh-HK': '예: 1234'
                    }[activeLocale] || '예: 1234'
                  }
                  className="w-full bg-[#0B0B0F] border border-white/10 rounded-lg px-4 py-2.5 text-white tracking-widest text-center text-sm font-black focus:outline-none focus:border-white font-mono"
                  maxLength={6}
                />
                {passcodeError ? (
                  <p className="text-xs text-red-400 mt-2">
                    {passcodeError}
                  </p>
                ) : (
                  <p className="text-[10px] text-zinc-500 mt-2 font-medium">
                    {t('setup_passcode_tip', activeLocale)}
                  </p>
                )}
              </div>
            )}

            {/* Plan Category Selector Tabs */}
            {true && (
              <div className="bg-black/30 border border-white/5 p-1 rounded-2xl flex gap-1.5 mt-2">
              <button
                type="button"
                onClick={() => {
                  setPlanType('event');
                  setSelectedTier('free');
                }}
                className={`flex-1 py-3 text-center rounded-xl text-xs font-black transition-all cursor-pointer select-none ${
                  planType === 'event'
                    ? 'bg-white text-black shadow-lg font-black'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5 font-bold'
                }`}
              >
                {
                  {
                    ko: '이벤트/행사용 (3h-24h)',
                    en: 'Event / Party (3h-24h)',
                    ja: 'イベント/フェス用 (3h-24h)',
                    es: 'Eventos y Fiestas (3h-24h)',
                    'zh-TW': '活動/派對用 (3h-24h)',
                    'zh-HK': '活動/派對用 (3h-24h)'
                  }[activeLocale] || '이벤트/행사용 (3h-24h)'
                }
              </button>
              <button
                type="button"
                onClick={() => {
                  setPlanType('store');
                  setSelectedTier('store');
                }}
                className={`flex-1 py-3 text-center rounded-xl text-xs font-black transition-all cursor-pointer select-none ${
                  planType === 'store'
                    ? 'bg-white text-black shadow-lg font-black'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5 font-bold'
                }`}
              >
                {
                  {
                    ko: '매장 전광판 (월간/연간 무중단)',
                    en: 'Store Signage (Monthly/Annual 24/7)',
                    ja: '店舗用看板 (月間/年間 24h)',
                    es: 'Letrero de Tienda (Mensual/Anual)',
                    'zh-TW': '店家電子看板 (月繳/年繳不斷線)',
                    'zh-HK': '店家電子看板 (月繳/年繳不斷線)'
                  }[activeLocale] || '매장 전광판 (월간/연간 무중단)'
                }
              </button>
            </div>
            )}

            {/* Tiers List */}
            <div className="flex flex-col gap-3">
              {(Object.keys(TIER_CONFIGS) as TierType[])
                .filter((tierKey) => {
                  if (planType === 'store') {
                    return tierKey === 'store' || tierKey === 'store_annual';
                  } else {
                    return tierKey === 'free' || tierKey === 'lite' || tierKey === 'pro' || tierKey === 'max';
                  }
                })
                .map((tierKey) => {
                  const cfg = TIER_CONFIGS[tierKey];
                  const isSelected = selectedTier === tierKey;
                return (
                  <button
                    key={tierKey}
                    type="button"
                    onClick={() => setSelectedTier(tierKey)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 duration-200 text-left ${
                      isSelected 
                        ? 'border-white bg-white/[0.04] shadow-[0_0_20px_rgba(255,255,255,0.03)]' 
                        : 'border-white/5 bg-transparent hover:border-white/10 hover:bg-white/[0.01]'
                    }`}
                  >
                    <div>
                      <div className="font-extrabold text-white text-xs flex items-center gap-2">
                        {getLocalizedTierName(tierKey, activeLocale)}
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />}
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-1 font-semibold">
                        {
                          {
                            ko: `최대 동시 접속 ${cfg.maxParticipants}명`,
                            en: `Max participants: ${cfg.maxParticipants}`,
                            ja: `最大接続人数: ${cfg.maxParticipants}名`,
                            es: `Capacidad máxima: ${cfg.maxParticipants} personas`,
                            'zh-TW': `最大同連線數 ${cfg.maxParticipants} 人`,
                            'zh-HK': `最大同連線數 ${cfg.maxParticipants} 人`
                          }[activeLocale] || `최대 동시 접속 ${cfg.maxParticipants}명`
                        }
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-white font-mono">
                        {getLocalizedPrice(tierKey, activeLocale)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Submit btn */}
            <button
              type="submit"
              disabled={isProcessing}
              className="btn-primary w-full py-4 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-xl"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                  {t('setup_creating', activeLocale)}
                </>
              ) : (
                t('card_host_btn', activeLocale)
              )}
            </button>
          </form>
        </div>

      </main>

      <div className="text-center py-4 relative z-10 bg-zinc-950/20">
        <button
          type="button"
          onClick={() => {
            setIsInquiryOpen(true);
            setInquiryEmail(hostEmail);
          }}
          className="text-zinc-500 hover:text-zinc-400 text-[11px] font-bold underline cursor-pointer"
        >
          {csLoc.btn_open}
        </button>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-zinc-950 py-6 text-center text-xs text-zinc-600">
        &copy; 2026 Anti-gravity. App setup is anonymous & encrypted.
      </footer>

      {/* Checkout Integration Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-sm" />
          
          <div className="glass-effect rounded-2xl w-full max-w-md p-6 relative z-10 animate-in fade-in zoom-in-95 duration-150 border border-white/10">
            {checkoutStep === 'input' && (
              <div className="flex flex-col gap-5">
                <div className="flex justify-between items-center pb-3 border-b border-white/10">
                  <h3 className="text-base font-bold text-white">
                    {t('setup_checkout_title', activeLocale)}
                  </h3>
                  <span className="text-xs text-zinc-500 font-mono">{t('room_code', activeLocale)}: {createdRoomInfo?.room_id}</span>
                </div>

                {/* PG Method Selector */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPaymentMethod('toss')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                      paymentMethod === 'toss'
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                        : 'border-white/5 bg-white/5 text-zinc-400'
                    }`}
                  >
                    {
                      {
                        ko: '토스페이 / 국내 카드',
                        en: 'Toss Pay / Domestic Card',
                        ja: 'Toss Pay / 国内カード',
                        es: 'Toss Pay / Tarjeta nacional',
                        'zh-TW': 'Toss Pay / 韓國國內卡',
                        'zh-HK': 'Toss Pay / 韓國國內卡'
                      }[activeLocale] || '토스페이 / 국내 카드'
                    }
                  </button>
                  <button
                    onClick={() => setPaymentMethod('stripe')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                      paymentMethod === 'stripe'
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                        : 'border-white/5 bg-white/5 text-zinc-400'
                    }`}
                  >
                    Stripe (Global Checkout)
                  </button>
                </div>

                {/* Promo Code Input Form */}
                <div className="bg-black/30 border border-white/5 rounded-xl p-3 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      {activeLocale === 'ko' ? '프로모션 코드' : 'Promo Code'}
                    </span>
                    {verifiedCoupon && (
                      <span className="text-[9px] text-emerald-400 font-extrabold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                        {verifiedCoupon.code} {verifiedCoupon.discount_pct}% 할인 적용됨
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCodeInput}
                      onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                      placeholder={activeLocale === 'ko' ? '예: GLOW30' : 'e.g. GLOW30'}
                      disabled={isVerifyingCoupon}
                      className="flex-1 bg-[#0c0c14] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors uppercase font-mono font-bold"
                    />
                    <button
                      type="button"
                      onClick={handleApplyPromoCode}
                      disabled={isVerifyingCoupon || !promoCodeInput.trim()}
                      className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-extrabold hover:bg-indigo-500 transition-colors cursor-pointer select-none disabled:opacity-50"
                    >
                      {isVerifyingCoupon ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        activeLocale === 'ko' ? '적용' : 'Apply'
                      )}
                    </button>
                  </div>
                  {couponError && (
                    <span className="text-[10px] text-red-400 font-bold block mt-1">{couponError}</span>
                  )}
                </div>

                {/* Pricing Summary info */}
                <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400 font-bold">{t('setup_checkout_plan', activeLocale)}</span>
                    <span className="text-white font-extrabold">{getLocalizedTierName(selectedTier, activeLocale)}</span>
                  </div>
                  <div className="flex justify-between text-xs pb-3 border-b border-white/5">
                    <span className="text-zinc-400 font-bold">{t('setup_checkout_capacity', activeLocale)}</span>
                    <span className="text-white font-extrabold">
                      {(() => {
                        const maxParticipants = TIER_CONFIGS[selectedTier]?.maxParticipants;
                        if (maxParticipants === undefined) return '';
                        return {
                          ko: `${maxParticipants}명`,
                          en: `${maxParticipants}`,
                          ja: `${maxParticipants}名`,
                          es: `${maxParticipants} personas`,
                          'zh-TW': `${maxParticipants} 人`,
                          'zh-HK': `${maxParticipants} 人`
                        }[activeLocale] || `${maxParticipants}명`;
                      })()}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-1.5">
                    <span className="text-zinc-400 font-extrabold text-xs">{t('setup_checkout_total', activeLocale)}</span>
                    <div className="flex flex-col items-end">
                      {verifiedCoupon ? (
                        <>
                          <span className="text-[10px] text-zinc-500 line-through font-mono">
                            {paymentMethod === 'toss' 
                              ? getLocalizedPrice(selectedTier, 'ko') 
                              : getLocalizedPrice(selectedTier, activeLocale)}
                          </span>
                          <span className="text-emerald-400 font-extrabold text-sm font-mono animate-pulse">
                            {(() => {
                              const config = TIER_CONFIGS[selectedTier];
                              if (!config) return '';
                              const basePrice = config.priceKrw;
                              const discounted = Math.round(basePrice * (1 - verifiedCoupon.discount_pct / 100));
                              if (paymentMethod === 'toss') {
                                return discounted === 0 ? '무료 (Free)' : `₩${discounted.toLocaleString()}원`;
                              } else {
                                const usdBase = config.priceUsd;
                                const discountedUsd = usdBase * (1 - verifiedCoupon.discount_pct / 100);
                                return `$${discountedUsd.toFixed(2)} USD`;
                              }
                            })()}
                          </span>
                        </>
                      ) : (
                        <span className="text-indigo-400 font-extrabold text-sm font-mono">
                          {paymentMethod === 'toss' 
                            ? getLocalizedPrice(selectedTier, 'ko') 
                            : getLocalizedPrice(selectedTier, activeLocale)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-zinc-500 leading-normal">
                  <span>{t('setup_checkout_sim_warning', activeLocale)}</span>
                </div>

                <div className="flex gap-3 mt-2">
                  <button
                    disabled={isProcessing}
                    onClick={() => setIsCheckoutOpen(false)}
                    className="flex-1 py-3 rounded-xl bg-white/5 text-zinc-300 font-semibold hover:bg-white/10 transition-all text-xs"
                  >
                    {t('cancel', activeLocale)}
                  </button>
                  <button
                    disabled={isProcessing}
                    onClick={simulatePaymentSuccess}
                    className="flex-1 py-3 rounded-xl bg-indigo-500 text-white font-bold hover:bg-indigo-600 transition-all text-xs flex items-center justify-center gap-1.5"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                        {t('setup_checkout_processing', activeLocale)}
                      </>
                    ) : (
                      t('setup_btn_checkout', activeLocale)
                    )}
                  </button>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsInquiryOpen(true);
                      setInquiryEmail(hostEmail);
                      setInquiryRoomId(createdRoomInfo?.room_id || '');
                    }}
                    className="text-[10px] text-zinc-500 hover:text-zinc-400 font-bold underline transition-colors"
                  >
                    결제 오류 및 환불 신청 1:1 접수
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CS Inquiry Modal */}
      {isInquiryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-sm" onClick={() => setIsInquiryOpen(false)} />
          
          <div className="glass-effect rounded-2xl w-full max-w-md p-6 relative z-10 animate-in fade-in zoom-in-95 duration-150 border border-white/10 bg-[#12121a]">
            <div className="flex justify-between items-center pb-3 border-b border-white/10 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                <span>{csLoc.title}</span>
              </h3>
              <button onClick={() => setIsInquiryOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitInquiry} className="flex flex-col gap-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">{csLoc.email_label}</label>
                <input
                  type="email"
                  required
                  value={inquiryEmail}
                  onChange={(e) => setInquiryEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-[#0B0B0F] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">{csLoc.category_label}</label>
                <select
                  value={inquiryCategory}
                  onChange={(e) => setInquiryCategory(e.target.value as any)}
                  className="w-full bg-[#0B0B0F] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white text-xs cursor-pointer font-bold text-zinc-300"
                >
                  <option value="refund">{csLoc.cat_refund}</option>
                  <option value="recovery">{csLoc.cat_recovery}</option>
                  <option value="bug">{csLoc.cat_bug}</option>
                  <option value="etc">{csLoc.cat_etc}</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">{csLoc.room_id_label}</label>
                <input
                  type="text"
                  value={inquiryRoomId}
                  onChange={(e) => setInquiryRoomId(e.target.value)}
                  placeholder={csLoc.room_placeholder}
                  className="w-full bg-[#0B0B0F] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">{csLoc.message_label}</label>
                <textarea
                  required
                  rows={4}
                  value={inquiryMessage}
                  onChange={(e) => setInquiryMessage(e.target.value)}
                  placeholder={csLoc.message_placeholder}
                  className="w-full bg-[#0B0B0F] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white text-xs resize-none leading-relaxed"
                />
              </div>

              <div className="flex gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={() => setIsInquiryOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white transition-all text-xs font-bold"
                >
                  {csLoc.cancel}
                </button>
                <button
                  type="submit"
                  disabled={inquirySubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {inquirySubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                      {csLoc.submitting}
                    </>
                  ) : (
                    csLoc.submit
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Alert Modal */}
      {customAlert?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setCustomAlert(null)} />
          <div className="glass-effect rounded-2xl w-full max-w-sm p-6 relative z-10 animate-in fade-in zoom-in-95 duration-150 border border-white/10 bg-[#12121a] text-center">
            <h3 className="text-sm font-bold text-white mb-2">
              {customAlert.title || (activeLocale === 'ko' ? '알림' : 'Notification')}
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed mb-6">
              {customAlert.message}
            </p>
            <button
              onClick={() => setCustomAlert(null)}
              className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition-colors"
            >
              {csLoc.alert_ok}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
