export type EffectType = 'none' | 'blink' | 'marquee' | 'countdown' | 'luckydraw' | 'luckydraw_wait';

export interface Preset {
  bg_color: string;
  text: string;
  text_color: string;
  effect: EffectType;
  speed: number; // Duration in milliseconds or scroll speed indicator
  font_size?: number; // Font size multiplier percentage (30 to 100)
  font_family?: 'sans-thin' | 'sans-thick' | 'serif' | 'neon';
  countdown_seconds?: number;
  result_text?: string;
  trigger_id?: string;
  bg_color_secondary?: string; // For duo-color flashing
  lucky_draw_winner_id?: string; // Persistent UUID of the winner
}

export type TierType = 'free' | 'lite' | 'pro' | 'max';

export interface TierConfig {
  name: string;
  maxParticipants: number;
  priceKrw: number;
  priceUsd: number;
  description: string;
}

export const TIER_CONFIGS: Record<TierType, TierConfig> = {
  free: {
    name: 'Free (테스트)',
    maxParticipants: 20,
    priceKrw: 0,
    priceUsd: 0.00,
    description: '20명 이하 소규모 테스트 이벤트 전용',
  },
  lite: {
    name: '기본형 (Lite)',
    maxParticipants: 100,
    priceKrw: 5000,
    priceUsd: 3.99,
    description: '100명 이하 버스킹 및 소규모 세션 전용',
  },
  pro: {
    name: '프리미엄 (Pro)',
    maxParticipants: 500,
    priceKrw: 25000,
    priceUsd: 19.99,
    description: '500명 이하 야외 클럽, 스포츠 응원 전용',
  },
  max: {
    name: '맥스형 (Max)',
    maxParticipants: 2000,
    priceKrw: 50000,
    priceUsd: 39.99,
    description: '2000명 이하 대규모 플래시몹, 대형 강연 전용',
  },
};

export interface Room {
  id: string;
  host_session_token: string;
  email: string;
  tier: TierType;
  status: 'active' | 'inactive';
  max_participants: number;
  created_at: string;
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
