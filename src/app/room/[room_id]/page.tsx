'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  RotateCw, 
  Smartphone, 
  Loader2,
  Lock,
  WifiOff
} from 'lucide-react';
import { Preset } from '@/lib/types';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import useFitText from '@/hooks/useFitText';
import { Locale } from '@/lib/translations';

const ROOM_TRANSLATIONS: Record<Locale, Record<string, string>> = {
  ko: {
    err_title: '접속 오류',
    err_back: '홈으로 돌아가기',
    cap_title: '접속 인원 제한 초과',
    cap_desc: '본 방은 주최자의 요금제별 지정 동시 접속 한도에 도달했습니다.\n기존 참여자가 나가거나 주최자가 상위 등급으로 업그레이드할 때까지 입장이 제한됩니다.',
    cap_btn: '메인 홈으로 가기',
    inactive_title: '결제 승인 확인 중...',
    inactive_desc: '방장이 결제를 완료할 때까지 대기하고 있습니다.\n결제가 확인되는 즉시 자동으로 전광판 화면이 열립니다.',
    pass_title: '비밀번호가 필요한 방입니다',
    pass_desc: '이 방은 입장 비밀번호 보안이 활성화되어 있습니다.\n방장이 제공한 숫자 4~6자리 비밀번호를 입력해 주세요.',
    pass_placeholder: '숫자 비밀번호 입력',
    pass_btn_home: '홈으로 가기',
    pass_btn_enter: '입장하기',
    pass_verifying: '검증 중...',
    pass_failed: '인증 실패',
    low_power_title: '화면 꺼짐 안내',
    low_power_desc: '기기의 저전력 모드가 켜져 있으면 화면이 꺼질 수 있습니다. 꺼짐 방지를 위해 설정을 해제해 주세요.',
    ready_title: '전광판 동기화 준비 완료',
    ready_low_power_warn: '스마트폰의 [저전력 모드]가 켜져 있으면 화면 꺼짐 방지가 정상 작동하지 않습니다. 원활한 연출을 위해 저전력 모드를 해제해 주세요.',
    ready_ios_title: '아이폰(iOS) 전체화면 설정 권장',
    ready_ios_desc_chrome: '아이폰 크롬 브라우저는 주소창과 메뉴바를 숨길 수 없어 일반 브라우저로 접속 시 전광판이 잘려 보입니다. 아래 순서대로 홈 화면에 추가하여 실행하시면 완벽한 전체화면 앱으로 이용 가능합니다.',
    ready_ios_desc_safari: '아이폰 사파리 브라우저는 주소창과 메뉴바를 숨길 수 없어 일반 브라우저로 접속 시 전광판이 잘려 보입니다. 아래 순서대로 홈 화면에 추가하여 실행하시면 완벽한 전체화면 앱으로 이용 가능합니다.',
    ready_ios_step1_chrome: '크롬 화면의 [공유 버튼](우측 상단 주소창 옆 또는 하단 메뉴의 공유 아이콘)을 클릭합니다.',
    ready_ios_step1_safari: '사파리 화면 하단 중앙의 [공유 버튼](네모에 위 화살표 모양)을 클릭합니다.',
    ready_ios_step2: '메뉴 목록 중 [홈 화면에 추가]를 선택합니다.',
    ready_ios_step3: '바탕화면에 생성된 GlowWave 아이콘으로 재접속해 주세요.',
    ready_ios_tip: '💡 이미 홈 화면에 GlowWave 앱을 추가하셨다면, 홈 화면에서 앱을 직접 실행하시고 입장 코드 {code}를 입력하여 참여하시는 것이 가장 편리합니다!',
    ready_ios_btn_bypass: '※ 홈 화면에 추가하지 않고 그냥 브라우저로 이용하려면 아래 버튼을 누르세요.',
    ready_android_desc: '아래 [입장하기] 버튼을 누르면 전광판 화면이 시작되며 가로 전체화면 모드 및 화면 켜짐 유지가 실행됩니다.',
    ready_btn_enter: '입장하기',
    watermark_create: '나만의 전광판 만들기(무료)',
  },
  en: {
    err_title: 'Connection Error',
    err_back: 'Back to Home',
    cap_title: 'Capacity Limit Exceeded',
    cap_desc: 'This room has reached its simultaneous connection limit.\nEntry is restricted until existing participants leave or the host upgrades the plan.',
    cap_btn: 'Go to Main Home',
    inactive_title: 'Verifying Payment Approval...',
    inactive_desc: 'Waiting for the host to complete the payment.\nThe signboard screen will open automatically as soon as payment is confirmed.',
    pass_title: 'Passcode Required',
    pass_desc: 'This room has passcode security enabled.\nPlease enter the 4 to 6 digit passcode provided by the host.',
    pass_placeholder: 'Enter passcode',
    pass_btn_home: 'Back to Home',
    pass_btn_enter: 'Enter Room',
    pass_verifying: 'Verifying...',
    pass_failed: 'Authentication failed',
    low_power_title: 'Screen Sleep Warning',
    low_power_desc: 'If your device\'s Low Power Mode is on, the screen may turn off. Please disable it to keep the screen awake.',
    ready_title: 'Signboard Ready to Sync',
    ready_low_power_warn: 'If Low Power Mode is enabled on your smartphone, screen sleep prevention will not function properly. Please disable Low Power Mode.',
    ready_ios_title: 'iOS Full Screen Recommended',
    ready_ios_desc_chrome: 'Chrome on iOS cannot hide the address and menu bars, which may cut off the signboard. Follow the steps below to add it to your Home Screen for a seamless full-screen experience.',
    ready_ios_desc_safari: 'Safari on iOS cannot hide the address and menu bars, which may cut off the signboard. Follow the steps below to add it to your Home Screen for a seamless full-screen experience.',
    ready_ios_step1_chrome: 'Tap the [Share Button] in Chrome (next to the address bar or in the menu).',
    ready_ios_step1_safari: 'Tap the [Share Button] at the bottom center of Safari (rectangle with up arrow).',
    ready_ios_step2: 'Select [Add to Home Screen] from the menu.',
    ready_ios_step3: 'Open the app using the new GlowWave icon on your Home Screen.',
    ready_ios_tip: '💡 If you have already added GlowWave to your Home Screen, it is easiest to launch it directly and enter Room Code {code}!',
    ready_ios_btn_bypass: '※ To continue using your browser without adding to the Home Screen, tap below.',
    ready_android_desc: 'Tap the [Enter Room] button below to open the signboard in full screen and prevent the screen from sleeping.',
    ready_btn_enter: 'Enter Room',
    watermark_create: 'Create your own signboard (Free)',
  },
  ja: {
    err_title: '接続エラー',
    err_back: 'ホームに戻る',
    cap_title: '接続人数制限超過',
    cap_desc: 'このルームは主催者のプランで指定された同時接続上限に達しました。\n既存の参加者が退出するか、主催者が上位プランにアップグレードするまで入場が制限されます。',
    cap_btn: 'メインホームへ移動',
    inactive_title: '決済承認の確認中...',
    inactive_desc: '主催者が決済を完了するまで待機しています。\n決済が確認され次第、自動的に電光掲示板画面が開きます。',
    pass_title: 'パスコードが必要です',
    pass_desc: 'このルームは入場パスコードによるセキュリティが有効です。\n主催者から提供された4〜6桁の数字のパスコードを入力してください。',
    pass_placeholder: 'パスコードを入力',
    pass_btn_home: 'ホームへ移動',
    pass_btn_enter: '入場する',
    pass_verifying: '検証中...',
    pass_failed: '認証に失敗しました',
    low_power_title: 'スリープ防止警告',
    low_power_desc: '端末の低電力モードが有効な場合、画面が消えることがあります。スリープを防ぐために設定を解除してください。',
    ready_title: '電光掲示板同期準備完了',
    ready_low_power_warn: 'スマートフォンの「低電力モード」がONになっていると、画面消灯防止機能が正しく動作しません。円滑な演出のために低電力モードを解除してください。',
    ready_ios_title: 'iOSでの全画面表示設定の推奨',
    ready_ios_desc_chrome: 'iOSのChromeブラウザはアドレスバーとメニューバーを非表示にできないため、通常のブラウザ接続では電光掲示板が切れて表示される場合があります。以下の手順でホーム画面に追加して実行すると、完璧な全画面表示アプリとしてご利用いただけます。',
    ready_ios_desc_safari: 'iOSのSafariブラウザはアドレスバーとメニューバーを非表示にできないため、通常のブラウザ接続では電光掲示板が切れて表示される場合があります。以下の手順でホーム画面に追加して実行すると、完璧な全画面表示アプリとしてご利用いただけます。',
    ready_ios_step1_chrome: 'Chrome画面の「共有ボタン」（右上のアドレスバーの横、または下部メニューの共有アイコン）をタップします。',
    ready_ios_step1_safari: 'Safari画面下部中央の「共有ボタン」（四角に上矢印のアイコン）をタップします。',
    ready_ios_step2: 'メニューリストから「ホーム画面に追加」を選択します。',
    ready_ios_step3: 'デスクトップに生成されたGlowWaveアイコンから再接続してください。',
    ready_ios_tip: '💡 すでにホーム画面にGlowWaveアプリを追加している場合は、ホーム画面から直接起動し、入場コード {code} を入力して参加するのが最も便利です！',
    ready_ios_btn_bypass: '※ ホーム画面に追加せず、ブラウザのままで利用する場合は下のボタンをタップしてください。',
    ready_android_desc: '下の「入場する」ボタンをタップすると、電光掲示板画面が起動し、横全画面モードおよび画面常時点灯が有効になります。',
    ready_btn_enter: '入場する',
    watermark_create: '自分だけの電光掲示板を作る（無料）',
  },
  es: {
    err_title: 'Error de Conexión',
    err_back: 'Volver al Inicio',
    cap_title: 'Límite de Capacidad Excedido',
    cap_desc: 'Esta sala ha alcanzado su límite de conexión simulánea.\nEl ingreso está restringido hasta que los participantes salgan o el anfitrión actualice su plan.',
    cap_btn: 'Ir al Inicio Principal',
    inactive_title: 'Verificando Pago...',
    inactive_desc: 'Esperando que el anfitrión complete el pago.\nLa pantalla se abrirá automáticamente tan pronto como se confirme el pago.',
    pass_title: 'Contraseña Requerida',
    pass_desc: 'Esta sala tiene habilitada la seguridad por contraseña.\nPor favor, ingrese la contraseña de 4 a 6 dígitos proporcionada por el anfitrión.',
    pass_placeholder: 'Ingrese la contraseña',
    pass_btn_home: 'Ir al Inicio',
    pass_btn_enter: 'Entrar',
    pass_verifying: 'Verificando...',
    pass_failed: 'Error de autenticación',
    low_power_title: 'Advertencia de Suspensión',
    low_power_desc: 'Si el modo de bajo consumo de su dispositivo está activado, la pantalla puede apagarse. Desactívelo para mantener la pantalla encendida.',
    ready_title: 'Signboard Listo para Sincronizar',
    ready_low_power_warn: 'Si el modo de bajo consumo está activado en su teléfono, la prevención de apagado de pantalla no funcionará correctamente. Desactívelo para una mejor experiencia.',
    ready_ios_title: 'Pantalla Completa iOS Recomendada',
    ready_ios_desc_chrome: 'Chrome en iOS no puede ocultar las barras de dirección y menú, lo que puede recortar el letrero. Siga los pasos a continuación para agregarlo a su pantalla de inicio para una experiencia de pantalla completa.',
    ready_ios_desc_safari: 'Safari en iOS no puede ocultar las barras de dirección y menú, lo que puede recortar el letrero. Siga los pasos a continuación para agregarlo a su pantalla de inicio para una experiencia de pantalla completa.',
    ready_ios_step1_chrome: 'Toque el [Botón Compartir] en Chrome (al lado de la barra de direcciones o en el menú).',
    ready_ios_step1_safari: 'Toque el [Botón Compartir] en la parte inferior central de Safari (rectángulo con flecha hacia arriba).',
    ready_ios_step2: 'Seleccione [Agregar a la pantalla de inicio] en el menú.',
    ready_ios_step3: 'Abra la aplicación con el nuevo ícono de GlowWave en su pantalla de inicio.',
    ready_ios_tip: '💡 Si ya ha agregado GlowWave a su pantalla de inicio, ¡es más fácil iniciarla directamente e ingresar el código de sala {code}!',
    ready_ios_btn_bypass: '※ Para continuar usando el navegador sin agregarlo a la pantalla de inicio, toque abajo.',
    ready_android_desc: 'Toque el botón [Entrar] a continuación para iniciar el letrero en pantalla completa y evitar que la pantalla se apague.',
    ready_btn_enter: 'Entrar',
    watermark_create: 'Crea tu propio letrero (Gratis)',
  },
  'zh-TW': {
    err_title: '連線錯誤',
    err_back: '返回首頁',
    cap_title: '連線人數已達上限',
    cap_desc: '本房間已達主辦方方案設定的同時連線人數上限。\n在現有參與者退出或主辦方升級方案前，暫時限制進入。',
    cap_btn: '前往首頁',
    inactive_title: '正在確認付款授權...',
    inactive_desc: '正在等待房主完成付款。\n付款確認後，電子看板畫面將會自動開啟。',
    pass_title: '此房間需要密碼',
    pass_desc: '此房間已啟用進入密碼安全保護。\n請輸入房主提供的 4 到 6 位數字密碼。',
    pass_placeholder: '請輸入數字密碼',
    pass_btn_home: '回首頁',
    pass_btn_enter: '進入房間',
    pass_verifying: '驗證中...',
    pass_failed: '驗證失敗',
    low_power_title: '螢幕休眠提示',
    low_power_desc: '若您的裝置開啟了低電量模式，螢幕可能會自動關閉。請關閉此模式以保持螢幕常亮。',
    ready_title: '電子看板已準備好同步',
    ready_low_power_warn: '如果您的智慧型手機啟動了「低電量模式」，防螢幕休眠功能將無法正常運作。請關閉低電量模式。',
    ready_ios_title: '建議設定 iOS 全螢幕',
    ready_ios_desc_chrome: 'iOS 的 Chrome 瀏覽器無法隱藏網址列與選單列，可能會導致看板顯示不完整。請按照以下步驟加入主畫面，以獲得最佳的全螢幕體驗。',
    ready_ios_desc_safari: 'iOS 的 Safari 瀏覽器無法隱藏網址列與選單列，可能會導致看板顯示不完整。請按照以下步驟加入主畫面，以獲得最佳的全螢幕體驗。',
    ready_ios_step1_chrome: '點擊 Chrome 中的 [分享按鈕]（網址列旁或選單中的分享圖示）。',
    ready_ios_step1_safari: '點擊 Safari 畫面正下方的 [分享按鈕]（正方形加向上箭頭）。',
    ready_ios_step2: '從選單中選擇 [加入主畫面]。',
    ready_ios_step3: '從主畫面上新增的 GlowWave 圖示重新開啟。',
    ready_ios_tip: '💡 如果您已經將 GlowWave 加入主畫面，直接開啟並輸入房間代碼 {code} 是最便利的方式！',
    ready_ios_btn_bypass: '※ 若要直接使用瀏覽器而不加入主畫面，請點擊下方按鈕。',
    ready_android_desc: '點擊下方 [進入房間] 按鈕將開啟全螢幕電子看板並防止螢幕休眠。',
    ready_btn_enter: '進入房間',
    watermark_create: '製作專屬電子看板（免費）',
  },
  'zh-HK': {
    err_title: '連線錯誤',
    err_back: '返回首頁',
    cap_title: '連線人數已達上限',
    cap_desc: '本房間已達主辦方方案設定的同時連線人數上限。\n在現有參與者退出或主辦方升級方案前，暫時限制進入。',
    cap_btn: '前往首頁',
    inactive_title: '正在確認付款授權...',
    inactive_desc: '正在等待房主完成付款。\n電子看板畫面將會自動開啟。',
    pass_title: '此房間需要密碼',
    pass_desc: '此房間已啟用進入密碼安全保護。\n請輸入房主提供的 4 到 6 位數字密碼。',
    pass_placeholder: '請輸入數字密碼',
    pass_btn_home: '回首頁',
    pass_btn_enter: '進入房間',
    pass_verifying: '驗證中...',
    pass_failed: '驗證失敗',
    low_power_title: '螢幕休眠提示',
    low_power_desc: '若您的裝置開啟了低電量模式，螢幕可能會自動關閉。請關閉此模式以保持螢幕常亮。',
    ready_title: '電子看板已準備好同步',
    ready_low_power_warn: '如果您的智慧型手機啟動了「低電量模式」，防螢幕休眠功能將無法正常運作。請關閉低電量模式。',
    ready_ios_title: '建議設定 iOS 全螢幕',
    ready_ios_desc_chrome: 'iOS 的 Chrome 瀏覽器無法隱藏網址列與選單列，可能會導致看板顯示不完整。請按照以下步驟加入主畫面，以獲得最佳的全螢幕體驗。',
    ready_ios_desc_safari: 'iOS 的 Safari 瀏覽器無法隱藏網址列與選單列，可能會導致看板顯示不完整。請按照以下步驟加入主畫面，以獲得最佳的全螢幕體驗。',
    ready_ios_step1_chrome: '點擊 Chrome 中的 [分享按鈕]（網址列旁或選單中的分享圖示）。',
    ready_ios_step1_safari: '點擊 Safari 畫面正下方的 [分享按鈕]（正方形加向上箭頭）。',
    ready_ios_step2: '從選單中選擇 [加入主畫面]。',
    ready_ios_step3: '從主畫面上新增的 GlowWave 圖示重新開啟。',
    ready_ios_tip: '💡 如果您已經將 GlowWave 加入主畫面，直接開啟並輸入房間代碼 {code} 是最便利的方式！',
    ready_ios_btn_bypass: '※ 若要直接使用瀏覽器而不加入主畫面，請點擊下方按鈕。',
    ready_android_desc: '點擊下方 [進入房間] 按鈕將開啟全螢幕電子看板並防止螢幕休眠。',
    ready_btn_enter: '進入房間',
    watermark_create: '製作專屬電子看板（免費）',
  }
};

export default function AudienceRoom() {
  const params = useParams();
  const router = useRouter();
  const rawRoomId = params.room_id as string;
  const roomId = rawRoomId ? rawRoomId.toUpperCase() : '';

  const [showSafariTip, setShowSafariTip] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isForcedLandscape, setIsForcedLandscape] = useState<boolean>(false);

  const getFontFamilyClass = (fontFamily?: string) => {
    const loc = currentPreset?.locale || 'ko';
    switch (fontFamily) {
      case 'sans-thin':
        return `font-sign-sans-thin-${loc} font-bold`;
      case 'sans-thick':
        return `font-sign-sans-thick-${loc} font-black`;
      case 'serif':
        return `font-sign-serif-${loc} font-bold`;
      case 'neon':
        return `font-sign-neon-${loc} font-black`;
      case 'pixel':
        return `font-sign-pixel-${loc}`;
      case 'plump':
        return `font-sign-plump-${loc} font-black`;
      default:
        return `font-sign-sans-thin-${loc} font-bold`;
    }
  };

  // Immersive UI and auto-hide states
  const [showEnterOverlay, setShowEnterOverlay] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const controlsTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetControlsTimer = () => {
    setShowControls(true);
    if (controlsTimerRef.current) {
      clearTimeout(controlsTimerRef.current);
    }
    controlsTimerRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
    requestWakeLock();
  };

  // Current Signboard Display State
  const [currentPreset, setCurrentPreset] = useState<Preset>({
    bg_color: '#0B0B0F',
    text: '연결 중...',
    text_color: '#FFFFFF',
    effect: 'none',
    speed: 1000
  });

  // Countdown timer state
  const [countdownVal, setCountdownVal] = useState<number | string>(currentPreset.countdown_seconds || 10);

  // Memoized special effect particles to avoid re-generating random attributes on every render
  const specialEffectParticles = useMemo(() => {
    const effect = currentPreset.special_effect;
    if (!effect || effect === 'none') return [];
    
    const count = effect === 'stars' ? 35 : effect === 'confetti' ? 45 : 30; // Hearts: 30, Stars: 35, Confetti: 45
    const particles = [];
    
    for (let i = 0; i < count; i++) {
      if (effect === 'hearts') {
        particles.push({
          id: i,
          left: `${Math.random() * 100}%`,
          fontSize: `${18 + Math.random() * 26}px`,
          delay: `${Math.random() * 6}s`,
          duration: `${4 + Math.random() * 5}s`,
          sway: `${2 + Math.random() * 3}s`,
          color: ['#EF4444', '#EC4899', '#F472B6', '#F43F5E', '#D946EF'][Math.floor(Math.random() * 5)]
        });
      } else if (effect === 'confetti') {
        particles.push({
          id: i,
          left: `${Math.random() * 100}%`,
          fontSize: `${12 + Math.random() * 20}px`,
          delay: `${Math.random() * 5}s`,
          duration: `${3 + Math.random() * 4}s`,
          sway: `${1.5 + Math.random() * 2}s`,
          color: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#14B8A6'][Math.floor(Math.random() * 7)]
        });
      } else if (effect === 'stars') {
        particles.push({
          id: i,
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          fontSize: `${4 + Math.random() * 8}px`,
          delay: `${Math.random() * 4}s`,
          duration: `${2 + Math.random() * 4}s`,
          color: ['#FFF', '#FEF08A', '#A5F3FC', '#F472B6', '#C084FC'][Math.floor(Math.random() * 5)]
        });
      }
    }
    return particles;
  }, [currentPreset.special_effect]);

  // Trigger countdown timer decrement when currentPreset effect is set to countdown
  useEffect(() => {
    if (currentPreset.effect === 'countdown') {
      const startSec = currentPreset.countdown_seconds || 10;
      setCountdownVal(startSec);
      const timer = setInterval(() => {
        setCountdownVal((prev) => {
          if (typeof prev === 'number') {
            if (prev <= 1) {
              return currentPreset.result_text || 'START';
            }
            return prev - 1;
          }
          return prev;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [currentPreset.text, currentPreset.effect, currentPreset.countdown_seconds, currentPreset.result_text, currentPreset.trigger_id]);

  // Persistent Client Audience UUID
  const [audienceUuid, setAudienceUuid] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      let uuid = localStorage.getItem('glowwave_audience_uuid');
      if (!uuid) {
        uuid = 'x-xxxx-xxxx-xxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
        localStorage.setItem('glowwave_audience_uuid', uuid);
      }
      setAudienceUuid(uuid);
    }
  }, []);

  // Automatically bypass enter overlay on Desktop PC environments
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isMobileDevice = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const isSmallScreen = window.innerWidth < 768;
      
      // If it is a Desktop PC (Not mobile device AND not a small screen), skip the enter overlay immediately
      if (!isMobileDevice && !isSmallScreen) {
        setShowEnterOverlay(false);
      }
    }
  }, []);

  const isCountdown = currentPreset.effect === 'countdown';
  const isLuckyDraw = currentPreset.effect === 'luckydraw';
  const isLuckyDrawWait = currentPreset.effect === 'luckydraw_wait';
  const isWinner = isLuckyDraw && (
    currentPreset.lucky_draw_winner_id === audienceUuid ||
    (currentPreset.lucky_draw_winner_ids && currentPreset.lucky_draw_winner_ids.includes(audienceUuid))
  );
  const isBlink = currentPreset.effect === 'blink';
  const isDuoSiren = (isBlink && !!currentPreset.bg_color_secondary) || isWinner;

  // Compute text to display on screen
  const displayText = isCountdown 
    ? String(countdownVal) 
    : isLuckyDrawWait
      ? '추첨 대기 중'
      : isLuckyDraw
        ? (isWinner ? (currentPreset.text || '👑 축하합니다! 당첨!') : (currentPreset.result_text || '아쉽네요! 다음 기회에..'))
        : currentPreset.text;

  // Use dynamic fitting hook to sync text sizes proportional to viewport container clientWidth/clientHeight
  const { containerRef, fontSize } = useFitText(
    displayText,
    currentPreset.effect,
    currentPreset.font_size || 100,
    isForcedLandscape
  );

  // Active Locale State
  const [activeLocale, setActiveLocale] = useState<Locale>('ko');

  // Hydrate Locale
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

  // Passcode States
  const [passcodeLocked, setPasscodeLocked] = useState(false);
  const [enteredPasscode, setEnteredPasscode] = useState('');
  const [passcodeChecking, setPasscodeChecking] = useState(false);
  const [passcodeErrorMsg, setPasscodeErrorMsg] = useState('');
  const [wakeLockError, setWakeLockError] = useState(false);
  const [showLowPowerToast, setShowLowPowerToast] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isHardCapped, setIsHardCapped] = useState(false);
  const [isRoomInactive, setIsRoomInactive] = useState(false);
  const [roomStatus, setRoomStatus] = useState<string>('active');
  const [isIOSUserAndNotStandalone, setIsIOSUserAndNotStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isChromeIOS, setIsChromeIOS] = useState(false);

  // Technical Refs for Wake Lock & Real-time
  const wakeLockRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const supabaseChannelRef = useRef<any>(null);
  const fullscreenRef = useRef<HTMLDivElement>(null);

  // Fullscreen Change Listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    // Check iOS and Standalone Mode on first render
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);
    const isChrome = /CriOS/i.test(navigator.userAgent);
    setIsChromeIOS(isChrome);
    const isStandaloneMode = (window.navigator as any).standalone === true || window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(isStandaloneMode);
    
    if (ios) {
      if (!isStandaloneMode) {
        setIsIOSUserAndNotStandalone(true);
      }
    }

    resetControlsTimer();

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current);
      }
    };
  }, []);

  const toggleFullscreen = async () => {
    if (!fullscreenRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await fullscreenRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
      // Re-request wake lock since entering/exiting fullscreen can reset it
      setTimeout(() => {
        requestWakeLock();
      }, 300);
    } catch (err) {
      console.warn('Fullscreen API block:', err);
      setShowSafariTip(true);
    }
  };

  const handlePasscodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enteredPasscode) return;
    setPasscodeChecking(true);
    setPasscodeErrorMsg('');

    try {
      const response = await fetch(`/api/room/${roomId}/verify-passcode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: enteredPasscode })
      });

      if (!response.ok) {
        const data = await response.json();
        const invalidPassMsg = {
          ko: '비밀번호가 올바르지 않습니다.',
          en: 'Incorrect passcode.',
          ja: 'パスコードが正しくありません。',
          es: 'Contraseña incorrecta.',
          'zh-TW': '密碼不正確。',
          'zh-HK': '密碼不正確。'
        }[activeLocale] || '비밀번호가 올바르지 않습니다.';
        throw new Error(data.error || invalidPassMsg);
      }

      // Success
      if (typeof window !== 'undefined') {
        localStorage.setItem(`glowwave_passcode_${roomId}`, enteredPasscode);
      }
      setPasscodeLocked(false);
      
      // Load and connect
      connectRealtime(roomId, enteredPasscode);
      requestWakeLock();
    } catch (err: any) {
      console.error(err);
      setPasscodeErrorMsg(err.message || ROOM_TRANSLATIONS[activeLocale].pass_failed);
    } finally {
      setPasscodeChecking(false);
    }
  };

  const validateAndConnect = async (isReconnect = false) => {
    if (!roomId) return;
    if (!isReconnect) setLoading(true);

    try {
      const response = await fetch(`/api/room/${roomId}/status`);
      if (!response.ok) {
        if (isReconnect && response.status >= 500) {
          console.warn('[Room] Reconnect status check returned server error:', response.status);
          return;
        }

        let errorMsg = {
          ko: '방 정보를 불러오는 과정에서 오류가 발생했습니다.',
          en: 'An error occurred while loading room information.',
          ja: 'ルーム情報の読み込み中にエラーが発生しました。',
          es: 'Ocurrió un error al cargar la información de la sala.',
          'zh-TW': '載入房間資訊時發生錯誤。',
          'zh-HK': '載入房間資訊時發生錯誤。'
        }[activeLocale] || '방 정보를 불러오는 과정에서 오류가 발생했습니다.';
        try {
          const errData = await response.json();
          if (errData.suggestion) {
            errorMsg = errData.suggestion;
          } else if (response.status === 404) {
            errorMsg = {
              ko: '존재하지 않거나 만료된 방 번호입니다. 방은 생성 후 24시간 동안만 유지됩니다.',
              en: 'This room code does not exist or has expired. Rooms only last for 24 hours.',
              ja: '存在しないか期限切れのルーム番号です。ルームは作成後24時間のみ維持されます。',
              es: 'Este código de sala no existe o ha expirado. Las salas solo duran 24 horas.',
              'zh-TW': '此房間代碼不存在或已過期。房間自建立起僅維持 24 小時。',
              'zh-HK': '此房間代碼不存在或已過期。房間自建立起僅維持 24 小時。'
            }[activeLocale] || '존재하지 않거나 만료된 방 번호입니다. 방은 생성 후 24시간 동안만 유지됩니다.';
          }
        } catch (e) {}
        
        setError(errorMsg);
        if (response.status === 404 && typeof window !== 'undefined') {
          localStorage.removeItem('glowwave_last_joined_room_id');
        }
        setLoading(false);
        return;
      }

      const roomData = await response.json();
      
      if (roomData.current_state) {
        setCurrentPreset(roomData.current_state);
      }
      
      setRoomStatus(roomData.status || 'active');
      if (roomData.status === 'pending') {
        setIsRoomInactive(true);
        setLoading(false);
        return;
      }
      setIsRoomInactive(false);

      if (!isReconnect && roomData.current_participants >= roomData.max_participants) {
        setIsHardCapped(true);
        setLoading(false);
        return;
      }
      setIsHardCapped(false);

      // Verify Passcode if room is password-locked
      let verifiedPass = '';
      if (roomData.has_passcode) {
        const savedPass = localStorage.getItem(`glowwave_passcode_${roomId}`) || '';
        if (savedPass) {
          // Verify saved passcode
          const verifyRes = await fetch(`/api/room/${roomId}/verify-passcode`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ passcode: savedPass })
          });
          if (verifyRes.ok) {
            verifiedPass = savedPass;
            setPasscodeLocked(false);
          } else {
            // Saved passcode is invalid
            localStorage.removeItem(`glowwave_passcode_${roomId}`);
            setPasscodeLocked(true);
            setLoading(false);
            return;
          }
        } else {
          // No saved passcode
          setPasscodeLocked(true);
          setLoading(false);
          return;
        }
      } else {
        setPasscodeLocked(false);
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('glowwave_last_joined_room_id', roomId);
        
        // Add to recent rooms list
        try {
          const recentRaw = localStorage.getItem('glowwave_recent_rooms');
          let recents = recentRaw ? JSON.parse(recentRaw) : [];
          recents = recents.filter((r: any) => r.roomId !== roomId);
          recents.unshift({
            roomId: roomId,
            role: 'audience',
            createdAt: new Date().toISOString()
          });
          localStorage.setItem('glowwave_recent_rooms', JSON.stringify(recents.slice(0, 50)));
        } catch (e) {
          console.error('Failed to update recent rooms list:', e);
        }
      }

      if (!isReconnect) {
        connectRealtime(roomId, verifiedPass);
        requestWakeLock();
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      if (isReconnect) {
        console.warn('[Room] Reconnect network check failed. Ignoring to let sockets/streams retry.');
        return;
      }
      setError('네트워크 상태를 확인해 주세요.');
      setLoading(false);
    }
  };

  const connectRealtime = (roomCode: string, validatedPasscode?: string) => {
    if (eventSourceRef.current) eventSourceRef.current.close();
    if (supabaseChannelRef.current && supabase) supabase.removeChannel(supabaseChannelRef.current);

    if (isSupabaseConfigured() && supabase) {
      console.log('[Room] Connecting to Supabase Realtime Channel');
      const channel = supabase.channel(`room_${roomCode}`, {
        config: {
          broadcast: { ack: false }
        }
      });

      channel
        .on('broadcast', { event: 'render' }, ({ payload }) => {
          console.log('[Room] Received broadcast payload:', payload);
          setCurrentPreset(payload);
        })
        .on('broadcast', { event: 'room_activated' }, () => {
          setIsRoomInactive(false);
          validateAndConnect(true);
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('[Room] Subscribed to Supabase channels');
            channel.track({ role: 'audience', uuid: audienceUuid, joined_at: new Date().toISOString() });
          }
        });
        
      supabaseChannelRef.current = channel;
    } else {
      console.log('[Room] Connecting to Local SSE Stream');
      const passParam = validatedPasscode ? `&passcode=${encodeURIComponent(validatedPasscode)}` : '';
      const eventSource = new EventSource(`/api/room/${roomCode}/stream?role=audience&uuid=${audienceUuid}${passParam}`);
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.event === 'init') {
            if (data.state) {
              setCurrentPreset(data.state);
            }
          } else if (data.event === 'render') {
            console.log('[Room] SSE render preset state:', data.payload);
            setCurrentPreset(data.payload);
          } else if (data.event === 'room_activated') {
            setIsRoomInactive(false);
            validateAndConnect(true);
          } else if (data.event === 'room_expired') {
            setError('이 방은 생성 후 24시간이 지나 만료되었습니다.');
            if (typeof window !== 'undefined') {
              localStorage.removeItem('glowwave_last_joined_room_id');
            }
            setLoading(false);
          }
        } catch (err) {
          console.error('[Room] SSE parse error:', err);
        }
      };

      eventSource.onerror = (err) => {
        console.error('[Room] SSE Connection closed/failed. Reconnecting...', err);
      };
    }
  };

  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        if (wakeLockRef.current) {
          console.log('[WakeLock] Already active, skipping request');
          return;
        }
        const lock = await (navigator as any).wakeLock.request('screen');
        lock.addEventListener('release', () => {
          console.log('[WakeLock] Released by browser/system');
          wakeLockRef.current = null;
        });
        wakeLockRef.current = lock;
        console.log('[WakeLock] Screen Wake Lock is active');
        setWakeLockError(false);
        setShowLowPowerToast(false);
      } catch (err: any) {
        console.warn(`[WakeLock] Failed to lock screen sleep: ${err.message}`);
        if (!wakeLockRef.current) {
          setWakeLockError(true);
          setShowLowPowerToast(true);
        }
      }
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        console.log('[WakeLock] Screen Wake Lock released');
      } catch (err: any) {
        console.error(err);
      }
    }
  };

  // Toast timer auto-dismissal
  useEffect(() => {
    if (showLowPowerToast) {
      const timer = setTimeout(() => {
        setShowLowPowerToast(false);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [showLowPowerToast]);

  // Robust interaction-based wake lock re-requesting
  useEffect(() => {
    const handleGesture = () => {
      requestWakeLock();
      if (videoRef.current) {
        videoRef.current.play().catch((err) => {
          console.warn('[WakeLock] iOS video sleep prevention loop playback blocked:', err);
        });
      }
    };
    window.addEventListener('click', handleGesture);
    window.addEventListener('touchstart', handleGesture);
    return () => {
      window.removeEventListener('click', handleGesture);
      window.removeEventListener('touchstart', handleGesture);
    };
  }, []);

  // Dynamically control html/body height and trigger automatic scroll force to push away mobile address bars
  useEffect(() => {
    const htmlEl = document.documentElement;
    const bodyEl = document.body;
    if (isForcedLandscape) {
      // 1. Stretch HTML/Body 0.5% larger than 100dvh to invite browser scrolling capability
      htmlEl.style.height = '100.5dvh';
      htmlEl.style.overflow = 'hidden';
      bodyEl.style.height = '100.5dvh';
      bodyEl.style.overflow = 'hidden';

      // 2. Perform automatic scroll force to slide away the mobile browser masked bottom bar immediately
      const forceScroll = () => {
        window.scrollTo(0, 150);
      };
      
      // Execute multiple times with micro-delays to survive mobile browser layout shifts
      forceScroll();
      const t1 = setTimeout(forceScroll, 50);
      const t2 = setTimeout(forceScroll, 200);
      const t3 = setTimeout(forceScroll, 500);

      // 3. Register touchmove interceptor to lock down the scrolled viewport position
      const handleTouchMove = (e: TouchEvent) => {
        if (e.touches.length > 1 || (e.target as HTMLElement).closest('.rotate-90-forced')) {
          e.preventDefault();
        }
        e.preventDefault();
      };
      document.addEventListener('touchmove', handleTouchMove, { passive: false });

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        document.removeEventListener('touchmove', handleTouchMove);
        htmlEl.style.height = '';
        htmlEl.style.overflow = '';
        bodyEl.style.height = '';
        bodyEl.style.overflow = '';
      };
    } else {
      htmlEl.style.height = '';
      htmlEl.style.overflow = '';
      bodyEl.style.height = '';
      bodyEl.style.overflow = '';
    }
  }, [isForcedLandscape]);

  useEffect(() => {
    if (audienceUuid) {
      validateAndConnect();
    }

    // 8-second interval polling for administrative status check (inactive lockout)
    const statusPoller = setInterval(async () => {
      if (!roomId) return;
      try {
        const response = await fetch(`/api/room/${roomId}/status`);
        if (response.ok) {
          const roomData = await response.json();
          setRoomStatus(roomData.status || 'active');
          if (roomData.status === 'pending') {
            setIsRoomInactive(true);
          } else {
            setIsRoomInactive(false);
          }
        }
      } catch (err) {
        console.warn('[Status Poller] Failed check:', err);
      }
    }, 8000);

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        await requestWakeLock();
        if (videoRef.current) {
          videoRef.current.play().catch(() => {});
        }
        if (roomId && audienceUuid) {
          const cachedPass = typeof window !== 'undefined' ? localStorage.getItem(`glowwave_passcode_${roomId}`) || '' : '';
          validateAndConnect(true);
          connectRealtime(roomId, cachedPass);
        }
      } else {
        releaseWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(statusPoller);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      releaseWakeLock();
      if (eventSourceRef.current) eventSourceRef.current.close();
      if (supabaseChannelRef.current && supabase) supabase.removeChannel(supabaseChannelRef.current);
    };
  }, [roomId, audienceUuid]);

  const handleViralClick = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('glowwave_referred_discount', 'true');
      document.cookie = "glowwave_referred_discount=true; max-age=604800; path=/";
      router.push('/');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#0B0B0F] flex items-center justify-center text-white z-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          <p className="text-sm font-semibold tracking-wider text-zinc-400">
            {
              {
                ko: '이벤트 전광판 동기화 중...',
                en: 'Syncing event signboard...',
                ja: 'イベント電光掲示板の同期中...',
                es: 'Sincronizando el letrero del evento...',
                'zh-TW': '活動電子看板同步中...',
                'zh-HK': '活動電子看板同步中...'
              }[activeLocale] || '이벤트 전광판 동기화 중...'
            }
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-[#0B0B0F] flex items-center justify-center px-6 text-center text-white z-50">
        <div className="glass-effect p-8 rounded-2xl max-w-sm border border-red-500/10">
          <WifiOff className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-white mb-2">{ROOM_TRANSLATIONS[activeLocale].err_title}</h2>
          <p className="text-sm text-zinc-400 mb-6">{error}</p>
          <button onClick={() => router.push('/')} className="w-full py-3 rounded-xl bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-all">
            {ROOM_TRANSLATIONS[activeLocale].err_back}
          </button>
        </div>
      </div>
    );
  }

  if (isHardCapped) {
    return (
      <div className="fixed inset-0 bg-[#0B0B0F] flex items-center justify-center px-6 text-center text-white z-50">
        <div className="glass-effect p-8 rounded-2xl max-w-sm border border-yellow-500/20">
          <Lock className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-lg font-extrabold text-white mb-2">{ROOM_TRANSLATIONS[activeLocale].cap_title}</h2>
          <p className="text-xs text-zinc-400 mb-6 leading-relaxed whitespace-pre-line">
            {ROOM_TRANSLATIONS[activeLocale].cap_desc}
          </p>
          <button onClick={() => router.push('/')} className="w-full py-3 rounded-xl bg-white/5 text-zinc-300 font-semibold text-xs hover:bg-white/10 transition-all">
            {ROOM_TRANSLATIONS[activeLocale].cap_btn}
          </button>
        </div>
      </div>
    );
  }

  if (roomStatus === 'inactive') {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#030305] flex flex-col items-center justify-center p-6 text-center select-none text-white">
        <div className="absolute top-[10%] left-[-10%] w-[40vw] h-[40vw] bg-red-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[20%] right-[-10%] w-[45vw] h-[45vw] bg-amber-600/5 rounded-full blur-[140px] pointer-events-none" />
        <div className="max-w-md w-full bg-[#0c0c14]/90 border border-red-500/20 backdrop-blur-2xl p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-6 relative z-10 animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 animate-pulse">
            <WifiOff className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-black uppercase tracking-wider">송출 차단된 전광판</h2>
            <p className="text-xs text-zinc-400 font-bold font-mono">ROOM ID: {roomId}</p>
          </div>
          <div className="p-4 bg-black/40 border border-white/5 rounded-2xl text-[11px] text-zinc-400 font-bold leading-relaxed text-left space-y-2.5">
            <p>🚨 본 전광판 방은 관리자 통제 정책에 의해 실시간 송출 및 제어가 **일시적으로 차단/정지**되었습니다.</p>
            <p>만료일이 초과되었거나 비정상 서비스 활동이 감지되었을 수 있습니다. 복구 및 재이용 문의는 아래 이메일로 접수해 주시기 바랍니다.</p>
          </div>
          <div className="text-[10px] text-zinc-500 font-black tracking-widest uppercase">
            SUPPORT EMAIL: support@glowwave.app
          </div>
        </div>
      </div>
    );
  }

  if (isRoomInactive) {
    return (
      <div className="fixed inset-0 bg-[#0B0B0F] flex items-center justify-center px-6 text-center text-white z-50">
        <div className="flex flex-col items-center gap-4 max-w-sm">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          <h2 className="text-lg font-bold text-white">{ROOM_TRANSLATIONS[activeLocale].inactive_title}</h2>
          <p className="text-xs text-zinc-500 leading-normal whitespace-pre-line">
            {ROOM_TRANSLATIONS[activeLocale].inactive_desc}
          </p>
        </div>
      </div>
    );
  }

  if (passcodeLocked) {
    return (
      <div className="fixed inset-0 bg-[#0B0B0F] flex items-center justify-center px-6 text-center text-white z-50">
        <form onSubmit={handlePasscodeSubmit} className="glass-effect p-8 rounded-3xl max-w-sm w-full border border-white/5 flex flex-col gap-6 bg-[#12121a]">
          <div className="flex flex-col gap-2">
            <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
              <Lock className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black text-white mt-2">{ROOM_TRANSLATIONS[activeLocale].pass_title}</h2>
            <p className="text-xs text-zinc-400 leading-relaxed font-semibold whitespace-pre-line">
              {ROOM_TRANSLATIONS[activeLocale].pass_desc}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <input
              type="password"
              pattern="[0-9]*"
              inputMode="numeric"
              value={enteredPasscode}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                if (val.length <= 6) {
                  setEnteredPasscode(val);
                  setPasscodeErrorMsg('');
                }
              }}
              placeholder={ROOM_TRANSLATIONS[activeLocale].pass_placeholder}
              className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3.5 text-center text-white tracking-widest text-base font-black focus:outline-none focus:border-indigo-500 uppercase font-mono"
              maxLength={6}
              disabled={passcodeChecking}
              autoFocus
            />
            {passcodeErrorMsg && (
              <p className="text-xs text-red-500 font-bold mt-1">{passcodeErrorMsg}</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="flex-1 py-3.5 rounded-xl bg-white/5 text-zinc-400 font-bold hover:bg-white/10 hover:text-white transition-all text-xs border border-white/5 cursor-pointer"
            >
              {ROOM_TRANSLATIONS[activeLocale].pass_btn_home}
            </button>
            <button
              type="submit"
              disabled={passcodeChecking || enteredPasscode.length < 4}
              className="flex-1 py-3.5 rounded-xl bg-white text-black font-extrabold text-xs hover:bg-zinc-200 transition-all disabled:opacity-50 cursor-pointer"
            >
              {passcodeChecking ? ROOM_TRANSLATIONS[activeLocale].pass_verifying : ROOM_TRANSLATIONS[activeLocale].pass_btn_enter}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Define a local reference to roomData if needed, but since roomData was block scoped in validateAndConnect, we use a fallback label.
  return (
    <div 
      ref={fullscreenRef} 
      className={`${
        isForcedLandscape 
          ? 'fixed inset-0 overflow-hidden bg-black' 
          : 'relative w-full min-h-[100dvh] overflow-x-hidden bg-[#0B0B0F]'
      } select-none cursor-none`}
      onClick={resetControlsTimer}
      onMouseMove={resetControlsTimer}
      onTouchStart={resetControlsTimer}
    >
      
      {/* Landscape forced Warning overlay */}
      {!isForcedLandscape && (
        <div className="absolute inset-0 w-full h-full bg-[#0B0B0F] flex flex-col justify-center items-center text-center px-6 text-white z-50 md:hidden portrait-overlay">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            router.push('/');
          }}
          className="absolute top-[calc(env(safe-area-inset-top,0px)+24px)] left-6 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[11px] font-extrabold text-zinc-300 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1.5 cursor-pointer z-50"
        >
          {
            {
              ko: '← 뒤로가기',
              en: '← Back',
              ja: '← 戻る',
              es: '← Volver',
              'zh-TW': '← 返回',
              'zh-HK': '← 返回'
            }[activeLocale] || '← 뒤로가기'
          }
        </button>
        <div className="relative mb-6">
          <Smartphone className="w-16 h-16 text-indigo-400 animate-pulse" />
          <RotateCw className="w-6 h-6 text-indigo-300 absolute -bottom-1 -right-1 animate-spin" style={{ animationDuration: '3s' }} />
        </div>
        <h2 className="text-xl font-black text-white mb-2">
          {
            {
              ko: '스마트폰을 가로로 돌려주세요',
              en: 'Please rotate your smartphone landscape',
              ja: 'スマートフォンを横向きにしてください',
              es: 'Por favor gire su teléfono horizontalmente',
              'zh-TW': '請將手機轉為橫向',
              'zh-HK': '請將手機轉為橫向'
            }[activeLocale] || '스마트폰을 가로로 돌려주세요'
          }
        </h2>
        <p className="text-xs text-zinc-500 leading-relaxed max-w-xs">
          {
            {
              ko: '빛의 방사 면적을 최대화하고 자막이 깨지지 않도록 하기 위해 가로 모드 회전이 필수입니다.',
              en: 'Landscape rotation is required to maximize emitting surface and prevent text clipping.',
              ja: '発光面積を最大化し、テキストの切れを防ぐために横向きでの回転が必須です。',
              es: 'Se requiere rotación horizontal para maximizar la luz y evitar el corte de texto.',
              'zh-TW': '為最大化發光面積並避免文字被切斷，必須旋轉為橫向模式。',
              'zh-HK': '為最大化發光面積並避免文字被切斷，必須旋轉為橫向模式。'
            }[activeLocale] || '빛의 방사 면적을 최대화하고 자막이 깨지지 않도록 하기 위해 가로 모드 회전이 필수입니다.'
          }
        </p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsForcedLandscape(true);
            setShowEnterOverlay(false);
          }}
          className="mt-5 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-xl shadow-indigo-600/40 border border-indigo-400 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
        >
          <RotateCw className="w-4 h-4 text-indigo-200 animate-spin-slow" />
          회전 잠금 해제 없이 즉시 가로로 사용
        </button>
      </div>
      )}

      {/* CSS style rule to enforce portrait overlay block */}
      <style jsx global>{`
        @media (orientation: landscape) {
          .portrait-overlay {
            display: none !important;
          }
        }
      `}</style>

      {/* Floating Control Toolbar */}
      <div className={`absolute top-[calc(env(safe-area-inset-top,0px)+24px)] left-6 z-40 flex flex-wrap items-center gap-2 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {isForcedLandscape && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsForcedLandscape(false);
              setShowEnterOverlay(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-red-600/90 border border-red-500 text-[10px] text-white hover:bg-red-700 transition-all font-bold cursor-pointer shadow-lg shadow-red-500/20 flex items-center gap-1 z-50"
          >
            <span>{
              {
                ko: '← 뒤로가기 (종료)',
                en: '← Back (Exit)',
                ja: '← 戻る (終了)',
                es: '← Volver (Salir)',
                'zh-TW': '← 返回 (退出)',
                'zh-HK': '← 返回 (退出)'
              }[activeLocale] || '← 뒤로가기 (종료)'
            }</span>
          </button>
        )}
        {!isStandalone && (
          !isIOS ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFullscreen();
              }}
              className="px-3.5 py-2 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 text-[10px] text-white/80 hover:text-white hover:bg-black/70 transition-all font-bold cursor-pointer"
            >
              {isFullscreen ? (
                {
                  ko: '화면 축소',
                  en: 'Exit Fullscreen',
                  ja: '全画面解除',
                  es: 'Salir de pantalla completa',
                  'zh-TW': '縮小畫面',
                  'zh-HK': '縮小畫面'
                }[activeLocale] || '화면 축소'
              ) : (
                {
                  ko: '전체화면 전환',
                  en: 'Full Screen',
                  ja: '全画面表示',
                  es: 'Pantalla completa',
                  'zh-TW': '全螢幕切換',
                  'zh-HK': '全螢幕切換'
                }[activeLocale] || '전체화면 전환'
              )}
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowSafariTip(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 text-[10px] text-white/80 hover:text-white hover:bg-black/70 transition-all font-bold cursor-pointer"
            >
              {
                {
                  ko: '아이폰 전체화면 가이드',
                  en: 'iPhone Full Screen Guide',
                  ja: 'iPhone全画面ガイド',
                  es: 'Guía de pantalla completa para iPhone',
                  'zh-TW': 'iPhone 全螢幕指南',
                  'zh-HK': 'iPhone 全螢幕指南'
                }[activeLocale] || '아이폰 전체화면 가이드'
              }
            </button>
          )
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsForcedLandscape(!isForcedLandscape);
          }}
          className={`px-3.5 py-2 rounded-xl backdrop-blur-md border text-[10px] transition-all font-bold cursor-pointer flex items-center gap-1.5 ${
            isForcedLandscape 
              ? 'bg-indigo-600/90 border-indigo-400 text-white shadow-lg shadow-indigo-500/30' 
              : 'bg-black/40 border-white/10 text-white/80 hover:text-white hover:bg-black/70'
          }`}
        >
          <RotateCw className="w-3 h-3 text-indigo-400 animate-spin-slow" />
          {isForcedLandscape ? '가로 고정 해제 (세로 복귀)' : '회전 잠금 해제 없이 즉시 가로로 사용'}
        </button>
        {wakeLockError && (
          <span className="px-3.5 py-2 rounded-xl bg-amber-500/20 backdrop-blur-md border border-amber-500/30 text-[9px] text-amber-300 font-extrabold flex items-center gap-1.5 select-none shadow-lg animate-pulse">
            {
              {
                ko: '⚠️ 저전력 모드로 인해 화면이 꺼질 수 있습니다.',
                en: '⚠️ Screen may turn off due to Low Power Mode.',
                ja: '⚠️ 低電力モードのため、画面が消える場合があります。',
                es: '⚠️ La pantalla puede apagarse debido al modo de bajo consumo.',
                'zh-TW': '⚠️ 因低電量模式，螢幕可能會自動關閉。',
                'zh-HK': '⚠️ 因低電量模式，螢幕可能會自動關閉。'
              }[activeLocale] || '⚠️ 저전력 모드로 인해 화면이 꺼질 수 있습니다.'
            }
          </span>
        )}
      </div>

      {/* iOS Safari/Chrome Home Screen Tooltip */}
      {showSafariTip && !isStandalone && showEnterOverlay && (
        <div className={`fixed top-[calc(env(safe-area-inset-top,0px)+24px)] left-6 right-6 md:left-auto md:w-80 bg-black/95 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-xs text-zinc-300 shadow-2xl z-50 animate-in fade-in slide-in-from-top-4 duration-200 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-indigo-400" />
              {ROOM_TRANSLATIONS[activeLocale].ready_ios_title}
            </span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowSafariTip(false);
              }} 
              className="text-zinc-500 hover:text-white font-bold font-mono text-sm px-1.5"
            >
              ×
            </button>
          </div>
          <p className="leading-relaxed mb-3 text-zinc-400 font-medium">
            {isChromeIOS 
              ? ROOM_TRANSLATIONS[activeLocale].ready_ios_desc_chrome 
              : ROOM_TRANSLATIONS[activeLocale].ready_ios_desc_safari
            }
          </p>
          <div className="bg-white/5 rounded-xl p-3 text-[10px] flex flex-col gap-2 text-zinc-400 leading-normal border border-white/5 font-medium">
            {isChromeIOS ? (
              <>
                <div>{ROOM_TRANSLATIONS[activeLocale].ready_ios_step1_chrome}</div>
                <div>{ROOM_TRANSLATIONS[activeLocale].ready_ios_step2}</div>
                <div>{ROOM_TRANSLATIONS[activeLocale].ready_ios_step3}</div>
              </>
            ) : (
              <>
                <div>{ROOM_TRANSLATIONS[activeLocale].ready_ios_step1_safari}</div>
                <div>{ROOM_TRANSLATIONS[activeLocale].ready_ios_step2}</div>
                <div>{ROOM_TRANSLATIONS[activeLocale].ready_ios_step3}</div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Main Display Screen */}
      <div 
        ref={containerRef}
        onDoubleClick={(e) => {
          if (isForcedLandscape) {
            e.stopPropagation();
            setIsForcedLandscape(false);
            setShowEnterOverlay(true);
          }
        }}
        className={`${
          isForcedLandscape ? 'rotate-90-forced fixed inset-0 z-10 w-full h-full' : 'w-full h-full relative'
        } flex items-center justify-center ${
          (isDuoSiren || currentPreset.effect === 'blink') ? '' : 'transition-colors duration-300'
        } ${
          isDuoSiren ? 'animate-siren' : currentPreset.effect === 'blink' ? 'animate-blink' : ''
        }`}
        style={{ 
          backgroundColor: currentPreset.blackout ? '#000000' : ((isLuckyDraw && !isWinner) ? '#0B0B0F' : (isDuoSiren ? undefined : currentPreset.bg_color)),
          border: (isLuckyDrawWait && !currentPreset.blackout) ? `8px solid ${currentPreset.bg_color_secondary || '#FFD700'}` : 'none',
          '--blink-duration': `${currentPreset.speed || 1000}ms`,
          '--siren-color-1': currentPreset.bg_color,
          '--siren-color-2': currentPreset.bg_color_secondary || '#FFD700'
        } as React.CSSProperties}
      >
        {/* Blackout Overlay to cover all texts, effects, and marquee */}
        {currentPreset.blackout && (
          <div className="absolute inset-0 bg-black z-50 pointer-events-none" />
        )}
        {/* Special Effects Particle Layer */}
        {currentPreset.special_effect && currentPreset.special_effect !== 'none' && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {specialEffectParticles.map((p) => {
              if (currentPreset.special_effect === 'hearts') {
                return (
                  <div
                    key={p.id}
                    className="animate-heart text-shadow-lg"
                    style={{
                      left: p.left,
                      fontSize: p.fontSize,
                      color: p.color,
                      animationName: 'float-heart, sway-heart',
                      animationDuration: `${p.duration}, ${p.sway}`,
                      animationTimingFunction: 'linear, ease-in-out',
                      animationIterationCount: 'infinite, infinite',
                      animationDelay: `${p.delay}, 0s`
                    } as React.CSSProperties}
                  >
                    ❤️
                  </div>
                );
              } else if (currentPreset.special_effect === 'confetti') {
                const shapes = ['🎉', '✨', '■', '●', '▲', '✦'];
                const shape = shapes[p.id % shapes.length];
                return (
                  <div
                    key={p.id}
                    className="animate-confetti"
                    style={{
                      left: p.left,
                      fontSize: p.fontSize,
                      color: p.color,
                      animationName: 'float-confetti, sway-confetti',
                      animationDuration: `${p.duration}, ${p.sway}`,
                      animationTimingFunction: 'linear, ease-in-out',
                      animationIterationCount: 'infinite, infinite',
                      animationDelay: `${p.delay}, 0s`
                    } as React.CSSProperties}
                  >
                    {shape}
                  </div>
                );
              } else if (currentPreset.special_effect === 'stars') {
                const starGlyphs = ['✦', '★', '🌟', '✧', '•'];
                const glyph = starGlyphs[p.id % starGlyphs.length];
                return (
                  <div
                    key={p.id}
                    className="animate-star"
                    style={{
                      left: p.left,
                      top: p.top,
                      fontSize: p.fontSize,
                      color: p.color,
                      animationName: 'twinkle-star',
                      animationDuration: p.duration,
                      animationTimingFunction: 'ease-in-out',
                      animationIterationCount: 'infinite',
                      animationDelay: p.delay
                    } as React.CSSProperties}
                  >
                    {glyph}
                  </div>
                );
              }
              return null;
            })}
          </div>
        )}

        {currentPreset.effect === 'marquee' ? (
          <div key={currentPreset.trigger_id} className="w-full max-h-full overflow-hidden flex items-center whitespace-nowrap relative z-10 py-1">
            {/* Track 1 */}
            <div 
              className={`animate-marquee-seamless select-none leading-[1.2] flex shrink-0 gap-[4rem] pr-[4rem] ${getFontFamilyClass(currentPreset.font_family)}`}
              style={{ 
                color: currentPreset.text_color,
                fontSize,
                '--marquee-duration': `${currentPreset.speed || 6000}ms`
              } as React.CSSProperties}
            >
              <span>{displayText}</span>
              <span>{displayText}</span>
              <span>{displayText}</span>
              <span>{displayText}</span>
            </div>
            {/* Track 2 */}
            <div 
              className={`animate-marquee-seamless select-none leading-[1.2] flex shrink-0 gap-[4rem] pr-[4rem] ${getFontFamilyClass(currentPreset.font_family)}`}
              style={{ 
                color: currentPreset.text_color,
                fontSize,
                '--marquee-duration': `${currentPreset.speed || 6000}ms`
              } as React.CSSProperties}
              aria-hidden="true"
            >
              <span>{displayText}</span>
              <span>{displayText}</span>
              <span>{displayText}</span>
              <span>{displayText}</span>
            </div>
          </div>
        ) : (
          <div 
            className={`text-center whitespace-nowrap px-8 select-none max-w-full leading-[1.2] tracking-tighter relative z-10 ${getFontFamilyClass(currentPreset.font_family)}`}
            style={{ 
              color: currentPreset.text_color,
              fontSize,
              zIndex: 10,
              animation: isLuckyDrawWait ? 'preset-card-pulse 1.2s ease-in-out infinite' : undefined
            }}
          >
            {displayText}
          </div>
        )}

        {/* Floating high-tension warning overlay on Waiting */}
        {isLuckyDrawWait && (
          <div className="absolute top-[20%] text-center text-xs tracking-widest text-[#FFD700] uppercase font-bold font-outfit animate-pulse">
            R A F F L E &nbsp; I N &nbsp; P R O G R E S S
          </div>
        )}

        {/* Viral Referral Watermark Link Layer */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            handleViralClick();
          }}
          className={`absolute bottom-6 right-6 px-3.5 py-1.5 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 text-[10px] text-white/50 hover:text-white hover:bg-black/70 hover:scale-105 active:scale-95 transition-all z-40 cursor-pointer flex items-center gap-1 font-semibold duration-500 ${
            showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
        >
          <span>나만의 전광판 만들기(무료)</span>
        </button>

      </div>

      {/* Initial entry user activation overlay */}
      {showEnterOverlay && (
        <div className={`fixed inset-0 bg-[#030305] z-50 flex flex-col justify-center items-center text-center px-6 text-white bg-grid-pattern relative overflow-hidden ${
          !isForcedLandscape ? 'hidden md:flex' : ''
        }`}>
          {/* Background Aura Spheres */}
          <div className="absolute top-[20%] left-[-15%] w-[60vw] h-[60vw] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse z-0 pointer-events-none" style={{ animationDuration: '6s' }} />
          <div className="absolute bottom-[20%] right-[-15%] w-[50vw] h-[50vw] bg-purple-500/10 blur-[120px] rounded-full animate-pulse z-0 pointer-events-none" style={{ animationDuration: '8s' }} />
          
          <div className="relative z-10 flex flex-col justify-center items-center">
          
          <div className="relative mb-6">
            <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center font-bold text-white text-lg">GW</div>
          </div>
          
          <h2 className="text-xl font-black text-white mb-2">전광판 동기화 준비 완료</h2>
          
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-[10px] text-amber-300 leading-normal max-w-xs text-left mb-6 font-semibold flex items-start gap-1.5 z-10 animate-in fade-in duration-200">
            <span className="shrink-0 mt-0.5">⚠️</span>
            <span>스마트폰의 <b>[저전력 모드]</b>가 켜져 있으면 화면 꺼짐 방지가 정상 작동하지 않습니다. 원활한 연출을 위해 저전력 모드를 해제해 주세요.</span>
          </div>
          
          {isIOSUserAndNotStandalone ? (
            <div className="glass-effect p-6 rounded-2xl max-w-sm border border-white/5 bg-[#12121a] mb-6 flex flex-col gap-4 text-left font-sans">
              <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                <Smartphone className="w-4.5 h-4.5" />
                <h3 className="font-bold text-xs text-white">아이폰(iOS) 전체화면 설정 권장</h3>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">
                {isChromeIOS 
                  ? '아이폰 크롬 브라우저는 주소창과 메뉴바를 숨길 수 없어 일반 브라우저로 접속 시 전광판이 잘려 보입니다. 아래 순서대로 홈 화면에 추가하여 실행하시면 완벽한 전체화면 앱으로 이용 가능합니다.'
                  : '아이폰 사파리 브라우저는 주소창과 메뉴바를 숨길 수 없어 일반 브라우저로 접속 시 전광판이 잘려 보입니다. 아래 순서대로 홈 화면에 추가하여 실행하시면 완벽한 전체화면 앱으로 이용 가능합니다.'
                }
              </p>
              <div className="bg-white/5 rounded-xl p-3 text-[10px] flex flex-col gap-2 text-zinc-300 leading-normal border border-white/5 font-medium">
                {isChromeIOS ? (
                  <>
                    <div className="flex gap-1.5">
                      <span className="text-zinc-500 font-bold">1.</span>
                      <span>크롬 화면의 <b>[공유 버튼]</b>(우측 상단 주소창 옆 또는 하단 메뉴의 공유 아이콘)을 클릭합니다.</span>
                    </div>
                    <div className="flex gap-1.5 border-t border-white/5 pt-1.5">
                      <span className="text-zinc-500 font-bold">2.</span>
                      <span>메뉴 목록 중 <b>[홈 화면에 추가]</b>를 선택합니다.</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex gap-1.5">
                      <span className="text-zinc-500 font-bold">1.</span>
                      <span>사파리 화면 하단 중앙의 <b>[공유 버튼]</b>(네모에 위 화살표 모양)을 클릭합니다.</span>
                    </div>
                    <div className="flex gap-1.5 border-t border-white/5 pt-1.5">
                      <span className="text-zinc-500 font-bold">2.</span>
                      <span>메뉴 목록 중 <b>[홈 화면에 추가]</b>를 선택합니다.</span>
                    </div>
                  </>
                )}
                <div className="flex gap-1.5 border-t border-white/5 pt-1.5">
                  <span className="text-zinc-500 font-bold">3.</span>
                  <span>바탕화면에 생성된 <b>GlowWave 아이콘</b>으로 재접속해 주세요.</span>
                </div>
              </div>
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 text-[9px] text-indigo-300 leading-normal font-bold">
                💡 이미 홈 화면에 GlowWave 앱을 추가하셨다면, 홈 화면에서 앱을 직접 실행하시고 입장 코드 <span className="text-white font-mono bg-white/10 px-1 rounded">{roomId}</span>를 입력하여 참여하시는 것이 가장 편리합니다!
              </div>
              <p className="text-[9px] text-zinc-500 text-center font-medium">
                ※ 홈 화면에 추가하지 않고 그냥 브라우저로 이용하려면 아래 버튼을 누르세요.
              </p>
            </div>
          ) : (
            <p className="text-xs text-zinc-500 leading-relaxed max-w-xs mb-8">
              아래 [입장하기] 버튼을 누르면 전광판 화면이 시작되며 가로 전체화면 모드 및 화면 켜짐 유지가 실행됩니다.
            </p>
          )}
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowEnterOverlay(false);
              toggleFullscreen();
              requestWakeLock();
              if (videoRef.current) {
                videoRef.current.play().catch((err) => {
                  console.warn('[WakeLock] Entry click video playback blocked:', err);
                });
              }
              resetControlsTimer();
            }}
            className="px-8 py-4 rounded-xl bg-white text-black font-extrabold text-sm hover:bg-zinc-200 transition-all shadow-xl hover:shadow-white/10 flex items-center gap-1.5 cursor-pointer"
          >
            입장하기
          </button>
        </div>
      </div>
      )}

      {/* Floating Low Power Mode Warning Toast */}
      {showLowPowerToast && (
        <div className="fixed top-[calc(env(safe-area-inset-top,0px)+16px)] left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm bg-amber-500/10 backdrop-blur-md border border-amber-500/20 rounded-2xl p-4 shadow-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="p-1 rounded-lg bg-amber-500/20 text-amber-300 shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1 text-left">
            <h4 className="text-xs font-bold text-amber-300">화면 꺼짐 안내</h4>
            <p className="text-[10px] text-zinc-300 font-medium leading-relaxed mt-0.5">
              기기의 <strong>저전력 모드</strong>가 켜져 있으면 화면이 꺼질 수 있습니다. 꺼짐 방지를 위해 설정을 해제해 주세요.
            </p>
          </div>
          <button 
            onClick={() => setShowLowPowerToast(false)}
            className="text-zinc-500 hover:text-white font-bold text-xs p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Invisible silent video loop to force-keep iOS devices awake */}
      <video
        ref={videoRef}
        playsInline
        muted
        loop
        style={{ position: 'fixed', opacity: 0.001, pointerEvents: 'none', width: '4px', height: '4px', left: '0px', bottom: '0px', zIndex: -100 }}
        src="data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAr9tZGF0AAACoAYF//+///AAAAMmF2Y0MBZAAK/+EAGWdkAAqs2V+WXAWyAAADAAIAAAMAYB4kSywBAAZo6+PLIsAAAAAYc3R0cwAAAAAAAAABAAAAAQAAAgAAAAAcc3RzYwAAAAAAAAABAAAAAQAAAAEAAAABAAAAFHN0c3oAAAAAAAACtwAAAAEAAAAUc3RjbwAAAAAAAAABAAAAMAAAAGJ1ZHRhAAAAWm1ldGEAAAAAAAAAIWhkbHIAAAAAAAAAAG1kaXJhcHBsAAAAAAAAAAAAAAAALWlsc3QAAAAlqXRvbwAAAB1kYXRhAAAAAQAAAABMYXZmNTQuNjMuMTA0"
      />
    </div>
  );
}
