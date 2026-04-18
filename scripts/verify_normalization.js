const API_KEY = '0cdaddceebde6d50125026ff7b7bcbe0';
const FORMS = {
  checkins: '242965615822059',
  messages: '242965614486060',
  sightings: '242965561343057',
};

const normalize = (s) => (s || '').toLowerCase()
  .replace(/ğ/g, 'g')
  .replace(/ü/g, 'u')
  .replace(/ş/g, 's')
  .replace(/ı/g, 'i')
  .replace(/ö/g, 'o')
  .replace(/ç/g, 'c');

async function checkNames() {
  const names = new Set();
  
  for (const [key, id] of Object.entries(FORMS)) {
    try {
      const res = await fetch(`https://api.jotform.com/form/${id}/submissions?apikey=${API_KEY}`);
      const data = await res.json();
      data.content.forEach(sub => {
        Object.values(sub.answers).forEach((ans) => {
          if (ans.name && (ans.name.toLowerCase().includes('name') || ans.name.toLowerCase().includes('sender') || ans.name.toLowerCase().includes('receiver'))) {
            if (ans.answer) names.add(ans.answer);
          }
        });
      });
    } catch (e) {}
  }

  const raw = [...names];
  const normalized = new Set(raw.map(normalize));
  
  console.log('--- NAME NORMALIZATION AUDIT ---');
  console.log('Unique raw names:', raw.length);
  console.log('Unique normalized identities:', normalized.size);
  
  if (raw.length > normalized.size) {
    console.log('Duplicates found:');
    raw.forEach(n1 => {
        const d = raw.filter(n2 => n1 !== n2 && normalize(n1) === normalize(n2));
        if (d.length > 0) console.log(`  - "${n1}" matches ${d.map(x => `"${x}"`).join(', ')}`);
    });
  }
}

checkNames();
