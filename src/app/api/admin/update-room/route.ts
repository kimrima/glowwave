import { NextRequest, NextResponse } from 'next/server';
import { getAdminTokenFromRequest, verifyAdminToken } from '@/lib/adminAuth';
import { localDb } from '@/lib/localDb';
import { TIER_CONFIGS, TierType } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const token = getAdminTokenFromRequest(request);
    if (!verifyAdminToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { roomId, tier, status } = body as {
      roomId: string;
      tier?: TierType;
      status?: 'active' | 'inactive';
    };

    if (!roomId) {
      return NextResponse.json({ error: 'Missing roomId' }, { status: 400 });
    }

    const updates: any = {};
    if (status) {
      updates.status = status;
    }
    if (tier) {
      if (!TIER_CONFIGS[tier]) {
        return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
      }
      updates.tier = tier;
      updates.max_participants = TIER_CONFIGS[tier].maxParticipants;

      // Broadcast update event to active spectator client streams
      localDb.broadcastEvent(roomId, {
        event: 'capacity_updated',
        tier,
        max_participants: TIER_CONFIGS[tier].maxParticipants,
      });
    }

    const success = await localDb.updateRoom(roomId, updates);
    if (!success) {
      return NextResponse.json({ error: 'Room not found or update failed' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Admin Update Room] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
