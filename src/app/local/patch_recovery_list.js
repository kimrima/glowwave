const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'page.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Target the recovery fetch handler to sort data.rooms by created_at in descending order (newest first)
const sortSearch = `      if (data.rooms && data.rooms.length > 0) {
        setSyncRecoveryRooms(data.rooms);`;

const sortReplace = `      if (data.rooms && data.rooms.length > 0) {
        // Sort rooms by created_at in descending order (newest first)
        const sortedRooms = [...data.rooms].sort((a, b) => {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        setSyncRecoveryRooms(sortedRooms);`;

// 2. Target the UI list mapping inside JSX to inject custom badges and remaining time calculations
const markupSearch = `                            {syncRecoveryRooms.map((room) => (
                              <button
                                key={room.room_id}
                                type="button"
                                onClick={() => handleSelectRecoveredRoom(room)}
                                className="w-full p-3 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-left flex justify-between items-center group active:scale-[0.99]"
                              >
                                <div>
                                  <span className="text-xs font-black text-white block group-hover:text-violet-400 transition-colors">
                                    ID: {room.room_id}
                                  </span>
                                  <span className="text-[10px] text-zinc-500 font-mono">
                                    {room.tier.toUpperCase()} • Created: {new Date(room.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                                <span className="text-[10px] font-bold text-violet-400 group-hover:translate-x-0.5 transition-transform">
                                  {activeLocale === 'ko' ? '이 방 복구하기 →' : 'Restore →'}
                                </span>
                              </button>
                            ))}`;

const markupReplace = `                            {(() => {
                              // Local helper to calculate remaining duration
                              const getRemainingTimeForList = (tier, createdAt) => {
                                const createdTime = new Date(createdAt).getTime();
                                let limitMs = 24 * 60 * 60 * 1000;
                                if (tier === 'free') {
                                  limitMs = 6 * 60 * 60 * 1000;
                                } else if (tier === 'store') {
                                  limitMs = 30 * 24 * 60 * 60 * 1000;
                                } else if (tier === 'store_annual') {
                                  limitMs = 365 * 24 * 60 * 60 * 1000;
                                }
                                const diff = (createdTime + limitMs) - Date.now();
                                if (diff <= 0) return activeLocale === 'ko' ? '만료됨' : 'Expired';
                                
                                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                                
                                if (days > 0) {
                                  return activeLocale === 'ko' ? \`\${days}일 \${hours}시간 남음\` : \`\${days}d \${hours}h left\`;
                                }
                                return activeLocale === 'ko' ? \`\${hours}시간 \${minutes}분 남음\` : \`\${hours}h \${minutes}m left\`;
                              };

                              // Local helper to render custom tier badge styles
                              const getTierBadge = (tier) => {
                                const badgeStyles = {
                                  free: {
                                    text: activeLocale === 'ko' ? '일일체험' : 'Free Trial',
                                    css: 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                                  },
                                  store: {
                                    text: activeLocale === 'ko' ? '매장 월간' : 'Store Monthly',
                                    css: 'bg-violet-950/40 border-violet-500/30 text-violet-400'
                                  },
                                  store_annual: {
                                    text: activeLocale === 'ko' ? '매장 연간' : 'Store Annual',
                                    css: 'bg-fuchsia-950/40 border-fuchsia-500/30 text-fuchsia-400'
                                  },
                                  lite: {
                                    text: 'LITE',
                                    css: 'bg-zinc-800 border-zinc-700 text-zinc-300'
                                  },
                                  pro: {
                                    text: 'PRO',
                                    css: 'bg-blue-950/40 border-blue-500/30 text-blue-400'
                                  },
                                  max: {
                                    text: 'MAX',
                                    css: 'bg-amber-950/40 border-amber-500/30 text-amber-400'
                                  }
                                };

                                const info = badgeStyles[tier] || { text: tier.toUpperCase(), css: 'bg-zinc-800 border-zinc-700 text-zinc-300' };
                                return (
                                  <span className={\`px-2 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-wider \${info.css}\`}>
                                    {info.text}
                                  </span>
                                );
                              };

                              return syncRecoveryRooms.map((room) => (
                                <button
                                  key={room.room_id}
                                  type="button"
                                  onClick={() => handleSelectRecoveredRoom(room)}
                                  className="w-full p-3.5 rounded-2xl border border-white/10 hover:border-violet-500/40 hover:bg-white/[0.02] bg-white/[0.01] transition-all text-left flex justify-between items-center group active:scale-[0.99]"
                                 GelwWave-custom-style="true"
                                >
                                  <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-black text-white group-hover:text-violet-400 transition-colors">
                                        ID: {room.room_id}
                                      </span>
                                      {getTierBadge(room.tier)}
                                    </div>
                                    <div className="flex flex-col gap-0.5 text-[10px] text-zinc-400 font-mono">
                                      <span>
                                        {activeLocale === 'ko' ? '만든 날짜:' : 'Created:'} {new Date(room.created_at).toLocaleDateString()}
                                      </span>
                                      <span className="text-zinc-500 font-semibold">
                                        {activeLocale === 'ko' ? '남은 시간:' : 'Time Left:'} <span className="text-zinc-300">{getRemainingTimeForList(room.tier, room.created_at)}</span>
                                      </span>
                                    </div>
                                  </div>
                                  <span className="text-[10px] font-bold text-violet-400 group-hover:translate-x-0.5 transition-transform shrink-0">
                                    {activeLocale === 'ko' ? '이 방 복구하기 →' : 'Restore →'}
                                  </span>
                                </button>
                              ));
                            })()}`;

let modified = false;

if (content.includes(sortSearch)) {
  content = content.replace(sortSearch, sortReplace);
  modified = true;
  console.log('1. Sorted room recovery results successfully!');
}

if (content.includes(markupSearch)) {
  content = content.replace(markupSearch, markupReplace);
  modified = true;
  console.log('2. Injected dynamic list markup successfully!');
}

if (modified) {
  fs.writeFileSync(targetFile, content, 'utf8');
} else {
  console.log('Target blocks not found. Attempting regex replacement.');
  // Flexible regex mapping for part 2
  const regexMarkup = /\{syncRecoveryRooms\.map\(\(room\) => \([\s\S]*?<\/button>\s*?\)\)\}/;
  if (regexMarkup.test(content)) {
    content = content.replace(regexMarkup, markupReplace);
    fs.writeFileSync(targetFile, content, 'utf8');
    console.log('Successfully replaced recovery list layout via regex!');
  } else {
    console.log('Regex match failed.');
  }
}
