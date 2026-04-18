const KEY = '363d4fa1af679bc6a1fce4cff42e0a9d';
const SIGHTINGS_FORM = '261065244786967';

async function test() {
  const res = await fetch(`https://api.jotform.com/form/${SIGHTINGS_FORM}/submissions?apiKey=${KEY}&limit=5`).then(r=>r.json());
  if (res.content) {
    res.content.forEach((sub, i) => {
      console.log(`\n--- Submission ${i} ---`);
      Object.entries(sub.answers).forEach(([key, value]) => {
        console.log(`${key}: name=${value.name}, text=${value.text}, answer=${value.answer}`);
      });
    });
  } else {
    console.log('No data');
  }
}

test();
