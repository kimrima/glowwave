const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'page.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Regex 1: Strip Left Column Wrapper opening
const regexLeftOpen = /\{\/\*\s*Left\s+Column:\s+Quick\s+Preset\s+Board[\s\S]*?\*\/\}\s*<div\s+className="order-1\s+lg:col-span-8\s+flex\s+flex-col\s+gap-8\s+w-full\s+min-w-0">\s*\{\/\*\s*Quick\s+Triggers\s+Dashboard\s*\*\/\}[\s\S]*?<div\s+className="glass-effect\s+rounded-2xl\s+p-4\s+sm:p-6\s+bg-\[#12121a\]">/;

// Regex 2: Set Instant live customizer (즉석 라이브 송출) order to order-3 and lg:col-span-8
const regexInstantBroadcast = /\{\/\*\s*Custom\s+Customizer\s+Input\s+for\s+On-the-fly\s+Triggering\s*\*\/\}[\s\S]*?<div\s+className="glass-effect\s+rounded-2xl\s+p-4\s+sm:p-6\s+bg-\[#12121a\]">/;

// Regex 3: Strip Left Column Wrapper closing and Right Column Wrapper opening
const regexLeftEndToRightStart = /<\/div>\s*<\/div>\s*<\/div>\s*\{\/\*\s*Item\s+2\s+&\s+4:\s+LIVE\s+ON\s+AIR[\s\S]*?lg:col-span-4[\s\S]*?w-full\s+min-w-0">\s*\{\/\*\s*LIVE\s+ON\s+AIR\s+Preview\s+Card\s*\*\/\}[\s\S]*?<div\s+className="glass-effect\s+rounded-2xl\s+p-4\s+sm:p-6\s+flex\s+flex-col\s+items-center\s+bg-\[#12121a\]">/;

// Regex 4: Wrap QR and Guide Cards under order-4 grid child
const regexQrPanel = /\{\/\*\s*Admission\s+QR\s+Card\s*\*\/\}[\s\S]*?<div\s+className="glass-effect\s+rounded-2xl\s+p-4\s+sm:p-6\s+flex\s+flex-col\s+items-center\s+text-center\s+bg-\[#12121a\]">/;

// Regex 5: Close the wrapper for QR panel at main end
const regexPanelEnd = /<\/div>\s*<\/div>\s*<\/main>/;

let modified = 0;

if (regexLeftOpen.test(content)) {
  content = content.replace(regexLeftOpen, `{/* Quick Triggers Dashboard */}
        <div className="order-1 lg:col-span-8 flex flex-col w-full min-w-0 glass-effect rounded-2xl p-4 sm:p-6 bg-[#12121a]">`);
  modified++;
}
if (regexInstantBroadcast.test(content)) {
  content = content.replace(regexInstantBroadcast, `{/* Custom Customizer Input for On-the-fly Triggering */}
          <div className="order-3 lg:col-span-8 flex flex-col w-full min-w-0 glass-effect rounded-2xl p-4 sm:p-6 bg-[#12121a]">`);
  modified++;
}
if (regexLeftEndToRightStart.test(content)) {
  content = content.replace(regexLeftEndToRightStart, `</div>
          </div>
        </div>

        {/* LIVE ON AIR Preview Card */}
        <div className="order-2 lg:col-span-4 flex flex-col w-full min-w-0 glass-effect rounded-2xl p-4 sm:p-6 items-center bg-[#12121a]">`);
  modified++;
}
if (regexQrPanel.test(content)) {
  content = content.replace(regexQrPanel, `{/* Admission QR Card & Guide wrapper */}
          <div className="order-4 lg:col-span-4 flex flex-col gap-6 w-full min-w-0">
          <div className="glass-effect rounded-2xl p-4 sm:p-6 flex flex-col items-center text-center bg-[#12121a]">`);
  modified++;
}
if (regexPanelEnd.test(content)) {
  content = content.replace(regexPanelEnd, `</div>
          </div>
        </div>

      </main>`);
  modified++;
}

console.log('Host modified operations count: ' + modified);

if (modified === 5) {
  fs.writeFileSync(targetFile, content, 'utf8');
  console.log('ALL wrappers successfully refactored via regex in host page.tsx!');
} else {
  console.log('Regex matches failed. Successful count:', modified);
  // Debug to see which ones are failing
  console.log('1. LeftOpen:', regexLeftOpen.test(content));
  console.log('2. Instant:', regexInstantBroadcast.test(content));
  console.log('3. LeftEndToRightStart:', regexLeftEndToRightStart.test(content));
  console.log('4. QrPanel:', regexQrPanel.test(content));
  console.log('5. PanelEnd:', regexPanelEnd.test(content));
}
