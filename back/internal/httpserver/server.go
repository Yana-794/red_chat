package httpserver

import (
	"context"
	"fmt"
	"net/http"
	"path/filepath"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/redis/go-redis/v9"
	"redchat/internal/auth"
	"redchat/internal/chat"
	"redchat/internal/config"
)

func New(db *pgxpool.Pool, rdb *redis.Client, cfg config.Config) *gin.Engine {
	router := gin.New()
	_ = router.SetTrustedProxies(nil)
	router.Use(
		gin.Logger(), gin.Recovery(),
		cors.New(cors.Config{
			AllowOrigins:     cfg.AllowedOrigins,
			AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
			AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "X-CSRF-Token"},
			AllowCredentials: true,
			MaxAge:           12 * time.Hour,
		}),
		maxBodySize(17<<20),
	)

	router.Static("/uploads/avatars", filepath.Join(cfg.UploadDir, "avatars"))
	router.GET("/health", func(c *gin.Context) {
		if db.Ping(c) != nil || rdb.Ping(c).Err() != nil {
			c.JSON(503, gin.H{"status": "unavailable"})
			return
		}
		c.JSON(200, gin.H{"status": "ok"})
	})
	router.GET("/metrics", gin.WrapH(promhttp.Handler()))

	authService := auth.NewService(db)
	authHandler := auth.NewHandler(authService, cfg.AppEnv == "production")
	authHandler.SetUploadDir(cfg.UploadDir)

	hub := chat.NewHub(rdb)
	go hub.RunSubscriber(context.Background())
	chatHandler := chat.NewHandler(db, hub, cfg.UploadDir)

	cookie := "redchat_session"
	if cfg.AppEnv == "production" {
		cookie = "__Host-redchat_session"
	}
	ws := chat.NewWSHandler(authService, db, hub, cookie, cfg.AllowedOrigins)

	api := router.Group("/api")
	api.POST("/auth/register", rateLimit(rdb, "register", 8, time.Minute), authHandler.Register)
	api.POST("/auth/login", rateLimit(rdb, "login", 10, time.Minute), authHandler.Login)

	protected := api.Group("")
	protected.Use(authHandler.RequireAuth())
	{
		protected.GET("/auth/me", authHandler.Me)
		protected.POST("/auth/logout", authHandler.Logout)
		protected.PUT("/auth/profile", authHandler.UpdateProfile)
		protected.POST("/auth/avatar", authHandler.UploadAvatar)

		protected.GET("/users", chatHandler.SearchUsers)
		protected.GET("/conversations", chatHandler.ListConversations)
		protected.POST("/conversations/direct", chatHandler.CreateDirectConversation)
		protected.GET("/conversations/:conversationId/messages", chatHandler.ListMessages)
		protected.POST("/conversations/:conversationId/messages", chatHandler.CreateMessage)
		protected.POST("/conversations/:conversationId/files", chatHandler.UploadFile)
		protected.GET("/files/:id", chatHandler.DownloadFile)

		protected.PUT("/messages/:id", chatHandler.UpdateMessage)
		protected.DELETE("/messages/:id", chatHandler.DeleteMessage)
		protected.POST("/messages/:id/reactions", chatHandler.ToggleReaction)

		// Compatibility endpoints for the original public room API.
		protected.GET("/messages", chatHandler.ListPublicMessages)
		protected.POST("/messages", chatHandler.CreatePublicMessage)
	}

	router.GET("/ws", ws.Serve)
	router.NoRoute(func(c *gin.Context) {
		c.JSON(http.StatusNotFound, gin.H{"error": gin.H{"code": "NOT_FOUND", "message": "Route not found"}})
	})
	return router
}

func maxBodySize(maxBytes int64) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxBytes)
		c.Next()
	}
}

// rateLimit applies a Redis-backed fixed-window limit per client IP.
func rateLimit(rdb *redis.Client, action string, max int64, window time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := c.GetHeader("X-Real-IP")
		if ip == "" {
			ip = c.ClientIP()
		}
		key := fmt.Sprintf("rate:%s:%s", action, ip)
		count, err := rdb.Incr(c, key).Result()
		if err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{"error": gin.H{"code": "RATE_LIMIT_UNAVAILABLE", "message": "Сервис временно недоступен"}})
			c.Abort()
			return
		}
		if count == 1 {
			_ = rdb.Expire(c, key, window).Err()
		}
		if count > max {
			c.Header("Retry-After", fmt.Sprint(int(window.Seconds())))
			c.JSON(http.StatusTooManyRequests, gin.H{"error": gin.H{"code": "RATE_LIMITED", "message": "Слишком много попыток. Попробуйте позже."}})
			c.Abort()
			return
		}
		c.Next()
	}
}
