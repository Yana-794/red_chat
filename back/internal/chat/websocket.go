package chat

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/jackc/pgx/v5/pgxpool"
	"redchat/internal/auth"
)

type WSHandler struct {
	auth    *auth.Service
	repo    *Repository
	hub     *Hub
	cookie  string
	origins map[string]struct{}
}

func NewWSHandler(a *auth.Service, db *pgxpool.Pool, hub *Hub, cookie string, allowedOrigins []string) *WSHandler {
	origins := make(map[string]struct{}, len(allowedOrigins))
	for _, origin := range allowedOrigins {
		origin = strings.TrimRight(strings.TrimSpace(origin), "/")
		if origin != "" {
			origins[origin] = struct{}{}
		}
	}
	return &WSHandler{auth: a, repo: NewRepository(db), hub: hub, cookie: cookie, origins: origins}
}

func (w *WSHandler) Serve(c *gin.Context) {
	origin := strings.TrimRight(strings.TrimSpace(c.GetHeader("Origin")), "/")
	if _, allowed := w.origins[origin]; !allowed {
		c.JSON(http.StatusForbidden, gin.H{"error": gin.H{"code": "ORIGIN_NOT_ALLOWED", "message": "WebSocket origin is not allowed"}})
		return
	}
	token, err := c.Cookie(w.cookie)
	if err != nil {
		c.Status(http.StatusUnauthorized)
		return
	}
	session, err := w.auth.Authenticate(c, token)
	if err != nil {
		c.Status(http.StatusUnauthorized)
		return
	}

	upgrader := websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 4096,
		CheckOrigin: func(r *http.Request) bool {
			requestOrigin := strings.TrimRight(strings.TrimSpace(r.Header.Get("Origin")), "/")
			_, ok := w.origins[requestOrigin]
			return ok
		},
	}
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}
	w.hub.Add(conn, session.User.ID)
	defer func() { w.hub.Remove(conn); _ = conn.Close() }()
	conn.SetReadLimit(8 << 10)

	for {
		_, raw, err := conn.ReadMessage()
		if err != nil {
			return
		}
		var req struct {
			Type           string `json:"type"`
			ConversationID string `json:"conversation_id"`
			Content        string `json:"content"`
		}
		if json.Unmarshal(raw, &req) != nil || req.Type != "message" {
			continue
		}
		content := strings.TrimSpace(req.Content)
		if content == "" || len([]rune(content)) > 2000 || req.ConversationID == "" {
			continue
		}
		ok, err := w.repo.IsMember(c.Request.Context(), req.ConversationID, session.User.ID)
		if err != nil || !ok {
			continue
		}
		m, err := w.repo.CreateMessage(c.Request.Context(), req.ConversationID, session.User.ID, content)
		if err != nil {
			continue
		}
		recipients, err := w.repo.Recipients(c.Request.Context(), req.ConversationID)
		if err != nil {
			continue
		}
		_ = w.hub.Publish(c.Request.Context(), recipients, gin.H{"type": "message.created", "conversation_id": req.ConversationID, "message": m})
	}
}
