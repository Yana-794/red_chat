package auth

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"fmt"
	"strings"

	"golang.org/x/crypto/argon2"
)

func hashPassword(password string) (string, error) {
	salt := make([]byte, 16)
	if _, err := rand.Read(salt); err != nil {
		return "", err
	}
	hash := argon2.IDKey([]byte(password), salt, 2, 19*1024, 1, 32)
	enc := base64.RawStdEncoding
	return fmt.Sprintf("argon2id$%s$%s", enc.EncodeToString(salt), enc.EncodeToString(hash)), nil
}
func verifyPassword(password, encoded string) bool {
	p := strings.Split(encoded, "$")
	if len(p) != 3 || p[0] != "argon2id" {
		return false
	}
	enc := base64.RawStdEncoding
	salt, e1 := enc.DecodeString(p[1])
	expected, e2 := enc.DecodeString(p[2])
	if e1 != nil || e2 != nil || len(salt) != 16 || len(expected) != 32 {
		return false
	}
	actual := argon2.IDKey([]byte(password), salt, 2, 19*1024, 1, 32)
	return subtle.ConstantTimeCompare(actual, expected) == 1
}
