const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'page.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Regex to target extendInfoDesc definition (L5058-L5065 approx)
const regexInfoDesc = /const\s+extendInfoDesc\s+=\s+\{[\s\S]*?\}\[activeLocale\]\s*\|\|\s*<[\s\S]*?>[\s\S]*?<\/>;/;

// 2. Regex to target extendPayDesc definition (L5209-L5216 approx)
const regexPayDesc = /const\s+extendPayDesc\s+=\s+\{[\s\S]*?\}\[activeLocale\]\s*\|\|\s*<[\s\S]*?>[\s\S]*?<\/>;/;

let modified = false;

if (regexInfoDesc.test(content)) {
  const replaceStrInfo = `const isStoreTier = room.tier === 'store' || room.tier === 'store_annual';
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
          'zh-TW': <>延長房間有效時間 <strong className="text-white">{durationTextZh}</strong>。<br />延長後觀眾原本使用的連結與 QR Code 均維持不變，可繼續 사용 가능합니다.</>,
          'zh-HK': <>延長房間有效時間 <strong className="text-white">{durationTextZh}</strong>。<br />延長後觀眾原本使用的連結與 QR Code 均維持不變，可繼續 사용 가능합니다.</>,
        }[activeLocale] || <>방의 활성 시간을 <strong className="text-white">{durationTextKo} 연장</strong>합니다.</>;`;

  content = content.replace(regexInfoDesc, replaceStrInfo);
  modified = true;
  console.log('Successfully replaced extendInfoDesc with dynamic labels!');
} else {
  console.log('regexInfoDesc did not match.');
}

if (regexPayDesc.test(content)) {
  const replaceStrPay = `const isStoreTier = room.tier === 'store' || room.tier === 'store_annual';
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
                }[activeLocale] || <>방 연장 {durationTextKo} 이용권을 결제합니다.</>;`;

  content = content.replace(regexPayDesc, replaceStrPay);
  modified = true;
  console.log('Successfully replaced extendPayDesc with dynamic labels!');
} else {
  console.log('regexPayDesc did not match.');
}

// Target the refund warning 24-hours text inside page.tsx (L5295-L5301 approx)
const regexRefund = /ko:\s*'방 시간 연장은 결제 완료 즉시 예약 리소스가 즉시 할당되어 24시간 연장 처리가 실행되므로, 단순 변심으로 인한 환불 및 결제 취소가 엄격히 불가능합니다\. 이에 동의하시는 경우에만 결제를 진행해 주세요\.',/;
if (regexRefund.test(content)) {
  content = content.replace(regexRefund, `ko: '방 시간 연장은 결제 완료 즉시 예약 리소스가 즉시 할당되어 선택한 기간의 연장 처리가 실행되므로, 단순 변심으로 인한 환불 및 결제 취소가 엄격히 불가능합니다. 이에 동의하시는 경우에만 결제를 진행해 주세요.',`);
  modified = true;
  console.log('Successfully updated refund text with flexible durations!');
}

if (modified) {
  fs.writeFileSync(targetFile, content, 'utf8');
}
