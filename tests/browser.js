(async () => {
  const app = window.Ogonek;
  const results = [];
  let failures = 0;

  function equal(actual, expected) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(`Ожидалось ${JSON.stringify(expected)}, получено ${JSON.stringify(actual)}`);
    }
  }

  async function run(name, scenario) {
    try {
      window.testDay = 28;
      app.setState({ ...app.fresh(), planChosen: true });
      window.ogSetPage("home");
      await scenario();
      results.push(`PASS ${name}`);
    } catch (error) {
      failures++;
      results.push(`FAIL ${name}: ${error.stack}`);
    }
  }

  function element(selector) {
    const match = document.querySelector(selector);
    if (!match) throw new Error(`Элемент не найден: ${selector}`);
    return match;
  }

  function mark(index) {
    const button = element(`#testaments .tcard:nth-child(${index}) .tbtn`);
    button.click();
    button.click();
  }

  function answer(id, value) {
    const buttons = document.querySelectorAll(`#quiz .qcard[data-id="${id}"] .qopt`);
    const button = [...buttons].find(option => option.textContent === value);
    if (!button) throw new Error(`Вариант ответа не найден: ${id}`);
    button.click();
  }

  await run("Модули новой архитектуры загружены", () => {
    for (const name of ["OgonekBibleSchedule","OgonekIcons","OgonekDates","OgonekStateSchema","OgonekSounds","OgonekProgressVisual","OgonekAwardVisual","OgonekBibleVerses","OgonekReadingProgress"]) {
      equal(typeof window[name], "object");
    }
    equal(typeof window.OgonekProgressVisual.ignite, "function");
    equal(window.OgonekStateSchema.create(["nt","ot"]).fresh().v, 3);
    equal(window.OgonekBibleSchedule.buildSched({id:"spb"}).id, "spb");
  });

  await run("Церковный план открывает нужные отрывки", () => {
    equal(app.planId, "spb");
    equal(window.ogChurchToday().refs, ["Мф. 1:1–2", "Быт. 1:1–5"]);
    equal(element("#testaments .tlink").href, "https://bible.recoveryversion.ru/matt/1/1");
  });

  await run("Чтение двух заветов зажигает пламя без модального окна, XP можно отменить", () => {
    const button = element("#testaments .tcard .tbtn");
    button.click();
    equal(app.getState().nt.read, []);
    button.click();
    equal(app.getState().nt.log, [{ d: "2026-09-28", p: 0 }]);
    equal(app.getState().xp, 10);
    equal(element("#celebrate").hidden, true);
    equal(app.summary().streak, 1);

    mark(2);
    equal(app.getState().ot.read, [0]);
    equal(app.getState().xp, 30);
    equal(element("#celebrate").hidden, true);
    equal(element("#toast").textContent.includes("Оба отрывка прочитаны"), true);
    const saved = JSON.parse(localStorage.getItem("ogonek-rv-year1"));
    equal(saved.ot.read, [0]);
    equal(saved.xp, 30);

    element("#toast .toastbtn").click();
    equal(app.getState().nt.read, [0]);
    equal(app.getState().ot.read, []);
    equal(app.getState().xp, 10);
    equal(element("#celebrate").hidden, true);
  });

  await run("Викторина открывается после чтения и даёт XP за первую попытку", async () => {
    equal(document.querySelectorAll("#quiz .qopt").length, 0);
    mark(1);
    mark(2);

    const xp = app.getState().xp;
    const questions = window.QUIZ_D[0];
    answer("nt-0", questions.nt[2]);
    equal(app.getState().quiz["nt-0"].wrong, [questions.nt[2]]);
    equal(app.getState().xp, xp);
    answer("nt-0", questions.nt[1]);
    equal(app.getState().quiz["nt-0"].first, false);
    equal(app.getState().xp, xp);
    await new Promise(resolve => setTimeout(resolve, 2100));
    answer("ot-0", questions.ot[1]);
    equal(app.getState().quiz["ot-0"].first, true);
    equal(app.getState().xp, xp + 5);
    answer("ot-0", questions.ot[1]);
    equal(app.getState().xp, xp + 5);
  });

  await run("Прочитанные заранее отрывки сохраняют серию через пропущенный день", () => {
    window.testDay = 30;
    const progress = {
      log: [{ d: "2026-09-28", p: 0 }, { d: "2026-09-28", p: 1 }],
      read: [0, 1],
    };
    app.setState({ ...app.fresh(), planChosen: true, nt: progress, ot: progress });
    equal(app.getState().frzDays, ["2026-09-29"]);
    equal(app.summary().streak, 2);
  });

  await run("Своё расписание разбивает книгу на главы и хранит отдельный прогресс", () => {
    const id = "test-jude";
    window.ogPlanAdd({
      id, name: "Послание Иуды", books: ["Иуд."], start: app.today(),
      by: "chapters", amount: 1,
    });
    equal(window.ogPlanToday(id).refs, ["Иуд. 1"]);
    equal(window.ogPlanToday(id).done, false);
    window.ogPlanMark(id);
    window.ogPlanMark(id);
    equal(app.getState().plans[id].nt.read, [0]);
    equal(app.getState().nt.read, []);
    equal(window.ogPlanToday(id).done, true);
    equal(window.ogPlanNext(id), null);
    window.ogPlanUndo(id);
    equal(window.ogPlanToday(id).done, false);
  });

  await run("Сохранение старого формата восстанавливает отметки и убирает дубликаты", () => {
    app.setState({
      v: 2,
      nt: { log: [{ d: app.today(), p: 0 }, { d: app.today(), p: 0 }] },
      xp: 20,
    });
    equal(app.getState().v, 3);
    equal(app.getState().nt.read, [0]);
    equal(app.getState().xp, 20);
    equal(app.summary().ntNext, 1);
  });

  await run("Расписание не позволяет отмечать дни задним числом", () => {
    window.testDay = 29;
    app.setState({ ...app.fresh(), planChosen: true });
    window.ogSetPage("plan");
    const past = element("#sched .scheck.past");
    past.click();
    past.click();
    equal(app.getState().nt.read, []);
    equal(app.getState().ot.read, []);
  });

  await run("Главное расписание определяет книгу и огонёк на глобусе", () => {
    const id = "test-globe";
    window.ogPlanAdd({
      id, name: "Мой план", books: ["Иуд.", "Откр."], start: app.today(),
      by: "chapters", amount: 1,
    });
    mark(2);
    const globe = window.OgonekGlobe;
    const position = () => globe.schedulePosition(app.summary().globeSchedule, app.today());
    equal(position().spots, [{ b: globe.bookIndex("Мф."), l: false }, { b: globe.bookIndex("Быт."), l: true }]);

    window.ogSetPage("plan");
    element('button[aria-label="Сделать главным: Мой план"]').click();
    equal(element("#schedList .sllab.main + .slwrap .stl b").textContent, "Мой план");
    equal(position().refs, ["Новый Завет: Иуд. 1"]);
    equal(position().spots, [{ b: globe.bookIndex("Иуд."), l: false }]);
    equal(app.getState().ot.read, [0]);
    equal(JSON.parse(localStorage.getItem("ogonek-rv-year1")).globeSchedule, id);

    window.ogPlanMark(id);
    equal(position().refs, ["Новый Завет: Откр. 1"]);
    equal(position().spots, [{ b: globe.bookIndex("Откр."), l: true }]);
    window.ogPlanRemove(id);
    equal(position().b, globe.bookIndex("Мф."));
  });

  await run("Книга служения отображается на глобусе среди других расписаний", () => {
    const id = "test-ministry";
    const name = "Читаю служение";
    window.ogPlanAdd({ id, name, ms: 559, start: app.today(), by: "pages", amount: 1 });
    window.ogSetPage("plan");
    element('button[aria-label="Сделать главным: Читаю служение"]').click();
    const globe = window.OgonekGlobe;
    const position = globe.schedulePosition(app.summary().globeSchedule, app.today());
    equal(position.plan, name);
    equal(position.b, -1);
    equal(position.spots, []);

    globe.open({ people: [{ ...position, id: "test", name: "Руслан", rel: "me" }] });
    try {
      equal(element(".gother").hidden, false);
      element(".gother").click();
      equal(element(".gcard .gname").textContent, "Другие расписания");
      element(".gcard .gppl button").click();
      equal(element(".gcard .gname").textContent, "Руслан (вы)");
      equal(element(".gcard .gline:last-child").textContent, name);
    } finally {
      globe.close();
    }
  });

  await run("Челлендж можно выбрать главным среди трёх расписаний", () => {
    window.testDay = 35;
    app.setState({
      ...app.fresh(), planChosen: true, tracks: { spb: true, conf: true },
      conf: { joined: "2026-10-01" },
    });
    window.ogPlanAdd({
      id: "test-extra", name: "Мой план", books: ["Иуд."], start: app.today(),
      by: "chapters", amount: 1,
    });
    window.ogSetPage("plan");
    element('button[aria-label="Сделать главным: «Божья гора»"]').click();
    const labels = [...document.querySelectorAll("#schedList .sllab")];
    equal(labels.map(label => label.firstChild.textContent), [
      "✓ Главное расписание", "Расписание 2", "Расписание 3",
    ]);
    const globe = window.OgonekGlobe;
    const position = globe.schedulePosition(app.summary().globeSchedule, app.today());
    equal(position.plan, "Божья гора");
    equal(position.b, globe.bookIndex("Исх."));
    element('button[aria-label="Сделать главным: Церковь"]').click();
    equal(globe.schedulePosition(app.summary().globeSchedule, app.today()).b, globe.bookIndex("Мф."));
  });

  await run("Расписание жизненной группы можно сделать главным", () => {
    window.ogPlanAdd({
      id: "fire-TEST01", name: "Чтение группы", books: ["Иуд."], start: app.today(),
      by: "chapters", amount: 1,
    });
    window.ogSetPage("plan");
    element('button[aria-label="Сделать главным: Чтение группы"]').click();
    equal(app.summary().globeSchedule.passages[0].ref, "Иуд. 1");
    window.ogPlanRemove("fire-TEST01");
    equal(app.summary().globeSchedule.passages[0].ref, "Мф. 1:1–2");
  });

  await run("При повторном открытии сохраняются главное расписание и позиция на глобусе", async () => {
    const id = "test-restore";
    window.ogPlanAdd({
      id, name: "Мой сохранённый план", books: ["Иуд.", "Откр."], start: app.today(),
      by: "chapters", amount: 1,
    });
    window.ogPlanMark(id);
    mark(2);
    window.ogSetPage("plan");
    element('button[aria-label="Сделать главным: Мой сохранённый план"]').click();

    const frame = document.createElement("iframe");
    frame.hidden = true;
    frame.src = "/?restore=1";
    const loaded = new Promise(resolve => frame.addEventListener("load", resolve, { once: true }));
    document.body.append(frame);
    try {
      await loaded;
      const restored = frame.contentWindow;
      const reopenedApp = restored.Ogonek;
      const globe = restored.OgonekGlobe;
      const position = globe.schedulePosition(reopenedApp.summary().globeSchedule, reopenedApp.today());
      equal(position.plan, "Мой сохранённый план");
      equal(position.refs, ["Новый Завет: Откр. 1"]);
      equal(position.spots, [{ b: globe.bookIndex("Откр."), l: true }]);
      equal(reopenedApp.getState().ot.read, [0]);
      equal(restored.document.querySelector("#schedList .sllab.main + .slwrap .stl b").textContent,
        "Мой сохранённый план");
    } finally {
      frame.remove();
    }
  });

  await run("Отмена чтения не сбрасывает выбор главного расписания для публикации", () => {
    const id = "test-undo-main";
    window.ogPlanAdd({
      id, name: "Мой главный план", books: ["Иуд.", "Откр."], start: app.today(),
      by: "chapters", amount: 1,
    });
    mark(1);
    window.ogSetPage("plan");

    const summaries = [];
    app.onSave = () => summaries.push(app.summary().globeSchedule);
    try {
      element('button[aria-label="Сделать главным: Мой главный план"]').click();
      window.ogSetPage("home");
      element("#testaments .tcard .undolink").click();
      equal(app.getState().nt.read, []);
      equal(app.getState().globeSchedule, id);
      equal(summaries.map(schedule => schedule.name), ["Мой главный план", "Мой главный план"]);
      equal(summaries[1].passages, [{ ref: "Иуд. 1", url: "https://bible.recoveryversion.ru/jude/1/1", key: "nt", label: "Новый Завет", ahead: 0, last: "" }]);
    } finally {
      app.onSave = null;
    }
  });

  const report = document.createElement("pre");
  report.id = "browser-test-report";
  report.dataset.result = failures ? "fail" : "pass";
  report.textContent = results.join("\n");
  document.body.append(report);
})();
