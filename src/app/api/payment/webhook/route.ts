import { NextResponse } from 'next/server';
import { localDb } from '@/lib/localDb';

// Simulates a third-party PG (Toss Payments / Stripe) serverless webhook callback
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { room_id, status } = body as { room_id: string; status: 'success' | 'failed' };

    if (!room_id) {
      return NextResponse.json({ error: 'Missing room_id' }, { status: 400 });
    }

    const targetRoom = await localDb.getRoom(room_id);
    if (!targetRoom) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (status === 'success') {
      await localDb.updatePaymentStatus(room_id, 'completed');
      
      // SSE broadcast to active client connections notifying room activation
      localDb.broadcastEvent(room_id, { event: 'room_activated', status: 'active' });
      
      console.log(`[PG Webhook] Room ${room_id} has been activated successfully.`);
      return NextResponse.json({ success: true, message: `Room ${room_id} activated.` });
    } else {
      await localDb.updatePaymentStatus(room_id, 'failed');
      return NextResponse.json({ success: false, message: `Room ${room_id} payment failed.` });
    }
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
