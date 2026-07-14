const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'page.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// The duplicate declaration block looks like:
// const isStoreTier = room.tier === 'store' || room.tier === 'store_annual';
// const durationTextKo = isStoreTier 
//   ? ...

// Let's replace the first duplicate block (inside extendPayDesc scope) to rename it or remove the const declaration
const searchStr = `              {extendStep === 'payment' && (() => {
                const isStoreTier = room.tier === 'store' || room.tier === 'store_annual';
                const durationTextKo = isStoreTier`;

const replaceStr = `              {extendStep === 'payment' && (() => {
                const durationTextKo = isStoreTier`;

if (content.includes(searchStr)) {
  content = content.replace(searchStr, replaceStr);
  fs.writeFileSync(targetFile, content, 'utf8');
  console.log('Successfully removed duplicate isStoreTier declaration!');
} else {
  console.log('Duplicate search block not found. Trying regex.');
  // Regex version
  const regex = /const\s+isStoreTier\s+=\s+room\.tier\s+===\s+'store'\s+\|\|\s+room\.tier\s+===\s+'store_annual';\s*const\s+durationTextKo\s+=\s+isStoreTier/;
  if (regex.test(content)) {
    content = content.replace(regex, `const durationTextKo = isStoreTier`);
    fs.writeFileSync(targetFile, content, 'utf8');
    console.log('Successfully removed duplicate declaration via regex!');
  } else {
    console.log('Regex match failed.');
  }
}
