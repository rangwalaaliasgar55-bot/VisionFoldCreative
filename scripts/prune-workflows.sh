#!/usr/bin/env bash
# Removes the 90+ legacy "noise bot" workflows, keeps the two that matter.
# The Arena git app token can't touch .github/workflows/*, so run this
# locally (or paste the rm command in the GitHub web UI) — your account has
# the required `workflows` permission.
#
#   bash scripts/prune-workflows.sh
#   git add -A && git commit -m "chore: remove noise-bot workflows" && git push

set -euo pipefail
cd "$(dirname "$0")/.."

echo "Before: $(ls .github/workflows | wc -l) workflows"

# Keep a real CI + GitHub's CodeQL security analysis.
find .github/workflows -maxdepth 1 -name "*.yml" ! -name "ci.yml" ! -name "codeql.yml" -delete

# Replace the legacy (broken) ci.yml with a lean one that matches reality.
cat > .github/workflows/ci.yml <<'YAML'
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run typecheck

      - name: Lint
        run: npm run lint

      - name: Production build
        run: npm run build
        env:
          JWT_SECRET: ci-only-not-secret-jwt-key
          NODE_ENV: production
YAML

echo "After:  $(ls .github/workflows | wc -l) workflows"
ls .github/workflows
