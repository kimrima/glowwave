const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'page.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// We need to find the duplicate declaration at L5274
// const isStoreTier = room.tier === 'store' || room.tier === 'store_annual';
// And remove it since it's already defined at L5230

const searchStr = `                const productLabel = {
                  ko: '결제 대상 상품',
                  en: 'Product',
                  ja: '決済対象商品',
                  es: 'Producto',
                  'zh-TW': '購買項目',
                  'zh-HK': '購買項目',
                }[activeLocale] || '결제 대상 상품';

                const isStoreTier = room.tier === 'store' || room.tier === 'store_annual';
                const productVal = {`;

const replaceStr = `                const productLabel = {
                  ko: '결제 대상 상품',
                  en: 'Product',
                  ja: '決済対象商品',
                  es: 'Producto',
                  'zh-TW': '購買項目',
                  'zh-HK': '購買項目',
                }[activeLocale] || '결제 대상 상품';

                const productVal = {`;

if (content.includes(searchStr)) {
  content = content.replace(searchStr, replaceStr);
  fs.writeFileSync(targetFile, content, 'utf8');
  console.log('Successfully removed duplicate isStoreTier declaration at L5274!');
} else {
  console.log('Duplicate search block not found. Trying regex.');
  // Regex version
  const regex = /const\s+productLabel[\s\S]*?;\s*const\s+isStoreTier\s+=\s+room\.tier\s+===\s+'store'\s+\|\|\s+room\.tier\s+===\s+'store_annual';\s*const\s+productVal\s+=\s+\{/;
  if (regex.test(content)) {
    // Read the exact matches to do replacement
    content = content.replace(/const\s+isStoreTier\s+=\s+room\.tier\s+===\s+'store'\s+\|\|\s+room\.tier\s+===\s+'store_annual';\s*(?=const\s+productVal\s+=\s+\{)/, '');
    fs.writeFileSync(targetFile, content, 'utf8');
    console.log('Successfully removed duplicate declaration via regex!');
  } else {
    console.log('Regex match failed.');
  }
}
