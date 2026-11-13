// storage.js: saves and loads the learner's progress in the browser (localStorage).
// Everything lives in one object, `Store.data`, written as JSON under one key.

const Store = {
  KEY: "hsk-steps-v1",
  data: null,

  load() {
    const empty = {
      level: 1,
      lessonsDone: {},   // "1-3": true means level 1, lesson 3 is finished
      lastLesson: null,  // { level, id }
      cards: {},         // "1:咖啡": { state, step, interval, ease, due, reps, lapses, studied }
      quiz: {},          // "1-3": { right, total }
      days: [],          // dates the learner studied, like "2026-11-01"
      log: {},           // "2026-11-01": number of flashcard reviews that day
      sentences: {}      // sentence id: true
    };
    try {
      const saved = JSON.parse(localStorage.getItem(this.KEY));
      this.data = Object.assign(empty, saved);
    } catch (e) {
      this.data = empty;
    }
    this.upgradeCards();
  },

  // Cards saved by the first version used { box, due: "2026-11-01" }. Convert them.
  upgradeCards() {
    const days = [0, 1, 3, 7, 14];
    for (const [k, c] of Object.entries(this.data.cards)) {
      if (c.box === undefined) continue;
      this.data.cards[k] = c.box > 0
        ? { state: "review", step: 0, interval: days[c.box], ease: 2.5, due: Date.parse(c.due) || Date.now(), reps: c.box, lapses: 0, studied: true }
        : { state: "learning", step: 0, interval: 0, ease: 2.5, due: Date.now(), reps: 1, lapses: 0, studied: false };
    }
  },

  save() {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(this.data));
    } catch (e) {
      // Private windows can block storage. The site still works until it is closed.
    }
  },

  dayKey(d) {
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  },

  today() { return this.dayKey(new Date()); },

  markStudied() {
    const t = this.today();
    if (!this.data.days.includes(t)) this.data.days.push(t);
    this.save();
  },

  logReview() {
    const t = this.today();
    this.data.log[t] = (this.data.log[t] || 0) + 1;
    this.markStudied();
  },

  // Counts consecutive studied days, ending today (or yesterday if not studied yet today).
  streak() {
    const days = new Set(this.data.days);
    const d = new Date();
    if (!days.has(this.dayKey(d))) d.setDate(d.getDate() - 1);
    let n = 0;
    while (days.has(this.dayKey(d))) {
      n++;
      d.setDate(d.getDate() - 1);
    }
    return n;
  },

  recordQuiz(key, right) {
    const q = this.data.quiz[key] || { right: 0, total: 0 };
    q.total++;
    if (right) q.right++;
    this.data.quiz[key] = q;
    this.markStudied();
  },

  // A word counts as studied once it has been rated Good or Easy on a flashcard.
  isStudied(level, hanzi) {
    const c = this.data.cards[level + ":" + hanzi];
    return Boolean(c && c.studied);
  },

  // Mastered means the next review is three weeks or more away.
  isMastered(level, hanzi) {
    const c = this.data.cards[level + ":" + hanzi];
    return Boolean(c && c.state === "review" && c.interval >= 21);
  }
};
