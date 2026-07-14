const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'page.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Target the getRemainingTimeForList signature
const helper1Search = 'const getRemainingTimeForList = (tier, createdAt) => {';
const helper1Replace = 'const getRemainingTimeForList = (tier: string, createdAt: string) => {';

// Target the getTierBadge signature
const helper2Search = 'const getTierBadge = (tier) => {';
const helper2Replace = 'const getTierBadge = (tier: string) => {';

let modified = false;

if (content.includes(helper1Search)) {
  content = content.replace(helper1Search, helper1Replace);
  modified = true;
}
if (content.includes(helper2Search)) {
  content = content.replace(helper2Search, helper2Replace);
  modified = true;
}

if (modified) {
  fs.writeFileSync(targetFile, content, 'utf8');
  console.log('Successfully added explicit parameter types to list helper functions!');
} else {
  console.log('Helpers signatures not found. Spacings mismatch?');
}
