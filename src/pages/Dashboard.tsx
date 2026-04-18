import { useAllData } from '../hooks/useAllData';
import type { AllData } from '../types';
import './Dashboard.css';

// ── helpers ────────────────────────────────────────────────────────────────

function latestDate(dates: string[]): string {
  if (dates.length === 0) return '—';
  const sorted = [...dates].sort();
  return new Date(sorted[sorted.length - 1]).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Suspicion score: sources that mention "podo" most recently get higher weight
function suspicionScore(data: AllData): { name: string; score: number }[] {
  const names = new Map<string, number>();

  const bump = (name: string, pts: number) => {
    if (!name || name === 'Unknown') return;
    const key = name.trim().toLowerCase();
    names.set(key, (names.get(key) ?? 0) + pts);
  };

  data.checkins.forEach(c => bump(c.personName, 1));
  data.messages.forEach(m => { bump(m.senderName, 1); bump(m.receiverName, 1); });
  data.sightings.forEach(s => { bump(s.reporterName, 1); bump(s.seenPersonName, 2); bump(s.seenWith ?? '', 1); });
  data.personalNotes.forEach(n => bump(n.authorName, 1));

  return [...names.entries()]
    .map(([name, score]) => ({ name, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

// ── stat card config ───────────────────────────────────────────────────────

interface StatConfig {
  label: string;
  colorClass: string;
  icon: string;
  description: string;
}

const STAT_CONFIG: Record<keyof AllData, StatConfig> = {
  checkins: {
    label: 'Check-ins',
    colorClass: 'badge--checkins',
    icon: '📍',
    description: 'Location appearances',
  },
  messages: {
    label: 'Messages',
    colorClass: 'badge--messages',
    icon: '💬',
    description: 'Exchanges between people',
  },
  sightings: {
    label: 'Sightings',
    colorClass: 'badge--sightings',
    icon: '👁️',
    description: 'Eyewitness reports',
  },
  personalNotes: {
    label: 'Personal Notes',
    colorClass: 'badge--notes',
    icon: '📝',
    description: 'Private notes & comments',
  },
  anonymousTips: {
    label: 'Anonymous Tips',
    colorClass: 'badge--tips',
    icon: '🕵️',
    description: 'Unverified intelligence',
  },
};

// ── sub-components ─────────────────────────────────────────────────────────

function StatCard({
  source,
  count,
  latestAt,
  loading,
}: {
  source: keyof AllData;
  count: number;
  latestAt: string;
  loading: boolean;
}) {
  const cfg = STAT_CONFIG[source];
  return (
    <article className="stat-card card" id={`stat-card-${source}`}>
      <div className="stat-card__top">
        <span className={`badge ${cfg.colorClass}`}>
          {cfg.icon} {cfg.label}
        </span>
      </div>
      {loading ? (
        <div className="skeleton stat-card__skeleton" />
      ) : (
        <p className="stat-card__count">{count}</p>
      )}
      <p className="stat-card__desc text-sm text-muted">{cfg.description}</p>
      <p className="stat-card__latest text-xs text-muted">
        Last entry: <span className="text-secondary">{latestAt}</span>
      </p>
    </article>
  );
}

function SuspectList({ data, loading }: { data: AllData; loading: boolean }) {
  const suspects = suspicionScore(data);

  return (
    <section className="suspects card" aria-labelledby="suspects-heading">
      <h2 className="suspects__heading" id="suspects-heading">
        🔍 Most Mentioned
      </h2>
      <p className="text-sm text-muted suspects__sub">
        People appearing most frequently across all records
      </p>

      {loading ? (
        <ul className="suspects__list">
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className="skeleton suspects__skeleton" />
          ))}
        </ul>
      ) : suspects.length === 0 ? (
        <p className="text-muted text-sm suspects__empty">No data yet.</p>
      ) : (
        <ol className="suspects__list">
          {suspects.map((s, i) => (
            <li key={s.name} className="suspects__item">
              <span className="suspects__rank text-muted text-xs">#{i + 1}</span>
              <span className="suspects__name">{s.name}</span>
              <span className={`badge ${i === 0 ? 'badge--tips' : 'badge--sightings'}`}>
                {s.score} records
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="error-banner" role="alert">
      <span>⚠️ {message}</span>
      <button className="btn btn--ghost" onClick={onRetry} id="dashboard-retry-btn">
        Retry
      </button>
    </div>
  );
}

// ── main page ──────────────────────────────────────────────────────────────

export function Dashboard() {
  const { data, status, error, refetch } = useAllData();
  const loading = status === 'loading' || status === 'idle';

  const totalRecords =
    data.checkins.length +
    data.messages.length +
    data.sightings.length +
    data.personalNotes.length +
    data.anonymousTips.length;

  return (
    <div className="dashboard">
      {/* ── page header ── */}
      <header className="dashboard__header">
        <div>
          <h1 className="dashboard__title">Investigation Dashboard</h1>
          <p className="text-secondary text-sm">
            {loading
              ? 'Fetching case records…'
              : status === 'error'
              ? 'Could not load all records.'
              : `${totalRecords} records across 5 data sources`}
          </p>
        </div>

        <button
          className="btn btn--ghost"
          onClick={refetch}
          disabled={loading}
          id="dashboard-refetch-btn"
          aria-label="Refresh all data"
        >
          {loading ? '⏳ Loading…' : '↻ Refresh'}
        </button>
      </header>

      {/* ── error banner ── */}
      {status === 'error' && error && (
        <ErrorBanner message={error} onRetry={refetch} />
      )}

      {/* ── stat cards ── */}
      <section className="stats-grid" aria-label="Record counts by source">
        {(Object.keys(STAT_CONFIG) as (keyof AllData)[]).map(source => (
          <StatCard
            key={source}
            source={source}
            count={data[source].length}
            latestAt={latestDate(data[source].map(r => r.submittedAt))}
            loading={loading}
          />
        ))}
      </section>

      {/* ── suspects panel ── */}
      <SuspectList data={data} loading={loading} />
    </div>
  );
}

export default Dashboard;
