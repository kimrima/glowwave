import fs from 'fs';
import path from 'path';
import { Room, Payment, Preset, TierType, TIER_CONFIGS } from './types';

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

const DB_FILE = path.join(process.cwd(), 'src', 'lib', 'local_db.json');

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
    console.error('[localDb] Failed to read local DB file:', err);
  }
  return {
    rooms: new Map<string, Room>(),
    payments: [] as Payment[],
    currentStates: new Map<string, Preset>()
  };
}

function writeDb(rooms: Map<string, Room>, payments: Payment[], currentStates: Map<string, Preset>) {
  try {
    const data = {
      rooms: Object.fromEntries(rooms.entries()),
      payments: payments,
      currentStates: Object.fromEntries(currentStates.entries())
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('[localDb] Failed to write local DB file:', err);
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

  cleanupExpiredRooms(): void {
    this.loadFromDisk();
    const now = new Date();
    const expiryPeriodMs = 24 * 60 * 60 * 1000; // 24 hours
    let changed = false;

    for (const [roomId, room] of this.rooms.entries()) {
      const createdAt = new Date(room.created_at);
      if (now.getTime() - createdAt.getTime() > expiryPeriodMs) {
        console.log(`[localDb] Expiring room: ${roomId} created at ${room.created_at}`);
        
        // Notify any active clients that the room has expired
        this.broadcastEvent(roomId, { event: 'room_expired', room_id: roomId });
        
        // Close all client connections
        const clientList = this.clients.get(roomId);
        if (clientList) {
          clientList.forEach((client) => {
            try {
              client.controller.close();
            } catch (err) {
              // Ignore
            }
          });
          this.clients.delete(roomId);
        }
        
        // Delete state and room itself
        this.currentStates.delete(roomId);
        this.rooms.delete(roomId);
        changed = true;
      }
    }

    if (changed) {
      this.saveToDisk();
    }
  },

  createRoom(roomId: string, email: string, tier: TierType, hostSessionToken: string): Room {
    this.cleanupExpiredRooms();
    const config = TIER_CONFIGS[tier];
    const newRoom: Room = {
      id: roomId,
      host_session_token: hostSessionToken,
      email,
      tier,
      status: 'active',
      max_participants: config.maxParticipants,
      created_at: new Date().toISOString(),
    };
    this.rooms.set(roomId, newRoom);
    
    // Set default preset state (solid black with "GlowWave" text)
    this.currentStates.set(roomId, {
      bg_color: '#0B0B0F',
      text: 'GlowWave 🌊',
      text_color: '#FFFFFF',
      effect: 'none',
      speed: 1000,
    });
    
    this.saveToDisk();
    return newRoom;
  },

  getRoom(roomId: string): Room | undefined {
    this.cleanupExpiredRooms();
    return this.rooms.get(roomId);
  },

  getRoomsByEmail(email: string): Room[] {
    this.cleanupExpiredRooms();
    return Array.from(this.rooms.values()).filter(
      (room) => room.email.toLowerCase() === email.toLowerCase() && room.status === 'active'
    );
  },

  addPayment(
    email: string,
    hostSessionToken: string,
    roomId: string,
    tier: TierType,
    amount: number,
    status: 'pending' | 'completed' | 'failed'
  ): Payment {
    this.loadFromDisk();
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
    this.payments.push(payment);
    this.saveToDisk();
    return payment;
  },

  updatePaymentStatus(roomId: string, status: 'completed' | 'failed'): boolean {
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
  },

  getCurrentState(roomId: string): Preset | undefined {
    this.loadFromDisk();
    return this.currentStates.get(roomId);
  },

  setCurrentState(roomId: string, state: Preset): void {
    this.loadFromDisk();
    this.currentStates.set(roomId, state);
    this.saveToDisk();
  },

  addClient(roomId: string, clientId: string, controller: ReadableStreamDefaultController, role?: string): void {
    if (!this.clients.has(roomId)) {
      this.clients.set(roomId, []);
    }
    this.clients.get(roomId)!.push({ id: clientId, controller, role });
    
    // Notify room of connection count update
    this.broadcastEvent(roomId, { event: 'presence', count: this.getClientCount(roomId) });
  },

  removeClient(roomId: string, clientId: string): void {
    const list = this.clients.get(roomId);
    if (list) {
      const idx = list.findIndex((c) => c.id === clientId);
      if (idx !== -1) {
        list.splice(idx, 1);
        // Notify room of connection count update
        this.broadcastEvent(roomId, { event: 'presence', count: this.getClientCount(roomId) });
      }
    }
  },

  getClientCount(roomId: string): number {
    return this.clients.get(roomId)?.filter((c) => c.role !== 'host').length || 0;
  },

  broadcastEvent(roomId: string, data: any): void {
    const list = this.clients.get(roomId);
    if (!list) return;

    const payload = `data: ${JSON.stringify(data)}\n\n`;
    const encoder = new TextEncoder();

    // Broadcast to all active SSE streams for this room
    list.forEach((client) => {
      try {
        client.controller.enqueue(encoder.encode(payload));
      } catch (err) {
        // Handle closed controller error silently (removed on disconnect hook)
      }
    });
  }
};
