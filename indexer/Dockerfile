# Bootnode Indexer - Multi-chain blockchain indexer
# Based on github.com/luxfi/indexer

FROM golang:1.22-alpine AS builder

WORKDIR /build

# Install dependencies
RUN apk add --no-cache git make gcc musl-dev

# Copy indexer source (forked from lux/indexer)
COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Build the indexer
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /indexer ./cmd/multichain

# Final image
FROM alpine:3.19

RUN apk add --no-cache ca-certificates curl

WORKDIR /app

COPY --from=builder /indexer /app/indexer
COPY config/chains.yaml /app/config/chains.yaml

# Create non-root user
RUN adduser -D -u 1000 indexer
RUN chown -R indexer:indexer /app
USER indexer

EXPOSE 5000 9090

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

ENTRYPOINT ["/app/indexer"]
CMD ["--config", "/app/config/chains.yaml"]
