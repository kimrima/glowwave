import fs from 'fs';
import path from 'path';
import { Room, Payment, Preset, TierType, TIER_CONFIGS } from './types';
import { isSupabaseConfigured, supabase } from './supabase';

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

const rootDir = findWorkspaceRoot();
const DB_FILE = path.join(rootDir, 'src', 'lib', 'local_db.json');

function readDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      const parsed = JSON.parse(data);
      return {
        rooms: new Map<string, Room>(Object.entries(parsed.rooms || {})),
        payments: (parsed.payments || []) as Payment[],
        currentStates: new Map<string, Preset>(Object.entries(parsed.currentStates || {}))
      };
    }
  } catch (err) {
    // Fail silently in serverless environments
  }
  return {
    rooms: new Map<string, Room>(),
    payments: [] as Payment[],
    currentStates: new Map<string, Preset>()
  };
}

function writeDb(rooms: Map<string, Room>, payments: Payment[], currentStates: Map<string, Preset>) {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const data = {
      rooms: Object.fromEntries(rooms.entries()),
      payments: payments,
      currentStates: Object.fromEntries(currentStates.entries())
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    // Fail silently in serverless environments
  }
}

export const localDb = {
  rooms: globalForRoomStore.rooms,
  payments: globalForRoomStore.payments,
  clients: globalForRoomStore.clients,
  currentStates: globalForRoomStore.currentStates,

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
  },

  saveToDisk(): void {
    writeDb(this.rooms, this.payments, this.currentStates);
  },

  async cleanupExpiredRooms(): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      // Perform delete on free rooms older than 6 hours
      const { error: freeErr } = await supabase.from('rooms').delete().eq('tier', 'free').lt('created_at', sixHoursAgo);
      if (freeErr) {
        console.error('[localDb] Supabase cleanup free rooms error:', freeErr);
      }

      // Perform delete on paid rooms older than 24 hours
      const { error: roomErr } = await supabase.from('rooms').delete().neq('tier', 'free').lt('created_at', twentyFourHoursAgo);
      if (roomErr) {
        console.error('[localDb] Supabase cleanup paid rooms error:', roomErr);
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
        const expiryPeriodMs = room.tier === 'free' ? 6 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
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

  async createRoom(roomId: string, email: string, tier: TierType, hostSessionToken: string, passcode?: string): Promise<Room> {
    await this.cleanupExpiredRooms();
    const config = TIER_CONFIGS[tier];
    const newRoom: Room = {
      id: roomId,
      host_session_token: hostSessionToken,
      email,
      tier,
      status: tier === 'free' ? 'active' : 'inactive',
      max_participants: config.maxParticipants,
      created_at: new Date().toISOString(),
      passcode,
    };

    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.from('rooms').insert({
        id: roomId,
        host_session_token: hostSessionToken,
        email,
        tier,
        status: newRoom.status,
        max_participants: config.maxParticipants,
        created_at: newRoom.created_at,
        passcode,
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
      const expiryPeriodMs = room.tier === 'free' ? 6 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
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
      const expiryPeriodMs = room.tier === 'free' ? 6 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
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
          .update({ status: 'active' })
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

  async extendRoom(roomId: string, extraHours: number = 24): Promise<boolean> {
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
      const currentExpirationTime = currentCreatedTime + 24 * 60 * 60 * 1000;
      const newExpirationTime = Math.max(now, currentExpirationTime) + extraHours * 60 * 60 * 1000;
      const newCreatedAtISO = new Date(newExpirationTime - 24 * 60 * 60 * 1000).toISOString();

      // 3. Update room's created_at field
      const { error: updateErr } = await supabase
        .from('rooms')
        .update({ created_at: newCreatedAtISO })
        .eq('id', roomId);

      if (updateErr) {
        console.error('[localDb] Supabase extendRoom update error:', updateErr);
        return false;
      }

      // 4. Log the extended payment (20% discount applied)
      const config = TIER_CONFIGS[room.tier as TierType];
      const discountedPrice = Math.round(config.priceKrw * 0.8);
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
        const currentExpirationTime = currentCreatedTime + 24 * 60 * 60 * 1000;
        const newExpirationTime = Math.max(now, currentExpirationTime) + extraHours * 60 * 60 * 1000;
        const newCreatedAtISO = new Date(newExpirationTime - 24 * 60 * 60 * 1000).toISOString();

        room.created_at = newCreatedAtISO;
        this.saveToDisk();

        // Log the extended payment (20% discount applied)
        const config = TIER_CONFIGS[room.tier];
        const discountedPrice = Math.round(config.priceKrw * 0.8);
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
    return this.clients.get(roomId)?.filter((c) => c.role !== 'host').length || 0;
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
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase
        .from('rooms')
        .update({ passcode })
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
        room.passcode = passcode;
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
      const { error } = await supabase
        .from('rooms')
        .update(updates)
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
  }
};
