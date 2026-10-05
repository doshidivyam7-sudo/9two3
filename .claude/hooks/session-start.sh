#!/bin/bash
set -euo pipefail

# Only needed in Claude Code cloud sessions
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# Install autoscraper (skip if already installed)
if ! python3 -c "import autoscraper" 2>/dev/null; then
  pip install --quiet --use-pep517 git+https://github.com/alirezamika/autoscraper.git
fi
