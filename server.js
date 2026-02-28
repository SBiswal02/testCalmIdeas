/**
 * Local Express result server.
 * Persists each run to JSON and appends a corresponding row to CSV.
 */
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 5050;

const dataDir = path.join(__dirname, "data");
const runsDir = path.join(dataDir, "runs");
const resultsFile = path.join(dataDir, "results.csv");

const CSV_HEADERS = [
  "timestamp",
  "name",
  "rollNumber",
  "nValue",
  "numTrials",
  "stimulusType",
  "stimulusDuration",
  "accuracy",
  "hits",
  "misses",
  "falseAlarms",
  "correctRejections",
  "reactionTime",
  "correctHitOrRejectionReactionTime",
];

app.use(express.json());

function escapeCsv(value) {
  const raw = value === null || value === undefined ? "" : String(value);
  const escaped = raw.replace(/"/g, '""');
  return /[",\n\r]/.test(raw) ? `"${escaped}"` : escaped;
}

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function sanitizeFilePart(value) {
  const raw = value === null || value === undefined ? "" : String(value).trim();
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]+/g, "_").replace(/^_+|_+$/g, "");
  return cleaned || "anonymous";
}

function normalizeCorrectHitOrRejectionReactionTime(results) {
  const candidate =
    results?.avgCorrectHitOrRejectionReactionTime ??
    results?.correctHitOrRejectionReactionTime ??
    results?.avgCorrectHitReactionTime ??
    results?.correctHitReactionTime ??
    results?.correctReactionTime;

  if (candidate === null || candidate === undefined || candidate === "") {
    return "";
  }

  const numeric = Number(candidate);
  if (!Number.isFinite(numeric)) {
    return "";
  }

  return Math.round(numeric);
}

/**
 * Ensures required storage folders/files exist before read/write operations.
 */
function ensureStorage() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(runsDir)) {
    fs.mkdirSync(runsDir, { recursive: true });
  }

  if (!fs.existsSync(resultsFile)) {
    fs.writeFileSync(resultsFile, `${CSV_HEADERS.join(",")}\n`, "utf8");
  }
}

/**
 * Normalizes run payload shape for consistent JSON and CSV persistence.
 */
function normalizeRunRecord(rawRecord, fallbackTimestamp, sourceFile) {
  const timestamp = rawRecord?.timestamp || fallbackTimestamp || new Date().toISOString();
  const participant = rawRecord?.participant || {};
  const settings = rawRecord?.settings || {};
  const results = rawRecord?.results || {};

  return {
    timestamp,
    participant: {
      name: participant?.name ?? "",
      rollNumber: participant?.rollNumber ?? "",
    },
    settings: {
      nValue: settings?.nValue ?? "",
      numTrials: settings?.numTrials ?? "",
      stimulusType: settings?.stimulusType ?? "",
      stimulusDuration: settings?.stimulusDuration ?? "",
    },
    results: {
      accuracy: results?.accuracy ?? "",
      hits: results?.hits ?? "",
      misses: results?.misses ?? "",
      falseAlarms: results?.falseAlarms ?? "",
      correctRejections: results?.correctRejections ?? "",
      avgReactionTime: results?.avgReactionTime ?? "",
      avgCorrectHitOrRejectionReactionTime: normalizeCorrectHitOrRejectionReactionTime(results),
    },
    __sourceFile: sourceFile || "",
  };
}

function buildRunRecord(payload) {
  return normalizeRunRecord(payload, payload?.timestamp);
}

/**
 * Builds per-run JSON filename: name_hh-mm-ss_yyyy-mm-dd.json
 */
function buildJsonFilePath(runRecord) {
  const dateObj = new Date(runRecord.timestamp);
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
  const dd = String(dateObj.getDate()).padStart(2, "0");
  const hh = String(dateObj.getHours()).padStart(2, "0");
  const min = String(dateObj.getMinutes()).padStart(2, "0");
  const ss = String(dateObj.getSeconds()).padStart(2, "0");

  const safeName = sanitizeFilePart(runRecord.participant?.name);
  const jsonFileName = `${safeName}_${hh}-${min}-${ss}_${yyyy}-${mm}-${dd}.json`;
  return path.join(runsDir, jsonFileName);
}

/**
 * Converts a normalized run record into a CSV row string.
 */
function buildCsvRow(runRecord) {
  const { timestamp, participant, settings, results } = runRecord;

  return [
    timestamp,
    participant?.name,
    participant?.rollNumber,
    settings?.nValue,
    settings?.numTrials,
    settings?.stimulusType,
    settings?.stimulusDuration,
    results?.accuracy,
    results?.hits,
    results?.misses,
    results?.falseAlarms,
    results?.correctRejections,
    results?.avgReactionTime,
    results?.avgCorrectHitOrRejectionReactionTime,
  ]
    .map(escapeCsv)
    .join(",");
}

/**
 * Loads all run JSON records as normalized objects (startup sanitation use).
 */
function loadRunRecordsFromJson() {
  if (!fs.existsSync(runsDir)) {
    return [];
  }

  const files = fs.readdirSync(runsDir).filter((name) => name.toLowerCase().endsWith(".json"));
  const records = [];

  for (const fileName of files) {
    try {
      const filePath = path.join(runsDir, fileName);
      const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
      records.push(normalizeRunRecord(raw, undefined, fileName));
    } catch {
      // Ignore malformed run files.
    }
  }

  records.sort((a, b) => {
    const timeCompare = String(a.timestamp).localeCompare(String(b.timestamp));
    if (timeCompare !== 0) {
      return timeCompare;
    }
    return String(a.__sourceFile).localeCompare(String(b.__sourceFile));
  });

  return records;
}

/**
 * Detects whether CSV differs from what can be deterministically rebuilt from JSON.
 */
function csvHasAmbiguity(recordsFromJson) {
  if (!fs.existsSync(resultsFile)) {
    return recordsFromJson.length > 0;
  }

  const raw = fs.readFileSync(resultsFile, "utf8");
  if (!raw.trim()) {
    return recordsFromJson.length > 0;
  }

  const lines = raw.replace(/\r\n/g, "\n").split("\n").filter((line) => line.length > 0);
  if (lines.length === 0) {
    return recordsFromJson.length > 0;
  }

  const header = parseCsvLine(lines[0]);
  if (header.length !== CSV_HEADERS.length || header.some((value, idx) => value !== CSV_HEADERS[idx])) {
    return true;
  }

  const actualRows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const fields = parseCsvLine(lines[i]);
    if (fields.length !== CSV_HEADERS.length) {
      return true;
    }
    actualRows.push(fields.map(escapeCsv).join(","));
  }

  const expectedRows = recordsFromJson.map(buildCsvRow);
  if (actualRows.length !== expectedRows.length) {
    return true;
  }

  actualRows.sort();
  expectedRows.sort();

  for (let i = 0; i < actualRows.length; i += 1) {
    if (actualRows[i] !== expectedRows[i]) {
      return true;
    }
  }

  return false;
}

/**
 * Rebuilds CSV from JSON only when ambiguity/mismatch is detected.
 */
function sanitizeCsvIfAmbiguous() {
  const runRecords = loadRunRecordsFromJson();
  if (!csvHasAmbiguity(runRecords)) {
    return;
  }

  const lines = [CSV_HEADERS.join(",")];
  for (const runRecord of runRecords) {
    lines.push(buildCsvRow(runRecord));
  }

  fs.writeFileSync(resultsFile, `${lines.join("\n")}\n`, "utf8");
}

/**
 * Persists JSON first (source of truth), then appends corresponding CSV row.
 */
function persistRunAndCsv(runRecord) {
  const jsonFilePath = buildJsonFilePath(runRecord);

  // JSON is source of truth. CSV is updated immediately after JSON creation.
  fs.writeFileSync(jsonFilePath, JSON.stringify(runRecord, null, 2), "utf8");

  try {
    fs.appendFileSync(resultsFile, `${buildCsvRow(runRecord)}\n`, "utf8");
  } catch (error) {
    error.jsonFilePath = jsonFilePath;
    throw error;
  }

  return jsonFilePath;
}

app.post("/api/results", (req, res) => {
  try {
    const { participant, settings, results } = req.body || {};
    if (!participant || !settings || !results) {
      return res.status(400).json({ ok: false, error: "Invalid payload" });
    }

    ensureStorage();
    const runRecord = buildRunRecord(req.body);
    const jsonFilePath = persistRunAndCsv(runRecord);

    return res.json({ ok: true, jsonFile: path.relative(__dirname, jsonFilePath) });
  } catch (error) {
    const jsonFile = error.jsonFilePath ? path.relative(__dirname, error.jsonFilePath) : undefined;
    return res.status(500).json({
      ok: false,
      error: error.message,
      jsonFile,
      note: jsonFile ? "JSON was created, but CSV update failed. CSV can be sanitized on next server start." : undefined,
    });
  }
});

try {
  ensureStorage();
  sanitizeCsvIfAmbiguous();
} catch (error) {
  // eslint-disable-next-line no-console
  console.error("Startup CSV sanitization failed:", error.message);
}

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Result server listening on http://localhost:${PORT}`);
});





