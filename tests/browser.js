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

  await run("Церковный план открывает нужные отрывки", () => {
    equal(app.planId, "spb");
    equal(window.ogChurchToday().refs, ["Мф. 1:1–2", "Быт. 1:1–5"]);
    equal(element("#testaments .tlink").href, "https://bible.recoveryversion.ru/matt/1/1");
  });

  await run("Два нажатия отмечают чтение, общий огонёк и XP можно отменить", () => {
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
    equal(element("#celebrate").hidden, false);
    const saved = JSON.parse(localStorage.getItem("ogonek-rv-year1"));
    equal(saved.ot.read, [0]);
    equal(saved.xp, 30);

    element("#celebUndo").click();
    equal(app.getState().nt.read, [0]);
    equal(app.getState().ot.read, []);
    equal(app.getState().xp, 10);
    equal(element("#celebrate").hidden, true);
  });

  await run("Викторина открывается после чтения и даёт XP за первую попытку", async () => {
    equal(document.querySelectorAll("#quiz .qopt").length, 0);
    mark(1);
    mark(2);
    element("#celebClose").click();

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

  const report = document.createElement("pre");
  report.id = "browser-test-report";
  report.dataset.result = failures ? "fail" : "pass";
  report.textContent = results.join("\n");
  document.body.append(report);
})();
