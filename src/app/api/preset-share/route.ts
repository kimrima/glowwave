import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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

// Read shares from file and clean up expired keys automatically
function readShares(): Record<string, { presets: any[]; expiresAt: number }> {
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
        writeShares(shares);
      }
      return shares;
    }
  } catch (err) {
    console.error('[preset-share] Error reading shares file:', err);
  }
  return {};
}

function writeShares(shares: Record<string, { presets: any[]; expiresAt: number }>) {
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

    const shares = readShares();

    // Generate random 6-character uppercase key (avoid confusing characters like O, 0, I, 1)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let shareKey = '';
    // Let's guarantee uniqueness
    for (let attempt = 0; attempt < 100; attempt++) {
      shareKey = '';
      for (let i = 0; i < 6; i++) {
        shareKey += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      if (!shares[shareKey]) break;
    }

    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes lifetime
    shares[shareKey] = { presets, expiresAt };
    writeShares(shares);

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

    const shares = readShares();
    const share = shares[key];
    
    if (!share || Date.now() > share.expiresAt) {
      if (share) {
        delete shares[key];
        writeShares(shares);
      }
      return NextResponse.json({ error: '만료되었거나 유효하지 않은 공유 코드입니다.' }, { status: 404 });
    }

    return NextResponse.json({ presets: share.presets });
  } catch (e) {
    console.error('[API Preset Share GET] Error:', e);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
