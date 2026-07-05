import { NextRequest, NextResponse } from 'next/server';
import { getAdminTokenFromRequest, verifyAdminToken } from '@/lib/adminAuth';
import { localDb } from '@/lib/localDb';

export async function GET(request: NextRequest) {
  try {
    const token = getAdminTokenFromRequest(request);
    if (!verifyAdminToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rooms = await localDb.getAllRooms();
    const payments = await localDb.getAllPayments();

    const roomsWithCounts = rooms.map(room => ({
      ...room,
      active_clients: localDb.getClientCount(room.id)
    }));

    return NextResponse.json({
      success: true,
      rooms: roomsWithCounts,
      payments
    });
  } catch (error) {
    console.error('[Admin Data API] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
