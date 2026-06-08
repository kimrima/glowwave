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

  // Extract role query parameter to ignore host connections in audience counts
  const role = request.nextUrl.searchParams.get('role') || 'audience';

  // Set up ReadableStream for Server-Sent Events (SSE)
  let clientId = '';
  const stream = new ReadableStream({
    async start(controller) {
      clientId = crypto.randomUUID();
      
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
