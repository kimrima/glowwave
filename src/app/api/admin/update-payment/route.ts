import { NextRequest, NextResponse } from 'next/server';
import { getAdminTokenFromRequest, verifyAdminToken } from '@/lib/adminAuth';
import { localDb } from '@/lib/localDb';
import { TIER_CONFIGS } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const token = getAdminTokenFromRequest(request);
    if (!verifyAdminToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { paymentId, payment_status } = body as {
      paymentId: string;
      payment_status: 'pending' | 'completed' | 'failed';
    };

    if (!paymentId || !payment_status) {
      return NextResponse.json({ error: 'Missing paymentId or status' }, { status: 400 });
    }

    const success = await localDb.updatePayment(paymentId, { payment_status });
    if (!success) {
      return NextResponse.json({ error: 'Payment record not found or update failed' }, { status: 404 });
    }

    // Auto-activate and upgrade the room if payment is approved ('completed')
    if (payment_status === 'completed') {
      const payments = await localDb.getAllPayments();
      const currentPayment = payments.find(p => p.id === paymentId);
      if (currentPayment && currentPayment.room_id) {
        const roomId = currentPayment.room_id;
        const tier = currentPayment.tier;
        const config = TIER_CONFIGS[tier];
        
        await localDb.updateRoom(roomId, {
          status: 'active',
          tier: tier,
          max_participants: config.maxParticipants
        });

        // Broadcast capacity update so spectator screens refresh their capability limits
        localDb.broadcastEvent(roomId, {
          event: 'capacity_updated',
          tier,
          max_participants: config.maxParticipants,
        });

        console.log(`[Admin Payment Approved] Auto-activated room: ${roomId} with tier ${tier}`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Admin Update Payment] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
