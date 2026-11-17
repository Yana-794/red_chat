package main

import (
	"context"
	"log"
	"time"

	"redchat/internal/config"
	"redchat/internal/httpserver"
	"redchat/internal/store"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

func main() {
	cfg := config.Load()
	if cfg.AppEnv == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()

	pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatal("postgres connection config: ", err)
	}
	defer pool.Close()
	if err := pool.Ping(ctx); err != nil {
		log.Fatal("postgres ping: ", err)
	}
	if err := store.Migrate(ctx, pool); err != nil {
		log.Fatal("migrations: ", err)
	}

	rdb := redis.NewClient(&redis.Options{Addr: cfg.RedisAddr, Password: cfg.RedisPassword})
	defer rdb.Close()
	if err := rdb.Ping(ctx).Err(); err != nil {
		log.Fatal("redis ping: ", err)
	}

	server := httpserver.New(pool, rdb, cfg)
	if err := server.Run(cfg.HTTPAddr); err != nil {
		log.Fatal(err)
	}
}
