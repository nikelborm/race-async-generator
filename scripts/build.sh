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
command -v rollup >/dev/null 2>&1 || {
  echo "rollup is required but not installed."
  exit 1
}

command -v jq >/dev/null 2>&1 || {
  echo "jq is required but not installed."
  exit 1
}

rimraf dist gh-page/bundled_deps
tsc
mkdir -p ./dist/minified
rollup -c ./rollup.config.js
cli_name=$(jq -r '.name' package.json)
chmod +x ./$cli_name.ts ./dist/$cli_name.js ./dist/minified/$cli_name.js
