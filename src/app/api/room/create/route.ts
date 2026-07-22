import { NextResponse } from 'next/server';
import { localDb } from '@/lib/localDb';
import { TierType, TIER_CONFIGS } from '@/lib/types';

// IP-based creation time tracking map (Memory Cache for simple rate limiting)
const syncRoomCreateLimitMap = new Map<string, number[]>();
const MAX_SYNC_CREATIONS_PER_MINUTE = 3;

// IP-based active 1-person sync room tracking map
const activeSyncRoomsByIp = new Map<string, { roomId: string; expiresAt: number }>();

function generateRoomId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, tier, passcode, created_at } = body as { email: string; tier: TierType; passcode?: string; created_at?: string };

    if (!email || !tier || !TIER_CONFIGS[tier]) {
      return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 });
    }

    const isSync = (body as any).is_sync || email === 'anonymous-local@glowwave.app';

    // IP-based Rate Limiter for Anonymous 1-Person Sync Rooms (DDoS Spam Guard)
    if (isSync) {
      const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
      const now = Date.now();
      const userHistory = syncRoomCreateLimitMap.get(ip) || [];
      const activeHistory = userHistory.filter(timestamp => now - timestamp < 60 * 1000);
      
      if (activeHistory.length >= MAX_SYNC_CREATIONS_PER_MINUTE) {
        return NextResponse.json({
          error: '단시간에 너무 많은 1인 체험방이 생성되었습니다. 잠시 후(1분 뒤) 다시 시도해 주세요.'
        }, { status: 429 });
      }
      
      activeHistory.push(now);
      syncRoomCreateLimitMap.set(ip, activeHistory);

      // Block multiple concurrent 1-person sync rooms for the same IP (1 room per IP max)
      const activeRoom = activeSyncRoomsByIp.get(ip);
      if (activeRoom && activeRoom.expiresAt > now) {
        return NextResponse.json({
          error: '이미 활성화된 1인 체험방이 존재합니다. 기존 방의 만료 시간(1시간)이 지난 후에 새로운 무료 방을 개설할 수 있습니다.'
        }, { status: 429 });
      }
    }

    // Block multiple concurrent free room creations for the same email address
    if (tier === 'free' && email !== 'anonymous-local@glowwave.app') {
      const existingRooms = await localDb.getRoomsByEmail(email);
      const activeFreeRooms = existingRooms.filter(
        r => r.tier === 'free' && r.status === 'active' && !r.id.startsWith('SYNC-')
      );
      if (activeFreeRooms.length > 0) {
        return NextResponse.json({
          error: '이미 활성화된 다인용 Free 플랜 방이 존재합니다. 기존 방의 만료 시간(3시간)이 지난 후에 새로운 무료 방을 개설할 수 있습니다.'
        }, { status: 429 });
      }
    }

    const hostSessionToken = crypto.randomUUID();
    const generateTargetRoomId = (): string => {
      if (isSync) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 4; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return `SYNC-${result}`;
      }
      return generateRoomId();
    };

    let roomId = generateTargetRoomId();

    // Prevent collision
    let attempts = 0;
    while ((await localDb.getRoom(roomId)) && attempts < 100) {
      roomId = generateTargetRoomId();
      attempts++;
    }

    // Create room
    const room = await localDb.createRoom(roomId, email, tier, hostSessionToken, passcode, created_at);
    
    // Set status based on Tier. Paid tiers start as 'inactive' until payment success
    if (tier !== 'free') {
      room.status = 'inactive';
      const config = TIER_CONFIGS[tier];
      // Log payment record in DB
      await localDb.addPayment(email, hostSessionToken, roomId, tier, config.priceKrw, 'pending');
    }

    if (isSync) {
      const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
      activeSyncRoomsByIp.set(ip, {
        roomId: room.id,
        expiresAt: Date.now() + 1 * 60 * 60 * 1000 // 1 hour
      });
    }

    return NextResponse.json({
      room_id: room.id,
      host_session_token: room.host_session_token,
      email: room.email,
      tier: room.tier,
      status: room.status,
      max_participants: room.max_participants,
    });
  } catch (error) {
    console.error('Room create error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
