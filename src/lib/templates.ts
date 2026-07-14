import { Preset } from './types';
import { Locale } from './translations';

export interface TemplateCategory {
  id: 'anniversary' | 'busking' | 'sports' | 'party' | 'store';
  label: string;
  icon: string;
  presets: Preset[];
}

export const getDefaultsByLocale = (locale: Locale): Preset[] => {
  switch (locale) {
    case 'en':
      return [
        { bg_color: '#0B0B0F', text: 'Solid Color', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thin', font_size: 100, locale: 'en' },
        { bg_color: '#3B82F6', text: 'Soft Blink', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'sans-thin', font_size: 100, locale: 'en' },
        { bg_color: '#FFFFFF', text: 'Psychedelic', text_color: '#EF4444', effect: 'blink', speed: 1921, bg_color_secondary: '#0B0B0F', font_family: 'sans-thin', font_size: 100, locale: 'en' },
        { bg_color: '#0B0B0F', text: 'Winner!', text_color: '#FFD700', effect: 'luckydraw_wait', speed: 1921, bg_color_secondary: '#FFD700', result_text: 'Good luck next time!', font_family: 'sans-thin', font_size: 100, lucky_draw_count: 1, locale: 'en' },
        { bg_color: '#F97316', text: 'Scroll', text_color: '#FFFFFF', effect: 'marquee', speed: 30061, font_family: 'sans-thin', font_size: 100, locale: 'en' },
        { bg_color: '#8B5CF6', text: 'Countdown', text_color: '#FFFFFF', effect: 'countdown', speed: 1000, countdown_seconds: 5, result_text: 'START', font_family: 'sans-thin', font_size: 100, locale: 'en' }
      ];
    case 'ja':
      return [
        { bg_color: '#0B0B0F', text: '単色', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thin', font_size: 100, locale: 'ja' },
        { bg_color: '#3B82F6', text: 'ゆっくり点滅', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'sans-thin', font_size: 100, locale: 'ja' },
        { bg_color: '#FFFFFF', text: 'サイケデリック', text_color: '#EF4444', effect: 'blink', speed: 1921, bg_color_secondary: '#0B0B0F', font_family: 'sans-thin', font_size: 100, locale: 'ja' },
        { bg_color: '#0B0B0F', text: 'アタリ！', text_color: '#FFD700', effect: 'luckydraw_wait', speed: 1921, bg_color_secondary: '#FFD700', result_text: '残念！また今度ね..', font_family: 'sans-thin', font_size: 100, lucky_draw_count: 1, locale: 'ja' },
        { bg_color: '#F97316', text: 'スクロール', text_color: '#FFFFFF', effect: 'marquee', speed: 30061, font_family: 'sans-thin', font_size: 100, locale: 'ja' },
        { bg_color: '#8B5CF6', text: 'カウントダウン', text_color: '#FFFFFF', effect: 'countdown', speed: 1000, countdown_seconds: 5, result_text: 'スタート', font_family: 'sans-thin', font_size: 100, locale: 'ja' }
      ];
    case 'es':
      return [
        { bg_color: '#0B0B0F', text: 'Color Sólido', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thin', font_size: 100, locale: 'es' },
        { bg_color: '#3B82F6', text: 'Parpadeo Suave', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'sans-thin', font_size: 100, locale: 'es' },
        { bg_color: '#FFFFFF', text: '¡A BAILAR!', text_color: '#EF4444', effect: 'blink', speed: 1921, bg_color_secondary: '#0B0B0F', font_family: 'sans-thin', font_size: 100, locale: 'es' },
        { bg_color: '#0B0B0F', text: '¡GANADOR!', text_color: '#FFD700', effect: 'luckydraw_wait', speed: 1921, bg_color_secondary: '#FFD700', result_text: '¡Suerte la próxima!', font_family: 'sans-thin', font_size: 100, lucky_draw_count: 1, locale: 'es' },
        { bg_color: '#F97316', text: 'Desplazar', text_color: '#FFFFFF', effect: 'marquee', speed: 30061, font_family: 'sans-thin', font_size: 100, locale: 'es' },
        { bg_color: '#8B5CF6', text: 'Cuenta Atrás', text_color: '#FFFFFF', effect: 'countdown', speed: 1000, countdown_seconds: 5, result_text: '¡EMPEZAR!', font_family: 'sans-thin', font_size: 100, locale: 'es' }
      ];
    case 'zh-TW':
      return [
        { bg_color: '#0B0B0F', text: '單色', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thin', font_size: 100, locale: 'zh-TW' },
        { bg_color: '#3B82F6', text: '呼吸閃爍', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'sans-thin', font_size: 100, locale: 'zh-TW' },
        { bg_color: '#FFFFFF', text: '狂歡霓虹', text_color: '#EF4444', effect: 'blink', speed: 1921, bg_color_secondary: '#0B0B0F', font_family: 'sans-thin', font_size: 100, locale: 'zh-TW' },
        { bg_color: '#0B0B0F', text: '中獎！', text_color: '#FFD700', effect: 'luckydraw_wait', speed: 1921, bg_color_secondary: '#FFD700', result_text: '沒中，再接再厲！', font_family: 'sans-thin', font_size: 100, lucky_draw_count: 1, locale: 'zh-TW' },
        { bg_color: '#F97316', text: '滾動跑馬燈', text_color: '#FFFFFF', effect: 'marquee', speed: 30061, font_family: 'sans-thin', font_size: 100, locale: 'zh-TW' },
        { bg_color: '#8B5CF6', text: '倒數計時', text_color: '#FFFFFF', effect: 'countdown', speed: 1000, countdown_seconds: 5, result_text: '開始', font_family: 'sans-thin', font_size: 100, locale: 'zh-TW' }
      ];
    case 'zh-HK':
      return [
        { bg_color: '#0B0B0F', text: '單色', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thin', font_size: 100, locale: 'zh-HK' },
        { bg_color: '#3B82F6', text: '呼吸閃爍', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'sans-thin', font_size: 100, locale: 'zh-HK' },
        { bg_color: '#FFFFFF', text: '狂歡霓虹', text_color: '#EF4444', effect: 'blink', speed: 1921, bg_color_secondary: '#0B0B0F', font_family: 'sans-thin', font_size: 100, locale: 'zh-HK' },
        { bg_color: '#0B0B0F', text: '中獎！', text_color: '#FFD700', effect: 'luckydraw_wait', speed: 1921, bg_color_secondary: '#FFD700', result_text: '冇中，下次好運！', font_family: 'sans-thin', font_size: 100, lucky_draw_count: 1, locale: 'zh-HK' },
        { bg_color: '#F97316', text: '滾動跑馬燈', text_color: '#FFFFFF', effect: 'marquee', speed: 30061, font_family: 'sans-thin', font_size: 100, locale: 'zh-HK' },
        { bg_color: '#8B5CF6', text: '倒數計時', text_color: '#FFFFFF', effect: 'countdown', speed: 1000, countdown_seconds: 5, result_text: '開始', font_family: 'sans-thin', font_size: 100, locale: 'zh-HK' }
      ];
    default:
      return [
        { bg_color: '#0B0B0F', text: '단색', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thin', font_size: 100, locale: 'ko' },
        { bg_color: '#3B82F6', text: '부드러운 깜빡이', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'sans-thin', font_size: 100, locale: 'ko' },
        { bg_color: '#FFFFFF', text: '사이키', text_color: '#EF4444', effect: 'blink', speed: 1921, bg_color_secondary: '#0B0B0F', font_family: 'sans-thin', font_size: 100, locale: 'ko' },
        { bg_color: '#0B0B0F', text: '당첨!', text_color: '#FFD700', effect: 'luckydraw_wait', speed: 1921, bg_color_secondary: '#FFD700', result_text: '아쉽네요! 다음 기회에..', font_family: 'sans-thin', font_size: 100, lucky_draw_count: 1, locale: 'ko' },
        { bg_color: '#F97316', text: '스크롤', text_color: '#FFFFFF', effect: 'marquee', speed: 30061, font_family: 'sans-thin', font_size: 100, locale: 'ko' },
        { bg_color: '#8B5CF6', text: '카운트다운', text_color: '#FFFFFF', effect: 'countdown', speed: 1000, countdown_seconds: 5, result_text: 'START', font_family: 'sans-thin', font_size: 100, locale: 'ko' }
      ];
  }
};

export const defaults: Preset[] = getDefaultsByLocale('ko');

export const LOCALIZED_TEMPLATES: Record<Locale, TemplateCategory[]> = {
  ko: [
    {
      id: 'anniversary',
      label: '기념일/이벤트',
      icon: '',
      presets: [
        { bg_color: '#DB2777', text: '생일 축하해 🎂', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'ko' },
        { bg_color: '#DB2777', text: 'Happy Birthday', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'ko' },
        { bg_color: '#4C1D95', text: '오늘의 주인공은 너야 👑', text_color: '#FDE047', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'ko' },
        { bg_color: '#FCE7F3', text: '태어나줘서 고마워 💖', text_color: '#BE185D', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'hearts', locale: 'ko' },
        { bg_color: '#2E1065', text: '청춘은 60부터! 화이팅 🌸', text_color: '#FDE047', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'stars', locale: 'ko' },
        { bg_color: '#FFE4E6', text: '울엄마 환갑을 축하해요 💐', text_color: '#E11D48', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'hearts', locale: 'ko' },
        { bg_color: '#1E3A8A', text: '세상 최고 멋진 아빠 칠순 🎉', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'sans-thick', font_size: 100, special_effect: 'confetti', locale: 'ko' },
        { bg_color: '#FFFBEB', text: '첫돌을 축하합니다 👶', text_color: '#B45309', effect: 'none', speed: 1000, font_family: 'plump', font_size: 100, special_effect: 'stars', locale: 'ko' },
        { bg_color: '#000000', text: '나랑 결혼해줄래? 💍', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'hearts', locale: 'ko' },
        { bg_color: '#1E1B4B', text: 'Marry Me? 👰❤️🤵', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'hearts', locale: 'ko' },
        { bg_color: '#FCE7F3', text: 'Bridal Shower 🥂', text_color: '#BE185D', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'hearts', locale: 'ko' },
        { bg_color: '#000000', text: '꽃길만 걷자 우리 공주 👑', text_color: '#F59E0B', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'stars', locale: 'ko' },
        { bg_color: '#0B0B0F', text: '친구야 결혼 너무 축하해 💐', text_color: '#FFFFFF', effect: 'marquee', speed: 30061, font_family: 'sans-thick', font_size: 100, special_effect: 'confetti', locale: 'ko' },
        { bg_color: '#FFE4E6', text: '세상에서 제일 예쁜 신부 👰', text_color: '#BE185D', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'hearts', locale: 'ko' },
        { bg_color: '#064E3B', text: '전역 축하해! 꽃길만 걷자 🌸', text_color: '#FDE047', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'ko' },
        { bg_color: '#000000', text: '민간인 봉인 해제 🕊', text_color: '#FFFFFF', effect: 'marquee', speed: 30061, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'ko' },
        { bg_color: '#1E3A8A', text: '졸업 축하해! 새로운 시작 🎓', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'sans-thick', font_size: 100, special_effect: 'confetti', locale: 'ko' },
        { bg_color: '#B91C1C', text: '수능 대박! 다 잘될거야 💯', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'ko' },
        { bg_color: '#0F172A', text: '취뽀 성공! 출근 화이팅 🚀', text_color: '#38BDF8', effect: 'marquee', speed: 30061, font_family: 'plump', font_size: 100, special_effect: 'stars', locale: 'ko' },
        { bg_color: '#1E1B4B', text: '축 승진! 탄탄대로 걸어요 🎉', text_color: '#F59E0B', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'confetti', locale: 'ko' },
        { bg_color: '#FFE4E6', text: '고생하셨습니다! 응원해요 👏', text_color: '#BE185D', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'hearts', locale: 'ko' },
        { bg_color: '#E11D48', text: '엄마 아빠 사랑해요 💕', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'hearts', locale: 'ko' },
        { bg_color: '#F43F5E', text: '우리 결혼합니다 🤵👰', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'hearts', locale: 'ko' },
        { bg_color: '#9333EA', text: '프로포즈 대성공! 💍', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'hearts', locale: 'ko' },
        { bg_color: '#BE185D', text: '결혼 10주년 축하해 💕', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'hearts', locale: 'ko' }
      ]
    },
    {
      id: 'busking',
      label: '공연/버스킹',
      icon: '',
      presets: [
        { bg_color: '#DB2777', text: '앵콜 한 번 더 🎤', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'ko' },
        { bg_color: '#F59E0B', text: '오늘 무대 최고! 🔥', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'ko' },
        { bg_color: '#1E1B4B', text: '귀호강 고막 힐링 🎧', text_color: '#00FFFF', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'stars', locale: 'ko' },
        { bg_color: '#000000', text: '평생 네 편이야 💖', text_color: '#EC4899', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'hearts', locale: 'ko' },
        { bg_color: '#312E81', text: '빛나는 너를 응원해 ✨', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'ko' },
        { bg_color: '#000000', text: '나의 가수라서 자랑스러워 🎤', text_color: '#FDE047', effect: 'marquee', speed: 30061, font_family: 'serif', font_size: 100, special_effect: 'stars', locale: 'ko' },
        { bg_color: '#0B0B0F', text: '목소리에 녹는다 녹아 🥰', text_color: '#F472B6', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'hearts', locale: 'ko' },
        { bg_color: '#1E2937', text: '노래 제목이 궁금해요 🎤❓', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'ko' },
        { bg_color: '#4F46E5', text: '인스타: @glowwave 📱', text_color: '#FFFFFF', effect: 'marquee', speed: 30061, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'ko' },
        { bg_color: '#065F46', text: '신청곡 받습니다 📝', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'ko' },
        { bg_color: '#0B0B0F', text: '음악이 좋았다면 팁박스로 💰', text_color: '#22C55E', effect: 'marquee', speed: 30061, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'ko' },
        { bg_color: '#E11D48', text: '실물 깡패 비주얼 깡패 😍', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'hearts', locale: 'ko' },
        { bg_color: '#1E1B4B', text: '음원 발매! 스트리밍 고고 🎧', text_color: '#00FFFF', effect: 'marquee', speed: 30061, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'ko' },
        { bg_color: '#4F46E5', text: '팬클럽 가입 환영 🌟', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'ko' }
      ]
    },
    {
      id: 'sports',
      label: '스포츠/응원',
      icon: '',
      presets: [
        { bg_color: '#EF4444', text: '대~한민국! ⚽', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'sans-thick', font_size: 100, special_effect: 'confetti', locale: 'ko' },
        { bg_color: '#000000', text: '오~ 필승 코리아! 🏆', text_color: '#EF4444', effect: 'blink', speed: 1921, font_family: 'sans-thick', font_size: 100, special_effect: 'confetti', locale: 'ko' },
        { bg_color: '#1E3A8A', text: '날려라~ 홈런! ⚾', text_color: '#FDE047', effect: 'marquee', speed: 30061, font_family: 'plump', font_size: 100, special_effect: 'stars', locale: 'ko' },
        { bg_color: '#22C55E', text: '골이다!! GOAL!!! 🥅', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'ko' },
        { bg_color: '#B91C1C', text: '끝까지 포기하지 마! 🔥', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'ko' },
        { bg_color: '#A30027', text: '최강 기아! 🐯', text_color: '#FFC72C', effect: 'blink', speed: 1921, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'ko' },
        { bg_color: '#7A0026', text: '무적 LG! ⚾', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'ko' },
        { bg_color: '#FF6600', text: '최강 한화! 🧡', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'ko' },
        { bg_color: '#0B0B0F', text: '오늘 MVP는 바로 너 🌟', text_color: '#F59E0B', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'ko' },
        { bg_color: '#1E2937', text: '삼진 아웃 잡으러 가자! ⚡', text_color: '#00FFFF', effect: 'blink', speed: 1921, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'ko' },
        { bg_color: '#A30027', text: '끝내기 안타!! ⚾', text_color: '#FFC72C', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'ko' },
        { bg_color: '#15803D', text: '할 수 있다! 포기 금지 ✊', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'ko' },
        { bg_color: '#1E3A8A', text: '전설의 12번째 선수 ⚽', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'ko' }
      ]
    },
    {
      id: 'party',
      label: '페스티벌/파티',
      icon: '',
      presets: [
        { bg_color: '#7C3AED', text: 'DANCE TIME ⚡', text_color: '#00FFCC', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'ko' },
        { bg_color: '#DB2777', text: '소리 질러~!! 🙌', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'ko' },
        { bg_color: '#EF4444', text: '오늘 밤새 달리자 🔥', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'sans-thick', font_size: 100, special_effect: 'confetti', locale: 'ko' },
        { bg_color: '#F97316', text: '텐션 올려~! 🚀', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'sans-thick', font_size: 100, special_effect: 'confetti', locale: 'ko' },
        { bg_color: '#0B0B0F', text: 'PARTY TONIGHT 🎉', text_color: '#FFFFFF', effect: 'marquee', speed: 30061, font_family: 'plump', font_size: 100, special_effect: 'stars', locale: 'ko' },
        { bg_color: '#D97706', text: '골든벨 울릴 사람? 🔔', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'sans-thick', font_size: 100, special_effect: 'confetti', locale: 'ko' },
        { bg_color: '#B45309', text: '원샷! 원샷! 🍻', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'none', locale: 'ko' },
        { bg_color: '#0B0B0F', text: '오늘 집 안 간다 🏠❌', text_color: '#EF4444', effect: 'marquee', speed: 30061, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'ko' },
        { bg_color: '#F97316', text: 'HALLOWEEN 🎉🎃', text_color: '#000000', effect: 'blink', speed: 1921, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'ko' },
        { bg_color: '#0F5132', text: 'MERRY X-MAS 🎄', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'serif', font_size: 100, special_effect: 'confetti', locale: 'ko' },
        { bg_color: '#7F1D1D', text: '새해 복 많이 받으세요 🌅', text_color: '#FDE047', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'ko' },
        { bg_color: '#7C3AED', text: '흔들어~ 흔들어! 🕺', text_color: '#00FFCC', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'ko' },
        { bg_color: '#DB2777', text: '오늘 생일인 사람 소리질러!! 🎂', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'ko' },
        { bg_color: '#0B0B0F', text: '취하지 않는 밤 🍻', text_color: '#FDE047', effect: 'marquee', speed: 30061, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'ko' }
      ]
    },
    {
      id: 'store',
      label: '매장/안내',
      icon: '',
      presets: [
        { bg_color: '#064E3B', text: '영업중 OPEN ☕', text_color: '#FDE047', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'ko' },
        { bg_color: '#0F172A', text: '문 열었습니다 들어오세요 🚪', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'ko' },
        { bg_color: '#7F1D1D', text: '재료 소진 CLOSE 🌙', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'ko' },
        { bg_color: '#EF4444', text: '오늘만 1+1 행사! 🛍', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'ko' },
        { bg_color: '#451A03', text: '아메리카노 2,000원 ☕', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'ko' },
        { bg_color: '#1E2937', text: 'WIFI: GLOW_WAVE 📶', text_color: '#FFFFFF', effect: 'marquee', speed: 30061, font_family: 'sans-thin', font_size: 100, special_effect: 'none', locale: 'ko' },
        { bg_color: '#1E3A8A', text: '주문은 여기서 해주세요 🔔', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'ko' },
        { bg_color: '#C2410C', text: '이곳에 대기해 주세요 🚶', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'ko' },
        { bg_color: '#451A03', text: '테이크아웃 10% 할인 🥤', text_color: '#FDE047', effect: 'marquee', speed: 30061, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'ko' },
        { bg_color: '#000000', text: '외부 음식 반입 금지 🚫', text_color: '#EF4444', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'ko' },
        { bg_color: '#1E2937', text: '잠시 준비 중입니다 ⏳', text_color: '#F59E0B', effect: 'none', speed: 1000, font_family: 'sans-thin', font_size: 100, special_effect: 'none', locale: 'ko' },
        { bg_color: '#0D9488', text: '신메뉴 출시! 드셔보세요 🌟', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'ko' },
        { bg_color: '#1E2937', text: '주차 등록은 결제시 말씀해주세요 🚗', text_color: '#FFFFFF', effect: 'marquee', speed: 30061, font_family: 'sans-thin', font_size: 100, special_effect: 'none', locale: 'ko' },
        { bg_color: '#7F1D1D', text: '노키즈존 No Kids Zone 🚼', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'ko' }
      ]
    }
  ],
  en: [
    {
      id: 'anniversary',
      label: 'Wedding & Events',
      icon: '',
      presets: [
        { bg_color: '#DB2777', text: 'Just Married 🥂', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'en' },
        { bg_color: '#DB2777', text: 'Happy Birthday! 🎂', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'en' },
        { bg_color: '#DB2777', text: 'Congratulations! 🎉', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'en' },
        { bg_color: '#4C1D95', text: 'Today is your day 👑', text_color: '#FDE047', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'en' },
        { bg_color: '#4C1D95', text: 'Here Comes the Bride 👰', text_color: '#FDE047', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'en' },
        { bg_color: '#FCE7F3', text: 'Happily Ever After 💖', text_color: '#BE185D', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'hearts', locale: 'en' },
        { bg_color: '#FCE7F3', text: 'Bride & Groom 🤵👰', text_color: '#BE185D', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'hearts', locale: 'en' },
        { bg_color: '#FFE4E6', text: 'Cheers to Love 🥂', text_color: '#E11D48', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'hearts', locale: 'en' },
        { bg_color: '#000000', text: 'Marry Me? 💍', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'hearts', locale: 'en' },
        { bg_color: '#FCE7F3', text: 'Bridal Shower 🥂', text_color: '#BE185D', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'hearts', locale: 'en' },
        { bg_color: '#1E3A8A', text: 'Best Night Ever 💫', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'sans-thick', font_size: 100, special_effect: 'confetti', locale: 'en' },
        { bg_color: '#1E3A8A', text: 'Happy Graduation! 🎓', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'sans-thick', font_size: 100, special_effect: 'confetti', locale: 'en' },
        { bg_color: '#0F172A', text: 'Class of 2026 🎓', text_color: '#38BDF8', effect: 'none', speed: 1000, font_family: 'plump', font_size: 100, special_effect: 'stars', locale: 'en' },
        { bg_color: '#1E1B4B', text: 'You Did It! 🚀', text_color: '#F59E0B', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'confetti', locale: 'en' },
        { bg_color: '#FFE4E6', text: 'Best Couple Ever 💑', text_color: '#BE185D', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'hearts', locale: 'en' },
        { bg_color: '#2E1065', text: 'Happy Anniversary 🥂', text_color: '#FDE047', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'stars', locale: 'en' },
        { bg_color: '#DB2777', text: 'She Said Yes! 💍', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'hearts', locale: 'en' },
        { bg_color: '#DB2777', text: 'Happy Anniversary! 🥂', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'stars', locale: 'en' },
        { bg_color: '#9333EA', text: 'Will You Marry Me? 💍', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'hearts', locale: 'en' },
        { bg_color: '#F43F5E', text: 'Happy Mother\'s Day 🌸', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'hearts', locale: 'en' }
      ]
    },
    {
      id: 'busking',
      label: 'Concerts & Shows',
      icon: '',
      presets: [
        { bg_color: '#DB2777', text: 'ENCORE 🎤', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'en' },
        { bg_color: '#F59E0B', text: 'MAKE SOME NOISE! 🔊', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'en' },
        { bg_color: '#1E1B4B', text: 'LIVE MUSIC TONIGHT 🎶', text_color: '#00FFFF', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'stars', locale: 'en' },
        { bg_color: '#000000', text: 'GUITAR HERO 🎸', text_color: '#EC4899', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'hearts', locale: 'en' },
        { bg_color: '#312E81', text: 'Your Voice is Magic ✨', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'en' },
        { bg_color: '#0B0B0F', text: 'Request a Song 📝', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'en' },
        { bg_color: '#0B0B0F', text: 'Support the music! 💰', text_color: '#22C55E', effect: 'marquee', speed: 30061, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'en' },
        { bg_color: '#1E1B4B', text: 'CROWD WAVE 🌊', text_color: '#00FFFF', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'stars', locale: 'en' },
        { bg_color: '#4F46E5', text: 'Follow: @glowwave 📱', text_color: '#FFFFFF', effect: 'marquee', speed: 30061, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'en' },
        { bg_color: '#065F46', text: 'Sing Along! 🎤', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'en' },
        { bg_color: '#000000', text: 'Keep Rocking! 🤘', text_color: '#EF4444', effect: 'blink', speed: 1921, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'en' },
        { bg_color: '#F59E0B', text: 'Absolute Masterpiece 🏆', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'en' },
        { bg_color: '#1E1B4B', text: 'Debut Single Out! 🎧', text_color: '#00FFFF', effect: 'marquee', speed: 30061, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'en' },
        { bg_color: '#4F46E5', text: 'You are a Superstar! ⭐', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'en' },
        { bg_color: '#065F46', text: 'Tip Jar 💰', text_color: '#FFFFFF', effect: 'marquee', speed: 30061, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'en' }
      ]
    },
    {
      id: 'sports',
      label: 'Sports & Cheering',
      icon: '',
      presets: [
        { bg_color: '#EF4444', text: 'GO TEAM! 🏈', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'sans-thick', font_size: 100, special_effect: 'confetti', locale: 'en' },
        { bg_color: '#000000', text: 'TOUCHDOWN 🏉', text_color: '#EF4444', effect: 'blink', speed: 1921, font_family: 'sans-thick', font_size: 100, special_effect: 'confetti', locale: 'en' },
        { bg_color: '#1E3A8A', text: 'HOME RUN ⚾', text_color: '#FDE047', effect: 'marquee', speed: 30061, font_family: 'plump', font_size: 100, special_effect: 'stars', locale: 'en' },
        { bg_color: '#22C55E', text: 'GOAL!!! 🥅', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'en' },
        { bg_color: '#B91C1C', text: 'DEFENSE 🛡️', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'en' },
        { bg_color: '#0B0B0F', text: 'MVP 🏆', text_color: '#F59E0B', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'en' },
        { bg_color: '#B91C1C', text: 'Fight till the end! 🔥', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'en' },
        { bg_color: '#1E1B4B', text: 'Underdogs Win! 🐕', text_color: '#00FFFF', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'stars', locale: 'en' },
        { bg_color: '#F59E0B', text: 'Number One! 🥇', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'en' },
        { bg_color: '#000000', text: 'Ref is Blind! 🦓', text_color: '#EF4444', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'en' },
        { bg_color: '#1E3A8A', text: 'Go Bulldogs! 🐶', text_color: '#FDE047', effect: 'blink', speed: 1921, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'en' },
        { bg_color: '#7C3AED', text: 'Unstoppable! ⚡', text_color: '#00FFCC', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'stars', locale: 'en' },
        { bg_color: '#A30027', text: 'Walk-off Hit!! ⚾', text_color: '#FFC72C', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'en' },
        { bg_color: '#15803D', text: 'Defense Wins! 🛡️', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'en' },
        { bg_color: '#1E3A8A', text: 'The 12th Man ⚽', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'en' }
      ]
    },
    {
      id: 'party',
      label: 'Parties & Clubs',
      icon: '',
      presets: [
        { bg_color: '#7C3AED', text: 'DANCE TIME ⚡', text_color: '#00FFCC', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'en' },
        { bg_color: '#DB2777', text: 'LET\'S PARTY 🎉', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'en' },
        { bg_color: '#EF4444', text: 'VIP ONLY 💎', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'sans-thick', font_size: 100, special_effect: 'confetti', locale: 'en' },
        { bg_color: '#0B0B0F', text: 'PARTY TONIGHT 🎉', text_color: '#FFFFFF', effect: 'marquee', speed: 30061, font_family: 'plump', font_size: 100, special_effect: 'stars', locale: 'en' },
        { bg_color: '#B45309', text: 'CHEERS! 🍻', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'none', locale: 'en' },
        { bg_color: '#0B0B0F', text: 'WILD NIGHTS 💫', text_color: '#EF4444', effect: 'marquee', speed: 30061, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'en' },
        { bg_color: '#F97316', text: 'HALLOWEEN 🎉🎃', text_color: '#000000', effect: 'blink', speed: 1921, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'en' },
        { bg_color: '#0F5132', text: 'MERRY X-MAS 🎄', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'serif', font_size: 100, special_effect: 'confetti', locale: 'en' },
        { bg_color: '#EF4444', text: 'Shots! Shots! Shots! 🥃', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'en' },
        { bg_color: '#7C3AED', text: 'Club Session ON 🎛️', text_color: '#00FFCC', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'stars', locale: 'en' },
        { bg_color: '#0B0B0F', text: 'DJ Drop the Beat 🎧', text_color: '#FFFFFF', effect: 'marquee', speed: 30061, font_family: 'plump', font_size: 100, special_effect: 'stars', locale: 'en' },
        { bg_color: '#3B82F6', text: 'Summer Rave 🏖️', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'sans-thin', font_size: 100, special_effect: 'stars', locale: 'en' },
        { bg_color: '#7C3AED', text: 'Shake It Baby! 🕺', text_color: '#00FFCC', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'en' },
        { bg_color: '#DB2777', text: 'Birthday VIP 👑', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'en' },
        { bg_color: '#0B0B0F', text: 'Sober is Over 🍻', text_color: '#FDE047', effect: 'marquee', speed: 30061, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'en' }
      ]
    },
    {
      id: 'store',
      label: 'Shop & Info',
      icon: '',
      presets: [
        { bg_color: '#064E3B', text: 'OPEN NOW 🔔', text_color: '#FDE047', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'en' },
        { bg_color: '#0F172A', text: 'Welcome! 👋', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'en' },
        { bg_color: '#7F1D1D', text: 'CLOSED 🌑', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'en' },
        { bg_color: '#EF4444', text: 'HAPPY HOUR 🍺', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'en' },
        { bg_color: '#1E2937', text: 'WIFI: GlowWave123 📶', text_color: '#FFFFFF', effect: 'marquee', speed: 30061, font_family: 'sans-thin', font_size: 100, special_effect: 'none', locale: 'en' },
        { bg_color: '#0B0B0F', text: 'TIPS APPRECIATED 💵', text_color: '#22C55E', effect: 'marquee', speed: 30061, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'en' },
        { bg_color: '#1E3A8A', text: 'Order Here 🛎️', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'en' },
        { bg_color: '#451A03', text: 'Grab a Coffee ☕', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'en' },
        { bg_color: '#451A03', text: '10% Off Takeout 🥤', text_color: '#FDE047', effect: 'marquee', speed: 30061, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'en' },
        { bg_color: '#000000', text: 'No Outside Food 🚫', text_color: '#EF4444', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'en' },
        { bg_color: '#1E2937', text: 'Be Right Back ⏳', text_color: '#F59E0B', effect: 'none', speed: 1000, font_family: 'sans-thin', font_size: 100, special_effect: 'none', locale: 'en' },
        { bg_color: '#1E2937', text: 'Today\'s Special 🍽️', text_color: '#F59E0B', effect: 'marquee', speed: 30061, font_family: 'sans-thin', font_size: 100, special_effect: 'none', locale: 'en' },
        { bg_color: '#0D9488', text: 'New Menu Out! 🌟', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'en' },
        { bg_color: '#1E2937', text: 'Free Parking! 🚗', text_color: '#FFFFFF', effect: 'marquee', speed: 30061, font_family: 'sans-thin', font_size: 100, special_effect: 'none', locale: 'en' },
        { bg_color: '#7F1D1D', text: 'Order via QR code 📱', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'en' }
      ]
    }
  ],
  ja: [
    {
      id: 'anniversary',
      label: '披露宴・二次会',
      icon: '',
      presets: [
        { bg_color: '#DB2777', text: '新郎實新婦👰入場！', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'ja' },
        { bg_color: '#DB2777', text: '祝・結婚 🎉', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'ja' },
        { bg_color: '#4C1D95', text: 'お幸せに 💕', text_color: '#FDE047', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'ja' },
        { bg_color: '#FCE7F3', text: '乾杯します！ 🥂', text_color: '#BE185D', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'hearts', locale: 'ja' },
        { bg_color: '#2E1065', text: '二次会スタート 🍻', text_color: '#FDE047', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'stars', locale: 'ja' },
        { bg_color: '#FFE4E6', text: '最高のカップル 💖', text_color: '#E11D48', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'hearts', locale: 'ja' },
        { bg_color: '#1E3A8A', text: '誕生日おめでとう 🎂', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'sans-thick', font_size: 100, special_effect: 'confetti', locale: 'ja' },
        { bg_color: '#000000', text: '結婚してくれますか？ 💍', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'hearts', locale: 'ja' },
        { bg_color: '#FCE7F3', text: '世界一可愛い花嫁 👰‍♀️', text_color: '#BE185D', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'hearts', locale: 'ja' },
        { bg_color: '#DB2777', text: '卒業おめでとう 🎓', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'ja' },
        { bg_color: '#B91C1C', text: '還暦お祝い 🌸', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'ja' },
        { bg_color: '#FFFBEB', text: '出産お祝い 👶', text_color: '#B45309', effect: 'none', speed: 1000, font_family: 'plump', font_size: 100, special_effect: 'stars', locale: 'ja' },
        { bg_color: '#F59E0B', text: '金婚式おめでとう 🏆', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'ja' },
        { bg_color: '#FCE7F3', text: 'ずっと一緒だよ 💑', text_color: '#BE185D', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'hearts', locale: 'ja' },
        { bg_color: '#2E1065', text: '生まれてくれてありがとう 🎂', text_color: '#FDE047', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'stars', locale: 'ja' },
        { bg_color: '#F43F5E', text: 'プロポーズ大成功！ 💍', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'hearts', locale: 'ja' },
        { bg_color: '#9333EA', text: '銀婚式おめでとう 🥂', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'stars', locale: 'ja' },
        { bg_color: '#BE185D', text: '祝・成人式 🌸', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'confetti', locale: 'ja' }
      ]
    },
    {
      id: 'busking',
      label: 'ライブ・応援上映',
      icon: '',
      presets: [
        { bg_color: '#DB2777', text: 'アンコール！ 🎤', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'ja' },
        { bg_color: '#F59E0B', text: '推しが尊い 😍', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'ja' },
        { bg_color: '#1E1B4B', text: 'ファンサして 💖', text_color: '#00FFFF', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'stars', locale: 'ja' },
        { bg_color: '#000000', text: '神セトリ 🎶', text_color: '#EC4899', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'hearts', locale: 'ja' },
        { bg_color: '#312E81', text: 'コールアンドレスポンス ⚡', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'ja' },
        { bg_color: '#0B0B0F', text: 'GlowWave 💫', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'ja' },
        { bg_color: '#4F46E5', text: 'SNSフォローしてね 📱', text_color: '#FFFFFF', effect: 'marquee', speed: 30061, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'ja' },
        { bg_color: '#DB2777', text: '投げキッスして 💋', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'hearts', locale: 'ja' },
        { bg_color: '#F59E0B', text: 'こっち見て！ 👀', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'ja' },
        { bg_color: '#000000', text: '最高の歌声 🎵', text_color: '#EC4899', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'stars', locale: 'ja' },
        { bg_color: '#065F46', text: 'リクエスト受付中 📝', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'ja' },
        { bg_color: '#0B0B0F', text: '投げ銭はチップ箱へ 💰', text_color: '#22C55E', effect: 'marquee', speed: 30061, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'ja' },
        { bg_color: '#E11D48', text: 'ビジュアル最強 😍', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'hearts', locale: 'ja' },
        { bg_color: '#1E1B4B', text: '音源配信スタート！ 🎧', text_color: '#00FFFF', effect: 'marquee', speed: 30061, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'ja' },
        { bg_color: '#4F46E5', text: 'ファンクラブ募集中 🌟', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'ja' }
      ]
    },
    {
      id: 'sports',
      label: 'スポーツ応援',
      icon: '',
      presets: [
        { bg_color: '#FFD700', text: '阪神タイガース 🐯', text_color: '#000000', effect: 'blink', speed: 1921, font_family: 'sans-thick', font_size: 100, special_effect: 'confetti', locale: 'ja' },
        { bg_color: '#FF6600', text: '読売ジャイアンツ 🧡', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'sans-thick', font_size: 100, special_effect: 'confetti', locale: 'ja' },
        { bg_color: '#1E3A8A', text: 'ホームラン ⚾', text_color: '#FDE047', effect: 'marquee', speed: 30061, font_family: 'plump', font_size: 100, special_effect: 'stars', locale: 'ja' },
        { bg_color: '#22C55E', text: 'ゴーーール！ ⚽', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'ja' },
        { bg_color: '#B91C1C', text: 'ガンバレ！ 📣', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'ja' },
        { bg_color: '#0B0B0F', text: '絶対勝つぞ！ ⚡', text_color: '#F59E0B', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'ja' },
        { bg_color: '#B91C1C', text: '日本一！ 🥇', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'ja' },
        { bg_color: '#B91C1C', text: '闘魂注入 🔥', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'ja' },
        { bg_color: '#1E3A8A', text: 'サヨナラ勝ち！ ⚾', text_color: '#FDE047', effect: 'blink', speed: 1921, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'ja' },
        { bg_color: '#1E3A8A', text: '全力応援 📣', text_color: '#FDE047', effect: 'blink', speed: 1921, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'ja' },
        { bg_color: '#2E1065', text: '粘り勝ち！ 🔥', text_color: '#FDE047', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'stars', locale: 'ja' },
        { bg_color: '#0B0B0F', text: 'MVP 🏆', text_color: '#F59E0B', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'ja' },
        { bg_color: '#A30027', text: 'サヨナラヒット!! ⚾', text_color: '#FFC72C', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'ja' },
        { bg_color: '#15803D', text: 'あきらめたらそこで試合終了 🏀', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'ja' },
        { bg_color: '#1E3A8A', text: '最強のサポーター ⚽', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'ja' }
      ]
    },
    {
      id: 'party',
      label: 'イベント・記念日',
      icon: '',
      presets: [
        { bg_color: '#7C3AED', text: '今日の主役 👑', text_color: '#00FFCC', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'ja' },
        { bg_color: '#DB2777', text: 'お祝いしましょ 🎉', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'ja' },
        { bg_color: '#EF4444', text: 'メリークリスマス 🎄', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'sans-thick', font_size: 100, special_effect: 'confetti', locale: 'ja' },
        { bg_color: '#0B0B0F', text: 'あけおめ 🎍', text_color: '#FFFFFF', effect: 'marquee', speed: 30061, font_family: 'plump', font_size: 100, special_effect: 'stars', locale: 'ja' },
        { bg_color: '#B45309', text: 'かんぱい！ 🍻', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'none', locale: 'ja' },
        { bg_color: '#0B0B0F', text: '思い出の一夜 💫', text_color: '#EF4444', effect: 'marquee', speed: 30061, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'ja' },
        { bg_color: '#FF6600', text: '朝まで生ビール 🍺', text_color: '#FFFFFF', effect: 'marquee', speed: 30061, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'ja' },
        { bg_color: '#FF6600', text: 'ハロウィンパーティー 🎃', text_color: '#000000', effect: 'blink', speed: 1921, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'ja' },
        { bg_color: '#7C3AED', text: 'パリピ大集合 🕺', text_color: '#00FFCC', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'ja' },
        { bg_color: '#0B0B0F', text: 'オールナイト 💫', text_color: '#FFFFFF', effect: 'marquee', speed: 30061, font_family: 'plump', font_size: 100, special_effect: 'stars', locale: 'ja' },
        { bg_color: '#B45309', text: '乾杯コール！ 🍻', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'none', locale: 'ja' },
        { bg_color: '#1E1B4B', text: '新年年会・忘年会 🥂', text_color: '#F59E0B', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'confetti', locale: 'ja' },
        { bg_color: '#7C3AED', text: '朝まで踊ろう！ 🕺', text_color: '#00FFCC', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'ja' },
        { bg_color: '#DB2777', text: '誕生日おめでとうVIP 👑', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'ja' },
        { bg_color: '#0B0B0F', text: '今夜は飲むぞ！ 🍻', text_color: '#FDE047', effect: 'marquee', speed: 30061, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'ja' }
      ]
    },
    {
      id: 'store',
      label: '店舗・案内',
      icon: '',
      presets: [
        { bg_color: '#064E3B', text: '営業中 🔔', text_color: '#FDE047', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'ja' },
        { bg_color: '#0F172A', text: 'ハッピーアワー 🍻', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'ja' },
        { bg_color: '#7F1D1D', text: '本日閉店 🌑', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'ja' },
        { bg_color: '#EF4444', text: 'テイクアウト可 ☕', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'ja' },
        { bg_color: '#1E2937', text: 'Wi-Fi: glowwave 📶', text_color: '#FFFFFF', effect: 'marquee', speed: 30061, font_family: 'sans-thin', font_size: 100, special_effect: 'none', locale: 'ja' },
        { bg_color: '#0B0B0F', text: 'お手洗いはあちら 🚽', text_color: '#22C55E', effect: 'marquee', speed: 30061, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'ja' },
        { bg_color: '#1E3A8A', text: 'ご注文はタッチパネルで 🛎️', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'ja' },
        { bg_color: '#451A03', text: '本日の日替わり 🍽️', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'ja' },
        { bg_color: '#1E2937', text: '喫煙スペース 🚬', text_color: '#FFFFFF', effect: 'marquee', speed: 30061, font_family: 'sans-thin', font_size: 100, special_effect: 'none', locale: 'ja' },
        { bg_color: '#000000', text: '準備中 ⏳', text_color: '#EF4444', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'ja' },
        { bg_color: '#1E2937', text: 'いらっしゃいませ！ 👋', text_color: '#F59E0B', effect: 'none', speed: 1000, font_family: 'sans-thin', font_size: 100, special_effect: 'none', locale: 'ja' },
        { bg_color: '#7F1D1D', text: 'ラストオーダー ⏰', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'ja' },
        { bg_color: '#0D9488', text: '新メニュー登場！ 🌟', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'ja' },
        { bg_color: '#1E2937', text: '駐車券はレジでお申し出ください 🚗', text_color: '#FFFFFF', effect: 'marquee', speed: 30061, font_family: 'sans-thin', font_size: 100, special_effect: 'none', locale: 'ja' },
        { bg_color: '#7F1D1D', text: 'QRコード注文受付中 📱', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'ja' }
      ]
    }
  ],
  es: [
    {
      id: 'anniversary',
      label: 'Bodas y Eventos',
      icon: '',
      presets: [
        { bg_color: '#DB2777', text: 'Recién Casados 🥂', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'es' },
        { bg_color: '#DB2777', text: '¡Vivan los Novios! 👰🤵', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'es' },
        { bg_color: '#4C1D95', text: 'Amor Eterno 💕', text_color: '#FDE047', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'es' },
        { bg_color: '#FCE7F3', text: '¡Felicidades! 🎉', text_color: '#BE185D', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'hearts', locale: 'es' },
        { bg_color: '#2E1065', text: 'Brindis de Amor 🥂', text_color: '#FDE047', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'stars', locale: 'es' },
        { bg_color: '#FFE4E6', text: 'Felices Para Siempre ✨', text_color: '#E11D48', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'hearts', locale: 'es' },
        { bg_color: '#000000', text: '¿Te casarías conmigo? 💍', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'hearts', locale: 'es' },
        { bg_color: '#DB2777', text: 'Feliz Cumpleaños 🎂', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'es' },
        { bg_color: '#4C1D95', text: 'Eres mi sol ☀️', text_color: '#FDE047', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'es' },
        { bg_color: '#FCE7F3', text: 'El amor de mi vida 💖', text_color: '#BE185D', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'hearts', locale: 'es' },
        { bg_color: '#2E1065', text: 'Fiesta de Compromiso 💍', text_color: '#FDE047', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'stars', locale: 'es' },
        { bg_color: '#FFE4E6', text: 'Shower de Novias 👰‍♀️', text_color: '#E11D48', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'hearts', locale: 'es' },
        { bg_color: '#F43F5E', text: 'Feliz Aniversario 🥂', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'stars', locale: 'es' },
        { bg_color: '#9333EA', text: '¡Feliz Día de la Madre! 🌸', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'hearts', locale: 'es' },
        { bg_color: '#BE185D', text: '¡Bautizo de Ensueño! 👶', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'confetti', locale: 'es' }
      ]
    },
    {
      id: 'busking',
      label: 'Conciertos y Shows',
      icon: '',
      presets: [
        { bg_color: '#DB2777', text: 'OTRA MÁS 🎤', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'es' },
        { bg_color: '#F59E0B', text: '¡QUE SE ESCUCHE! 🔊', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'es' },
        { bg_color: '#1E1B4B', text: 'MÚSICA EN VIVO 🎵', text_color: '#00FFFF', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'stars', locale: 'es' },
        { bg_color: '#312E81', text: 'TENSIÓN ALTA ⚡', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'es' },
        { bg_color: '#0B0B0F', text: 'BAILA CONMIGO 🕺', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'es' },
        { bg_color: '#000000', text: 'Qué bonita voz 🎤', text_color: '#EC4899', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'hearts', locale: 'es' },
        { bg_color: '#4F46E5', text: 'Sígueme en Instagram 📱', text_color: '#FFFFFF', effect: 'marquee', speed: 30061, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'es' },
        { bg_color: '#0B0B0F', text: 'Propina para el artista 💰', text_color: '#22C55E', effect: 'marquee', speed: 30061, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'es' },
        { bg_color: '#1E1B4B', text: 'Acústico en vivo 🎸', text_color: '#00FFFF', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'stars', locale: 'es' },
        { bg_color: '#065F46', text: 'Cantemos juntos 🎤', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'es' },
        { bg_color: '#065F46', text: 'Canciones a pedido 📝', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'es' },
        { bg_color: '#F59E0B', text: '¡Eres el mejor! 🏆', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'es' },
        { bg_color: '#E11D48', text: '¡Nuevo Sencillo Lanzado! 🎧', text_color: '#FFFFFF', effect: 'marquee', speed: 30061, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'es' },
        { bg_color: '#1E1B4B', text: 'Eres una Estrella ⭐', text_color: '#00FFFF', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'stars', locale: 'es' },
        { bg_color: '#4F46E5', text: 'Canta con el Alma 🎤', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'hearts', locale: 'es' }
      ]
    },
    {
      id: 'sports',
      label: 'Deportes y Apoyo',
      icon: '',
      presets: [
        { bg_color: '#EF4444', text: '¡VAMOS REAL! ⚪', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'sans-thick', font_size: 100, special_effect: 'confetti', locale: 'es' },
        { bg_color: '#0000FF', text: '¡VISCA EL BARÇA! 🔵🔴', text_color: '#EF4444', effect: 'blink', speed: 1921, font_family: 'sans-thick', font_size: 100, special_effect: 'confetti', locale: 'es' },
        { bg_color: '#22C55E', text: '¡GOL! ⚽', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'es' },
        { bg_color: '#B91C1C', text: 'CAMPEONES 🏆', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'es' },
        { bg_color: '#0B0B0F', text: '¡A GANAR! ⚡', text_color: '#F59E0B', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'es' },
        { bg_color: '#B91C1C', text: '¡Vamos Selección! 🇨🇴🇲🇽🇪🇸', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'es' },
        { bg_color: '#B91C1C', text: 'Fuerza y Corazón 🔥', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'es' },
        { bg_color: '#000000', text: '¡Árbitro vendido! 🦓', text_color: '#EF4444', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'es' },
        { bg_color: '#1E3A8A', text: '¡Hasta el final! ⚽', text_color: '#FDE047', effect: 'marquee', speed: 30061, font_family: 'plump', font_size: 100, special_effect: 'stars', locale: 'es' },
        { bg_color: '#0B0B0F', text: 'Jugador del Partido 🏅', text_color: '#F59E0B', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'es' },
        { bg_color: '#1E3A8A', text: 'La afición te apoya 📣', text_color: '#FDE047', effect: 'blink', speed: 1921, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'es' },
        { bg_color: '#1E2937', text: '¡Defensa impenetrable! 🛡️', text_color: '#00FFFF', effect: 'blink', speed: 1921, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'es' },
        { bg_color: '#A30027', text: '¡Bateo de Walk-off! ⚾', text_color: '#FFC72C', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'es' },
        { bg_color: '#15803D', text: '¡La defensa gana campeonatos! 🛡️', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'es' },
        { bg_color: '#1E3A8A', text: 'El Jugador Número 12 ⚽', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'es' }
      ]
    },
    {
      id: 'party',
      label: 'Eventos y Fiestas',
      icon: '',
      presets: [
        { bg_color: '#7C3AED', text: 'FELIZ CUMPLE 🎂', text_color: '#00FFCC', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'es' },
        { bg_color: '#DB2777', text: '¡FIESTA! 🎉', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'es' },
        { bg_color: '#EF4444', text: 'FIESTA DE PROM ✨', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'sans-thick', font_size: 100, special_effect: 'confetti', locale: 'es' },
        { bg_color: '#0B0B0F', text: 'GRADUACIÓN 2026 🎓', text_color: '#FFFFFF', effect: 'marquee', speed: 30061, font_family: 'plump', font_size: 100, special_effect: 'stars', locale: 'es' },
        { bg_color: '#B45309', text: '¡SALUD! 🍻', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'none', locale: 'es' },
        { bg_color: '#0B0B0F', text: 'NOCHE LOCA 💫', text_color: '#EF4444', effect: 'marquee', speed: 30061, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'es' },
        { bg_color: '#B45309', text: 'Barra Libre 🍹', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'none', locale: 'es' },
        { bg_color: '#0B0B0F', text: 'DJ Pon la Música 🎧', text_color: '#FFFFFF', effect: 'marquee', speed: 30061, font_family: 'plump', font_size: 100, special_effect: 'stars', locale: 'es' },
        { bg_color: '#EF4444', text: 'Noche de Reggaetón 💃', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'sans-thick', font_size: 100, special_effect: 'confetti', locale: 'es' },
        { bg_color: '#F97316', text: 'Viva la Vida 🌟', text_color: '#000000', effect: 'blink', speed: 1921, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'es' },
        { bg_color: '#F97316', text: 'Fiesta de Halloween 🎃', text_color: '#000000', effect: 'blink', speed: 1921, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'es' },
        { bg_color: '#0F5132', text: 'Feliz Navidad 🎄', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'serif', font_size: 100, special_effect: 'confetti', locale: 'es' },
        { bg_color: '#7C3AED', text: '¡A mover el esqueleto! 🕺', text_color: '#00FFCC', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'es' },
        { bg_color: '#DB2777', text: 'Invitado de Honor VIP 👑', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'es' },
        { bg_color: '#0B0B0F', text: 'Noche de Tequila 🥃', text_color: '#FDE047', effect: 'marquee', speed: 30061, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'es' }
      ]
    },
    {
      id: 'store',
      label: 'Negocio y Guía',
      icon: '',
      presets: [
        { bg_color: '#064E3B', text: 'ABIERTO NOW 🔔', text_color: '#FDE047', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'es' },
        { bg_color: '#0F172A', text: 'HORA FELIZ 🍺', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'es' },
        { bg_color: '#7F1D1D', text: 'CERRADO 🌑', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'es' },
        { bg_color: '#EF4444', text: '¡Bienvenidos! 👋', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'es' },
        { bg_color: '#1E2937', text: 'WIFI gratis aquí 📶', text_color: '#FFFFFF', effect: 'marquee', speed: 30061, font_family: 'sans-thin', font_size: 100, special_effect: 'none', locale: 'es' },
        { bg_color: '#0B0B0F', text: 'SE APRECIAN PROPINAS 💵', text_color: '#22C55E', effect: 'marquee', speed: 30061, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'es' },
        { bg_color: '#1E3A8A', text: 'Ordene aquí 🛎️', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'es' },
        { bg_color: '#451A03', text: 'Menú del día 🍽️', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'es' },
        { bg_color: '#000000', text: 'Área de no fumar 🚭', text_color: '#EF4444', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'es' },
        { bg_color: '#1E2937', text: 'Regreso enseguida ⏳', text_color: '#F59E0B', effect: 'none', speed: 1000, font_family: 'sans-thin', font_size: 100, special_effect: 'none', locale: 'es' },
        { bg_color: '#451A03', text: 'Solo para llevar 🥤', text_color: '#FDE047', effect: 'marquee', speed: 30061, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'es' },
        { bg_color: '#1E2937', text: 'Pago solo en efectivo 💵', text_color: '#F59E0B', effect: 'none', speed: 1000, font_family: 'sans-thin', font_size: 100, special_effect: 'none', locale: 'es' },
        { bg_color: '#0D9488', text: '¡Nuevo Menú Disponible! 🌟', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'es' },
        { bg_color: '#1E2937', text: 'Valide su boleto de estacionamiento 🚗', text_color: '#FFFFFF', effect: 'marquee', speed: 30061, font_family: 'sans-thin', font_size: 100, special_effect: 'none', locale: 'es' },
        { bg_color: '#7F1D1D', text: 'Ordene por código QR 📱', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'es' }
      ]
    }
  ],
  'zh-TW': [
    {
      id: 'anniversary',
      label: '婚禮與紀念日',
      icon: '',
      presets: [
        { bg_color: '#DB2777', text: '新郎🤵新娘👰入場！', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'zh-TW' },
        { bg_color: '#DB2777', text: '祝・新婚快樂 🎉', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'zh-TW' },
        { bg_color: '#4C1D95', text: '百年好合 💕', text_color: '#FDE047', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'zh-TW' },
        { bg_color: '#FCE7F3', text: '乾杯！ 🥂', text_color: '#BE185D', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'hearts', locale: 'zh-TW' },
        { bg_color: '#2E1065', text: '永結同心 💖', text_color: '#FDE047', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'stars', locale: 'zh-TW' },
        { bg_color: '#FFE4E6', text: '最美新娘 👰', text_color: '#E11D48', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'hearts', locale: 'zh-TW' },
        { bg_color: '#000000', text: '嫁給我好嗎？ 💍', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'hearts', locale: 'zh-TW' },
        { bg_color: '#DB2777', text: '生日快樂 🎂', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'zh-TW' },
        { bg_color: '#4C1D95', text: '遇見你是我最美的緣分 💞', text_color: '#FDE047', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'zh-TW' },
        { bg_color: '#FCE7F3', text: '執子之手，與子偕老 👩‍❤️‍👨', text_color: '#BE185D', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'hearts', locale: 'zh-TW' },
        { bg_color: '#2E1065', text: '恭喜牽手成功 💑', text_color: '#FDE047', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'stars', locale: 'zh-TW' },
        { bg_color: '#1E3A8A', text: '祝爸爸生日快樂 🎂', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'sans-thick', font_size: 100, special_effect: 'confetti', locale: 'zh-TW' },
        { bg_color: '#FFE4E6', text: '祝媽媽永遠年輕 🌸', text_color: '#E11D48', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'hearts', locale: 'zh-TW' },
        { bg_color: '#FFFBEB', text: '滿月快樂 👶', text_color: '#B45309', effect: 'none', speed: 1000, font_family: 'plump', font_size: 100, special_effect: 'stars', locale: 'zh-TW' },
        { bg_color: '#F43F5E', text: '我們結婚了！ 🤵👰', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'hearts', locale: 'zh-TW' },
        { bg_color: '#9333EA', text: '祝結婚十週年快樂 💕', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'hearts', locale: 'zh-TW' },
        { bg_color: '#BE185D', text: '母親節快樂 🌸', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'confetti', locale: 'zh-TW' }
      ]
    },
    {
      id: 'busking',
      label: '演唱會與祭典',
      icon: '',
      presets: [
        { bg_color: '#DB2777', text: '安可！ 🎤', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'zh-TW' },
        { bg_color: '#F59E0B', text: '推推！😍', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'zh-TW' },
        { bg_color: '#1E1B4B', text: '求關注 💖', text_color: '#00FFFF', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'stars', locale: 'zh-TW' },
        { bg_color: '#312E81', text: '神曲 🎶', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'zh-TW' },
        { bg_color: '#0B0B0F', text: '尖叫聲！ ⚡', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'zh-TW' },
        { bg_color: '#065F46', text: '點歌點起來 📝', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'zh-TW' },
        { bg_color: '#4F46E5', text: '追蹤IG：@glowwave 📱', text_color: '#FFFFFF', effect: 'marquee', speed: 30061, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'zh-TW' },
        { bg_color: '#0B0B0F', text: '給街頭藝人一點鼓勵 💰', text_color: '#22C55E', effect: 'marquee', speed: 30061, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'zh-TW' },
        { bg_color: '#1E1B4B', text: '給我你的雙手 🙌', text_color: '#00FFFF', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'stars', locale: 'zh-TW' },
        { bg_color: '#0B0B0F', text: '聽歌請投箱 💵', text_color: '#22C55E', effect: 'marquee', speed: 30061, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'zh-TW' },
        { bg_color: '#000000', text: '音樂即生命 🎵', text_color: '#EC4899', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'stars', locale: 'zh-TW' },
        { bg_color: '#DB2777', text: '超好聽！求安可 🎤', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'zh-TW' },
        { bg_color: '#E11D48', text: '顏值擔當 😍', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'hearts', locale: 'zh-TW' },
        { bg_color: '#1E1B4B', text: '新歌宣傳！串流播起來 🎧', text_color: '#00FFFF', effect: 'marquee', speed: 30061, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'zh-TW' },
        { bg_color: '#4F46E5', text: '歡迎加入粉絲團 🌟', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'zh-TW' }
      ]
    },
    {
      id: 'sports',
      label: '體育與応援',
      icon: '',
      presets: [
        { bg_color: '#EF4444', text: '中信兄弟 💛', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'sans-thick', font_size: 100, special_effect: 'confetti', locale: 'zh-TW' },
        { bg_color: '#0000FF', text: '味全龍 ❤️', text_color: '#EF4444', effect: 'blink', speed: 1921, font_family: 'sans-thick', font_size: 100, special_effect: 'confetti', locale: 'zh-TW' },
        { bg_color: '#22C55E', text: '全壘打！ ⚾', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'zh-TW' },
        { bg_color: '#B91C1C', text: '球進了！ 🥅', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'zh-TW' },
        { bg_color: '#0B0B0F', text: '加油！ 📣', text_color: '#F59E0B', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'zh-TW' },
        { bg_color: '#F59E0B', text: '炸裂陳子豪 ⚾', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'zh-TW' },
        { bg_color: '#B91C1C', text: '猛攻強襲 🔥', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'zh-TW' },
        { bg_color: '#0B0B0F', text: '逆轉勝！ 🏆', text_color: '#F59E0B', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'zh-TW' },
        { bg_color: '#1E3A8A', text: '我們是冠軍！ 🥇', text_color: '#FDE047', effect: 'marquee', speed: 30061, font_family: 'plump', font_size: 100, special_effect: 'stars', locale: 'zh-TW' },
        { bg_color: '#1E2937', text: '防守！防守！ 🛡️', text_color: '#00FFFF', effect: 'blink', speed: 1921, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'zh-TW' },
        { bg_color: '#EF4444', text: '富邦悍將 💙', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'sans-thick', font_size: 100, special_effect: 'confetti', locale: 'zh-TW' },
        { bg_color: '#DB2777', text: '樂天桃猿 ❤️', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'zh-TW' },
        { bg_color: '#A30027', text: '再見安打!! ⚾', text_color: '#FFC72C', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'zh-TW' },
        { bg_color: '#15803D', text: '永不放棄！堅持到底 ✊', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'zh-TW' },
        { bg_color: '#1E3A8A', text: '最強第十二人 ⚽', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'zh-TW' }
      ]
    },
    {
      id: 'party',
      label: '派對與慶祝',
      icon: '',
      presets: [
        { bg_color: '#7C3AED', text: '生日快樂 🎂', text_color: '#00FFCC', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'zh-TW' },
        { bg_color: '#DB2777', text: '今天的壽星 👑', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'zh-TW' },
        { bg_color: '#EF4444', text: '乾杯！ 🍻', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'sans-thick', font_size: 100, special_effect: 'confetti', locale: 'zh-TW' },
        { bg_color: '#0B0B0F', text: '聖誕快樂 🎄', text_color: '#FFFFFF', effect: 'marquee', speed: 30061, font_family: 'plump', font_size: 100, special_effect: 'stars', locale: 'zh-TW' },
        { bg_color: '#B45309', text: '新年快樂 🎍', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'none', locale: 'zh-TW' },
        { bg_color: '#0B0B0F', text: '今晚不醉不歸 🍷', text_color: '#EF4444', effect: 'marquee', speed: 30061, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'zh-TW' },
        { bg_color: '#F97316', text: '萬聖節變裝派對 🎃', text_color: '#000000', effect: 'blink', speed: 1921, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'zh-TW' },
        { bg_color: '#7C3AED', text: '嗨起來！ 🕺', text_color: '#00FFCC', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'zh-TW' },
        { bg_color: '#0B0B0F', text: '通宵狂歡 💫', text_color: '#FFFFFF', effect: 'marquee', speed: 30061, font_family: 'plump', font_size: 100, special_effect: 'stars', locale: 'zh-TW' },
        { bg_color: '#B45309', text: '壽星要喝幾杯？ 🍻', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'none', locale: 'zh-TW' },
        { bg_color: '#1E1B4B', text: '春酒尾牙聚餐 🥂', text_color: '#F59E0B', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'confetti', locale: 'zh-TW' },
        { bg_color: '#3B82F6', text: '夏日電音趴 🎆', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'sans-thin', font_size: 100, special_effect: 'stars', locale: 'zh-TW' },
        { bg_color: '#7C3AED', text: '搖擺起來！ 🕺', text_color: '#00FFCC', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'zh-TW' },
        { bg_color: '#DB2777', text: '生日VIP貴賓 👑', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'zh-TW' },
        { bg_color: '#0B0B0F', text: '今晚不醉不歸 🍻', text_color: '#FDE047', effect: 'marquee', speed: 30061, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'zh-TW' }
      ]
    },
    {
      id: 'store',
      label: '商家與廣告',
      icon: '',
      presets: [
        { bg_color: '#064E3B', text: '營業中 🔔', text_color: '#FDE047', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'zh-TW' },
        { bg_color: '#0F172A', text: '歡樂時光 🍻', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'zh-TW' },
        { bg_color: '#7F1D1D', text: '本日已打烊 🌑', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'zh-TW' },
        { bg_color: '#EF4444', text: '可外帶 ☕', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'zh-TW' },
        { bg_color: '#1E2937', text: '無線網路: glowwave 📶', text_color: '#FFFFFF', effect: 'marquee', speed: 30061, font_family: 'sans-thin', font_size: 100, special_effect: 'none', locale: 'zh-TW' },
        { bg_color: '#0B0B0F', text: '洗手間請往這 🚽', text_color: '#22C55E', effect: 'marquee', speed: 30061, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'zh-TW' },
        { bg_color: '#1E3A8A', text: '請至櫃檯點餐 🛎️', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'zh-TW' },
        { bg_color: '#451A03', text: '今日特餐 🍽️', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'zh-TW' },
        { bg_color: '#000000', text: '吸菸區請往後 🚭', text_color: '#EF4444', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'zh-TW' },
        { bg_color: '#1E2937', text: '稍候片刻 ⏳', text_color: '#F59E0B', effect: 'none', speed: 1000, font_family: 'sans-thin', font_size: 100, special_effect: 'none', locale: 'zh-TW' },
        { bg_color: '#1E2937', text: '歡迎光臨 👋', text_color: '#F59E0B', effect: 'none', speed: 1000, font_family: 'sans-thin', font_size: 100, special_effect: 'none', locale: 'zh-TW' },
        { bg_color: '#7F1D1D', text: '最後點餐時間 ⏰', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'zh-TW' },
        { bg_color: '#0D9488', text: '新品上市！歡迎品嚐 🌟', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'zh-TW' },
        { bg_color: '#1E2937', text: '結帳時請主動告知車牌號碼 🚗', text_color: '#FFFFFF', effect: 'marquee', speed: 30061, font_family: 'sans-thin', font_size: 100, special_effect: 'none', locale: 'zh-TW' },
        { bg_color: '#7F1D1D', text: '請掃描QR碼點餐 📱', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'zh-TW' }
      ]
    }
  ],
  'zh-HK': [
    {
      id: 'anniversary',
      label: '婚禮與紀念日',
      icon: '',
      presets: [
        { bg_color: '#DB2777', text: '新人入場！ 👰🤵', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'zh-HK' },
        { bg_color: '#DB2777', text: '祝・新婚快樂 🎉', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'zh-HK' },
        { bg_color: '#4C1D95', text: '百年好合 💕', text_color: '#FDE047', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'zh-HK' },
        { bg_color: '#FCE7F3', text: '飲杯！ 🥂', text_color: '#BE185D', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'hearts', locale: 'zh-HK' },
        { bg_color: '#2E1065', text: '白頭到老 💖', text_color: '#FDE047', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'stars', locale: 'zh-HK' },
        { bg_color: '#FFE4E6', text: '最靚新娘 👰', text_color: '#E11D48', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'hearts', locale: 'zh-HK' },
        { bg_color: '#000000', text: '嫁給我好嗎？ 💍', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'hearts', locale: 'zh-HK' },
        { bg_color: '#DB2777', text: '生日快樂 🎂', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'zh-HK' },
        { bg_color: '#FCE7F3', text: '執子之手，與子偕老 💏', text_color: '#BE185D', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'hearts', locale: 'zh-HK' },
        { bg_color: '#2E1065', text: '週年紀念快樂 💍', text_color: '#FDE047', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'stars', locale: 'zh-HK' },
        { bg_color: '#DB2777', text: '生日大快樂 🎂', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'zh-HK' },
        { bg_color: '#FFFBEB', text: '百日宴快樂 👶', text_color: '#B45309', effect: 'none', speed: 1000, font_family: 'plump', font_size: 100, special_effect: 'stars', locale: 'zh-HK' },
        { bg_color: '#1E3A8A', text: '祝爸爸身體健康 🎂', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'sans-thick', font_size: 100, special_effect: 'confetti', locale: 'zh-HK' },
        { bg_color: '#FFE4E6', text: '祝媽媽青春常駐 🌸', text_color: '#E11D48', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'hearts', locale: 'zh-HK' },
        { bg_color: '#F43F5E', text: '我哋結婚啦！ 🤵👰', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'hearts', locale: 'zh-HK' },
        { bg_color: '#9333EA', text: '祝結婚十週年快樂 💕', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'hearts', locale: 'zh-HK' },
        { bg_color: '#BE185D', text: '母親節快樂 🌸', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'confetti', locale: 'zh-HK' }
      ]
    },
    {
      id: 'busking',
      label: '演唱會與祭典',
      icon: '',
      presets: [
        { bg_color: '#DB2777', text: 'Encore! 🎤', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'zh-HK' },
        { bg_color: '#F59E0B', text: '好崇拜你 😍', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'zh-HK' },
        { bg_color: '#1E1B4B', text: '望過來！ 💖', text_color: '#00FFFF', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'stars', locale: 'zh-HK' },
        { bg_color: '#312E81', text: '神曲 🎶', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'zh-HK' },
        { bg_color: '#0B0B0F', text: '嗌出嚟！ ⚡', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'zh-HK' },
        { bg_color: '#065F46', text: '歡迎點歌 📝', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'zh-HK' },
        { bg_color: '#4F46E5', text: '追蹤IG：@glowwave 📱', text_color: '#FFFFFF', effect: 'marquee', speed: 30061, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'zh-HK' },
        { bg_color: '#0B0B0F', text: '支持街頭音樂 💰', text_color: '#22C55E', effect: 'marquee', speed: 30061, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'zh-HK' },
        { bg_color: '#1E1B4B', text: '全場一齊唱 🙌', text_color: '#00FFFF', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'stars', locale: 'zh-HK' },
        { bg_color: '#0B0B0F', text: '聽歌請入箱 💵', text_color: '#22C55E', effect: 'marquee', speed: 30061, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'zh-HK' },
        { bg_color: '#000000', text: '歌聲真係超動聽 🎵', text_color: '#EC4899', effect: 'none', speed: 1000, font_family: 'serif', font_size: 100, special_effect: 'stars', locale: 'zh-HK' },
        { bg_color: '#DB2777', text: '尖叫聲唔好停 🎤', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'zh-HK' },
        { bg_color: '#E11D48', text: '顏值擔當 😍', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'hearts', locale: 'zh-HK' },
        { bg_color: '#1E1B4B', text: '新歌宣傳！串流播起來 🎧', text_color: '#00FFFF', effect: 'marquee', speed: 30061, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'zh-HK' },
        { bg_color: '#4F46E5', text: '歡迎加入粉絲團 🌟', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'zh-HK' }
      ]
    },
    {
      id: 'sports',
      label: '體育與応援',
      icon: '',
      presets: [
        { bg_color: '#EF4444', text: '香港隊加油！ ⚽', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'sans-thick', font_size: 100, special_effect: 'confetti', locale: 'zh-HK' },
        { bg_color: '#0000FF', text: '入波啦！ 🥅', text_color: '#EF4444', effect: 'blink', speed: 1921, font_family: 'sans-thick', font_size: 100, special_effect: 'confetti', locale: 'zh-HK' },
        { bg_color: '#22C55E', text: '全壘打！ ⚾', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'zh-HK' },
        { bg_color: '#B91C1C', text: '加油！ 📣', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'zh-HK' },
        { bg_color: '#0B0B0F', text: '贏啊！ ⚡', text_color: '#F59E0B', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'zh-HK' },
        { bg_color: '#EF4444', text: '絕殺！ 🏆', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'sans-thick', font_size: 100, special_effect: 'confetti', locale: 'zh-HK' },
        { bg_color: '#B91C1C', text: '全力以赴，永不言敗 🔥', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'zh-HK' },
        { bg_color: '#000000', text: '裁判盲架？ 🦓', text_color: '#EF4444', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'zh-HK' },
        { bg_color: '#1E3A8A', text: '撐到底！ ⚽', text_color: '#FDE047', effect: 'marquee', speed: 30061, font_family: 'plump', font_size: 100, special_effect: 'stars', locale: 'zh-HK' },
        { bg_color: '#0B0B0F', text: '全場最有價值球員 🏅', text_color: '#F59E0B', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'zh-HK' },
        { bg_color: '#1E3A8A', text: '萬眾一心 📣', text_color: '#FDE047', effect: 'blink', speed: 1921, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'zh-HK' },
        { bg_color: '#1E2937', text: '銅牆鐵壁 🛡️', text_color: '#00FFFF', effect: 'blink', speed: 1921, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'zh-HK' },
        { bg_color: '#A30027', text: '再見安打!! ⚾', text_color: '#FFC72C', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'zh-HK' },
        { bg_color: '#15803D', text: '永不放棄！堅持到底 ✊', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'zh-HK' },
        { bg_color: '#1E3A8A', text: '最強第十二人 ⚽', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'zh-HK' }
      ]
    },
    {
      id: 'party',
      label: '派對與慶祝',
      icon: '',
      presets: [
        { bg_color: '#7C3AED', text: '生日快樂 🎂', text_color: '#00FFCC', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'zh-HK' },
        { bg_color: '#DB2777', text: '今日主角 👑', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'zh-HK' },
        { bg_color: '#EF4444', text: '飲啦！ 🍻', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'sans-thick', font_size: 100, special_effect: 'confetti', locale: 'zh-HK' },
        { bg_color: '#0B0B0F', text: '聖誕快樂 🎄', text_color: '#FFFFFF', effect: 'marquee', speed: 30061, font_family: 'plump', font_size: 100, special_effect: 'stars', locale: 'zh-HK' },
        { bg_color: '#B45309', text: '新年快樂 🎍', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'none', locale: 'zh-HK' },
        { bg_color: '#0B0B0F', text: '今晚不醉不歸 🍷', text_color: '#EF4444', effect: 'marquee', speed: 30061, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'zh-HK' },
        { bg_color: '#F97316', text: '萬聖節狂歡派對 🎃', text_color: '#000000', effect: 'blink', speed: 1921, font_family: 'sans-thick', font_size: 100, special_effect: 'stars', locale: 'zh-HK' },
        { bg_color: '#7C3AED', text: '嗨起來！ 🕺', text_color: '#00FFCC', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'zh-HK' },
        { bg_color: '#0B0B0F', text: '唱K通宵 💫', text_color: '#FFFFFF', effect: 'marquee', speed: 30061, font_family: 'plump', font_size: 100, special_effect: 'stars', locale: 'zh-HK' },
        { bg_color: '#B45309', text: '壽星自罰三杯 🍻', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'none', locale: 'zh-HK' },
        { bg_color: '#1E1B4B', text: '尾牙聚餐 🥂', text_color: '#F59E0B', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'confetti', locale: 'zh-HK' },
        { bg_color: '#3B82F6', text: '電音狂歡 🎆', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'sans-thin', font_size: 100, special_effect: 'stars', locale: 'zh-HK' },
        { bg_color: '#7C3AED', text: '搖擺起來！ 🕺', text_color: '#00FFCC', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'zh-HK' },
        { bg_color: '#DB2777', text: '生日VIP貴賓 👑', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'plump', font_size: 100, special_effect: 'confetti', locale: 'zh-HK' },
        { bg_color: '#0B0B0F', text: '今晚不醉不歸 🍻', text_color: '#FDE047', effect: 'marquee', speed: 30061, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'zh-HK' }
      ]
    },
    {
      id: 'store',
      label: '商家與廣告',
      icon: '',
      presets: [
        { bg_color: '#064E3B', text: '營業中 🔔', text_color: '#FDE047', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'zh-HK' },
        { bg_color: '#0F172A', text: 'Happy Hour 🍻', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'zh-HK' },
        { bg_color: '#7F1D1D', text: '今日收工 🌑', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'zh-HK' },
        { bg_color: '#EF4444', text: '可以外賣 ☕', text_color: '#FFFFFF', effect: 'blink', speed: 1921, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'zh-HK' },
        { bg_color: '#1E2937', text: 'Wi-Fi: glowwave 📶', text_color: '#FFFFFF', effect: 'marquee', speed: 30061, font_family: 'sans-thin', font_size: 100, special_effect: 'none', locale: 'zh-HK' },
        { bg_color: '#0B0B0F', text: '洗手間喺嗰邊 🚽', text_color: '#22C55E', effect: 'marquee', speed: 30061, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'zh-HK' },
        { bg_color: '#1E3A8A', text: '請至櫃檯點餐 🛎️', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'zh-HK' },
        { bg_color: '#451A03', text: '今日推介 🍽️', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'zh-HK' },
        { bg_color: '#000000', text: '嚴禁吸煙 🚭', text_color: '#EF4444', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'zh-HK' },
        { bg_color: '#1E2937', text: '請稍候 ⏳', text_color: '#F59E0B', effect: 'none', speed: 1000, font_family: 'sans-thin', font_size: 100, special_effect: 'none', locale: 'zh-HK' },
        { bg_color: '#1E2937', text: '歡迎光臨 👋', text_color: '#F59E0B', effect: 'none', speed: 1000, font_family: 'sans-thin', font_size: 100, special_effect: 'none', locale: 'zh-HK' },
        { bg_color: '#7F1D1D', text: '最後點餐時間 ⏰', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'zh-HK' },
        { bg_color: '#0D9488', text: '新品上市！歡迎品嚐 🌟', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'zh-HK' },
        { bg_color: '#1E2937', text: '結帳時請主動告知車牌號碼 🚗', text_color: '#FFFFFF', effect: 'marquee', speed: 30061, font_family: 'sans-thin', font_size: 100, special_effect: 'none', locale: 'zh-HK' },
        { bg_color: '#7F1D1D', text: '請掃描QR碼點餐 📱', text_color: '#FFFFFF', effect: 'none', speed: 1000, font_family: 'sans-thick', font_size: 100, special_effect: 'none', locale: 'zh-HK' }
      ]
    }
  ]
};

export const TEMPLATE_CATEGORIES: TemplateCategory[] = LOCALIZED_TEMPLATES['ko'];
