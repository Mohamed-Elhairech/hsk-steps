# get-strokes.py: downloads the Hanzi Writer library and the stroke data for every
# character used in the lessons and daily sentences, so stroke order works offline.
# Run it from the website folder:  python tools/get-strokes.py
# Characters already downloaded are skipped. Stroke data comes from the
# hanzi-writer-data package (based on Make Me a Hanzi, Arphic Public License).

import json
import re
import urllib.parse
import urllib.request
from pathlib import Path

LIB = "https://cdn.jsdelivr.net/npm/hanzi-writer@3.5.0/dist/hanzi-writer.min.js"
DATA = "https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1/"

root = Path(__file__).resolve().parent.parent
strokes = root / "data" / "strokes"
strokes.mkdir(parents=True, exist_ok=True)
lib = root / "js" / "lib" / "hanzi-writer.min.js"
lib.parent.mkdir(exist_ok=True)

def fetch(url):
    with urllib.request.urlopen(url, timeout=20) as r:
        return r.read()

if not lib.exists():
    lib.write_bytes(fetch(LIB))

chars = set()
for name in ("hsk1.json", "hsk2.json", "hsk3.json", "sentences.json"):
    chars |= set(re.findall(r"[一-鿿]", (root / "data" / name).read_text(encoding="utf-8")))

missing = []
for c in sorted(chars):
    target = strokes / f"{ord(c):x}.json"     # file names use the character's code, e.g. 6211.json for 我
    if target.exists():
        continue
    try:
        data = fetch(DATA + urllib.parse.quote(c) + ".json")
        json.loads(data)
        target.write_bytes(data)
    except Exception as e:
        missing.append(c)

print(f"{len(chars)} characters, {len(list(strokes.glob('*.json')))} files, missing: {''.join(missing)}")
