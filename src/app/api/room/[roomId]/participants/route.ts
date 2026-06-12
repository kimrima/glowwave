import { NextRequest, NextResponse } from 'next/server';
import { localDb } from '@/lib/localDb';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: any }
) {
  const resolvedParams = await params;
  const roomId = (resolvedParams.roomId as string).toUpperCase();
  
  // Verify host token for security
  const hostToken = request.nextUrl.searchParams.get('token');
  const room = await localDb.getRoom(roomId);
  if (!room || room.host_session_token !== hostToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const list = localDb.getAudienceIds(roomId);
  return NextResponse.json({ participants: list });
}
