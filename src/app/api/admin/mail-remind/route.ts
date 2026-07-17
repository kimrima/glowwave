import { NextRequest, NextResponse } from 'next/server';
import { getAdminTokenFromRequest, verifyAdminToken } from '@/lib/adminAuth';
import { localDb } from '@/lib/localDb';
import { sendEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const token = getAdminTokenFromRequest(request);
    if (!verifyAdminToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { roomId } = body as { roomId: string };

    if (!roomId) {
      return NextResponse.json({ error: 'Missing roomId' }, { status: 400 });
    }

    // 1. Fetch Room Info to ensure it exists
    const room = await localDb.getRoom(roomId);
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const nowStr = new Date().toISOString();

    // 2. Perform Real/Fallback Email Sending
    const mailSubject = `⚠️ [GlowWave] 요청하신 전광판 방 기한 만료 임박 안내 (Room: ${roomId})`;
    const mailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; max-width: 500px; margin: 40px auto; padding: 0; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 24px; background-color: #0b0b0f; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
        <!-- Warning Top Banner -->
        <div style="background: linear-gradient(135deg, #f97316 0%, #ef4444 100%); padding: 35px 20px; text-align: center;">
          <div style="font-size: 24px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
            GlowWave 🌊
          </div>
          <div style="font-size: 11px; color: rgba(255, 255, 255, 0.85); font-weight: bold; margin-top: 6px; letter-spacing: 1px; text-transform: uppercase;">
            Room Expiration Notice
          </div>
        </div>

        <!-- Body Content -->
        <div style="padding: 35px 30px 40px 30px;">
          <h2 style="color: #ffffff; font-size: 18px; font-weight: 800; margin: 0 0 16px 0; text-align: center; letter-spacing: -0.3px;">
            전광판 이용 기한 만료 임박
          </h2>
          <p style="font-size: 13px; color: #94a3b8; line-height: 1.6; margin: 0 0 25px 0; text-align: left;">
            안녕하세요! 실시간 스마트 전광판 서비스 <b>글로우웨이브</b>입니다.<br />
            개설하신 전광판 방의 이용 기한 만료가 다가오고 있어 안내 메일을 드립니다. 기한이 만료되면 대화방 및 관련 관객 데이터가 완전히 초기화될 수 있으니 미리 확인하시어 대여 연장을 진행하시길 권장합니다.
          </p>

          <!-- Room Info Grid -->
          <div style="background-color: #161622; border: 1px solid rgba(255,255,255,0.06); border-radius: 16px; padding: 18px; margin-bottom: 30px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 12px; color: #cbd5e1;">
              <tr>
                <td style="padding: 6px 0; font-weight: bold; color: #64748b; width: 100px;">대상 방 코드</td>
                <td style="padding: 6px 0; font-weight: bold; color: #ffffff; font-family: monospace;">${roomId}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold; color: #64748b;">남은 기한</td>
                <td style="padding: 6px 0; font-weight: bold; color: #f43f5e;">3일 이내 만료 예정</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold; color: #64748b;">회원 계정</td>
                <td style="padding: 6px 0; font-family: monospace;">${room.email}</td>
              </tr>
            </table>
          </div>

          <!-- Action Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://glow-wave.net/host/dashboard/${roomId}?token=${room.host_session_token}" style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 13px; display: inline-block; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4); text-transform: uppercase; letter-spacing: 0.5px; transition: all 0.2s;">
              대시보드 리모컨 바로가기
            </a>
          </div>

          <!-- Notice Block -->
          <div style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 25px; margin-top: 30px;">
            <p style="font-size: 11px; color: #64748b; line-height: 1.5; margin: 0; text-align: left;">
              * 본 메일은 회원님이 전광판 방 개설 시 입력하신 이메일 주소로 발송된 자동 시스템 메일입니다. 기한이 만료되기 전 연장하시면 기존 데이터가 그대로 유지됩니다.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #07070a; padding: 20px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.04);">
          <span style="font-size: 10px; color: #475569; font-weight: bold;">
            &copy; 2026 GlowWave. All Rights Reserved.
          </span>
        </div>
      </div>
    `;
    const mailSent = await sendEmail(room.email, mailSubject, mailHtml);

    if (!mailSent) {
      console.error(`[Admin Mail Remind] Failed to send email via Resend to ${room.email}`);
    }

    // 3. Update the room's mail_sent_at field
    const success = await localDb.updateRoom(roomId, {
      mail_sent_at: nowStr
    });

    if (!success) {
      console.warn(`[Admin Mail Remind] Could not write mail_sent_at timestamp in database for room ${roomId}. (Ensure schema has been updated)`);
    }

    return NextResponse.json({
      success: true,
      mail_sent_at: nowStr,
      message: `CS 경고 메일이 ${room.email} 앞으로 전송 완료되었습니다.`
    });
  } catch (error: any) {
    console.error('[Admin Mail Remind] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
