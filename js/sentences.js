// sentences.js: the Daily Sentences section. One sentence at a time, with clickable
// words, a pinyin and English toggle, speech, and a "learned" mark.
// The word split always comes from data/sentences.json. It is never worked out here.

const Sentences = {
  LEVELS: ["beginner", "easy", "medium", "hard"],
  all: null,
  level: "beginner",
  topic: null,
  index: 0,
  showPinyin: true,
  showEnglish: true,

  async load() {
    if (this.all) return;
    const res = await fetch("data/sentences.json", { cache: "no-cache" });
    if (!res.ok) throw new Error("Could not load sentences");
    this.all = await res.json();
  },

  id(s) { return s.chinese; },

  current() {
    return this.all.filter((s) => s.level === this.level && s.topic === this.topic);
  },

  topics() {
    return [...new Set(this.all.filter((s) => s.level === this.level).map((s) => s.topic))];
  },

  async show() {
    await this.load();
    const topics = this.topics();
    if (!topics.includes(this.topic)) { this.topic = topics[0] || null; this.index = 0; }
    const list = this.current();
    const tabs = this.LEVELS.map((l) =>
      `<button class="btn ${l === this.level ? "on" : ""}" data-tab="${l}">${l[0].toUpperCase() + l.slice(1)}</button>`).join("");
    const options = topics.map((t) =>
      `<option value="${t}" ${t === this.topic ? "selected" : ""}>${t[0].toUpperCase() + t.slice(1)}</option>`).join("");

    App.page.innerHTML = `<h1>Daily Sentences</h1>
      <div class="tabs">${tabs}</div>
      ${topics.length ? `<select id="topic" aria-label="Topic">${options}</select>` : ""}
      <div id="box"></div>`;

    App.page.querySelectorAll("[data-tab]").forEach((b) => {
      b.onclick = () => { this.level = b.dataset.tab; this.index = 0; this.show(); };
    });
    if (topics.length) {
      document.getElementById("topic").onchange = (e) => { this.topic = e.target.value; this.index = 0; this.show(); };
    }
    if (!list.length) {
      document.getElementById("box").innerHTML = `<div class="card">Sentences for this level are coming soon.</div>`;
      return;
    }
    this.drawSentence(list);
  },

  drawSentence(list) {
    const s = list[this.index];
    const learned = Store.data.sentences[this.id(s)];
    // Punctuation is whatever remains in the sentence between the stored words.
    let pos = 0;
    let html = "";
    s.words.forEach((w, i) => {
      const at = s.chinese.indexOf(w.hanzi, pos);
      if (at > pos) html += this.punct(s.chinese.slice(pos, at));
      html += `<button class="w" data-i="${i}"><span class="py">${w.pinyin}</span><span class="hz zh">${w.hanzi}</span></button>`;
      pos = at + w.hanzi.length;
    });
    if (pos < s.chinese.length) html += this.punct(s.chinese.slice(pos));

    document.getElementById("box").innerHTML = `
      <p class="muted">Sentence ${this.index + 1} of ${list.length}</p>
      <div class="card ${this.showPinyin ? "" : "hide-pinyin"} ${this.showEnglish ? "" : "hide-english"}" id="sentenceCard">
        <div class="sentence" id="sentence">${html}</div>
        <p class="english">${s.english}</p>
      </div>
      <div class="row spread" style="margin-bottom:8px">
        <button class="btn ${this.showPinyin ? "on" : ""}" id="tPinyin">Pinyin</button>
        <button class="btn ${this.showEnglish ? "on" : ""}" id="tEnglish">English</button>
      </div>
      <div class="row spread" style="margin-bottom:8px">
        <button class="btn primary" id="say">▶ Normal</button>
        <button class="btn" id="slow">▶ Slow</button>
      </div>
      <p class="muted" id="voiceMsg">${s.audio ? '<span class="audio-tag">● Recorded voice, works offline</span>' : ""}</p>
      <div class="row spread">
        <button class="btn" id="prev" ${this.index === 0 ? "disabled" : ""}>Back</button>
        <button class="btn ${learned ? "good" : ""}" id="learned">${learned ? "Learned ✓" : "Mark learned"}</button>
        <button class="btn" id="nextS" ${this.index === list.length - 1 ? "disabled" : ""}>Next</button>
      </div>`;

    const go = (d) => {
      const n = this.index + d;
      if (n >= 0 && n < list.length) { this.index = n; this.closePopup(); this.drawSentence(list); }
    };
    document.getElementById("prev").onclick = () => go(-1);
    document.getElementById("nextS").onclick = () => go(1);
    document.getElementById("tPinyin").onclick = () => { this.showPinyin = !this.showPinyin; this.drawSentence(list); };
    document.getElementById("tEnglish").onclick = () => { this.showEnglish = !this.showEnglish; this.drawSentence(list); };
    document.getElementById("say").onclick = (e) => this.play(s, false, e.currentTarget);
    document.getElementById("slow").onclick = (e) => this.play(s, true, e.currentTarget);
    document.getElementById("learned").onclick = () => {
      Store.data.sentences[this.id(s)] = !Store.data.sentences[this.id(s)];
      Store.markStudied();
      this.drawSentence(list);
    };

    document.querySelectorAll(".w[data-i]").forEach((b) => {
      b.onclick = (e) => { e.stopPropagation(); this.openPopup(b, s.words[Number(b.dataset.i)]); };
    });

    const card = document.getElementById("sentenceCard");
    let startX = null;
    card.onpointerdown = (e) => { startX = e.clientX; };
    card.onpointerup = (e) => {
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1);
    };
  },

  punct(text) {
    return `<span class="w punct"><span class="py"></span><span class="hz zh">${text}</span></span>`;
  },

  closePopup() {
    document.querySelectorAll(".popup").forEach((p) => p.remove());
    document.querySelectorAll(".w.open").forEach((w) => w.classList.remove("open"));
  },

  openPopup(button, w) {
    this.closePopup();
    button.classList.add("open");
    const p = document.createElement("div");
    p.className = "popup";
    p.innerHTML = `<div class="hz zh">${w.hanzi}</div><div>${w.pinyin}</div>
      <div>${w.meaning}</div><div class="muted">${w.pos}</div>`;
    p.onclick = (e) => e.stopPropagation();
    document.body.appendChild(p);
    const r = button.getBoundingClientRect();
    const left = Math.max(16, Math.min(r.left, window.innerWidth - p.offsetWidth - 16));
    const top = r.bottom + 6 + p.offsetHeight < window.innerHeight ? r.bottom + 6 : r.top - p.offsetHeight - 6;
    p.style.left = left + "px";
    p.style.top = top + "px";
  },

  // Beginner, Easy and Medium sentences have a recorded male voice in audio/
  // (made by tools/make-audio.py), which plays offline. Other sentences use the
  // browser's own Chinese voice, if the device has one.
  play(s, slow, button) {
    if (!s.audio) { this.speak(s.chinese, slow ? 0.55 : 0.95); return; }
    if (this.audio) this.audio.pause();
    document.querySelectorAll(".playing").forEach((b) => b.classList.remove("playing"));
    this.audio = new Audio("audio/" + s.audio);
    this.audio.playbackRate = slow ? 0.7 : 1;
    this.audio.preservesPitch = true;
    button.classList.add("playing");
    this.audio.onended = () => button.classList.remove("playing");
    this.audio.play().catch(() => {
      button.classList.remove("playing");
      this.speak(s.chinese, slow ? 0.55 : 0.95);
    });
  },

  speak(text, rate) {
    const msg = document.getElementById("voiceMsg");
    const noVoice = "Your device has no Chinese voice yet. You can add one in its language settings.";
    if (!("speechSynthesis" in window)) { msg.textContent = noVoice; return; }
    const start = () => {
      const voice = speechSynthesis.getVoices().find((v) => /^zh[-_]?(CN|Hans)?/i.test(v.lang));
      if (!voice) { msg.textContent = noVoice; return; }
      msg.textContent = "";
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "zh-CN";
      u.voice = voice;
      u.rate = rate;
      speechSynthesis.speak(u);
    };
    // Some browsers load their voice list a moment after the page opens.
    if (speechSynthesis.getVoices().length) start();
    else setTimeout(start, 400);
  },

  async progressHtml() {
    await this.load();
    const rows = this.LEVELS.map((l) => {
      const list = this.all.filter((s) => s.level === l);
      const done = list.filter((s) => Store.data.sentences[this.id(s)]).length;
      return `<tr><td style="font-size:1rem">${l[0].toUpperCase() + l.slice(1)}</td><td>${done} of ${list.length}</td></tr>`;
    }).join("");
    return `<div class="card"><b>Daily Sentences learned</b><table class="word-table">${rows}</table></div>`;
  }
};

document.addEventListener("click", () => Sentences.closePopup());
