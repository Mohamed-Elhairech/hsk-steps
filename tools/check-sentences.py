# check-sentences.py: checks data/sentences.json.
# Run it from the website folder:  python tools/check-sentences.py
# For each sentence it confirms the words, joined together, exactly match the
# sentence once punctuation is removed, and that every word has all its details.

import json
import re
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
PUNCTUATION = re.compile(r"[，。！？、：；“”‘’（）…—\s]")
LEVELS = {"beginner", "easy", "medium", "hard"}
FIELDS = ("hanzi", "pinyin", "meaning", "pos")

path = Path(__file__).resolve().parent.parent / "data" / "sentences.json"
sentences = json.loads(path.read_text(encoding="utf-8"))
problems = []
seen = set()

for number, s in enumerate(sentences, 1):
    label = f"#{number} {s.get('chinese', '?')}"
    if s.get("level") not in LEVELS:
        problems.append(f"{label}: unknown level {s.get('level')}")
    if s["chinese"] in seen:
        problems.append(f"{label}: duplicate sentence")
    seen.add(s["chinese"])
    joined = "".join(w.get("hanzi", "") for w in s["words"])
    if joined != PUNCTUATION.sub("", s["chinese"]):
        problems.append(f"{label}: words join to {joined}")
    for w in s["words"]:
        missing = [f for f in FIELDS if not w.get(f)]
        if missing:
            problems.append(f"{label}: word {w.get('hanzi')} is missing {missing}")

print(f"Checked {len(sentences)} sentences.")
if problems:
    print(f"{len(problems)} problem(s):")
    print("\n".join(problems))
    sys.exit(1)
print("All sentences are correct.")
