import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Room, Payment, Preset, TierType, TIER_CONFIGS, Coupon, FunnelLog, CSInquiry } from './types';
import { isSupabaseConfigured, supabase } from './supabase';

function hashPasscode(passcode?: string): string | undefined {
  if (!passcode) return undefined;
  return crypto.createHash('sha256').update(passcode).digest('hex');
}

interface SSEClient {
  id: string;
  controller: ReadableStreamDefaultController;
  role?: string;
}

const globalForRoomStore = global as unknown as {
  rooms: Map<string, Room>;
  payments: Payment[];
  clients: Map<string, SSEClient[]>;
  currentStates: Map<string, Preset>;
  coupons: Coupon[];
  funnelLogs: FunnelLog[];
  csInquiries: CSInquiry[];
  supabaseChannels?: Map<string, any>;
  supabasePresenceCounts?: Map<string, number>;
};

if (!globalForRoomStore.rooms) {
  globalForRoomStore.rooms = new Map();
}
if (!globalForRoomStore.payments) {
  globalForRoomStore.payments = [];
}
if (!globalForRoomStore.clients) {
  globalForRoomStore.clients = new Map();
}
if (!globalForRoomStore.currentStates) {
  globalForRoomStore.currentStates = new Map();
}
if (!globalForRoomStore.coupons) {
  globalForRoomStore.coupons = [];
}
if (!globalForRoomStore.funnelLogs) {
  globalForRoomStore.funnelLogs = [];
}
if (!globalForRoomStore.csInquiries) {
  globalForRoomStore.csInquiries = [];
}
if (!globalForRoomStore.supabaseChannels) {
  globalForRoomStore.supabaseChannels = new Map();
}
if (!globalForRoomStore.supabasePresenceCounts) {
  globalForRoomStore.supabasePresenceCounts = new Map();
}

// Robust workspace root resolver to handle cases where Next.js infers a parent directory (like C:\Users\김강산) as the root
function findWorkspaceRoot(): string {
  let currentDir = __dirname;
  
  // 1. Scan upwards from the current directory of the module to find package.json with name "glowwave"
  for (let i = 0; i < 12; i++) {
    const pkgPath = path.join(currentDir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        if (pkg.name === 'glowwave') {
          return currentDir;
        }
      } catch (e) {
        // Ignore JSON parse errors
      }
    }
    const parent = path.dirname(currentDir);
    if (parent === currentDir) break;
    currentDir = parent;
  }
  
  // 2. Fallback to process.cwd() checks
  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, 'package.json'))) {
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf8'));
      if (pkg.name === 'glowwave') return cwd;
    } catch (e) {}
  }
  
  // 3. Fallback to standard Desktop location
  const desktopDir = path.join(cwd, 'Desktop', '전광판');
  if (fs.existsSync(desktopDir)) {
    return desktopDir;
  }
  
  return cwd;
}

let cachedDbFile: string | null = null;
function getDbFile(): string {
  if (cachedDbFile) return cachedDbFile;
  const rootDir = findWorkspaceRoot();
  cachedDbFile = path.join(rootDir, 'src', 'lib', 'local_db.json');
  return cachedDbFile;
}

function readDb() {
  try {
    const dbFile = getDbFile();
    if (fs.existsSync(dbFile)) {
      const data = fs.readFileSync(dbFile, 'utf8');
      const parsed = JSON.parse(data);
      return {
        rooms: new Map<string, Room>(Object.entries(parsed.rooms || {})),
        payments: (parsed.payments || []) as Payment[],
        currentStates: new Map<string, Preset>(Object.entries(parsed.currentStates || {})),
        coupons: (parsed.coupons || []) as Coupon[],
        funnelLogs: (parsed.funnelLogs || []) as FunnelLog[],
        csInquiries: (parsed.csInquiries || []) as CSInquiry[]
      };
    }
  } catch (err) {
    // Fail silently in serverless environments
  }
  return {
    rooms: new Map<string, Room>(),
    payments: [] as Payment[],
    currentStates: new Map<string, Preset>(),
    coupons: [] as Coupon[],
    funnelLogs: [] as FunnelLog[],
    csInquiries: [] as CSInquiry[]
  };
}

function writeDb(
  rooms: Map<string, Room>,
  payments: Payment[],
  currentStates: Map<string, Preset>,
  coupons: Coupon[],
  funnelLogs: FunnelLog[],
  csInquiries: CSInquiry[]
) {
  try {
    const dbFile = getDbFile();
    const dir = path.dirname(dbFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const data = {
      rooms: Object.fromEntries(rooms.entries()),
      payments: payments,
      currentStates: Object.fromEntries(currentStates.entries()),
      coupons: coupons,
      funnelLogs: funnelLogs,
      csInquiries: csInquiries
    };
    fs.writeFileSync(dbFile, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    // Fail silently in serverless environments
  }
}

export const localDb = {
  rooms: globalForRoomStore.rooms,
  payments: globalForRoomStore.payments,
  clients: globalForRoomStore.clients,
  currentStates: globalForRoomStore.currentStates,
  coupons: globalForRoomStore.coupons,
  funnelLogs: globalForRoomStore.funnelLogs,
  csInquiries: globalForRoomStore.csInquiries,
  supabaseChannels: globalForRoomStore.supabaseChannels!,
  supabasePresenceCounts: globalForRoomStore.supabasePresenceCounts!,

  loadFromDisk(): void {
    const data = readDb();
    
    this.rooms.clear();
    for (const [k, v] of data.rooms.entries()) {
      this.rooms.set(k, v);
    }
    
    this.payments.length = 0;
    this.payments.push(...data.payments);
    
    this.currentStates.clear();
    for (const [k, v] of data.currentStates.entries()) {
      this.currentStates.set(k, v);
    }

    this.coupons.length = 0;
    this.coupons.push(...data.coupons);

    this.funnelLogs.length = 0;
    this.funnelLogs.push(...data.funnelLogs);

    this.csInquiries.length = 0;
    this.csInquiries.push(...(data.csInquiries || []));
  },

  saveToDisk(): void {
    writeDb(this.rooms, this.payments, this.currentStates, this.coupons, this.funnelLogs, this.csInquiries);
  },

  async cleanupExpiredRooms(): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
      
      // Perform delete on free rooms older than 6 hours
      const { error: freeErr } = await supabase.from('rooms').delete().eq('tier', 'free').lt('created_at', sixHoursAgo);
      if (freeErr) {
        console.error('[localDb] Supabase cleanup free rooms error:', freeErr);
      }

      // Perform delete on event paid rooms (lite, pro, max) older than 24 hours
      const { error: roomErr } = await supabase.from('rooms').delete().in('tier', ['lite', 'pro', 'max']).lt('created_at', twentyFourHoursAgo);
      if (roomErr) {
        console.error('[localDb] Supabase cleanup paid event rooms error:', roomErr);
      }

      // Perform delete on monthly store paid rooms (store) older than 30 days
      const { error: storeMonthlyErr } = await supabase.from('rooms').delete().eq('tier', 'store').lt('created_at', thirtyDaysAgo);
      if (storeMonthlyErr) {
        console.error('[localDb] Supabase cleanup store monthly rooms error:', storeMonthlyErr);
      }

      // Perform delete on annual store paid rooms (store_annual) older than 365 days
      const { error: storeAnnualErr } = await supabase.from('rooms').delete().eq('tier', 'store_annual').lt('created_at', oneYearAgo);
      if (storeAnnualErr) {
        console.error('[localDb] Supabase cleanup store annual rooms error:', storeAnnualErr);
      }
      
      const { error: payErr } = await supabase.from('payments').delete().lt('created_at', twentyFourHoursAgo);
      if (payErr) {
        console.error('[localDb] Supabase cleanup payments error:', payErr);
      }
    } else {
      this.loadFromDisk();
      const now = new Date();
      let changed = false;

      for (const [roomId, room] of this.rooms.entries()) {
        const createdAt = new Date(room.created_at);
        let expiryPeriodMs = 24 * 60 * 60 * 1000; // Event tiers default: 24h
        if (room.tier === 'free') {
          expiryPeriodMs = 6 * 60 * 60 * 1000; // Free sync trial: 6h
        } else if (room.tier === 'store') {
          expiryPeriodMs = 30 * 24 * 60 * 60 * 1000; // Store monthly: 30 days
        } else if (room.tier === 'store_annual') {
          expiryPeriodMs = 365 * 24 * 60 * 60 * 1000; // Store annual: 365 days
        }
        
        if (now.getTime() - createdAt.getTime() > expiryPeriodMs) {
          console.log(`[localDb] Expiring room: ${roomId} created at ${room.created_at}`);
          
          this.broadcastEvent(roomId, { event: 'room_expired', room_id: roomId });
          
          const clientList = this.clients.get(roomId);
          if (clientList) {
            clientList.forEach((client) => {
              try {
                client.controller.close();
              } catch (err) {}
            });
            this.clients.delete(roomId);
          }
          
          this.currentStates.delete(roomId);
          this.rooms.delete(roomId);
          changed = true;
        }
      }

      if (changed) {
        this.saveToDisk();
      }
    }
  },

  async createRoom(roomId: string, email: string, tier: TierType, hostSessionToken: string, passcode?: string, createdAt?: string): Promise<Room> {
    await this.cleanupExpiredRooms();
    const config = TIER_CONFIGS[tier];
    const hashedPasscode = hashPasscode(passcode);
    const newRoom: Room = {
      id: roomId,
      host_session_token: hostSessionToken,
      email,
      tier,
      status: tier === 'free' ? 'active' : 'inactive',
      max_participants: config.maxParticipants,
      current_participants: 0,
      created_at: createdAt || new Date().toISOString(),
      passcode: hashedPasscode,
    };

    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.from('rooms').insert({
        id: roomId,
        host_session_token: hostSessionToken,
        email,
        tier,
        status: newRoom.status,
        max_participants: config.maxParticipants,
        current_participants: 0,
        created_at: newRoom.created_at,
        passcode: hashedPasscode,
      });
      if (error) {
        console.error('[localDb] Supabase createRoom error:', error);
        throw new Error(error.message);
      }
    } else {
      this.rooms.set(roomId, newRoom);
      this.currentStates.set(roomId, {
        bg_color: '#0B0B0F',
        text: 'GlowWave',
        text_color: '#FFFFFF',
        effect: 'none',
        speed: 1000,
      });
      this.saveToDisk();
    }
    return newRoom;
  },

  async getRoom(roomId: string): Promise<Room | undefined> {
    let room;
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .maybeSingle();
      if (error) {
        console.error('[localDb] Supabase getRoom error:', error);
        throw new Error(error.message);
      }
      room = data ? (data as Room) : undefined;
    } else {
      room = this.rooms.get(roomId);
    }

    if (room) {
      const createdAt = new Date(room.created_at);
      let expiryPeriodMs = 24 * 60 * 60 * 1000;
      if (room.tier === 'free') {
        expiryPeriodMs = 6 * 60 * 60 * 1000;
      } else if (room.tier === 'store') {
        expiryPeriodMs = 30 * 24 * 60 * 60 * 1000;
      } else if (room.tier === 'store_annual') {
        expiryPeriodMs = 365 * 24 * 60 * 60 * 1000;
      }

      if (Date.now() - createdAt.getTime() > expiryPeriodMs) {
        if (!isSupabaseConfigured()) {
          this.rooms.delete(roomId);
          this.currentStates.delete(roomId);
          this.saveToDisk();
        }
        return undefined;
      }
    }
    return room;
  },

  async getRoomsByEmail(email: string): Promise<Room[]> {
    let roomsList: Room[] = [];
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('email', email)
        .eq('status', 'active');
      if (error) {
        console.error('[localDb] Supabase getRoomsByEmail error:', error);
        return [];
      }
      roomsList = (data || []) as Room[];
    } else {
      roomsList = Array.from(this.rooms.values()).filter(
        (room) => room.email.toLowerCase() === email.toLowerCase() && room.status === 'active'
      );
    }

    return roomsList.filter(room => {
      const createdAt = new Date(room.created_at);
      let expiryPeriodMs = 24 * 60 * 60 * 1000;
      if (room.tier === 'free') {
        expiryPeriodMs = 6 * 60 * 60 * 1000;
      } else if (room.tier === 'store') {
        expiryPeriodMs = 30 * 24 * 60 * 60 * 1000;
      } else if (room.tier === 'store_annual') {
        expiryPeriodMs = 365 * 24 * 60 * 60 * 1000;
      }
      return Date.now() - createdAt.getTime() <= expiryPeriodMs;
    });
  },

  async addPayment(
    email: string,
    hostSessionToken: string,
    roomId: string,
    tier: TierType,
    amount: number,
    status: 'pending' | 'completed' | 'failed'
  ): Promise<Payment> {
    const payment: Payment = {
      id: crypto.randomUUID(),
      email,
      host_session_token: hostSessionToken,
      room_id: roomId,
      tier,
      amount,
      payment_status: status,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.from('payments').insert({
        id: payment.id,
        email,
        host_session_token: hostSessionToken,
        room_id: roomId,
        tier,
        amount,
        payment_status: status,
        created_at: payment.created_at
      });
      if (error) {
        console.error('[localDb] Supabase addPayment error:', error);
      }
    } else {
      this.loadFromDisk();
      this.payments.push(payment);
      this.saveToDisk();
    }
    return payment;
  },

  async updatePaymentStatus(roomId: string, status: 'completed' | 'failed'): Promise<boolean> {
    if (isSupabaseConfigured() && supabase) {
      const { error: payError } = await supabase
        .from('payments')
        .update({ payment_status: status })
        .eq('room_id', roomId);
      if (payError) {
        console.error('[localDb] Supabase update payment error:', payError);
        return false;
      }

      if (status === 'completed') {
        const { error: roomError } = await supabase
          .from('rooms')
          .update({ 
            status: 'active',
            created_at: new Date().toISOString()
          })
          .eq('id', roomId);
        if (roomError) {
          console.error('[localDb] Supabase update room status error:', roomError);
          return false;
        }
      }
      return true;
    } else {
      this.loadFromDisk();
      const payment = this.payments.find((p) => p.room_id === roomId);
      if (payment) {
        payment.payment_status = status;
        if (status === 'completed') {
          const room = this.rooms.get(roomId);
          if (room) {
            room.status = 'active';
            room.created_at = new Date().toISOString();
          }
        }
        this.saveToDisk();
        return true;
      }
      return false;
    }
  },

  async getCurrentState(roomId: string): Promise<Preset | undefined> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('rooms')
        .select('current_state')
        .eq('id', roomId)
        .maybeSingle();
      if (error) {
        console.error('[localDb] Supabase getCurrentState error:', error);
        return undefined;
      }
      return data?.current_state ? (data.current_state as Preset) : {
        bg_color: '#0B0B0F',
        text: 'GlowWave',
        text_color: '#FFFFFF',
        effect: 'none',
        speed: 1000,
      };
    } else {
      this.loadFromDisk();
      return this.currentStates.get(roomId);
    }
  },

  async setCurrentState(roomId: string, state: Preset): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase
        .from('rooms')
        .update({ current_state: state })
        .eq('id', roomId);
      if (error) {
        console.error('[localDb] Supabase setCurrentState error:', error);
      }
    } else {
      this.loadFromDisk();
      this.currentStates.set(roomId, state);
      this.saveToDisk();
    }
  },

  async upgradeRoomTier(roomId: string, newTier: TierType): Promise<boolean> {
    const config = TIER_CONFIGS[newTier];
    if (!config) return false;

    const nowISO = new Date().toISOString();

    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase
        .from('rooms')
        .update({ 
          tier: newTier, 
          max_participants: config.maxParticipants,
          created_at: nowISO
        })
        .eq('id', roomId);
      if (error) {
        console.error('[localDb] Supabase upgradeRoomTier error:', error);
        return false;
      }
      return true;
    } else {
      this.loadFromDisk();
      const room = this.rooms.get(roomId);
      if (room) {
        room.tier = newTier;
        room.max_participants = config.maxParticipants;
        room.created_at = nowISO;
        this.saveToDisk();
        return true;
      }
      return false;
    }
  },

  async extendRoom(roomId: string, extraHours: number = 24, promoCode?: string): Promise<boolean> {
    if (isSupabaseConfigured() && supabase) {
      // 1. Fetch current room details
      const { data: room, error: fetchErr } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .maybeSingle();

      if (fetchErr || !room) {
        console.error('[localDb] Supabase extendRoom fetch error:', fetchErr);
        return false;
      }

      // 2. Calculate new created_at timestamp to add duration
      const now = Date.now();
      const currentCreatedTime = new Date(room.created_at).getTime();
      
      // Determine the base duration of the current room's tier
      let tierDurationMs = 24 * 60 * 60 * 1000; // default 24 hours
      if (room.tier === 'free') {
        tierDurationMs = 6 * 60 * 60 * 1000;
      } else if (room.tier === 'store') {
        tierDurationMs = 30 * 24 * 60 * 60 * 1000; // 30 days
      } else if (room.tier === 'store_annual') {
        tierDurationMs = 365 * 24 * 60 * 60 * 1000; // 365 days
      }

      const currentExpirationTime = currentCreatedTime + tierDurationMs;
      const newExpirationTime = Math.max(now, currentExpirationTime) + extraHours * 60 * 60 * 1000;
      const newCreatedAtISO = new Date(newExpirationTime - tierDurationMs).toISOString();

      // 3. Update room's created_at field
      const { error: updateErr } = await supabase
        .from('rooms')
        .update({ created_at: newCreatedAtISO })
        .eq('id', roomId);

      if (updateErr) {
        console.error('[localDb] Supabase extendRoom update error:', updateErr);
        return false;
      }

      // 4. Log the extended payment (20% discount applied + optional promo code discount)
      const config = TIER_CONFIGS[room.tier as TierType];
      let discountedPrice = Math.round(config.priceKrw * 0.8);
      if (promoCode) {
        const coupon = await this.verifyCoupon(promoCode);
        if (coupon) {
          discountedPrice = Math.round(discountedPrice * (1 - coupon.discount_pct / 100));
          await this.useCoupon(promoCode);
        }
      }
      await this.addPayment(
        room.email,
        room.host_session_token,
        roomId,
        room.tier as TierType,
        discountedPrice,
        'completed'
      );

      return true;
    } else {
      this.loadFromDisk();
      const room = this.rooms.get(roomId);
      if (room) {
        // Calculate new created_at timestamp to add duration
        const now = Date.now();
        const currentCreatedTime = new Date(room.created_at).getTime();
        
        // Determine the base duration of the current room's tier
        let tierDurationMs = 24 * 60 * 60 * 1000; // default 24 hours
        if (room.tier === 'free') {
          tierDurationMs = 6 * 60 * 60 * 1000;
        } else if (room.tier === 'store') {
          tierDurationMs = 30 * 24 * 60 * 60 * 1000; // 30 days
        } else if (room.tier === 'store_annual') {
          tierDurationMs = 365 * 24 * 60 * 60 * 1000; // 365 days
        }

        const currentExpirationTime = currentCreatedTime + tierDurationMs;
        const newExpirationTime = Math.max(now, currentExpirationTime) + extraHours * 60 * 60 * 1000;
        const newCreatedAtISO = new Date(newExpirationTime - tierDurationMs).toISOString();

        room.created_at = newCreatedAtISO;
        this.saveToDisk();

        // Log the extended payment (20% discount applied + optional promo code discount)
        const config = TIER_CONFIGS[room.tier];
        let discountedPrice = Math.round(config.priceKrw * 0.8);
        if (promoCode) {
          const coupon = await this.verifyCoupon(promoCode);
          if (coupon) {
            discountedPrice = Math.round(discountedPrice * (1 - coupon.discount_pct / 100));
            await this.useCoupon(promoCode);
          }
        }
        await this.addPayment(
          room.email,
          room.host_session_token,
          roomId,
          room.tier,
          discountedPrice,
          'completed'
        );

        return true;
      }
      return false;
    }
  },

  addClient(roomId: string, clientId: string, controller: ReadableStreamDefaultController, role?: string): void {
    if (!this.clients.has(roomId)) {
      this.clients.set(roomId, []);
    }
    this.clients.get(roomId)!.push({ id: clientId, controller, role });
    
    this.broadcastEvent(roomId, { event: 'presence', count: this.getClientCount(roomId) });
  },

  removeClient(roomId: string, clientId: string): void {
    const list = this.clients.get(roomId);
    if (list) {
      const idx = list.findIndex((c) => c.id === clientId);
      if (idx !== -1) {
        list.splice(idx, 1);
        this.broadcastEvent(roomId, { event: 'presence', count: this.getClientCount(roomId) });
      }
    }
  },

  getClientCount(roomId: string): number {
    if (isSupabaseConfigured() && supabase) {
      this.trackSupabasePresence(roomId);
      return this.supabasePresenceCounts.get(roomId) || 0;
    }
    return this.clients.get(roomId)?.filter((c) => c.role !== 'host').length || 0;
  },

  trackSupabasePresence(roomId: string): void {
    if (!isSupabaseConfigured() || !supabase) return;
    if (this.supabaseChannels.has(roomId)) return; // Already tracking

    console.log(`[localDb] Server tracking presence channel for room: ${roomId}`);
    const channel = supabase.channel(`presence_track_${roomId}`, {
      config: {
        presence: { key: roomId }
      }
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        let count = 0;
        Object.keys(state).forEach((key) => {
          const presences = state[key] as any[];
          presences.forEach((p) => {
            if (p.role === 'audience') {
              count++;
            }
          });
        });
        console.log(`[localDb] Supabase presence synced for ${roomId}: count = ${count}`);
        this.supabasePresenceCounts.set(roomId, count);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channel.track({ role: 'server_watcher' });
        }
      });

    this.supabaseChannels.set(roomId, channel);
  },

  getAudienceIds(roomId: string): string[] {
    return this.clients.get(roomId)?.filter((c) => c.role === 'audience').map((c) => c.id) || [];
  },

  broadcastEvent(roomId: string, data: any): void {
    const list = this.clients.get(roomId);
    if (!list) return;

    const payload = `data: ${JSON.stringify(data)}\n\n`;
    const encoder = new TextEncoder();

    list.forEach((client) => {
      try {
        client.controller.enqueue(encoder.encode(payload));
      } catch (err) {}
    });
  },

  async updateRoomPasscode(roomId: string, passcode?: string): Promise<boolean> {
    const hashedPasscode = hashPasscode(passcode);
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase
        .from('rooms')
        .update({ passcode: hashedPasscode })
        .eq('id', roomId);
      if (error) {
        console.error('[localDb] Supabase updateRoomPasscode error:', error);
        return false;
      }
      return true;
    } else {
      this.loadFromDisk();
      const room = this.rooms.get(roomId);
      if (room) {
        room.passcode = hashedPasscode;
        this.saveToDisk();
        return true;
      }
      return false;
    }
  },

  async getAllRooms(): Promise<Room[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('[localDb] Supabase getAllRooms error:', error);
        return [];
      }
      return (data || []) as Room[];
    } else {
      this.loadFromDisk();
      return Array.from(this.rooms.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
  },

  async updateRoom(roomId: string, updates: Partial<Room>): Promise<boolean> {
    if (isSupabaseConfigured() && supabase) {
      const supabaseUpdates = { ...updates } as any;
      delete supabaseUpdates.expires_at;
      
      const { error } = await supabase
        .from('rooms')
        .update(supabaseUpdates)
        .eq('id', roomId);
      if (error) {
        console.error('[localDb] Supabase updateRoom error:', error);
        return false;
      }
      return true;
    } else {
      this.loadFromDisk();
      const room = this.rooms.get(roomId);
      if (room) {
        this.rooms.set(roomId, { ...room, ...updates });
        this.saveToDisk();
        return true;
      }
      return false;
    }
  },

  async deleteRoom(roomId: string): Promise<boolean> {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', roomId);
      if (error) {
        console.error('[localDb] Supabase deleteRoom error:', error);
        return false;
      }
      return true;
    } else {
      this.loadFromDisk();
      const deleted = this.rooms.delete(roomId);
      this.currentStates.delete(roomId);
      if (deleted) {
        this.saveToDisk();
        return true;
      }
      return false;
    }
  },

  async getAllPayments(): Promise<Payment[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('[localDb] Supabase getAllPayments error:', error);
        return [];
      }
      return (data || []) as Payment[];
    } else {
      this.loadFromDisk();
      return [...this.payments].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
  },

  async updatePayment(paymentId: string, updates: Partial<Payment>): Promise<boolean> {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase
        .from('payments')
        .update(updates)
        .eq('id', paymentId);
      if (error) {
        console.error('[localDb] Supabase updatePayment error:', error);
        return false;
      }
      return true;
    } else {
      this.loadFromDisk();
      const idx = this.payments.findIndex((p) => p.id === paymentId);
      if (idx !== -1) {
        this.payments[idx] = { ...this.payments[idx], ...updates };
        this.saveToDisk();
        return true;
      }
      return false;
    }
  },

  async deletePayment(paymentId: string): Promise<boolean> {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', paymentId);
      if (error) {
        console.error('[localDb] Supabase deletePayment error:', error);
        return false;
      }
      return true;
    } else {
      this.loadFromDisk();
      const idx = this.payments.findIndex((p) => p.id === paymentId);
      if (idx !== -1) {
        this.payments.splice(idx, 1);
        this.saveToDisk();
        return true;
      }
      return false;
    }
  },

  // Coupon Helpers
  async getCoupons(): Promise<Coupon[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.from('coupons').select('*');
        if (!error && data) return data as Coupon[];
      } catch (e) {
        // Fallback silently to in-memory/disk
      }
    }
    this.loadFromDisk();
    return this.coupons;
  },

  async addCoupon(coupon: Coupon): Promise<boolean> {
    const cleanCode = coupon.code.toUpperCase().trim();
    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase.from('coupons').insert({
          ...coupon,
          code: cleanCode
        });
        if (!error) return true;
      } catch (e) {
        // Fallback silently to in-memory/disk
      }
    }
    this.loadFromDisk();
    if (this.coupons.some(c => c.code === cleanCode)) return false;
    this.coupons.push({
      ...coupon,
      code: cleanCode
    });
    this.saveToDisk();
    return true;
  },

  async toggleCoupon(code: string): Promise<boolean> {
    const cleanCode = code.toUpperCase().trim();
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: coupon, error: fetchErr } = await supabase.from('coupons').select('*').eq('code', cleanCode).maybeSingle();
        if (!fetchErr && coupon) {
          const { error } = await supabase.from('coupons').update({ is_active: !coupon.is_active }).eq('code', cleanCode);
          if (!error) return true;
        }
      } catch (e) {
        // Fallback silently
      }
    }
    this.loadFromDisk();
    const coupon = this.coupons.find(c => c.code === cleanCode);
    if (coupon) {
      coupon.is_active = !coupon.is_active;
      this.saveToDisk();
      return true;
    }
    return false;
  },

  async deleteCoupon(code: string): Promise<boolean> {
    const cleanCode = code.toUpperCase().trim();
    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase.from('coupons').delete().eq('code', cleanCode);
        if (!error) return true;
      } catch (e) {
        // Fallback silently
      }
    }
    this.loadFromDisk();
    const index = this.coupons.findIndex(c => c.code === cleanCode);
    if (index > -1) {
      this.coupons.splice(index, 1);
      this.saveToDisk();
      return true;
    }
    return false;
  },

  async verifyCoupon(code: string): Promise<Coupon | null> {
    const cleanCode = code.toUpperCase().trim();
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.from('coupons').select('*').eq('code', cleanCode).maybeSingle();
        if (!error && data) {
          const coupon = data as Coupon;
          if (coupon.is_active && coupon.used_count < coupon.max_uses) {
            return coupon;
          }
        }
      } catch (e) {
        // Fallback silently
      }
    }
    this.loadFromDisk();
    const coupon = this.coupons.find(c => c.code === cleanCode);
    if (coupon && coupon.is_active && coupon.used_count < coupon.max_uses) {
      return coupon;
    }
    return null;
  },

  async useCoupon(code: string): Promise<boolean> {
    const cleanCode = code.toUpperCase().trim();
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: coupon, error: fetchErr } = await supabase.from('coupons').select('*').eq('code', cleanCode).maybeSingle();
        if (!fetchErr && coupon) {
          if (coupon.is_active && coupon.used_count < coupon.max_uses) {
            const { error } = await supabase.from('coupons').update({ used_count: coupon.used_count + 1 }).eq('code', cleanCode);
            if (!error) return true;
          }
        }
      } catch (e) {
        // Fallback silently
      }
    }
    this.loadFromDisk();
    const coupon = this.coupons.find(c => c.code === cleanCode);
    if (coupon && coupon.is_active && coupon.used_count < coupon.max_uses) {
      coupon.used_count += 1;
      this.saveToDisk();
      return true;
    }
    return false;
  },

  // Funnel Helpers
  async logFunnelEvent(step: FunnelLog['step']): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase.from('funnel_logs').insert({
          step,
          created_at: new Date().toISOString()
        });
        if (!error) return;
      } catch (e) {
        // Fallback silently
      }
    }
    this.loadFromDisk();
    this.funnelLogs.push({
      step,
      created_at: new Date().toISOString()
    });
    this.saveToDisk();
  },

  async getFunnelLogs(): Promise<FunnelLog[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.from('funnel_logs').select('*');
        if (!error && data) return data as FunnelLog[];
      } catch (e) {
        // Fallback silently
      }
    }
    this.loadFromDisk();
    return this.funnelLogs;
  },

  // CS Inquiries Helpers
  async addCSInquiry(inquiry: Omit<CSInquiry, 'id' | 'status' | 'created_at'>): Promise<void> {
    const newInquiry: CSInquiry = {
      ...inquiry,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    console.log('[localDb CS] Preparing to insert support ticket:', newInquiry);

    if (isSupabaseConfigured() && supabase) {
      try {
        console.log('[localDb CS] Supabase configured. Attempting database insert...');
        const { error } = await supabase.from('cs_inquiries').insert({
          room_id: inquiry.room_id || null,
          email: inquiry.email,
          category: inquiry.category,
          message: inquiry.message,
          status: 'pending',
          created_at: newInquiry.created_at
        });
        if (!error) {
          console.log('[localDb CS] Supabase insert succeeded!');
          return;
        }
        console.error('[localDb CS] Supabase insert failed with error object:', error);
      } catch (e) {
        console.error('[localDb CS] Supabase insert threw exception:', e);
      }
    } else {
      console.log('[localDb CS] Supabase is NOT configured. Skipping DB insert.');
    }

    console.log('[localDb CS] Falling back to local disk storage write...');
    try {
      this.loadFromDisk();
      newInquiry.id = this.csInquiries.length + 1;
      this.csInquiries.push(newInquiry);
      this.saveToDisk();
      console.log('[localDb CS] Fallback write to disk complete! Inquiries size:', this.csInquiries.length);
    } catch (diskErr) {
      console.error('[localDb CS] Failed to write fallback ticket to disk:', diskErr);
      throw diskErr;
    }
  },

  async getCSInquiries(): Promise<CSInquiry[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.from('cs_inquiries').select('*').order('created_at', { ascending: false });
        if (!error && data) return data as CSInquiry[];
      } catch (e) {
        // Fallback silently
      }
    }
    this.loadFromDisk();
    return [...this.csInquiries].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async resolveCSInquiry(id: number): Promise<boolean> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase.from('cs_inquiries').update({ status: 'resolved' }).eq('id', id);
        if (!error) return true;
      } catch (e) {
        // Fallback silently
      }
    }
    this.loadFromDisk();
    const item = this.csInquiries.find(c => c.id === id);
    if (item) {
      item.status = 'resolved';
      this.saveToDisk();
      return true;
    }
    return false;
  }
};
