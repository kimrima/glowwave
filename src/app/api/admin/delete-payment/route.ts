import { NextRequest, NextResponse } from 'next/server';
import { getAdminTokenFromRequest, verifyAdminToken } from '@/lib/adminAuth';
import { localDb } from '@/lib/localDb';

export async function POST(request: NextRequest) {
  try {
    const token = getAdminTokenFromRequest(request);
    if (!verifyAdminToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { paymentId, paymentIds } = body as { paymentId?: string; paymentIds?: string[] };

    const targets = paymentIds || (paymentId ? [paymentId] : []);

    if (targets.length === 0) {
      return NextResponse.json({ error: 'Missing paymentId or paymentIds' }, { status: 400 });
    }

    let deletedCount = 0;
    for (const targetId of targets) {
      const success = await localDb.deletePayment(targetId);
      if (success) deletedCount++;
    }

    if (deletedCount === 0) {
      return NextResponse.json({ error: 'No payments were deleted' }, { status: 404 });
    }

    return NextResponse.json({ success: true, deletedCount });
  } catch (error) {
    console.error('[Admin Delete Payment] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
