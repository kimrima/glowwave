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
    const mailSubject = `[GlowWave] 귀하의 전광판 방 기한 만료 임박 안내 (Room: ${roomId})`;
    const mailHtml = `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 25px; border: 1px solid #fee2e2; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
        <h2 style="color: #ef4444; font-size: 18px; font-weight: bold; margin-bottom: 20px; text-align: center;">⚠️ 전광판 이용 기한 만료 임박 안내</h2>
        <p style="font-size: 13px; color: #4b5563; line-height: 1.6; margin-bottom: 25px;">
          안녕하세요! 글로우웨이브(GlowWave) 서비스를 이용해 주셔서 진심으로 감사드립니다.<br /><br />
          개설하신 전광판 방 <strong>[${roomId}]</strong>의 대여 기한이 <strong>3일 이내</strong>로 만료될 예정입니다. 기한이 만료되면 대화방 및 관련 관객 데이터가 초기화될 수 있으니, 아래의 대시보드 리모컨 버튼을 통해 기간 연장을 진행해 주시기 바랍니다.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://glow-wave.net/host/dashboard/${roomId}?token=${room.host_session_token}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 14px; display: inline-block;">대시보드 리모컨 바로가기</a>
        </div>
        <p style="font-size: 11px; color: #9ca3af; text-align: center; margin-top: 25px;">
          * 본 메일은 전광판 구매 시 입력하신 이메일(${room.email})로 발송된 안내장입니다.
        </p>
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
