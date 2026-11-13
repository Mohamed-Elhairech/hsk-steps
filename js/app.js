// app.js: starts the site, loads the data files, and shows the right page.
// The part of the address after # picks the page, e.g. index.html#lessons/3.

const LEVELS = [
  { id: 1, file: "data/hsk1.json", ready: true },
  { id: 2, file: "data/hsk2.json", ready: true },
  { id: 3, file: "data/hsk3.json", ready: true }
];

const App = {
  courses: {},
  page: document.getElementById("page"),

  async getCourse(level) {
    if (this.courses[level]) return this.courses[level];
    const info = LEVELS.find((l) => l.id === level);
    if (!info.ready) return null;
    // "no-cache" makes the browser check for a newer file, so edits show up on reload.
    const res = await fetch(info.file, { cache: "no-cache" });
    if (!res.ok) throw new Error("Could not load " + info.file);
    this.courses[level] = await res.json();
    return this.courses[level];
  },

  allWords(course) {
    return course.lessons.flatMap((l) => l.words.map((w) => ({ ...w, lesson: l.id })));
  },

  levelPicker() {
    return `<div class="row" style="margin-bottom:12px">` + LEVELS.map((l) =>
      `<button class="btn ${Store.data.level === l.id ? "on" : ""}" data-level="${l.id}" ${l.ready ? "" : "disabled"}>
        HSK ${l.id}${l.ready ? "" : " (soon)"}</button>`).join("") + `</div>`;
  },

  bindLevelPicker() {
    this.page.querySelectorAll("[data-level]").forEach((b) => {
      b.onclick = () => {
        Store.data.level = Number(b.dataset.level);
        Store.save();
        this.route();
      };
    });
  },

  async route() {
    const [name, arg] = (location.hash.slice(1) || "home").split("/");
    this.highlightNav(name);
    window.scrollTo(0, 0);
    const views = {
      home: () => this.home(),
      lessons: () => (arg ? this.lesson(Number(arg)) : this.lessons()),
      cards: () => Flashcards.show(arg ? Number(arg) : null),
      quiz: () => Quiz.show(arg ? Number(arg) : null),
      strokes: () => Strokes.show(),
      sentences: () => Sentences.show(),
      progress: () => this.progress(),
      more: () => this.more()
    };
    try {
      await (views[name] || views.home)();
    } catch (e) {
      this.showLoadError(e);
    }
  },

  showLoadError(e) {
    console.error(e);
    const fromFile = location.protocol === "file:";
    const local = ["localhost", "127.0.0.1"].includes(location.hostname);
    this.page.innerHTML = `<div class="notice"><b>The lesson data could not be loaded.</b>
      <p>${fromFile
        ? "Browsers block data files when index.html is opened by double-click. Double-click start-site.bat instead, as described in README.md."
        : local
          ? "The website server is not running. Double-click start-site.bat in the hsk-website folder, keep its black window open, then reload this page."
          : "Please reload the page."}</p></div>`;
  },

  highlightNav(name) {
    document.querySelectorAll("#nav a").forEach((a) => {
      const target = a.getAttribute("href").slice(1);
      const inMore = target === "more" && ["quiz", "strokes", "progress", "more"].includes(name);
      a.classList.toggle("active", target === name || inMore);
    });
  },

  buildNav() {
    const items = [
      ["home", "⌂", "Home", ""], ["lessons", "课", "Lessons", ""], ["cards", "卡", "Cards", ""],
      ["quiz", "练", "Exercises", "wide-only"], ["strokes", "笔", "Strokes", "wide-only"],
      ["sentences", "句", "Daily", ""], ["progress", "▤", "Progress", "wide-only"],
      ["more", "⋯", "More", "narrow-only"]
    ];
    document.getElementById("nav").innerHTML = `<div class="brand">HSK Steps</div>` + items.map(([h, icon, label, cls]) =>
      `<a href="#${h}" class="${cls}"><span>${icon}</span>${label}</a>`).join("");
  },

  more() {
    this.page.innerHTML = `<h1>More</h1>
      <a class="btn option" href="#quiz">Exercises</a>
      <a class="btn option" href="#strokes">Stroke order</a>
      <a class="btn option" href="#progress">Progress</a>`;
  },

  // Numbers on the dashboard count up from zero when the page opens.
  animateNumbers() {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.page.querySelectorAll("[data-count]").forEach((el) => {
      const end = Number(el.dataset.count);
      const suffix = el.dataset.suffix || "";
      if (still || end === 0) { el.textContent = end + suffix; return; }
      const start = performance.now();
      const tick = (t) => {
        const p = Math.min(1, (t - start) / 900);
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      // Browsers pause animation frames in background tabs, so always land on the real number.
      setTimeout(() => { el.textContent = end + suffix; }, 1000);
    });
    // Bars and rings start empty and grow to their value (the CSS animates the change).
    setTimeout(() => {
      this.page.querySelectorAll("[data-width]").forEach((el) => { el.style.width = el.dataset.width + "%"; });
      this.page.querySelectorAll("[data-ring]").forEach((el) => {
        el.style.strokeDashoffset = String(301.6 * (1 - Number(el.dataset.ring) / 100));
      });
      this.page.querySelectorAll("[data-height]").forEach((el) => { el.style.height = el.dataset.height + "%"; });
    }, 60);
  },

  pct(a, b) { return b ? Math.round(a / b * 100) : 0; },

  greeting() {
    const h = new Date().getHours();
    if (h < 12) return ["早上好", "Good morning"];
    if (h < 18) return ["下午好", "Good afternoon"];
    return ["晚上好", "Good evening"];
  },

  async home() {
    const levelId = Store.data.level;
    const course = await this.getCourse(levelId);
    const stats = await Stats.compute();
    const lv = stats.levels.find((l) => l.id === levelId);
    const last = Store.data.lastLesson;
    const next = last && last.level === levelId ? last.id : 1;
    const nextLesson = course.lessons[next - 1];
    const [hello, helloEn] = this.greeting();
    const wordPct = this.pct(lv.studied, lv.words);
    const charPct = this.pct(stats.studiedChars, stats.totalChars);
    const streak = Store.streak();

    // Reviews over the last 7 days, for the bar chart.
    const week = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      week.push({ label: "SMTWTFS"[d.getDay()], n: Store.data.log[Store.dayKey(d)] || 0, today: i === 0 });
    }
    const most = Math.max(1, ...week.map((d) => d.n));

    // Study days over the last 12 weeks, for the calendar.
    const days = new Set(Store.data.days);
    const cells = [];
    const startDay = new Date();
    startDay.setDate(startDay.getDate() - 83);
    for (let i = 0; i < 84; i++) {
      const d = new Date(startDay);
      d.setDate(startDay.getDate() + i);
      const k = Store.dayKey(d);
      const n = Store.data.log[k] || 0;
      const lvl = !days.has(k) ? 0 : n >= 40 ? 4 : n >= 20 ? 3 : n >= 5 ? 2 : 1;
      cells.push(`<i class="h${lvl}" title="${k}"></i>`);
    }

    const floating = [..."学习中文汉字你好加油朋友天气"].map((c, i) =>
      `<span style="--i:${i}">${c}</span>`).join("");

    this.page.innerHTML = `
      <section class="hero anim" style="--d:0">
        <div class="hero-chars" aria-hidden="true">${floating}</div>
        <div class="hero-text">
          <p class="hero-hi zh">${hello}!</p>
          <h1>${helloEn}, ready to learn?</h1>
          <p class="hero-sub">${streak ? `You're on a <b>${streak}-day streak</b>. Keep it going!` : "Study today to start a streak."}</p>
        </div>
        <div class="streak-badge ${streak ? "lit" : ""}"><span class="flame">🔥</span><b data-count="${streak}">0</b><small>day streak</small></div>
      </section>

      ${this.levelPicker()}

      <div class="dash-grid">
        <section class="card ring-card anim" style="--d:1">
          <svg viewBox="0 0 110 110" class="ring" aria-hidden="true">
            <circle cx="55" cy="55" r="48" class="ring-bg"/>
            <circle cx="55" cy="55" r="48" class="ring-fg" data-ring="${wordPct}"/>
          </svg>
          <div class="ring-label"><b data-count="${wordPct}" data-suffix="%">0%</b><small>HSK ${levelId} words</small></div>
          <p class="muted ring-note">${lv.studied} of ${lv.words} words studied · ${lv.mastered} mastered</p>
        </section>

        <section class="tiles">
          <div class="tile-stat anim" style="--d:2"><span class="t-icon">📚</span><b data-count="${lv.studied}">0</b><small>words studied</small></div>
          <div class="tile-stat anim" style="--d:3"><span class="t-icon">字</span><b data-count="${stats.studiedChars}">0</b><small>of ${stats.totalChars} characters</small></div>
          <div class="tile-stat anim" style="--d:4"><span class="t-icon">⏰</span><b data-count="${lv.due}">0</b><small>cards due now</small></div>
          <div class="tile-stat anim" style="--d:5"><span class="t-icon">🎯</span><b data-count="${stats.accuracy ?? 0}" data-suffix="%">0</b><small>${stats.answers ? "quiz accuracy" : "no quizzes yet"}</small></div>
        </section>
      </div>

      <section class="card continue-card anim" style="--d:6">
        <div>
          <p class="muted">Continue learning · HSK ${levelId}</p>
          <p class="zh continue-title">Lesson ${next}: ${nextLesson.title.zh}</p>
          <p class="muted">${nextLesson.title.en}</p>
        </div>
        <div class="row">
          <a class="btn primary pulse" href="#lessons/${next}">Continue ›</a>
          <a class="btn" href="#cards">Review ${lv.due ? `(${lv.due})` : "cards"}</a>
          <a class="btn" href="#sentences">Daily sentence</a>
        </div>
      </section>

      <div class="dash-grid two">
        <section class="card anim" style="--d:7">
          <b>This week</b><p class="muted">Flashcard reviews per day</p>
          <div class="week-chart">${week.map((d) => `<div class="wk ${d.today ? "today" : ""}">
            <span class="wk-n">${d.n || ""}</span><div class="wk-bar"><i data-height="${Math.round(d.n / most * 100)}"></i></div><small>${d.label}</small></div>`).join("")}</div>
        </section>
        <section class="card anim" style="--d:8">
          <b>Study calendar</b><p class="muted">The last 12 weeks</p>
          <div class="heatmap">${cells.join("")}</div>
          <div class="heat-key muted">Less <i class="h0"></i><i class="h1"></i><i class="h2"></i><i class="h3"></i><i class="h4"></i> More</div>
        </section>
      </div>

      <section class="card anim" style="--d:9">
        <b>All levels</b>
        ${stats.levels.map((l) => `<button class="level-row ${l.id === levelId ? "current" : ""}" data-level="${l.id}">
          <span class="lv-badge">HSK ${l.id}</span>
          <span class="lv-bars">
            <span class="lv-line"><small>Words ${l.studied}/${l.words}</small><span class="bar"><i data-width="${this.pct(l.studied, l.words)}"></i></span></span>
            <span class="lv-line"><small>Characters ${l.charsStudied}/${l.chars}</small><span class="bar alt"><i data-width="${this.pct(l.charsStudied, l.chars)}"></i></span></span>
          </span></button>`).join("")}
        <a class="btn" href="#progress" style="margin-top:8px">See full progress ›</a>
      </section>`;

    this.bindLevelPicker();
    this.animateNumbers();
  },

  async lessons() {
    const level = Store.data.level;
    const course = await this.getCourse(level);
    this.page.innerHTML = `<h1>Lessons</h1>${this.levelPicker()}` + course.lessons.map((l) => `
      <div class="card"><a class="lesson-link" href="#lessons/${l.id}">
        <div class="lesson-num ${Store.data.lessonsDone[level + "-" + l.id] ? "done" : ""}">${l.id}</div>
        <div><div class="zh" style="font-size:1.15rem">${l.title.zh}</div>
        <div class="muted">${l.title.en}</div></div>
      </a></div>`).join("");
    this.bindLevelPicker();
  },

  async lesson(id) {
    const level = Store.data.level;
    const course = await this.getCourse(level);
    const l = course.lessons.find((x) => x.id === id);
    if (!l) { location.hash = "lessons"; return; }
    Store.data.lastLesson = { level, id };
    Store.markStudied();
    const key = level + "-" + id;
    const done = Store.data.lessonsDone[key];

    const texts = l.texts.map((t) => `<div class="card">
      <p class="muted">${t.scene}</p>
      ${t.lines.map((n) => `<div class="line">
        <div class="muted">${n.pinyin}</div>
        <div class="zh"><span class="speaker">${n.speaker}</span>${n.zh}</div>
        <div class="muted">${n.en}</div></div>`).join("")}
    </div>`).join("");

    const grammar = l.grammar.length ? `<h2>Grammar</h2>` + l.grammar.map((g) => `<div class="card">
      <b>${g.name}</b><p>${g.explanation}</p>
      ${g.examples.map((e) => `<div class="line"><div class="zh" style="font-size:1.15rem">${e.zh}</div>
      <div class="muted">${e.pinyin} · ${e.en}</div></div>`).join("")}</div>`).join("") : "";

    this.page.innerHTML = `<a href="#lessons">‹ All lessons</a>
      <h1 style="margin-top:8px"><span class="zh">${l.title.zh}</span><br><span class="muted">Lesson ${l.id}: ${l.title.en}</span></h1>
      <h2>Vocabulary (${l.words.length})</h2>
      <div class="card"><table class="word-table">${l.words.map((w) => `<tr>
        <td class="zh">${w.hanzi}${w.extra ? ' <span class="tag">extra</span>' : ""}</td>
        <td>${w.pinyin}<div class="muted">${w.pos}</div></td><td>${w.meaning}</td></tr>`).join("")}</table></div>
      <h2>Texts <span class="tag">written for this site</span></h2>${texts}${grammar}
      <h2>Practice</h2>
      <div class="row spread">
        <a class="btn" href="#cards/${l.id}">Flashcards</a>
        <a class="btn" href="#quiz/${l.id}">Exercises</a>
      </div>
      <p style="margin-top:12px"><button class="btn ${done ? "good" : "primary"}" id="doneBtn">${done ? "Finished ✓" : "Mark lesson finished"}</button></p>`;

    document.getElementById("doneBtn").onclick = () => {
      Store.data.lessonsDone[key] = !Store.data.lessonsDone[key];
      Store.save();
      this.route();
    };
  },

  async progress() {
    const stats = await Stats.compute();
    let html = `<h1>Progress</h1><div class="stats">
      <div class="stat"><b data-count="${Store.streak()}">0</b>day streak</div>
      <div class="stat"><b data-count="${Store.data.days.length}">0</b>days studied</div>
      <div class="stat"><b data-count="${stats.studiedChars}">0</b>of ${stats.totalChars} characters</div>
      <div class="stat"><b data-count="${stats.accuracy ?? 0}" data-suffix="%">0</b>quiz accuracy</div></div>`;

    for (const lv of stats.levels) {
      html += `<details class="card level-detail" ${lv.id === Store.data.level ? "open" : ""}>
        <summary><b>HSK ${lv.id}</b>
          <span class="muted">${lv.studied}/${lv.words} words · ${lv.charsStudied}/${lv.chars} characters · ${lv.lessons.filter((l) => l.finished).length}/${lv.lessons.length} lessons</span>
          <span class="bar"><i data-width="${this.pct(lv.studied, lv.words)}"></i></span>
          <span class="bar alt"><i data-width="${this.pct(lv.charsStudied, lv.chars)}"></i></span>
        </summary>
        ${lv.lessons.map((l) => `<div class="lesson-progress">
          <div class="lp-head"><b>Lesson ${l.id}</b> <span class="zh">${l.title.zh}</span>
            <span class="muted">${l.finished ? "Finished ✓" : "Not finished"} · ${l.quiz === null ? "no quiz yet" : `quiz ${l.quiz}% (${l.quizCount})`}</span></div>
          <div class="lp-line"><small>Words ${l.studiedWords}/${l.words}</small><span class="bar"><i data-width="${this.pct(l.studiedWords, l.words)}"></i></span></div>
          <div class="lp-line"><small>Characters ${l.charsDone.length}/${l.chars.length}</small><span class="bar alt"><i data-width="${this.pct(l.charsDone.length, l.chars.length)}"></i></span></div>
          ${l.chars.length ? `<div class="char-chips zh">${l.chars.map((c) => `<span class="${l.charsDone.includes(c) ? "on" : ""}">${c}</span>`).join("")}</div>` : `<p class="muted">No new characters in this lesson.</p>`}
        </div>`).join("")}
      </details>`;
    }

    html += await Sentences.progressHtml();
    const recent = [...Store.data.days].slice(-14).reverse();
    html += `<div class="card"><b>Streak history</b>
      <p class="muted">${recent.length ? recent.join(", ") : "No study days yet."}</p></div>`;
    this.page.innerHTML = html;
    this.animateNumbers();
  }
};

Store.load();
App.buildNav();
window.addEventListener("hashchange", () => App.route());
App.route();
