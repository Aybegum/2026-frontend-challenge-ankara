# Missing Podo: The Ankara Case

> **Jotform 2026 Frontend Challenge** — Investigation Dashboard

## Overview

This app is an investigation dashboard built for the "Missing Podo: The Ankara Case" challenge. It fetches data from five Jotform submission endpoints and presents a coherent, investigative interface that lets users follow Podo's trail across Ankara, identify suspicious individuals, and link related records.

## Tech Stack

| Tool | Version | Role |
|------|---------|------|
| React | 19 | UI framework |
| TypeScript | 6 | Type safety |
| Vite | 8 | Build / dev server |
| React Router | 7 | Client-side routing |
| Vanilla CSS | — | Design system / styling |

## Getting Started

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Data Sources

| Source | Description |
|--------|-------------|
| Check-ins | Check-in / appearance records at different locations |
| Messages | Messages exchanged between people |
| Sightings | Someone being seen with someone else at a specific place |
| Personal Notes | Personal notes / comments |
| Anonymous Tips | Tips with varying reliability |

All data is fetched from the Jotform API using three rotating API keys to stay within rate limits.

## Project Structure

```
src/
├── components/
│   └── Layout/
│       ├── Header.tsx       # Fixed navigation bar
│       └── Header.css
├── pages/                   # Route-level page components
├── services/
│   └── api.ts               # Jotform API layer + normalisation
├── styles/
│   └── global.css           # Design tokens & utility classes
├── types/
│   └── index.ts             # TypeScript interfaces for all data sources
├── App.tsx                  # Root component + routing
└── main.tsx                 # Entry point
```

## Commit Strategy

| # | Scope |
|---|-------|
| 1 | Foundation — types, API service, design system, layout skeleton |
| 2 | Data fetching hook + Dashboard overview with live counts |
| 3 | Sightings list with search / filter |
| 4 | Person profile / record linking |
| 5 | Polish — suspicion scoring, animations, responsive tweaks |
