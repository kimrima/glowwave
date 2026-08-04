import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { localDb } from '@/lib/localDb';

// Simple global in-memory maps to track failed passcode attempts and lockouts
const passcodeAttemptsMap = new Map<string, number>();
const passcodeLockoutMap = new Map<string, number>();

export async function POST(
  request: Request,
  { params }: { params: any }
) {
  try {
    const resolvedParams = await params;
    const roomId = (resolvedParams.roomId as string).toUpperCase();
    
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
    }

    const { passcode } = body as { passcode: string };

    const room = await localDb.getRoom(roomId);
    if (!room) {
      return NextResponse.json({ error: '방을 찾을 수 없습니다.' }, { status: 404 });
    }

    if (!room.passcode) {
      return NextResponse.json({ success: true });
    }

    // Resolve client IP for tracking
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const clientKey = `${ip}_${roomId}`;

    // 1. Lockout Check
    const now = Date.now();
    const lockoutUntil = passcodeLockoutMap.get(clientKey);
    if (lockoutUntil && now < lockoutUntil) {
      const remainingMinutes = Math.ceil((lockoutUntil - now) / (60 * 1000));
      return NextResponse.json({ 
        success: false, 
        error: `비밀번호 입력을 5회 연속 실패하여 접속이 차단되었습니다. ${remainingMinutes}분 후 다시 시도해 주세요.` 
      }, { status: 429 });
    }

    const hashedInput = crypto.createHash('sha256').update(passcode || '').digest('hex');

    if (room.passcode === hashedInput) {
      // Clear limits on successful authentication
      passcodeAttemptsMap.delete(clientKey);
      passcodeLockoutMap.delete(clientKey);
      return NextResponse.json({ success: true });
    } else {
      // Increment failed count
      const attempts = (passcodeAttemptsMap.get(clientKey) || 0) + 1;
      passcodeAttemptsMap.set(clientKey, attempts);

      if (attempts >= 5) {
        // Lock client for 10 minutes
        passcodeLockoutMap.set(clientKey, now + 10 * 60 * 1000);
        passcodeAttemptsMap.delete(clientKey);
        return NextResponse.json({ 
          success: false, 
          error: '비밀번호를 5회 연속 실패하여 10분간 대입이 제한됩니다.' 
        }, { status: 429 });
      }

      return NextResponse.json({ 
        success: false, 
        error: `비밀번호가 올바르지 않습니다. (오류 횟수: ${attempts}/5회)` 
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Verify passcode error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
