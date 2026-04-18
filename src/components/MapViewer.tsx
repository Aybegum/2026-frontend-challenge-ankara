import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import type { TimelineEvent } from '../pages/Dashboard';

// ── Fix leaflet default icon CRA/Vite bug ──
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ── Custom icons ──
const makeIcon = (color: string) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize:   [22, 36], iconAnchor: [11, 36], popupAnchor: [1, -32], shadowSize: [36, 36]
});

const ICONS: Record<string, L.Icon> = {
  checkins:  makeIcon('blue'),
  messages:  makeIcon('violet'),
  sightings: makeIcon('green'),
  notes:     makeIcon('yellow'),
  tips:      makeIcon('red'),
  podo:      makeIcon('orange'),
};

// ── Ankara location lookup ──
const ANKARA: Record<string, [number, number]> = {
  'kızılay':         [39.9208, 32.8541],
  'kizilay':         [39.9208, 32.8541],
  'tunalı':          [39.9042, 32.8588],
  'tunali':          [39.9042, 32.8588],
  'seğmenler':       [39.8942, 32.8617],
  'segmenler':       [39.8942, 32.8617],
  'kuğulu':          [39.9015, 32.8580],
  'kugulu':          [39.9015, 32.8580],
  'bahçelievler':    [39.9190, 32.8250],
  'bahcelievler':    [39.9190, 32.8250],
  '7. cadde':        [39.9200, 32.8230],
  'cepa':            [39.9079, 32.7562],
  'kentpark':        [39.9085, 32.7580],
  'gölbaşı':         [39.7905, 32.8021],
  'golbasi':         [39.7905, 32.8021],
  'atakule':         [39.8860, 32.8550],
  'anıtkabir':       [39.9255, 32.8369],
  'anitkabir':       [39.9255, 32.8369],
  'anıttepe':        [39.9260, 32.8400],
  'odtü':            [39.8910, 32.7830],
  'odtu':            [39.8910, 32.7830],
  'bilkent':         [39.8680, 32.7480],
  'ulus':            [39.9400, 32.8540],
  'sıhhiye':         [39.9280, 32.8550],
  'sihhiye':         [39.9280, 32.8550],
  'eskişehir yolu':  [39.9080, 32.7700],
  'eskisehir yolu':  [39.9080, 32.7700],
  'armada':          [39.9130, 32.8120],
  'ziya gökalp':     [39.9215, 32.8580],
  'ziya gokalp':     [39.9215, 32.8580],
  'kennedy':         [39.9060, 32.8600],
  'çankaya':         [39.9032, 32.8597],
  'cankaya':         [39.9032, 32.8597],
};

// Stable jitter seeded by string so pins don't jump on re-render
function jitter(seed: string): [number, number] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) { h = Math.imul(31, h) + seed.charCodeAt(i); }
  const rx = ((h & 0xffff) / 0xffff - 0.5) * 0.04;
  const ry = (((h >> 16) & 0xffff) / 0xffff - 0.5) * 0.04;
  return [39.9208 + rx, 32.8541 + ry];
}

function getCoords(loc: string | undefined, id: string): [number, number] {
  if (!loc) return jitter(id);
  const key = loc.toLowerCase().trim();
  for (const [k, v] of Object.entries(ANKARA)) {
    if (key.includes(k)) return v;
  }
  return jitter(loc + id);
}

// ── Component ──
export function MapViewer({ events }: { events: TimelineEvent[] }) {
  const { theme } = useTheme();

  const points = useMemo(() =>
    events.map(e => ({
      ...e,
      coords: getCoords(e.location, e.id),
    })), [events]);

  const polylineCoords = useMemo(() =>
    points
      .filter(p => p.location)
      .map(p => p.coords), [points]);

  const isPodo = (title: string) => title.toLowerCase().includes('podo');

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <MapContainer
        center={[39.9208, 32.8541]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
          url={theme === 'light' 
            ? "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          }
        />

        {points.map((p, i) => (
          <Marker
            key={`${p.id}-${i}`}
            position={p.coords}
            icon={isPodo(p.title) ? ICONS.podo : ICONS[p.type] ?? new L.Icon.Default()}
          >
            <Popup>
              <div style={{ minWidth: 160 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{p.title}</div>
                {p.location && <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>📍 {p.location}</div>}
                <div style={{ fontSize: 11, opacity: 0.6 }}>
                  {p.date.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
                {p.description && (
                  <div style={{ marginTop: 6, fontSize: 11, lineHeight: 1.4, opacity: 0.85 }}>
                    {p.description.slice(0, 120)}{p.description.length > 120 ? '…' : ''}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {polylineCoords.length > 1 && (
          <Polyline
            positions={polylineCoords}
            color={theme === 'light' ? '#b45309' : '#f5a623'}
            weight={theme === 'light' ? 3 : 2}
            opacity={theme === 'light' ? 0.8 : 0.5}
            dashArray="6 8"
          />
        )}
      </MapContainer>
    </div>
  );
}

export default MapViewer;
