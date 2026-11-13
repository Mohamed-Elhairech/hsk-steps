# HSK Steps

A free website for beginners learning Chinese with the new **HSK 3.0** standard, Levels 1 to 3.
It runs on your own computer and works on laptop and phone screens. It is plain HTML, CSS and
JavaScript, with no frameworks, no account and no build step.

**What you get**

- **48 lessons** (HSK 1: 15, HSK 2: 15, HSK 3: 18) with vocabulary, dialogues and grammar
- **1,016 words** on Anki-style flashcards: Again / Hard / Good / Easy, each with its own timing, plus a picture on every card
- **Exercises** for each lesson: meaning, characters, pinyin and tones, fill in the blank, sentence ordering
- **Stroke order** animation and tracing practice for every character, **works offline**
- **600 Daily Sentences** in 15 topics and 4 levels, with clickable words, show/hide pinyin and English, and a recorded **male voice** (Beginner, Easy and Medium) that **works offline**
- **Dashboard and progress**: words and characters studied per lesson, streak, weekly chart and a 12-week calendar
- Your progress is saved in your browser. Nothing is sent anywhere.

---

## Quick start (about 3 minutes)

### Step 1. Install Python (once)

The site needs Python 3 only to open its files. You do not need to know Python.

- **Windows:** download it from <https://www.python.org/downloads/>, run the installer, and on
  the first screen **tick "Add python.exe to PATH"**.
- **Mac:** download it from <https://www.python.org/downloads/> and install it.
- **Linux:** it is usually installed already. If not: `sudo apt install python3`.

To check, open a terminal and type `python --version` (or `python3 --version` on Mac and Linux).
You should see a number starting with 3.

### Step 2. Get the files

**Easiest:** on this GitHub page click the green **Code** button, then **Download ZIP**.
Then **extract it**: on Windows right-click the ZIP and choose **Extract All**.
Do not run the site from inside the ZIP, it will not work.

**Or with Git:**

```bash
git clone https://github.com/Mohamed-Elhairech/hsk-steps.git
```

### Step 3. Start the site

| Computer | What to do |
|---|---|
| **Windows** | Double-click **`start-site.bat`** |
| **Mac** | Double-click **`start-site.command`**. The first time, right-click it, choose **Open**, then **Open** again |
| **Linux** | In a terminal inside the folder: `sh start-site.sh` |
| **Any computer** | In a terminal inside the folder: `python tools/serve.py` (or `python3 tools/serve.py`) |

A black window opens and your browser shows the site at **http://localhost:8000**.

- **Keep the black window open while you study.** Closing it turns the site off.
- To stop the site, close the window (or press **Ctrl+C** in it).
- Next time, just double-click the start file again.

> **Why can't I just double-click `index.html`?** Browsers block a page from reading its own
> lesson files when it is opened that way. The tiny local server in `start-site` fixes that.
> It only works on your own computer, and nobody else on your network can reach it.

---

## Using it

- **Lessons:** read the vocabulary, dialogues and grammar, then press *Flashcards* or *Exercises*.
- **Flashcards:** tap the card (or **Show answer**), then choose how well you knew it.
  Each button shows when the card will come back. New cards repeat after 1 and 10 minutes, then
  move to days and months. Swipe left for *Again* and right for *Good* on a touch screen.
- **Studied and mastered:** a word counts as *studied* once you rate it **Good** or **Easy**. It is
  *mastered* when its next review is three weeks or more away. A character counts as studied once
  any word that contains it is studied.
- **Strokes:** pick a character, press **Watch** to see the strokes, or **Practice** to trace them
  with your mouse or finger.
- **Daily:** pick a level and a topic. Tap any word for its pinyin, meaning and part of speech.
  Use ▶ **Normal** or ▶ **Slow** to hear the sentence.

### Sound

- **Beginner, Easy and Medium sentences** have a recorded male voice, stored in the `audio` folder.
  It plays offline on every device, with nothing to install. Make sure your volume is up and the
  device is not on silent.
- **Hard sentences** have no recording. They use your device's own Chinese voice if it has one
  (most phones do). If not, you will see a friendly message.

### Where is my progress saved?

In your browser, for the exact address you use (for example `http://localhost:8000`).

- A different browser, a different computer, or a different port (like `:8001`) starts from zero.
- Clearing your browser's site data erases it.
- So always open the site with the same start file and the same browser.

---

## Use it on your phone

The local server only works on the computer it runs on. To use the site on a phone, publish it for
free with **GitHub Pages**. Everything, including sound and stroke order, works there too.

1. Put the project in your own GitHub repository.
2. Open the repository, then **Settings**, then **Pages** in the left menu.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
4. Under **Branch**, choose **main** and **/ (root)**, then click **Save**.
5. Wait one or two minutes and refresh the page. Your link appears at the top, like
   `https://your-name.github.io/your-repository/`.
6. Open that link on your phone. In the phone's browser menu, choose **Add to Home screen** to keep it like an app.

---

## If something goes wrong

| What you see | What to do |
|---|---|
| **"Python is not installed"**, or `python is not recognized` | Install Python (Step 1). On Windows, tick **Add python.exe to PATH**, then start again |
| The black window closes straight away | Open a terminal in the folder and run `python tools/serve.py` to see the error message |
| **"Port 8000 is being used by another program"** | Close the other program, or run `python tools/serve.py 8001` and open http://localhost:8001 (progress is saved separately for each port) |
| The page says **"The lesson data could not be loaded"** | The start window was closed. Double-click the start file again and reload the page |
| You see a list of files called **"Directory listing"** | The server was started in the wrong folder. Close it and use the start file instead of typing the command yourself |
| You see an **old version** of the site | Press **Ctrl+F5**. If it stays old, press **Ctrl+Shift+Delete**, tick *Cached images and files*, and clear them |
| **No sound** on Beginner, Easy or Medium | Check the volume and that the tab is not muted. You should see "● Recorded voice, works offline" under the buttons |
| **No sound** on Hard sentences | Normal on a computer without a Chinese voice. Windows: *Settings, Time & language, Language & region, add Chinese*. Phones: use the phone's built-in Chinese voice |
| Characters look plain or different | The Noto Sans SC font loads from Google Fonts when you are online. Offline, your device uses its own Chinese font |
| Mac says the file *cannot be opened because it is from an unidentified developer* | Right-click the file, choose **Open**, then **Open** again. Or run `python3 tools/serve.py` in Terminal |

---

## What each file does

```text
index.html              the single page that loads everything
start-site.bat          Windows: double-click to run the site
start-site.command      Mac: double-click to run the site
start-site.sh           Linux: run it to start the site
css/style.css           all styling, written for phones first
js/app.js               starts the site, draws Home, Lessons and Progress
js/storage.js           saves progress in the browser (localStorage)
js/stats.js             works out words and characters studied
js/flashcards.js        flip cards and spaced repetition
js/pictures.js          the picture for each flashcard
js/quiz.js              exercises and scoring
js/strokes.js           stroke order with Hanzi Writer
js/sentences.js         Daily Sentences, voice and word popups
js/lib/                 the Hanzi Writer library, stored here so it works offline
data/hsk1.json ...      the lessons for each level
data/sentences.json     the 600 Daily Sentences
data/strokes/           stroke data, one file per character (6211.json is 我)
audio/                  the recorded voice, one mp3 per sentence
tools/serve.py          the small local server the start files run
tools/check-sentences.py  checks every sentence's word split
tools/make-audio.py     records the voice for new sentences
tools/get-strokes.py    downloads stroke data for new characters
```

## Change or add content

All course content is in the `data` folder, so you never need to touch the code.

- **A lesson:** open `data/hsk1.json` (or `hsk2`, `hsk3`) and find the lesson. Add a word to
  `words`, a dialogue to `texts`, or a question to `exercises`. Exercises use one of two forms:

  ```json
  { "type": "fill", "prompt": "我（　）吃米饭。", "options": ["想", "号"], "answer": "想", "explanation": "..." }
  { "type": "order", "prompt": "I can cook.", "tokens": ["我", "会", "做饭"], "explanation": "..." }
  ```

- **A daily sentence:** add an entry to `data/sentences.json` like the existing ones. Split it
  into **words, not single characters**, then check it:

  ```bash
  python tools/check-sentences.py
  ```

- **New voice and stroke data:** run these once after adding sentences or words. They need internet
  while they run, and `pip install edge-tts` the first time:

  ```bash
  python tools/make-audio.py
  python tools/get-strokes.py
  ```

- **After changing any `.css` or `.js` file:** raise the `?v=4` number in the links at the bottom
  of `index.html` (to `?v=5`, and so on) so every browser loads the new files.

---

## Credits and licenses

- **Lesson structure:** the order and titles of the lessons, the word lists (characters, pinyin,
  lesson numbers) and the grammar topics follow the *New HSK Course* 1 to 3 textbooks
  (新HSK教程, Foreign Language Teaching and Research Press). The English meanings, dialogues, grammar
  explanations, exercises and all 600 Daily Sentences were written for this project. This is an
  unofficial study aid. It is not affiliated with or endorsed by the publisher or the HSK exam.
- **Stroke order:** the [Hanzi Writer](https://hanziwriter.org) library (MIT license) and the
  [hanzi-writer-data](https://github.com/chanind/hanzi-writer-data) stroke files, which are based
  on [Make Me a Hanzi](https://github.com/skishore/makemeahanzi) (Arphic Public License).
- **Font:** [Noto Sans SC](https://fonts.google.com/noto/specimen/Noto+Sans+SC) (SIL Open Font
  License), loaded from Google Fonts.
- **Voice:** generated with [edge-tts](https://github.com/rany2/edge-tts) using Microsoft's
  `zh-CN-YunyangNeural` voice.
- **Flashcard pictures:** emoji from your own device's font, so they look a little different on
  each system.
