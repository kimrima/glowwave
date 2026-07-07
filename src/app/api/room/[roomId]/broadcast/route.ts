import { NextResponse } from 'next/server';
import { localDb } from '@/lib/localDb';
import { Preset } from '@/lib/types';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

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

    const room = await localDb.getRoom(roomId);
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
    await localDb.setCurrentState(roomId, preset);

    // Broadcast update to all client streams
    localDb.broadcastEvent(roomId, {
      event: 'render',
      payload: preset,
    });

    // Forward to Supabase Realtime channel if configured
    const client = supabase;
    if (isSupabaseConfigured() && client) {
      // Fire-and-forget background execution to avoid blocking the API response
      new Promise<void>((resolve) => {
        try {
          const channel = client.channel(`room_${roomId}`);
          channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              await channel.send({
                type: 'broadcast',
                event: 'render',
                payload: preset,
              });
              client.removeChannel(channel);
              resolve();
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              resolve();
            }
          });
          setTimeout(resolve, 800);
        } catch (supaErr) {
          console.error('[Broadcast API] Failed to forward broadcast to Supabase:', supaErr);
          resolve();
        }
      });
    }

    return NextResponse.json({ success: true, state: preset });
  } catch (error) {
    console.error('Broadcast error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

