CREATE TABLE IF NOT EXISTS content_blocks (page TEXT NOT NULL, block_key TEXT NOT NULL, html TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1, updated_at TEXT NOT NULL, updated_by TEXT NOT NULL, PRIMARY KEY(page, block_key));
CREATE TABLE IF NOT EXISTS content_history (id INTEGER PRIMARY KEY AUTOINCREMENT, page TEXT NOT NULL, block_key TEXT NOT NULL, previous_html TEXT, next_html TEXT, updated_at TEXT NOT NULL, updated_by TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS metrics (day TEXT NOT NULL, kind TEXT NOT NULL, page TEXT NOT NULL, source TEXT NOT NULL, device TEXT NOT NULL, country TEXT NOT NULL, total INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(day,kind,page,source,device,country));
CREATE TABLE IF NOT EXISTS site_settings (key TEXT PRIMARY KEY,value TEXT NOT NULL);
INSERT OR IGNORE INTO site_settings VALUES ('tracking_started', strftime('%Y-%m-%dT%H:%M:%SZ','now'));
