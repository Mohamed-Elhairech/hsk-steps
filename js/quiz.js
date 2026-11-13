// quiz.js: exercises. Word questions are built from the lesson's vocabulary.
// Fill-in-the-blank and sentence-order questions come from the data file.
// Types: meaning, hanzi, tone, fill, order.

const Quiz = {
  questions: [],
  index: 0,
  right: 0,
  key: "",

  shuffle(list) {
    const a = [...list];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },

  // Returns the same pinyin with a different tone on its first marked vowel.
  toneVariants(pinyin) {
    const groups = ["āáǎà", "ēéěè", "īíǐì", "ōóǒò", "ūúǔù", "ǖǘǚǜ"];
    for (let i = 0; i < pinyin.length; i++) {
      const g = groups.find((x) => x.includes(pinyin[i]));
      if (g) return [...g].filter((c) => c !== pinyin[i])
        .map((c) => pinyin.slice(0, i) + c + pinyin.slice(i + 1));
    }
    return [];
  },

  wordQuestion(w, pool) {
    const others = this.shuffle(pool.filter((x) => x.hanzi !== w.hanzi && x.meaning !== w.meaning)).slice(0, 3);
    const explain = `${w.hanzi} (${w.pinyin}) means "${w.meaning}".`;
    const kinds = ["meaning", "hanzi"];
    const tones = this.toneVariants(w.pinyin);
    if (tones.length) kinds.push("tone");
    const kind = kinds[Math.floor(Math.random() * kinds.length)];

    if (kind === "meaning") {
      return { type: "mcq", label: "What does this mean?", prompt: w.hanzi, zh: true,
        answer: w.meaning, options: this.shuffle([w.meaning, ...others.map((x) => x.meaning)]), explanation: explain };
    }
    if (kind === "hanzi") {
      return { type: "mcq", label: "Choose the Chinese word", prompt: w.meaning,
        answer: w.hanzi, options: this.shuffle([w.hanzi, ...others.map((x) => x.hanzi)]), explanation: explain };
    }
    return { type: "mcq", label: "Choose the correct pinyin and tone", prompt: w.hanzi, zh: true,
      answer: w.pinyin, options: this.shuffle([w.pinyin, ...tones]), explanation: explain };
  },

  async show(lessonId) {
    const level = Store.data.level;
    const course = await App.getCourse(level);
    if (!lessonId) {
      App.page.innerHTML = `<h1>Exercises</h1>${App.levelPicker()}` + course.lessons.map((l) => `
        <div class="card"><a class="lesson-link" href="#quiz/${l.id}">
          <div class="lesson-num">${l.id}</div><div class="zh">${l.title.zh}</div></a></div>`).join("");
      App.bindLevelPicker();
      return;
    }
    const lesson = course.lessons.find((l) => l.id === lessonId);
    const pool = App.allWords(course);
    const words = this.shuffle(lesson.words).slice(0, 8);
    this.questions = this.shuffle([
      ...words.map((w) => this.wordQuestion(w, pool)),
      ...lesson.exercises.map((e) => ({ ...e, options: e.options ? this.shuffle(e.options) : undefined }))
    ]);
    this.index = 0;
    this.right = 0;
    this.key = level + "-" + lessonId;
    this.lessonId = lessonId;
    this.draw();
  },

  draw() {
    if (this.index >= this.questions.length) {
      const pct = Math.round(this.right / this.questions.length * 100);
      App.page.innerHTML = `<h1>Finished!</h1><div class="card">
        <p style="font-size:1.3rem">${this.right} of ${this.questions.length} correct (${pct}%)</p>
        <p>${pct >= 80 ? "Great work. 很好!" : "Good effort. Try again and it will stick. 加油!"}</p>
        <div class="row"><a class="btn primary" href="#lessons/${this.lessonId}">Back to lesson</a>
        <button class="btn" id="again">Try again</button></div></div>`;
      document.getElementById("again").onclick = () => this.show(this.lessonId);
      return;
    }
    const q = this.questions[this.index];
    const head = `<p class="muted">Question ${this.index + 1} of ${this.questions.length}</p>`;
    if (q.type === "order") this.drawOrder(q, head);
    else this.drawChoice(q, head);
  },

  next(q, ok, target) {
    Store.recordQuiz(this.key, ok);
    if (ok) this.right++;
    target.innerHTML = `<div class="feedback ${ok ? "right" : "wrong"}">
      <b>${ok ? "Correct!" : "Not quite."}</b> ${ok ? "" : `Answer: <span class="zh">${q.answerText || q.answer}</span><br>`}${q.explanation}
      </div><button class="btn primary" id="next">Next</button>`;
    document.getElementById("next").onclick = () => { this.index++; this.draw(); };
  },

  drawChoice(q, head) {
    const label = q.label || "Choose the word that fits";
    App.page.innerHTML = `<h1>Exercises</h1>${head}<div class="card">
      <p class="muted">${label}</p>
      <div class="prompt ${q.zh !== false ? "zh" : ""}">${q.prompt}</div>
      ${q.options.map((o, i) => `<button class="btn option zh" data-i="${i}">${o}</button>`).join("")}
      <div id="result"></div></div>`;
    const buttons = [...App.page.querySelectorAll(".option")];
    buttons.forEach((b) => {
      b.onclick = () => {
        const chosen = q.options[Number(b.dataset.i)];
        const ok = chosen === q.answer;
        buttons.forEach((x) => {
          x.disabled = true;
          if (q.options[Number(x.dataset.i)] === q.answer) x.classList.add("right");
        });
        if (!ok) b.classList.add("wrong");
        this.next(q, ok, document.getElementById("result"));
      };
    });
  },

  drawOrder(q, head) {
    const left = this.shuffle(q.tokens.map((t, i) => ({ t, i })));
    const chosen = [];
    App.page.innerHTML = `<h1>Exercises</h1>${head}<div class="card">
      <p class="muted">Put the words in the correct order</p>
      <p>${q.prompt}</p>
      <div class="slots row" id="slots"></div>
      <div class="row" id="bank"></div>
      <p style="margin-top:10px"><button class="btn primary" id="check" disabled>Check</button></p>
      <div id="result"></div></div>`;

    const draw = () => {
      const button = (x) => `<button class="btn token zh" data-i="${x.i}">${x.t}</button>`;
      const slots = document.getElementById("slots");
      const bank = document.getElementById("bank");
      slots.innerHTML = chosen.map(button).join("");
      bank.innerHTML = left.map(button).join("");
      const move = (from, to) => (b) => {
        b.onclick = () => {
          const at = from.findIndex((x) => x.i === Number(b.dataset.i));
          to.push(from.splice(at, 1)[0]);
          draw();
        };
      };
      slots.querySelectorAll("button").forEach(move(chosen, left));
      bank.querySelectorAll("button").forEach(move(left, chosen));
      document.getElementById("check").disabled = left.length > 0;
    };
    draw();

    document.getElementById("check").onclick = (e) => {
      e.target.remove();
      App.page.querySelectorAll(".token").forEach((b) => { b.disabled = true; });
      const ok = chosen.map((x) => x.t).join("") === q.tokens.join("");
      this.next({ ...q, answer: q.tokens.join(" ") }, ok, document.getElementById("result"));
    };
  }
};
