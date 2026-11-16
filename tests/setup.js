const SystemDate = Date;
window.testDay = 28;
window.Date = class extends SystemDate {
  constructor(...args) {
    super(...(args.length ? args : [new SystemDate(2026, 8, window.testDay, 12).getTime()]));
  }

  static now() {
    return new Date().getTime();
  }
};

localStorage.setItem("ogonek-onb", "1");
localStorage.setItem("ogonek-rv-year1", JSON.stringify({ v: 3, planChosen: true }));
