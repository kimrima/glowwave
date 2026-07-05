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
    const { roomId } = body as { roomId: string };

    if (!roomId) {
      return NextResponse.json({ error: 'Missing roomId' }, { status: 400 });
    }

    // Broadcast room expired event to immediately terminate spectator connection streams
    localDb.broadcastEvent(roomId, { event: 'room_expired', room_id: roomId });

    // Close any active SSE server stream controllers
    const activeClients = localDb.clients.get(roomId);
    if (activeClients) {
      activeClients.forEach((client) => {
        try {
          client.controller.close();
        } catch (err) {}
      });
      localDb.clients.delete(roomId);
    }

    const success = await localDb.deleteRoom(roomId);
    if (!success) {
      return NextResponse.json({ error: 'Room not found or delete failed' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Admin Delete Room] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
