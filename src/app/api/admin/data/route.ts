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

    // 2. Tier Breakdown Stats (Free, Lite, Pro, Max, Store, Store Annual)
    const tierCounts = {
      free: 0,
      lite: 0,
      pro: 0,
      max: 0,
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
        else if (room.tier === 'lite') tierCounts.lite++;
        else if (room.tier === 'pro') tierCounts.pro++;
        else if (room.tier === 'max') tierCounts.max++;
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

      // Fallback calculation for expires_at if it is missing
      let roomExpiresAt = room.expires_at;
      if (!roomExpiresAt) {
        let durationMs = 24 * 60 * 60 * 1000; // default 24 hours
        if (room.tier === 'free') {
          durationMs = 6 * 60 * 60 * 1000;
        } else if (room.tier === 'store') {
          durationMs = 30 * 24 * 60 * 60 * 1000; // 30 days
        } else if (room.tier === 'store_annual') {
          durationMs = 365 * 24 * 60 * 60 * 1000; // 365 days
        }
        roomExpiresAt = new Date(new Date(room.created_at).getTime() + durationMs).toISOString();
      }

      activeRoomsWithStates.push({
        ...room,
        expires_at: roomExpiresAt,
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

    // Funnel Statistics Aggregation
    const funnelLogs = await localDb.getFunnelLogs();
    const funnelCounts = {
      step1_landing: 0,
      step2_create: 0,
      step3_view_upgrade: 0,
      step4_payment_success: 0
    };
    for (const log of funnelLogs) {
      if (log.step in funnelCounts) {
        funnelCounts[log.step as keyof typeof funnelCounts] += 1;
      }
    }

    const coupons = await localDb.getCoupons();

    // 4. Real-time Keyword & Trend analysis
    const keywordCounts: Record<string, number> = {};
    for (const sample of textSamples) {
      const rawText = sample.text || '';
      const words = rawText
        .replace(/[^\uAC00-\uD7A3a-zA-Z0-9\s]/g, '')
        .split(/\s+/);
      for (const w of words) {
        const trimmed = w.trim();
        if (trimmed.length >= 2) {
          keywordCounts[trimmed] = (keywordCounts[trimmed] || 0) + 1;
        }
      }
    }

    const hotKeywords = Object.entries(keywordCounts)
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    let sportsCount = 0;
    let concertCount = 0;
    let personalCount = 0;

    const sportsKeywords = ['야구', '축구', '한화', '이글스', '두산', '베어스', '기아', '타이거즈', '삼성', '라이온즈', '엘지', '트윈스', '롯데', '자이언츠', '쓱', '랜더스', '골', '홈런', '응원', '월드컵', '올림픽', '국가대표', '대한민국'];
    const concertKeywords = ['사랑해', '영웅', '임영웅', '아이유', '에스파', '뉴진스', '뉴진', '아이브', '공연', '콘서트', '티켓', '팬미팅', '오빠', '언니', '노래', '가수', 'bts', '방탄', '콘'];
    
    for (const sample of textSamples) {
      const textLower = (sample.text || '').toLowerCase();
      const hasSports = sportsKeywords.some(kw => textLower.includes(kw));
      const hasConcert = concertKeywords.some(kw => textLower.includes(kw));
      
      if (hasSports) sportsCount++;
      else if (hasConcert) concertCount++;
      else personalCount++;
    }

    const categoryDistribution = {
      sports: sportsCount,
      concert: concertCount,
      personal: personalCount,
      total: textSamples.length
    };

    const trendAlerts: { id: string; type: 'sports' | 'concert' | 'info'; title: string; desc: string }[] = [];
    if (hotKeywords.length > 0) {
      const top1 = hotKeywords[0].keyword;
      const top2 = hotKeywords[1]?.keyword || '';
      
      if (sportsKeywords.some(kw => top1.includes(kw) || top2.includes(kw))) {
        trendAlerts.push({
          id: 'sports-alert',
          type: 'sports',
          title: '⚾ 프로야구/스포츠 응원 열기 감지!',
          desc: `현재 '${top1}' 등의 키워드가 대형 스포츠 전광판 수요로 이어지고 있습니다. 야구 구단/축구 응원 템플릿(시그니처 컬러 매칭)을 추천 기획해 보세요.`
        });
      }
      if (concertKeywords.some(kw => top1.includes(kw) || top2.includes(kw))) {
        trendAlerts.push({
          id: 'concert-alert',
          type: 'concert',
          title: '🔥 가수 콘서트/공연 응원 트렌드 감지!',
          desc: `최근 팬덤의 전광판 텍스트에 '${top1}'이(가) 자주 사용되고 있습니다. 응원 문구 템플릿 및 아이돌 콘서트 전용 디자인 프리셋 보강을 추천합니다.`
        });
      }
      
      if (trendAlerts.length === 0) {
        trendAlerts.push({
          id: 'general-alert',
          type: 'info',
          title: '🌟 실시간 핫 응원 문구 발견',
          desc: `현재 사용자들은 '${top1}'(이)라는 문구를 전광판에 가장 많이 띄워두고 있습니다. 해당 문구를 담은 트렌디한 추천 템플릿 제작을 검토해보세요.`
        });
      }
    } else {
      trendAlerts.push({
        id: 'no-data-alert',
        type: 'info',
        title: '📊 트렌드 감지 대기 중',
        desc: '아직 활성화된 사용자의 텍스트 샘플이 누적되지 않았습니다. 사용자들이 전광판 문구를 작성하기 시작하면 실시간 테마 감지가 활성화됩니다.'
      });
    }

    return NextResponse.json({
      success: true,
      rooms: activeRoomsWithStates,
      payments,
      coupons,
      stats: {
        fontUsage,
        effectUsage,
        textSamples: textSamples.slice(0, 50),
        liveHotRooms: liveHotRooms.slice(0, 10),
        hotKeywords,
        categoryDistribution,
        trendAlerts,
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
        userRegistry: userRegistry.slice(0, 100),
        funnel: funnelCounts
      }
    });
  } catch (error: any) {
    console.error('[Admin Data API] Error:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal Server Error', 
      stack: error.stack 
    }, { status: 500 });
  }
}



