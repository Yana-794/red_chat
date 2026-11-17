package chat

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct{ db *pgxpool.Pool }

func NewRepository(db *pgxpool.Pool) *Repository { return &Repository{db: db} }

func (r *Repository) IsMember(ctx context.Context, conversationID, userID string) (bool, error) {
	var ok bool
	err := r.db.QueryRow(ctx, `SELECT EXISTS (
		SELECT 1 FROM conversations c
		WHERE c.id=$1 AND (c.kind='public' OR EXISTS (
			SELECT 1 FROM conversation_members cm WHERE cm.conversation_id=c.id AND cm.user_id=$2
		))
	)`, conversationID, userID).Scan(&ok)
	return ok, err
}

func (r *Repository) Recipients(ctx context.Context, conversationID string) ([]string, error) {
	rows, err := r.db.Query(ctx, `
		SELECT u.id::text FROM users u
		WHERE EXISTS (SELECT 1 FROM conversations c WHERE c.id=$1 AND c.kind='public')
		   OR EXISTS (SELECT 1 FROM conversation_members cm WHERE cm.conversation_id=$1 AND cm.user_id=u.id)
	`, conversationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	ids := make([]string, 0)
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, rows.Err()
}

func (r *Repository) CreateMessage(ctx context.Context, conversationID, senderID, content string) (Message, error) {
	var m Message
	err := r.db.QueryRow(ctx, `
		INSERT INTO messages(conversation_id,sender_id,content)
		VALUES($1,$2,$3)
		RETURNING id,conversation_id::text,sender_id::text,content,created_at
	`, conversationID, senderID, content).Scan(&m.ID, &m.ConversationID, &m.SenderID, &m.Content, &m.CreatedAt)
	if err != nil {
		return Message{}, err
	}
	err = r.db.QueryRow(ctx, `SELECT username,avatar_url FROM users WHERE id=$1`, senderID).Scan(&m.Username, &m.AvatarURL)
	m.Attachments = []Attachment{}
	m.Reactions = []Reaction{}
	return m, err
}

func (r *Repository) MessageByID(ctx context.Context, id int64) (Message, error) {
	var m Message
	err := r.db.QueryRow(ctx, `SELECT m.id,m.conversation_id::text,m.sender_id::text,u.username,u.avatar_url,m.content,m.created_at,m.edited_at FROM messages m JOIN users u ON u.id=m.sender_id WHERE m.id=$1`, id).Scan(&m.ID, &m.ConversationID, &m.SenderID, &m.Username, &m.AvatarURL, &m.Content, &m.CreatedAt, &m.EditedAt)
	return m, err
}

func (r *Repository) GetMessages(ctx context.Context, conversationID, userID string, limit int, beforeID int64) ([]Message, bool, error) {
	ok, err := r.IsMember(ctx, conversationID, userID)
	if err != nil {
		return nil, false, err
	}
	if !ok {
		return nil, false, pgx.ErrNoRows
	}
	rows, err := r.db.Query(ctx, `
		SELECT m.id,m.conversation_id::text,m.sender_id::text,u.username,u.avatar_url,m.content,m.created_at,m.edited_at
		FROM messages m JOIN users u ON u.id=m.sender_id
		WHERE m.conversation_id=$1 AND ($2=0 OR m.id<$2)
		ORDER BY m.id DESC LIMIT $3
	`, conversationID, beforeID, limit+1)
	if err != nil {
		return nil, false, err
	}
	defer rows.Close()
	items := make([]Message, 0, limit+1)
	for rows.Next() {
		var m Message
		if err := rows.Scan(&m.ID, &m.ConversationID, &m.SenderID, &m.Username, &m.AvatarURL, &m.Content, &m.CreatedAt, &m.EditedAt); err != nil {
			return nil, false, err
		}
		items = append(items, m)
	}
	if err := rows.Err(); err != nil {
		return nil, false, err
	}
	hasMore := len(items) > limit
	if hasMore {
		items = items[:limit]
	}
	// API returns chronological order even though the query reads newest-first.
	for i, j := 0, len(items)-1; i < j; i, j = i+1, j-1 {
		items[i], items[j] = items[j], items[i]
	}
	if len(items) == 0 {
		return items, hasMore, nil
	}
	ids := make([]int64, 0, len(items))
	for _, m := range items {
		ids = append(ids, m.ID)
	}
	if err := r.loadAttachments(ctx, items, ids); err != nil {
		return nil, false, err
	}
	if err := r.loadReactions(ctx, items, ids, userID); err != nil {
		return nil, false, err
	}
	return items, hasMore, nil
}

func (r *Repository) loadAttachments(ctx context.Context, items []Message, ids []int64) error {
	rows, err := r.db.Query(ctx, `SELECT id::text,message_id,original_name,url,mime_type,size_bytes FROM message_attachments WHERE message_id=ANY($1) ORDER BY created_at`, ids)
	if err != nil {
		return err
	}
	defer rows.Close()
	index := map[int64]int{}
	for i := range items {
		items[i].Attachments = []Attachment{}
		index[items[i].ID] = i
	}
	for rows.Next() {
		var a Attachment
		var messageID int64
		if err := rows.Scan(&a.ID, &messageID, &a.OriginalName, &a.URL, &a.MIMEType, &a.SizeBytes); err != nil {
			return err
		}
		i, ok := index[messageID]
		if ok {
			items[i].Attachments = append(items[i].Attachments, a)
		}
	}
	return rows.Err()
}

func (r *Repository) loadReactions(ctx context.Context, items []Message, ids []int64, userID string) error {
	rows, err := r.db.Query(ctx, `SELECT message_id,emoji,COUNT(*)::int,BOOL_OR(user_id=$2) FROM message_reactions WHERE message_id=ANY($1) GROUP BY message_id,emoji ORDER BY emoji`, ids, userID)
	if err != nil {
		return err
	}
	defer rows.Close()
	index := map[int64]int{}
	for i := range items {
		items[i].Reactions = []Reaction{}
		index[items[i].ID] = i
	}
	for rows.Next() {
		var id int64
		var v Reaction
		if err := rows.Scan(&id, &v.Emoji, &v.Count, &v.ReactedByMe); err != nil {
			return err
		}
		if i, ok := index[id]; ok {
			items[i].Reactions = append(items[i].Reactions, v)
		}
	}
	return rows.Err()
}

func (r *Repository) UserConversations(ctx context.Context, userID string) ([]Conversation, error) {
	rows, err := r.db.Query(ctx, `
		SELECT c.id::text,c.kind,c.title,
		       COALESCE(other.id::text,''),COALESCE(other.username,''),COALESCE(other.avatar_url,''),
		       COALESCE(last_message.content,''),COALESCE(last_message.created_at,c.created_at)
		FROM conversations c
		LEFT JOIN conversation_members mine ON mine.conversation_id=c.id AND mine.user_id=$1
		LEFT JOIN conversation_members theirs ON theirs.conversation_id=c.id AND theirs.user_id<>$1
		LEFT JOIN users other ON other.id=theirs.user_id
		LEFT JOIN LATERAL (SELECT content,created_at FROM messages WHERE conversation_id=c.id ORDER BY id DESC LIMIT 1) last_message ON true
		WHERE c.kind='public' OR mine.user_id IS NOT NULL
		ORDER BY COALESCE(last_message.created_at,c.created_at) DESC
	`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Conversation{}
	for rows.Next() {
		var c Conversation
		if err := rows.Scan(&c.ID, &c.Kind, &c.Title, &c.OtherUserID, &c.OtherUsername, &c.OtherAvatarURL, &c.LastMessage, &c.UpdatedAt); err != nil {
			return nil, err
		}
		if c.Kind == "direct" {
			c.Title = c.OtherUsername
		}
		out = append(out, c)
	}
	return out, rows.Err()
}

func (r *Repository) CreateDirect(ctx context.Context, userID, otherID string) (Conversation, error) {
	if userID == otherID {
		return Conversation{}, errors.New("cannot create a dialog with yourself")
	}
	var exists bool
	if err := r.db.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM users WHERE id=$1)`, otherID).Scan(&exists); err != nil {
		return Conversation{}, err
	}
	if !exists {
		return Conversation{}, pgx.ErrNoRows
	}
	ids := []string{userID, otherID}
	if ids[0] > ids[1] {
		ids[0], ids[1] = ids[1], ids[0]
	}
	key := ids[0] + ":" + ids[1]
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return Conversation{}, err
	}
	defer tx.Rollback(ctx)
	var id string
	err = tx.QueryRow(ctx, `INSERT INTO conversations(kind,direct_key,created_by) VALUES('direct',$1,$2) ON CONFLICT(direct_key) DO UPDATE SET direct_key=EXCLUDED.direct_key RETURNING id::text`, key, userID).Scan(&id)
	if err != nil {
		return Conversation{}, err
	}
	if _, err = tx.Exec(ctx, `INSERT INTO conversation_members(conversation_id,user_id) VALUES($1,$2),($1,$3) ON CONFLICT DO NOTHING`, id, userID, otherID); err != nil {
		return Conversation{}, err
	}
	if err = tx.Commit(ctx); err != nil {
		return Conversation{}, err
	}
	var c Conversation
	c.ID = id
	c.Kind = "direct"
	err = r.db.QueryRow(ctx, `SELECT id::text,username,avatar_url FROM users WHERE id=$1`, otherID).Scan(&c.OtherUserID, &c.OtherUsername, &c.OtherAvatarURL)
	c.Title = c.OtherUsername
	return c, err
}

func (r *Repository) SearchUsers(ctx context.Context, userID, query string) ([]UserSummary, error) {
	rows, err := r.db.Query(ctx, `SELECT id::text,username,avatar_url FROM users WHERE id<>$1 AND username ILIKE $2 ORDER BY username LIMIT 20`, userID, "%"+strings.TrimSpace(query)+"%")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []UserSummary{}
	for rows.Next() {
		var u UserSummary
		if err := rows.Scan(&u.ID, &u.Username, &u.AvatarURL); err != nil {
			return nil, err
		}
		out = append(out, u)
	}
	return out, rows.Err()
}

func (r *Repository) UpdateMessage(ctx context.Context, id int64, userID, content string) (Message, error) {
	if strings.TrimSpace(content) == "" || len([]rune(content)) > 2000 {
		return Message{}, errors.New("message must contain 1 to 2000 characters")
	}
	_, err := r.db.Exec(ctx, `UPDATE messages SET content=$1,edited_at=now() WHERE id=$2 AND sender_id=$3`, strings.TrimSpace(content), id, userID)
	if err != nil {
		return Message{}, err
	}
	return r.MessageByID(ctx, id)
}

func (r *Repository) ToggleReaction(ctx context.Context, id int64, userID, emoji string) (string, error) {
	allowed := map[string]bool{"👍": true, "❤️": true, "😂": true, "😮": true, "😢": true, "🔥": true}
	if !allowed[emoji] {
		return "", fmt.Errorf("unsupported reaction")
	}
	var conversationID string
	err := r.db.QueryRow(ctx, `SELECT conversation_id::text FROM messages WHERE id=$1`, id).Scan(&conversationID)
	if err != nil {
		return "", err
	}
	tag, err := r.db.Exec(ctx, `INSERT INTO message_reactions(message_id,user_id,emoji) VALUES($1,$2,$3) ON CONFLICT(message_id,user_id,emoji) DO NOTHING`, id, userID, emoji)
	if err != nil {
		return "", err
	}
	if tag.RowsAffected() == 0 { // Clicking the same emoji toggles it off.
		_, err = r.db.Exec(ctx, `DELETE FROM message_reactions WHERE message_id=$1 AND user_id=$2 AND emoji=$3`, id, userID, emoji)
		if err != nil {
			return "", err
		}
	}
	return conversationID, nil
}
