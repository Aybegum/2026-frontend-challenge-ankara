import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173/database');
  await page.waitForTimeout(3000);
  
  // Inject script to read window.__REACT_DEVTOOLS_GLOBAL_HOOK__ or similar,
  // Actually, we can just intercept network requests or execute a fetch to the api endpoints.
  const locations = await page.evaluate(async () => {
    // We happen to know the jotform API endpoints from api.ts
    // Let's just fetch them using the same token
    const fetchLocations = async (formId) => {
        const res = await fetch(`https://api.jotform.com/form/${formId}/submissions?apikey=0cdaddceebde6d50125026ff7b7bcbe0`);
        const data = await res.json();
        return data.content.map(sub => {
            const answers = Object.values(sub.answers);
            const locAns = answers.find(a => (a.name && a.name.toLowerCase() === 'location') || (a.text && a.text.toLowerCase().includes('location')));
            return locAns ? locAns.answer : null;
        }).filter(Boolean);
    };
    
    // Checkins: 242965615822059
    // Sightings: 242965561343057
    const locs1 = await fetchLocations('242965615822059');
    const locs2 = await fetchLocations('242965561343057');
    return [...new Set([...locs1, ...locs2])];
  });
  
  console.log('UNIQUE LOCATIONS:');
  console.log(locations);
  
  await browser.close();
})();
