import { useState, useMemo } from 'react';
import { useAllData } from '../hooks/useAllData';
import { normalizeString } from './Dashboard';
import './Evidence.css';

// ── Types ────────────────────────────────────────────────────────────────────

type AnyRecord = {
  id: string;
  type: 'checkin' | 'message' | 'sighting' | 'note' | 'tip';
  date: Date;
  person: string;
  location?: string;
  description: string;
  extra?: string; // e.g. "→ Receiver" for messages, "with X" for sightings
  raw: any;
};

const TYPE_LABELS: Record<string, string> = {
  checkin:  'Check-in',
  message:  'Message',
  sighting: 'Sighting',
  note:     'Note',
  tip:      'Tip',
};

const TYPE_ICONS: Record<string, string> = {
  checkin: '📍', message: '💬', sighting: '👁', note: '📝', tip: '🕵️',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseDate(s: string): Date {
  if (!s) return new Date(0);
  const m = s.trim().match(/^(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2})/);
  if (m) return new Date(`${m[3]}-${m[2]}-${m[1]}T${m[4]}:${m[5]}:00`);
  if (/^\d{4}-\d{2}-\d{2} /.test(s)) return new Date(s.replace(' ', 'T'));
  return new Date(s);
}

function fmtDate(d: Date): string {
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ── Main Component ────────────────────────────────────────────────────────────

export function Evidence() {
  const { data, status } = useAllData();
  const loading = status === 'idle' || status === 'loading';

  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'person' | 'type'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Build unified flat list
  const allRecords = useMemo<AnyRecord[]>(() => {
    const list: AnyRecord[] = [];

    data.checkins?.forEach(c => {
      const d = parseDate(c.time || c.submittedAt);
      if (!isNaN(d.getTime()))
        list.push({ id: `chk-${c.id}`, type: 'checkin', date: d, person: c.personName || '—', location: c.location, description: c.notes || '', raw: c });
    });

    data.messages?.forEach(m => {
      const d = parseDate(m.sentAt || m.submittedAt);
      if (!isNaN(d.getTime()))
        list.push({ id: `msg-${m.id}`, type: 'message', date: d, person: m.senderName || '—', location: m.location, description: m.content || '', extra: `→ ${m.receiverName || '?'}`, raw: m });
    });

    data.sightings?.forEach(s => {
      const d = parseDate(s.time || s.submittedAt);
      if (!isNaN(d.getTime()))
        list.push({ id: `sgt-${s.id}`, type: 'sighting', date: d, person: s.reporterName || '—', location: s.location, description: s.description || '', extra: `Saw: ${s.seenPersonName || '?'}${s.seenWith ? ` with ${s.seenWith}` : ''}`, raw: s });
    });

    data.personalNotes?.forEach(n => {
      const d = parseDate(n.submittedAt);
      if (!isNaN(d.getTime()))
        list.push({ id: `note-${n.id}`, type: 'note', date: d, person: n.authorName || '—', location: n.location, description: n.content || '', extra: n.subject, raw: n });
    });

    data.anonymousTips?.forEach(t => {
      const d = parseDate(t.submittedAt);
      if (!isNaN(d.getTime()))
        list.push({ id: `tip-${t.id}`, type: 'tip', date: d, person: 'Anonymous', location: t.location, description: t.tipContent || '', extra: `Reliability: ${t.reliability || '?'}`, raw: t });
    });

    return list;
  }, [data]);

  // Filter + sort
  const filtered = useMemo(() => {
    let result = allRecords;

    if (activeType !== 'all') result = result.filter(r => r.type === activeType);

    if (search.trim()) {
      const q = normalizeString(search);
      result = result.filter(r =>
        normalizeString(r.person).includes(q) ||
        normalizeString(r.description).includes(q) ||
        normalizeString(r.location || '').includes(q) ||
        normalizeString(r.extra || '').includes(q)
      );
    }

    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'date') cmp = a.date.getTime() - b.date.getTime();
      else if (sortBy === 'person') cmp = a.person.localeCompare(b.person);
      else if (sortBy === 'type') cmp = a.type.localeCompare(b.type);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [allRecords, search, activeType, sortBy, sortDir]);

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  const counts: Record<string, number> = useMemo(() => {
    const c: Record<string, number> = { all: allRecords.length };
    allRecords.forEach(r => { c[r.type] = (c[r.type] ?? 0) + 1; });
    return c;
  }, [allRecords]);

  const TABS = ['all', 'checkin', 'message', 'sighting', 'note', 'tip'] as const;

  return (
    <div className="evidence-page">
      {/* ── Toolbar ── */}
      <div className="evidence-toolbar">
        <div className="evidence-toolbar__left">
          <h1 className="evidence-toolbar__title">Evidence Records</h1>
          <span className="evidence-toolbar__count text-muted text-sm">{filtered.length} of {allRecords.length} records</span>
        </div>
        <div className="evidence-toolbar__right">
          <input
            className="input evidence-search"
            type="search"
            placeholder="Search by person, location, content..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="evidence-tabs">
        {TABS.map(t => (
          <button
            key={t}
            className={`evidence-tab ${activeType === t ? 'evidence-tab--active' : ''}`}
            onClick={() => setActiveType(t)}
          >
            {t === 'all' ? 'All' : TYPE_ICONS[t] + ' ' + TYPE_LABELS[t]}
            <span className="evidence-tab__count">{counts[t] ?? 0}</span>
          </button>
        ))}
      </div>

      {/* ── Table ── */}
      <div className="evidence-table-wrap">
        {loading ? (
          <div className="evidence-loading">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 56, borderRadius: 8, marginBottom: 8 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="evidence-empty">
            <span>🔍</span>
            <p>No records match your search.</p>
          </div>
        ) : (
          <table className="evidence-table">
            <thead>
              <tr>
                <th className="evidence-th evidence-th--type">Type</th>
                <th
                  className={`evidence-th evidence-th--sortable ${sortBy === 'date' ? 'evidence-th--sorted' : ''}`}
                  onClick={() => toggleSort('date')}
                >
                  Date {sortBy === 'date' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                </th>
                <th
                  className={`evidence-th evidence-th--sortable ${sortBy === 'person' ? 'evidence-th--sorted' : ''}`}
                  onClick={() => toggleSort('person')}
                >
                  Person {sortBy === 'person' ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                </th>
                <th className="evidence-th">Location</th>
                <th className="evidence-th">Description</th>
                <th className="evidence-th">Extra</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="evidence-row">
                  <td className="evidence-td">
                    <span className={`badge badge--${r.type === 'checkin' ? 'checkins' : r.type === 'message' ? 'messages' : r.type === 'sighting' ? 'sightings' : r.type === 'note' ? 'notes' : 'tips'}`}>
                      {TYPE_ICONS[r.type]} {TYPE_LABELS[r.type]}
                    </span>
                  </td>
                  <td className="evidence-td evidence-td--mono text-xs">{fmtDate(r.date)}</td>
                  <td className="evidence-td evidence-td--person">{r.person}</td>
                  <td className="evidence-td text-xs text-muted">{r.location || '—'}</td>
                  <td className="evidence-td evidence-td--desc">{r.description || '—'}</td>
                  <td className="evidence-td text-xs text-muted">{r.extra || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Evidence;
