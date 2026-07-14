const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'page.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Target snippet to revert
const searchStr = `            {upgradeStep === 'payment' && selectedUpgradeTier && (() => {
              const isStoreTier = room.tier === 'store' || room.tier === 'store_annual';
              const productVal = {
                  ko: isStoreTier 
                    ? (selectedExtendHours === 8760 ? '매장 전용 365일(1년) 시간 연장 이용권' : '매장 전용 30일(1달) 시간 연장 이용권')
                    : '24시간 시간 연장 이용권',
                  en: isStoreTier
                    ? (selectedExtendHours === 8760 ? 'Store 365-Day Session Extension Pass' : 'Store 30-Day Session Extension Pass')
                    : '24-Hour Session Extension Pass',
                  ja: isStoreTier
                    ? (selectedExtendHours === 8760 ? '店舗365일ルーム延長チケット' : '店舗30일ルーム延長チケット')
                    : '24시간룸연장티켓',
                  es: isStoreTier
                    ? (selectedExtendHours === 8760 ? 'Pase de Extensión de 365 Días' : 'Pase de Extensión de 30 Días')
                    : 'Pase de Extensión de 24 Horas',
                  'zh-TW': isStoreTier
                    ? (selectedExtendHours === 8760 ? '商戶 365 天延長使用券' : '商戶 30 天延長使用券')
                    : '24 小時延長使用券',
                  'zh-HK': isStoreTier
                    ? (selectedExtendHours === 8760 ? '商戶 365 天延長使用券' : '商戶 30 天延長使用券')
                    : '24 小時延長 사용권',
                }[activeLocale] || '시간 연장 이용권';

              const paymentDesc = {`;

const replaceStr = `            {upgradeStep === 'payment' && selectedUpgradeTier && (() => {
              const paymentDesc = {`;

if (content.includes(searchStr)) {
  content = content.replace(searchStr, replaceStr);
  fs.writeFileSync(targetFile, content, 'utf8');
  console.log('Successfully reverted misplaced code block!');
} else {
  console.log('Target block not found. Trying flexible spacing match.');
  // Regex version to be safe
  const regex = /\{upgradeStep === 'payment' && selectedUpgradeTier && \(\(\) => \{[\s\S]+?const paymentDesc = \{/;
  if (regex.test(content)) {
    content = content.replace(regex, `{upgradeStep === 'payment' && selectedUpgradeTier && (() => {\n              const paymentDesc = {`);
    fs.writeFileSync(targetFile, content, 'utf8');
    console.log('Successfully reverted misplaced code block using regex!');
  } else {
    console.log('Misplaced block already absent or layout differs.');
  }
}
