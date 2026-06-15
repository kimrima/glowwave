import { NextResponse } from 'next/server';
import { localDb } from '@/lib/localDb';

import { isSupabaseConfigured } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: any }
) {
  try {
    const resolvedParams = await params;
    const roomId = (resolvedParams.roomId as string).toUpperCase();

    const { searchParams } = new URL(request.url);
    const queryToken = searchParams.get('token');

    const dbConfigured = isSupabaseConfigured();
    let room;
    let dbErrorMsg = null;

    try {
      room = await localDb.getRoom(roomId);
    } catch (err: any) {
      dbErrorMsg = err.message || String(err);
      console.error('[API Status] Database fetch error:', err);
    }

    if (!room) {
      const isDbError = !!dbErrorMsg;
      return NextResponse.json({
        error: isDbError ? '서버 연결 오류' : '방을 찾을 수 없음',
        supabase_configured: dbConfigured,
        database_error: dbErrorMsg,
        suggestion: !dbConfigured
          ? '서비스 설정(환경 변수)이 누락되었습니다. 플랫폼 설정을 확인해 주세요.'
          : (isDbError 
              ? '서버 데이터베이스와의 연결에 실패했습니다. 일시적인 장애일 수 있으니 잠시 후 다시 시도해 주세요.'
              : '존재하지 않거나 생성 후 24시간이 경과하여 만료된 방 번호입니다. 방 코드를 확인해 주세요.')
      }, { status: isDbError ? 500 : 404 });
    }

    const isHost = queryToken === room.host_session_token;

    return NextResponse.json({
      room_id: room.id,
      tier: room.tier,
      status: room.status,
      max_participants: room.max_participants,
      current_participants: localDb.getClientCount(roomId),
      created_at: room.created_at,
      current_state: await localDb.getCurrentState(roomId),
      has_passcode: !!room.passcode,
      ...(isHost ? { passcode: room.passcode } : {})
    });
  } catch (error: any) {
    console.error('Room status check error:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      details: error.message || String(error)
    }, { status: 500 });
  }
}
