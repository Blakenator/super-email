#!/bin/bash
# =============================================================================
# SuperMail Mobile Build Script
# =============================================================================
# Builds the mobile app for iOS and/or Android
#
# Usage:
#   ./scripts/build-mobile.sh [platform] [profile]
#
# Arguments:
#   platform: ios, android, or all (default: all)
#   profile: development, preview, or production (default: preview)
#
# Examples:
#   ./scripts/build-mobile.sh                    # Build all platforms, preview
#   ./scripts/build-mobile.sh ios                # Build iOS only, preview
#   ./scripts/build-mobile.sh android production # Build Android, production
#   ./scripts/build-mobile.sh all production     # Build all, production
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
PLATFORM="${1:-all}"
PROFILE="${2:-preview}"

# Project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MOBILE_DIR="$PROJECT_ROOT/mobile"

# Print header
echo -e "${BLUE}=============================================${NC}"
echo -e "${BLUE}  SuperMail Mobile Build${NC}"
echo -e "${BLUE}=============================================${NC}"
echo ""
echo -e "Platform: ${GREEN}$PLATFORM${NC}"
echo -e "Profile:  ${GREEN}$PROFILE${NC}"
echo ""

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo -e "${YELLOW}EAS CLI not found. Installing...${NC}"
    pnpm add -g eas-cli
fi

# Check if logged in to EAS
if ! eas whoami &> /dev/null; then
    echo -e "${YELLOW}Not logged in to EAS. Please login:${NC}"
    eas login
fi

# Navigate to mobile directory
cd "$MOBILE_DIR"

# Install dependencies
echo -e "${BLUE}Installing dependencies...${NC}"
pnpm install

# Run type check
echo -e "${BLUE}Running type check...${NC}"
pnpm run typecheck || {
    echo -e "${RED}Type check failed. Please fix errors before building.${NC}"
    exit 1
}

# Build based on platform
case $PLATFORM in
    ios)
        echo -e "${BLUE}Building iOS ($PROFILE)...${NC}"
        eas build --platform ios --profile "$PROFILE" --non-interactive
        ;;
    android)
        echo -e "${BLUE}Building Android ($PROFILE)...${NC}"
        eas build --platform android --profile "$PROFILE" --non-interactive
        ;;
    all)
        echo -e "${BLUE}Building all platforms ($PROFILE)...${NC}"
        eas build --platform all --profile "$PROFILE" --non-interactive
        ;;
    *)
        echo -e "${RED}Invalid platform: $PLATFORM${NC}"
        echo "Valid options: ios, android, all"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}=============================================${NC}"
echo -e "${GREEN}  Build started successfully!${NC}"
echo -e "${GREEN}=============================================${NC}"
echo ""
echo "Check build status at: https://expo.dev/accounts/[your-account]/projects/supermail/builds"
echo ""
