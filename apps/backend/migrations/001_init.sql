CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
  CREATE TYPE lead_status AS ENUM ('hot', 'warm', 'cold', 'closed', 'lost');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE email_direction AS ENUM ('inbound', 'outbound');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE email_intent AS ENUM ('pricing', 'interested', 'not_interested', 'confused', 'general');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE followup_status AS ENUM ('scheduled', 'queued', 'sent', 'failed', 'cancelled', 'skipped');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS google_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  google_sub TEXT UNIQUE,
  access_token_enc TEXT NOT NULL,
  refresh_token_enc TEXT,
  scope TEXT,
  token_type TEXT,
  expiry_date TIMESTAMPTZ,
  watch_history_id TEXT,
  watch_expiration TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  notes TEXT,
  lead_status lead_status NOT NULL DEFAULT 'warm',
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, email)
);

CREATE TABLE IF NOT EXISTS emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  gmail_message_id TEXT NOT NULL,
  gmail_thread_id TEXT NOT NULL,
  direction email_direction NOT NULL,
  from_email TEXT NOT NULL,
  to_emails TEXT[] NOT NULL DEFAULT '{}',
  subject TEXT NOT NULL,
  body_text TEXT NOT NULL DEFAULT '',
  body_html TEXT,
  snippet TEXT,
  intent email_intent,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, gmail_message_id)
);

CREATE TABLE IF NOT EXISTS followups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  email_id UUID REFERENCES emails(id) ON DELETE SET NULL,
  day_number INTEGER NOT NULL CHECK (day_number IN (1, 3, 5, 7)),
  status followup_status NOT NULL DEFAULT 'scheduled',
  job_id TEXT,
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_id UUID REFERENCES emails(id) ON DELETE CASCADE,
  intent email_intent,
  confidence NUMERIC(4,3),
  summary TEXT,
  reply TEXT,
  model TEXT NOT NULL,
  prompt_version TEXT NOT NULL DEFAULT 'v1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clients_user_status ON clients(user_id, lead_status) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_emails_user_thread ON emails(user_id, gmail_thread_id);
CREATE INDEX IF NOT EXISTS idx_emails_user_client ON emails(user_id, client_id);
CREATE INDEX IF NOT EXISTS idx_followups_user_status ON followups(user_id, status, scheduled_for);
