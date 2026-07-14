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
    
    // Advanced PO/PM BI metrics
    const liveHotRooms: { id: string; text: string; active_clients: number; tier: string; time: string; bg: string; color: string }[] = [];
    const themeCombos: Record<string, number> = {};
    let b2cCount = 0; // Local standalone sync rooms
    let b2bCount = 0; // Multilingual store/event host rooms

    // 1. Locale Distribution Stats
    const localeUsage: Record<string, number> = {};

    // 2. Tier Breakdown Stats (Free trial, event, store monthly, store annual)
    const tierCounts = {
      free: 0,
      event: 0,
      store: 0,
      store_annual: 0
    };

    // 3. User Registry & Retention calculation based on emails
    const userRoomsMap: Record<string, { rooms: string[]; paidCount: number; lastActive: string }> = {};

    for (const room of rooms) {
      const activeClients = localDb.getClientCount(room.id);
      const state = await localDb.getCurrentState(room.id);
      
      // Determine segment type
      if (room.email === 'sync-local@glowwave.app') {
        b2cCount++;
      } else {
        b2bCount++;
      }

      // Locale tracking
      const locale = room.locale || 'ko';
      localeUsage[locale] = (localeUsage[locale] || 0) + 1;

      // Tier breakdown
      const tier = room.tier as keyof typeof tierCounts;
      if (tier in tierCounts) {
        tierCounts[tier]++;
      } else {
        // Fallback or mapping
        if (room.tier === 'store') tierCounts.store++;
        else if (room.tier === 'store_annual') tierCounts.store_annual++;
        else tierCounts.free++;
      }

      // User email registry mapper (Skip anonymous local sync account)
      const userEmail = room.email || 'anonymous';
      if (userEmail !== 'sync-local@glowwave.app') {
        if (!userRoomsMap[userEmail]) {
          userRoomsMap[userEmail] = { rooms: [], paidCount: 0, lastActive: room.created_at };
        }
        userRoomsMap[userEmail].rooms.push(room.id);
        if (room.tier !== 'free') {
          userRoomsMap[userEmail].paidCount++;
        }
        if (new Date(room.created_at) > new Date(userRoomsMap[userEmail].lastActive)) {
          userRoomsMap[userEmail].lastActive = room.created_at;
        }
      }

      if (state) {
        // Collect font statistics
        const font = state.font_family || 'sans-thin';
        fontUsage[font] = (fontUsage[font] || 0) + 1;
        
        // Collect animation effect statistics
        const effect = state.effect || 'none';
        effectUsage[effect] = (effectUsage[effect] || 0) + 1;

        // Collect theme color combos
        const bg = state.bg_color || '#000000';
        const color = state.text_color || '#FFFFFF';
        const comboKey = `${bg}|${color}`;
        themeCombos[comboKey] = (themeCombos[comboKey] || 0) + 1;

        // Mask PII and collect non-empty text values
        if (state.text && state.text.trim()) {
          const sample = {
            text: state.text,
            bg,
            color,
            tier: room.tier,
            time: room.created_at
          };
          textSamples.push(sample);

          // Add to Hot Rooms if there are active client viewers
          if (activeClients > 0) {
            liveHotRooms.push({
              id: room.id,
              text: state.text,
              active_clients: activeClients,
              tier: room.tier,
              time: room.created_at,
              bg,
              color
            });
          }
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

    // Sort live hot rooms by client count descending
    liveHotRooms.sort((a, b) => b.active_clients - a.active_clients);

    // Format top color combos
    const topThemeCombos = Object.entries(themeCombos)
      .map(([combo, count]) => {
        const [bg, color] = combo.split('|');
        return { bg, color, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Format User Registry List & calculate retention
    const userRegistry = Object.entries(userRoomsMap).map(([email, info]) => ({
      email,
      room_count: info.rooms.length,
      paid_count: info.paidCount,
      last_active: info.lastActive
    })).sort((a, b) => b.room_count - a.room_count);

    const totalUsers = userRegistry.length;
    const retainedUsers = userRegistry.filter(u => u.room_count >= 2 || u.paid_count > 0).length;
    const userRetentionRate = totalUsers > 0 ? Math.round((retainedUsers / totalUsers) * 100) : 0;

    return NextResponse.json({
      success: true,
      rooms: activeRoomsWithStates,
      payments,
      stats: {
        fontUsage,
        effectUsage,
        textSamples: textSamples.slice(0, 50), // Limit to top 50 recent samples
        liveHotRooms: liveHotRooms.slice(0, 10), // Top 10 highly engaging active signs
        segmentation: {
          b2cCount,
          b2bCount,
          total: rooms.length
        },
        visualThemes: topThemeCombos,
        localeUsage,
        tierCounts,
        retention: {
          totalUsers,
          retainedUsers,
          retentionRate: userRetentionRate
        },
        userRegistry: userRegistry.slice(0, 100) // Top 100 active users list
      }
    });
  } catch (error) {
    console.error('[Admin Data API] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}



