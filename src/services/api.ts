import type {
  JotformResponse,
  JotformSubmission,
  Checkin,
  Message,
  Sighting,
  PersonalNote,
  AnonymousTip,
} from '../types';

// ============================================================
// Config — API keys and form IDs from the challenge brief
// ============================================================

const API_BASE = 'https://api.jotform.com';

// Three API keys rotate across requests to stay within rate limits
const API_KEYS = [
  '363d4fa1af679bc6a1fce4cff42e0a9d',
  '54a934fa20b1ccc3a5bd1d2076f90556',
  '5593acd695caab1a3805c3af8532df09',
];
let keyIndex = 0;
const nextKey = () => API_KEYS[keyIndex++ % API_KEYS.length];

const FORM_IDS = {
  checkins: '261065067494966',
  messages: '261065765723966',
  sightings: '261065244786967',
  personalNotes: '261065509008958',
  anonymousTips: '261065875889981',
} as const;

// ============================================================
// Core fetch helper
// ============================================================

async function fetchSubmissions(formId: string): Promise<JotformSubmission[]> {
  const key = nextKey();
  const url = `${API_BASE}/form/${formId}/submissions?apiKey=${key}&limit=1000`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching form ${formId}`);
  }

  const json: JotformResponse<JotformSubmission[]> = await res.json();

  if (json.responseCode !== 200) {
    throw new Error(`Jotform error ${json.responseCode}: ${json.message}`);
  }

  return json.content;
}

// ============================================================
// Normalisation helpers
// ============================================================

function answer(submission: JotformSubmission, ...labels: string[]): string {
  const answers = Object.values(submission.answers);
  for (const label of labels) {
    const l = label.toLowerCase();
    const ans = answers.find(a => 
      (a.name && a.name.toLowerCase() === l) || 
      (a.text && a.text.toLowerCase().includes(l))
    );
    if (!ans) continue;
    
    const val = ans.answer;
    if (typeof val === 'string') return val.trim();
    if (Array.isArray(val)) return val.join(', ').trim();
    if (ans.prettyFormat) return ans.prettyFormat.trim();
  }
  return '';
}

// ============================================================
// Per-source normalisation
// ============================================================

function normaliseCheckin(s: JotformSubmission): Checkin {
  return {
    id: s.id,
    submittedAt: s.created_at,
    personName: answer(s, 'personName') || 'Unknown',
    location: answer(s, 'location') || 'Unknown',
    time: answer(s, 'timestamp') || s.created_at,
    notes: answer(s, 'note'),
    rawAnswers: s.answers,
  };
}

function normaliseMessage(s: JotformSubmission): Message {
  return {
    id: s.id,
    submittedAt: s.created_at,
    senderName: answer(s, 'senderName') || 'Unknown',
    receiverName: answer(s, 'recipientName') || 'Unknown',
    content: answer(s, 'text') || '',
    location: answer(s, 'location') || undefined,
    sentAt: answer(s, 'timestamp') || undefined,
    rawAnswers: s.answers,
  };
}

function normaliseSighting(s: JotformSubmission): Sighting {
  return {
    id: s.id,
    submittedAt: s.created_at,
    reporterName: answer(s, 'reporterName') || 'Anonymous', // Reporter isn't in form, so it's anonymous
    seenPersonName: answer(s, 'personName') || 'Unknown',
    seenWith: answer(s, 'seenWith') || undefined,
    location: answer(s, 'location') || 'Unknown',
    time: answer(s, 'timestamp') || undefined,
    description: answer(s, 'note') || undefined,
    rawAnswers: s.answers,
  };
}

function normalisePersonalNote(s: JotformSubmission): PersonalNote {
  return {
    id: s.id,
    submittedAt: s.created_at,
    authorName: answer(s, 'authorName') || 'Unknown',
    subject: answer(s, 'mentionedPeople') || undefined, // we can map mentionedPeople to subject
    content: answer(s, 'note') || '',
    location: answer(s, 'location') || undefined,
    rawAnswers: s.answers,
  };
}

function normaliseAnonymousTip(s: JotformSubmission): AnonymousTip {
  const rawReliability = answer(s, 'confidence').toLowerCase();
  const reliability = (['low', 'medium', 'high'] as const).find(r =>
    rawReliability.includes(r)
  );
  return {
    id: s.id,
    submittedAt: s.created_at,
    tipContent: answer(s, 'tip') || '',
    location: answer(s, 'location') || undefined,
    reliability: reliability ?? (rawReliability || undefined),
    rawAnswers: s.answers,
  };
}

// ============================================================
// Public API
// ============================================================

export const api = {
  getCheckins: async (): Promise<Checkin[]> => {
    const raw = await fetchSubmissions(FORM_IDS.checkins);
    return raw.map(normaliseCheckin);
  },

  getMessages: async (): Promise<Message[]> => {
    const raw = await fetchSubmissions(FORM_IDS.messages);
    return raw.map(normaliseMessage);
  },

  getSightings: async (): Promise<Sighting[]> => {
    const raw = await fetchSubmissions(FORM_IDS.sightings);
    return raw.map(normaliseSighting);
  },

  getPersonalNotes: async (): Promise<PersonalNote[]> => {
    const raw = await fetchSubmissions(FORM_IDS.personalNotes);
    return raw.map(normalisePersonalNote);
  },

  getAnonymousTips: async (): Promise<AnonymousTip[]> => {
    const raw = await fetchSubmissions(FORM_IDS.anonymousTips);
    return raw.map(normaliseAnonymousTip);
  },
};
