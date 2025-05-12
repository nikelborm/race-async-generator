#!/usr/bin/env bash
set -euo pipefail

command -v rimraf >/dev/null 2>&1 || {
  echo "rimraf is required but not installed."
  exit 1
}
command -v tsc >/dev/null 2>&1 || {
  echo "tsc is required but not installed."
  exit 1
}

command -v jq >/dev/null 2>&1 || {
  echo "jq is required but not installed."
  exit 1
}

rimraf dist
tsc
