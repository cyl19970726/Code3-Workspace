#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
echo "=== Code3 Payment Integration tests (spec 003) ==="
npm test
