// flashcards.js: flip cards with Anki-style spaced repetition.
// After flipping, the learner picks one of four answers:
//   Again: forgot it, see it again in 1 minute
//   Hard:  remembered with effort, a shorter wait
//   Good:  remembered, the normal wait
//   Easy:  too easy, a much longer wait
// New cards go through short learning steps (1 and 10 minutes) and then
// move to review, where each wait grows by the card's "ease" (starting at 2.5x).

const MIN = 60 * 1000;
const DAY = 24 * 60 * MIN;

const Flashcards = {
  STEPS: [1, 10],       // learning steps, in minutes
  NEW_PER_SESSION: 20,
  queue: [],
  level: 1,
  reviewed: 0,

  key(w) { return this.level + ":" + w.hanzi; },

  newCard() {
    return { state: "learning", step: 0, interval: 0, ease: 2.5, due: Date.now(), reps: 0, lapses: 0, studied: false };
  },

  // Works out what a card becomes after an answer, without saving it.
  // Used both to schedule the card and to show the wait on each button.
  schedule(card, rating) {
    const c = { ...card };
    const now = Date.now();
    c.reps++;
    if (c.state === "learning") {
      if (rating === "again") { c.step = 0; c.due = now + this.STEPS[0] * MIN; }
      else if (rating === "hard") { c.due = now + Math.round((this.STEPS[0] + this.STEPS[1]) / 2) * MIN; }
      else if (rating === "good") {
        c.step++;
        if (c.step >= this.STEPS.length) { c.state = "review"; c.interval = 1; c.due = now + DAY; }
        else c.due = now + this.STEPS[c.step] * MIN;
      } else { c.state = "review"; c.interval = 4; c.due = now + 4 * DAY; }
    } else {
      if (rating === "again") {
        c.lapses++;
        c.ease = Math.max(1.3, c.ease - 0.2);
        c.state = "learning"; c.step = 0; c.interval = 1;
        c.due = now + this.STEPS[0] * MIN;
      } else {
        // Each button always waits longer than the one before it.
        const hard = Math.max(card.interval + 1, Math.round(card.interval * 1.2));
        const good = Math.max(hard + 1, Math.round(card.interval * card.ease));
        const easy = Math.max(good + 1, Math.round(card.interval * card.ease * 1.3));
        if (rating === "hard") { c.ease = Math.max(1.3, c.ease - 0.15); c.interval = hard; }
        if (rating === "good") c.interval = good;
        if (rating === "easy") { c.interval = easy; c.ease += 0.15; }
        c.due = now + c.interval * DAY;
      }
    }
    if (rating === "good" || rating === "easy") c.studied = true;
    return c;
  },

  wait(card) {
    const ms = card.due - Date.now();
    if (ms < 60 * MIN) return Math.max(1, Math.round(ms / MIN)) + " min";
    if (ms < DAY) return Math.round(ms / (60 * MIN)) + " h";
    const d = Math.round(ms / DAY);
    return d < 30 ? d + " d" : (d / 30).toFixed(1).replace(".0", "") + " mo";
  },

  async show(lessonId) {
    this.level = Store.data.level;
    const course = await App.getCourse(this.level);
    let words = App.allWords(course);
    if (lessonId) words = words.filter((w) => w.lesson === lessonId);

    const now = Date.now();
    const cards = Store.data.cards;
    const due = words
      .filter((w) => cards[this.key(w)] && cards[this.key(w)].due <= now)
      .sort((a, b) => cards[this.key(a)].due - cards[this.key(b)].due);
    const fresh = words.filter((w) => !cards[this.key(w)]).slice(0, this.NEW_PER_SESSION);

    this.queue = [...due, ...fresh];
    this.title = lessonId ? `Lesson ${lessonId}` : `HSK ${this.level}`;
    this.lessonId = lessonId;
    this.reviewed = 0;
    this.draw();
  },

  // Learning cards answered in this session come back once their minutes have passed.
  // If only waiting cards are left, show the soonest one a little early instead of stopping.
  next() {
    const now = Date.now();
    const cards = Store.data.cards;
    const ready = this.queue.findIndex((w) => !cards[this.key(w)] || cards[this.key(w)].due <= now);
    if (ready >= 0) return this.queue.splice(ready, 1)[0];
    if (!this.queue.length) return null;
    this.queue.sort((a, b) => cards[this.key(a)].due - cards[this.key(b)].due);
    return this.queue.shift();
  },

  draw() {
    const w = this.next();
    if (!w) {
      App.page.innerHTML = `<h1>Flashcards</h1>${App.levelPicker()}<div class="card done-card">
        <div class="big-emoji">🎉</div>
        <p><b>All done for now.</b> ${this.reviewed ? `You reviewed ${this.reviewed} cards.` : "Nothing is due."} 加油!</p>
        <div class="row">${this.lessonId ? `<a class="btn" href="#cards">All HSK ${this.level} cards</a>` : ""}
        <a class="btn primary" href="#home">Back to home</a></div></div>`;
      App.bindLevelPicker();
      return;
    }
    this.current = w;
    const card = Store.data.cards[this.key(w)] || this.newCard();
    const isNew = !Store.data.cards[this.key(w)];
    const counts = this.counts();
    const buttons = [["again", "Again"], ["hard", "Hard"], ["good", "Good"], ["easy", "Easy"]].map(([r, label]) =>
      `<button class="btn rate rate-${r}" data-r="${r}"><b>${label}</b><small>${this.wait(this.schedule(card, r))}</small></button>`).join("");

    App.page.innerHTML = `<h1>Flashcards</h1>
      <div class="deck-counts"><span class="c-new">${counts.fresh} new</span><span class="c-learn">${counts.learning} learning</span><span class="c-due">${counts.review} review</span></div>
      <p class="muted">${this.title} · tap the card to flip ${isNew ? '· <span class="tag">new</span>' : ""}</p>
      <div class="flash" id="flash"><div class="flash-inner">
        <div class="face front"><div class="pic-wrap">${Pictures.html(w)}</div><div class="big zh">${w.hanzi}</div></div>
        <div class="face back">${Pictures.html(w, true)}<div class="big zh" style="font-size:2.2rem">${w.hanzi}</div>
          <p style="font-size:1.4rem;margin:6px 0 0">${w.pinyin}</p>
          <p style="margin:4px 0">${w.meaning}</p><p class="muted">${w.pos}</p></div>
      </div></div>
      <div id="answers">
        <button class="btn primary show-answer" id="showBtn">Show answer</button>
        <div class="rates" id="rates" hidden>${buttons}</div>
      </div>
      <p class="muted swipe-hint">Swipe left for Again, right for Good.</p>`;

    const flash = document.getElementById("flash");
    const reveal = () => {
      flash.classList.add("flipped");
      document.getElementById("showBtn").hidden = true;
      document.getElementById("rates").hidden = false;
    };
    let startX = null, moved = false;
    flash.onpointerdown = (e) => { startX = e.clientX; moved = false; };
    flash.onpointerup = (e) => {
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 60 && flash.classList.contains("flipped")) { moved = true; this.answer(dx > 0 ? "good" : "again"); }
    };
    flash.onclick = () => {
      if (moved) return;
      if (flash.classList.contains("flipped")) flash.classList.remove("flipped");
      else reveal();
    };
    document.getElementById("showBtn").onclick = reveal;
    App.page.querySelectorAll(".rate").forEach((b) => { b.onclick = () => this.answer(b.dataset.r); });
  },

  counts() {
    const cards = Store.data.cards;
    const all = [this.current, ...this.queue];
    let fresh = 0, learning = 0, review = 0;
    for (const w of all) {
      const c = cards[this.key(w)];
      if (!c) fresh++;
      else if (c.state === "learning") learning++;
      else review++;
    }
    return { fresh, learning, review };
  },

  answer(rating) {
    const w = this.current;
    const k = this.key(w);
    const card = this.schedule(Store.data.cards[k] || this.newCard(), rating);
    Store.data.cards[k] = card;
    this.reviewed++;
    Store.logReview();
    // Cards still in learning come back later in this session.
    if (card.state === "learning") this.queue.push(w);
    this.draw();
  }
};
