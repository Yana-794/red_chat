package chat

import "time"

type Attachment struct {
	ID           string `json:"id"`
	OriginalName string `json:"original_name"`
	URL          string `json:"url"`
	MIMEType     string `json:"mime_type"`
	SizeBytes    int64  `json:"size_bytes"`
}

type Reaction struct {
	Emoji       string `json:"emoji"`
	Count       int    `json:"count"`
	ReactedByMe bool   `json:"reacted_by_me"`
}

type Message struct {
	ID             int64        `json:"id"`
	ConversationID string       `json:"conversation_id"`
	SenderID       string       `json:"sender_id"`
	Username       string       `json:"username"`
	AvatarURL      string       `json:"avatar_url"`
	Content        string       `json:"content"`
	CreatedAt      time.Time    `json:"created_at"`
	EditedAt       *time.Time   `json:"edited_at,omitempty"`
	Attachments    []Attachment `json:"attachments"`
	Reactions      []Reaction   `json:"reactions"`
}

type Conversation struct {
	ID             string    `json:"id"`
	Kind           string    `json:"kind"`
	Title          string    `json:"title"`
	OtherUserID    string    `json:"other_user_id,omitempty"`
	OtherUsername  string    `json:"other_username,omitempty"`
	OtherAvatarURL string    `json:"other_avatar_url,omitempty"`
	LastMessage    string    `json:"last_message,omitempty"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type UserSummary struct {
	ID        string `json:"id"`
	Username  string `json:"username"`
	AvatarURL string `json:"avatar_url"`
}
