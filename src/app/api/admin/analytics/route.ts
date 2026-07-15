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

    // 6. Cohort Retention Matrix (5x5 Weeks)
    const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
    const nowMs = Date.now();

    const userRooms: Record<string, Room[]> = {};
    rooms.forEach(r => {
      if (r.email) {
        if (!userRooms[r.email]) userRooms[r.email] = [];
        userRooms[r.email].push(r);
      }
    });

    const userCohortStarts: Record<string, number> = {};
    Object.entries(userRooms).forEach(([email, rList]) => {
      const minTime = Math.min(...rList.map(r => new Date(r.created_at).getTime()));
      userCohortStarts[email] = minTime;
    });

    const cohortLabels = [
      '5주 전',
      '4주 전',
      '3주 전',
      '2주 전',
      '이번 주'
    ];

    const cohortData = cohortLabels.map((label, cIndex) => {
      const cohortStart = nowMs - (5 - cIndex) * ONE_WEEK_MS;
      const cohortEnd = cohortStart + ONE_WEEK_MS;

      const cohortUsers = Object.keys(userCohortStarts).filter(email => {
        const start = userCohortStarts[email];
        return start >= cohortStart && start < cohortEnd;
      });

      const cohortSize = cohortUsers.length;
      const retentionPct: number[] = [];

      for (let w = 0; w < 5 - cIndex; w++) {
        if (cohortSize === 0) {
          retentionPct.push(0);
          continue;
        }

        const targetStart = cohortStart + w * ONE_WEEK_MS;
        const targetEnd = targetStart + ONE_WEEK_MS;

        const activeUsersCount = cohortUsers.filter(email => {
          const uRooms = userRooms[email] || [];
          return uRooms.some(r => {
            const rTime = new Date(r.created_at).getTime();
            return rTime >= targetStart && rTime < targetEnd;
          });
        }).length;

        const pct = Math.round((activeUsersCount / cohortSize) * 100);
        retentionPct.push(pct);
      }

      return {
        cohort: label,
        size: cohortSize,
        retention: retentionPct
      };
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
          repeatCustomerRate,
          cohort: cohortData
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
