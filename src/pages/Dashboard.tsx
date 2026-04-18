import { useState, useMemo } from 'react';
import { useAllData } from '../hooks/useAllData';
import type { AllData } from '../types';
import { MapViewer } from '../components/MapViewer';
import './Dashboard.css';

// ── Types ──────────────────────────────────────────────────────────────────

export type TimelineEvent = {
  id: string;
  date: Date;
  type: 'checkins' | 'messages' | 'sightings' | 'notes' | 'tips';
  title: string;
  location?: string;
  description: string;
  raw: any;
};

type Suspect = { name: string; rawName: string; score: number; lastSeen?: string; locations: string[] };

// ── Helpers ─────────────────────────────────────────────────────────────────

export function normalizeString(str: string): string {
  if (!str) return '';
  return str.trim().toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/â/g, 'a').replace(/î/g, 'i').replace(/û/g, 'u');
}

function parseEventDate(dateStr: string): Date {
  if (!dateStr) return new Date(0);
  const match = dateStr.trim().match(/^(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2})/);
  if (match) {
    const [_, d, m, y, h, min] = match;
    return new Date(`${y}-${m}-${d}T${h}:${min}:00`);
  }
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(dateStr)) {
    return new Date(dateStr.replace(' ', 'T'));
  }
  return new Date(dateStr);
}

function fmtDate(d: Date): string {
  if (!d || isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

// ── Data Logic ───────────────────────────────────────────────────────────────

function buildPersonTimeline(data: AllData, personName: string): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const p = normalizeString(personName);

  data.checkins?.forEach(c => {
    if (normalizeString(c.personName) === p) {
      const d = parseEventDate(c.time || c.submittedAt);
      if (!isNaN(d.getTime()))
        events.push({ id: `chk-${c.id}`, date: d, type: 'checkins', title: `Check-in`, location: c.location, description: c.notes || '', raw: c });
    }
  });

  data.messages?.forEach(m => {
    const isSender = normalizeString(m.senderName) === p;
    const isReceiver = normalizeString(m.receiverName) === p;
    if (isSender || isReceiver) {
      const d = parseEventDate(m.sentAt || m.submittedAt);
      if (!isNaN(d.getTime()))
        events.push({ id: `msg-${m.id}`, date: d, type: 'messages', title: isSender ? `→ ${m.receiverName}` : `← ${m.senderName}`, location: m.location, description: m.content || '', raw: m });
    }
  });

  data.sightings?.forEach(s => {
    const isSeen = normalizeString(s.seenPersonName) === p;
    const isReporter = normalizeString(s.reporterName) === p;
    const isWith = normalizeString(s.seenWith ?? '') === p;
    if (isSeen || isReporter || isWith) {
      const d = parseEventDate(s.time || s.submittedAt);
      if (!isNaN(d.getTime()))
        events.push({ id: `sgt-${s.id}`, date: d, type: 'sightings', title: isSeen ? `Spotted` : isReporter ? `Reported sighting` : `Seen with ${s.seenPersonName}`, location: s.location, description: s.description || '', raw: s });
    }
  });

  data.personalNotes?.forEach(n => {
    if (normalizeString(n.authorName) === p) {
      const d = parseEventDate(n.submittedAt);
      if (!isNaN(d.getTime()))
        events.push({ id: `note-${n.id}`, date: d, type: 'notes', title: n.subject || 'Personal Note', location: n.location, description: n.content || '', raw: n });
    }
  });

  data.anonymousTips?.forEach(t => {
    if (normalizeString(t.tipContent).includes(p)) {
      const d = parseEventDate(t.submittedAt);
      if (!isNaN(d.getTime()))
        events.push({ id: `tip-${t.id}`, date: d, type: 'tips', title: `Anonymous Tip`, location: t.location, description: t.tipContent || '', raw: t });
    }
  });

  return events.sort((a, b) => a.date.getTime() - b.date.getTime());
}

function buildSuspects(data: AllData): Suspect[] {
  const scores = new Map<string, { score: number; rawName: string; dates: Date[]; locations: Set<string> }>();

  const bump = (name: string, pts: number, date?: string, loc?: string) => {
    if (!name || normalizeString(name) === 'unknown') return;
    const norm = normalizeString(name);
    let existingKey = [...scores.keys()].find(k => normalizeString(k) === norm);
    if (!existingKey) { scores.set(name, { score: 0, rawName: name, dates: [], locations: new Set() }); existingKey = name; }
    // Prefer Turkish-character version as the canonical key
    if (/[ğüşıöç]/.test(name) && !existingKey.includes('ğ') && !existingKey.includes('ü')) {
      const val = scores.get(existingKey)!;
      scores.delete(existingKey);
      scores.set(name, val);
      existingKey = name;
    }
    scores.get(existingKey)!.score += pts;
    if (date) { const d = parseEventDate(date); if (!isNaN(d.getTime())) scores.get(existingKey)!.dates.push(d); }
    if (loc) scores.get(existingKey)!.locations.add(loc);
  };

  data.checkins.forEach(c => bump(c.personName, 1, c.time || c.submittedAt, c.location));
  data.messages.forEach(m => { bump(m.senderName, 1, m.sentAt || m.submittedAt); bump(m.receiverName, 1, m.sentAt || m.submittedAt); });
  data.sightings.forEach(s => {
    bump(s.reporterName, 1, s.time || s.submittedAt, s.location);
    bump(s.seenPersonName, 3, s.time || s.submittedAt, s.location);
    if (s.seenWith) bump(s.seenWith, 1.5, s.time || s.submittedAt, s.location);
  });
  data.personalNotes.forEach(n => bump(n.authorName, 1, n.submittedAt));
  data.anonymousTips.forEach(t => {
    [...scores.keys()].forEach(k => {
      if (normalizeString(t.tipContent).includes(normalizeString(k)))
        bump(k, t.reliability === 'high' ? 3 : 1, t.submittedAt);
    });
  });

  return [...scores.entries()].map(([name, v]) => {
    const sortedDates = v.dates.sort((a, b) => b.getTime() - a.getTime());
    const display = name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    return { name: display, rawName: v.rawName, score: Math.round(v.score), lastSeen: sortedDates[0] ? fmtDate(sortedDates[0]) : undefined, locations: [...v.locations] };
  }).sort((a, b) => b.score - a.score);
}

function whereIsPodo(data: AllData): { location: string; confidence: string; reason: string; lastSeen: string } | null {
  const podoEvents = buildPersonTimeline(data, 'Podo');
  if (podoEvents.length === 0) return null;

  const withLocation = podoEvents.filter(e => e.location).sort((a, b) => b.date.getTime() - a.date.getTime());
  if (withLocation.length === 0) return null;

  const latest = withLocation[0];
  const locFrequency = new Map<string, number>();
  withLocation.slice(0, 5).forEach(e => {
    if (e.location) locFrequency.set(e.location, (locFrequency.get(e.location) ?? 0) + 1);
  });
  const mostFrequent = [...locFrequency.entries()].sort((a, b) => b[1] - a[1])[0];
  const isRecent = latest.date.getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000;

  return {
    location: latest.location!,
    confidence: isRecent ? 'HIGH' : mostFrequent?.[1] > 1 ? 'MEDIUM' : 'LOW',
    reason: isRecent ? 'Most recent confirmed location' : `Appears ${mostFrequent?.[1] ?? 1}× in recent records`,
    lastSeen: fmtDate(latest.date),
  };
}

// ── Sub-components ───────────────────────────────────────────────────────────

const TYPE_META: Record<string, { label: string; color: string; icon: string }> = {
  checkins:  { label: 'Check-in',  color: 'var(--clr-checkins)',  icon: '📍' },
  messages:  { label: 'Message',   color: 'var(--clr-messages)',  icon: '💬' },
  sightings: { label: 'Sighting',  color: 'var(--clr-sightings)', icon: '👁' },
  notes:     { label: 'Note',      color: 'var(--clr-notes)',     icon: '📝' },
  tips:      { label: 'Tip',       color: 'var(--clr-tips)',      icon: '🕵️' },
};

function PodoPrediction({ data }: { data: AllData }) {
  const pred = useMemo(() => whereIsPodo(data), [data]);
  if (!pred) return null;

  const confColor = pred.confidence === 'HIGH' ? 'var(--clr-success)' : pred.confidence === 'MEDIUM' ? 'var(--clr-accent)' : 'var(--clr-text-muted)';

  return (
    <div className="podo-prediction">
      <div className="podo-prediction__icon">🐾</div>
      <div className="podo-prediction__body">
        <span className="podo-prediction__label">Last Known Location</span>
        <span className="podo-prediction__location">{pred.location}</span>
        <span className="podo-prediction__detail">{pred.lastSeen} · {pred.reason}</span>
      </div>
      <div className="podo-prediction__confidence" style={{ color: confColor, borderColor: confColor }}>
        {pred.confidence}
      </div>
    </div>
  );
}

function EventCard({ event }: { event: TimelineEvent }) {
  const meta = TYPE_META[event.type];
  return (
    <div className="event-card" style={{ borderLeftColor: meta.color }}>
      <div className="event-card__header">
        <span className="event-card__icon">{meta.icon}</span>
        <span className="event-card__title">{event.title}</span>
        <span className="event-card__time text-xs text-muted">{fmtDate(event.date)}</span>
      </div>
      {event.location && (
        <div className="event-card__loc text-xs">📍 {event.location}</div>
      )}
      {event.description && (
        <p className="event-card__desc text-sm">{event.description}</p>
      )}
    </div>
  );
}

function SuspectRow({ s, active, onClick }: { s: Suspect; active: boolean; onClick: () => void }) {
  const maxScore = 30; // rough cap for bar visualization
  const pct = Math.min(100, (s.score / maxScore) * 100);
  const isPodo = normalizeString(s.name) === 'podo';

  return (
    <button className={`suspect-row ${active ? 'suspect-row--active' : ''} ${isPodo ? 'suspect-row--podo' : ''}`} onClick={onClick}>
      <div className="suspect-row__top">
        <span className="suspect-row__name">{isPodo ? '🐾 ' : ''}{s.name}</span>
        <span className="suspect-row__score">{s.score}pt</span>
      </div>
      <div className="suspect-row__bar-bg">
        <div className="suspect-row__bar-fill" style={{ width: `${pct}%`, background: isPodo ? 'var(--clr-accent)' : 'var(--clr-danger)' }} />
      </div>
      {s.lastSeen && <span className="suspect-row__last text-xs text-muted">Last: {s.lastSeen}</span>}
    </button>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function Dashboard() {
  const { data, status } = useAllData();
  const loading = status === 'idle' || status === 'loading';

  const [selectedPerson, setSelectedPerson] = useState<string>('Podo');
  const [suspectQ, setSuspectQ] = useState('');
  const [eventQ, setEventQ] = useState('');
  const [activeTypes, setActiveTypes] = useState<Set<string>>(
    new Set(['checkins', 'messages', 'sightings', 'notes', 'tips'])
  );

  const suspects = useMemo(() => buildSuspects(data), [data]);

  const filteredSuspects = useMemo(() => {
    if (!suspectQ.trim()) return suspects;
    const q = normalizeString(suspectQ);
    return suspects.filter(s => normalizeString(s.name).includes(q));
  }, [suspects, suspectQ]);

  const rawTimeline = useMemo(() => buildPersonTimeline(data, selectedPerson), [data, selectedPerson]);

  const displayTimeline = useMemo(() => {
    return rawTimeline.filter(e => {
      if (!activeTypes.has(e.type)) return false;
      if (!eventQ.trim()) return true;
      const q = normalizeString(eventQ);
      return normalizeString(e.title).includes(q) || normalizeString(e.description).includes(q) || normalizeString(e.location || '').includes(q);
    });
  }, [rawTimeline, activeTypes, eventQ]);

  const toggleType = (type: string) => {
    setActiveTypes(prev => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });
  };

  const selectedSuspect = suspects.find(s => normalizeString(s.rawName) === normalizeString(selectedPerson));

  return (
    <div className="investigation-layout">

      {/* ── LEFT: Suspect Board ── */}
      <aside className="suspect-panel">
        <div className="suspect-panel__head">
          <h2 className="suspect-panel__title">Suspects</h2>
          <span className="suspect-panel__count text-xs text-muted">{suspects.length} people</span>
        </div>

        <div className="suspect-panel__search">
          <input
            className="input input--small"
            type="search"
            placeholder="Filter suspects..."
            value={suspectQ}
            onChange={e => setSuspectQ(e.target.value)}
          />
        </div>

        <div className="suspect-panel__list">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 56, borderRadius: 8, marginBottom: 8 }} />)
            : filteredSuspects.map(s => (
                <SuspectRow
                  key={s.name}
                  s={s}
                  active={normalizeString(s.rawName) === normalizeString(selectedPerson)}
                  onClick={() => setSelectedPerson(s.rawName)}
                />
              ))
          }
        </div>
      </aside>

      {/* ── CENTER: Map + Prediction ── */}
      <section className="map-panel">
        <PodoPrediction data={data} />

        <div className="map-panel__map">
          <MapViewer events={displayTimeline} />
        </div>

        <div className="map-panel__legend">
          {Object.entries(TYPE_META).map(([type, meta]) => (
            <button
              key={type}
              className={`legend-chip ${!activeTypes.has(type) ? 'legend-chip--off' : ''}`}
              style={{ '--chip-color': meta.color } as any}
              onClick={() => toggleType(type)}
            >
              {meta.icon} {meta.label}s
            </button>
          ))}
        </div>
      </section>

      {/* ── RIGHT: Detail Panel ── */}
      <aside className="detail-panel">
        {selectedSuspect ? (
          <>
            <div className="detail-panel__head">
              <div>
                <h2 className="detail-panel__name">
                  {normalizeString(selectedSuspect.name) === 'podo' ? '🐾 ' : ''}
                  {selectedSuspect.name}
                </h2>
                <p className="text-xs text-muted" style={{ marginTop: 2 }}>
                  {displayTimeline.length} events visible · Suspicion: {selectedSuspect.score}pt
                </p>
              </div>
              <div className="detail-panel__score-badge" style={{
                background: normalizeString(selectedSuspect.name) === 'podo' ? 'var(--clr-accent-dim)' : 'var(--clr-danger-dim)',
                color: normalizeString(selectedSuspect.name) === 'podo' ? 'var(--clr-accent)' : 'var(--clr-danger)',
              }}>
                #{suspects.indexOf(selectedSuspect) + 1}
              </div>
            </div>

            {selectedSuspect.locations.length > 0 && (
              <div className="detail-panel__locations">
                {selectedSuspect.locations.slice(0, 3).map(loc => (
                  <span key={loc} className="loc-tag">📍 {loc}</span>
                ))}
              </div>
            )}

            <div className="detail-panel__search">
              <input
                className="input input--small"
                type="search"
                placeholder="Search events..."
                value={eventQ}
                onChange={e => setEventQ(e.target.value)}
              />
            </div>

            <div className="detail-panel__timeline">
              {displayTimeline.length === 0 ? (
                <div className="detail-panel__empty">
                  <span>🔍</span>
                  <p>No events match your filters.</p>
                </div>
              ) : (
                displayTimeline.map(e => <EventCard key={e.id} event={e} />)
              )}
            </div>
          </>
        ) : (
          <div className="detail-panel__empty">
            <span>👈</span>
            <p>Select a suspect to view their case file.</p>
          </div>
        )}
      </aside>
    </div>
  );
}

export default Dashboard;
