const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERR: ' + e.message));
  await page.goto('http://127.0.0.1:5199/__preview', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);
  const h = await page.evaluate(() => document.body.scrollHeight);
  await page.screenshot({ path: '__preview_desktop.png', fullPage: true });
  // mobile
  const m = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const mp = await m.newPage();
  await mp.goto('http://127.0.0.1:5199/__preview', { waitUntil: 'networkidle', timeout: 30000 });
  await mp.waitForTimeout(1200);
  await mp.screenshot({ path: '__preview_mobile.png', fullPage: true });
  console.log('pageHeight=' + h);
  console.log('ERRORS=' + JSON.stringify(errors, null, 2));
  await browser.close();
})();
