import { NextRequest, NextResponse } from 'next/server';
import { localDb } from '@/lib/localDb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'Missing code parameter' }, { status: 400 });
    }

    const coupon = await localDb.verifyCoupon(code);
    if (!coupon) {
      return NextResponse.json({ 
        valid: false, 
        message: {
          ko: '유효하지 않거나 만료된 할인 코드입니다.',
          en: 'Invalid or expired promo code.',
          ja: '無効または期限切れのプロモーションコードです。',
          es: 'Código de descuento inválido o vencido.',
          'zh-TW': '無效或已過期的優惠代碼。',
          'zh-HK': '無效或已過期的優惠代碼。'
        }
      });
    }

    return NextResponse.json({
      valid: true,
      code: coupon.code,
      discount_pct: coupon.discount_pct
    });
  } catch (error) {
    console.error('[Verify Coupon API] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
