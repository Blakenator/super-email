#!/bin/bash
# ============================================================================
# Common Deployment Functions
# ============================================================================
# Shared functions used by both deploy.sh and GitHub Actions workflow
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Export functions for use in other scripts
export -f log_info
export -f log_warn
export -f log_error
