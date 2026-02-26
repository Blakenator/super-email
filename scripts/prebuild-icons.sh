#!/bin/sh
# Wrapper for EAS Build prebuildCommand.
# EAS appends flags like --platform and may prefix with pnpm expo,
# which causes pnpm to choke on unrecognized options. This script
# isolates the pnpm invocation from those extra arguments.

cd "$(dirname "$0")/.." || exit 1

DEV_FLAG=""
for arg in "$@"; do
  [ "$arg" = "--dev" ] && DEV_FLAG="-- --dev"
done

exec pnpm run icons:generate $DEV_FLAG
