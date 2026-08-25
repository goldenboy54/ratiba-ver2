import { chromium } from 'playwright-core';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const browser = await chromium.launch({ executablePath: EDGE_PATH, headless: true });
const context = await browser.newContext();
const page = await context.newPage();

const consoleMsgs = [];
const networkIssues = [];
page.on('console', msg => consoleMsgs.push(`[${msg.type()}] ${msg.text()}`));
page.on('pageerror', err => consoleMsgs.push(`[pageerror] ${err.message}`));
page.on('requestfailed', req => networkIssues.push(`FAILED: ${req.url()} -- ${req.failure()?.errorText}`));
page.on('response', res => { if (res.status() >= 400) networkIssues.push(`HTTP ${res.status()}: ${res.url()}`); });

await page.goto('http://localhost:3000/login');
await page.fill('input[name="username"]', 'qa.walkthrough@example.com');
await page.fill('input[name="password"]', 'TempTest123!');
await Promise.all([page.waitForNavigation(), page.click('button[type=submit], input[type=submit]')]);

console.log('--- Step 3: Console tab (DevTools > Console) ---');
await page.goto('http://localhost:3000/timetables', { waitUntil: 'networkidle' });
await page.waitForTimeout(500);
console.log(consoleMsgs.length ? consoleMsgs.join('\n') : '(no console errors or messages)');

console.log('\n--- Step 4: Network tab (DevTools > Network) - failed/error requests only ---');
console.log(networkIssues.length ? networkIssues.join('\n') : '(no failed requests - everything loaded 200 OK)');

console.log('\n--- Step 4b: key library file sizes (checking for truncation/corruption) ---');
const sizes = await page.evaluate(async () => {
  const files = ['/vendor/jquery/jquery-3.7.0.min.js', '/vendor/select2/js/select2.min.js', '/vendor/bootstrap/js/bootstrap.bundle.min.js'];
  const out = {};
  for (const f of files) {
    const res = await fetch(f);
    const text = await res.text();
    out[f] = text.length;
  }
  return out;
});
console.log(JSON.stringify(sizes, null, 2));

console.log('\n--- Step 5: Elements tab check - did Select2 actually initialize on #program? ---');
const info = await page.evaluate(() => {
  const el = document.getElementById('program');
  if (!el) return { found: false };
  return {
    found: true,
    classList: el.className,
    hasSelect2Class: el.classList.contains('select2-hidden-accessible'),
    optionCount: el.options.length,
    nextSibling: el.nextElementSibling ? el.nextElementSibling.outerHTML.slice(0, 150) : 'NONE',
  };
});
console.log(JSON.stringify(info, null, 2));

await browser.close();
