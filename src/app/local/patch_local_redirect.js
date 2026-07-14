const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'page.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

const searchStr = `      // Restore mobile sync room and token
      const savedSyncRoomId = localStorage.getItem('glowwave_local_sync_room_id');
      const savedSyncHostToken = localStorage.getItem('glowwave_local_sync_host_token');
      if (savedSyncRoomId && savedSyncHostToken) {
        setSyncRoomId(savedSyncRoomId);
        setSyncHostToken(savedSyncHostToken);
      }`;

const replaceStr = `      // Restore mobile sync room and token
      const savedSyncRoomId = localStorage.getItem('glowwave_local_sync_room_id');
      const savedSyncHostToken = localStorage.getItem('glowwave_local_sync_host_token');
      if (savedSyncRoomId && savedSyncHostToken) {
        router.replace(\`/host/dashboard/\${savedSyncRoomId}?token=\${savedSyncHostToken}\`);
        return;
      }`;

if (content.includes(searchStr)) {
  content = content.replace(searchStr, replaceStr);
  fs.writeFileSync(targetFile, content, 'utf8');
  console.log('Successfully patched local page to redirect directly to host dashboard when synced room exists!');
} else {
  console.log('Local restore search block not found. Trying regex.');
  // Regex version to handle CRLF and spacing variations
  const regex = /\/\/ Restore mobile sync room and token\s*const\s+savedSyncRoomId\s+=\s+localStorage\.getItem\('glowwave_local_sync_room_id'\);\s*const\s+savedSyncHostToken\s+=\s+localStorage\.getItem\('glowwave_local_sync_host_token'\);\s*if\s*\(savedSyncRoomId\s*&&\s*savedSyncHostToken\)\s*\{\s*setSyncRoomId\(savedSyncRoomId\);\s*setSyncHostToken\(savedSyncHostToken\);\s*\}/;
  if (regex.test(content)) {
    content = content.replace(regex, `// Restore mobile sync room and token
      const savedSyncRoomId = localStorage.getItem('glowwave_local_sync_room_id');
      const savedSyncHostToken = localStorage.getItem('glowwave_local_sync_host_token');
      if (savedSyncRoomId && savedSyncHostToken) {
        router.replace(\`/host/dashboard/\${savedSyncRoomId}?token=\${savedSyncHostToken}\`);
        return;
      }`);
    fs.writeFileSync(targetFile, content, 'utf8');
    console.log('Successfully patched local page via regex!');
  } else {
    console.log('Regex match failed.');
  }
}
