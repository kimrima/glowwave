import { NextResponse } from 'next/server';
import { localDb } from '@/lib/localDb';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

function generateRandomRoomId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(request: Request) {
  try {
    const { roomId, hostSessionToken } = await request.json() as { roomId: string; hostSessionToken: string };

    if (!roomId || !hostSessionToken) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // 1. Get room and verify host token
    const room = await localDb.getRoom(roomId);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (room.host_session_token !== hostSessionToken) {
      return NextResponse.json({ error: 'Unauthorized host token' }, { status: 401 });
    }

    // 2. Generate new unique roomId
    let newRoomId = generateRandomRoomId();
    let attempts = 0;
    while ((await localDb.getRoom(newRoomId)) && attempts < 100) {
      newRoomId = generateRandomRoomId();
      attempts++;
    }

    // 3. Broadcast force_disconnect to eject existing participants BEFORE updating ID
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.channel(`room_${roomId}`).send({
          type: 'broadcast',
          event: 'force_disconnect',
          payload: {}
        });
      } catch (err) {
        console.error('[API regenerate-id] Failed Supabase broadcast:', err);
      }
    }

    // Broadcast through local SSE handler too
    try {
      await fetch(`${new URL(request.url).origin}/api/room/${roomId}/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'force_disconnect', payload: {} })
      });
    } catch (err) {
      console.warn('[API regenerate-id] Failed SSE broadcast fallback:', err);
    }

    // 4. Perform room ID renewal in DB
    if (isSupabaseConfigured() && supabase) {
      // update rooms table primary key
      const { error: roomErr } = await supabase
        .from('rooms')
        .update({ id: newRoomId })
        .eq('id', roomId);
        
      if (roomErr) {
        console.error('[API regenerate-id] Supabase rename room error:', roomErr);
        return NextResponse.json({ error: 'Failed to rename room ID in database' }, { status: 500 });
      }

      // Sync payments room_id if exist
      await supabase
        .from('payments')
        .update({ room_id: newRoomId })
        .eq('room_id', roomId);
    } else {
      // Local Memory DB rename logic
      localDb.loadFromDisk();
      const cachedRoom = localDb.rooms.get(roomId);
      if (cachedRoom) {
        cachedRoom.id = newRoomId;
        localDb.rooms.delete(roomId);
        localDb.rooms.set(newRoomId, cachedRoom);

        // Migrate current broadcast state
        const cachedState = localDb.currentStates.get(roomId);
        if (cachedState) {
          localDb.currentStates.delete(roomId);
          localDb.currentStates.set(newRoomId, cachedState);
        }

        // Migrate payments reference if any
        localDb.payments.forEach(p => {
          if (p.room_id === roomId) {
            p.room_id = newRoomId;
          }
        });

        localDb.saveToDisk();
      } else {
        return NextResponse.json({ error: 'Failed to update local cache' }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      old_room_id: roomId,
      new_room_id: newRoomId
    });

  } catch (error) {
    console.error('Room ID regeneration error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
