const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'page.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 0. Patch state declarations to declare selectedExtendHours state using regex
const stateRegex = /const \[isExtendModalOpen, setIsExtendModalOpen\] = useState\(false\);\s*const \[extendStep, setExtendStep\] = useState<[^>]+>\('info'\);\s*const \[isExtending, setIsExtending\] = useState\(false\);/;
const stateReplace = `const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [extendStep, setExtendStep] = useState<'info' | 'payment' | 'success'>('info');
  const [isExtending, setIsExtending] = useState(false);
  const [selectedExtendHours, setSelectedExtendHours] = useState<number>(24);`;

if (stateRegex.test(content)) {
  content = content.replace(stateRegex, stateReplace);
  console.log('Successfully patched state declarations for selectedExtendHours!');
} else {
  console.log('State declarations already patched or regex mismatch.');
}

// 0-B. Patch handleExtendRoom function to pass extra_hours payload using regex
const handleExtendRegex = /const handleExtendRoom = async \(\) => \{\s*if \(!roomId \|\| !token\) return;\s*setIsExtending\(true\);\s*try \{\s*const res = await fetch\(\`\/api\/room\/extend\`,\s*\{\s*method: 'POST',\s*headers: \{\s*'Content-Type': 'application\/json'\s*\},\s*body: JSON\.stringify\(\{\s*room_id: roomId,\s*host_session_token: token\s*\}\)\s*\}\);/;
const handleExtendReplace = `const handleExtendRoom = async () => {
    if (!roomId || !token) return;
    setIsExtending(true);
    try {
      const res = await fetch(\`/api/room/extend\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: roomId,
          host_session_token: token,
          extra_hours: selectedExtendHours
        })
      });`;

if (handleExtendRegex.test(content)) {
  content = content.replace(handleExtendRegex, handleExtendReplace);
  console.log('Successfully patched handleExtendRoom fetch payload!');
} else {
  console.log('handleExtendRoom payload already patched or regex mismatch.');
}

// 1. Patch active tier badge label in header to translate store/store_annual
const badgeSearch = `<span className="text-xs font-black text-white px-2 py-0.5 rounded-md bg-white/5 uppercase border border-white/5">
                  {room?.tier}
                </span>`;
const badgeReplace = `<span className="text-xs font-black text-white px-2 py-0.5 rounded-md bg-white/5 uppercase border border-white/5">
                  {
                    room?.tier === 'free' ? (activeLocale === 'ko' ? '일일체험' : 'FREE') :
                    room?.tier === 'store' ? (activeLocale === 'ko' ? '매장 월간' : 'STORE') :
                    room?.tier === 'store_annual' ? (activeLocale === 'ko' ? '매장 연간' : 'STORE ANNUAL') :
                    room?.tier?.toUpperCase()
                  }
                </span>`;
if (content.includes(badgeSearch)) {
  content = content.replace(badgeSearch, badgeReplace);
  console.log('Successfully patched active tier badge translations!');
} else {
  console.log('Badge markup already modified or not found.');
}

// 2. Patch room expiration duration limit branch (store/store_annual 30d/365d duration math)
const durationSearch = `      } else if (room.tier === 'store' || room.tier === 'store_annual') {
        limitMs = 365 * 24 * 60 * 60 * 1000;
      }`;
const durationReplace = `      } else if (room.tier === 'store') {
        limitMs = 30 * 24 * 60 * 60 * 1000;
      } else if (room.tier === 'store_annual') {
        limitMs = 365 * 24 * 60 * 60 * 1000;
      }`;
if (content.includes(durationSearch)) {
  content = content.replace(durationSearch, durationReplace);
  console.log('Successfully patched duration calculations split!');
} else {
  console.log('Duration calculations already patched.');
}

// 3. Patch extendStep === 'info' layout using dynamic regex
const infoRegex = /\{extendStep === 'info' && \(\s*<div className="flex flex-col gap-5 text-left">[\s\S]+?<\/div>\s*\)\}/;

const infoReplace = `{extendStep === 'info' && (() => {
                let tierDurationMs = 24 * 60 * 60 * 1000;
                if (room.tier === 'free') {
                  tierDurationMs = 6 * 60 * 60 * 1000;
                } else if (room.tier === 'store') {
                  tierDurationMs = 30 * 24 * 60 * 60 * 1000;
                } else if (room.tier === 'store_annual') {
                  tierDurationMs = 365 * 24 * 60 * 60 * 1000;
                }
                const isStoreTier = room.tier === 'store' || room.tier === 'store_annual';

                return (
                  <div className="flex flex-col gap-5 text-left">
                    <div className="text-xs sm:text-sm text-zinc-300 leading-relaxed bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-2xl">
                      <span className="font-extrabold text-indigo-300 block mb-1">{noticeTitle}</span>
                      {extendInfoDesc}
                    </div>

                    {isStoreTier && (
                      <div className="flex flex-col gap-2 bg-black/40 border border-white/5 p-3 rounded-2xl">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">
                          {activeLocale === 'ko' ? '연장 플랜 선택' : 'Select Extension Duration'}
                        </span>
                        <div className="flex gap-2 p-1 rounded-xl bg-black/30 border border-white/5">
                          <button
                            type="button"
                            onClick={() => setSelectedExtendHours(720)}
                            className={\`flex-1 py-2 text-center rounded-lg text-xs font-bold transition-all cursor-pointer select-none \${
                              selectedExtendHours === 720
                                ? 'bg-white text-black shadow font-black'
                                : 'text-zinc-400 hover:text-white hover:bg-white/5'
                            }\`}
                          >
                            {activeLocale === 'ko' ? '30일 연장 (월간)' : '30-Day (Monthly)'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedExtendHours(8760)}
                            className={\`flex-1 py-2 text-center rounded-lg text-xs font-bold transition-all cursor-pointer select-none \${
                              selectedExtendHours === 8760
                                ? 'bg-white text-black shadow font-black'
                                : 'text-zinc-400 hover:text-white hover:bg-white/5'
                            }\`}
                          >
                            {activeLocale === 'ko' ? '365일 연장 (연간)' : '365-Day (Annual)'}
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <div className="bg-black/30 border border-white/5 rounded-2xl p-4 flex flex-col gap-2.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">{currentPlanLabel}</span>
                        <span className="text-white font-extrabold uppercase">
                          {
                            room.tier === 'store' ? (activeLocale === 'ko' ? '매장 월간 플랜' : 'STORE MONTHLY') :
                            room.tier === 'store_annual' ? (activeLocale === 'ko' ? '매장 연간 플랜' : 'STORE ANNUAL') :
                            \`\${room.tier.toUpperCase()} Plan\`
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">{currentExpiryLabel}</span>
                        <span className="text-zinc-300 font-mono">
                          {new Date(new Date(room.created_at).getTime() + tierDurationMs).toLocaleString(activeLocale === 'zh-TW' ? 'zh-TW' : (activeLocale === 'zh-HK' ? 'zh-HK' : activeLocale))}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-white/5 pt-2">
                        <span className="text-indigo-400 font-bold">{extendedExpiryLabel}</span>
                        <span className="text-indigo-300 font-mono font-bold">
                          {new Date(Math.max(Date.now(), new Date(room.created_at).getTime() + tierDurationMs) + selectedExtendHours * 60 * 60 * 1000).toLocaleString(activeLocale === 'zh-TW' ? 'zh-TW' : (activeLocale === 'zh-HK' ? 'zh-HK' : activeLocale))}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setExtendStep('payment')}
                      className="w-full py-4 rounded-2xl bg-white text-black hover:bg-zinc-200 font-extrabold text-sm transition-all duration-200 cursor-pointer shadow-lg shadow-white/5"
                    >
                      {proceedToPaymentLabel}
                    </button>
                  </div>
                );
              })()}`;

if (infoRegex.test(content)) {
  content = content.replace(infoRegex, infoReplace);
  console.log('Successfully patched infoStep modal selections using regex!');
} else {
  console.log('infoStep modal selections already modified or regex mismatch.');
}

// 4. Patch pricing references
const pricingSearch = `                const regularPriceStr = getFormattedLocalPrice(room.tier, activeLocale, 1);
                const discountStr = getFormattedLocalPrice(room.tier, activeLocale, 0.2);
                const finalAmtStr = getFormattedLocalPrice(room.tier, activeLocale, 0.8);`;
const pricingReplace = `                let targetTierForPrice = room.tier;
                if (room.tier === 'store' || room.tier === 'store_annual') {
                  targetTierForPrice = selectedExtendHours === 8760 ? 'store_annual' : 'store';
                }
                const regularPriceStr = getFormattedLocalPrice(targetTierForPrice, activeLocale, 1);
                const discountStr = getFormattedLocalPrice(targetTierForPrice, activeLocale, 0.2);
                const finalAmtStr = getFormattedLocalPrice(targetTierForPrice, activeLocale, 0.8);`;
if (content.includes(pricingSearch)) {
  content = content.replace(pricingSearch, pricingReplace);
  console.log('Successfully patched pricing references!');
} else {
  console.log('Pricing references already patched.');
}

// 5. Patch productVal inside payment step to be dynamic (lines around 5230)
const productSearch = `                const productVal = {
                  ko: '24시간 시간 연장 이용권',
                  en: '24-Hour Session Extension Pass',
                  ja: '24시간룸연장티켓',
                  es: 'Pase de Extensión de 24 Horas',
                  'zh-TW': '24 小時延長使用券',
                  'zh-HK': '24 小時延長使用券',
                }[activeLocale] || '24시간 시간 연장 이용권';`;

const productReplace = `const isStoreTier = room.tier === 'store' || room.tier === 'store_annual';
                const productVal = {
                  ko: isStoreTier 
                    ? (selectedExtendHours === 8760 ? '매장 전용 365일(1년) 시간 연장 이용권' : '매장 전용 30일(1달) 시간 연장 이용권')
                    : '24시간 시간 연장 이용권',
                  en: isStoreTier
                    ? (selectedExtendHours === 8760 ? 'Store 365-Day Session Extension Pass' : 'Store 30-Day Session Extension Pass')
                    : '24-Hour Session Extension Pass',
                  ja: isStoreTier
                    ? (selectedExtendHours === 8760 ? '店舗365일룸延長チケット' : '店舗30일룸延長チケット')
                    : '24시간룸연장티켓',
                  es: isStoreTier
                    ? (selectedExtendHours === 8760 ? 'Pase de Extensión de 365 Días' : 'Pase de Extensión de 30 Días')
                    : 'Pase de Extensión de 24 Horas',
                  'zh-TW': isStoreTier
                    ? (selectedExtendHours === 8760 ? '商戶 365 天延長使用券' : '商戶 30 天延長使用券')
                    : '24 小時延長使用券',
                  'zh-HK': isStoreTier
                    ? (selectedExtendHours === 8760 ? '商戶 365 天延長使用券' : '商戶 30 天延長使用券')
                    : '24 小時延長使用券',
                }[activeLocale] || '시간 연장 이용권';`;

// Simple includes check
if (content.includes(productSearch)) {
  content = content.replace(productSearch, productReplace);
  console.log('Successfully patched productVal dynamically!');
} else {
  // Try regex in case of slight spacing differences
  const regex = /const productVal = \{\s+ko: '24시간 시간 연장 이용권',[\s\S]+?\}\[activeLocale\] \|\| '24시간 시간 연장 이용권';/;
  if (regex.test(content)) {
    content = content.replace(regex, productReplace);
    console.log('Successfully patched productVal dynamically using regex!');
  } else {
    console.log('productVal declaration already patched or layout mismatch.');
  }
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Finished patch_extend execution!');
