#!/usr/bin/env bash
set -euo pipefail

SOLUTION_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="${APP_DIR:-/app}"
if [ ! -f "${APP_DIR}/server/routes/patient.ts" ]; then
  APP_DIR="$(pwd)"
fi

cp "${SOLUTION_DIR}/patient.ts" "${APP_DIR}/server/routes/patient.ts"
cp "${SOLUTION_DIR}/BookingFlow.tsx" "${APP_DIR}/src/pages/patient/BookingFlow.tsx"
