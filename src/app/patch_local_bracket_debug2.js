const fs = require('fs');
const path = require('path');

const localFile = path.join(__dirname, 'local', 'page.tsx');
if (fs.existsSync(localFile)) {
  const localContent = fs.readFileSync(localFile, 'utf8');
  const lines = localContent.split(/\r?\n/);
  console.log('Local end lines trace 2:');
  for (let i = 2545; i < Math.min(lines.length, 2570); i++) {
    console.log(`${i+1}: ${lines[i]}`);
  }
}
