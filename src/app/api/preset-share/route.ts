import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

// Helper to locate package.json with name "glowwave"
function findWorkspaceRoot(): string {
  let currentDir = __dirname;
  for (let i = 0; i < 12; i++) {
    const pkgPath = path.join(currentDir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        if (pkg.name === 'glowwave') {
          return currentDir;
        }
      } catch (e) {}
    }
    const parent = path.dirname(currentDir);
    if (parent === currentDir) break;
    currentDir = parent;
  }
  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, 'package.json'))) {
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf8'));
      if (pkg.name === 'glowwave') return cwd;
    } catch (e) {}
  }
  const desktopDir = path.join(cwd, 'Desktop', '전광판');
  if (fs.existsSync(desktopDir)) {
    return desktopDir;
  }
  return cwd;
}

const rootDir = findWorkspaceRoot();
const SHARES_FILE = path.join(rootDir, 'src', 'lib', 'preset_shares.json');

// Read local shares from file and clean up expired keys automatically
function readLocalShares(): Record<string, { presets: any[]; expiresAt: number }> {
  try {
    if (fs.existsSync(SHARES_FILE)) {
      const data = fs.readFileSync(SHARES_FILE, 'utf8');
      const shares = JSON.parse(data);
      const now = Date.now();
      let changed = false;
      
      // Clean up expired keys
      for (const key of Object.keys(shares)) {
        if (now > shares[key].expiresAt) {
          delete shares[key];
          changed = true;
        }
      }
      
      if (changed) {
        writeLocalShares(shares);
      }
      return shares;
    }
  } catch (err) {
    console.error('[preset-share] Error reading shares file:', err);
  }
  return {};
}

function writeLocalShares(shares: Record<string, { presets: any[]; expiresAt: number }>) {
  try {
    const dir = path.dirname(SHARES_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SHARES_FILE, JSON.stringify(shares, null, 2), 'utf8');
  } catch (err) {
    console.error('[preset-share] Error writing shares file:', err);
  }
}

export async function POST(request: Request) {
  try {
    const { presets } = await request.json();
    if (!Array.isArray(presets)) {
      return NextResponse.json({ error: 'Invalid presets format' }, { status: 400 });
    }

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let shareKey = '';

    if (isSupabaseConfigured() && supabase) {
      // 1. Supabase-based sharing storage (Works across all distributed server instances & devices)
      
      // Clean up expired shares in Supabase (created > 10 minutes ago) to prevent DB bloating
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      await supabase
        .from('rooms')
        .delete()
        .eq('email', 'share@glowwave.com')
        .lt('created_at', tenMinutesAgo);

      for (let attempt = 0; attempt < 100; attempt++) {
        shareKey = '';
        for (let i = 0; i < 6; i++) {
          shareKey += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        // Verify key is unique in rooms table
        const { data } = await supabase.from('rooms').select('id').eq('id', shareKey).maybeSingle();
        if (!data) break;
      }

      // Store in rooms table as a dummy room representing this preset share
      const { error } = await supabase.from('rooms').insert({
        id: shareKey,
        email: 'share@glowwave.com', // Special email marker to indicate a preset share row
        tier: 'free',
        status: 'active',
        current_state: { presets } // Store actual presets in the JSONB current_state column
      });

      if (error) {
        console.error('[API Preset Share POST] Supabase insert error:', error);
        throw new Error('Supabase insert failed');
      }
    } else {
      // 2. Local file-based sharing storage fallback
      const shares = readLocalShares();
      for (let attempt = 0; attempt < 100; attempt++) {
        shareKey = '';
        for (let i = 0; i < 6; i++) {
          shareKey += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        if (!shares[shareKey]) break;
      }

      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes lifetime
      shares[shareKey] = { presets, expiresAt };
      writeLocalShares(shares);
    }

    return NextResponse.json({ shareKey });
  } catch (e) {
    console.error('[API Preset Share POST] Error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key')?.toUpperCase();

    if (!key) {
      return NextResponse.json({ error: 'Missing key parameter' }, { status: 400 });
    }

    if (isSupabaseConfigured() && supabase) {
      // 1. Fetch from Supabase
      const { data: room, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', key)
        .eq('email', 'share@glowwave.com')
        .maybeSingle();

      if (error || !room) {
        return NextResponse.json({ error: '만료되었거나 유효하지 않은 공유 코드입니다.' }, { status: 404 });
      }

      // Check if expired (10 minutes limit)
      const createdAt = new Date(room.created_at).getTime();
      const now = Date.now();
      if (now - createdAt > 10 * 60 * 1000) {
        // Delete expired record
        await supabase.from('rooms').delete().eq('id', key);
        return NextResponse.json({ error: '만료되었거나 유효하지 않은 공유 코드입니다.' }, { status: 404 });
      }

      const presets = room.current_state?.presets || [];
      return NextResponse.json({ presets });
    } else {
      // 2. Fetch from local file
      const shares = readLocalShares();
      const share = shares[key];
      
      if (!share || Date.now() > share.expiresAt) {
        if (share) {
          delete shares[key];
          writeLocalShares(shares);
        }
        return NextResponse.json({ error: '만료되었거나 유효하지 않은 공유 코드입니다.' }, { status: 404 });
      }

      return NextResponse.json({ presets: share.presets });
    }
  } catch (e) {
    console.error('[API Preset Share GET] Error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
