const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'page.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Target the entire grid container inside local/page.tsx
// Let's grab the HTML from <main ...> down to the end of main.
// We can use a precise text manipulation approach.

// 1. Locate components inside local page.tsx
const mainStart = `<main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex-1 flex flex-col lg:grid lg:grid-cols-12 lg:items-start gap-8 w-full relative z-10">`;

// Let's extract:
// A. 원터치 연출 보드 block
const presetStartTag = `          {/* Item 1: Templates (원터치 연출 보드) */}`;
// B. 즉석 라이브 메시지 전송 block
const instantStartTag = `          {/* Item 3: 즉석 라이브 메시지 전송 */}`;
// C. LIVE ON AIR Preview Card block
const previewStartTag = `          {/* Item 2: LIVE ON AIR Preview Card */}`;
// D. Real-time Sync Control Panel block
const qrStartTag = `          {/* Real-time Sync Control Panel */}`;

// Let's use a regex to capture their inner contents precisely.
const presetRegex = /\{\/\* Item 1: Templates \(원터치 연출 보드\) \*\/\}\s*<div className="flex flex-col w-full min-w-0">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/;

// Instead of complex regex which can easily break on minor edits,
// let's do a reliable replace by writing the exact new child cards structure.
// Let's read the exact files layout first or do a simple string index slice.

// Let's find the indices of elements in the main block.
const mainIdx = content.indexOf(mainStart);
if (mainIdx !== -1) {
  console.log('Found main element index!');
}
// We can parse local/page.tsx by replacing the entire wrapper block structure.
// Let's write a robust parser to reconstruct <main> children.
