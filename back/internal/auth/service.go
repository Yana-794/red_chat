package auth

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	ErrInvalid      = errors.New("invalid input")
	ErrCredentials  = errors.New("invalid credentials")
	ErrExists       = errors.New("username already exists")
	ErrUnauthorized = errors.New("unauthorized")
)

type User struct {
	ID          string    `json:"id"`
	Username    string    `json:"username"`
	Description string    `json:"description"`
	AvatarURL   string    `json:"avatar_url"`
	CreatedAt   time.Time `json:"created_at"`
}
type Session struct {
	User    User
	CSRF    string
	Expires time.Time
}
type Service struct{ db *pgxpool.Pool }

func NewService(db *pgxpool.Pool) *Service { return &Service{db: db} }

func (s *Service) Register(ctx context.Context, username, password string) (User, error) {
	username = strings.TrimSpace(username)
	if n := utf8.RuneCountInString(username); n < 3 || n > 32 || len(password) < 12 || len(password) > 128 {
		return User{}, ErrInvalid
	}
	for _, r := range username {
		if !(r == '_' || r == '-' || r == '.' || r >= '0' && r <= '9' || r >= 'a' && r <= 'z' || r >= 'A' && r <= 'Z') {
			return User{}, ErrInvalid
		}
	}
	hash, err := hashPassword(password)
	if err != nil {
		return User{}, err
	}
	var u User
	err = s.db.QueryRow(ctx, `INSERT INTO users(username,password_hash) VALUES($1,$2) RETURNING id::text,username,description,avatar_url,created_at`, username, hash).Scan(&u.ID, &u.Username, &u.Description, &u.AvatarURL, &u.CreatedAt)
	if err != nil {
		if strings.Contains(err.Error(), "users_username_key") {
			return User{}, ErrExists
		}
		return User{}, err
	}
	return u, nil
}
func (s *Service) Login(ctx context.Context, username, password string) (User, string, string, time.Time, error) {
	var u User
	var hash string
	err := s.db.QueryRow(ctx, `SELECT id::text,username,description,avatar_url,created_at,password_hash FROM users WHERE lower(username)=lower($1)`, strings.TrimSpace(username)).Scan(&u.ID, &u.Username, &u.Description, &u.AvatarURL, &u.CreatedAt, &hash)
	if err != nil || !verifyPassword(password, hash) {
		return User{}, "", "", time.Time{}, ErrCredentials
	}
	raw := make([]byte, 32)
	csrf := make([]byte, 32)
	if _, err = rand.Read(raw); err != nil {
		return User{}, "", "", time.Time{}, err
	}
	if _, err = rand.Read(csrf); err != nil {
		return User{}, "", "", time.Time{}, err
	}
	token := base64.RawURLEncoding.EncodeToString(raw)
	csrfToken := base64.RawURLEncoding.EncodeToString(csrf)
	sum := sha256.Sum256([]byte(token))
	expires := time.Now().UTC().Add(7 * 24 * time.Hour)
	_, err = s.db.Exec(ctx, `INSERT INTO auth_sessions(user_id,token_hash,csrf_token,expires_at) VALUES($1,$2,$3,$4)`, u.ID, sum[:], csrf, expires)
	return u, token, csrfToken, expires, err
}
func (s *Service) Authenticate(ctx context.Context, token string) (Session, error) {
	if token == "" {
		return Session{}, ErrUnauthorized
	}
	sum := sha256.Sum256([]byte(token))
	var u User
	var csrf []byte
	var expires time.Time
	err := s.db.QueryRow(ctx, `SELECT u.id::text,u.username,u.description,u.avatar_url,u.created_at,s.csrf_token,s.expires_at FROM auth_sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.revoked_at IS NULL AND s.expires_at>now()`, sum[:]).Scan(&u.ID, &u.Username, &u.Description, &u.AvatarURL, &u.CreatedAt, &csrf, &expires)
	if errors.Is(err, pgx.ErrNoRows) {
		return Session{}, ErrUnauthorized
	}
	if err != nil {
		return Session{}, err
	}
	return Session{User: u, CSRF: base64.RawURLEncoding.EncodeToString(csrf), Expires: expires}, nil
}
func (s *Service) Logout(ctx context.Context, token string) error {
	sum := sha256.Sum256([]byte(token))
	_, err := s.db.Exec(ctx, `UPDATE auth_sessions SET revoked_at=now() WHERE token_hash=$1 AND revoked_at IS NULL`, sum[:])
	return err
}
func (s *Service) UpdateProfile(ctx context.Context, id, username, description string) (User, error) {
	username = strings.TrimSpace(username)
	description = strings.TrimSpace(description)
	if n := utf8.RuneCountInString(username); n < 3 || n > 32 {
		return User{}, ErrInvalid
	}
	if utf8.RuneCountInString(description) > 500 {
		return User{}, ErrInvalid
	}
	var u User
	err := s.db.QueryRow(ctx, `UPDATE users SET username=$1,description=$2,updated_at=now() WHERE id=$3 RETURNING id::text,username,description,avatar_url,created_at`, username, description, id).Scan(&u.ID, &u.Username, &u.Description, &u.AvatarURL, &u.CreatedAt)
	if err != nil && strings.Contains(err.Error(), "users_username_key") {
		return User{}, ErrExists
	}
	return u, err
}

func (s *Service) UpdateAvatar(ctx context.Context, id, avatarURL string) (User, error) {
	var u User
	err := s.db.QueryRow(ctx, `UPDATE users SET avatar_url=$1,updated_at=now() WHERE id=$2 RETURNING id::text,username,description,avatar_url,created_at`, avatarURL, id).Scan(&u.ID, &u.Username, &u.Description, &u.AvatarURL, &u.CreatedAt)
	return u, err
}
