import { NextRequest } from 'next/server';
import crypto from 'crypto';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'glowwave123';

// Cryptographic token using HMAC SHA-256 of the admin password
export function generateAdminToken(): string {
  const hmac = crypto.createHmac('sha256', ADMIN_PASSWORD);
  hmac.update('glowwave_admin_secure_session_salt_v1');
  return hmac.digest('hex');
}

export function verifyAdminToken(token: string | null): boolean {
  if (!token) return false;
  const expectedToken = generateAdminToken();
  return token === expectedToken;
}

export function getAdminTokenFromRequest(req: NextRequest): string | null {
  const cookie = req.cookies.get('glowwave_admin_token');
  return cookie ? cookie.value : null;
}
