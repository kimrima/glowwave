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
      return NextResponse.json({
        error: 'Room not found',
        supabase_configured: dbConfigured,
        database_error: dbErrorMsg,
        suggestion: !dbConfigured
          ? 'Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY) are missing in Vercel settings. Local mock files do not persist on serverless platforms.'
          : (dbErrorMsg 
              ? `Database query failed: "${dbErrorMsg}". Please make sure you executed the SQL script in your Supabase SQL Editor.`
              : 'The room ID is not found. Check if the rooms table in Supabase has an RLS policy blocking SELECT queries for this room (e.g. inactive rooms).')
      }, { status: 404 });
    }

    return NextResponse.json({
      room_id: room.id,
      tier: room.tier,
      status: room.status,
      max_participants: room.max_participants,
      current_participants: localDb.getClientCount(roomId),
      created_at: room.created_at,
      current_state: await localDb.getCurrentState(roomId),
    });
  } catch (error: any) {
    console.error('Room status check error:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      details: error.message || String(error)
    }, { status: 500 });
  }
}
