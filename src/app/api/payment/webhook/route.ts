import { NextResponse } from 'next/server';
import { localDb } from '@/lib/localDb';

// Simulates a third-party PG (Toss Payments / Stripe) serverless webhook callback
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { room_id, status, promo_code } = body as { 
      room_id: string; 
      status: 'success' | 'failed';
      promo_code?: string;
    };

    if (!room_id) {
      return NextResponse.json({ error: 'Missing room_id' }, { status: 400 });
    }

    const targetRoom = await localDb.getRoom(room_id);
    if (!targetRoom) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (status === 'success') {
      // Update payment record amount if coupon promo_code is provided
      const payments = await localDb.getAllPayments();
      const payment = payments.find(p => p.room_id === room_id && p.payment_status === 'pending');
      
      if (payment && promo_code) {
        const coupon = await localDb.verifyCoupon(promo_code);
        if (coupon) {
          const discountedPrice = Math.round(payment.amount * (1 - coupon.discount_pct / 100));
          await localDb.updatePayment(payment.id, { amount: discountedPrice });
          await localDb.useCoupon(promo_code);
        }
      }

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
