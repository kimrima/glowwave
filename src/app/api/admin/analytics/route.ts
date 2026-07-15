import { NextRequest, NextResponse } from 'next/server';
import { getAdminTokenFromRequest, verifyAdminToken } from '@/lib/adminAuth';
import { localDb } from '@/lib/localDb';
import { LOCALIZED_TEMPLATES } from '@/lib/templates';
import { Preset, Room, Payment } from '@/lib/types';

function getPresetCategory(preset: Preset | undefined): string {
  if (!preset || !preset.text) return 'custom';
  const emojiRegex = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
  const cleanText = preset.text.replace(emojiRegex, '').trim().toLowerCase();
  
  // Search in all template categories across languages
  for (const lang of Object.keys(LOCALIZED_TEMPLATES)) {
    const categories = (LOCALIZED_TEMPLATES as any)[lang];
    if (!categories) continue;
    for (const cat of categories) {
      for (const p of cat.presets) {
        const cleanPText = p.text.replace(emojiRegex, '').trim().toLowerCase();
        if (cleanText === cleanPText) {
          return cat.id; // 'anniversary' | 'busking' | 'sports' | 'party' | 'store'
        }
      }
    }
  }
  return 'custom';
}

export async function GET(request: NextRequest) {
  try {
    const token = getAdminTokenFromRequest(request);
    if (!verifyAdminToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rooms = await localDb.getAllRooms();
    const payments = await localDb.getAllPayments();

    // 1. Revenue Metrics
    const completedPayments = payments.filter(p => p.payment_status === 'completed');
    const totalRevenue = completedPayments.reduce((sum, p) => sum + p.amount, 0);
    
    // MRR (30-day trailing revenue)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const mrrPayments = completedPayments.filter(p => new Date(p.created_at) >= thirtyDaysAgo);
    const mrr = mrrPayments.reduce((sum, p) => sum + p.amount, 0);

    // ARPU (Average Revenue per Payment Transaction)
    const arpu = completedPayments.length > 0 ? Math.round(totalRevenue / completedPayments.length) : 0;

    // 2. Conversion Metrics
    const totalRoomsCount = rooms.length;
    const paidRooms = rooms.filter(r => r.tier !== 'free');
    const paidRoomsCount = paidRooms.length;
    const conversionRate = totalRoomsCount > 0 ? parseFloat(((paidRoomsCount / totalRoomsCount) * 100).toFixed(1)) : 0;

    // Plan Distribution
    const planDistribution = {
      free: rooms.filter(r => r.tier === 'free').length,
      lite: rooms.filter(r => r.tier === 'lite').length,
      pro: rooms.filter(r => r.tier === 'pro').length,
      max: rooms.filter(r => r.tier === 'max').length,
    };

    // 3. Usage & Category Popularity (PMF)
    const categoryPopularity: Record<string, number> = {
      anniversary: 0,
      busking: 0,
      sports: 0,
      party: 0,
      store: 0,
      custom: 0,
    };

    rooms.forEach(room => {
      // Find preset state
      const preset = (room as any).current_state || localDb.currentStates.get(room.id);
      const category = getPresetCategory(preset);
      if (categoryPopularity[category] !== undefined) {
        categoryPopularity[category]++;
      } else {
        categoryPopularity.custom++;
      }
    });

    // Convert category popularity to percentages/counts
    const totalPresetsCategorized = Object.values(categoryPopularity).reduce((a, b) => a + b, 0);
    const categoryShares = Object.fromEntries(
      Object.entries(categoryPopularity).map(([cat, count]) => [
        cat,
        totalPresetsCategorized > 0 ? parseFloat(((count / totalPresetsCategorized) * 100).toFixed(1)) : 0
      ])
    );

    // 4. Customer Retention (Email uniqueness)
    const emailRoomCounts: Record<string, number> = {};
    rooms.forEach(r => {
      if (r.email) {
        emailRoomCounts[r.email] = (emailRoomCounts[r.email] || 0) + 1;
      }
    });
    
    const uniqueEmails = Object.keys(emailRoomCounts);
    const uniqueEmailCount = uniqueEmails.length;
    const repeatEmailCount = uniqueEmails.filter(email => emailRoomCounts[email] > 1).length;
    const repeatCustomerRate = uniqueEmailCount > 0 ? parseFloat(((repeatEmailCount / uniqueEmailCount) * 100).toFixed(1)) : 0;

    // 5. Live Concurrent Connections
    const activeRooms = rooms.filter(r => r.status === 'active');
    const activeRoomsCount = activeRooms.length;
    
    let activeSpectatorsCount = 0;
    activeRooms.forEach(room => {
      activeSpectatorsCount += localDb.getClientCount(room.id);
    });

    return NextResponse.json({
      success: true,
      analytics: {
        financials: {
          totalRevenue,
          mrr,
          arpu
        },
        conversions: {
          totalRooms: totalRoomsCount,
          paidRooms: paidRoomsCount,
          conversionRate,
          planDistribution
        },
        productUsage: {
          categoryShares,
          categoryCounts: categoryPopularity
        },
        retention: {
          uniqueEmailCount,
          repeatEmailCount,
          repeatCustomerRate
        },
        liveMetrics: {
          activeRoomsCount,
          activeSpectatorsCount
        }
      }
    });
  } catch (error: any) {
    console.error('[Admin Analytics API] Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal Server Error', 
      stack: error.stack 
    }, { status: 500 });
  }
}
