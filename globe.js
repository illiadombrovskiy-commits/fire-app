/* Огонёк: глобус читателей.
   Планета похожа на Землю: материки разделены на страны-книги Библии по порядку.
   Северная Америка — Пятикнижие и исторические книги, Южная Америка — поэтические книги и большие пророки,
   Африка — малые пророки, Европа — Евангелия и Деяния, Азия — послания Павла,
   Австралия — общие послания и Откровение. Читатель стоит на той книге, которую читает сейчас;
   у кого сегодня горит огонёк — над ним пламя, и оно подсвечивает землю вокруг.
   Данные даёт auth.js: OgonekGlobe.open({...}) и OgonekGlobe.setPeople(list). */
(function () {
  "use strict";
  // [сокращение, название, глав]
  const BOOKS = [["Быт.", "Бытие", 50], ["Исх.", "Исход", 40], ["Лев.", "Левит", 27], ["Числ.", "Числа", 36], ["Втор.", "Второзаконие", 34], ["Иис. Н.", "Иисус Навин", 24], ["Суд.", "Судьи", 21], ["Руфь", "Руфь", 4], ["1 Цар.", "1 Царств", 31], ["2 Цар.", "2 Царств", 24], ["3 Цар.", "3 Царств", 22], ["4 Цар.", "4 Царств", 25], ["1 Пар.", "1 Паралипоменон", 29], ["2 Пар.", "2 Паралипоменон", 36], ["Эздр.", "Эздра", 10], ["Неем.", "Неемия", 13], ["Эсф.", "Эсфирь", 10], ["Иов", "Иов", 42], ["Пс.", "Псалмы", 150], ["Притч.", "Притчи", 31], ["Эккл.", "Экклезиаст", 12], ["Песн.", "Песнь Песней", 8], ["Ис.", "Исайя", 66], ["Иер.", "Иеремия", 52], ["Плач", "Плач Иеремии", 5], ["Иез.", "Иезекииль", 48], ["Дан.", "Даниил", 12], ["Ос.", "Осия", 14], ["Иоил.", "Иоиль", 3], ["Ам.", "Амос", 9], ["Авд.", "Авдий", 1], ["Ион.", "Иона", 4], ["Мих.", "Михей", 7], ["Наум", "Наум", 3], ["Авв.", "Аввакум", 3], ["Соф.", "Софония", 3], ["Агг.", "Аггей", 2], ["Зах.", "Захария", 14], ["Мал.", "Малахия", 4], ["Мф.", "По Матфею", 28], ["Мк.", "По Марку", 16], ["Лк.", "По Луке", 24], ["Ин.", "По Иоанну", 21], ["Деян.", "Деяния", 28], ["Рим.", "Римлянам", 16], ["1 Кор.", "1 Коринфянам", 16], ["2 Кор.", "2 Коринфянам", 13], ["Гал.", "Галатам", 6], ["Эф.", "Эфесянам", 6], ["Флп.", "Филиппийцам", 4], ["Кол.", "Колоссянам", 4], ["1 Фес.", "1 Фессалоникийцам", 5], ["2 Фес.", "2 Фессалоникийцам", 3], ["1 Тим.", "1 Тимофею", 6], ["2 Тим.", "2 Тимофею", 4], ["Тит.", "Титу", 3], ["Флм.", "Филимону", 1], ["Евр.", "Евреям", 13], ["Иак.", "Иакова", 5], ["1 Пет.", "1 Петра", 5], ["2 Пет.", "2 Петра", 3], ["1 Ин.", "1 Иоанна", 5], ["2 Ин.", "2 Иоанна", 1], ["3 Ин.", "3 Иоанна", 1], ["Иуд.", "Иуды", 1], ["Откр.", "Откровение", 22]];

  const NA = [[-168,66],[-162,70],[-156,71],[-140,70],[-128,70],[-115,68],[-100,68],[-95,72],[-85,70],[-80,63],[-90,57],[-82,52],[-78,58],[-70,60],[-64,60],[-60,55],[-56,51],[-60,47],[-66,45],[-70,42],[-74,40],[-76,35],[-81,31],[-80,25],[-82,27],[-84,30],[-90,30],[-97,27],[-97,22],[-94,18],[-90,21],[-87,21],[-88,16],[-84,15],[-83,10],[-79,9],[-81,8],[-86,12],[-92,15],[-98,16],[-105,20],[-106,23],[-112,29],[-110,23],[-115,30],[-118,34],[-121,36],[-124,40],[-124,46],[-126,50],[-133,56],[-140,59],[-148,60],[-155,58],[-162,55],[-165,60]],
    GR = [[-73,78],[-60,82],[-35,83],[-20,80],[-20,72],[-30,68],[-42,60],[-50,64],[-55,70],[-60,76]],
    SA = [[-80,9],[-77,8],[-72,12],[-62,11],[-55,6],[-50,2],[-48,-1],[-40,-3],[-35,-6],[-35,-9],[-39,-14],[-39,-18],[-41,-22],[-48,-26],[-53,-33],[-57,-36],[-58,-39],[-62,-41],[-65,-45],[-68,-51],[-69,-55],[-72,-53],[-75,-47],[-74,-40],[-72,-30],[-71,-20],[-76,-14],[-81,-5],[-80,-1],[-78,2]],
    AF = [[-17,21],[-16,28],[-10,30],[-6,35],[0,36],[10,37],[11,33],[20,31],[25,32],[32,31],[34,28],[36,22],[38,18],[43,12],[51,12],[48,5],[40,-3],[40,-11],[36,-20],[33,-26],[28,-33],[20,-35],[18,-32],[15,-26],[12,-17],[13,-12],[12,-5],[9,0],[9,4],[5,6],[-2,5],[-8,4],[-13,8],[-17,14]],
    MG = [[44,-25],[47,-25],[50,-16],[49,-12],[44,-16]],
    EU = [[-10,36],[-9,43],[-2,44],[-1,46],[-5,48],[2,51],[5,53],[8,54],[8,57],[5,58],[5,62],[12,66],[18,70],[25,71],[32,70],[40,67],[45,68],[55,68],[60,68],[60,50],[50,47],[48,42],[40,41],[29,41],[26,40],[24,37],[22,37],[19,41],[15,45],[13,45],[16,41],[18,40],[16,38],[12,42],[8,44],[3,43],[0,39],[-2,37],[-6,36]],
    UK = [[-5,50],[1,51],[2,53],[-1,55],[-2,58],[-6,58],[-5,55],[-3,54],[-5,52]],
    AS = [[60,68],[70,73],[80,73],[90,76],[100,78],[112,74],[130,72],[140,72],[160,70],[170,70],[179,66],[178,62],[165,60],[160,55],[156,51],[162,57],[150,59],[140,54],[142,47],[135,43],[130,42],[127,38],[126,35],[122,37],[121,31],[120,26],[115,22],[108,21],[106,16],[109,12],[105,9],[100,13],[100,7],[103,1],[100,4],[98,9],[97,16],[94,17],[92,22],[88,22],[80,15],[78,8],[73,17],[72,21],[67,25],[58,25],[56,27],[52,24],[56,23],[59,22],[55,17],[44,12],[43,16],[39,22],[35,28],[34,32],[36,36],[30,36],[27,37],[26,40],[29,41],[40,41],[48,42],[50,47],[60,50]],
    JP = [[130,31],[131,34],[135,34],[140,36],[142,40],[141,45],[144,44],[140,41],[139,38],[136,36],[131,33]],
    AU = [[114,-22],[114,-26],[115,-34],[118,-35],[123,-34],[129,-31],[135,-34],[138,-35],[141,-38],[147,-39],[150,-37],[153,-31],[153,-25],[150,-22],[146,-19],[145,-15],[142,-11],[141,-17],[136,-12],[132,-11],[129,-15],[125,-14],[122,-18]],
    NG = [[131,-1],[141,-3],[150,-10],[143,-9],[138,-8],[132,-4]];
  const CONT = [
    { n: "Северная Америка", sec: "Пятикнижие и исторические книги", nt: false, a: 0, b: 17, p: [NA, GR] },
    { n: "Южная Америка", sec: "Поэтические книги и большие пророки", nt: false, a: 17, b: 27, p: [SA] },
    { n: "Африка", sec: "Малые пророки", nt: false, a: 27, b: 39, p: [AF, MG] },
    { n: "Европа", sec: "Евангелия и Деяния", nt: true, a: 39, b: 44, p: [EU] },
    { n: "Азия", sec: "Послания Павла", nt: true, a: 44, b: 58, p: [AS, JP] },
    { n: "Австралия", sec: "Общие послания и Откровение", nt: true, a: 58, b: 66, p: [AU, NG] }
  ];

  const D = Math.PI / 180, TAU = Math.PI * 2;
  const vec = (la, lo) => { const c = Math.cos(la * D); return [c * Math.sin(lo * D), Math.sin(la * D), c * Math.cos(lo * D)]; };
  const nrm = (v) => { const m = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / m, v[1] / m, v[2] / m]; };
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const sum = (arr) => arr.reduce((s, v) => [s[0] + v[0], s[1] + v[1], s[2] + v[2]], [0, 0, 0]);
  function pip(x, y, p) { let s = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) { const [xi, yi] = p[i], [xj, yj] = p[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) s = !s; } return s; }
  function dens(p) { const o = []; p.forEach((a, i) => { const b = p[(i + 1) % p.length], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 2)); for (let k = 0; k < n; k++) { const t = k / n; o.push(vec(a[1] + (b[1] - a[1]) * t, a[0] + (b[0] - a[0]) * t)); } }); return o; }
  function dens3(p) { const o = []; p.forEach((a, i) => { const b = p[(i + 1) % p.length], ang = Math.acos(Math.max(-1, Math.min(1, dot(a, b)))), n = Math.max(1, Math.ceil(ang / (2 * D))); for (let k = 0; k < n; k++) { const t = k / n; o.push(nrm([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t])); } }); return o; }
  // отрезаем от многоугольника на сфере всё, что по другую сторону от плоскости n (граница — ровная дуга)
  function clipPoly(poly, n) { const out = []; for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length], da = dot(a, n), db = dot(b, n); if (da >= 0) out.push(a); if ((da >= 0) !== (db >= 0)) { const t = da / (da - db); out.push(nrm([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t])); } } return out; }
  // сглаживание берега (Чайкин): острые углы заливов становятся плавными
  function smooth(p, n) { for (let r = 0; r < n; r++) { const o = []; p.forEach((a, i) => { const b = p[(i + 1) % p.length]; o.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); }); p = o; } return p; }
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const OTS = ["#cdb174", "#b39554", "#dcc792"], NTS = ["#5db078", "#43945e", "#7cc692"];

  /* ---------- карта: строится один раз ---------- */
  let books = null, ANT = null, ICE = null, ISL_VS = null;
  function build() {
    if (books) return;
    books = [];
    const G = 3;
    CONT.forEach((c) => {
      c.p = c.p.map((p) => smooth(p, 2));
      c.vs = c.p.map(dens);
      const cells = [];
      for (let la = -58; la <= 84; la += G) {
        const st = G / Math.max(0.22, Math.cos(la * D));
        for (let lo = -180 + st / 2; lo < 180; lo += st) if (c.p.some((p) => pip(lo, la, p))) cells.push({ la, lo, v: vec(la, lo) });
      }
      // змейкой с севера на юг: соседние книги по порядку оказываются рядом
      cells.sort((x, y) => { const bx = Math.floor((84 - x.la) / 10), by = Math.floor((84 - y.la) / 10); if (bx !== by) return bx - by; const d = bx % 2 ? -1 : 1; return (x.lo - y.lo) * d || y.la - x.la; });
      const list = BOOKS.slice(c.a, c.b), ws = list.map((b) => 2 + Math.pow(b[2], 0.6)), tot = ws.reduce((s, x) => s + x, 0);
      let pos = 0, acc = 0;
      const bk = list.map((b, i) => {
        acc += ws[i];
        const end = Math.max(pos + 1, Math.round(cells.length * acc / tot)), ch = cells.slice(pos, end); pos = end;
        const o = { i: c.a + i, name: b[1], ch: b[2], cont: c, seed: nrm(sum(ch.map((q) => q.v))), cells: [], people: [], col: hex((c.nt ? NTS : OTS)[i % 3]) };
        books.push(o); return o;
      });
      cells.forEach((q) => { let best = bk[0], bd = -2; bk.forEach((o) => { const d = dot(o.seed, q.v); if (d > bd) { bd = d; best = o; } }); best.cells.push(q); });
      c.bk = bk;
      bk.forEach((o) => {
        // область книги — выпуклая (ровные прямые границы); по берегу её обрезает материк при рисовании
        const s0 = o.seed, ax = Math.abs(s0[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
        const e1 = nrm([s0[1] * ax[2] - s0[2] * ax[1], s0[2] * ax[0] - s0[0] * ax[2], s0[0] * ax[1] - s0[1] * ax[0]]);
        const e2 = [s0[1] * e1[2] - s0[2] * e1[1], s0[2] * e1[0] - s0[0] * e1[2], s0[0] * e1[1] - s0[1] * e1[0]];
        const rr = 70 * D; let poly = [];
        for (let k = 0; k < 72; k++) { const a = k / 72 * TAU, ca = Math.cos(a), sa = Math.sin(a); poly.push(nrm([0, 1, 2].map((j) => Math.cos(rr) * s0[j] + Math.sin(rr) * (ca * e1[j] + sa * e2[j])))); }
        bk.forEach((q) => { if (q === o || poly.length < 3) return; poly = clipPoly(poly, [s0[0] - q.seed[0], s0[1] - q.seed[1], s0[2] - q.seed[2]]); });
        o.poly = poly.length > 2 ? dens3(poly) : [];
        if (!o.cells.length) o.cells.push({ v: o.seed });
        o.c = nrm(sum(o.cells.map((q) => q.v)));
        o.cells.sort((x, y) => dot(y.v, o.c) - dot(x.v, o.c));
        o.lat = Math.asin(o.c[1]); o.lon = Math.atan2(o.c[0], o.c[2]);
      });
    });
    books.sort((a, b) => a.i - b.i);
    ANT = []; for (let lo = -180; lo < 180; lo += 3) ANT.push(vec(-70 + 3 * Math.sin(lo * 3 * D) + 2 * Math.sin(lo * 7 * D), lo));
    // «Остров выбора» (остров у Европы): здесь стоят те, кто ещё не выбрал расписание (без книги, огонёк спит)
    const up = smooth(UK.map((x) => x.slice()), 2); ISL_VS = [dens(up)];
    ICE = { i: -1, name: "Остров выбора", isle: true, cells: [], people: [] };
    for (let la = 50.4; la <= 58.4; la += 0.45) for (let lo = -6.5; lo <= 2.5; lo += 0.6) if (pip(lo, la, up)) ICE.cells.push({ la, lo, v: vec(la, lo) });
    ICE.c = nrm(sum(ICE.cells.map((q) => q.v)));
    ICE.lat = Math.asin(ICE.c[1]); ICE.lon = Math.atan2(ICE.c[0], ICE.c[2]);
  }

  // «Мф. 8:23–34» → номер книги (0–65), иначе −1
  function bookIndex(ref) {
    ref = String(ref || "").trim().replace(/^Еф\./, "Эф.").replace(/^Есф\./, "Эсф.").replace(/^Еккл\./, "Эккл.").replace(/^Руф\./, "Руфь"); let best = -1, bl = 0;
    BOOKS.forEach((b, i) => { if ((ref === b[0] || ref.startsWith(b[0] + " ")) && b[0].length > bl) { bl = b[0].length; best = i; } });
    return best;
  }

  /* ---------- стили ---------- */
  const CSS = `
.globebtn{display:flex;align-items:center;gap:12px;width:100%;margin:0 0 12px;padding:10px 14px;border-radius:14px;border:1px solid var(--line);background:linear-gradient(120deg,#0b1030,#1a2a6a);color:#eef0fa;text-align:left;cursor:pointer}
.globebtn b{display:block;font-size:.98rem}.globebtn small{display:block;font-size:.8rem;color:#b9c2ee;margin-top:2px}
.gbplanet{flex:none;width:52px;height:52px;background:url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+PGRlZnM+PGNsaXBQYXRoIGlkPSJjIj48Y2lyY2xlIGN4PSIzMiIgY3k9IjM0IiByPSIyMiIvPjwvY2xpcFBhdGg+PC9kZWZzPjxjaXJjbGUgY3g9IjMyIiBjeT0iMzQiIHI9IjIyIiBmaWxsPSIjMmY2ZmQ2Ii8+PGcgY2xpcC1wYXRoPSJ1cmwoI2MpIj48cGF0aCBmaWxsPSIjY2RiMTc0IiBkPSJNMTAgMjJjNi01IDE0LTQgMTYgMSAxIDQtMyA2LTEgMTAgMiAzIDYgNCA1IDktMSA0LTYgNC04IDktMy01LTktNi0xMS0xMi0yLTYgMy04IDEtMTJ6Ii8+PHBhdGggZmlsbD0iIzVkYjA3OCIgZD0iTTM2IDE2YzctMSAxNCAzIDE4IDktMyAyLTYgMC04IDItMiAzIDEgNy0yIDktMyAyLTYtMS04IDEtMiAzIDAgNy0zIDgtMi00LTUtNi00LTExIDAtNSA1LTYgNC0xMC0xLTMtMy01IDMtOHoiLz48cGF0aCBmaWxsPSIjNWRiMDc4IiBkPSJNNDIgNDRjNC0yIDggMCA5IDMtMiA0LTYgNi0xMCA2IDAtMy0yLTYgMS05eiIvPjwvZz48cGF0aCBmaWxsPSIjZmZmIiBvcGFjaXR5PSIuMTgiIGQ9Ik0zMiAxMmEyMiAyMiAwIDAgMC0xOSAxMWM2LTUgMTUtNyAyNC01IDQgMSA4IDMgMTEgNkEyMiAyMiAwIDAgMCAzMiAxMnoiLz48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgxNiAzMCkgc2NhbGUoLjE2KSI+PHBhdGggZmlsbD0iI2ZmN2ExYSIgZD0iTTMzIDJjMyAxNSAxOSAyNCAxOSA0NmEyMCAyMCAwIDAgMS00MCAwYzAtMTEgNi0xNyAxMC0yMSAwIDggNCAxMyA5IDEzLTMtMTMtMS0yNiAyLTM4eiIvPjxwYXRoIGZpbGw9IiNmZmM1M2QiIGQ9Ik0zMiA0MGM0IDggMTAgMTEgMTAgMjFhMTAgMTAgMCAwIDEtMjAgMGMwLTYgMy05IDYtMTIgMCA0IDIgNyA1IDctMi01LTItMTEtMS0xNnoiLz48L2c+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoNDAgMTgpIHNjYWxlKC4xNikiPjxwYXRoIGZpbGw9IiNmZjdhMWEiIGQ9Ik0zMyAyYzMgMTUgMTkgMjQgMTkgNDZhMjAgMjAgMCAwIDEtNDAgMGMwLTExIDYtMTcgMTAtMjEgMCA4IDQgMTMgOSAxMy0zLTEzLTEtMjYgMi0zOHoiLz48cGF0aCBmaWxsPSIjZmZjNTNkIiBkPSJNMzIgNDBjNCA4IDEwIDExIDEwIDIxYTEwIDEwIDAgMCAxLTIwIDBjMC02IDMtOSA2LTEyIDAgNCAyIDcgNSA3LTItNS0yLTExLTEtMTZ6Ii8+PC9nPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDM2IDQwKSBzY2FsZSguMTMpIj48cGF0aCBmaWxsPSIjZmY3YTFhIiBkPSJNMzMgMmMzIDE1IDE5IDI0IDE5IDQ2YTIwIDIwIDAgMCAxLTQwIDBjMC0xMSA2LTE3IDEwLTIxIDAgOCA0IDEzIDkgMTMtMy0xMy0xLTI2IDItMzh6Ii8+PHBhdGggZmlsbD0iI2ZmYzUzZCIgZD0iTTMyIDQwYzQgOCAxMCAxMSAxMCAyMWExMCAxMCAwIDAgMS0yMCAwYzAtNiAzLTkgNi0xMiAwIDQgMiA3IDUgNy0yLTUtMi0xMS0xLTE2eiIvPjwvZz48cGF0aCBmaWxsPSIjZmZmIiBkPSJNOCA4bDEgMi41IDIuNSAxLTIuNSAxTDggMTVsLTEtMi41LTIuNS0xIDIuNS0xeiIvPjxjaXJjbGUgY3g9IjU3IiBjeT0iNTYiIHI9IjEuNSIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==") center/contain no-repeat;filter:drop-shadow(0 2px 0 rgba(0,0,0,.25))}
.gmodal{position:fixed;inset:0;z-index:34;display:flex;flex-direction:column;background:#05071a;color:#eef0fa;padding:calc(10px + env(safe-area-inset-top,0px)) 12px calc(10px + env(safe-area-inset-bottom,0px));gap:8px}
.gmodal,.gmodal *{touch-action:manipulation;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
.gmodal .gtop{display:flex;align-items:center;gap:10px}
.gmodal .gtop h2{margin:0;font-size:1.15rem;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.gmodal .gtop .gchip{flex:none;font-size:.8rem;padding:6px 10px}
.gmodal .gx{width:40px;height:40px;border-radius:12px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.06);color:#eef0fa;font-size:1.1rem;cursor:pointer}
.gmodal .gsearch{display:flex;gap:8px}
.gmodal input{flex:1;min-width:0;padding:10px 12px;border-radius:12px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.06);color:#eef0fa;font:inherit}
.gmodal .gbtn{padding:9px 12px;border-radius:12px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.06);color:#eef0fa;font:inherit;font-size:.9rem;font-weight:600;cursor:pointer;white-space:nowrap}
.gmodal .gbtn.main{background:#ff8a1f;border-color:#ff8a1f;color:#1c0d00}
.gmodal .gbtn[disabled]{opacity:.6;cursor:default}
.gmodal .gres{display:flex;flex-wrap:wrap;gap:6px}.gmodal .gres:empty{display:none}
.gmodal .gchips{display:flex;gap:6px;flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none}.gmodal .gchips::-webkit-scrollbar{display:none}
.gmodal .gchip{flex:none;white-space:nowrap;font:inherit;font-size:.84rem;padding:6px 11px;border-radius:999px;border:1px solid rgba(255,255,255,.2);background:transparent;color:#c9cff0;cursor:pointer}
.gmodal .gchip{display:inline-flex;align-items:center;gap:6px}
.gmodal .gchip.gisl{border-color:rgba(47,196,168,.7);color:#bff3e8;background:rgba(47,196,168,.14)}.gmodal .gchip.gisl.on{background:rgba(47,196,168,.32)}
.gmodal .gchip.on{background:rgba(255,138,31,.2);border-color:#ff8a1f;color:#ffe2c4}
.gstk{display:inline-grid;place-items:center;flex:none}.gstk svg{width:100%;height:100%;display:block;filter:drop-shadow(0 2px 0 rgba(0,0,0,.25))}
.gmodal .gfl .gstk{margin:0 auto 2px}.gmodal .gppl .gbtn{display:inline-flex;align-items:center;gap:6px}
.gmodal .gstage{position:relative;flex:1;min-height:220px;border-radius:16px;overflow:hidden}
.gmodal canvas{display:block;width:100%;height:100%;touch-action:none;cursor:grab}
.gmodal .gzoom{position:absolute;right:8px;top:8px;display:flex;flex-direction:column;gap:6px}
.gmodal .gzoom button{width:38px;height:38px;border-radius:10px;background:rgba(20,26,58,.8);border:1px solid rgba(255,255,255,.2);color:#eef0fa;font-size:1.2rem;cursor:pointer}
.gmodal .gstat{position:absolute;left:10px;top:10px;font-size:.78rem;color:#aab2e6;pointer-events:none}
.gmodal .ghint{position:absolute;left:10px;bottom:8px;font-size:.78rem;color:#7e86b8;pointer-events:none}
.gmodal .gcard{position:absolute;left:12px;right:12px;bottom:calc(10px + env(safe-area-inset-bottom,0px));z-index:3;box-shadow:0 -6px 24px rgba(0,0,0,.35);background:#141a3a;border:1px solid rgba(255,255,255,.1);border-radius:16px;padding:12px 14px;max-height:38vh;overflow-y:auto}
.gmodal .gmuted{font-size:.88rem;color:#a9b0d6;margin:0}
.gmodal .gperson{display:flex;gap:12px;align-items:center}
.gmodal .gav{width:44px;height:44px;border-radius:50%;flex:none;display:grid;place-items:center;font-weight:700;color:#fff;overflow:hidden}
.gmodal .gav img{width:100%;height:100%;object-fit:cover}
.gmodal .gname{font-weight:700;font-size:1.02rem}
.gmodal .gline{font-size:.86rem;color:#a9b0d6}
.gmodal .gfl{margin-left:auto;text-align:center;font-weight:700;color:#7e86b8}.gmodal .gfl.on{color:#ffb020}
.gmodal .gacts{display:flex;gap:8px;margin-top:10px}.gmodal .gacts .gbtn{flex:1}
.gmodal .gppl{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.gmodal .gcard[hidden]{display:none}
.gmodal .gcx{position:sticky;top:0;float:right;z-index:2;margin:-2px -4px 4px 10px;width:34px;height:34px;border-radius:50%;border:1px solid rgba(255,255,255,.18);background:#222a55;color:#eef0fa;font-size:1rem;line-height:1;cursor:pointer;display:grid;place-items:center}
.gmodal .gvchip{display:inline-grid;place-items:center;width:20px;height:20px;border-radius:50%;background:#ffb020;color:#fff;font-weight:900;font-size:.8rem;line-height:1}
.gmodal .gverse{margin-top:10px;padding:9px 11px;border-radius:12px;background:rgba(255,176,32,.12);border-left:3px solid #ffb020}
.gmodal .gvtop{display:flex;align-items:baseline;gap:8px}.gmodal .gvtop b{color:#ffe2c4}.gmodal .gvtop small{margin-left:auto;color:#a9b0d6;white-space:nowrap}
.gmodal .gvq{color:#ffb020;font-weight:900}
.gmodal .gvw{margin-top:4px;color:#eef0fa;font-size:.9rem;overflow-wrap:anywhere}`;
  function addCss() { if (document.getElementById("globeCss")) return; const s = document.createElement("style"); s.id = "globeCss"; s.textContent = CSS; document.head.append(s); }
  // стикеры в стиле приложения (как значки нижних вкладок)
  const STK = {
    globe: '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="27" fill="#2f6fd6"/><path fill="#5db078" d="M17 15c6-4 14-3 16 2 2 5-3 7-2 11 1 5 8 5 7 11-1 5-7 6-9 12-2-7-8-8-10-14-2-5 3-8 1-12-1-3-5-4-3-10z"/><path fill="#cdb174" d="M44 11c6 3 11 9 13 16-4 1-7-2-10-2s-5 3-8 1c-2-2 0-5-1-8 0-3 3-5 6-7z"/><path fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".4" d="M14 26a19 19 0 0 1 10-12"/></svg>',
    flame: '<svg viewBox="0 0 64 80"><path fill="#ff7a1a" d="M33 2c3 15 19 24 19 46a20 20 0 0 1-40 0c0-11 6-17 10-21 0 8 4 13 9 13-3-13-1-26 2-38z"/><path fill="#ffc53d" d="M32 40c4 8 10 11 10 21a10 10 0 0 1-20 0c0-6 3-9 6-12 0 4 2 7 5 7-2-5-2-11-1-16z"/></svg>',
    flameOff: '<svg viewBox="0 0 64 80"><path fill="#6b7cb0" d="M33 2c3 15 19 24 19 46a20 20 0 0 1-40 0c0-11 6-17 10-21 0 8 4 13 9 13-3-13-1-26 2-38z"/><path fill="#9fb0e0" d="M32 40c4 8 10 11 10 21a10 10 0 0 1-20 0c0-6 3-9 6-12 0 4 2 7 5 7-2-5-2-11-1-16z"/></svg>',
    add: '<svg viewBox="0 0 64 64"><circle cx="25" cy="21" r="11" fill="#8a72f0"/><path fill="#8a72f0" d="M5 56c0-12 9-21 20-21s20 9 20 21z"/><path fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".35" d="M20 17a6 6 0 0 1 8-3"/><circle cx="48" cy="45" r="13" fill="#2fb36b"/><path stroke="#fff" stroke-width="5" stroke-linecap="round" d="M48 38v14M41 45h14"/></svg>',
    pin: '<svg viewBox="0 0 64 64"><path fill="#ff5b3b" d="M32 4a20 20 0 0 1 20 20c0 15-20 36-20 36S12 39 12 24A20 20 0 0 1 32 4z"/><path fill="#b8321c" opacity=".35" d="M32 60S12 39 12 24A20 20 0 0 1 22 7c-3 5-4 11-2 18 3 12 12 35 12 35z"/><circle cx="32" cy="24" r="8" fill="#5b6280"/></svg>'
  };
  function stkEl(k, size) { const s = document.createElement("span"); s.className = "gstk"; s.setAttribute("aria-hidden", "true"); s.style.width = s.style.height = size + "px"; s.innerHTML = STK[k] || ""; return s; }
  function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function btn(text, cls) { const b = el("button", "gbtn" + (cls ? " " + cls : ""), text); b.type = "button"; return b; }

  /* ---------- состояние окна ---------- */
  const COL = ["#D85A30", "#534AB7", "#0F6E56", "#993556", "#185FA5", "#854F0B", "#3B6D11"];
  let opts = null, people = [], root = null, cv = null, ctx = null, raf = 0, W = 0, H = 0, dpr = 1, ro = null;
  let anim = null, OS = 0, yaw = 0, pitch = 0, ty = 0, tp = 0, zoom = 1, tz = 1, vx = 0, vy = 0, fly = false, sel = null, selB = null, filt = "all", t = 0, drag = false, lastT = 0, idleT = 0;
  let clusters = [];
  let cyw = 1, syw = 0, cp = 1, sp = 0, newIdx = -1;
  const L = nrm([-0.55, 0.45, 0.7]), ZMAX = 10; // можно приблизить к самой земле
  const sh = (a) => ((a + Math.PI) % TAU + TAU) % TAU - Math.PI;
  const yday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  // стих, который затронул (сегодня или вчера)
  const hasVerse = (p) => !!(p && p.note && p.nd && p.nd >= yday());
  const today = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  const stars = Array.from({ length: 170 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.3 + 0.3, p: Math.random() * 6 }));

  function rot(v) { const x1 = v[0] * cyw + v[2] * syw, z1 = -v[0] * syw + v[2] * cyw; return [x1, v[1] * cp - z1 * sp, v[1] * sp + z1 * cp]; }
  // ровный перелёт: поворот и приближение/отдаление идут вместе по одной плавной кривой
  function goTo(y1, p1, z1, ms) { p1 = Math.max(-1.45, Math.min(1.45, p1)); z1 = Math.max(0.8, Math.min(ZMAX, z1)); vx = vy = 0; fly = false;
    anim = { t0: performance.now(), d: ms || 1100, y0: yaw, p0: pitch, z0: zoom, y1: yaw + sh(y1 - yaw), p1, z1 }; }
  function flyTo(lat, lon) { ty = yaw + sh(-lon - yaw); tp = Math.max(-1.45, Math.min(1.45, lat)); vx = vy = 0; fly = true; }
  const match = (p) => filt === "fire" ? p.fire : filt === "verse" ? hasVerse(p) : filt === "new" ? (p.rel === "" || p.rel === "req") : true;
  const lit = (c) => 0.55 + 0.45 * Math.max(0, dot(c, L));

  // раскладываем людей по их книгам
  function placePeople() {
    books.forEach((o) => { o.people = []; }); if (ICE) ICE.people = []; const iceN = people.filter((p) => p.b === -2).length;
    const t0 = today();
    people.forEach((p, i) => {
      const o = p.b === -2 ? ICE : books[p.b]; if (!o) { p.o = null; return; }
      const k = o.people.length; o.people.push(p); p.o = o;
      const n = o.cells.length, st = o === ICE ? Math.max(1, Math.floor(n / Math.max(1, Math.min(n, iceN)))) : 2, q = o.cells[(k * st) % n];
      let v = q.v;
      if (k * 2 >= n) { const j = Math.floor(k * 2 / n), a = k * 2.4; v = nrm([v[0] + Math.cos(a) * 0.012 * j, v[1] + Math.sin(a) * 0.012 * j, v[2] + Math.sin(a + 1) * 0.012 * j]); }
      p.v = v; p.lat = Math.asin(v[1]); p.lon = Math.atan2(v[0], v[2]); p.ph = i * 1.3; p.col = COL[i % 7];
      p.fire = p.spotLit !== undefined ? p.spotLit : p.lit === t0;
    });
  }

  function ring(path, vs, cx, cy, R) {
    const pr = vs.map(rot); if (!pr.some((p) => p[2] > 0)) return false;
    pr.forEach((p, i) => { let x = p[0], y = p[1]; if (p[2] < 0) { const m = Math.hypot(x, y) || 1; x /= m; y /= m; } const X = cx + x * R, Y = cy - y * R; i ? path.lineTo(X, Y) : path.moveTo(X, Y); });
    path.closePath(); return true;
  }
  function coast(vs, cx, cy, R) {
    const pr = vs.map(rot); ctx.beginPath();
    for (let i = 0; i < pr.length; i++) { const a = pr[i], b = pr[(i + 1) % pr.length]; if (a[2] > 0 && b[2] > 0) { ctx.moveTo(cx + a[0] * R, cy - a[1] * R); ctx.lineTo(cx + b[0] * R, cy - b[1] * R); } }
    ctx.stroke();
  }
  // «спящий» огонёк: человек сегодня ещё не читал — синий, неподвижный, чуть «дышит»
  function sleepFlame(x, y, s, f) {
    const h = 15 * s * f, w = 6 * s; ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = "#6b7cb0"; ctx.beginPath(); ctx.moveTo(0, -h); ctx.bezierCurveTo(w * 0.9, -h * 0.45, w * 1.1, -h * 0.05, 0, 2 * s); ctx.bezierCurveTo(-w * 1.1, -h * 0.05, -w * 0.9, -h * 0.45, 0, -h); ctx.fill();
    ctx.fillStyle = "#9fb0e0"; ctx.beginPath(); ctx.ellipse(0, -h * 0.2, w * 0.4, h * 0.24, 0, 0, TAU); ctx.fill(); ctx.restore();
  }
  function flame(x, y, s, f) {
    const h = 15 * s * f, w = 6 * s; ctx.save(); ctx.translate(x, y);
    const g = ctx.createLinearGradient(0, -h, 0, 2); g.addColorStop(0, "#fff3a0"); g.addColorStop(0.45, "#ffb020"); g.addColorStop(1, "#ff4a1a");
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, -h); ctx.bezierCurveTo(w * 0.9, -h * 0.45, w * 1.1, -h * 0.05, 0, 2 * s); ctx.bezierCurveTo(-w * 1.1, -h * 0.05, -w * 0.9, -h * 0.45, 0, -h); ctx.fill();
    ctx.fillStyle = "rgba(255,250,220,.9)"; ctx.beginPath(); ctx.ellipse(0, -h * 0.2, w * 0.33, h * 0.2, 0, 0, TAU); ctx.fill(); ctx.restore();
  }

  function size() {
    if (!cv) return; const st = cv.parentElement;
    W = st.clientWidth || 360; H = st.clientHeight || 360; dpr = window.devicePixelRatio || 1;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  }

  function frame(ts) {
    raf = requestAnimationFrame(frame);
    t = ts / 1000;
    if (anim) {
      const k = Math.min(1, (performance.now() - anim.t0) / anim.d), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      yaw = anim.y0 + (anim.y1 - anim.y0) * e; pitch = anim.p0 + (anim.p1 - anim.p0) * e; zoom = Math.exp(Math.log(anim.z0) + (Math.log(anim.z1) - Math.log(anim.z0)) * e);
      ty = yaw; tp = pitch; tz = zoom; if (k >= 1) { anim = null; idleT = performance.now(); }
    } else {
    if (!drag) { ty += vx; tp += vy; vx *= 0.95; vy *= 0.95; if (!fly && !sel && !selB && ts - idleT > 2500) ty += 0.0011; }
    tp = Math.max(-1.45, Math.min(1.45, tp));
    const k = fly ? 0.1 : 0.28; yaw += (ty - yaw) * k; pitch += (tp - pitch) * k; zoom += (tz - zoom) * 0.18;
    }
    if (fly && Math.abs(ty - yaw) < 0.002 && Math.abs(tp - pitch) < 0.002) fly = false;
    cyw = Math.cos(yaw); syw = Math.sin(yaw); cp = Math.cos(pitch); sp = Math.sin(pitch);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = "#05071a"; ctx.fillRect(0, 0, W, H);
    [[0.12, 0.18, 0.55, "rgba(120,70,210,.20)"], [0.92, 0.88, 0.6, "rgba(255,110,60,.10)"]].forEach((n) => { const g = ctx.createRadialGradient(W * n[0], H * n[1], 0, W * n[0], H * n[1], W * n[2]); g.addColorStop(0, n[3]); g.addColorStop(1, "rgba(0,0,0,0)"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); });
    stars.forEach((s) => { const x = ((s.x * W + yaw * 25) % W + W) % W, y = ((s.y * H + pitch * 25) % H + H) % H; ctx.fillStyle = "rgba(255,255,255," + (0.35 + 0.4 * Math.sin(t * 1.5 + s.p) ** 2) + ")"; ctx.fillRect(x, y, s.r, s.r); });
    // размер окна меняется (карточка внизу появилась/скрылась) — глобус подстраивается плавно, без рывка
    const cdv = root && root.querySelector(".gcard"), occ = cdv && !cdv.hidden ? Math.min(H * 0.5, cdv.offsetHeight + 6) : 0;
    OS += (occ - OS) * 0.12; if (Math.abs(occ - OS) < 0.5) OS = occ;
    const R = Math.min(W, H - OS) * 0.42 * zoom, cx = W / 2, cy = (H - OS) / 2, lx = cx + L[0] * R * 0.55, ly = cy - L[1] * R * 0.55;
    let g = ctx.createRadialGradient(cx, cy, R * 0.92, cx, cy, R * 1.22); g.addColorStop(0, "rgba(90,160,255,.45)"); g.addColorStop(1, "rgba(90,160,255,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * 1.22, 0, TAU); ctx.fill();
    g = ctx.createRadialGradient(lx, ly, R * 0.05, cx, cy, R); g.addColorStop(0, "#3b86e8"); g.addColorStop(0.55, "#164a9e"); g.addColorStop(1, "#061433"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip();
    const ap = new Path2D(); if (ring(ap, ANT, cx, cy, R)) { ctx.fillStyle = "#dde6f0"; ctx.fill(ap); }
    ctx.lineJoin = "round";
    books.forEach((o) => { const c = rot(o.c); o.z = c[2]; o.path = null; o.sx = cx + c[0] * R; o.sy = cy - c[1] * R; o.lc = lit(c); });
    CONT.forEach((c) => {
      const land = new Path2D(); let vis = false; c.vs.forEach((vs) => { if (ring(land, vs, cx, cy, R)) vis = true; });
      c.path = vis ? land : null; if (!vis) return;
      ctx.save(); ctx.clip(land);
      c.bk.forEach((o) => {
        const path = new Path2D(); if (!o.poly.length || !ring(path, o.poly, cx, cy, R)) return;
        const d = o.lc; ctx.fillStyle = "rgb(" + (o.col[0] * d | 0) + "," + (o.col[1] * d | 0) + "," + (o.col[2] * d | 0) + ")"; ctx.fill(path);
        if (o === selB) { ctx.fillStyle = "rgba(255,255,255,.25)"; ctx.fill(path); }
        o.path = path;
      });
      ctx.strokeStyle = "rgba(60,40,15,.35)"; ctx.lineWidth = 0.9; c.bk.forEach((o) => { if (o.path) ctx.stroke(o.path); });
      if (selB && selB.cont === c && selB.path) { ctx.strokeStyle = "#fff"; ctx.lineWidth = 2.5; ctx.stroke(selB.path); }
      ctx.restore();
    });
    {
      const ip = new Path2D(); let iv = false; ISL_VS.forEach((vs) => { if (ring(ip, vs, cx, cy, R)) iv = true; }); ICE.path = iv ? ip : null;
      const c = rot(ICE.c); ICE.z = c[2]; ICE.sx = cx + c[0] * R; ICE.sy = cy - c[1] * R;
      if (iv) { const d = lit(c); ctx.fillStyle = "rgb(" + (150 * d | 0) + "," + (232 * d | 0) + "," + (214 * d | 0) + ")"; ctx.fill(ip); if (selB === ICE) { ctx.fillStyle = "rgba(255,255,255,.25)"; ctx.fill(ip); } }
    }
    ctx.strokeStyle = "rgba(255,245,215,.65)"; ctx.lineWidth = 1.2; CONT.forEach((c) => c.vs.forEach((vs) => coast(vs, cx, cy, R)));
    ctx.strokeStyle = "#2fc4a8"; ctx.lineWidth = 2; ISL_VS.forEach((vs) => coast(vs, cx, cy, R));
    g = ctx.createRadialGradient(lx, ly, R * 0.25, lx, ly, R * 1.9); g.addColorStop(0, "rgba(2,4,24,0)"); g.addColorStop(1, "rgba(2,4,24,.62)"); ctx.fillStyle = g; ctx.fillRect(cx - R, cy - R, 2 * R, 2 * R);
    // свет огоньков
    ctx.globalCompositeOperation = "lighter";
    // свет: горящие рядом люди дают одно общее зарево (чем больше людей, тем ярче и шире, но без пересвета)
    const gl = new Map(), GS = 56;
    people.forEach((p) => {
      if (!p.o) { p.z = -1; return; }
      const v = rot(p.v); p.z = v[2]; p.sx = cx + v[0] * R; p.sy = cy - v[1] * R;
      if (!p.fire || v[2] < 0) return;
      const k = Math.floor(p.sx / GS) + "," + Math.floor(p.sy / GS); let b = gl.get(k); if (!b) gl.set(k, b = { x: 0, y: 0, z: 0, n: 0, m: 0, ph: p.ph }); b.x += p.sx; b.y += p.sy; b.z += v[2]; b.n++; if (match(p)) b.m++;
    });
    gl.forEach((b) => {
      const x = b.x / b.n, y = b.y / b.n, z = b.z / b.n, fl = 0.85 + 0.15 * Math.sin(t * 7 + b.ph);
      const rr = Math.min(R * 0.1 * (0.8 + 0.25 * Math.sqrt(b.n)), 64) * (0.4 + 0.6 * z) * (b.m ? 1 : 0.5), a = Math.min(0.5, 0.32 + 0.04 * Math.sqrt(b.n));
      const q = ctx.createRadialGradient(x, y, 0, x, y, rr); q.addColorStop(0, "rgba(255,160,60," + (a * fl) + ")"); q.addColorStop(0.4, "rgba(255,100,30," + (0.18 * fl) + ")"); q.addColorStop(1, "rgba(255,80,20,0)");
      ctx.fillStyle = q; ctx.beginPath(); ctx.arc(x, y, rr, 0, TAU); ctx.fill();
    });
    ctx.globalCompositeOperation = "source-over"; ctx.restore();
    ctx.strokeStyle = "rgba(140,190,255,.55)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
    if (ICE.path && ICE.z > 0.1 && ICE.people.length) {
      const ph = (t % 1.8) / 1.8, rr = R * 0.075 + 8 + ph * 10;
      ctx.globalAlpha = Math.min(1, ICE.z * 2) * (0.9 - ph * 0.7); ctx.strokeStyle = "#2fc4a8"; ctx.lineWidth = 2.5; ctx.setLineDash([5, 5]);
      ctx.beginPath(); ctx.arc(ICE.sx, ICE.sy, rr, 0, TAU); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
    }
    // названия книг
    ctx.textAlign = "center"; const fs = Math.round(11 + 1.2 * Math.min(zoom, 2)); ctx.font = "600 " + fs + "px system-ui,sans-serif";
    // подписи без наложения: сначала выбранная и крупные книги, мелкие — если есть место
    ctx.lineJoin = "round"; ctx.miterLimit = 2;
    const taken = [];
    books.filter((o) => o.path && o.z > 0.35).concat(ICE.path && ICE.z > 0.35 ? [ICE] : []).sort((a, b) => (b === ICE) - (a === ICE) || (b === selB) - (a === selB) || b.cells.length - a.cells.length).forEach((o) => {
      const oy = o === ICE ? o.sy + R * 0.055 : o.sy, w = ctx.measureText(o.name).width + 6, x0 = o.sx - w / 2, y0 = oy + 2, r = [x0, y0, x0 + w, y0 + fs + 4];
      if (taken.some((q) => r[0] < q[2] && r[2] > q[0] && r[1] < q[3] && r[3] > q[1])) return;
      taken.push(r);
      const a = Math.min(1, (o.z - 0.35) / 0.35); ctx.lineWidth = 3; ctx.strokeStyle = "rgba(4,8,30," + (0.7 * a) + ")"; ctx.strokeText(o.name, o.sx, oy + fs + 2); ctx.fillStyle = o === ICE ? "rgba(191,243,232," + a + ")" : "rgba(240,244,255," + a + ")"; ctx.fillText(o.name, o.sx, oy + fs + 2);
    });
    // люди. Где плотно — собираем в «костёр» с числом людей; при приближении костры распадаются на отдельных людей.
    // Я и выбранный человек всегда стоят отдельно.
    const vis = people.filter((p) => p.z > 0.05 && p.o && (filt === "all" || filt === "new" || match(p) || p.rel === "me" || p === sel)), CR = 42, grid = new Map(), gk = (x, y) => x + "," + y;
    vis.forEach((p) => { p.cl = null; p.solo = false; const k = gk(Math.floor(p.sx / CR), Math.floor(p.sy / CR)); let c = grid.get(k); if (!c) grid.set(k, c = []); c.push(p); });
    const prio = (p) => (p.rel === "me" ? 100 : 0) + (p === sel ? 90 : 0) + (p.rel === "friend" ? 8 : 0) + (hasVerse(p) ? 4 : 0) + (p.fire ? 2 : 0) + p.z;
    const solo = []; clusters = [];
    vis.slice().sort((x, y) => prio(y) - prio(x)).forEach((p) => {
      if (p.cl || p.solo) return;
      if (p.rel === "me" || p === sel) { p.solo = true; solo.push(p); return; }
      const bx = Math.floor(p.sx / CR), by = Math.floor(p.sy / CR), m = [];
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) (grid.get(gk(bx + i, by + j)) || []).forEach((q) => { if (!q.cl && !q.solo && q.rel !== "me" && q !== sel && Math.hypot(q.sx - p.sx, q.sy - p.sy) < CR) m.push(q); });
      if (m.length <= 2) { m.forEach((q) => { q.solo = true; solo.push(q); }); if (!m.includes(p)) { p.solo = true; solo.push(p); } return; }
      const c = { x: p.sx, y: p.sy, z: p.z, lead: p, m, lit: m.filter((q) => q.fire).length, verse: m.some((q) => hasVerse(q) && !q.twin), friend: m.some((q) => q.rel === "friend"), any: m.some(match) };
      m.forEach((q) => { q.cl = c; }); clusters.push(c);
    });
    // костры
    clusters.sort((x, y) => x.z - y.z).forEach((c) => {
      const s = (0.6 + 0.4 * c.z) * Math.min(1.5, 0.8 + 0.25 * zoom) * 1.15;
      ctx.globalAlpha = (c.any ? 1 : 0.22) * Math.min(1, c.z * 3);
      if (c.friend) { ctx.lineWidth = 2; ctx.strokeStyle = "#8fd0ff"; ctx.beginPath(); ctx.arc(c.x, c.y - 5 * s, 11 * s, 0, TAU); ctx.stroke(); }
      if (c.lit) flame(c.x, c.y, s, 1 + 0.1 * Math.sin(t * 9 + c.lead.ph)); else sleepFlame(c.x, c.y, s * 0.9, 1);
      const n = c.m.filter((q) => !q.twin).length || c.m.length, vmode = filt === "verse", txt = (vmode ? "❞ " : "") + n;
      ctx.font = "800 " + Math.round(11 * Math.min(1.3, s)) + "px system-ui,sans-serif"; ctx.textAlign = "center";
      const w = Math.max(18, ctx.measureText(txt).width + 10), h = 16 * Math.min(1.3, s), px = c.x + 9 * s, py = c.y + 2 * s;
      ctx.fillStyle = vmode ? "#ffb020" : c.lit ? "#ff8a1f" : "#3a4270"; ctx.strokeStyle = "#0b1030"; ctx.lineWidth = 1.5;
      ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(px, py, w, h, h / 2); else ctx.rect(px, py, w, h); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#fff"; ctx.fillText(txt, px + w / 2, py + h * 0.74);
      if (false) { const bx = c.x + 10 * s, by = c.y - 19 * s, br = 6 * s; ctx.fillStyle = "#ffb020"; ctx.strokeStyle = "#0b1030"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(bx, by, br, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#fff"; ctx.font = "900 " + Math.round(9 * s) + "px system-ui,sans-serif"; ctx.fillText("❞", bx, by + 3.3 * s); }
      ctx.globalAlpha = 1;
    });
    // отдельные люди
    solo.sort((x, y) => x.z - y.z).forEach((p) => {
      const s = (0.6 + 0.4 * p.z) * Math.min(1.5, 0.8 + 0.25 * zoom);
      ctx.globalAlpha = (match(p) ? 1 : 0.22) * Math.min(1, p.z * 3);
      if (p.rel && p.rel !== "req") { ctx.lineWidth = 2; ctx.strokeStyle = p.rel === "me" ? "#5be38a" : p.rel === "pending" ? "#ffd36b" : "#8fd0ff"; if (p.rel === "pending") ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.arc(p.sx, p.sy - 5 * s, 10 * s, 0, TAU); ctx.stroke(); ctx.setLineDash([]); }
      if (p.fire) flame(p.sx + Math.sin(t * 5 + p.ph) * 0.6, p.sy, s, 1 + 0.13 * Math.sin(t * 11 + p.ph));
      else sleepFlame(p.sx, p.sy, s * 0.9, 1 + 0.04 * Math.sin(t * 1.6 + p.ph));
      if (hasVerse(p) && !p.twin && (filt === "verse" || p === sel || p.rel === "me" || p.rel === "friend" || zoom >= 3)) { const bx = p.sx + 10 * s, by = p.sy - 19 * s, br = 6.5 * s; ctx.fillStyle = "#ffb020"; ctx.strokeStyle = "#0b1030"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(bx, by, br, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#fff"; ctx.font = "900 " + Math.round(10 * s) + "px system-ui,sans-serif"; ctx.textAlign = "center"; ctx.fillText("❞", bx, by + 3.6 * s); }
      if (p === sel) { ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.sx, p.sy - 5 * s, 14 * s + 3 * Math.sin(t * 4), 0, TAU); ctx.stroke(); }
      ctx.globalAlpha = 1;
    });
  }

  /* ---------- нажатия ---------- */
  let lx0 = 0, ly0 = 0, moved = 0;
  function bindCanvas() {
    // щипок двумя пальцами — приблизить / отдалить
    const pts = new Map(); let pinch = null;
    const pdist = () => { const a = [...pts.values()]; return Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) || 1; };
    cv.addEventListener("pointerdown", (e) => { pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (pts.size === 2) { anim = null; pinch = { d: pdist(), z: tz }; moved = 99; vx = vy = 0; } });
    cv.addEventListener("pointermove", (e) => { if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (pinch && pts.size >= 2) tz = Math.max(0.8, Math.min(ZMAX, pinch.z * pdist() / pinch.d)); });
    const pend = (e) => { pts.delete(e.pointerId); if (pts.size < 2) pinch = null; if (pts.size === 1) { const a = [...pts.values()][0]; lx0 = a.x; ly0 = a.y; } };
    cv.addEventListener("pointerup", pend); cv.addEventListener("pointercancel", pend);
    cv.addEventListener("pointerdown", (e) => { anim = null; if (pts.size > 1) return; drag = true; fly = false; moved = 0; lx0 = e.clientX; ly0 = e.clientY; vx = vy = 0; ty = yaw; tp = pitch; try { cv.setPointerCapture(e.pointerId); } catch (x) {} cv.style.cursor = "grabbing"; });
    cv.addEventListener("pointermove", (e) => { if (!drag || pinch) return; const dx = e.clientX - lx0, dy = e.clientY - ly0; lx0 = e.clientX; ly0 = e.clientY; moved += Math.abs(dx) + Math.abs(dy); const k = 0.0055 / zoom; ty += dx * k; tp += dy * k; vx = vx * 0.6 + dx * k * 0.4; vy = vy * 0.6 + dy * k * 0.4; lastT = performance.now(); });
    const end = (e) => { if (!drag || pts.size > 0) return; drag = false; idleT = performance.now(); cv.style.cursor = "grab"; if (performance.now() - lastT > 90) vx = vy = 0; if (moved < 7) { const r = cv.getBoundingClientRect(); tap(e.clientX - r.left, e.clientY - r.top); } };
    cv.addEventListener("pointerup", end); cv.addEventListener("pointercancel", end);
    cv.addEventListener("wheel", (e) => { e.preventDefault(); tz = Math.max(0.8, Math.min(ZMAX, tz * (e.deltaY < 0 ? 1.1 : 0.9))); }, { passive: false });
  }
  function tap(x, y) {
    let best = null, bd = 22;
    people.forEach((p) => { if (!(p.z > 0.05) || !p.solo) return; const d = Math.hypot(p.sx - x, p.sy - 6 - y); if (d < bd) { bd = d; best = p; } });
    if (best) return pick(best);
    // костёр: приближаемся к нему; на самом близком расстоянии — список людей книги
    let bc = null, cd0 = 26; clusters.forEach((c) => { const d = Math.hypot(c.x + 6 - x, c.y - 2 - y); if (d < cd0) { cd0 = d; bc = c; } });
    if (bc) { const p = bc.lead; if (zoom < ZMAX * 0.7) { sel = selB = null; card(); return goTo(-p.lon, p.lat, Math.min(ZMAX, Math.max(zoom * 2.4, 2.2)), 700); } return pickB(p.o, zoom); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (ICE.path && ICE.z > -0.1 && ctx.isPointInPath(ICE.path, x * dpr, y * dpr)) return pickB(ICE);
    let bi = null; books.forEach((o) => { if (o.path && o.cont.path && o.z > -0.1 && ctx.isPointInPath(o.path, x * dpr, y * dpr) && ctx.isPointInPath(o.cont.path, x * dpr, y * dpr) && (!bi || o.z > bi.z)) bi = o; });
    if (bi) return pickB(bi);
    sel = selB = null; card();
  }
  function pick(p, z) { sel = p; selB = null; card(); if (p.o) goTo(-p.lon, p.lat, Math.max(zoom, z || 1.8)); }
  function pickB(o, z) { selB = o; sel = null; card(); goTo(-o.lon, o.lat, Math.max(zoom, z || 1.5)); }

  /* ---------- нижняя карточка ---------- */
  function avatar(p) {
    const a = el("div", "gav"); a.style.background = p.col || COL[0];
    if (p.photo && /^https:\/\//.test(p.photo)) { const img = document.createElement("img"); img.src = p.photo; img.alt = ""; img.referrerPolicy = "no-referrer"; a.append(img); }
    else a.textContent = (p.name || "?").trim().charAt(0).toUpperCase();
    return a;
  }
  // карточка внизу: крестик в правом верхнем углу закрывает её
  function card() {
    card0();
    const cd = root && root.querySelector(".gcard"); if (!cd || cd.hidden) return;
    const x = el("button", "gcx", "✕"); x.type = "button"; x.setAttribute("aria-label", "Закрыть карточку");
    x.addEventListener("click", () => { sel = selB = null; card(); });
    cd.prepend(x);
  }
  function card0() {
    const cd = root.querySelector(".gcard"); cd.textContent = ""; cd.hidden = false;
    if (sel) {
      const p = sel, row = el("div", "gperson"), mid = el("div"); mid.style.minWidth = "0";
      mid.append(el("div", "gname", p.rel === "me" ? (p.name || "Вы") + " (вы)" : (p.name || "Читатель")));
      (p.refs || []).forEach((r) => mid.append(el("div", "gline", r)));
      if (p.plan) mid.append(el("div", "gline", p.plan));
      let vbox = null;
      if (hasVerse(p)) { const vb = el("div", "gverse"), top = el("div", "gvtop"); top.append(el("span", "gvq", "❞"), el("b", null, p.note), el("small", null, p.nd === today() ? "затронул сегодня" : "затронул вчера")); vb.append(top); if (p.w) vb.append(el("div", "gvw", "«" + p.w + "»")); vbox = vb; }
      const fl = el("div", "gfl" + (p.fire ? " on" : "")); fl.append(stkEl(p.fire ? "flame" : "flameOff", 26), el("div", null, String(p.streak || 0)));
      fl.title = p.fire ? "Сегодня уже прочитал(а)" : "Сегодня ещё не читал(а)";
      row.append(avatar(p), mid, fl); cd.append(row); if (vbox) cd.append(vbox);
      const acts = el("div", "gacts");
      if (p.rel === "") { const a = btn("Добавить в друзья", "main"); a.addEventListener("click", () => addFriend(p, a)); acts.append(a); }
      else if (p.rel === "req") { const a = btn("Принять заявку", "main"); a.addEventListener("click", () => addFriend(p, a)); acts.append(a); }
      else if (p.rel === "pending") acts.append(Object.assign(btn("Заявка отправлена"), { disabled: true }));
      else if (p.rel === "friend") acts.append(Object.assign(btn("✓ Вы друзья"), { disabled: true }));
      const pr = btn(p.rel === "me" ? "Мой профиль" : "Профиль"); pr.addEventListener("click", () => opts && opts.onProfile && opts.onProfile(p.id)); acts.append(pr);
      cd.append(acts);
      // скрыть себя с глобуса — в своей карточке («Я»)
      if (p.rel === "me" && opts && opts.onToggle) {
        const on = !!opts.visible, tb = btn(on ? "Скрыть меня с глобуса" : "Показать меня на глобусе");
        tb.style.width = "100%"; tb.style.marginTop = "8px";
        tb.addEventListener("click", async () => { tb.disabled = true; try { opts.visible = await opts.onToggle(); } finally { card(); } });
        cd.append(tb);
      }
      return;
    }
    if (selB === ICE) {
      cd.append(el("div", "gname", "🏝 Остров выбора"));
      cd.append(el("p", "gmuted", ICE.people.length ? "Здесь те, кто уже в Огоньке, но ещё не выбрал расписание. Позовите их читать вместе!" : "Сейчас здесь никого нет — все уже выбрали расписание."));
      const box = el("div", "gppl");
      ICE.people.filter((p) => !p.twin).slice(0, 40).forEach((p) => { const b = btn(p.rel === "me" ? (p.name || "Вы") + " (вы)" : (p.name || "Читатель")); b.prepend(stkEl("flameOff", 16)); b.addEventListener("click", () => pick(p)); box.append(b); });
      cd.append(box); return;
    }
    if (selB) {
      const o = selB, i = o.i + 1;
      cd.append(el("div", "gname", i + ". " + o.name));
      cd.append(el("p", "gmuted", o.ch + " " + chWord(o.ch) + " · " + o.cont.n + " — " + o.cont.sec.toLowerCase()));
      const box = el("div", "gppl");
      if (!o.people.length) cd.append(el("p", "gmuted", "Сейчас здесь никто не читает."));
      const rk = (p) => (p.rel === "friend" || p.rel === "me" ? 4 : 0) + (hasVerse(p) ? 2 : 0) + (p.fire ? 1 : 0);
      o.people.filter((p) => !p.twin || true).slice().sort((a, b) => rk(b) - rk(a)).slice(0, 40).forEach((p) => { const b = btn(p.name || "Читатель"); b.prepend(stkEl(p.fire ? "flame" : "flameOff", 16)); b.addEventListener("click", () => pick(p)); box.append(b); });
      if (o.people.length > 40) box.append(el("span", "gmuted", "и ещё " + (o.people.length - 40)));
      cd.append(box); return;
    }
    cd.hidden = true; // пока ничего не выбрано — внизу пусто
  }
  const chWord = (n) => { const a = n % 10, b = n % 100; return a === 1 && b !== 11 ? "глава" : a >= 2 && a <= 4 && (b < 12 || b > 14) ? "главы" : "глав"; };
  async function addFriend(p, b) {
    if (!opts || !opts.onAdd) return; b.disabled = true;
    const r = await opts.onAdd(p.id).catch(() => false);
    if (r) people.forEach((q) => { if (q.id === p.id) q.rel = r; }); card();
  }

  function stat() {
    const s = root.querySelector(".gstat"), ids = new Set(), lit = new Set();
    people.forEach((p) => { if (!p.o) return; ids.add(p.id); if (p.fire) lit.add(p.id); });
    s.textContent = "В Огоньке: " + ids.size + " · горят сегодня: " + lit.size;
    const n = new Set(ICE.people.map((p) => p.id)).size, ic = root.querySelector(".gisl");
    if (ic) { ic.hidden = !n; ic.lastChild.textContent = "Выбирают: " + n; }
  }

  /* ---------- открыть / закрыть ---------- */
  function close() {
    if (!root) return; cancelAnimationFrame(raf); raf = 0; if (ro) { ro.disconnect(); ro = null; }
    window.removeEventListener("resize", size); document.removeEventListener("keydown", esc);
    root.remove(); root = cv = ctx = null; sel = selB = null;
  }
  function esc(e) { if (e.key === "Escape" && !document.querySelector(".fmodal")) close(); }

  function open(o) {
    addCss(); build(); close();
    opts = o || {}; people = expand(opts.people); filt = "all"; newIdx = -1;
    root = el("div", "gmodal"); root.setAttribute("role", "dialog"); root.setAttribute("aria-label", "Глобус читателей");
    const topb = el("div", "gtop"); topb.append(el("h2", null, "Глобус читателей"));
    const x = el("button", "gx", "✕"); x.type = "button"; x.setAttribute("aria-label", "Закрыть"); x.addEventListener("click", close); topb.append(x);
    const chips = el("div", "gchips");
    [["all", "Все", "globe"], ["fire", "Горят", "flame"], ["verse", "Стихи", ""], ["me", "Я", "pin"]].forEach(([f, txt, ic]) => {
      const c = el("button", "gchip" + (f === "all" ? " on" : "")); c.type = "button"; c.append(ic ? stkEl(ic, 20) : el("span", "gvchip", "❞"), el("span", null, txt));
      if (f === "verse") c.title = "Стихи, которые затронули сегодня и вчера. Нажимайте ещё — покажет следующий";
      if (f === "new") c.title = "Те, кто не у вас в друзьях. Нажимайте ещё — покажет следующего";
      c.addEventListener("click", () => {
        if (f === "me") { const m = people.find((p) => p.rel === "me"); if (m) { root.querySelectorAll(".gchip").forEach((z) => z.classList.toggle("on", z === c)); filt = "all"; pick(m, 2.5); } return; }
        filt = f; root.querySelectorAll(".gchip").forEach((z) => z.classList.toggle("on", z === c));
        if (f === "new") nextNew();
        else if (f === "verse") nextVerse();
        // «Все» и «Горят» — снова вся планета: отдаляемся, карточку закрываем
        else { sel = selB = null; card(); goTo(yaw, pitch, 1, 1100); }
      });
      chips.append(c);
    });
    const ic = el("button", "gchip gisl"); ic.type = "button"; ic.hidden = true; ic.append(el("span", null, "🏝"), el("span", null, "Выбирают"));
    ic.addEventListener("click", () => { filt = "all"; root.querySelectorAll(".gchip").forEach((z) => z.classList.toggle("on", z === ic)); pickB(ICE, 5); });
    topb.insertBefore(ic, x); // «Выбирают» — в строке заголовка, чтобы все кнопки фильтра помещались
    const stage = el("div", "gstage"); cv = document.createElement("canvas"); stage.append(cv);
    const zm = el("div", "gzoom"), zi = el("button", null, "+"), zo = el("button", null, "−");
    zi.type = zo.type = "button"; zi.setAttribute("aria-label", "Приблизить"); zo.setAttribute("aria-label", "Отдалить");
    zi.addEventListener("click", () => { goTo(yaw, pitch, zoom * 1.5, 450); }); zo.addEventListener("click", () => { goTo(yaw, pitch, zoom / 1.5, 450); });
    zm.append(zi, zo); stage.append(zm, el("div", "gstat"), el("div", "ghint", "Крутите в любую сторону · нажмите на человека"));
    root.append(topb, chips, stage, el("div", "gcard"));
    document.body.append(root);
    ctx = cv.getContext("2d");
    // без увеличения страницы двойным нажатием (iPhone) и щипком
    let lastTouch = 0;
    root.addEventListener("touchend", (e) => { const n = Date.now(); if (n - lastTouch < 350) { e.preventDefault(); const b = e.target.closest && e.target.closest("button"); if (b && !b.disabled) b.click(); } lastTouch = n; }, { passive: false });
    root.addEventListener("dblclick", (e) => e.preventDefault());
    root.addEventListener("gesturestart", (e) => e.preventDefault());

    // «Стихи»: по очереди люди, которых затронул стих сегодня или вчера
    let verseIdx = -1;
    function nextVerse() {
      const list = people.filter((p) => p.o && !p.twin && hasVerse(p)).sort((a, b) => (b.nd || "").localeCompare(a.nd || ""));
      if (!list.length) { sel = selB = null; const cd = root.querySelector(".gcard"); cd.textContent = ""; cd.hidden = false; cd.append(el("p", "gmuted", "Сегодня ещё никто не отметил стих. Отметьте свой после чтения — он появится здесь.")); return; }
      verseIdx = (verseIdx + 1) % list.length; pick(list[verseIdx], 2.2);
    }
    // «Найти новых»: по очереди те, кто не в друзьях; сначала те, у кого ещё нет друзей
    function nextNew() {
      const list = people.filter((p) => p.o && !p.twin && (p.rel === "" || p.rel === "req")).sort((a, b) => ((a.fc || 0) > 0) - ((b.fc || 0) > 0));
      if (!list.length) { const cd = root.querySelector(".gcard"); cd.textContent = ""; cd.hidden = false; cd.append(el("p", "gmuted", "Сейчас на глобусе нет новых людей. Загляните позже.")); return; }
      newIdx = (newIdx + 1) % list.length; pick(list[newIdx]);
    }

    placePeople();
    const me = people.find((p) => p.rel === "me" && p.o), start = me || { lat: 0.5, lon: books[39].lon };
    yaw = -start.lon + 0.6; pitch = start.lat - 0.2; ty = -start.lon + 0.3; tp = start.lat - 0.3; zoom = tz = 1; vx = vy = 0; fly = false; anim = null; OS = 0;
    bindCanvas(); size();
    if (window.ResizeObserver) { ro = new ResizeObserver(size); ro.observe(stage); } else window.addEventListener("resize", size);
    document.addEventListener("keydown", esc);
    stat(); card();
    raf = requestAnimationFrame(frame);
  }

  // человек, читающий оба завета, стоит на обеих книгах — на каждой свой огонёк
  function expand(list) {
    const out = [];
    (list || []).forEach((p) => {
      const sp = Array.isArray(p.spots) && p.spots.length ? p.spots.filter((x) => x && typeof x.b === "number" && x.b >= 0 && x.b < 66) : null;
      if (!sp || !sp.length) { out.push(p); return; }
      sp.forEach((x, i) => out.push(Object.assign({}, p, { b: x.b, spotLit: !!x.l, twin: i > 0 })));
    });
    return out;
  }
  function setPeople(list) {
    if (!root) return;
    const keep = sel && sel.id;
    people = expand(list); placePeople();
    sel = keep ? people.find((p) => p.id === keep) || null : null;
    stat(); card();
  }
  function setVisible(v) { if (opts) { opts.visible = !!v; if (root && sel && sel.rel === "me") card(); } }

  // стили кнопки на вкладке «Друзья» нужны сразу, а не только после первого открытия глобуса
  if (document.head) addCss(); else document.addEventListener("DOMContentLoaded", addCss);

  window.OgonekGlobe = { open, close, setPeople, setVisible, bookIndex, isOpen: () => !!root };
})();
