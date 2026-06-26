import { Preset } from './types';

export interface TemplateCategory {
  id: 'busking' | 'sports' | 'party' | 'anniversary' | 'store';
  label: string;
  icon: string;
  presets: Preset[];
}

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  {
    id: 'anniversary',
    label: '기념일/이벤트',
    icon: '',
    presets: [
      {
        bg_color: '#DB2777',
        text: '생일 축하해 🎂',
        text_color: '#FFFFFF',
        effect: 'blink',
        speed: 1921,
        font_family: 'plump',
        font_size: 100,
        special_effect: 'confetti'
      },
      {
        bg_color: '#DB2777',
        text: 'Happy Birthday',
        text_color: '#FFFFFF',
        effect: 'blink',
        speed: 1921,
        font_family: 'plump',
        font_size: 100,
        special_effect: 'confetti'
      },
      {
        bg_color: '#4C1D95',
        text: '오늘의 주인공은 너야 👑',
        text_color: '#FDE047',
        effect: 'none',
        speed: 1000,
        font_family: 'sans-thick',
        font_size: 100,
        special_effect: 'stars'
      },
      {
        bg_color: '#FCE7F3',
        text: '태어나줘서 고마워 💖',
        text_color: '#BE185D',
        effect: 'none',
        speed: 1000,
        font_family: 'serif',
        font_size: 100,
        special_effect: 'hearts'
      },
      {
        bg_color: '#2E1065',
        text: '청춘은 60부터! 화이팅 🌸',
        text_color: '#FDE047',
        effect: 'none',
        speed: 1000,
        font_family: 'serif',
        font_size: 100,
        special_effect: 'stars'
      },
      {
        bg_color: '#FFE4E6',
        text: '울엄마 환갑을 축하해요 💐',
        text_color: '#E11D48',
        effect: 'none',
        speed: 1000,
        font_family: 'serif',
        font_size: 100,
        special_effect: 'hearts'
      },
      {
        bg_color: '#1E3A8A',
        text: '세상 최고 멋진 아빠 칠순 🎉',
        text_color: '#FFFFFF',
        effect: 'blink',
        speed: 1921,
        font_family: 'sans-thick',
        font_size: 100,
        special_effect: 'confetti'
      },
      {
        bg_color: '#FFFBEB',
        text: '첫돌을 축하합니다 👶',
        text_color: '#B45309',
        effect: 'none',
        speed: 1000,
        font_family: 'plump',
        font_size: 100,
        special_effect: 'stars'
      },
      {
        bg_color: '#000000',
        text: '나랑 결혼해줄래? 💍',
        text_color: '#FFFFFF',
        effect: 'none',
        speed: 1000,
        font_family: 'serif',
        font_size: 100,
        special_effect: 'hearts'
      },
      {
        bg_color: '#1E1B4B',
        text: 'Marry Me? 👰❤️🤵',
        text_color: '#FFFFFF',
        effect: 'none',
        speed: 1000,
        font_family: 'serif',
        font_size: 100,
        special_effect: 'hearts'
      },
      {
        bg_color: '#FCE7F3',
        text: 'Bridal Shower 🥂',
        text_color: '#BE185D',
        effect: 'none',
        speed: 1000,
        font_family: 'serif',
        font_size: 100,
        special_effect: 'hearts'
      },
      {
        bg_color: '#000000',
        text: '꽃길만 걷자 우리 공주 👑',
        text_color: '#F59E0B',
        effect: 'none',
        speed: 1000,
        font_family: 'serif',
        font_size: 100,
        special_effect: 'stars'
      },
      {
        bg_color: '#0B0B0F',
        text: '친구야 결혼 너무 축하해 💐',
        text_color: '#FFFFFF',
        effect: 'marquee',
        speed: 14434,
        font_family: 'sans-thick',
        font_size: 100,
        special_effect: 'confetti'
      },
      {
        bg_color: '#FFE4E6',
        text: '세상에서 제일 예쁜 신부 👰',
        text_color: '#BE185D',
        effect: 'none',
        speed: 1000,
        font_family: 'serif',
        font_size: 100,
        special_effect: 'hearts'
      },
      {
        bg_color: '#064E3B',
        text: '전역 축하해! 꽃길만 걷자 🌸',
        text_color: '#FDE047',
        effect: 'blink',
        speed: 1921,
        font_family: 'plump',
        font_size: 100,
        special_effect: 'confetti'
      },
      {
        bg_color: '#000000',
        text: '민간인 봉인 해제 🕊',
        text_color: '#FFFFFF',
        effect: 'marquee',
        speed: 14434,
        font_family: 'sans-thick',
        font_size: 100,
        special_effect: 'stars'
      },
      {
        bg_color: '#1E3A8A',
        text: '졸업 축하해! 새로운 시작 🎓',
        text_color: '#FFFFFF',
        effect: 'blink',
        speed: 1921,
        font_family: 'sans-thick',
        font_size: 100,
        special_effect: 'confetti'
      },
      {
        bg_color: '#B91C1C',
        text: '수능 대박! 다 잘될거야 💯',
        text_color: '#FFFFFF',
        effect: 'blink',
        speed: 1921,
        font_family: 'sans-thick',
        font_size: 100,
        special_effect: 'stars'
      },
      {
        bg_color: '#0F172A',
        text: '취뽀 성공! 출근 화이팅 🚀',
        text_color: '#38BDF8',
        effect: 'marquee',
        speed: 14434,
        font_family: 'plump',
        font_size: 100,
        special_effect: 'stars'
      },
      {
        bg_color: '#1E1B4B',
        text: '축 승진! 탄탄대로 걸어요 🎉',
        text_color: '#F59E0B',
        effect: 'none',
        speed: 1000,
        font_family: 'sans-thick',
        font_size: 100,
        special_effect: 'confetti'
      },
      {
        bg_color: '#FFE4E6',
        text: '고생하셨습니다! 응원해요 👏',
        text_color: '#BE185D',
        effect: 'none',
        speed: 1000,
        font_family: 'serif',
        font_size: 100,
        special_effect: 'hearts'
      },
      {
        bg_color: '#E11D48',
        text: '엄마 아빠 사랑해요 💕',
        text_color: '#FFFFFF',
        effect: 'none',
        speed: 1000,
        font_family: 'serif',
        font_size: 100,
        special_effect: 'hearts'
      }
    ]
  },
  {
    id: 'busking',
    label: '공연/버스킹',
    icon: '',
    presets: [
      {
        bg_color: '#DB2777',
        text: '앵콜 한 번 더 🎤',
        text_color: '#FFFFFF',
        effect: 'blink',
        speed: 1921,
        font_family: 'plump',
        font_size: 100,
        special_effect: 'confetti'
      },
      {
        bg_color: '#F59E0B',
        text: '오늘 무대 최고! 🔥',
        text_color: '#FFFFFF',
        effect: 'none',
        speed: 1000,
        font_family: 'sans-thick',
        font_size: 100,
        special_effect: 'stars'
      },
      {
        bg_color: '#1E1B4B',
        text: '귀호강 고막 힐링 🎧',
        text_color: '#00FFFF',
        effect: 'none',
        speed: 1000,
        font_family: 'serif',
        font_size: 100,
        special_effect: 'stars'
      },
      {
        bg_color: '#000000',
        text: '평생 네 편이야 💖',
        text_color: '#EC4899',
        effect: 'none',
        speed: 1000,
        font_family: 'serif',
        font_size: 100,
        special_effect: 'hearts'
      },
      {
        bg_color: '#312E81',
        text: '빛나는 너를 응원해 ✨',
        text_color: '#FFFFFF',
        effect: 'none',
        speed: 1000,
        font_family: 'sans-thick',
        font_size: 100,
        special_effect: 'stars'
      },
      {
        bg_color: '#000000',
        text: '나의 가수라서 자랑스러워 🎤',
        text_color: '#FDE047',
        effect: 'marquee',
        speed: 14434,
        font_family: 'serif',
        font_size: 100,
        special_effect: 'stars'
      },
      {
        bg_color: '#0B0B0F',
        text: '목소리에 녹는다 녹아 🥰',
        text_color: '#F472B6',
        effect: 'none',
        speed: 1000,
        font_family: 'serif',
        font_size: 100,
        special_effect: 'hearts'
      },
      {
        bg_color: '#1E2937',
        text: '노래 제목이 궁금해요 🎤❓',
        text_color: '#FFFFFF',
        effect: 'none',
        speed: 1000,
        font_family: 'sans-thick',
        font_size: 100,
        special_effect: 'none'
      },
      {
        bg_color: '#4F46E5',
        text: '인스타: @glowwave 📱',
        text_color: '#FFFFFF',
        effect: 'marquee',
        speed: 14434,
        font_family: 'sans-thick',
        font_size: 100,
        special_effect: 'none'
      },
      {
        bg_color: '#065F46',
        text: '신청곡 받습니다 📝',
        text_color: '#FFFFFF',
        effect: 'none',
        speed: 1000,
        font_family: 'sans-thick',
        font_size: 100,
        special_effect: 'none'
      },
      {
        bg_color: '#0B0B0F',
        text: '음악이 좋았다면 팁박스로 💰',
        text_color: '#22C55E',
        effect: 'marquee',
        speed: 14434,
        font_family: 'sans-thick',
        font_size: 100,
        special_effect: 'none'
      }
    ]
  },
  {
    id: 'sports',
    label: '스포츠/응원',
    icon: '',
    presets: [
      {
        bg_color: '#EF4444',
        text: '대~한민국! ⚽',
        text_color: '#FFFFFF',
        effect: 'blink',
        speed: 1921,
        font_family: 'sans-thick',
        font_size: 100,
        special_effect: 'confetti'
      },
      {
        bg_color: '#000000',
        text: '오~ 필승 코리아! 🏆',
        text_color: '#EF4444',
        effect: 'blink',
        speed: 1921,
        font_family: 'sans-thick',
        font_size: 100,
        special_effect: 'confetti'
      },
      {
        bg_color: '#1E3A8A',
        text: '날려라~ 홈런! ⚾',
        text_color: '#FDE047',
        effect: 'marquee',
        speed: 14434,
        font_family: 'plump',
        font_size: 100,
        special_effect: 'stars'
      },
      {
        bg_color: '#22C55E',
        text: '골이다!! GOAL!!! 🥅',
        text_color: '#FFFFFF',
        effect: 'blink',
        speed: 1921,
        font_family: 'plump',
        font_size: 100,
        special_effect: 'confetti'
      },
      {
        bg_color: '#B91C1C',
        text: '끝까지 포기하지 마! 🔥',
        text_color: '#FFFFFF',
        effect: 'none',
        speed: 1000,
        font_family: 'sans-thick',
        font_size: 100,
        special_effect: 'stars'
      },
      {
        bg_color: '#A30027',
        text: '최강 기아! 🐯',
        text_color: '#FFC72C',
        effect: 'blink',
        speed: 1921,
        font_family: 'sans-thick',
        font_size: 100,
        special_effect: 'stars'
      },
      {
        bg_color: '#7A0026',
        text: '무적 LG! ⚾',
        text_color: '#FFFFFF',
        effect: 'blink',
        speed: 1921,
        font_family: 'sans-thick',
        font_size: 100,
        special_effect: 'stars'
      },
      {
        bg_color: '#FF6600',
        text: '최강 한화! 🧡',
        text_color: '#FFFFFF',
        effect: 'blink',
        speed: 1921,
        font_family: 'sans-thick',
        font_size: 100,
        special_effect: 'stars'
      },
      {
        bg_color: '#0B0B0F',
        text: '오늘 MVP는 바로 너 🌟',
        text_color: '#F59E0B',
        effect: 'none',
        speed: 1000,
        font_family: 'sans-thick',
        font_size: 100,
        special_effect: 'stars'
      },
      {
        bg_color: '#1E2937',
        text: '삼진 아웃 잡으러 가자! ⚡',
        text_color: '#00FFFF',
        effect: 'blink',
        speed: 1921,
        font_family: 'sans-thick',
        font_size: 100,
        special_effect: 'stars'
      }
    ]
  },
  {
    id: 'party',
    label: '페스티벌/파티',
    icon: '',
    presets: [
      {
        bg_color: '#7C3AED',
        text: 'DANCE TIME ⚡',
        text_color: '#00FFCC',
        effect: 'blink',
        speed: 1921,
        font_family: 'plump',
        font_size: 100,
        special_effect: 'confetti'
      },
      {
        bg_color: '#DB2777',
        text: '소리 질러~!! 🙌',
        text_color: '#FFFFFF',
        effect: 'blink',
        speed: 1921,
        font_family: 'plump',
        font_size: 100,
        special_effect: 'confetti'
      },
      {
        bg_color: '#EF4444',
        text: '오늘 밤새 달리자 🔥',
        text_color: '#FFFFFF',
        effect: 'blink',
        speed: 1921,
        font_family: 'sans-thick',
        font_size: 100,
        special_effect: 'confetti'
      },
      {
        bg_color: '#F97316',
        text: '텐션 올려~! 🚀',
        text_color: '#FFFFFF',
        effect: 'blink',
        speed: 1921,
        font_family: 'sans-thick',
        font_size: 100,
        special_effect: 'confetti'
      },
      {
        bg_color: '#0B0B0F',
        text: 'PARTY TONIGHT 🎉',
        text_color: '#FFFFFF',
        effect: 'marquee',
        speed: 14434,
        font_family: 'plump',
        font_size: 100,
        special_effect: 'stars'
      },
      {
        bg_color: '#D97706',
        text: '골든벨 울릴 사람? 🔔',
        text_color: '#FFFFFF',
        effect: 'blink',
        speed: 1921,
        font_family: 'sans-thick',
        font_size: 100,
        special_effect: 'confetti'
      },
      {
        bg_color: '#B45309',
        text: '원샷! 원샷! 🍻',
        text_color: '#FFFFFF',
        effect: 'blink',
        speed: 1921,
        font_family: 'plump',
        font_size: 100,
        special_effect: 'none'
      },
      {
        bg_color: '#0B0B0F',
        text: '오늘 집 안 간다 🏠❌',
        text_color: '#EF4444',
        effect: 'marquee',
        speed: 14434,
        font_family: 'sans-thick',
        font_size: 100,
        special_effect: 'none'
      },
      {
        bg_color: '#F97316',
        text: 'HALLOWEEN 🎉🎃',
        text_color: '#000000',
        effect: 'blink',
        speed: 1921,
        font_family: 'sans-thick',
        font_size: 100,
        special_effect: 'stars'
      },
      {
        bg_color: '#0F5132',
        text: 'MERRY X-MAS 🎄',
        text_color: '#FFFFFF',
        effect: 'blink',
        speed: 1921,
        font_family: 'serif',
        font_size: 100,
        special_effect: 'confetti'
      },
      {
        bg_color: '#7F1D1D',
        text: '새해 복 많이 받으세요 🌅',
        text_color: '#FDE047',
        effect: 'none',
        speed: 1000,
        font_family: 'sans-thick',
        font_size: 100,
        special_effect: 'stars'
      }
    ]
  },
  {
    id: 'store',
    label: '매장/안내',
    icon: '',
    presets: [
      {
        bg_color: '#064E3B',
        text: '영업중 OPEN ☕',
        text_color: '#FDE047',
        effect: 'none',
        speed: 1000,
        font_family: 'sans-thick',
        font_size: 100,
        special_effect: 'none'
      },
      {
        bg_color: '#0F172A',
        text: '문 열었습니다 들어오세요 🚪',
        text_color: '#FFFFFF',
        effect: 'none',
        speed: 1000,
        font_family: 'sans-thick',
        font_size: 100,
        special_effect: 'none'
      },
      {
        bg_color: '#7F1D1D',
        text: '재료 소진 CLOSE 🌙',
        text_color: '#FFFFFF',
        effect: 'none',
        speed: 1000,
        font_family: 'sans-thick',
        font_size: 100,
        special_effect: 'none'
      },
      {
        bg_color: '#EF4444',
        text: '오늘만 1+1 행사! 🛍',
        text_color: '#FFFFFF',
        effect: 'blink',
        speed: 1921,
        font_family: 'sans-thick',
        font_size: 100,
        special_effect: 'none'
      },
      {
        bg_color: '#451A03',
        text: '아메리카노 2,000원 ☕',
        text_color: '#FFFFFF',
        effect: 'none',
        speed: 1000,
        font_family: 'sans-thick',
        font_size: 100,
        special_effect: 'none'
      },
      {
        bg_color: '#1E2937',
        text: 'WIFI: GLOW_WAVE 📶',
        text_color: '#FFFFFF',
        effect: 'marquee',
        speed: 14434,
        font_family: 'sans-thin',
        font_size: 100,
        special_effect: 'none'
      },
      {
        bg_color: '#1E3A8A',
        text: '주문은 여기서 해주세요 🔔',
        text_color: '#FFFFFF',
        effect: 'none',
        speed: 1000,
        font_family: 'sans-thick',
        font_size: 100,
        special_effect: 'none'
      },
      {
        bg_color: '#C2410C',
        text: '이곳에 대기해 주세요 🚶',
        text_color: '#FFFFFF',
        effect: 'none',
        speed: 1000,
        font_family: 'sans-thick',
        font_size: 100,
        special_effect: 'none'
      },
      {
        bg_color: '#451A03',
        text: '테이크아웃 10% 할인 🥤',
        text_color: '#FDE047',
        effect: 'marquee',
        speed: 14434,
        font_family: 'sans-thick',
        font_size: 100,
        special_effect: 'none'
      },
      {
        bg_color: '#000000',
        text: '외부 음식 반입 금지 🚫',
        text_color: '#EF4444',
        effect: 'none',
        speed: 1000,
        font_family: 'sans-thick',
        font_size: 100,
        special_effect: 'none'
      },
      {
        bg_color: '#1E2937',
        text: '잠시 준비 중입니다 ⏳',
        text_color: '#F59E0B',
        effect: 'none',
        speed: 1000,
        font_family: 'sans-thin',
        font_size: 100,
        special_effect: 'none'
      }
    ]
  }
];
