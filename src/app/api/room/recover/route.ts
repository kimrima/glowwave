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
    const mailSubject = '🔑 [GlowWave] 요청하신 일회용 복구 보안코드(OTP)입니다.';
    const mailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 480px; margin: 40px auto; padding: 0; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 24px; background-color: #0b0b0f; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
        <!-- Gradient Top Header -->
        <div style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%); padding: 35px 20px; text-align: center;">
          <div style="font-size: 24px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
            GlowWave 🌊
          </div>
          <div style="font-size: 11px; color: rgba(255, 255, 255, 0.8); font-weight: bold; margin-top: 6px; letter-spacing: 1px; text-transform: uppercase;">
            Secure One-Time Password
          </div>
        </div>

        <!-- Body Content -->
        <div style="padding: 35px 30px 40px 30px; text-align: center;">
          <h2 style="color: #ffffff; font-size: 18px; font-weight: 800; margin: 0 0 16px 0; letter-spacing: -0.3px;">
            임시 리모컨 복구 보안 코드
          </h2>
          <p style="font-size: 13px; color: #94a3b8; line-height: 1.6; margin: 0 0 30px 0; text-align: left;">
            안녕하세요! 관객 소통용 스마트 전광판 <b>글로우웨이브</b>입니다.<br />
            요청하신 전광판 방 대시보드 리모컨 복구 단계 완료를 위해 생성된 6자리 일회용 보안 번호입니다. 아래 코드를 복구 창에 기입해 주세요.
          </p>

          <!-- OTP Box -->
          <div style="background: linear-gradient(180deg, #181825 0%, #111116 100%); border: 1px solid rgba(139, 92, 246, 0.3); padding: 22px; border-radius: 16px; text-align: center; margin: 25px 0; box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);">
            <div style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #a5b4fc; font-family: 'SF Mono', Consolas, Monaco, monospace; text-shadow: 0 0 10px rgba(139,92,246,0.3); padding-left: 8px;">
              ${otp}
            </div>
          </div>

          <!-- Notice Block -->
          <div style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 25px; margin-top: 30px; text-align: left;">
            <p style="font-size: 11px; color: #64748b; line-height: 1.5; margin: 0;">
              ⚠️ 본 코드는 <b>5분 동안만 유효</b>합니다. 만약 본인이 요청하지 않으셨다면 이 메일을 조용히 무시해 주시기 바랍니다. 보안을 위해 본 코드를 타인에게 양도하거나 양식 공유를 삼가 주십시오.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #07070a; padding: 20px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.04);">
          <span style="font-size: 10px; color: #475569; font-weight: bold;">
            &copy; 2026 GlowWave. Built for Next-Generation Interactions.
          </span>
        </div>
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
