import { Room, Payment, Preset, TierType, TIER_CONFIGS } from './types';

interface SSEClient {
  id: string;
  controller: ReadableStreamDefaultController;
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

export const localDb = {
  rooms: globalForRoomStore.rooms,
  payments: globalForRoomStore.payments,
  clients: globalForRoomStore.clients,
  currentStates: globalForRoomStore.currentStates,

  createRoom(roomId: string, email: string, tier: TierType, hostSessionToken: string): Room {
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
    
    return newRoom;
  },

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  },

  getRoomsByEmail(email: string): Room[] {
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
    return payment;
  },

  updatePaymentStatus(roomId: string, status: 'completed' | 'failed'): boolean {
    const payment = this.payments.find((p) => p.room_id === roomId);
    if (payment) {
      payment.payment_status = status;
      if (status === 'completed') {
        const room = this.rooms.get(roomId);
        if (room) {
          room.status = 'active';
        }
      }
      return true;
    }
    return false;
  },

  getCurrentState(roomId: string): Preset | undefined {
    return this.currentStates.get(roomId);
  },

  setCurrentState(roomId: string, state: Preset): void {
    this.currentStates.set(roomId, state);
  },

  addClient(roomId: string, clientId: string, controller: ReadableStreamDefaultController): void {
    if (!this.clients.has(roomId)) {
      this.clients.set(roomId, []);
    }
    this.clients.get(roomId)!.push({ id: clientId, controller });
    
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
    return this.clients.get(roomId)?.length || 0;
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
