export type EffectType = 'none' | 'blink' | 'marquee' | 'countdown' | 'luckydraw' | 'luckydraw_wait';

export interface Preset {
  bg_color: string;
  text: string;
  text_color: string;
  effect: EffectType;
  speed: number; // Duration in milliseconds or scroll speed indicator
  font_size?: number; // Font size multiplier percentage (30 to 100)
  font_family?: 'sans-thin' | 'sans-thick' | 'serif' | 'neon' | 'pixel' | 'plump';
  countdown_seconds?: number;
  result_text?: string;
  trigger_id?: string;
  bg_color_secondary?: string; // For duo-color flashing
  lucky_draw_winner_id?: string; // Persistent UUID of the winner (backward compatible)
  lucky_draw_winner_ids?: string[]; // Multiple winner UUIDs
  lucky_draw_count?: number; // Desired number of winners
  special_effect?: 'none' | 'hearts' | 'confetti' | 'stars';
  blackout?: boolean;
  locale?: string;
}

export type TierType = 'free' | 'lite' | 'pro' | 'max' | 'store' | 'store_annual';

export interface TierConfig {
  name: string;
  maxParticipants: number;
  priceKrw: number;
  priceUsd: number;
  description: string;
}

export const TIER_CONFIGS: Record<TierType, TierConfig> = {
  free: {
    name: 'Free (무료체험)',
    maxParticipants: 15,
    priceKrw: 0,
    priceUsd: 0.00,
    description: '15명 이하 소규모 이벤트용 무료방 (2시간 제한)',
  },
  lite: {
    name: '기본형 (Lite)',
    maxParticipants: 60,
    priceKrw: 5000,
    priceUsd: 3.99,
    description: '60명 이하 버스킹 및 소규모 세션 전용',
  },
  pro: {
    name: '프리미엄 (Pro)',
    maxParticipants: 250,
    priceKrw: 25000,
    priceUsd: 19.99,
    description: '250명 이하 야외 클럽, 스포츠 응원 전용',
  },
  max: {
    name: '맥스형 (Max)',
    maxParticipants: 800,
    priceKrw: 50000,
    priceUsd: 39.99,
    description: '800명 이하 대규모 플래시몹, 대형 강연 전용',
  },
  store: {
    name: '매장 전용 요금제 (월간)',
    maxParticipants: 3,
    priceKrw: 4900,
    priceUsd: 3.99,
    description: '1인 매장용 실시간 원격 전광판 (월간 구독)',
  },
  store_annual: {
    name: '매장 전용 요금제 (연간)',
    maxParticipants: 3,
    priceKrw: 39000,
    priceUsd: 29.99,
    description: '1인 매장용 실시간 원격 전광판 (연간 38% 할인)',
  },
};

export const getLocalizedPrice = (tier: TierType, locale: string): string => {
  if (tier === 'free') {
    switch (locale) {
      case 'ko': return '무료';
      case 'ja': return '無料';
      case 'es': return 'Gratis';
      case 'zh-TW':
      case 'zh-HK': return '免費';
      default: return 'Free';
    }
  }

  const prices: Record<Exclude<TierType, 'free'>, Record<string, string>> = {
    lite: {
      ko: '5,000원',
      en: '$3.99 USD',
      ja: '¥600 JPY',
      es: '$3.99 USD',
      'zh-TW': 'NT$ 130 TWD',
      'zh-HK': 'HK$ 30 HKD',
    },
    pro: {
      ko: '25,000원',
      en: '$19.99 USD',
      ja: '¥3,000 JPY',
      es: '$19.99 USD',
      'zh-TW': 'NT$ 650 TWD',
      'zh-HK': 'HK$ 150 HKD',
    },
    max: {
      ko: '50,000원',
      en: '$39.99 USD',
      ja: '¥6,000 JPY',
      es: '$39.99 USD',
      'zh-TW': 'NT$ 1,300 TWD',
      'zh-HK': 'HK$ 300 HKD',
    },
    store: {
      ko: '4,900원/월',
      en: '$3.99/mo',
      ja: '¥600/月',
      es: '$3.99/mes',
      'zh-TW': 'NT$ 130/月',
      'zh-HK': 'HK$ 30/月',
    },
    store_annual: {
      ko: '39,000원/년',
      en: '$29.99/yr',
      ja: '¥4,500/年',
      es: '$29.99/año',
      'zh-TW': 'NT$ 990/年',
      'zh-HK': 'HK$ 230/年',
    }
  };

  const localeKey = ['ko', 'en', 'ja', 'es', 'zh-TW', 'zh-HK'].includes(locale) ? locale : 'en';
  return prices[tier][localeKey] || prices[tier]['en'];
};

export const getLocalizedTierName = (tier: TierType, locale: string): string => {
  const names: Record<TierType, Record<string, string>> = {
    free: {
      ko: '무료 플랜 (Free)',
      en: 'Free Plan',
      ja: '無料プラン (Free)',
      es: 'Plan Gratuito',
      'zh-TW': '免費方案 (Free)',
      'zh-HK': '免費方案 (Free)',
    },
    lite: {
      ko: '기본형 (Lite)',
      en: 'Lite Plan',
      ja: 'ライトプラン (Lite)',
      es: 'Plan Lite',
      'zh-TW': '基本型方案 (Lite)',
      'zh-HK': '基本型方案 (Lite)',
    },
    pro: {
      ko: '프리미엄 (Pro)',
      en: 'Pro Plan',
      ja: 'プロプラン (Pro)',
      es: 'Plan Pro',
      'zh-TW': '進階方案 (Pro)',
      'zh-HK': '進階方案 (Pro)',
    },
    max: {
      ko: '맥스형 (Max)',
      en: 'Max Plan',
      ja: 'マックスプラン (Max)',
      es: 'Plan Max',
      'zh-TW': '極致方案 (Max)',
      'zh-HK': '極致方案 (Max)',
    },
    store: {
      ko: '매장용 월간 (Store Monthly)',
      en: 'Store Signage Monthly',
      ja: '店舗用月間 (Store Monthly)',
      es: 'Letrero Mensual (Tienda)',
      'zh-TW': '店家看板月方案',
      'zh-HK': '店家看板月方案',
    },
    store_annual: {
      ko: '매장용 연간 (Store Annual)',
      en: 'Store Signage Annual',
      ja: '店舗用年間 (Store Annual)',
      es: 'Letrero Anual (Tienda)',
      'zh-TW': '店家看板年方案',
      'zh-HK': '店家看板年方案',
    },
  };
  const localeKey = ['ko', 'en', 'ja', 'es', 'zh-TW', 'zh-HK'].includes(locale) ? locale : 'en';
  return names[tier][localeKey] || names[tier]['en'];
};



export interface Room {
  id: string;
  host_session_token: string;
  email: string;
  tier: TierType;
  status: 'active' | 'inactive';
  max_participants: number;
  current_participants?: number;
  created_at: string;
  passcode?: string;
  active_clients?: number;
  locale?: string;
  expires_at?: string;
  mail_sent_at?: string;
}

export interface Payment {
  id: string;
  email: string;
  host_session_token: string;
  room_id: string;
  tier: TierType;
  amount: number;
  payment_status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

export interface SignalPayload {
  event: 'render';
  payload: Preset;
}

export interface Coupon {
  code: string;
  discount_pct: number;
  is_active: boolean;
  max_uses: number;
  used_count: number;
  created_at: string;
}

export interface FunnelLog {
  step: 'step1_landing' | 'step2_create' | 'step3_view_upgrade' | 'step4_payment_success';
  created_at: string;
}

export interface CSInquiry {
  id?: number;
  room_id?: string;
  email: string;
  category: 'refund' | 'recovery' | 'bug' | 'etc';
  message: string;
  status: 'pending' | 'resolved';
  created_at: string;
}
