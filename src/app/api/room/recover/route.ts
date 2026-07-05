import { NextResponse } from 'next/server';
import { localDb } from '@/lib/localDb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
    }

    // Recover rooms using getRoomsByEmail
    const rooms = await localDb.getRoomsByEmail(email);

    return NextResponse.json({
      rooms: rooms.map(room => ({
        room_id: room.id,
        host_session_token: room.host_session_token,
        email: room.email,
        tier: room.tier,
        status: room.status,
        created_at: room.created_at,
      }))
    });
  } catch (error) {
    console.error('Room recovery error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
