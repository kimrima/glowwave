import { NextRequest, NextResponse } from 'next/server';
import { getAdminTokenFromRequest, verifyAdminToken } from '@/lib/adminAuth';
import { localDb } from '@/lib/localDb';

export async function POST(request: NextRequest) {
  try {
    const token = getAdminTokenFromRequest(request);
    if (!verifyAdminToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { roomId, roomIds } = body as { roomId?: string; roomIds?: string[] };

    const targets = roomIds || (roomId ? [roomId] : []);

    if (targets.length === 0) {
      return NextResponse.json({ error: 'Missing roomId or roomIds' }, { status: 400 });
    }

    let deletedCount = 0;
    for (const targetId of targets) {
      // Broadcast room expired event to immediately terminate spectator connection streams
      localDb.broadcastEvent(targetId, { event: 'room_expired', room_id: targetId });

      // Close any active SSE server stream controllers
      const activeClients = localDb.clients.get(targetId);
      if (activeClients) {
        activeClients.forEach((client) => {
          try {
            client.controller.close();
          } catch (err) {}
        });
        localDb.clients.delete(targetId);
      }

      const success = await localDb.deleteRoom(targetId);
      if (success) deletedCount++;
    }

    if (deletedCount === 0) {
      return NextResponse.json({ error: 'No rooms were deleted' }, { status: 404 });
    }

    return NextResponse.json({ success: true, deletedCount });
  } catch (error) {
    console.error('[Admin Delete Room] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
