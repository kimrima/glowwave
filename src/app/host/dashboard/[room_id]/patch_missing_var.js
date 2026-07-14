const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'page.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Target the start of durationTextKo calculation
const searchStr = `        const durationTextKo = isStoreTier 
          ? (selectedExtendHours === 8760 ? '365일(1년)' : '30일(1달)')`;

const replaceStr = `        const isStoreTier = room.tier === 'store' || room.tier === 'store_annual';
        const durationTextKo = isStoreTier 
          ? (selectedExtendHours === 8760 ? '365일(1년)' : '30일(1달)')`;

if (content.includes(searchStr)) {
  content = content.replace(searchStr, replaceStr);
  fs.writeFileSync(targetFile, content, 'utf8');
  console.log('Successfully defined missing isStoreTier variable!');
} else {
  console.log('Search block not found. Trying regex.');
  // Regex version
  const regex = /const\s+durationTextKo\s+=\s+isStoreTier\s*\?\s*\(selectedExtendHours === 8760\s*\?\s*'365일\(1년\)'\s*:\s*'30일\(1달\)'\)/;
  if (regex.test(content)) {
    content = content.replace(regex, `const isStoreTier = room.tier === 'store' || room.tier === 'store_annual';
        const durationTextKo = isStoreTier 
          ? (selectedExtendHours === 8760 ? '365일(1년)' : '30일(1달)')`);
    fs.writeFileSync(targetFile, content, 'utf8');
    console.log('Successfully defined isStoreTier via regex!');
  } else {
    console.log('Regex match failed.');
  }
}
