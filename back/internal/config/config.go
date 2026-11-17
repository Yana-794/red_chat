package config

import (
	"os"
	"strings"
)

type Config struct {
	AppEnv, HTTPAddr, FrontendOrigin, DatabaseURL, RedisAddr, RedisPassword, UploadDir string
	AllowedOrigins                                                                     []string
}

func Load() Config {
	frontend := get("FRONTEND_ORIGIN", "http://localhost")
	originsRaw := get("ALLOWED_ORIGINS", frontend)
	origins := make([]string, 0)
	for _, value := range strings.Split(originsRaw, ",") {
		value = strings.TrimRight(strings.TrimSpace(value), "/")
		if value != "" {
			origins = append(origins, value)
		}
	}
	return Config{
		AppEnv:         get("APP_ENV", "development"),
		HTTPAddr:       get("HTTP_ADDR", ":8080"),
		FrontendOrigin: frontend,
		DatabaseURL:    get("DATABASE_URL", "postgres://redchat:change_me_local@localhost:5432/redchat?sslmode=disable"),
		RedisAddr:      get("REDIS_ADDR", "localhost:6379"),
		RedisPassword:  os.Getenv("REDIS_PASSWORD"),
		UploadDir:      get("UPLOAD_DIR", "./uploads"),
		AllowedOrigins: origins,
	}
}
func get(k, fallback string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return fallback
}
