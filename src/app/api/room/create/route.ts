import { NextResponse } from 'next/server';
import { localDb } from '@/lib/localDb';
import { TierType, TIER_CONFIGS } from '@/lib/types';

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
    const { email, tier } = body as { email: string; tier: TierType };

    if (!email || !tier || !TIER_CONFIGS[tier]) {
      return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 });
    }

    const hostSessionToken = crypto.randomUUID();
    let roomId = generateRoomId();

    // Prevent collision
    let attempts = 0;
    while (localDb.getRoom(roomId) && attempts < 100) {
      roomId = generateRoomId();
      attempts++;
    }

    // Create room
    const room = localDb.createRoom(roomId, email, tier, hostSessionToken);
    
    // Set status based on Tier. Paid tiers start as 'inactive' until payment success
    if (tier !== 'free') {
      room.status = 'inactive';
      const config = TIER_CONFIGS[tier];
      // Log payment record in DB
      localDb.addPayment(email, hostSessionToken, roomId, tier, config.priceKrw, 'pending');
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
