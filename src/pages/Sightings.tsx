import { useState, useMemo, useEffect } from 'react';
import { api } from '../services/api';
import type { Sighting, FetchState } from '../types';
import './Sightings.css';

// ── types ──────────────────────────────────────────────────────────────────

type FilterChip = 'all' | 'has-witness' | 'has-description' | 'podo';
type SortKey = 'date-desc' | 'date-asc';

// ── helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function highlightMatch(text: string, query: string): string {
  if (!query.trim()) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(
    new RegExp(`(${escaped})`, 'gi'),
    '<mark>$1</mark>'
  );
}

// ── sub-components ─────────────────────────────────────────────────────────

function SightingCard({
  sighting,
  query,
}: {
  sighting: Sighting;
  query: string;
}) {
  const [expanded, setExpanded] = useState(false);

  const hl = (t: string) => ({ __html: highlightMatch(t, query) });
  const involvesPodo = (
    sighting.seenPersonName.toLowerCase().includes('podo') ||
    (sighting.seenWith ?? '').toLowerCase().includes('podo')
  );

  return (
    <article
      className={`sighting-card card${involvesPodo ? ' sighting-card--podo' : ''}`}
      id={`sighting-${sighting.id}`}
    >
      {/* top row */}
      <div className="sighting-card__top">
        <div className="sighting-card__people">
          <span className="sighting-card__reporter text-sm text-muted">
            Reported by&nbsp;
            <strong
              className="text-secondary"
              dangerouslySetInnerHTML={hl(sighting.reporterName)}
            />
          </span>

          <div className="sighting-card__seen">
            <span
              className="sighting-card__name"
              dangerouslySetInnerHTML={hl(sighting.seenPersonName)}
            />
            {sighting.seenWith && (
              <>
                <span className="text-muted"> with </span>
                <span
                  className="sighting-card__name"
                  dangerouslySetInnerHTML={hl(sighting.seenWith)}
                />
              </>
            )}
          </div>
        </div>

        <div className="sighting-card__meta">
          {involvesPodo && (
            <span className="badge badge--tips">🐾 Podo</span>
          )}
          <span className="sighting-card__date text-xs text-muted">
            {formatDate(sighting.submittedAt)}
          </span>
        </div>
      </div>

      {/* location row */}
      <div className="sighting-card__location">
        <span className="sighting-card__loc-icon">📍</span>
        <span
          className="text-sm"
          dangerouslySetInnerHTML={hl(sighting.location)}
        />
        {sighting.time && (
          <span className="text-xs text-muted">· {sighting.time}</span>
        )}
      </div>

      {/* description preview */}
      {sighting.description && (
        <button
          className="sighting-card__expand btn btn--ghost text-sm"
          onClick={() => setExpanded(p => !p)}
          aria-expanded={expanded}
          id={`sighting-expand-${sighting.id}`}
        >
          {expanded ? '▲ Hide details' : '▼ Show details'}
        </button>
      )}

      {expanded && sighting.description && (
        <p
          className="sighting-card__desc text-sm text-secondary"
          dangerouslySetInnerHTML={hl(sighting.description)}
        />
      )}
    </article>
  );
}

// ── filter chips ───────────────────────────────────────────────────────────

const CHIPS: { key: FilterChip; label: string }[] = [
  { key: 'all',             label: 'All' },
  { key: 'podo',            label: '🐾 Involves Podo' },
  { key: 'has-witness',     label: 'Has witness' },
  { key: 'has-description', label: 'Has description' },
];

// ── main page ──────────────────────────────────────────────────────────────

export function Sightings() {
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [status, setStatus] = useState<FetchState<Sighting[]>['status']>('idle');
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery]       = useState('');
  const [filter, setFilter]     = useState<FilterChip>('all');
  const [sort, setSort]         = useState<SortKey>('date-desc');

  // fetch
  useEffect(() => {
    setStatus('loading');
    api.getSightings()
      .then(data => { setSightings(data); setStatus('success'); })
      .catch(err  => {
        setError(err instanceof Error ? err.message : 'Failed to load sightings');
        setStatus('error');
      });
  }, []);

  const loading = status === 'idle' || status === 'loading';

  // filter + search + sort
  const filtered = useMemo(() => {
    let result = sightings;

    // chip filter
    if (filter === 'podo') {
      result = result.filter(s =>
        s.seenPersonName.toLowerCase().includes('podo') ||
        (s.seenWith ?? '').toLowerCase().includes('podo')
      );
    } else if (filter === 'has-witness') {
      result = result.filter(s => !!s.seenWith);
    } else if (filter === 'has-description') {
      result = result.filter(s => !!s.description);
    }

    // text search
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(s =>
        s.seenPersonName.toLowerCase().includes(q) ||
        s.reporterName.toLowerCase().includes(q) ||
        s.location.toLowerCase().includes(q) ||
        (s.seenWith ?? '').toLowerCase().includes(q) ||
        (s.description ?? '').toLowerCase().includes(q)
      );
    }

    // sort
    result = [...result].sort((a, b) => {
      const diff = new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
      return sort === 'date-desc' ? -diff : diff;
    });

    return result;
  }, [sightings, filter, query, sort]);

  return (
    <div className="sightings-page">
      {/* page header */}
      <header className="sightings-page__header">
        <div>
          <h1>👁️ Sightings</h1>
          <p className="text-sm text-secondary">
            {loading
              ? 'Loading sighting records…'
              : `${filtered.length} of ${sightings.length} sightings`}
          </p>
        </div>
      </header>

      {/* error */}
      {status === 'error' && (
        <div className="error-banner" role="alert">⚠️ {error}</div>
      )}

      {/* controls */}
      <div className="sightings-controls">
        {/* search */}
        <div className="sightings-controls__search-wrap">
          <span className="sightings-controls__search-icon">🔍</span>
          <input
            className="input sightings-controls__search"
            type="search"
            placeholder="Search by name, location, description…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            id="sightings-search"
            aria-label="Search sightings"
          />
        </div>

        {/* sort */}
        <select
          className="input sightings-controls__sort"
          value={sort}
          onChange={e => setSort(e.target.value as SortKey)}
          id="sightings-sort"
          aria-label="Sort order"
        >
          <option value="date-desc">Newest first</option>
          <option value="date-asc">Oldest first</option>
        </select>
      </div>

      {/* filter chips */}
      <div className="sightings-chips" role="group" aria-label="Filter sightings">
        {CHIPS.map(chip => (
          <button
            key={chip.key}
            className={`btn sightings-chip${filter === chip.key ? ' sightings-chip--active' : ''}`}
            onClick={() => setFilter(chip.key)}
            id={`sightings-filter-${chip.key}`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* list */}
      {loading ? (
        <ul className="sightings-list" aria-label="Loading">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="skeleton" style={{ height: '120px', borderRadius: '10px' }} />
          ))}
        </ul>
      ) : filtered.length === 0 ? (
        <div className="sightings-empty">
          <p>😶‍🌫️ No sightings match your search.</p>
          <button className="btn btn--ghost" onClick={() => { setQuery(''); setFilter('all'); }}>
            Clear filters
          </button>
        </div>
      ) : (
        <ul className="sightings-list" aria-label="Sighting records">
          {filtered.map(s => (
            <li key={s.id}>
              <SightingCard sighting={s} query={query} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Sightings;
