package chat

import (
	"context"
	"encoding/json"
	"log"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/redis/go-redis/v9"
)

const eventsChannel = "redchat:chat:events"

type eventEnvelope struct {
	Recipients []string        `json:"recipients"`
	Payload    json.RawMessage `json:"payload"`
}

// Hub keeps only local websocket connections. Cross-instance delivery is done by Redis Pub/Sub.
type Hub struct {
	mu      sync.RWMutex
	writeMu sync.Mutex
	clients map[*websocket.Conn]string // connection -> authenticated user ID
	rdb     *redis.Client
}

func NewHub(rdb *redis.Client) *Hub {
	return &Hub{clients: make(map[*websocket.Conn]string), rdb: rdb}
}

func (h *Hub) Add(conn *websocket.Conn, userID string) {
	h.mu.Lock()
	h.clients[conn] = userID
	h.mu.Unlock()
}

func (h *Hub) Remove(conn *websocket.Conn) {
	h.mu.Lock()
	delete(h.clients, conn)
	h.mu.Unlock()
}

// Publish sends an event through Redis so every backend replica can deliver it to its local clients.
func (h *Hub) Publish(ctx context.Context, recipients []string, payload any) error {
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	envelope, err := json.Marshal(eventEnvelope{Recipients: recipients, Payload: body})
	if err != nil {
		return err
	}
	if err := h.rdb.Publish(ctx, eventsChannel, envelope).Err(); err != nil {
		// Keep the current instance functional during a temporary Redis outage.
		// Other replicas will not receive this event until Redis is healthy again.
		h.broadcast(eventEnvelope{Recipients: recipients, Payload: body})
		return err
	}
	return nil
}

func (h *Hub) RunSubscriber(ctx context.Context) {
	for {
		if ctx.Err() != nil {
			return
		}
		pubsub := h.rdb.Subscribe(ctx, eventsChannel)
		if _, err := pubsub.Receive(ctx); err != nil {
			_ = pubsub.Close()
			log.Printf("redis pubsub subscribe: %v", err)
			if !waitForRetry(ctx) {
				return
			}
			continue
		}
		channel := pubsub.Channel()
		connected := true
		for connected {
			select {
			case <-ctx.Done():
				_ = pubsub.Close()
				return
			case msg, ok := <-channel:
				if !ok {
					connected = false
					continue
				}
				var envelope eventEnvelope
				if err := json.Unmarshal([]byte(msg.Payload), &envelope); err != nil {
					log.Printf("redis pubsub invalid event: %v", err)
					continue
				}
				h.broadcast(envelope)
			}
		}
		_ = pubsub.Close()
		if !waitForRetry(ctx) {
			return
		}
	}
}

func waitForRetry(ctx context.Context) bool {
	timer := time.NewTimer(time.Second)
	defer timer.Stop()
	select {
	case <-ctx.Done():
		return false
	case <-timer.C:
		return true
	}
}

func (h *Hub) broadcast(envelope eventEnvelope) {
	// Gorilla WebSocket permits one concurrent writer per connection.
	h.writeMu.Lock()
	defer h.writeMu.Unlock()
	allowed := make(map[string]struct{}, len(envelope.Recipients))
	for _, id := range envelope.Recipients {
		allowed[id] = struct{}{}
	}
	h.mu.RLock()
	defer h.mu.RUnlock()
	for conn, userID := range h.clients {
		if _, ok := allowed[userID]; !ok {
			continue
		}
		_ = conn.SetWriteDeadline(timeNowPlusWriteTimeout())
		if err := conn.WriteMessage(websocket.TextMessage, envelope.Payload); err != nil {
			log.Printf("websocket write: %v", err)
		}
	}
}
