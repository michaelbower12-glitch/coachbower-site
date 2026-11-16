CREATE TABLE IF NOT EXISTS content_blocks (page TEXT NOT NULL, block_key TEXT NOT NULL, html TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL, updated_by TEXT NOT NULL, PRIMARY KEY(page, block_key));
CREATE TABLE IF NOT EXISTS content_history (id INTEGER PRIMARY KEY AUTOINCREMENT, page TEXT NOT NULL, block_key TEXT NOT NULL, previous_html TEXT, next_html TEXT, updated_at TEXT NOT NULL, updated_by TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS metrics (day TEXT NOT NULL, kind TEXT NOT NULL, page TEXT NOT NULL, source TEXT NOT NULL, device TEXT NOT NULL, country TEXT NOT NULL, total INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(day,kind,page,source,device,country));
CREATE TABLE IF NOT EXISTS site_settings (key TEXT PRIMARY KEY,value TEXT NOT NULL);
INSERT OR IGNORE INTO site_settings VALUES ('tracking_started', strftime('%Y-%m-%dT%H:%M:%SZ','now'));

CREATE TABLE IF NOT EXISTS portal_members (id TEXT PRIMARY KEY, email TEXT NOT NULL COLLATE NOCASE UNIQUE, name TEXT NOT NULL DEFAULT '', status TEXT NOT NULL CHECK(status IN ('pending','approved','declined','revoked')), requested_at TEXT NOT NULL, updated_at TEXT NOT NULL, reviewed_by TEXT);
CREATE INDEX IF NOT EXISTS portal_members_status ON portal_members(status,requested_at);
CREATE TABLE IF NOT EXISTS portal_member_history (id INTEGER PRIMARY KEY AUTOINCREMENT, member_id TEXT NOT NULL, previous_status TEXT NOT NULL, next_status TEXT NOT NULL, reviewed_at TEXT NOT NULL, reviewed_by TEXT NOT NULL);

CREATE TABLE IF NOT EXISTS request_alerts (id TEXT PRIMARY KEY, member_id TEXT NOT NULL, channel TEXT NOT NULL CHECK(channel IN ('email','sms')), status TEXT NOT NULL DEFAULT 'queued' CHECK(status IN ('queued','sending','accepted','failed','uncertain')), attempts INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, started_at TEXT, next_attempt TEXT NOT NULL, provider_id TEXT, error_code TEXT, UNIQUE(member_id,channel));
CREATE INDEX IF NOT EXISTS request_alerts_queue ON request_alerts(status,next_attempt);
