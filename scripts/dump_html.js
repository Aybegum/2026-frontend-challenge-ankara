import { chromium } from 'playwright';
import fs from 'fs';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173/records');
  await page.waitForTimeout(2000);
  
  const podoBtn = page.locator('text=Podo').first();
  await podoBtn.click();
  await page.waitForTimeout(2000);
  
  const html = await page.innerHTML('.records-page');
  fs.writeFileSync('scripts/records-page.html', html);
  console.log('HTML written to scripts/records-page.html');
  
  await browser.close();
})();
