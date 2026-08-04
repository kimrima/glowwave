import { NextResponse } from 'next/server';
import { localDb } from '@/lib/localDb';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
    }

    const { entry_code } = body as { entry_code: string };

    if (!entry_code || entry_code.trim() === '') {
      return NextResponse.json({ error: '입장 코드가 필요합니다.' }, { status: 400 });
    }

    const room = await localDb.getRoomByEntryCode(entry_code);

    if (!room) {
      return NextResponse.json({ 
        error: '존재하지 않거나 생성 후 24시간이 경과하여 만료된 방 번호입니다.' 
      }, { status: 404 });
    }

    if (room.status === 'inactive') {
      return NextResponse.json({ 
        error: '관리자에 의해 비활성화된 전광판입니다.' 
      }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      room_id: room.id, // 이 UUID를 클라이언트에 반환하여 관객을 /room/[UUID] 로 보내줍니다
      entry_code: room.entry_code,
      tier: room.tier
    });

  } catch (error: any) {
    console.error('[API Resolve] Entry code resolving error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
