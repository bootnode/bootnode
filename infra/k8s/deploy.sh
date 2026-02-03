#!/bin/bash
# Bootnode K8s Deployment Script
# Deploys Bootnode to DOKS (DigitalOcean Kubernetes) using shared Hanzo infrastructure

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}[DEPLOY]${NC} $1"; }
info() { echo -e "${BLUE}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# Configuration
NAMESPACE="bootnode"
SHARED_NAMESPACE="hanzo"
CLUSTER_NAME="${K8S_CLUSTER_NAME:-do-sfo3-hanzo-k8s}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check prerequisites
check_prereqs() {
    log "Checking prerequisites..."

    command -v kubectl >/dev/null 2>&1 || error "kubectl not installed"
    command -v envsubst >/dev/null 2>&1 || error "envsubst not installed (gettext)"

    # Check if we have k8s context
    kubectl cluster-info >/dev/null 2>&1 || {
        warn "No kubectl context. Attempting to get kubeconfig from DOKS..."
        command -v doctl >/dev/null 2>&1 || error "doctl not installed"
        doctl kubernetes cluster kubeconfig save "$CLUSTER_NAME" || error "Failed to get kubeconfig"
    }

    # Check for required env vars
    if [ -z "${POSTGRES_PASSWORD:-}" ] || [ -z "${DATASTORE_PASSWORD:-}" ]; then
        warn "POSTGRES_PASSWORD and DATASTORE_PASSWORD not set. Using defaults for dev."
        export POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-hanzo-pg-secret}"
        export DATASTORE_PASSWORD="${DATASTORE_PASSWORD:-hanzo-ds-secret}"
    fi

    if [ -z "${JWT_SECRET:-}" ]; then
        export JWT_SECRET="${JWT_SECRET:-$(openssl rand -hex 32)}"
    fi

    if [ -z "${API_KEY_SALT:-}" ]; then
        export API_KEY_SALT="${API_KEY_SALT:-$(openssl rand -hex 32)}"
    fi

    log "Prerequisites OK"
}

# Deploy shared infrastructure (postgres, datastore in hanzo namespace)
deploy_shared() {
    log "Deploying shared infrastructure to namespace: $SHARED_NAMESPACE"

    cd "$SCRIPT_DIR"

    # Check if postgres already exists
    if kubectl get statefulset postgres -n "$SHARED_NAMESPACE" >/dev/null 2>&1; then
        info "PostgreSQL already deployed in $SHARED_NAMESPACE"
    else
        log "Deploying PostgreSQL..."
        envsubst < shared/postgres.yaml | kubectl apply -f -
        kubectl rollout status statefulset/postgres -n "$SHARED_NAMESPACE" --timeout=300s
    fi

    # Check if datastore already exists
    if kubectl get statefulset datastore -n "$SHARED_NAMESPACE" >/dev/null 2>&1; then
        info "Datastore already deployed in $SHARED_NAMESPACE"
    else
        log "Deploying Datastore..."
        envsubst < shared/datastore.yaml | kubectl apply -f -
        kubectl rollout status statefulset/datastore -n "$SHARED_NAMESPACE" --timeout=300s
    fi

    log "Shared infrastructure ready"
}

# Deploy bootnode
deploy() {
    log "Deploying Bootnode to namespace: $NAMESPACE"

    cd "$SCRIPT_DIR"

    # Create namespace
    log "Creating namespace..."
    kubectl apply -f namespace.yaml

    # Apply secrets with envsubst
    log "Applying secrets..."
    envsubst < secrets.yaml | kubectl apply -f -

    # Deploy API
    log "Deploying API..."
    kubectl apply -f api-deployment.yaml

    # Deploy Web
    log "Deploying Web..."
    kubectl apply -f web-deployment.yaml

    # Apply ingress
    log "Applying ingress..."
    kubectl apply -f ingress.yaml

    # Wait for rollout
    log "Waiting for API deployment..."
    kubectl rollout status deployment/bootnode-api -n "$NAMESPACE" --timeout=300s

    log "Waiting for Web deployment..."
    kubectl rollout status deployment/bootnode-web -n "$NAMESPACE" --timeout=300s

    log "Deployment complete!"
}

# Show status
status() {
    log "Bootnode Status:"
    echo ""
    kubectl get pods -n "$NAMESPACE"
    echo ""
    kubectl get svc -n "$NAMESPACE"
    echo ""
    kubectl get ingress -n "$NAMESPACE"
}

# Rollback
rollback() {
    log "Rolling back Bootnode deployments..."
    kubectl rollout undo deployment/bootnode-api -n "$NAMESPACE"
    kubectl rollout undo deployment/bootnode-web -n "$NAMESPACE"
    log "Rollback complete"
}

# Print usage
usage() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  all      - Deploy shared infra + Bootnode (full stack)"
    echo "  deploy   - Deploy Bootnode only (uses existing shared infra)"
    echo "  shared   - Deploy shared infrastructure only"
    echo "  status   - Show deployment status"
    echo "  rollback - Rollback to previous version"
    echo "  help     - Show this help"
    echo ""
    echo "Environment Variables:"
    echo "  POSTGRES_PASSWORD  - PostgreSQL password"
    echo "  DATASTORE_PASSWORD - Datastore/ClickHouse password"
    echo "  JWT_SECRET         - JWT signing secret"
    echo "  API_KEY_SALT       - API key hashing salt"
    echo ""
    echo "Example:"
    echo "  export POSTGRES_PASSWORD=my-secure-password"
    echo "  $0 all"
}

# Main
main() {
    case "${1:-deploy}" in
        all)
            check_prereqs
            deploy_shared
            deploy
            status
            ;;
        deploy)
            check_prereqs
            deploy
            status
            ;;
        shared)
            check_prereqs
            deploy_shared
            ;;
        status)
            status
            ;;
        rollback)
            rollback
            ;;
        help|--help|-h)
            usage
            ;;
        *)
            error "Unknown command: $1"
            ;;
    esac
}

main "$@"
