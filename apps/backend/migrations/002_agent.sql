-- Track when an email was enqueued for AI processing (used for deduplication)
ALTER TABLE emails ADD COLUMN IF NOT EXISTS ai_queued_at TIMESTAMPTZ;

-- Draft lifecycle tracking on AI-generated replies
DO $$ BEGIN
  ALTER TABLE ai_generations ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft';
  ALTER TABLE ai_generations ADD CONSTRAINT ai_generations_status_check
    CHECK (status IN ('draft', 'approved', 'rejected', 'sent'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE INDEX IF NOT EXISTS idx_emails_ai_queued ON emails(user_id, ai_queued_at) WHERE ai_queued_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ai_generations_email_status ON ai_generations(email_id, status);
