# make-audio.py: creates an mp3 for every Beginner, Easy and Medium daily sentence.
# Needs the edge-tts package (pip install edge-tts) and an internet connection while it runs.
# The website itself then plays the files offline.
# Run it from the website folder:  python tools/make-audio.py
# Files that already exist are skipped, so it is safe to run again after adding sentences.

import asyncio
import hashlib
import json
import sys
from pathlib import Path

import edge_tts

VOICE = "zh-CN-YunyangNeural"      # male, clear newsreader voice
LEVELS = {"beginner", "easy", "medium"}

root = Path(__file__).resolve().parent.parent
out = root / "audio"
out.mkdir(exist_ok=True)
sentences = json.loads((root / "data" / "sentences.json").read_text(encoding="utf-8"))


def file_name(chinese):
    # The same rule is used in js/sentences.js to find the file.
    return hashlib.md5(chinese.encode("utf-8")).hexdigest()[:12] + ".mp3"


async def main():
    todo = [s for s in sentences if s["level"] in LEVELS and not (out / file_name(s["chinese"])).exists()]
    print(f"{len(todo)} files to make")
    for n, s in enumerate(todo, 1):
        for attempt in range(3):
            try:
                await edge_tts.Communicate(s["chinese"], VOICE, rate="-5%").save(str(out / file_name(s["chinese"])))
                break
            except Exception as e:
                print("retry", s["chinese"], e)
                await asyncio.sleep(2)
        if n % 25 == 0:
            print(n, "done", flush=True)
    missing = [s["chinese"] for s in sentences if s["level"] in LEVELS and not (out / file_name(s["chinese"])).exists()]
    print("missing:", missing)
    # Record each file name in sentences.json so the website knows which file to play.
    for s in sentences:
        name = file_name(s["chinese"])
        if s["level"] in LEVELS and (out / name).exists():
            s["audio"] = name
        else:
            s.pop("audio", None)
    (root / "data" / "sentences.json").write_text(json.dumps(sentences, ensure_ascii=False, indent=0), encoding="utf-8")
    sys.exit(1 if missing else 0)

asyncio.run(main())
