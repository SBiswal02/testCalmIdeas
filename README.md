# Calm Technology N-Back (React + Node)

A linear-flow N-back experiment web app built with React (frontend) and Express (local backend) for running participants through a fixed sequence and persisting results locally (JSON + CSV).

## Prerequisites

- Node.js + npm (recommended: an active LTS release)

## What This Project Does

The app runs participants through a fixed sequence:

1. Intro
2. Test Settings
3. Countdown (3, 2, 1)
4. Actual Test
5. Results

The frontend displays test performance immediately, while the backend stores each run locally.

## Data Output (Local)

- **Per-run JSON (source of truth)**: `data/runs/<name>_<hh-mm-ss>_<yyyy-mm-dd>.json`
- **Append-only summary CSV**: `data/results.csv`

## Core Features

- Linear participant flow (no dashboard/journal modules)
- Name required, roll number optional
- N-back settings:
  - N level
  - Trial count
  - Stimulus type (letters / numbers / positions)
  - Stimulus duration (1000-4000 ms)
  - Optional distractions + configurable distraction probability
- Keyboard controls during test
- Progress bar for time until next trial
- Delayed feedback display (status appears in next trial with a short transition gap)

## Keyboard Controls

- **Match**: `Space`
- **No Match**: `Enter`
- **Close distraction popup**: `Esc`

## Scoring and Metrics

The results screen shows:

- Accuracy
- Hits
- Misses
- False Alarms
- Correct Rejections
- Reaction Time (all scored responses)
- Reaction Time (Correct Hits/Rejections)

Scoring starts only after N-back comparison becomes valid (`trial >= nValue`).

## Distraction Behavior

When distractions are enabled:

- A popup may appear during a trial based on chosen probability
- Popup appears over the stimulus area
- User can close it via `X` or `Esc`
- Popup auto-closes when trial ends

## Data Persistence Details

The backend treats JSON as source of truth per run.

For each submitted run (`POST /api/results`):

1. JSON run file is written
2. Matching CSV row is appended immediately

If CSV and JSON become inconsistent for any reason, startup sanitation checks for ambiguity and rebuilds CSV from JSON records only when needed.

## Run Locally

```bash
npm install
npm run dev
```

Services:

- Frontend (Vite): `http://localhost:5173`
- Backend (Express): `http://localhost:5050`

`/api/*` requests from Vite are proxied to the backend.

## Build

```bash
npm run build
npm run preview
```

## Common Scripts

- **Dev (frontend + backend)**: `npm run dev`
- **Build**: `npm run build`
- **Preview build**: `npm run preview`

## Project Structure

- `src/App.jsx`: main flow and test orchestration
- `src/components/*`: UI screens/components
- `src/utils/nback.js`: sequence generation and scoring logic
- `src/styles.css`: app styling
- `server.js`: local storage API (JSON + CSV)

## Notes

- **Local storage by design**: runs are written under `data/`. Plan your data handling accordingly (e.g., consent, retention, and access controls) if used in a study setting.

## Clean

```bash
npm run clean
```

- Removes: `dist/`, `node_modules/`

```bash
npm run clean:all
```

- Removes: `dist/`, `node_modules/`, `package-lock.json`


