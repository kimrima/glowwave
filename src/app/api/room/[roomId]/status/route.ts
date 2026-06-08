import { NextResponse } from 'next/server';
import { localDb } from '@/lib/localDb';

export async function GET(
  request: Request,
  { params }: { params: any }
) {
  try {
    const resolvedParams = await params;
    const roomId = (resolvedParams.roomId as string).toUpperCase();

    const room = await localDb.getRoom(roomId);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    return NextResponse.json({
      room_id: room.id,
      tier: room.tier,
      status: room.status,
      max_participants: room.max_participants,
      current_participants: localDb.getClientCount(roomId),
      created_at: room.created_at,
    });
  } catch (error) {
    console.error('Room status check error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
