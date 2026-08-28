-- Auth is managed by Neon Auth (neon_auth schema).
-- These tables reference neon_auth.user for ownership.

CREATE TABLE IF NOT EXISTS goals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES neon_auth."user"(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  img_url     TEXT NOT NULL,
  cols        INT NOT NULL,
  rows        INT NOT NULL,
  seed        BIGINT NOT NULL,
  start_hint  JSONB,
  tasks       JSONB NOT NULL DEFAULT '[]',
  schema_ver  INT NOT NULL DEFAULT 1,
  archived_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_active ON goals(user_id) WHERE archived_at IS NULL;

CREATE TABLE IF NOT EXISTS images (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES neon_auth."user"(id) ON DELETE CASCADE,
  data         BYTEA NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'image/jpeg',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
