# CalmUX Lab – Technical Implementation Report

## 1. Project Overview

**CalmUX Lab** is an experimental interaction platform designed to evaluate how "calm technology" design features affect user emotional response, usability, and reflection. The project operationalizes calm technology along Don Norman’s three processing levels (Visceral, Behavioral, Reflective) and provides an environment for running psychological test modules (like the N-Back test), coupled with interaction tracking and journal reflection.

This document breaks down the current implementation, serving both as an architectural reference and a step-by-step guide for recreating the application from scratch.

---

## 2. Technology Stack

- **Frontend Core:** Pure Vanilla HTML5, CSS3, and JavaScript (ES6+).
- **Architecture:** Multi-Page Application (MPA).
- **State Management:** Browser `localStorage`.
- **Styling:** Custom CSS with CSS Variables for theming.
- **Development Server:** `http-server` via Node.js/NPM (used solely for local hosting).
- **No Build Tools:** The project does not use Webpack, Babel, Vite, or React/Vue.

---

## 3. Project Structure & File Map

The root directory contains the following critical files:

- **HTML Pages (The Views)**
  - `index.html`: The landing/home page outlining the experiment.
  - `dashboard.html`: Displays real-time metrics, system status ("Calm", "Elevated", "Alert"), and the interaction heatmap.
  - `task.html`: The N-Back Test interface. Handles test configuration, execution, and immediate feedback.
  - `journal.html`: The reflection module where users log insights with tags and timestamps.
  - `about.html`: Provides detailed information about the study.
- **Assets & Logic**
  - `styles.css`: The global stylesheet handling layout, typography, animations, responsive design, and Dark/Light mode theming.
  - `script.js`: The monolithic JavaScript payload handling state, the N-Back test class, metrics calculation, and DOM manipulation.
- **Documentation & Configuration**
  - `prd.md`: Product Requirements Document detailing the experimental conditions and feature mappings.
  - `package.json`: Contains the `dev` script (`http-server . -p 8000 -c-1`) for serving the app locally.

---

## 4. Core Architecture & Data Management

The application is purely client-side, persisting data via the browser's `localStorage`.

### Data Models
The state is managed by two primary objects in `script.js`:

1.  **`CalmMetrics`:** The central store for all session data.
    - Tracks an auto-generated `anonId`.
    - Tracks `sessions`, `totalHits`, `totalMisses`, `totalFalseAlarms`, and `totalReactionTime`.
    - `interactionBuckets`: Maps clicks/engagement across `dashboard`, `task`, and `journal`.
    - `sessionLog`: Array of historic N-Back test runs.
    - `reflectionLog`: Array of journal entries.
2.  **`CalmStore`:** A utility object wrapper around `localStorage`.
    - `load()`: Parses `calmuxlab_metrics_v1` from local storage.
    - `save()`: Stringifies and saves the current `CalmMetrics` object.

---

## 5. Component Deep Dives

### A. The N-Back Test Engine (`task.html` & `NBackTest` Class)
The core psychological evaluation tool in this app is the **N-Back test**. 
- **Initialization:** An instance of `NBackTest` is bound to the form on `task.html`. 
- **Sequence Generation:** `generateSequence()` randomly creates a list of stimuli (letters, numbers, or grid positions) based on the user's `nValue` and `numTrials`. It ensures an explicit ~30% target rate.
- **Test Loop:** `showStimulus()` orchestrates a timer using `setTimeout`. If a user does not respond within the `stimulusDuration`, it registers as a non-response.
- **Input Handling:** Button clicks and spacebar (`handleResponse`) validate against the generated sequence to record hits, misses, false alarms, or correct rejections.
- **Completion:** Test metrics are pushed to `CalmMetrics.sessionLog`, and the central store is synced via `CalmStore.save()`.

### B. Dashboard & Scoring System Algorithm (`dashboard.html`)
The dashboard aggregates the persistent `localStorage` data into three primary emotional/usability scores derived from Don Norman’s processing levels:

1.  **Visceral Score (Emotional Response):** 
    - Derived from the error rate: `100 * (1 - errorRate)`.
2.  **Behavioral Score (Usability/Flow):** 
    - Derived from the average reaction time (avgRt). 
    - Formula: `max(0, min(100, round(120 - avgRt / 30)))`.
3.  **Reflective Score (Meaning/Attachment):**
    - Directly proportional to the number of journal entries: `min(100, reflections * 20)`.

A **Composite Score** is generated via a weighted formula: `(Visceral * 0.4) + (Behavioral * 0.35) + (Reflective * 0.25)`. This determines the dynamic system status ("Calm" ≥ 70, "Elevated" ≥ 40, "Alert" < 40), triggering ambient visual feedback.

### C. Journal System (`journal.html`)
- Listens for form submissions and renders HTML strings securely.
- Increments the `CalmMetrics.reflections` counter.
- Provides immediate positive reinforcement via ambient notifications.

### D. Event Tracking & CSV Export
- A global click-listener detects targets containing the `data-area` attribute to increment `interactionBuckets` for heatmap generation.
- **Exporting Data**: `exportUserDataCsv()` converts the JSON arrays (`sessionLog`, `reflectionLog`, `interactionBuckets`) into a well-formatted CSV string and triggers an automatic Blob download.

---

## 6. UI & "Calm Technology" Design Implementation

The UI attempts to embed the calm principles heavily discussed in `prd.md`.

- **CSS Variables & Theming:** Controlled centrally in `:root`. Dark mode acts on a `body.dark-mode` toggle that overwrites standard variable colors.
- **Visceral Design:** 
  - Soft gradients (`.gradient-orb`) floating smoothly (`float` and `slow-orbit` animations).
  - Ambient notifications (`.notification-ambient`) sliding in quietly without disruptive modal blocking.
- **Behavioral Design:** 
  - Off-center, peripheral information loops, such as the `progress-ring` relying on `conic-gradient` rather than heavy progress bars.
- **Reflective Design:** 
  - The Journal Timeline layout visually emphasizes introspection. It employs soft spacing and rounded borders.

---

## 7. Step-by-Step Guide: Recreating the Website

If another developer needs to rebuild this project exactly as structured, follow this guide:

### Step 1: Project Setup
1.  Initialize a new directory.
2.  Run `npm init -y` and `npm install --save-dev http-server`.
3.  Add the script `"dev": "http-server . -p 8000 -c-1"` to `package.json` for easy dev serving.

### Step 2: Construct the Shared DOM Elements
Create standard HTML files (`index.html`, `dashboard.html`, `task.html`, `journal.html`, `about.html`). Ensure they all load `styles.css` in the `<head>` and `script.js` before `</body>`.
- Extract repetitive navigation HTML (the `.navbar`) and place it on all pages.

### Step 3: Global Styles CSS Assembly
1. Setup specific CSS Custom properties. Define light mode variables and `.dark-mode` overrides.
2. Build utility classes for animations (`@keyframes float`, `@keyframes slow-orbit`).
3. Construct the layout using CSS Flexbox for `nav` and Grid for the dashboard (`.dashboard-grid`).

### Step 4: Local Storage Wrapper
In `script.js`, create the baseline `CalmMetrics` object with all tracking arrays/counters initialized, alongside a `CalmStore` wrapper that has `load()` and `save()` methods using `JSON.stringify/parse`.

### Step 5: Implement the Analytics Engine
1. On `DOMContentLoaded`, run `CalmStore.load()`.
2. Map a global event listener to the `document` that detects tags with `data-area` parameters.
3. Every DOM interaction should increment the appropriate bucket and invoke `CalmStore.save()`.

### Step 6: Build the N-Back Test Module
1. Create `class NBackTest` inside `script.js`.
2. Add a form submit event to capture parameters (N-Value, Duration).
3. Draft the sequence generation algorithm (`Math.random`). Use an array loop where values match `i - n`.
4. Build the test cycle utilizing asynchronous logic (`setTimeout` matching user stimulus duration configuration). Track response times accurately with `Date.now()`.
5. Upon test completion, pipe the accuracy metrics directly into the `CalmMetrics` arrays and run the save wrapper.

### Step 7: Dashboard Calculation & Data Binding
Create a function `updateDashboardFromMetrics()`:
1. Fetch metrics from the active `CalmMetrics` JSON.
2. Calculate Visceral, Behavioral, and Reflective formulas.
3. Use simple `document.getElementById` targetting to bind the results directly to the Dashboard UI DOM elements. 

### Step 8: Analytics Export
Build a pure-JS CSV generator parsing your custom state object and returning a downloadable Blob using `URL.createObjectURL(blob)`, appending it to a hidden anchor element `<a>`, clicking it programmatically, and then destroying it.
