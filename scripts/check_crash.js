import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('CRASH ERROR:', err.message, err.stack));

  console.log('Navigating to http://localhost:5173/records');
  await page.goto('http://localhost:5173/records');
  await page.waitForTimeout(3000); // Wait for fetch
  
  const locator = page.locator('.case-file');
  if (await locator.isVisible()) {
      console.log('Case file element is VISIBLE');
  } else {
      console.log('Case file element is NOT VISIBLE');
      const rootHtml = await page.innerHTML('#root');
      console.log(rootHtml);
  }
  
  await browser.close();
})();
