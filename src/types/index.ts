// ============================================================
// Jotform API response wrapper
// ============================================================

export interface JotformResponse<T> {
  responseCode: number;
  message: string;
  content: T;
}

// ============================================================
// Raw submission from Jotform API
// ============================================================

export interface JotformSubmission {
  id: string;
  form_id: string;
  ip: string;
  created_at: string;
  status: string;
  answers: Record<string, JotformAnswer>;
}

export interface JotformAnswer {
  name: string;
  order: string;
  text: string;
  type?: string;
  answer?: string | string[] | Record<string, string>;
  prettyFormat?: string;
}

// ============================================================
// Checkins — check-in/appearance records at different locations
// ============================================================

export interface Checkin {
  id: string;
  submittedAt: string;
  personName: string;
  location: string;
  time: string;
  notes?: string;
  rawAnswers: Record<string, JotformAnswer>;
}

// ============================================================
// Messages — messages exchanged between people
// ============================================================

export interface Message {
  id: string;
  submittedAt: string;
  senderName: string;
  receiverName: string;
  content: string;
  sentAt?: string;
  rawAnswers: Record<string, JotformAnswer>;
}

// ============================================================
// Sightings — someone being seen with someone else at a specific place
// ============================================================

export interface Sighting {
  id: string;
  submittedAt: string;
  reporterName: string;
  seenPersonName: string;
  seenWith?: string;
  location: string;
  time?: string;
  description?: string;
  rawAnswers: Record<string, JotformAnswer>;
}

// ============================================================
// PersonalNotes — personal notes / comments
// ============================================================

export interface PersonalNote {
  id: string;
  submittedAt: string;
  authorName: string;
  subject?: string;
  content: string;
  rawAnswers: Record<string, JotformAnswer>;
}

// ============================================================
// AnonymousTips — tips with varying reliability
// ============================================================

export interface AnonymousTip {
  id: string;
  submittedAt: string;
  tipContent: string;
  location?: string;
  reliability?: 'low' | 'medium' | 'high' | string;
  rawAnswers: Record<string, JotformAnswer>;
}

// ============================================================
// Aggregate / UI types
// ============================================================

export type DataSource = 'checkins' | 'messages' | 'sightings' | 'personalNotes' | 'anonymousTips';

export interface AllData {
  checkins: Checkin[];
  messages: Message[];
  sightings: Sighting[];
  personalNotes: PersonalNote[];
  anonymousTips: AnonymousTip[];
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface FetchState<T> {
  data: T | null;
  status: LoadingState;
  error: string | null;
}

// Person record linking — people that appear across multiple sources
export interface PersonProfile {
  name: string;
  checkins: Checkin[];
  messages: Message[];
  sightings: Sighting[];
  personalNotes: PersonalNote[];
  anonymousTips: AnonymousTip[];
  suspicionScore: number; // derived from frequency / recency
}
