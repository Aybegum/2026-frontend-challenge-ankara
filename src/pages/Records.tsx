import { useState, useMemo } from 'react';
import { useAllData } from '../hooks/useAllData';
import type { AllData } from '../types';
import './Records.css';

// ── helpers ────────────────────────────────────────────────────────────────

type TimelineEvent = {
  id: string;
  date: Date;
  type: keyof AllData;
  title: string;
  description: string;
  raw: any;
};

function parseEventDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  
  // Try DD-MM-YYYY HH:mm
  const match = dateStr.trim().match(/^(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2})/);
  if (match) {
    const [_, d, m, y, h, min] = match;
    return new Date(`${y}-${m}-${d}T${h}:${min}:00`);
  }

  // Handle Jotform's YYYY-MM-DD HH:mm:ss
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(dateStr)) {
    return new Date(dateStr.replace(' ', 'T'));
  }

  return new Date(dateStr);
}

function extractUniquePeople(data: AllData): string[] {
  const names = new Set<string>();
  data.checkins?.forEach(c => c.personName && names.add(c.personName.trim()));
  data.messages?.forEach(m => {
    if (m.senderName) names.add(m.senderName.trim());
    if (m.receiverName) names.add(m.receiverName.trim());
  });
  data.sightings?.forEach(s => {
    if (s.reporterName) names.add(s.reporterName.trim());
    if (s.seenPersonName) names.add(s.seenPersonName.trim());
    if (s.seenWith) names.add(s.seenWith.trim());
  });
  data.personalNotes?.forEach(n => n.authorName && names.add(n.authorName.trim()));

  return Array.from(names)
    .filter(n => n && n.toLowerCase() !== 'unknown')
    .sort();
}

function buildPersonTimeline(data: AllData, personName: string): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  const p = personName.toLowerCase();

  data.checkins?.forEach(c => {
    if (c.personName?.toLowerCase() === p) {
      const d = parseEventDate(c.time || c.submittedAt);
      if (!isNaN(d.getTime())) {
        events.push({
          id: `chk-${c.id}`,
          date: d,
          type: 'checkins',
          title: `Presence at ${c.location}`,
          description: c.notes || '',
          raw: c,
        });
      }
    }
  });

  data.messages?.forEach(m => {
    const isSender = m.senderName?.toLowerCase() === p;
    const isReceiver = m.receiverName?.toLowerCase() === p;
    if (isSender || isReceiver) {
      const d = parseEventDate(m.sentAt || m.submittedAt);
      if (!isNaN(d.getTime())) {
        events.push({
          id: `msg-${isSender ? 'sent' : 'recv'}-${m.id}`,
          date: d,
          type: 'messages',
          title: isSender ? `Sent message to ${m.receiverName}` : `Received message from ${m.senderName}`,
          description: m.content || '',
          raw: m,
        });
      }
    }
  });

  data.sightings?.forEach(s => {
    const isReporter = s.reporterName?.toLowerCase() === p;
    const isSeen = s.seenPersonName?.toLowerCase() === p;
    const isWith = s.seenWith?.toLowerCase() === p;
    
    if (isReporter || isSeen || isWith) {
      const d = parseEventDate(s.time || s.submittedAt);
      if (!isNaN(d.getTime())) {
        events.push({
          id: `sgt-${s.id}`,
          date: d,
          type: 'sightings',
          title: isReporter ? `Reported sighting at ${s.location}` : `Spotted at ${s.location}`,
          description: s.description || '',
          raw: s,
        });
      }
    }
  });

  data.personalNotes?.forEach(n => {
    if (n.authorName?.toLowerCase() === p) {
      const d = parseEventDate(n.submittedAt);
      if (!isNaN(d.getTime())) {
        events.push({
          id: `note-${n.id}`,
          date: d,
          type: 'personalNotes',
          title: n.subject ? `Private Note: ${n.subject}` : 'Wrote a personal note',
          description: n.content || '',
          raw: n,
        });
      }
    }
  });

  return events.sort((a, b) => a.date.getTime() - b.date.getTime());
}

function groupEventsByDate(events: TimelineEvent[]) {
  const groups: { dateLabel: string; events: TimelineEvent[] }[] = [];
  events.forEach(evt => {
    if (isNaN(evt.date.getTime())) return;
    const label = evt.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    let group = groups.find(g => g.dateLabel === label);
    if (!group) {
      group = { dateLabel: label, events: [] };
      groups.push(group);
    }
    group.events.push(evt);
  });
  return groups;
}

function EventIcon({ type }: { type: keyof AllData }) {
  switch (type) {
    case 'checkins': return <span className="event-icon badge--checkins">📍</span>;
    case 'messages': return <span className="event-icon badge--messages">💬</span>;
    case 'sightings': return <span className="event-icon badge--sightings">👁️</span>;
    case 'personalNotes': return <span className="event-icon badge--notes">📝</span>;
    default: return <span className="event-icon">📄</span>;
  }
}

// ── main page ──────────────────────────────────────────────────────────────

export function Records() {
  const { data, status } = useAllData();
  const loading = status === 'idle' || status === 'loading';

  const [search, setSearch] = useState('');
  const [selectedPerson, setSelectedPerson] = useState<string | null>('Podo');

  const people = useMemo(() => extractUniquePeople(data), [data]);
  
  const filteredPeople = useMemo(() => {
    const q = search.toLowerCase();
    return people.filter(p => p.toLowerCase().includes(q));
  }, [people, search]);

  const timeline = useMemo(() => {
    if (!selectedPerson) return [];
    try {
      return buildPersonTimeline(data, selectedPerson);
    } catch (e) {
      console.error('ERROR in buildPersonTimeline:', e);
      return [];
    }
  }, [data, selectedPerson]);

  const eventGroups = useMemo(() => groupEventsByDate(timeline), [timeline]);

  const summary = useMemo(() => {
    try {
      if (!timeline || timeline.length === 0) return null;
      
      const locations = timeline
        .map(t => t.raw?.location)
        .filter((loc): loc is string => typeof loc === 'string' && loc.trim().length > 0);

      let primaryLocation = 'Unknown';
      if (locations.length > 0) {
        const counts = locations.reduce((acc, loc) => {
          acc[loc] = (acc[loc] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        primaryLocation = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
      }

      return {
        total: timeline.length,
        firstSeen: timeline[0].date,
        lastSeen: timeline[timeline.length - 1].date,
        primaryLocation
      };
    } catch (err) {
      console.error('Error calculating summary:', err);
      return null;
    }
  }, [timeline]);

  return (
    <div className="records-page">
      <div className="records-sidebar card">
        <h2 className="records-sidebar__title">Subject Directory</h2>
        
        <div className="records-sidebar__search">
          <input
            type="search"
            className="input"
            placeholder="Search person…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="records-sidebar__list">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: '36px', marginBottom: '8px', borderRadius: '6px' }} />
            ))}
          </div>
        ) : (
          <ul className="records-sidebar__list">
            {filteredPeople.map(person => (
              <li key={person}>
                <button
                  className={`btn records-sidebar__btn ${selectedPerson === person ? 'records-sidebar__btn--active' : ''}`}
                  onClick={() => setSelectedPerson(person)}
                >
                  <span className="truncate">{person}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="records-main">
        {!selectedPerson ? (
          <div className="records-empty card">
            <span style={{ fontSize: '3rem' }}>📂</span>
            <h3>Case File Explorer</h3>
            <p className="text-muted">Select a subject from the directory to review their chronological history across all intercepted data.</p>
          </div>
        ) : (
          <div className="case-file">
            {/* Subject Summary Card */}
            {summary && (
              <section className="summary-banner card glass">
                <div className="summary-banner__header">
                  <div className="person-profile__avatar">
                    {selectedPerson.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h1>{selectedPerson}</h1>
                    <p className="text-sm text-secondary">Case Subject Trace</p>
                  </div>
                </div>
                
                <div className="summary-stats">
                  <div className="summary-stat">
                    <span className="text-xs text-muted">Total Intercepts</span>
                    <span className="text-accent font-mono">{summary.total}</span>
                  </div>
                  <div className="summary-stat">
                    <span className="text-xs text-muted">Primary Loc.</span>
                    <span className="text-secondary truncate">{summary.primaryLocation}</span>
                  </div>
                  <div className="summary-stat">
                    <span className="text-xs text-muted">Latest Activity</span>
                    <span className="text-secondary">
                      {summary.lastSeen.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </div>
              </section>
            )}

            {/* Timeline Feed */}
            <div className="case-timeline">
              {eventGroups.map(group => (
                <div key={group.dateLabel} className="timeline-group">
                  <div className="timeline-date-header">
                    <span className="timeline-date-label">{group.dateLabel}</span>
                  </div>
                  
                  <div className="timeline-events">
                    {group.events.map(evt => (
                      <div key={evt.id} className="case-event">
                        <div className="case-event__time text-xs text-muted">
                          {evt.date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="case-event__line">
                          <EventIcon type={evt.type} />
                        </div>
                        <div className="case-event__card card card--elevated">
                          <h4 className="case-event__title">{evt.title}</h4>
                          {evt.description && (
                            <p className="case-event__desc text-sm">{evt.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Records;
