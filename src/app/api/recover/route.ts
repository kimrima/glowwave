import { NextResponse } from 'next/server';
import { localDb } from '@/lib/localDb';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body as { email: string };

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const rooms = await localDb.getRoomsByEmail(email);

    if (rooms.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active rooms found for this email address.',
        rooms: [],
      });
    }

    // Simulate sending recovery email by logging contents to console
    const origin = request.headers.get('origin') || 'http://localhost:3000';
    console.log('\n=================== SIMULATED MAGIC LINK RECOVERY EMAIL ===================');
    console.log(`To: ${email}`);
    console.log('Subject: [GlowWave] 귀하의 전광판 관리자 복구 링크입니다.');
    console.log('\n요청하신 이메일로 생성된 활성 방 관리자 리모컨 링크 목록입니다:\n');
    rooms.forEach((room) => {
      const recoveryLink = `${origin}/host/dashboard/${room.id}?token=${room.host_session_token}`;
      console.log(`- 티어: ${room.tier.toUpperCase()} | 생성일: ${room.created_at}`);
      console.log(`  링크: ${recoveryLink}\n`);
    });
    console.log('===========================================================================\n');

    // Return room list to display directly in the recovery interface for simulated simplicity
    return NextResponse.json({
      success: true,
      message: `${rooms.length}개의 활성 방이 발견되었습니다.`,
      rooms: rooms.map((r) => ({
        room_id: r.id,
        tier: r.tier,
        created_at: r.created_at,
        host_session_token: r.host_session_token,
      })),
    });
  } catch (error) {
    console.error('Recovery error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
