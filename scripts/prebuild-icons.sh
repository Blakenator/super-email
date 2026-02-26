#!/bin/sh
# Icon generation for EAS Build (called via eas-build-post-install hook).
# Uses APP_VARIANT env var (set in eas.json) to determine dev vs prod icons.

cd "$(dirname "$0")/.." || exit 1

if [ "$APP_VARIANT" = "development" ]; then
  exec pnpm run icons:generate -- --dev
else
  exec pnpm run icons:generate
fi
