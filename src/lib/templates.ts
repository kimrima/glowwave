import { Preset } from './types';

export interface TemplateCategory {
  id: 'busking' | 'sports' | 'party' | 'anniversary' | 'store';
  label: string;
  icon: string;
  presets: Preset[];
}

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  {
    id: 'busking',
    label: '공연/버스킹',
    icon: '🎸',
    presets: [
      {
        bg_color: '#FF0055',
        text: '앵콜! 앵콜! 🎸',
        text_color: '#FFFFFF',
        effect: 'blink',
        speed: 600,
        font_family: 'neon',
        font_size: 100,
        special_effect: 'hearts'
      },
      {
        bg_color: '#4F46E5',
        text: '오늘 무대 최고! 🔥',
        text_color: '#FFD700',
        effect: 'none',
        speed: 1000,
        font_family: 'plump',
        font_size: 100,
        special_effect: 'stars'
      },
      {
        bg_color: '#2E1065',
        text: '귀호강 중.. 🎧',
        text_color: '#FFFFFF',
        effect: 'marquee',
        speed: 4000,
        font_family: 'sans-thick',
        font_size: 100,
        special_effect: 'stars'
      },
      {
        bg_color: '#DB2777',
        text: '완벽한 라이브 🎤',
        text_color: '#FFFFFF',
        effect: 'blink',
        speed: 1000,
        font_family: 'plump',
        font_size: 100,
        special_effect: 'hearts'
      },
      {
        bg_color: '#0D0D14',
        text: '사랑해요 ❤️',
        text_color: '#FFFFFF',
        effect: 'none',
        speed: 1000,
        font_family: 'serif',
        font_size: 100,
        special_effect: 'hearts'
      },
      {
        bg_color: '#F59E0B',
        text: '꿀보이스 녹아요 🍯',
        text_color: '#FFFFFF',
        effect: 'marquee',
        speed: 3500,
        font_family: 'sans-thin',
        font_size: 100,
        special_effect: 'stars'
      }
    ]
  },
  {
    id: 'sports',
    label: '스포츠/응원',
    icon: '⚽',
    presets: [
      {
        bg_color: '#EF4444',
        bg_color_secondary: '#3B82F6',
        text: '골이다!!! ⚽',
        text_color: '#FFFFFF',
        effect: 'blink',
        speed: 150,
        font_family: 'sans-thick',
        font_size: 100,
        special_effect: 'confetti'
      },
      {
        bg_color: '#D01C1C',
        text: '대~한민국! 짝짝!',
        text_color: '#FFFFFF',
        effect: 'blink',
        speed: 600,
        font_family: 'sans-thick',
        font_size: 100,
        special_effect: 'confetti'
      },
      {
        bg_color: '#065F46',
        text: '나이스 샷! 🏌️‍♂️',
        text_color: '#FFFFFF',
        effect: 'marquee',
        speed: 4000,
        font_family: 'neon',
        font_size: 100,
        special_effect: 'stars'
      },
      {
        bg_color: '#F97316',
        text: '끝까지 화이팅! 💪',
        text_color: '#FFFFFF',
        effect: 'none',
        speed: 1000,
        font_family: 'sans-thick',
        font_size: 100,
        special_effect: 'none'
      },
      {
        bg_color: '#0B0B0F',
        bg_color_secondary: '#00FF66',
        text: '역전 가자!!! ⚡',
        text_color: '#00FF66',
        effect: 'blink',
        speed: 300,
        font_family: 'neon',
        font_size: 100,
        special_effect: 'confetti'
      },
      {
        bg_color: '#1E293B',
        text: '수비! 수비! 🛡️',
        text_color: '#FFFFFF',
        effect: 'blink',
        speed: 500,
        font_family: 'sans-thick',
        font_size: 100,
        special_effect: 'none'
      }
    ]
  },
  {
    id: 'party',
    label: '페스티벌/파티',
    icon: '🎉',
    presets: [
      {
        bg_color: '#7C3AED',
        text: 'DANCE TIME ⚡',
        text_color: '#00FFCC',
        effect: 'blink',
        speed: 200,
        font_family: 'neon',
        font_size: 100,
        special_effect: 'confetti'
      },
      {
        bg_color: '#0B0B0F',
        text: "LET'S GET WILD! 🕶️",
        text_color: '#FFFFFF',
        effect: 'blink',
        speed: 400,
        font_family: 'neon',
        font_size: 100,
        special_effect: 'stars'
      },
      {
        bg_color: '#EC4899',
        bg_color_secondary: '#06B6D4',
        text: '소리 질러!!! 🙌',
        text_color: '#FFFFFF',
        effect: 'blink',
        speed: 250,
        font_family: 'sans-thick',
        font_size: 100,
        special_effect: 'confetti'
      },
      {
        bg_color: '#EA580C',
        text: '짠! 잔을 들어라! 🍻',
        text_color: '#FFFFFF',
        effect: 'blink',
        speed: 800,
        font_family: 'plump',
        font_size: 100,
        special_effect: 'confetti'
      },
      {
        bg_color: '#1E1B4B',
        text: '밤새 달려! 🌙',
        text_color: '#00FF66',
        effect: 'marquee',
        speed: 3000,
        font_family: 'neon',
        font_size: 100,
        special_effect: 'stars'
      },
      {
        bg_color: '#4C1D95',
        bg_color_secondary: '#DB2777',
        text: 'PARTY TONIGHT 🎉',
        text_color: '#FFFFFF',
        effect: 'blink',
        speed: 300,
        font_family: 'sans-thick',
        font_size: 100,
        special_effect: 'confetti'
      }
    ]
  },
  {
    id: 'anniversary',
    label: '기념일/이벤트',
    icon: '🎁',
    presets: [
      {
        bg_color: '#EC4899',
        text: 'HAPPY BIRTHDAY 🎂',
        text_color: '#FFFFFF',
        effect: 'blink',
        speed: 1200,
        font_family: 'plump',
        font_size: 100,
        special_effect: 'confetti'
      },
      {
        bg_color: '#F472B6',
        text: '나랑 결혼해줄래? 💍',
        text_color: '#FFFFFF',
        effect: 'none',
        speed: 1000,
        font_family: 'plump',
        font_size: 100,
        special_effect: 'hearts'
      },
      {
        bg_color: '#991B1B',
        text: '태어나줘서 고마워 ❤️',
        text_color: '#FFFFFF',
        effect: 'none',
        speed: 1000,
        font_family: 'serif',
        font_size: 100,
        special_effect: 'hearts'
      },
      {
        bg_color: '#EC4899',
        text: 'HAPPY 100 DAYS 🎉',
        text_color: '#FFFFFF',
        effect: 'blink',
        speed: 1000,
        font_family: 'plump',
        font_size: 100,
        special_effect: 'confetti'
      },
      {
        bg_color: '#FBCFE8',
        text: '꽃길만 걷자 🌸',
        text_color: '#DB2777',
        effect: 'marquee',
        speed: 4000,
        font_family: 'serif',
        font_size: 100,
        special_effect: 'hearts'
      },
      {
        bg_color: '#4C1D95',
        text: '너만 보인단 말야 👀',
        text_color: '#FFFFFF',
        effect: 'none',
        speed: 1000,
        font_family: 'plump',
        font_size: 100,
        special_effect: 'hearts'
      }
    ]
  },
  {
    id: 'store',
    label: '매장/안내',
    icon: '🛍️',
    presets: [
      {
        bg_color: '#064E3B',
        text: '영업 중 (OPEN) ☕',
        text_color: '#FFFFF0',
        effect: 'none',
        speed: 1000,
        font_family: 'serif',
        font_size: 100,
        special_effect: 'none'
      },
      {
        bg_color: '#451A03',
        text: '신메뉴 출시! 🥐',
        text_color: '#FFE4E6',
        effect: 'marquee',
        speed: 5000,
        font_family: 'serif',
        font_size: 100,
        special_effect: 'stars'
      },
      {
        bg_color: '#C2410C',
        text: '질서 유지 부탁드립니다',
        text_color: '#FFFFFF',
        effect: 'blink',
        speed: 1500,
        font_family: 'sans-thin',
        font_size: 100,
        special_effect: 'none'
      },
      {
        bg_color: '#1D4ED8',
        text: '잠시 대기해 주세요',
        text_color: '#FFFFFF',
        effect: 'none',
        speed: 1000,
        font_family: 'sans-thin',
        font_size: 100,
        special_effect: 'none'
      },
      {
        bg_color: '#0B0B0F',
        text: 'WIFI: GLOW_WAVE',
        text_color: '#FFFFFF',
        effect: 'marquee',
        speed: 4000,
        font_family: 'sans-thin',
        font_size: 100,
        special_effect: 'none'
      },
      {
        bg_color: '#115E59',
        text: '테이크아웃 10% 할인 🥤',
        text_color: '#FFFFFF',
        effect: 'marquee',
        speed: 3000,
        font_family: 'sans-thick',
        font_size: 100,
        special_effect: 'none'
      }
    ]
  }
];
