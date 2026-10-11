-- Schema of each tenant's own database (data/tenants/<slug>.db).
-- The whole file belongs to one tenant, so there is no tenant_id column.

CREATE TABLE site_content (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
) WITHOUT ROWID;

CREATE TABLE posts (
    id           TEXT PRIMARY KEY,       -- uuid
    title        TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 300),
    excerpt      TEXT NOT NULL DEFAULT '' CHECK (length(excerpt) <= 500),
    body         TEXT NOT NULL,
    published    INTEGER NOT NULL DEFAULT 0,
    published_at TEXT,
    author_id    INTEGER,                -- users.id in the control database (no cross-file FK)
    cover_url    TEXT,
    created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX posts_published ON posts (published, published_at DESC);

CREATE TABLE section_visibility (
    section_key TEXT PRIMARY KEY,
    visible     INTEGER NOT NULL DEFAULT 1
) WITHOUT ROWID;

CREATE TABLE custom_sections (
    id         TEXT PRIMARY KEY,
    title      TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 160),
    body       TEXT NOT NULL,
    position   INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX custom_sections_position ON custom_sections (position);

CREATE TABLE contact_messages (
    id         INTEGER PRIMARY KEY,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL,
    subject    TEXT NOT NULL DEFAULT '',
    message    TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX contact_messages_created ON contact_messages (created_at DESC);
