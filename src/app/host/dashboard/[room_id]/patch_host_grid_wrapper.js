const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'page.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Regex 1: Strip Left Column Wrapper opening
const regexLeftOpen = /\{\/\*\s*Left\s+Column\s+Wrapper\s+[\s\S]*?\*\/\}\s*<div\s+className="order-1\s+lg:col-span-8\s+flex\s+flex-col\s+gap-8\s+w-full\s+min-w-0">\s*\{\/\*\s*Quick\s+Triggers\s+Dashboard\s*\*\/\}[\s\S]*?<div\s+className="glass-effect\s+rounded-2xl\s+p-4\s+sm:p-6\s+bg-\[#12121a\]">/;

// Regex 2: Set Instant live customizer (즉석 라이브 송출) order to order-3 and lg:col-span-8
const regexMiddlePresetToInstant = /<\/div>\s*\{\/\*\s*Custom\s+Customizer\s+Input\s+for\s+On-the-fly\s+Triggering\s*\*\/\}[\s\S]*?<div\s+className="glass-effect\s+rounded-2xl\s+p-4\s+sm:p-6\s+bg-\[#12121a\]">/;

// Regex 3: Strip Left Column Wrapper closing and Right Column Wrapper opening
const regexLeftEndToRightStart = /<\/div>\s*<\/div>\s*<\/div>\s*\{\/\*\s*Item\s+2\s+&\s+4:\s+LIVE\s+ON\s+AIR\s+Preview\s+Card[\s\S]*?className="order-2\s+lg:col-span-4\s+flex\s+flex-col\s+gap-6\s+w-full\s+min-w-0">/;

// Regex 4: Wrap QR and Guide Cards under order-4 grid child
const regexQrPanel = /\{\/\*\s*Admission\s+QR\s+Card\s*\*\/\}[\s\S]*?<div\s+className="glass-effect\s+rounded-2xl\s+p-4\s+sm:p-6\s+flex\s+flex-col\s+items-center\s+text-center\s+bg-\[#12121a\]">/;

// Regex 5: Close the wrapper for QR panel at main end
const regexPanelEnd = /<\/div>\s*<\/div>\s*<\/main>/;

// We will write the replacements carefully.
// If the regex matches are difficult due to spacing, we can define direct replacements or use target selectors.
// Let's do a debug search first to find which matches succeed.
let modified = 0;

// Let's examine the raw content around Left Column Wrapper opening
// In host dashboard page.tsx (L2230 approx):
//         {/* Left Column: Quick Preset Board & Custom Broadcast (Combined to avoid grid row misalignment) */}
//         <div className="order-1 lg:col-span-8 flex flex-col gap-8 w-full min-w-0">
//           
//           {/* Quick Triggers Dashboard */}
//           <div className="glass-effect rounded-2xl p-4 sm:p-6 bg-[#12121a]">

const searchLeftOpen = `        {/* Left Column: Quick Preset Board & Custom Broadcast (Combined to avoid grid row misalignment) */}
        <div className="order-1 lg:col-span-8 flex flex-col gap-8 w-full min-w-0">
          
          {/* Quick Triggers Dashboard */}
          <div className="glass-effect rounded-2xl p-4 sm:p-6 bg-[#12121a]">`;

const replaceLeftOpen = `        {/* Quick Triggers Dashboard */}
        <div className="order-1 lg:col-span-8 flex flex-col w-full min-w-0 glass-effect rounded-2xl p-4 sm:p-6 bg-[#12121a]">`;


// Let's examine L2518:
//           {/* Custom Customizer Input for On-the-fly Triggering */}
//           <div className="glass-effect rounded-2xl p-4 sm:p-6 bg-[#12121a]">
const searchInstantBroadcast = `          {/* Custom Customizer Input for On-the-fly Triggering */}
          <div className="glass-effect rounded-2xl p-4 sm:p-6 bg-[#12121a]">`;

const replaceInstantBroadcast = `          {/* Custom Customizer Input for On-the-fly Triggering */}
          <div className="order-3 lg:col-span-8 flex flex-col w-full min-w-0 glass-effect rounded-2xl p-4 sm:p-6 bg-[#12121a]">`;


// Let's examine L3170:
//             </div>
//           </div>
//         </div>
// 
//         {/* Item 2 & 4: LIVE ON AIR Preview Card & Admission QR (Combined to eliminate grid vertical gaps) */}
//         <div className="order-2 lg:col-span-4 flex flex-col gap-6 w-full min-w-0">
//           {/* LIVE ON AIR Preview Card */}
//           <div className="glass-effect rounded-2xl p-4 sm:p-6 flex flex-col items-center bg-[#12121a]">
const searchLeftEndToRightStartStr = `            </div>
          </div>
        </div>

        {/* Item 2 & 4: LIVE ON AIR Preview Card & Admission QR (Combined to eliminate grid vertical gaps) */}
        <div className="order-2 lg:col-span-4 flex flex-col gap-6 w-full min-w-0">
          {/* LIVE ON AIR Preview Card */}
          <div className="glass-effect rounded-2xl p-4 sm:p-6 flex flex-col items-center bg-[#12121a]">`;

const replaceLeftEndToRightStartStr = `            </div>
          </div>
        </div>

        {/* LIVE ON AIR Preview Card */}
        <div className="order-2 lg:col-span-4 flex flex-col w-full min-w-0 glass-effect rounded-2xl p-4 sm:p-6 items-center bg-[#12121a]">`;


// Let's examine L3275:
//           {/* Admission QR Card */}
//           <div className="glass-effect rounded-2xl p-4 sm:p-6 flex flex-col items-center text-center bg-[#12121a]">
const searchQrCard = `          {/* Admission QR Card */}
          <div className="glass-effect rounded-2xl p-4 sm:p-6 flex flex-col items-center text-center bg-[#12121a]">`;

const replaceQrCard = `          {/* Admission QR Card & Guide wrapper */}
          <div className="order-4 lg:col-span-4 flex flex-col gap-6 w-full min-w-0">
          <div className="glass-effect rounded-2xl p-4 sm:p-6 flex flex-col items-center text-center bg-[#12121a]">`;


// Let's examine L3430:
//           </div>
//         </div>
// 
//       </main>
const searchMainEnd = `          </div>
        </div>

      </main>`;

const replaceMainEnd = `          </div>
          </div>
        </div>

      </main>`;


if (content.includes(searchLeftOpen)) {
  content = content.replace(searchLeftOpen, replaceLeftOpen);
  modified++;
}
if (content.includes(searchInstantBroadcast)) {
  content = content.replace(searchInstantBroadcast, replaceInstantBroadcast);
  modified++;
}
if (content.includes(searchLeftEndToRightStartStr)) {
  content = content.replace(searchLeftEndToRightStartStr, replaceLeftEndToRightStartStr);
  modified++;
}
if (content.includes(searchQrCard)) {
  content = content.replace(searchQrCard, replaceQrCard);
  modified++;
}
if (content.includes(searchMainEnd)) {
  content = content.replace(searchMainEnd, replaceMainEnd);
  modified++;
}

console.log('Host modified count: ' + modified);

if (modified === 5) {
  fs.writeFileSync(targetFile, content, 'utf8');
  console.log('ALL wrappers successfully refactored in host dashboard page.tsx!');
} else {
  console.log('Direct string matches failed. Trying regex strategy.');
  
  // Let's write regex fallbacks if direct fails.
}
