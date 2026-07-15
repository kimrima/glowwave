import { NextRequest, NextResponse } from 'next/server';
import { localDb } from '@/lib/localDb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { step } = body as { step: string };

    const validSteps = ['step1_landing', 'step2_create', 'step3_view_upgrade', 'step4_payment_success'];
    if (!step || !validSteps.includes(step)) {
      return NextResponse.json({ error: 'Invalid funnel step parameter' }, { status: 400 });
    }

    await localDb.logFunnelEvent(step as any);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Funnel Log API] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
