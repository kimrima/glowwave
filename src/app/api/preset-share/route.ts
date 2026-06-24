import { NextResponse } from 'next/server';

// In-memory cache map to store shared preset packages temporarily
const presetShares = new Map<string, { presets: any[]; expiresAt: number }>();

// Run clean-up timer to delete expired codes every 30 seconds
if (typeof global !== 'undefined') {
  const globalStore = global as any;
  if (!globalStore.presetShareCleanInterval) {
    globalStore.presetShareCleanInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, val] of presetShares.entries()) {
        if (now > val.expiresAt) {
          presetShares.delete(key);
        }
      }
    }, 30000);
  }
}

export async function POST(request: Request) {
  try {
    const { presets } = await request.json();
    if (!Array.isArray(presets)) {
      return NextResponse.json({ error: 'Invalid presets format' }, { status: 400 });
    }

    // Generate random 6-character uppercase key
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing characters like O, 0, I, 1
    let shareKey = '';
    for (let i = 0; i < 6; i++) {
      shareKey += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes lifetime
    presetShares.set(shareKey, { presets, expiresAt });

    return NextResponse.json({ shareKey });
  } catch (e) {
    console.error('[API Preset Share POST] Error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key')?.toUpperCase();

    if (!key) {
      return NextResponse.json({ error: 'Missing key parameter' }, { status: 400 });
    }

    const share = presetShares.get(key);
    if (!share || Date.now() > share.expiresAt) {
      if (share) presetShares.delete(key);
      return NextResponse.json({ error: '만료되었거나 유효하지 않은 공유 코드입니다.' }, { status: 404 });
    }

    return NextResponse.json({ presets: share.presets });
  } catch (e) {
    console.error('[API Preset Share GET] Error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
