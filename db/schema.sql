-- SignalCode pharmacy portal schema (Cloudflare D1 / SQLite)

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  pharmacy_name TEXT NOT NULL,
  city          TEXT NOT NULL,
  active        INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- One row per physical unit/batch code (GTIN + batch + serial).
CREATE TABLE IF NOT EXISTS batches (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  gtin             TEXT NOT NULL,
  batch            TEXT NOT NULL,
  serial           TEXT NOT NULL,
  name             TEXT NOT NULL,
  manufacturer     TEXT NOT NULL,
  payload          TEXT NOT NULL,
  expiry           TEXT,
  -- NULL = any pharmacy may receive it; otherwise only that pharmacy.
  assigned_user_id INTEGER REFERENCES users(id),
  UNIQUE (gtin, batch, serial)
);
CREATE INDEX IF NOT EXISTS idx_batches_gtin ON batches (gtin);

-- What pharmacies report: a receipt or a deviation.
CREATE TABLE IF NOT EXISTS stage_events (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id   INTEGER NOT NULL REFERENCES batches(id),
  user_id    INTEGER NOT NULL REFERENCES users(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('received', 'deviation')),
  reason     TEXT,
  note       TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_events_batch ON stage_events (batch_id);
CREATE INDEX IF NOT EXISTS idx_events_user ON stage_events (user_id);
-- A unit can be received only once (protects against double taps / two pharmacies).
CREATE UNIQUE INDEX IF NOT EXISTS one_receipt_per_batch
  ON stage_events (batch_id) WHERE event_type = 'received';

CREATE TABLE IF NOT EXISTS login_attempts (
  username TEXT NOT NULL COLLATE NOCASE,
  at       INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_login_attempts ON login_attempts (username, at);
