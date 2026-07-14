const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'page.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

const searchStr = 'const badgeStyles = {';
const replaceStr = 'const badgeStyles: Record<string, { text: string; css: string }> = {';

if (content.includes(searchStr)) {
  content = content.replace(searchStr, replaceStr);
  fs.writeFileSync(targetFile, content, 'utf8');
  console.log('Successfully typed badgeStyles as Record<string, { text: string; css: string }>!');
} else {
  console.log('badgeStyles declaration not found. Spacings mismatch?');
}
