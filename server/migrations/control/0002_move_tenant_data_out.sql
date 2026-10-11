-- Tenant content moves to one SQLite file per tenant (data/tenants/<slug>.db).
-- The old shared tables are parked as legacy_*; on startup the server copies their
-- rows into each tenant's database and then drops them (see db::move_legacy_tenant_data).
ALTER TABLE site_content       RENAME TO legacy_site_content;
ALTER TABLE posts              RENAME TO legacy_posts;
ALTER TABLE section_visibility RENAME TO legacy_section_visibility;
ALTER TABLE custom_sections    RENAME TO legacy_custom_sections;
ALTER TABLE contact_messages   RENAME TO legacy_contact_messages;
