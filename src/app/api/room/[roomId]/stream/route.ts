import { NextRequest } from 'next/server';
import { localDb } from '@/lib/localDb';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: any }
) {
  // Await params to ensure compatibility with Next.js 15 while remaining backwards compatible with Next.js 14
  const resolvedParams = await params;
  const roomId = (resolvedParams.roomId as string).toUpperCase();

  const room = await localDb.getRoom(roomId);
  if (!room) {
    return new Response(JSON.stringify({ error: 'Room not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Extract role, uuid, and passcode query parameters
  const role = request.nextUrl.searchParams.get('role') || 'audience';
  const uuid = request.nextUrl.searchParams.get('uuid') || '';
  const passcode = request.nextUrl.searchParams.get('passcode') || '';

  // Enforce passcode check if active on the room and role is audience
  if (room.passcode && role === 'audience' && room.passcode !== passcode) {
    return new Response(JSON.stringify({ error: '비밀번호가 올바르지 않거나 입력되지 않았습니다.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Set up ReadableStream for Server-Sent Events (SSE)
  let clientId = '';
  const stream = new ReadableStream({
    async start(controller) {
      clientId = uuid || crypto.randomUUID();
      
      // Register SSE client
      localDb.addClient(roomId, clientId, controller, role);

      // Send initial connection details & current signboard state
      const currentState = await localDb.getCurrentState(roomId);
      const initialPayload = {
        event: 'init',
        state: currentState,
        maxParticipants: room.max_participants,
        currentCount: localDb.getClientCount(roomId),
      };
      
      controller.enqueue(
        new TextEncoder().encode(`data: ${JSON.stringify(initialPayload)}\n\n`)
      );

      // Heartbeat keep-alive every 15 seconds to prevent browser/gateway timeouts
      const keepAliveInterval = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(': keep-alive\n\n'));
        } catch (e) {
          clearInterval(keepAliveInterval);
        }
      }, 15000);

      // Remove client when connection is closed
      request.signal.addEventListener('abort', () => {
        clearInterval(keepAliveInterval);
        localDb.removeClient(roomId, clientId);
      });
    },
    cancel() {
      if (clientId) {
        localDb.removeClient(roomId, clientId);
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable buffering for Nginx/Vercel proxies
    },
  });
}
