import { NextRequest, NextResponse } from 'next/server';
import { getAdminTokenFromRequest, verifyAdminToken } from '@/lib/adminAuth';
import { localDb } from '@/lib/localDb';

export async function GET(request: NextRequest) {
  try {
    const token = getAdminTokenFromRequest(request);
    if (!verifyAdminToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rooms = await localDb.getAllRooms();
    const payments = await localDb.getAllPayments();

    // Gather active room states dynamically for business analytics
    const activeRoomsWithStates = [];
    const fontUsage: Record<string, number> = {};
    const effectUsage: Record<string, number> = {};
    const textSamples: { text: string; bg: string; color: string; tier: string; time: string }[] = [];

    for (const room of rooms) {
      const activeClients = localDb.getClientCount(room.id);
      const state = await localDb.getCurrentState(room.id);
      
      if (state) {
        // Collect font statistics
        const font = state.font_family || 'sans-thin';
        fontUsage[font] = (fontUsage[font] || 0) + 1;
        
        // Collect animation effect statistics
        const effect = state.effect || 'none';
        effectUsage[effect] = (effectUsage[effect] || 0) + 1;

        // Mask PII and collect non-empty text values
        if (state.text && state.text.trim()) {
          textSamples.push({
            text: state.text,
            bg: state.bg_color || '#000000',
            color: state.text_color || '#FFFFFF',
            tier: room.tier,
            time: room.created_at
          });
        }
      }

      activeRoomsWithStates.push({
        ...room,
        active_clients: activeClients,
        current_state: state ? {
          effect: state.effect,
          font_family: state.font_family,
          text_color: state.text_color,
          bg_color: state.bg_color
        } : null
      });
    }

    return NextResponse.json({
      success: true,
      rooms: activeRoomsWithStates,
      payments,
      stats: {
        fontUsage,
        effectUsage,
        textSamples: textSamples.slice(0, 50) // Limit to top 50 recent samples
      }
    });
  } catch (error) {
    console.error('[Admin Data API] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

