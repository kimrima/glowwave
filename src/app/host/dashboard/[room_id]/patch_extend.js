const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'page.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Patch the "시간 연장" button onClick handler to dynamically initialize selectedExtendHours
const onClickSearch = `                onClick={() => {
                  if (room?.tier === 'free') {
                    setSelectedUpgradeTier(null);
                    setUpgradeStep('select');
                    setIsUpgradeModalOpen(true);
                  } else {
                    setExtendStep('info');
                    setIsExtendModalOpen(true);
                  }
                }}`;

const onClickReplace = `                onClick={() => {
                  if (room?.tier === 'free') {
                    setSelectedUpgradeTier(null);
                    setUpgradeStep('select');
                    setIsUpgradeModalOpen(true);
                  } else {
                    // If store/store_annual, default to 30 days (720 hours) and restrict day extensions
                    if (room?.tier === 'store' || room?.tier === 'store_annual') {
                      setSelectedExtendHours(720);
                    } else {
                      setSelectedExtendHours(24);
                    }
                    setExtendStep('info');
                    setIsExtendModalOpen(true);
                  }
                }}`;

// 2. Patch the extendInfoDesc translation inside modal header to dynamically show duration text (Step: 'info')
const infoDescSearch = `        const extendInfoDesc = {
          ko: <>방의 활성 시간을 <strong className="text-white">24시간 연장</strong>합니다.<br />연장 후에도 기존에 접속해 있던 관객들의 링크 및 QR 코드는 변경 없이 그대로 유지됩니다.</>,
          en: <>Extends the active room session by <strong className="text-white">24 hours</strong>.<br />The existing entry links and QR codes remain unchanged and work seamlessly.</>,
          ja: <>ルームの有効時間を <strong className="text-white">24시간延長</strong> します。<br />延長後도 기존의 観客用링크나 QR코드는 변경없이 그대로 유지됩니다.</>,
          es: <>Extiende la duración activa de la sala por <strong className="text-white">24 horas</strong>.<br />El enlace de acceso y código QR se mantendrán sin cambios.</>,
          'zh-TW': <>延長房間有效時間 <strong className="text-white">24 小時</strong>。<br />延長後觀眾原本使用的連結與 QR Code 均維持不變，可繼續使用。</>,
          'zh-HK': <>延長房間有效時間 <strong className="text-white">24 小時</strong>。<br />延長後觀眾原本使用的連結與 QR Code 均維持不變，可繼續使用。</>,
        }[activeLocale] || <>방의 활성 시간을 <strong className="text-white">24시간 연장</strong>합니다.<br />연장 후에도 기존에 접속해 있던 관객들의 링크 및 QR 코드는 변경 없이 그대로 유지됩니다.</>;`;

const infoDescReplace = `        const isStoreTier = room.tier === 'store' || room.tier === 'store_annual';
        const durationTextKo = isStoreTier 
          ? (selectedExtendHours === 8760 ? '365일(1년)' : '30일(1달)') 
          : '24시간';
        const durationTextEn = isStoreTier 
          ? (selectedExtendHours === 8760 ? '365 days (1 year)' : '30 days (1 month)') 
          : '24 hours';
        const durationTextJa = isStoreTier 
          ? (selectedExtendHours === 8760 ? '365日(1年)' : '30日(1ヶ月)') 
          : '24時間';
        const durationTextEs = isStoreTier 
          ? (selectedExtendHours === 8760 ? '365 días (1 año)' : '30 días (1 mes)') 
          : '24 horas';
        const durationTextZh = isStoreTier 
          ? (selectedExtendHours === 8760 ? '365 天 (1 年)' : '30 天 (1 個月)') 
          : '24 小時';

        const extendInfoDesc = {
          ko: <>방의 활성 시간을 <strong className="text-white">{durationTextKo} 연장</strong>합니다.<br />연장 후에도 기존에 접속해 있던 관객들의 링크 및 QR 코드는 변경 없이 그대로 유지됩니다.</>,
          en: <>Extends the active room session by <strong className="text-white">{durationTextEn}</strong>.<br />The existing entry links and QR codes remain unchanged and work seamlessly.</>,
          ja: <>ルームの有効時間を <strong className="text-white">{durationTextJa}延長</strong> します。<br />延長後も既存の観客用リンクやQRコードは変更なくそのまま維持されます。</>,
          es: <>Extiende la duración activa de la sala por <strong className="text-white">{durationTextEs}</strong>.<br />El enlace de acceso y código QR se mantendrán sin cambios.</>,
          'zh-TW': <>延長房間有效時間 <strong className="text-white">{durationTextZh}</strong>。<br />延長後觀眾原本使用的連結與 QR Code 均維持不變，可繼續使用。</>,
          'zh-HK': <>延長房間有效時間 <strong className="text-white">{durationTextZh}</strong>。<br />延長後觀眾原本使用的連結與 QR Code 均維持不變，可繼續使用。</>,
        }[activeLocale] || <>방의 활성 시간을 <strong className="text-white">{durationTextKo} 연장</strong>합니다.<br />연장 후에도 기존에 접속해 있던 관객들의 링크 및 QR 코드는 변경 없이 그대로 유지됩니다.</>;`;

// 3. Patch the payment details to load correct regular and final price tier keys dynamically (Step: 'payment')
const payDescSearch = `              {extendStep === 'payment' && (() => {
                const extendPayDesc = {
                  ko: <>방 연장 24시간 이용권을 결제합니다.<br />기존 이용 요금 대비 <strong className="text-indigo-300">20% 할인된 장기 고객 혜택가</strong>가 자동 적용됩니다.</>,
                  en: <>Process payment for a 24-hour session extension.<br />A <strong className="text-indigo-300">20% loyalty discount</strong> is automatically applied.</>,
                  ja: <>ルーム24時間延長チケットの決済を行います。<br />通常の利用料金から <strong className="text-indigo-300">20%割引された延長特別価格</strong> が自動適用されます。</>,
                  es: <>Se procesará el pago del pase de extensión de 24 horas.<br />Se aplica un <strong className="text-indigo-300">20% de descuento automático</strong> por fidelidad.</>,
                  'zh-TW': <>付款購買 24 小時延長時間。<br />系統已自動套用 <strong className="text-indigo-300">8 折의續用優惠價</strong>。</>,
                  'zh-HK': <>付款購買 24 小時延長時間。<br />系統已自動套用 <strong className="text-indigo-300">8 折의續用優惠價</strong>。</>,
                }[activeLocale] || <>방 연장 24시간 이용권을 결제합니다.<br />기존 이용 요금 대비 <strong className="text-indigo-300">20% 할인된 장기 고객 혜택가</strong>가 자동 적용됩니다.</>;`;

const payDescReplace = `              {extendStep === 'payment' && (() => {
                const isStoreTier = room.tier === 'store' || room.tier === 'store_annual';
                const durationTextKo = isStoreTier 
                  ? (selectedExtendHours === 8760 ? '365일(1년)' : '30일(1달)') 
                  : '24시간';
                const durationTextEn = isStoreTier 
                  ? (selectedExtendHours === 8760 ? '365-day' : '30-day') 
                  : '24-hour';
                const durationTextJa = isStoreTier 
                  ? (selectedExtendHours === 8760 ? '365日(1年)' : '30일(1ヶ月)') 
                  : '24時間';
                const durationTextEs = isStoreTier 
                  ? (selectedExtendHours === 8760 ? '365 días' : '30 días') 
                  : '24 horas';
                const durationTextZh = isStoreTier 
                  ? (selectedExtendHours === 8760 ? '365 天' : '30 天') 
                  : '24 小時';

                const extendPayDesc = {
                  ko: <>방 연장 {durationTextKo} 이용권을 결제합니다.<br />기존 이용 요금 대비 <strong className="text-indigo-300">20% 할인된 장기 고객 혜택가</strong>가 자동 적용됩니다.</>,
                  en: <>Process payment for a {durationTextEn} session extension.<br />A <strong className="text-indigo-300">20% loyalty discount</strong> is automatically applied.</>,
                  ja: <>ルーム{durationTextJa}延長チケットの決済を行います。<br />通常の利用料金から <strong className="text-indigo-300">20%割引された延長特別価格</strong> が自動適用されます。</>,
                  es: <>Se procesará el pago del pase de extensión de {durationTextEs}.<br />Se aplica un <strong className="text-indigo-300">20% de descuento automático</strong> por fidelidad.</>,
                  'zh-TW': <>付款購買 {durationTextZh} 延長時間。<br />系統已自動套用 <strong className="text-indigo-300">8 折의續用優惠價</strong>。</>,
                  'zh-HK': <>付款購買 {durationTextZh} 延長時間。<br />系統已自動套用 <strong className="text-indigo-300">8 折의續用優惠價</strong>。</>,
                }[activeLocale] || <>방 연장 {durationTextKo} 이용권을 결제합니다.<br />기존 이용 요금 대비 <strong className="text-indigo-300">20% 할인된 장기 고객 혜택가</strong>가 자동 적용됩니다.</>;`;

// 4. Patch refund warning text details to support flexible duration
const refundSearch = `                const refundWarningBody = {
                  ko: '방 시간 연장은 결제 완료 즉시 예약 리소스가 즉시 할당되어 24시간 연장 처리가 실행되므로, 단순 변심으로 인한 환불 및 결제 취소가 엄격히 불가능합니다. 이에 동의하시는 경우에만 결제를 진행해 주세요.',`;

const refundReplace = `                const refundWarningBody = {
                  ko: '방 시간 연장은 결제 완료 즉시 예약 리소스가 즉시 할당되어 선택한 기간의 연장 처리가 실행되므로, 단순 변심으로 인한 환불 및 결제 취소가 엄격히 불가능합니다. 이에 동의하시는 경우에만 결제를 진행해 주세요.',`;

// 5. Patch price formatting calls to feed correct targetTierForPrice
const priceStrSearch = `                const regularPriceStr = getFormattedLocalPrice(room.tier, activeLocale, 1);
                const discountStr = getFormattedLocalPrice(room.tier, activeLocale, 0.2);
                const finalAmtStr = getFormattedLocalPrice(room.tier, activeLocale, 0.8);`;

const priceStrReplace = `                const targetTierForPrice = (room.tier === 'store' || room.tier === 'store_annual')
                  ? (selectedExtendHours === 8760 ? 'store_annual' : 'store')
                  : room.tier;
                const regularPriceStr = getFormattedLocalPrice(targetTierForPrice, activeLocale, 1);
                const discountStr = getFormattedLocalPrice(targetTierForPrice, activeLocale, 0.2);
                const finalAmtStr = getFormattedLocalPrice(targetTierForPrice, activeLocale, 0.8);`;

let modified = false;

if (content.includes(onClickSearch)) {
  content = content.replace(onClickSearch, onClickReplace);
  modified = true;
  console.log('1. Patched button onClick handler successfully!');
}

if (content.includes(infoDescSearch)) {
  content = content.replace(infoDescSearch, infoDescReplace);
  modified = true;
  console.log('2. Patched info duration labels successfully!');
}

if (content.includes(payDescSearch)) {
  content = content.replace(payDescSearch, payDescReplace);
  modified = true;
  console.log('3. Patched payment duration labels successfully!');
}

if (content.includes(refundSearch)) {
  content = content.replace(refundSearch, refundReplace);
  modified = true;
  console.log('4. Patched refund warnings successfully!');
}

if (content.includes(priceStrSearch)) {
  content = content.replace(priceStrSearch, priceStrReplace);
  modified = true;
  console.log('5. Patched target price mappings successfully!');
}

if (modified) {
  fs.writeFileSync(targetFile, content, 'utf8');
  console.log('ALL patches applied successfully to page.tsx!');
} else {
  console.log('Search strings mismatch. Using fallback regex matching.');
  
  // Try regex for L2131 onClick
  const regexOnClick = /onClick=\{\(\)\s*=>\s*\{\s*if\s*\(room\?\.tier === 'free'\)\s*\{\s*setSelectedUpgradeTier\(null\);\s*setUpgradeStep\('select'\);\s*setIsUpgradeModalOpen\(true\);\s*\}\s*else\s*\{\s*setExtendStep\('info'\);\s*setIsExtendModalOpen\(true\);\s*\}\s*\}\}/;
  if (regexOnClick.test(content)) {
    content = content.replace(regexOnClick, `onClick={() => {
                  if (room?.tier === 'free') {
                    setSelectedUpgradeTier(null);
                    setUpgradeStep('select');
                    setIsUpgradeModalOpen(true);
                  } else {
                    if (room?.tier === 'store' || room?.tier === 'store_annual') {
                      setSelectedExtendHours(720);
                    } else {
                      setSelectedExtendHours(24);
                    }
                    setExtendStep('info');
                    setIsExtendModalOpen(true);
                  }
                }}`);
    console.log('Regex 1 onClick match applied!');
    modified = true;
  }

  // Try regex for priceStr
  const regexPrice = /const\s*regularPriceStr\s*=\s*getFormattedLocalPrice\(room\.tier,\s*activeLocale,\s*1\);\s*const\s*discountStr\s*=\s*getFormattedLocalPrice\(room\.tier,\s*activeLocale,\s*0\.2\);\s*const\s*finalAmtStr\s*=\s*getFormattedLocalPrice\(room\.tier,\s*activeLocale,\s*0\.8\);/;
  if (regexPrice.test(content)) {
    content = content.replace(regexPrice, `const targetTierForPrice = (room.tier === 'store' || room.tier === 'store_annual')
                  ? (selectedExtendHours === 8760 ? 'store_annual' : 'store')
                  : room.tier;
                const regularPriceStr = getFormattedLocalPrice(targetTierForPrice, activeLocale, 1);
                const discountStr = getFormattedLocalPrice(targetTierForPrice, activeLocale, 0.2);
                const finalAmtStr = getFormattedLocalPrice(targetTierForPrice, activeLocale, 0.8);`);
    console.log('Regex 5 prices match applied!');
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(targetFile, content, 'utf8');
    console.log('Successfully completed regex-based fallback patches!');
  } else {
    console.log('Regex fallback matching failed.');
  }
}
