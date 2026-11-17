FROM golang:1.23-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git

# Копируем весь backend до разрешения зависимостей, чтобы go mod tidy
# увидел все локальные пакеты и сформировал go.sum.
COPY . .

RUN go mod tidy
RUN go mod verify
RUN CGO_ENABLED=0 GOOS=linux go build \
    -trimpath \
    -ldflags="-s -w" \
    -o /redchat ./cmd/api

FROM alpine:3.21

RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app
COPY --from=builder /redchat /usr/local/bin/redchat

EXPOSE 8080
CMD ["redchat"]
