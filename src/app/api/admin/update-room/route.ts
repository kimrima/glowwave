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
    const { roomId, tier, status, max_participants } = body as {
      roomId: string;
      tier?: TierType;
      status?: 'active' | 'inactive';
      max_participants?: number;
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
      
      // Allow overriding max participants (e.g. Free 15) or default to config
      const maxParts = max_participants !== undefined ? max_participants : TIER_CONFIGS[tier].maxParticipants;
      updates.max_participants = maxParts;

      // Auto-recalculate expires_at when administrator changes the tier
      let durationMs = 24 * 60 * 60 * 1000;
      if (tier === 'free') durationMs = 6 * 60 * 60 * 1000;
      else if (tier === 'store') durationMs = 30 * 24 * 60 * 60 * 1000;
      else if (tier === 'store_annual') durationMs = 365 * 24 * 60 * 60 * 1000;
      updates.expires_at = new Date(Date.now() + durationMs).toISOString();

      // Broadcast update event to active spectator client streams
      localDb.broadcastEvent(roomId, {
        event: 'capacity_updated',
        tier,
        max_participants: maxParts,
      });
    } else if (max_participants !== undefined) {
      updates.max_participants = max_participants;
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
