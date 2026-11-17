package chat

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"redchat/internal/auth"
)

const publicConversationID = "00000000-0000-0000-0000-000000000001"
const maxUploadSize = 15 << 20

type Handler struct {
	db        *pgxpool.Pool
	repo      *Repository
	hub       *Hub
	uploadDir string
}

func NewHandler(db *pgxpool.Pool, hub *Hub, uploadDir string) *Handler {
	return &Handler{db: db, repo: NewRepository(db), hub: hub, uploadDir: uploadDir}
}

func writeChatError(c *gin.Context, status int, code, message string) {
	c.JSON(status, gin.H{"error": gin.H{"code": code, "message": message}})
}

func (h *Handler) ListConversations(c *gin.Context) {
	u := c.MustGet(auth.ContextUser).(auth.User)
	items, err := h.repo.UserConversations(c, u.ID)
	if err != nil {
		writeChatError(c, 500, "INTERNAL_ERROR", "Не удалось загрузить диалоги")
		return
	}
	c.JSON(200, items)
}

func (h *Handler) CreateDirectConversation(c *gin.Context) {
	var req struct {
		UserID string `json:"user_id"`
	}
	if c.ShouldBindJSON(&req) != nil || req.UserID == "" {
		writeChatError(c, 400, "INVALID_REQUEST", "Не указан пользователь")
		return
	}
	u := c.MustGet(auth.ContextUser).(auth.User)
	conversation, err := h.repo.CreateDirect(c, u.ID, req.UserID)
	if errors.Is(err, pgx.ErrNoRows) {
		writeChatError(c, 404, "USER_NOT_FOUND", "Пользователь не найден")
		return
	}
	if err != nil {
		writeChatError(c, 400, "DIALOG_ERROR", "Не удалось создать диалог")
		return
	}
	c.JSON(201, conversation)
}

func (h *Handler) SearchUsers(c *gin.Context) {
	u := c.MustGet(auth.ContextUser).(auth.User)
	items, err := h.repo.SearchUsers(c, u.ID, c.Query("q"))
	if err != nil {
		writeChatError(c, 500, "INTERNAL_ERROR", "Не удалось найти пользователей")
		return
	}
	c.JSON(200, items)
}

func (h *Handler) ListMessages(c *gin.Context) {
	conversationID := c.Param("conversationId")
	if conversationID == "" {
		conversationID = publicConversationID
	}
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "30"))
	if limit < 1 {
		limit = 1
	}
	if limit > 100 {
		limit = 100
	}
	beforeID, _ := strconv.ParseInt(c.Query("before_id"), 10, 64)
	if beforeID < 0 {
		beforeID = 0
	}
	u := c.MustGet(auth.ContextUser).(auth.User)
	items, hasMore, err := h.repo.GetMessages(c, conversationID, u.ID, limit, beforeID)
	if errors.Is(err, pgx.ErrNoRows) {
		writeChatError(c, 404, "CONVERSATION_NOT_FOUND", "Диалог не найден")
		return
	}
	if err != nil {
		writeChatError(c, 500, "INTERNAL_ERROR", "Не удалось загрузить сообщения")
		return
	}
	var next any
	if hasMore && len(items) > 0 {
		next = items[0].ID
	}
	c.JSON(200, gin.H{"items": items, "has_more": hasMore, "next_before_id": next})
}

func (h *Handler) CreateMessage(c *gin.Context) {
	var req struct {
		Content string `json:"content"`
	}
	if c.ShouldBindJSON(&req) != nil {
		writeChatError(c, 400, "INVALID_REQUEST", "Некорректное сообщение")
		return
	}
	u := c.MustGet(auth.ContextUser).(auth.User)
	conversationID := c.Param("conversationId")
	ok, err := h.repo.IsMember(c, conversationID, u.ID)
	if err != nil || !ok {
		writeChatError(c, 404, "CONVERSATION_NOT_FOUND", "Диалог не найден")
		return
	}
	content := strings.TrimSpace(req.Content)
	if content == "" || len([]rune(content)) > 2000 {
		writeChatError(c, 400, "VALIDATION_ERROR", "Сообщение должно содержать от 1 до 2000 символов")
		return
	}
	m, err := h.repo.CreateMessage(c, conversationID, u.ID, content)
	if err != nil {
		writeChatError(c, 500, "INTERNAL_ERROR", "Не удалось отправить сообщение")
		return
	}
	h.publish(c, conversationID, gin.H{"type": "message.created", "conversation_id": conversationID, "message": m})
	c.JSON(201, m)
}

func (h *Handler) UpdateMessage(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		writeChatError(c, 400, "INVALID_ID", "Некорректный ID сообщения")
		return
	}
	u := c.MustGet(auth.ContextUser).(auth.User)
	var req struct {
		Content string `json:"content"`
	}
	if c.ShouldBindJSON(&req) != nil {
		writeChatError(c, 400, "INVALID_REQUEST", "Некорректный запрос")
		return
	}
	before, err := h.repo.MessageByID(c, id)
	if err != nil {
		writeChatError(c, 404, "MESSAGE_NOT_FOUND", "Сообщение не найдено")
		return
	}
	if before.SenderID != u.ID {
		writeChatError(c, 403, "FORBIDDEN", "Можно редактировать только свои сообщения")
		return
	}
	m, err := h.repo.UpdateMessage(c, id, u.ID, req.Content)
	if err != nil {
		writeChatError(c, 400, "VALIDATION_ERROR", err.Error())
		return
	}
	h.publish(c, m.ConversationID, gin.H{"type": "message.updated", "conversation_id": m.ConversationID, "message": m})
	c.JSON(200, m)
}

func (h *Handler) DeleteMessage(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		writeChatError(c, 400, "INVALID_ID", "Некорректный ID сообщения")
		return
	}
	u := c.MustGet(auth.ContextUser).(auth.User)
	m, err := h.repo.MessageByID(c, id)
	if err != nil {
		writeChatError(c, 404, "MESSAGE_NOT_FOUND", "Сообщение не найдено")
		return
	}
	if m.SenderID != u.ID {
		writeChatError(c, 403, "FORBIDDEN", "Можно удалять только свои сообщения")
		return
	}
	storedFiles := make([]string, 0)
	attachmentRows, rowsErr := h.db.Query(c, `SELECT stored_name FROM message_attachments WHERE message_id=$1`, id)
	if rowsErr == nil {
		for attachmentRows.Next() {
			var storedName string
			if attachmentRows.Scan(&storedName) == nil {
				storedFiles = append(storedFiles, filepath.Base(storedName))
			}
		}
		attachmentRows.Close()
	}
	if _, err := h.db.Exec(c, `DELETE FROM messages WHERE id=$1 AND sender_id=$2`, id, u.ID); err != nil {
		writeChatError(c, 500, "INTERNAL_ERROR", "Не удалось удалить сообщение")
		return
	}
	for _, storedName := range storedFiles {
		_ = os.Remove(filepath.Join(h.uploadDir, "files", storedName))
	}
	h.publish(c, m.ConversationID, gin.H{"type": "message.deleted", "conversation_id": m.ConversationID, "message_id": id})
	c.Status(http.StatusNoContent)
}

func (h *Handler) ToggleReaction(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		writeChatError(c, 400, "INVALID_ID", "Некорректный ID сообщения")
		return
	}
	u := c.MustGet(auth.ContextUser).(auth.User)
	var req struct {
		Emoji string `json:"emoji"`
	}
	if c.ShouldBindJSON(&req) != nil {
		writeChatError(c, 400, "INVALID_REQUEST", "Не указана реакция")
		return
	}
	m, err := h.repo.MessageByID(c, id)
	if err != nil {
		writeChatError(c, 404, "MESSAGE_NOT_FOUND", "Сообщение не найдено")
		return
	}
	ok, _ := h.repo.IsMember(c, m.ConversationID, u.ID)
	if !ok {
		writeChatError(c, 404, "MESSAGE_NOT_FOUND", "Сообщение не найдено")
		return
	}
	conversationID, err := h.repo.ToggleReaction(c, id, u.ID, req.Emoji)
	if err != nil {
		writeChatError(c, 400, "INVALID_REACTION", "Такая реакция не поддерживается")
		return
	}
	h.publish(c, conversationID, gin.H{"type": "reaction.updated", "conversation_id": conversationID, "message_id": id})
	c.Status(http.StatusNoContent)
}

func (h *Handler) UploadFile(c *gin.Context) {
	conversationID := c.Param("conversationId")
	u := c.MustGet(auth.ContextUser).(auth.User)
	ok, err := h.repo.IsMember(c, conversationID, u.ID)
	if err != nil || !ok {
		writeChatError(c, 404, "CONVERSATION_NOT_FOUND", "Диалог не найден")
		return
	}
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		writeChatError(c, 400, "FILE_REQUIRED", "Выберите файл")
		return
	}
	defer file.Close()
	if header.Size <= 0 || header.Size > maxUploadSize {
		writeChatError(c, 413, "FILE_TOO_LARGE", "Максимальный размер файла — 15 МБ")
		return
	}
	buffer := make([]byte, 512)
	n, _ := file.Read(buffer)
	detectedType := http.DetectContentType(buffer[:n])
	contentType, _, _ := mime.ParseMediaType(detectedType)
	if _, err := file.Seek(0, 0); err != nil {
		writeChatError(c, 400, "FILE_READ_ERROR", "Не удалось прочитать файл")
		return
	}
	if !allowedFileType(contentType) {
		writeChatError(c, 415, "UNSUPPORTED_FILE", "Этот тип файла не поддерживается")
		return
	}
	if err := os.MkdirAll(filepath.Join(h.uploadDir, "files"), 0755); err != nil {
		writeChatError(c, 500, "STORAGE_ERROR", "Хранилище файлов недоступно")
		return
	}
	ext := strings.ToLower(filepath.Ext(filepath.Base(header.Filename)))
	if len(ext) > 10 {
		ext = ""
	}
	storedName := randomFileName() + ext
	path := filepath.Join(h.uploadDir, "files", storedName)
	dst, err := os.Create(path)
	if err != nil {
		writeChatError(c, 500, "STORAGE_ERROR", "Не удалось сохранить файл")
		return
	}
	written, copyErr := copyWithLimit(dst, file, maxUploadSize)
	closeErr := dst.Close()
	if copyErr != nil || closeErr != nil || written > maxUploadSize {
		_ = os.Remove(path)
		writeChatError(c, 500, "STORAGE_ERROR", "Не удалось сохранить файл")
		return
	}
	m, err := h.repo.CreateMessage(c, conversationID, u.ID, "")
	if err != nil {
		_ = os.Remove(path)
		writeChatError(c, 500, "DATABASE_ERROR", "Не удалось сохранить вложение")
		return
	}
	var attachment Attachment
	err = h.db.QueryRow(c, `INSERT INTO message_attachments(message_id,original_name,stored_name,url,mime_type,size_bytes) VALUES($1,$2,$3,'',$4,$5) RETURNING id::text,original_name,url,mime_type,size_bytes`, m.ID, filepath.Base(header.Filename), storedName, contentType, written).Scan(&attachment.ID, &attachment.OriginalName, &attachment.URL, &attachment.MIMEType, &attachment.SizeBytes)
	if err != nil {
		_ = os.Remove(path)
		_, _ = h.db.Exec(c, `DELETE FROM messages WHERE id=$1`, m.ID)
		writeChatError(c, 500, "DATABASE_ERROR", "Не удалось сохранить вложение")
		return
	}
	attachment.URL = "/api/files/" + attachment.ID
	if _, err := h.db.Exec(c, `UPDATE message_attachments SET url=$1 WHERE id=$2`, attachment.URL, attachment.ID); err != nil {
		_ = os.Remove(path)
		_, _ = h.db.Exec(c, `DELETE FROM messages WHERE id=$1`, m.ID)
		writeChatError(c, 500, "DATABASE_ERROR", "Не удалось сохранить ссылку на вложение")
		return
	}
	m.Attachments = []Attachment{attachment}
	h.publish(c, conversationID, gin.H{"type": "message.created", "conversation_id": conversationID, "message": m})
	c.JSON(201, m)
}

func allowedFileType(mimeType string) bool {
	allowed := map[string]bool{"image/jpeg": true, "image/png": true, "image/webp": true, "image/gif": true, "application/pdf": true, "text/plain": true, "text/csv": true, "application/zip": true, "application/vnd.openxmlformats-officedocument.wordprocessingml.document": true, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": true, "application/msword": true, "application/vnd.ms-excel": true}
	return allowed[mimeType]
}

func randomFileName() string {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return fmt.Sprintf("upload-%d", os.Getpid())
	}
	return hex.EncodeToString(b)
}

func copyWithLimit(dst *os.File, src io.Reader, max int64) (int64, error) {
	return io.Copy(dst, io.LimitReader(src, max+1))
}

func (h *Handler) publish(c *gin.Context, conversationID string, payload any) {
	recipients, err := h.repo.Recipients(c, conversationID)
	if err != nil {
		return
	}
	if err := h.hub.Publish(c, recipients, payload); err != nil { // event persistence is already committed; log for operators.
		fmt.Printf("redis event publish failed: %v\n", err)
	}
}

// Public-room aliases keep compatibility with the first version of RedChat API.
func (h *Handler) ListPublicMessages(c *gin.Context) {
	c.Params = append(c.Params, gin.Param{Key: "conversationId", Value: publicConversationID})
	h.ListMessages(c)
}
func (h *Handler) CreatePublicMessage(c *gin.Context) {
	c.Params = append(c.Params, gin.Param{Key: "conversationId", Value: publicConversationID})
	h.CreateMessage(c)
}

func (h *Handler) DownloadFile(c *gin.Context) {
	attachmentID := c.Param("id")
	var storedName, originalName, conversationID string
	err := h.db.QueryRow(c, `SELECT a.stored_name,a.original_name,m.conversation_id::text FROM message_attachments a JOIN messages m ON m.id=a.message_id WHERE a.id=$1`, attachmentID).Scan(&storedName, &originalName, &conversationID)
	if err != nil {
		writeChatError(c, http.StatusNotFound, "FILE_NOT_FOUND", "Файл не найден")
		return
	}
	u := c.MustGet(auth.ContextUser).(auth.User)
	ok, err := h.repo.IsMember(c, conversationID, u.ID)
	if err != nil || !ok {
		writeChatError(c, http.StatusNotFound, "FILE_NOT_FOUND", "Файл не найден")
		return
	}
	name := filepath.Base(originalName)
	name = strings.Map(func(r rune) rune {
		if r < 32 || r == 127 {
			return -1
		}
		return r
	}, name)
	if name == "." || name == "" {
		name = filepath.Base(storedName)
	}
	c.Header("X-Content-Type-Options", "nosniff")
	c.Header("Cache-Control", "private, no-store")
	c.FileAttachment(filepath.Join(h.uploadDir, "files", filepath.Base(storedName)), name)
}
