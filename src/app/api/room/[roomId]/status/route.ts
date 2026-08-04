import { NextResponse } from 'next/server';
import { localDb } from '@/lib/localDb';

import { isSupabaseConfigured } from '@/lib/supabase';

// Memory-based Rate Limiter for brute-force scanning protection
const statusRateLimitMap = new Map<string, { count: number; resetTime: number }>();
const statusBlockedIpMap = new Map<string, number>();

const LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 30; // 30 requests per minute
const BLOCK_DURATION = 5 * 60 * 1000; // 5 minutes block

export async function GET(
  request: Request,
  { params }: { params: any }
) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const now = Date.now();

    // 1. Check if IP is currently blocked
    const blockUntil = statusBlockedIpMap.get(ip);
    if (blockUntil) {
      if (now < blockUntil) {
        const remainingSeconds = Math.ceil((blockUntil - now) / 1000);
        return NextResponse.json({
          error: 'Too Many Requests',
          suggestion: `비정상적인 무작위 조회가 감지되어 해당 IP 접속이 일시 차단되었습니다. ${remainingSeconds}초 후 다시 시도해 주세요.`
        }, { status: 429 });
      } else {
        statusBlockedIpMap.delete(ip); // Block expired
      }
    }

    // 2. Track request rate
    let tracker = statusRateLimitMap.get(ip);
    if (!tracker || now > tracker.resetTime) {
      tracker = { count: 1, resetTime: now + LIMIT_WINDOW };
      statusRateLimitMap.set(ip, tracker);
    } else {
      tracker.count++;
      if (tracker.count > MAX_REQUESTS) {
        statusBlockedIpMap.set(ip, now + BLOCK_DURATION);
        statusRateLimitMap.delete(ip);
        return NextResponse.json({
          error: 'Too Many Requests',
          suggestion: '스캔 및 어뷰징 방지를 위해 무작위 조회가 일시 차단되었습니다. 5분 후 다시 접속해 주세요.'
        }, { status: 429 });
      }
    }
    const resolvedParams = await params;
    const roomId = (resolvedParams.roomId as string).toUpperCase();

    const { searchParams } = new URL(request.url);
    const queryToken = searchParams.get('token');
    const role = searchParams.get('role');

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

    if (role === 'host' && !isHost) {
      return NextResponse.json({ 
        error: 'Unauthorized host token',
        suggestion: '이 방의 대시보드 제어 권한이 브라우저 세션에 없거나 유효하지 않습니다. 구매 복구 기능을 활용해 대시보드 주소를 새로 발급받아 주세요.'
      }, { status: 401 });
    }

    return NextResponse.json({
      room_id: room.id,
      tier: room.tier,
      status: room.status,
      max_participants: room.max_participants,
      current_participants: isSupabaseConfigured() ? (room.current_participants || 0) : localDb.getClientCount(roomId),
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
