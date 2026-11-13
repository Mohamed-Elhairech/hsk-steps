// strokes.js: stroke-order animation and tracing, using the Hanzi Writer library.

const Strokes = {
  writer: null,
  char: null,

  async show() {
    const course = await App.getCourse(Store.data.level);
    // Build the list of unique Chinese characters from the level's words.
    const chars = [...new Set(App.allWords(course).flatMap((w) => [...w.hanzi]))]
      .filter((c) => /[一-鿿]/.test(c));
    this.char = this.char && chars.includes(this.char) ? this.char : chars[0];

    App.page.innerHTML = `<h1>Stroke order</h1>${App.levelPicker()}
      <div class="writer-box" id="writer"></div>
      <div class="row spread" style="margin-bottom:6px">
        <button class="btn primary" id="animate">Watch</button>
        <button class="btn" id="practice">Practice</button>
      </div>
      <p class="muted" id="status">Choose a character below.</p>
      <div class="char-picker card">${chars.map((c) =>
        `<button class="btn zh ${c === this.char ? "on" : ""}" data-c="${c}">${c}</button>`).join("")}</div>`;

    App.bindLevelPicker();
    App.page.querySelectorAll("[data-c]").forEach((b) => {
      b.onclick = () => {
        this.char = b.dataset.c;
        App.page.querySelectorAll("[data-c]").forEach((x) => x.classList.toggle("on", x === b));
        this.load();
      };
    });
    document.getElementById("animate").onclick = () => this.writer && this.writer.animateCharacter();
    document.getElementById("practice").onclick = () => this.practice();
    this.load();
  },

  say(text) { document.getElementById("status").textContent = text; },

  // The library is fetched only when this page opens, so it never slows down the
  // other pages. Both the library and the stroke data are stored in this
  // project (js/lib and data/strokes), so stroke order works without internet.
  loadLibrary() {
    if (window.HanziWriter) return Promise.resolve(true);
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "js/lib/hanzi-writer.min.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  },

  // Stroke files are named by the character's code, e.g. 我 is data/strokes/6211.json.
  // If a character is missing locally, try the online copy as a backup.
  loadChar(char, onLoad, onError) {
    const local = `data/strokes/${char.codePointAt(0).toString(16)}.json`;
    fetch(local)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .catch(() => fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1/${encodeURIComponent(char)}.json`).then((r) => r.json()))
      .then(onLoad)
      .catch(onError);
  },

  async load() {
    const box = document.getElementById("writer");
    box.innerHTML = "";
    this.writer = null;
    this.say("Loading...");
    const ready = await this.loadLibrary();
    if (!document.getElementById("writer")) return;
    if (!ready) {
      this.say("The stroke order library is missing. Run tools/get-strokes.py (see README.md).");
      return;
    }
    box.innerHTML = "";
    this.writer = HanziWriter.create(box, this.char, {
      width: 280, height: 280, padding: 16,
      strokeColor: "#2e2622", radicalColor: "#c0352b",
      showOutline: true, strokeAnimationSpeed: 1, delayBetweenStrokes: 200,
      charDataLoader: (char, onLoad, onError) => this.loadChar(char, onLoad, onError),
      onLoadCharDataError: () => this.say("No stroke data for this character yet.")
    });
    this.say("Tap Watch to see the strokes, or Practice to trace them.");
  },

  practice() {
    if (!this.writer) return;
    this.say("Trace each stroke with your finger or mouse.");
    this.writer.quiz({
      onComplete: (r) => {
        Store.markStudied();
        this.say(`Well done! Mistakes: ${r.totalMistakes}.`);
      }
    });
  }
};
