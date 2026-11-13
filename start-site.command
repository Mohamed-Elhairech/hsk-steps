#!/bin/sh
# Double-click this file on a Mac to run the website on your computer.
# (Linux users: run  sh start-site.sh  in a terminal.)
cd "$(dirname "$0")" || exit 1

if command -v python3 >/dev/null 2>&1; then
  PY=python3
elif command -v python >/dev/null 2>&1 && python -c "import sys; sys.exit(0 if sys.version_info[0] >= 3 else 1)" 2>/dev/null; then
  PY=python
else
  echo
  echo "Python 3 is not installed on this computer."
  echo "Download it from https://www.python.org/downloads/ , install it, then run this file again."
  printf "Press Enter to close. "
  read -r _
  exit 1
fi

"$PY" tools/serve.py || { printf "Press Enter to close. "; read -r _; }
