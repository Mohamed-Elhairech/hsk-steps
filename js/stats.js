// stats.js: works out the numbers shown on Home and Progress.
// A character counts as studied once any word containing it has been studied
// on a flashcard (rated Good or Easy). Each character belongs to the first
// lesson where it appears, following the order HSK 1 lesson 1 to HSK 3 lesson 18.

const Stats = {
  async compute() {
    const levels = [];
    const firstSeen = new Set();
    const studiedChars = new Set();
    const isHan = (c) => /[一-鿿]/.test(c);

    // First pass: which characters have been studied anywhere.
    const courses = {};
    for (const info of LEVELS) {
      courses[info.id] = await App.getCourse(info.id);
      for (const w of App.allWords(courses[info.id])) {
        if (Store.isStudied(info.id, w.hanzi)) [...w.hanzi].filter(isHan).forEach((c) => studiedChars.add(c));
      }
    }

    const now = Date.now();
    for (const info of LEVELS) {
      const course = courses[info.id];
      const level = { id: info.id, words: 0, studied: 0, mastered: 0, due: 0, chars: 0, charsStudied: 0, lessons: [] };
      for (const l of course.lessons) {
        const newChars = [];
        for (const w of l.words) {
          for (const c of w.hanzi) {
            if (isHan(c) && !firstSeen.has(c)) { firstSeen.add(c); newChars.push(c); }
          }
        }
        const studiedWords = l.words.filter((w) => Store.isStudied(info.id, w.hanzi)).length;
        level.words += l.words.length;
        level.studied += studiedWords;
        level.mastered += l.words.filter((w) => Store.isMastered(info.id, w.hanzi)).length;
        level.due += l.words.filter((w) => {
          const c = Store.data.cards[info.id + ":" + w.hanzi];
          return c && c.due <= now;
        }).length;
        const done = newChars.filter((c) => studiedChars.has(c));
        level.chars += newChars.length;
        level.charsStudied += done.length;
        const q = Store.data.quiz[info.id + "-" + l.id];
        level.lessons.push({
          id: l.id, title: l.title, words: l.words.length, studiedWords,
          chars: newChars, charsDone: done, finished: Boolean(Store.data.lessonsDone[info.id + "-" + l.id]),
          quiz: q ? Math.round(q.right / q.total * 100) : null, quizCount: q ? q.total : 0
        });
      }
      levels.push(level);
    }

    const quizAll = Object.values(Store.data.quiz).reduce((a, q) => ({ right: a.right + q.right, total: a.total + q.total }), { right: 0, total: 0 });
    return {
      levels,
      totalChars: firstSeen.size,
      studiedChars: studiedChars.size,
      accuracy: quizAll.total ? Math.round(quizAll.right / quizAll.total * 100) : null,
      answers: quizAll.total
    };
  }
};
