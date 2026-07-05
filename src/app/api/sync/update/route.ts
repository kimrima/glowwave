import { NextResponse } from 'next/server';
import { localDb } from '@/lib/localDb';
import { Preset } from '@/lib/types';

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { room_id, host_token, preset } = body as {
      room_id: string;
      host_token: string;
      preset: Preset;
    };

    if (!room_id || !host_token || !preset) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const room = await localDb.getRoom(room_id);
    if (!room) {
      return NextResponse.json({ error: 'Sync room not found' }, { status: 404 });
    }

    if (room.host_session_token !== host_token) {
      return NextResponse.json({ error: 'Unauthorized host token' }, { status: 401 });
    }

    await localDb.setCurrentState(room_id, preset);

    localDb.broadcastEvent(room_id, {
      event: 'render',
      payload: preset,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Sync update error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
