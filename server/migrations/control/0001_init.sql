-- Every tenant-owned table carries tenant_id. Queries must always filter by it;
-- SQLite has no row-level security, so isolation lives in the repository code.

CREATE TABLE tenants (
    id            INTEGER PRIMARY KEY,
    slug          TEXT NOT NULL UNIQUE CHECK (slug GLOB '[a-z0-9]*' AND length(slug) BETWEEN 2 AND 40),
    name          TEXT NOT NULL,
    status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    contact_name  TEXT NOT NULL DEFAULT '',
    contact_email TEXT NOT NULL DEFAULT '',
    notes         TEXT NOT NULL DEFAULT '',
    -- hosting plan
    plan_name     TEXT NOT NULL DEFAULT 'Standard',
    price_cents   INTEGER NOT NULL DEFAULT 0,
    currency      TEXT NOT NULL DEFAULT 'USD',
    billing_cycle TEXT NOT NULL DEFAULT 'yearly' CHECK (billing_cycle IN ('monthly', 'yearly')),
    paid_until    TEXT,               -- YYYY-MM-DD; NULL = never paid
    created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- Hostnames that serve a tenant site. Caddy's on-demand TLS asks us about these.
CREATE TABLE domains (
    host        TEXT PRIMARY KEY,     -- lowercase, no port: 'client.com', 'www.client.com', 'acme.folio.example'
    tenant_id   INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    is_primary  INTEGER NOT NULL DEFAULT 0,
    verified    INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX domains_tenant ON domains (tenant_id);

-- Registered domain names the client pays a registrar for (renewal tracking).
CREATE TABLE registrations (
    domain            TEXT PRIMARY KEY,   -- registrable name: 'client.com'
    tenant_id         INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    registrar         TEXT NOT NULL DEFAULT '',
    expires_at        TEXT,               -- YYYY-MM-DD
    renewal_price_cents INTEGER NOT NULL DEFAULT 0,
    managed_by_us     INTEGER NOT NULL DEFAULT 1,
    rdap_checked_at   TEXT,
    rdap_error        TEXT
);
CREATE INDEX registrations_tenant ON registrations (tenant_id);

CREATE TABLE payments (
    id           INTEGER PRIMARY KEY,
    tenant_id    INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    kind         TEXT NOT NULL DEFAULT 'hosting' CHECK (kind IN ('hosting', 'domain', 'other')),
    amount_cents INTEGER NOT NULL,
    currency     TEXT NOT NULL DEFAULT 'USD',
    paid_on      TEXT NOT NULL,          -- YYYY-MM-DD
    method       TEXT NOT NULL DEFAULT '',
    note         TEXT NOT NULL DEFAULT '',
    created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX payments_tenant ON payments (tenant_id, paid_on DESC);

-- tenant_id NULL + is_super = 1 => platform owner (admin console).
CREATE TABLE users (
    id            INTEGER PRIMARY KEY,
    tenant_id     INTEGER REFERENCES tenants(id) ON DELETE CASCADE,
    email         TEXT NOT NULL COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    is_super      INTEGER NOT NULL DEFAULT 0,
    created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    CHECK ((is_super = 1 AND tenant_id IS NULL) OR (is_super = 0 AND tenant_id IS NOT NULL))
);
CREATE UNIQUE INDEX users_tenant_email ON users (ifnull(tenant_id, 0), email);

CREATE TABLE sessions (
    token_hash TEXT PRIMARY KEY,         -- sha256(cookie token)
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL
);
CREATE INDEX sessions_user ON sessions (user_id);

-- ---------- tenant site content ----------

CREATE TABLE site_content (
    tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    key       TEXT NOT NULL,
    value     TEXT NOT NULL,
    PRIMARY KEY (tenant_id, key)
) WITHOUT ROWID;

CREATE TABLE posts (
    id           TEXT PRIMARY KEY,       -- uuid (keeps ids imported from Supabase)
    tenant_id    INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title        TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 300),
    excerpt      TEXT NOT NULL DEFAULT '' CHECK (length(excerpt) <= 500),
    body         TEXT NOT NULL,
    published    INTEGER NOT NULL DEFAULT 0,
    published_at TEXT,
    author_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
    cover_url    TEXT,
    created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX posts_tenant_published ON posts (tenant_id, published, published_at DESC);

CREATE TABLE section_visibility (
    tenant_id   INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    section_key TEXT NOT NULL,
    visible     INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (tenant_id, section_key)
) WITHOUT ROWID;

CREATE TABLE custom_sections (
    id         TEXT PRIMARY KEY,
    tenant_id  INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title      TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 160),
    body       TEXT NOT NULL,
    position   INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX custom_sections_tenant ON custom_sections (tenant_id, position);

CREATE TABLE contact_messages (
    id         INTEGER PRIMARY KEY,
    tenant_id  INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL,
    subject    TEXT NOT NULL DEFAULT '',
    message    TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
CREATE INDEX contact_messages_tenant ON contact_messages (tenant_id, created_at DESC);

-- ---------- monitoring ----------

CREATE TABLE health_checks (
    id          INTEGER PRIMARY KEY,
    host        TEXT NOT NULL,
    checked_at  TEXT NOT NULL,
    ok          INTEGER NOT NULL,
    status_code INTEGER,
    latency_ms  INTEGER,
    error       TEXT
);
CREATE INDEX health_checks_host ON health_checks (host, checked_at DESC);
