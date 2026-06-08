import { NextResponse } from 'next/server';
import { localDb } from '@/lib/localDb';
import { TierType, TIER_CONFIGS } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { room_id, host_session_token, new_tier } = body as {
      room_id: string;
      host_session_token: string;
      new_tier: TierType;
    };

    if (!room_id || !host_session_token || !new_tier || !TIER_CONFIGS[new_tier]) {
      return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 });
    }

    const room = await localDb.getRoom(room_id);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Verify host token match
    if (room.host_session_token !== host_session_token) {
      return NextResponse.json({ error: 'Unauthorized host token' }, { status: 401 });
    }

    // Perform upgrade
    const success = await localDb.upgradeRoomTier(room_id, new_tier);
    if (!success) {
      return NextResponse.json({ error: 'Failed to upgrade room tier' }, { status: 500 });
    }

    // Add payment log (upgrades are simulated completed immediately)
    const config = TIER_CONFIGS[new_tier];
    await localDb.addPayment(
      room.email,
      host_session_token,
      room_id,
      new_tier,
      config.priceKrw,
      'completed'
    );

    // Broadcast a capacity notice to active spectator client streams
    localDb.broadcastEvent(room_id, {
      event: 'capacity_updated',
      tier: new_tier,
      max_participants: config.maxParticipants,
    });

    console.log(`[Room Upgrade] Room ${room_id} has been upgraded to ${new_tier} successfully.`);

    return NextResponse.json({
      success: true,
      tier: new_tier,
      max_participants: config.maxParticipants,
    });
  } catch (error) {
    console.error('Room upgrade error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
