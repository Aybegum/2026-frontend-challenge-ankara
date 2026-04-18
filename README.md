# Missing Podo: The Ankara Case 🐾

> **Jotform 2026 Frontend Challenge** — Investigation Dashboard

## Overview

An investigation dashboard built for the "Missing Podo: The Ankara Case" challenge. It fetches live data from five Jotform endpoints, merges and normalizes related records, and presents a coherent **3-panel investigation workspace** designed to answer one question: **Where is Podo, and who is responsible?**

## Getting Started / Başlangıç

### How to Run (Nasıl Çalıştırılır)
To run the investigation dashboard locally:

```bash
# 1. Install dependencies / Bağımlılıkları yükleyin
npm install

# 2. Start the Vite dev server / Geliştirme sunucusunu başlatın
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Testing & Validation (Nasıl Test Edilir)

This project ensures high data integrity and reliability through strict TypeScript types and comprehensive manual UI verification:

```bash
# Catch type errors and verify build integrity across all files
npm run build
```

**Key Testing Scenarios / Önemli Test Senaryoları:**
1. **Theme Switching:** Use the ☀️/🌙 icon in the header. Verify the UI and the CartoDB map tiles instantly switch between Light and Dark mode.
2. **Search Normalization:** Type "Kagan" in the suspect search. Ensure Turkish character variants (Kağan / Kagan) are merged into a single profile.
3. **Map Interaction:** Click source toggles under the map (e.g., Check-ins). Verify markers filter out and the dashed route line recalculates dynamically.
4. **Data Grid Sorting:** Click "Evidence Records" in the top navigation. Test filtering by tabs and clicking table headers to sort by Date or Person.
5. **Prime Suspect System:** Select different people from the left sidebar and watch the "Prime Suspect" insight card highlight the person with the most critical evidence.

## Features

### 🗺️ Interactive Investigation Map
- Live pins on a **dark Ankara map** for every event
- Color-coded by evidence type (Check-in, Message, Sighting, Tip, Note)
- **Chronological route tracing** — a dashed polyline connects events in time order to visualize Podo's path
- Click any marker to see full event details in a popup

### 🕵️ Suspect Board (Left Panel)
- All **people extracted** from across all 5 data sources
- Ranked by a computed **Suspicion Score** (weighted: Sightings 3pt, Tips 3pt high / 1pt low, Companions 1.5pt, Checkins/Messages 1pt)
- Suspicion score bar visualization per person
- Real-time **suspect search** filter
- Last-seen timestamp per person
- Click any suspect → map + timeline update instantly

### 📋 Case File Timeline (Right Panel)
- Full chronological event stream for the selected suspect
- **Evidence search** — filter events by keyword (location, description, title)
- **Source toggles** — show/hide Check-ins, Messages, Sightings, Notes, Tips independently (map updates live)
- Each card shows: event type, timestamp, location pin, full description

### 🐾 "Where is Podo?" Prediction
- Top bar above the map automatically computes Podo's **Last Known Location** from the most recent localized event
- Displays **confidence level** (HIGH / MEDIUM / LOW) based on recency and frequency
- No ML required — smart heuristic using recency + location frequency

### 🔡 Turkish Name Normalization
- Names like `Kagan` and `Kağan` are automatically **merged into one identity**
- Prevents data fragmentation caused by form entry inconsistencies
- Canonical name is chosen as the one with proper Turkish characters

## Data Sources

| Source | Description |
|--------|-------------|
| Check-ins | Check-in / appearance records at different locations |
| Messages | Messages exchanged between people |
| Sightings | Someone being seen with someone else at a specific place |
| Personal Notes | Personal notes / comments |
| Anonymous Tips | Tips with varying reliability |

All data is fetched in parallel from the Jotform API and normalized into a unified type-safe model via `src/services/api.ts`.

## Tech Stack

| Tool | Version | Role |
|------|---------|------|
| React | 19 | UI framework |
| TypeScript | 6 | Type safety |
| Vite | 8 | Build / dev server |
| React Router | 7 | Client-side routing |
| Leaflet + react-leaflet | 1.9 / 4.x | Interactive map |
| Vanilla CSS | — | Design system / styling |

## Project Structure

```
src/
├── components/
│   ├── Layout/
│   │   ├── Header.tsx        # Fixed top bar with active investigation badge
│   │   └── Header.css
│   └── MapViewer.tsx         # Leaflet map wrapper with coordinate lookup
├── hooks/
│   └── useAllData.ts         # Parallel data fetching hook with loading/error states
├── pages/
│   └── Dashboard.tsx         # Full SPA: 3-panel investigation workspace
├── services/
│   └── api.ts                # Jotform API layer + field normalization
├── styles/
│   └── global.css            # Design tokens & utility classes
├── types/
│   └── index.ts              # TypeScript interfaces for all data sources
├── App.tsx                   # Root component + routing
└── main.tsx                  # Entry point
```

## Architecture Decisions

- **Single Page Application** — all three panels live on `/`, keeping context intact as you switch suspects
- **Client-side normalization** — all field-name inconsistencies and Turkish character variants are resolved in `api.ts` and `Dashboard.tsx`, never surfacing as UI bugs
- **Stable jitter** — map pins at the same location are offset using a deterministic hash so they never overlap or jump on re-render
- **No Redux / no heavy state library** — `useMemo` + `useState` is sufficient; data flows down from one `useAllData()` hook
