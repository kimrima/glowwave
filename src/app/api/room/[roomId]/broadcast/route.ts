import { NextResponse } from 'next/server';
import { localDb } from '@/lib/localDb';
import { Preset } from '@/lib/types';

export async function POST(
  request: Request,
  { params }: { params: any }
) {
  try {
    const resolvedParams = await params;
    const roomId = (resolvedParams.roomId as string).toUpperCase();
    
    const body = await request.json();
    const { host_session_token, preset } = body as {
      host_session_token: string;
      preset: Preset;
    };

    const room = localDb.getRoom(roomId);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Secure token matching to authenticate host authorization
    if (room.host_session_token !== host_session_token) {
      return NextResponse.json({ error: 'Unauthorized host token' }, { status: 401 });
    }

    if (!preset || !preset.bg_color || !preset.text) {
      return NextResponse.json({ error: 'Invalid preset data' }, { status: 400 });
    }

    // Save state in DB/memory
    localDb.setCurrentState(roomId, preset);

    // Broadcast update to all client streams
    localDb.broadcastEvent(roomId, {
      event: 'render',
      payload: preset,
    });

    return NextResponse.json({ success: true, state: preset });
  } catch (error) {
    console.error('Broadcast error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
