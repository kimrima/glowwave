const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'page.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Regex targeting:
// if (data.rooms && data.rooms.length > 0) {
//   setSyncRecoveryRooms(data.rooms);
//   ...
const regexSort = /if\s*\(data\.rooms\s*&&\s*data\.rooms\.length\s*>\s*0\)\s*\{\s*setSyncRecoveryRooms\(data\.rooms\);/;

if (regexSort.test(content)) {
  content = content.replace(regexSort, `if (data.rooms && data.rooms.length > 0) {
        // Sort rooms by created_at in descending order (newest first)
        const sortedRooms = [...data.rooms].sort((a, b) => {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        setSyncRecoveryRooms(sortedRooms);`);
  fs.writeFileSync(targetFile, content, 'utf8');
  console.log('Successfully patched recovery rooms sorting to descending order!');
} else {
  console.log('Regex match for recovery rooms sorting failed.');
}
