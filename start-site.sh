#!/bin/sh
# Run this on Linux (or any computer with a terminal) to start the website:
#   sh start-site.sh
cd "$(dirname "$0")" || exit 1

if command -v python3 >/dev/null 2>&1; then
  PY=python3
elif command -v python >/dev/null 2>&1 && python -c "import sys; sys.exit(0 if sys.version_info[0] >= 3 else 1)" 2>/dev/null; then
  PY=python
else
  echo "Python 3 is not installed. Install it (for example: sudo apt install python3) and run this again."
  exit 1
fi

exec "$PY" tools/serve.py
