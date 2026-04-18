const KEY = '363d4fa1af679bc6a1fce4cff42e0a9d';
const FORMS = {
  checkins: '261065067494966',
  messages: '261065765723966',
  sightings: '261065244786967',
  personalNotes: '261065509008958',
  anonymousTips: '261065875889981',
};

async function test() {
  for (const [name, id] of Object.entries(FORMS)) {
    console.log(`\n--- ${name} ---`);
    const res = await fetch(`https://api.jotform.com/form/${id}/submissions?apiKey=${KEY}&limit=1`).then(r=>r.json());
    if (res.content && res.content[0]) {
      const answers = Object.values(res.content[0].answers).map(a => `${a.order} | ${a.name} | ${a.text}: ${a.answer}`);
      console.log(answers.join('\n'));
    } else {
      console.log('No data');
    }
  }
}

test();
