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

# autoscraper's learned rules return nothing with beautifulsoup4 >= 4.13
if ! python3 -c "import bs4, sys; sys.exit(tuple(map(int, bs4.__version__.split('.')[:2])) >= (4, 13))" 2>/dev/null; then
  pip install --quiet "beautifulsoup4<4.13"
fi
