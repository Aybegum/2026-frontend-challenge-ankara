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

function answer(submission: JotformSubmission, ...keys: string[]): string {
  for (const k of keys) {
    const ans = submission.answers[k];
    if (!ans) continue;
    if (typeof ans.answer === 'string') return ans.answer.trim();
    if (Array.isArray(ans.answer)) return ans.answer.join(', ').trim();
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
    personName: answer(s, '1', '3', '4', 'q1', 'q3', 'q4') || 'Unknown',
    location: answer(s, '2', '5', '6', 'q2', 'q5', 'q6') || 'Unknown',
    time: answer(s, '7', '8', '9', 'q7', 'q8', 'q9') || s.created_at,
    notes: answer(s, '10', '11', '12', 'q10', 'q11'),
    rawAnswers: s.answers,
  };
}

function normaliseMessage(s: JotformSubmission): Message {
  return {
    id: s.id,
    submittedAt: s.created_at,
    senderName: answer(s, '1', '3', 'q1', 'q3') || 'Unknown',
    receiverName: answer(s, '2', '4', 'q2', 'q4') || 'Unknown',
    content: answer(s, '5', '6', '7', 'q5', 'q6', 'q7') || '',
    sentAt: answer(s, '8', '9', 'q8', 'q9') || undefined,
    rawAnswers: s.answers,
  };
}

function normaliseSighting(s: JotformSubmission): Sighting {
  return {
    id: s.id,
    submittedAt: s.created_at,
    reporterName: answer(s, '1', '3', 'q1', 'q3') || 'Unknown',
    seenPersonName: answer(s, '2', '4', 'q2', 'q4') || 'Unknown',
    seenWith: answer(s, '5', '6', 'q5', 'q6') || undefined,
    location: answer(s, '7', '8', '9', 'q7', 'q8', 'q9') || 'Unknown',
    time: answer(s, '10', '11', 'q10', 'q11') || undefined,
    description: answer(s, '12', '13', 'q12', 'q13') || undefined,
    rawAnswers: s.answers,
  };
}

function normalisePersonalNote(s: JotformSubmission): PersonalNote {
  return {
    id: s.id,
    submittedAt: s.created_at,
    authorName: answer(s, '1', '3', 'q1', 'q3') || 'Unknown',
    subject: answer(s, '2', '4', 'q2', 'q4') || undefined,
    content: answer(s, '5', '6', '7', 'q5', 'q6', 'q7') || '',
    rawAnswers: s.answers,
  };
}

function normaliseAnonymousTip(s: JotformSubmission): AnonymousTip {
  const rawReliability = answer(s, '2', '3', 'q2', 'q3').toLowerCase();
  const reliability = (['low', 'medium', 'high'] as const).find(r =>
    rawReliability.includes(r)
  );
  return {
    id: s.id,
    submittedAt: s.created_at,
    tipContent: answer(s, '1', '4', '5', 'q1', 'q4', 'q5') || '',
    location: answer(s, '6', '7', 'q6', 'q7') || undefined,
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
