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
    icon: '',
    presets: [
      {
        bg_color: '#E11D48',
        text: '앵콜 한 번 더',
        text_color: '#FFFFFF',
        effect: 'blink',
        speed: 1000,
        font_family: 'plump',
        font_size: 100,
        special_effect: 'confetti'
      },
      {
        bg_color: '#EA580C',
        text: '오늘 무대 찢었다',
        text_color: '#FFFFFF',
        effect: 'blink',
        speed: 1000,
        font_family: 'sans-thick',
        font_size: 100,
        special_effect: 'stars'
      },
      {
        bg_color: '#4C1D95',
        text: '귀호강 고막 힐링',
        text_color: '#FFFFFF',
        effect: 'none',
        speed: 1000,
        font_family: 'serif',
        font_size: 100,
        special_effect: 'stars'
      },
      {
        bg_color: '#A78BFA',
        text: '평생 노래해줘',
        text_color: '#FFFFFF',
        effect: 'none',
        speed: 1000,
        font_family: 'sans-thin',
        font_size: 100,
        special_effect: 'hearts'
      },
      {
        bg_color: '#06B6D4',
        text: '음색 깡패 라이브',
        text_color: '#FFFFFF',
        effect: 'marquee',
        speed: 8000,
        font_family: 'sans-thick',
        font_size: 100,
        special_effect: 'stars'
      },
      {
        bg_color: '#F59E0B',
        text: '앵콜 앵콜',
        text_color: '#FFFFFF',
        effect: 'blink',
        speed: 1200,
        font_family: 'plump',
        font_size: 100,
        special_effect: 'confetti'
      }
    ]
  },
  {
    id: 'sports',
    label: '스포츠/응원',
    icon: '',
    presets: [
      {
        bg_color: '#D01C1C',
        text: '대 한 민 국',
        text_color: '#FFFFFF',
        effect: 'blink',
        speed: 1000,
        font_family: 'sans-thick',
        font_size: 100,
        special_effect: 'confetti'
      },
      {
        bg_color: '#C70125',
        text: '무적 LG',
        text_color: '#FFFFFF',
        effect: 'blink',
        speed: 1000,
        font_family: 'sans-thick',
        font_size: 100,
        special_effect: 'stars'
      },
      {
        bg_color: '#D61C2C',
        text: '최강 기아',
        text_color: '#FFCC00',
        effect: 'blink',
        speed: 1000,
        font_family: 'sans-thick',
        font_size: 100,
        special_effect: 'stars'
      },
      {
        bg_color: '#F97316',
        text: '최강 한화',
        text_color: '#FFFFFF',
        effect: 'blink',
        speed: 1000,
        font_family: 'sans-thick',
        font_size: 100,
        special_effect: 'stars'
      },
      {
        bg_color: '#065F46',
        text: '날려라 홈런',
        text_color: '#FFFFFF',
        effect: 'marquee',
        speed: 8000,
        font_family: 'plump',
        font_size: 100,
        special_effect: 'confetti'
      },
      {
        bg_color: '#1D4ED8',
        text: '할 수 있다 화이팅',
        text_color: '#00FFCC',
        effect: 'marquee',
        speed: 10000,
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
        text: 'DANCE TIME',
        text_color: '#00FFCC',
        effect: 'blink',
        speed: 500,
        font_family: 'neon',
        font_size: 100,
        special_effect: 'confetti'
      },
      {
        bg_color: '#EC4899',
        text: '소리 질러',
        text_color: '#FFFFFF',
        effect: 'blink',
        speed: 800,
        font_family: 'plump',
        font_size: 100,
        special_effect: 'confetti'
      },
      {
        bg_color: '#1E1B4B',
        text: '오늘 밤 주인공',
        text_color: '#F472B6',
        effect: 'marquee',
        speed: 8000,
        font_family: 'neon',
        font_size: 100,
        special_effect: 'stars'
      },
      {
        bg_color: '#D97706',
        text: '치어스 잔을 들어라',
        text_color: '#FFFFFF',
        effect: 'blink',
        speed: 1200,
        font_family: 'plump',
        font_size: 100,
        special_effect: 'confetti'
      },
      {
        bg_color: '#EA580C',
        text: '텐션 올려',
        text_color: '#FFFFFF',
        effect: 'blink',
        speed: 800,
        font_family: 'sans-thick',
        font_size: 100,
        special_effect: 'confetti'
      },
      {
        bg_color: '#06B6D4',
        text: 'PARTY TONIGHT',
        text_color: '#FFFFFF',
        effect: 'marquee',
        speed: 8000,
        font_family: 'neon',
        font_size: 100,
        special_effect: 'stars'
      }
    ]
  },
  {
    id: 'anniversary',
    label: '기념일/이벤트',
    icon: '',
    presets: [
      {
        bg_color: '#F472B6',
        text: '생일 축하해',
        text_color: '#FFFFFF',
        effect: 'blink',
        speed: 1500,
        font_family: 'plump',
        font_size: 100,
        special_effect: 'confetti'
      },
      {
        bg_color: '#FBCFE8',
        text: '꽃길만 걷자',
        text_color: '#DB2777',
        effect: 'none',
        speed: 1000,
        font_family: 'serif',
        font_size: 100,
        special_effect: 'hearts'
      },
      {
        bg_color: '#991B1B',
        text: '평생 함께하자',
        text_color: '#FFFFFF',
        effect: 'none',
        speed: 1000,
        font_family: 'serif',
        font_size: 100,
        special_effect: 'hearts'
      },
      {
        bg_color: '#E0F2FE',
        text: '결혼해줄래',
        text_color: '#0369A1',
        effect: 'none',
        speed: 1000,
        font_family: 'serif',
        font_size: 100,
        special_effect: 'hearts'
      },
      {
        bg_color: '#FDA4AF',
        text: '감사하고 사랑합니다',
        text_color: '#BE123C',
        effect: 'none',
        speed: 1000,
        font_family: 'serif',
        font_size: 100,
        special_effect: 'hearts'
      },
      {
        bg_color: '#5B21B6',
        text: '영원히 기억할 오늘',
        text_color: '#FBBF24',
        effect: 'marquee',
        speed: 10000,
        font_family: 'sans-thin',
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
        text: '영업중 OPEN',
        text_color: '#FEF08A',
        effect: 'none',
        speed: 1000,
        font_family: 'sans-thick',
        font_size: 100,
        special_effect: 'none'
      },
      {
        bg_color: '#451A03',
        text: '테이크아웃 할인',
        text_color: '#FAFAF9',
        effect: 'marquee',
        speed: 10000,
        font_family: 'sans-thick',
        font_size: 100,
        special_effect: 'none'
      },
      {
        bg_color: '#1E3A8A',
        text: '주문은 여기서',
        text_color: '#FFFFFF',
        effect: 'none',
        speed: 1000,
        font_family: 'sans-thick',
        font_size: 100,
        special_effect: 'none'
      },
      {
        bg_color: '#1F2937',
        text: 'WIFI 비밀번호',
        text_color: '#FFFFFF',
        effect: 'marquee',
        speed: 10000,
        font_family: 'sans-thin',
        font_size: 100,
        special_effect: 'none'
      },
      {
        bg_color: '#78350F',
        text: '준비 중입니다',
        text_color: '#FFFFFF',
        effect: 'none',
        speed: 1000,
        font_family: 'sans-thin',
        font_size: 100,
        special_effect: 'none'
      },
      {
        bg_color: '#C2410C',
        text: '대기 라인 안내',
        text_color: '#FFFFFF',
        effect: 'marquee',
        speed: 9000,
        font_family: 'sans-thick',
        font_size: 100,
        special_effect: 'none'
      }
    ]
  }
];
