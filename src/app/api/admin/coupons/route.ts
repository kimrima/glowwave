import { NextRequest, NextResponse } from 'next/server';
import { getAdminTokenFromRequest, verifyAdminToken } from '@/lib/adminAuth';
import { localDb } from '@/lib/localDb';

export async function GET(request: NextRequest) {
  try {
    const token = getAdminTokenFromRequest(request);
    if (!verifyAdminToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const coupons = await localDb.getCoupons();
    return NextResponse.json({ success: true, coupons });
  } catch (error) {
    console.error('[Admin Get Coupons API] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getAdminTokenFromRequest(request);
    if (!verifyAdminToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, code, discount_pct, max_uses } = body as {
      action: 'add' | 'toggle' | 'delete';
      code: string;
      discount_pct?: number;
      max_uses?: number;
    };

    if (!code) {
      return NextResponse.json({ error: 'Missing coupon code' }, { status: 400 });
    }

    const cleanCode = code.toUpperCase().trim();

    if (action === 'add') {
      if (discount_pct === undefined || discount_pct < 0 || discount_pct > 100) {
        return NextResponse.json({ error: 'Invalid discount percentage' }, { status: 400 });
      }
      const success = await localDb.addCoupon({
        code: cleanCode,
        discount_pct,
        is_active: true,
        max_uses: max_uses || 9999,
        used_count: 0,
        created_at: new Date().toISOString()
      });
      if (!success) {
        return NextResponse.json({ error: 'Coupon code already exists' }, { status: 400 });
      }
    } else if (action === 'toggle') {
      const success = await localDb.toggleCoupon(cleanCode);
      if (!success) {
        return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
      }
    } else if (action === 'delete') {
      const success = await localDb.deleteCoupon(cleanCode);
      if (!success) {
        return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
      }
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const coupons = await localDb.getCoupons();
    return NextResponse.json({ success: true, coupons });
  } catch (error) {
    console.error('[Admin Manage Coupons API] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
