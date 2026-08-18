#!/usr/bin/env bash
set -euo pipefail

TESTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="${APP_DIR:-/app}"
if [ ! -d "${APP_DIR}/server" ]; then
  APP_DIR="$(pwd)"
fi

REWARD_DIR="/logs/verifier"
if [ ! -d "/logs" ]; then
  REWARD_DIR="${APP_DIR}/.verifier-logs"
fi
mkdir -p "${REWARD_DIR}"

HIDDEN_DEST="${APP_DIR}/server/hidden-reschedule.test.ts"
cp "${TESTS_DIR}/hidden-reschedule.test.ts" "${HIDDEN_DEST}"

cleanup() {
  rm -f "${HIDDEN_DEST}"
}
trap cleanup EXIT

cd "${APP_DIR}"

set +e
npx vitest run server/hidden-reschedule.test.ts --testTimeout=20000
STATUS=$?
set -e

if [ "${STATUS}" -eq 0 ]; then
  echo 1 > "${REWARD_DIR}/reward.txt"
  exit 0
fi

echo 0 > "${REWARD_DIR}/reward.txt"
exit 1
