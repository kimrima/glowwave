import { NextResponse } from 'next/server';
import { localDb } from '@/lib/localDb';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email')?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
    }

    const rooms = await localDb.getRoomsByEmail(email);

    if (rooms.length === 0) {
      return NextResponse.json({ error: 'Room not found for this email', code: 'ROOM_NOT_FOUND' }, { status: 404 });
    }

    // Generate secure 6-digit OTP
    const otp = localDb.createRecoveryOtp(email);

    // Send email via Resend
    const mailSubject = '[GlowWave] 복구 일회용 인증코드(OTP) 안내';
    const mailHtml = `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 25px; border: 1px solid #eef2f6; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
        <h2 style="color: #4f46e5; font-size: 20px; font-weight: bold; margin-bottom: 20px; text-align: center;">🔑 GlowWave 리모컨 복구</h2>
        <p style="font-size: 13px; color: #4b5563; line-height: 1.6; margin-bottom: 25px;">
          안녕하세요! 글로우웨이브 전광판 대시보드 리모컨 복구용 보안 일회용 비밀번호(OTP)입니다.<br />
          복구 화면에 아래의 6자리 인증 코드를 입력하여 복구 단계를 마쳐주세요.
        </p>
        <div style="background-color: #f3f4f6; padding: 18px; border-radius: 12px; text-align: center; font-size: 26px; font-weight: 800; letter-spacing: 5px; color: #111827; margin: 20px 0; font-family: monospace;">
          ${otp}
        </div>
        <p style="font-size: 11px; color: #9ca3af; text-align: center; margin-top: 25px;">
          * 본 코드는 5분 동안만 유효합니다. 타인에게 이 코드를 양도하지 마십시오.
        </p>
      </div>
    `;
    await sendEmail(email, mailSubject, mailHtml);

    // Mask email for extra privacy
    const parts = email.split('@');
    const maskedLocal = parts[0].substring(0, Math.min(3, parts[0].length)) + '***';
    const maskedEmail = `${maskedLocal}@${parts[1]}`;

    // Return success indicating OTP has been generated & printed to console
    return NextResponse.json({
      success: true,
      otp_sent: true,
      email: maskedEmail
    });
  } catch (error) {
    console.error('Room recovery error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = body.email?.trim().toLowerCase();
    const otp = body.otp?.trim();

    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and OTP parameters are required' }, { status: 400 });
    }

    const verified = localDb.verifyRecoveryOtp(email, otp);
    if (!verified) {
      return NextResponse.json({ error: 'Invalid or expired OTP code', code: 'INVALID_OTP' }, { status: 400 });
    }

    // Success: load and release rooms tokens
    const rooms = await localDb.getRoomsByEmail(email);
    return NextResponse.json({
      success: true,
      rooms: rooms.map(room => ({
        room_id: room.id,
        host_session_token: room.host_session_token,
        email: room.email,
        tier: room.tier,
        status: room.status,
        created_at: room.created_at,
      }))
    });
  } catch (error) {
    console.error('Room recovery POST verification error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
