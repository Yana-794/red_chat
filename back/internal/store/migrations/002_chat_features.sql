-- User profile images.
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT NOT NULL DEFAULT '';

-- Conversations: one public room and any number of private one-to-one dialogs.
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kind VARCHAR(16) NOT NULL CHECK (kind IN ('public', 'direct')),
    title VARCHAR(120) NOT NULL DEFAULT '',
    direct_key TEXT UNIQUE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO conversations (id, kind, title)
VALUES ('00000000-0000-0000-0000-000000000001', 'public', 'Общий чат')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE messages ADD COLUMN IF NOT EXISTS conversation_id UUID;
UPDATE messages
SET conversation_id = '00000000-0000-0000-0000-000000000001'
WHERE conversation_id IS NULL;
ALTER TABLE messages ALTER COLUMN conversation_id
SET DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE messages ALTER COLUMN conversation_id SET NOT NULL;
DO $$ BEGIN
    ALTER TABLE messages ADD CONSTRAINT fk_messages_conversation
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id_id
    ON messages(conversation_id, id DESC);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS conversation_members (
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (conversation_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_conversation_members_user ON conversation_members(user_id);

CREATE TABLE IF NOT EXISTS message_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id BIGINT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    original_name TEXT NOT NULL,
    stored_name TEXT NOT NULL,
    url TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_attachments_message ON message_attachments(message_id);

CREATE TABLE IF NOT EXISTS message_reactions (
    message_id BIGINT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emoji VARCHAR(16) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (message_id, user_id, emoji)
);
CREATE INDEX IF NOT EXISTS idx_reactions_message ON message_reactions(message_id);
