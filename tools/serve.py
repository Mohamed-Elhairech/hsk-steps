# serve.py: runs the website on http://localhost:8000 for this computer only.
# It works like "python -m http.server", but tells the browser to check for a
# newer copy of every file each time, so you always see the latest version.
# The start-site files run this for you. To run it by hand:
#   python tools/serve.py          (uses port 8000)
#   python tools/serve.py 8001     (uses another port, if 8000 is busy)
# Your progress is saved per address, so keep using the same port to keep it.

import http.server
import os
import sys
import threading
import urllib.request
import webbrowser
from pathlib import Path

PORT = int(next((a for a in sys.argv[1:] if a.isdigit()), 8000))
URL = f"http://localhost:{PORT}"
os.chdir(Path(__file__).resolve().parent.parent)   # always serve the website folder


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()


def open_browser():
    if not os.environ.get("HSK_NO_BROWSER"):
        webbrowser.open(URL)


def already_running():
    try:
        with urllib.request.urlopen(URL + "/data/hsk1.json", timeout=2) as r:
            return r.status == 200
    except Exception:
        return False


if already_running():
    print(f"The website is already running at {URL}. Opening it in your browser.")
    open_browser()
    sys.exit(0)

try:
    server = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), NoCacheHandler)
except OSError:
    sys.exit(f"Port {PORT} is being used by another program.\n"
             f"Close that program, or start the site on another port: python tools/serve.py {PORT + 1}")

print(f"HSK Steps is running at {URL}")
print("Keep this window open while you study. Close it (or press Ctrl+C) to stop.")
threading.Timer(0.8, open_browser).start()
try:
    server.serve_forever()
except KeyboardInterrupt:
    print("Stopped.")
