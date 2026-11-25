-- Schema for TruthLens AI Persistence Layer
-- Compatible with SQLite 3.35+ and PostgreSQL

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  auth_subject TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  retention_policy_days INTEGER NOT NULL DEFAULT 30
);

CREATE TABLE IF NOT EXISTS workspace_members (
  workspace_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TEXT NOT NULL,
  PRIMARY KEY (workspace_id, user_id),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS analyses (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  input_type TEXT NOT NULL,
  original_object_key TEXT,
  original_sha256 TEXT,
  source_url TEXT,
  claim_text TEXT,
  consent_external INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT,
  delete_after TEXT,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_analyses_workspace_created ON analyses(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_status ON analyses(status);

CREATE TABLE IF NOT EXISTS analysis_stages (
  id TEXT PRIMARY KEY,
  analysis_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TEXT,
  finished_at TEXT,
  attempt INTEGER NOT NULL DEFAULT 1,
  safe_error_code TEXT,
  FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_stages_analysis ON analysis_stages(analysis_id);

CREATE TABLE IF NOT EXISTS artifacts (
  id TEXT PRIMARY KEY,
  analysis_id TEXT NOT NULL,
  parent_artifact_id TEXT,
  object_key TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  media_type TEXT NOT NULL,
  kind TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  tool_version TEXT NOT NULL,
  created_at TEXT NOT NULL,
  delete_after TEXT,
  FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_artifact_id) REFERENCES artifacts(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_artifacts_analysis ON artifacts(analysis_id);

CREATE TABLE IF NOT EXISTS findings (
  id TEXT PRIMARY KEY,
  analysis_id TEXT NOT NULL,
  domain TEXT NOT NULL,
  finding_type TEXT NOT NULL,
  label TEXT NOT NULL,
  score REAL,
  calibration_ref TEXT,
  explanation TEXT NOT NULL,
  evidence_refs TEXT NOT NULL, -- JSON array of strings
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  version TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_findings_analysis ON findings(analysis_id);

CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY,
  analysis_id TEXT NOT NULL,
  url TEXT NOT NULL,
  canonical_url TEXT NOT NULL,
  publisher TEXT NOT NULL,
  title TEXT NOT NULL,
  published_at TEXT,
  updated_at TEXT,
  accessed_at TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'general',
  retrieval_metadata TEXT NOT NULL DEFAULT '{}', -- JSON
  FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sources_analysis ON sources(analysis_id);

CREATE TABLE IF NOT EXISTS citations (
  id TEXT PRIMARY KEY,
  finding_id TEXT NOT NULL,
  source_id TEXT NOT NULL,
  relation TEXT NOT NULL,
  excerpt_hash TEXT NOT NULL,
  locator TEXT,
  FOREIGN KEY (finding_id) REFERENCES findings(id) ON DELETE CASCADE,
  FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_citations_finding ON citations(finding_id);
CREATE INDEX IF NOT EXISTS idx_citations_source ON citations(source_id);

CREATE TABLE IF NOT EXISTS provider_secrets (
  id TEXT PRIMARY KEY,
  workspace_id TEXT,
  provider TEXT NOT NULL,
  label TEXT NOT NULL,
  ciphertext TEXT NOT NULL,
  nonce TEXT NOT NULL,
  wrapped_dek TEXT NOT NULL,
  kek_id TEXT NOT NULL,
  key_version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  rotated_at TEXT,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_provider_secrets_workspace ON provider_secrets(workspace_id, provider);

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  workspace_id TEXT,
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  metadata_redacted TEXT NOT NULL DEFAULT '{}', -- JSON
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_events_workspace ON audit_events(workspace_id, created_at DESC);

CREATE TABLE IF NOT EXISTS analysis_results (
  analysis_id TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS idempotency_keys (
  workspace_id TEXT NOT NULL,
  key TEXT NOT NULL,
  analysis_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (workspace_id, key),
  FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE CASCADE
);

INSERT OR IGNORE INTO users (id, auth_subject, created_at, status)
VALUES ('usr_default_admin', 'admin@truthlens.ai', '2026-11-25T00:00:00.000Z', 'active');
INSERT OR IGNORE INTO workspaces (id, name, created_at, retention_policy_days)
VALUES ('ws_default_workspace', 'Default Workspace', '2026-11-25T00:00:00.000Z', 30);
INSERT OR IGNORE INTO workspace_members (workspace_id, user_id, role, created_at)
VALUES ('ws_default_workspace', 'usr_default_admin', 'admin', '2026-11-25T00:00:00.000Z');
