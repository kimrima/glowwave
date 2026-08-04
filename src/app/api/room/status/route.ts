import { NextResponse } from 'next/server';
import { localDb } from '@/lib/localDb';
import { isSupabaseConfigured } from '@/lib/supabase';

const normalizeRoomId = (id: string): string => {
  const trimmed = id.trim();
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  return trimmed.toUpperCase();
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');
    if (!idsParam) {
      return NextResponse.json({ rooms: [] });
    }

    const roomIds = idsParam
      .split(',')
      .map((id) => normalizeRoomId(id))
      .filter(Boolean);

    const dbConfigured = isSupabaseConfigured();
    const results = [];

    // Query rooms sequentially/concurrently but without triggering cleanupExpiredRooms globally N times
    const roomPromises = roomIds.map(async (roomId) => {
      try {
        const room = await localDb.getRoom(roomId);
        if (room) {
          return {
            room_id: room.id,
            tier: room.tier,
            status: room.status,
            max_participants: room.max_participants,
            current_participants: dbConfigured ? (room.current_participants || 0) : localDb.getClientCount(roomId),
            created_at: room.created_at,
            has_passcode: !!room.passcode,
          };
        } else {
          return {
            room_id: roomId,
            is_expired: true,
          };
        }
      } catch (err: any) {
        console.error(`[Batch Status API] Error checking room ${roomId}:`, err);
        return {
          room_id: roomId,
          error: true,
          details: err.message || String(err),
        };
      }
    });

    const resolvedRooms = await Promise.all(roomPromises);

    return NextResponse.json({
      rooms: resolvedRooms,
      supabase_configured: dbConfigured,
    });
  } catch (error: any) {
    console.error('[Batch Status API] Global check error:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      details: error.message || String(error),
    }, { status: 500 });
  }
}
