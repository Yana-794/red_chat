package auth

import (
	"crypto/rand"
	"encoding/hex"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
)

const ContextUser = "redchat_user"

type Handler struct {
	service   *Service
	cookie    string
	secure    bool
	uploadDir string
}

func NewHandler(s *Service, production bool) *Handler {
	name := "redchat_session"
	if production {
		name = "__Host-redchat_session"
	}
	return &Handler{service: s, cookie: name, secure: production, uploadDir: "./uploads"}
}
func (h *Handler) setCookie(c *gin.Context, token string, expires time.Time) {
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie(h.cookie, token, int(time.Until(expires).Seconds()), "/", "", h.secure, true)
}
func fail(c *gin.Context, status int, code, msg string) {
	c.JSON(status, gin.H{"error": gin.H{"code": code, "message": msg}})
}
func (h *Handler) Register(c *gin.Context) {
	var req struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if c.ShouldBindJSON(&req) != nil {
		fail(c, 400, "INVALID_REQUEST", "Проверьте данные")
		return
	}
	u, err := h.service.Register(c, req.Username, req.Password)
	if err == ErrInvalid {
		fail(c, 400, "VALIDATION_ERROR", "Имя: 3–32 символа; пароль: 12–128 символов")
		return
	}
	if err == ErrExists {
		fail(c, 409, "USERNAME_EXISTS", "Это имя уже занято")
		return
	}
	if err != nil {
		fail(c, 500, "INTERNAL_ERROR", "Внутренняя ошибка")
		return
	}
	c.JSON(201, gin.H{"user": u})
}
func (h *Handler) Login(c *gin.Context) {
	var req struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if c.ShouldBindJSON(&req) != nil {
		fail(c, 400, "INVALID_REQUEST", "Проверьте данные")
		return
	}
	u, t, csrf, exp, err := h.service.Login(c, req.Username, req.Password)
	if err != nil {
		fail(c, 401, "INVALID_CREDENTIALS", "Неверное имя пользователя или пароль")
		return
	}
	h.setCookie(c, t, exp)
	c.JSON(200, gin.H{"user": u, "csrf_token": csrf})
}
func (h *Handler) RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		token, err := c.Cookie(h.cookie)
		if err != nil {
			fail(c, 401, "UNAUTHENTICATED", "Войдите в аккаунт")
			c.Abort()
			return
		}
		session, err := h.service.Authenticate(c, token)
		if err != nil {
			fail(c, 401, "UNAUTHENTICATED", "Сессия недействительна")
			c.Abort()
			return
		}
		method := c.Request.Method
		unsafe := method != "GET" && method != "HEAD" && method != "OPTIONS"
		if unsafe && subtleEqual(c.GetHeader("X-CSRF-Token"), session.CSRF) != true {
			fail(c, 403, "CSRF_FAILED", "Проверка запроса не пройдена")
			c.Abort()
			return
		}
		c.Set(ContextUser, session.User)
		c.Set("csrf", session.CSRF)
		c.Next()
	}
}
func subtleEqual(a, b string) bool {
	if len(a) != len(b) || a == "" {
		return false
	}
	var x byte
	for i := range a {
		x |= a[i] ^ b[i]
	}
	return x == 0
}
func (h *Handler) Me(c *gin.Context) {
	u := c.MustGet(ContextUser).(User)
	c.JSON(200, gin.H{"user": u, "csrf_token": c.MustGet("csrf")})
}
func (h *Handler) Logout(c *gin.Context) {
	token, _ := c.Cookie(h.cookie)
	if err := h.service.Logout(c, token); err != nil {
		fail(c, 500, "INTERNAL_ERROR", "Не удалось завершить сессию")
		return
	}
	c.SetCookie(h.cookie, "", -1, "/", "", h.secure, true)
	c.Status(204)
}
func (h *Handler) UpdateProfile(c *gin.Context) {
	var req struct {
		Username    string `json:"username"`
		Description string `json:"description"`
	}
	if c.ShouldBindJSON(&req) != nil {
		fail(c, 400, "INVALID_REQUEST", "Некорректные данные")
		return
	}
	current := c.MustGet(ContextUser).(User)
	u, err := h.service.UpdateProfile(c, current.ID, req.Username, req.Description)
	if err == ErrInvalid {
		fail(c, 400, "VALIDATION_ERROR", "Проверьте имя и описание")
		return
	}
	if err == ErrExists {
		fail(c, 409, "USERNAME_EXISTS", "Это имя уже занято")
		return
	}
	if err != nil {
		fail(c, 500, "INTERNAL_ERROR", "Не удалось обновить профиль")
		return
	}
	c.JSON(200, gin.H{"user": u, "csrf_token": c.MustGet("csrf")})
}

// SetUploadDir points avatar uploads at the persistent uploads volume.
func (h *Handler) SetUploadDir(dir string) { h.uploadDir = dir }

func (h *Handler) UploadAvatar(c *gin.Context) {
	current := c.MustGet(ContextUser).(User)
	file, header, err := c.Request.FormFile("avatar")
	if err != nil {
		fail(c, http.StatusBadRequest, "AVATAR_REQUIRED", "Выберите изображение")
		return
	}
	defer file.Close()
	if header.Size <= 0 || header.Size > 5<<20 {
		fail(c, http.StatusRequestEntityTooLarge, "AVATAR_TOO_LARGE", "Размер аватара не должен превышать 5 МБ")
		return
	}
	sample := make([]byte, 512)
	n, _ := file.Read(sample)
	contentType := http.DetectContentType(sample[:n])
	if _, err := file.Seek(0, io.SeekStart); err != nil {
		fail(c, 400, "AVATAR_INVALID", "Не удалось прочитать изображение")
		return
	}
	extensions := map[string]string{"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif"}
	ext, ok := extensions[contentType]
	if !ok {
		fail(c, http.StatusUnsupportedMediaType, "AVATAR_TYPE_INVALID", "Поддерживаются JPG, PNG, WEBP и GIF")
		return
	}
	dir := filepath.Join(h.uploadDir, "avatars")
	if err := os.MkdirAll(dir, 0755); err != nil {
		fail(c, 500, "STORAGE_ERROR", "Хранилище файлов недоступно")
		return
	}
	random := make([]byte, 16)
	if _, err := rand.Read(random); err != nil {
		fail(c, 500, "STORAGE_ERROR", "Не удалось создать имя файла")
		return
	}
	filename := hex.EncodeToString(random) + ext
	target := filepath.Join(dir, filename)
	dst, err := os.Create(target)
	if err != nil {
		fail(c, 500, "STORAGE_ERROR", "Не удалось сохранить аватар")
		return
	}
	written, copyErr := io.Copy(dst, io.LimitReader(file, (5<<20)+1))
	closeErr := dst.Close()
	if copyErr != nil || closeErr != nil || written > 5<<20 {
		_ = os.Remove(target)
		fail(c, 500, "STORAGE_ERROR", "Не удалось сохранить аватар")
		return
	}
	avatarURL := "/uploads/avatars/" + filename
	user, err := h.service.UpdateAvatar(c, current.ID, avatarURL)
	if err != nil {
		_ = os.Remove(target)
		fail(c, 500, "DATABASE_ERROR", "Не удалось обновить профиль")
		return
	}
	c.JSON(http.StatusOK, gin.H{"user": user})
}
