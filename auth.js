// Вход через Google (Firebase Authentication), прогресс и друзья (Cloud Firestore).
import { firebaseConfig } from "./firebase-config.js?v=202610031821";

const SDK = "https://www.gstatic.com/firebasejs/10.12.2/";
const $ = (id) => document.getElementById(id);
const OWNER_KEY = "ogonek-owner";
const SKIP_KEY = "ogonek-skip-login";
const CODE_ABC = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

const configured = firebaseConfig && firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("ВСТАВЬТЕ");
const O = () => window.Ogonek;
const lsGet = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const lsSet = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} };
function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function showError(msg) { const e = $("authError"); e.textContent = msg; e.hidden = !msg; }

const ERRORS = {
  "auth/popup-closed-by-user": "Окно входа закрыто. Попробуйте ещё раз.",
  "auth/cancelled-popup-request": "Окно входа закрыто. Попробуйте ещё раз.",
  "auth/network-request-failed": "Нет связи с сервером. Проверьте интернет.",
  "auth/unauthorized-domain": "Адрес сайта не добавлен в разрешённые домены Firebase (Authentication → Settings → Authorized domains).",
  "auth/operation-not-allowed": "Вход через Google не включён в Firebase (Authentication → Sign-in method → Google)."
};
const errText = (e) => ERRORS[e && e.code] || ("Не получилось войти: " + ((e && (e.code || e.message)) || "неизвестная ошибка"));

async function main() {
  if (!O()) return;
  const top = $("loginTop"); top.hidden = false;
  if (!configured) {
    const msg = "Вход не настроен: в файле firebase-config.js на GitHub ещё стоят заглушки «ВСТАВЬТЕ_API_KEY». Вставьте туда настройки из Firebase (Project settings → Your apps).";
    const note = el("div", "demo-note", "Демо-режим. " + msg);
    document.querySelector(".app").prepend(note);
    top.addEventListener("click", () => { O().toast(msg); note.scrollIntoView({ behavior: "smooth" }); });
    return;
  }
  let topAction = () => { $("auth").hidden = false; };
  top.addEventListener("click", () => topAction());

  const [{ initializeApp }, A, F] = await Promise.all([
    import(SDK + "firebase-app.js"),
    import(SDK + "firebase-auth.js"),
    import(SDK + "firebase-firestore.js")
  ]);
  try { if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {}); } catch (e) {}
  const app = initializeApp(firebaseConfig);
  const auth = A.getAuth(app);
  auth.languageCode = "ru";
  const db = F.getFirestore(app);
  const provider = new A.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  /* ---------- sign in / out ---------- */
  try { await A.getRedirectResult(auth); } catch (e) { showError(errText(e)); }

  $("googleBtn").addEventListener("click", async () => {
    showError(""); const b = $("googleBtn"); b.disabled = true;
    try { await A.signInWithPopup(auth, provider); }
    catch (e) {
      // in some phone browsers popups are blocked: fall back to a full-page redirect
      if (["auth/popup-blocked", "auth/operation-not-supported-in-this-environment"].includes(e.code)) {
        try { await A.signInWithRedirect(auth, provider); return; } catch (e2) { showError(errText(e2)); }
      } else showError(errText(e));
    } finally { b.disabled = false; }
  });
  $("skipLogin").addEventListener("click", () => { lsSet(SKIP_KEY, "1"); $("auth").hidden = true; showLoginLink(); });
  $("logoutBtn").addEventListener("click", async () => { O().setRemote(null); O().onSave = null; await A.signOut(auth); });

  function showLoginLink() {
    $("account").hidden = false; $("logoutBtn").hidden = true;
    const t = $("accountPhone"); t.textContent = "";
    const b = el("button", "linkbtn", "Войти через Google, чтобы видеть друзей"); b.type = "button";
    b.addEventListener("click", () => { lsSet(SKIP_KEY, null); $("auth").hidden = false; });
    t.append(b);
  }

  /* ---------- friends ---------- */
  let me = null, myRef = null, myCode = "", friendUnsubs = {}, friendData = {}, myUnsub = null, myFriends = [];

  function randomCode() { let s = ""; const a = new Uint32Array(6); crypto.getRandomValues(a); a.forEach((n) => { s += CODE_ABC[n % CODE_ABC.length]; }); return s; }

  async function ensureProfile(user) {
    const snap = await F.getDoc(myRef);
    const data = snap.exists() ? snap.data() : null;
    if (data && data.code) { myCode = data.code; return; }
    for (let i = 0; i < 6; i++) {
      const code = randomCode(), cref = F.doc(db, "codes", code);
      const ok = await F.runTransaction(db, async (tx) => {
        const c = await tx.get(cref);
        if (c.exists()) return false;
        tx.set(cref, { uid: user.uid });
        return true;
      }).catch(() => false);
      if (ok) {
        myCode = code;
        await F.setDoc(myRef, { code, friends: (data && data.friends) || [], name: user.displayName || "Читатель", photo: user.photoURL || "" }, { merge: true });
        return;
      }
    }
    throw new Error("Не удалось создать код");
  }

  let pubTimer = null;
  let lastFof = "";
  function fofChanged() {
    const fof = {};
    myFriends.forEach((u) => { const f = friendData[u]; if (f) fof[u] = { n: String(f.name || "").slice(0, 60), p: f.photo || "" }; });
    return JSON.stringify(fof) !== lastFof;
  }
  function publishSummary() {
    clearTimeout(pubTimer);
    pubTimer = setTimeout(() => {
      if (!me) return;
      const s = O().summary();
      // имена и фото моих друзей — чтобы мои друзья видели, кто у меня в друзьях
      const fof = {};
      myFriends.forEach((u) => { const f = friendData[u]; if (f) fof[u] = { n: String(f.name || "").slice(0, 60), p: f.photo || "" }; });
      lastFof = JSON.stringify(fof);
      F.setDoc(myRef, Object.assign(s, { fof, name: me.displayName || "Читатель", photo: me.photoURL || "", code: myCode, updated: F.serverTimestamp() }), { merge: true })
        .catch((e) => console.warn(e));
      F.setDoc(F.doc(db, "cards", me.uid), { name: me.displayName || "Читатель", photo: me.photoURL || "" }).catch((e) => console.warn(e));
    }, 1200);
  }

  // друг ищется по коду (6 знаков), по почте Google или по ID
  async function findFriendUid(input) {
    const raw = (input || "").trim();
    if (raw.includes("@")) {
      const e = await F.getDoc(F.doc(db, "emails", raw.toLowerCase()));
      return e.exists() ? e.data().uid : null;
    }
    const code = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (code.length === 6) {
      const c = await F.getDoc(F.doc(db, "codes", code));
      return c.exists() ? c.data().uid : null;
    }
    if (/^[A-Za-z0-9]{20,40}$/.test(raw)) return raw; // ID пользователя
    return undefined;
  }

  async function addFriendByCode(input) {
    const raw = (input || "").trim();
    if (!raw) { O().toast("Введите код, почту или ID друга"); return; }
    try {
      const fuid = await findFriendUid(raw);
      if (fuid === undefined) { O().toast("Введите код из 6 знаков, почту Google или ID друга"); return; }
      if (!fuid) { O().toast(raw.includes("@") ? "Человек с такой почтой ещё не входил в Огонёк" : "Код не найден. Проверьте его ещё раз."); return; }
      if (await addFriendUid(fuid)) $("friendCode").value = "";
    } catch (e) { console.warn(e); O().toast("Не удалось добавить друга. Проверьте код или почту."); }
  }

  async function addFriendUid(fuid) {
    if (fuid === me.uid) { O().toast("Это вы сами"); return false; }
    if (myFriends.includes(fuid)) { O().toast("Вы уже друзья"); return false; }
    try {
      await F.updateDoc(F.doc(db, "profiles", fuid), { friends: F.arrayUnion(me.uid) });
      await F.updateDoc(myRef, { friends: F.arrayUnion(fuid) });
      O().toast("Друг добавлен!"); return true;
    } catch (e) { console.warn(e); O().toast("Не удалось добавить друга. Попробуйте позже."); return false; }
  }

  async function removeFriend(fuid) {
    try {
      await F.updateDoc(myRef, { friends: F.arrayRemove(fuid) });
      await F.updateDoc(F.doc(db, "profiles", fuid), { friends: F.arrayRemove(me.uid) }).catch(() => {});
      O().toast("Друг удалён");
    } catch (e) { console.warn(e); O().toast("Не удалось удалить. Попробуйте позже."); }
  }

  function syncFriendSubs(list) {
    myFriends = list;
    Object.keys(friendUnsubs).forEach((uid) => { if (!list.includes(uid)) { friendUnsubs[uid](); delete friendUnsubs[uid]; delete friendData[uid]; } });
    list.forEach((uid) => {
      if (friendUnsubs[uid]) return;
      friendUnsubs[uid] = F.onSnapshot(F.doc(db, "profiles", uid),
        (snap) => { if (snap.exists()) friendData[uid] = snap.data(); else delete friendData[uid]; renderFriends(); if (fofChanged()) publishSummary(); },
        () => { delete friendData[uid]; renderFriends(); });
    });
    renderFriends();
  }

  function flameSvg(lit) {
    const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    s.setAttribute("viewBox", "0 0 64 80"); s.setAttribute("class", "flame" + (lit ? "" : " off")); s.innerHTML = O().FLAME; return s;
  }
  /* ---------- воодушевление ---------- */
  const CHEERS = [
    "Брат, зажги огонь!",
    "Сестра, не хватает твоего огня!",
    "Мой огонёк уже горит — зажги и свой!",
    "Духом пламенейте! Ждём тебя сегодня на чтении"
  ];
  const SENT_KEY = "ogonek-cheers-sent";
  const sentMap = () => { try { return JSON.parse(lsGet(SENT_KEY) || "{}"); } catch (e) { return {}; } };
  const sentToday = (uid) => sentMap()[uid] === O().today();
  function markSent(uid) { const m = sentMap(), t = O().today(); Object.keys(m).forEach((k) => { if (m[k] !== t) delete m[k]; }); m[uid] = t; lsSet(SENT_KEY, JSON.stringify(m)); }
  const litToday = (d) => d && d.ntLast === O().today() && d.otLast === O().today();
  // воодушевлять можно, когда мой огонёк сегодня горит, а у друга ещё нет
  const canCheer = (d) => litToday(O().summary()) && !litToday(d);

  function cheerButton(uid, d) {
    const b = el("button", "cheerbtn"); b.type = "button";
    const sent = sentToday(uid);
    b.append(flameSvg(true), document.createTextNode(sent ? "Вы воодушевили сегодня ✓" : "Воодушевить"));
    b.disabled = sent;
    b.addEventListener("click", (e) => { e.stopPropagation(); openCheerPicker(uid, d); });
    b.addEventListener("keydown", (e) => e.stopPropagation());
    return b;
  }

  function openCheerPicker(uid, d) {
    closeProfile();
    const modal = el("div", "fmodal"), sheet = el("div", "fsheet");
    sheet.setAttribute("role", "dialog"); sheet.setAttribute("aria-modal", "true");
    modal.addEventListener("click", (e) => { if (e.target === modal) closeProfile(); });
    document.addEventListener("keydown", escClose);
    const head = el("div", "fhead"), ht = el("div");
    ht.append(el("h2", null, "Воодушевить"), el("div", "hint", (d.name || "Друг") + " получит уведомление"));
    const x = el("button", "fclose", "×"); x.type = "button"; x.setAttribute("aria-label", "Закрыть"); x.addEventListener("click", closeProfile);
    head.append(avatarEl(d.name, d.photo, 64), ht, x);
    const list = el("div", "cheerlist");
    CHEERS.forEach((txt, i) => {
      const o = el("button", "cheeropt", txt); o.type = "button";
      o.addEventListener("click", async () => {
        list.querySelectorAll("button").forEach((b) => { b.disabled = true; });
        const ok = await sendCheer(uid, i);
        closeProfile();
        if (ok) { renderFriends(); try { navigator.vibrate && navigator.vibrate([30, 40, 30]); } catch (e) {} }
      });
      list.append(o);
    });
    sheet.append(head, el("span", "label", "Выберите слова"), list);
    modal.append(sheet); document.body.append(modal); list.querySelector("button").focus();
  }

  async function sendCheer(uid, i) {
    const day = O().today();
    try {
      await F.setDoc(F.doc(db, "cheers", uid, "inbox", me.uid + "_" + day), {
        from: me.uid, name: String(me.displayName || "Друг").slice(0, 60), photo: me.photoURL || "", msg: i, day, at: F.serverTimestamp()
      });
      markSent(uid);
      O().toast("Отправлено! Пусть огонёк разгорится");
      return true;
    } catch (e) {
      console.warn(e);
      if (e && e.code === "permission-denied") { markSent(uid); O().toast("Сегодня вы уже воодушевляли этого друга"); return true; }
      O().toast("Не удалось отправить. Проверьте интернет.");
      return false;
    }
  }

  // входящие: показываем по одному
  let inboxUnsub = null, cheerQueue = [], cheerShown = null;
  const seenCheers = new Set();
  function listenCheers() {
    if (inboxUnsub) inboxUnsub();
    inboxUnsub = F.onSnapshot(F.collection(db, "cheers", me.uid, "inbox"), (qs) => {
      const fresh = [];
      qs.forEach((docSnap) => {
        const c = docSnap.data();
        if (seenCheers.has(docSnap.id)) return;
        seenCheers.add(docSnap.id);
        fresh.push({ id: docSnap.id, ...c });
      });
      fresh.sort((a, b) => String(a.day).localeCompare(String(b.day)));
      fresh.forEach((c) => { cheerQueue.push(c); systemNotify(c); });
      showNextCheer();
    }, (e) => console.warn(e));
  }

  function systemNotify(c) {
    if (!("Notification" in window) || Notification.permission !== "granted" || !document.hidden) return;
    const title = (c.name || "Друг") + " воодушевляет вас";
    const opts = { body: CHEERS[c.msg] || CHEERS[0], icon: "icon-192.png", tag: "cheer-" + c.id, lang: "ru" };
    if (navigator.serviceWorker && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready.then((r) => r.showNotification(title, opts)).catch(() => { try { new Notification(title, opts); } catch (e) {} });
    } else { try { new Notification(title, opts); } catch (e) {} }
  }

  function showNextCheer() {
    if (cheerShown || !cheerQueue.length) return;
    if (document.querySelector(".fmodal")) { setTimeout(showNextCheer, 1500); return; }
    const c = cheerQueue.shift(); cheerShown = c;
    const modal = el("div", "fmodal"), sheet = el("div", "fsheet cheerin");
    sheet.setAttribute("role", "dialog"); sheet.setAttribute("aria-modal", "true");
    const from = el("div", "from"); from.append(avatarEl(c.name, c.photo, 36), el("span", null, (c.name || "Друг") + " воодушевляет вас"));
    const fl = flameSvg(true);
    const q = el("blockquote", null, "«" + (CHEERS[c.msg] || CHEERS[0]) + "»");
    const acts = el("div", "acts");
    const lit = litToday(O().summary());
    const go = el("button", "btn-main", lit ? "Спасибо!" : "Зажечь огонёк"); go.type = "button";
    acts.append(go);
    const done = () => {
      modal.remove(); document.removeEventListener("keydown", esc);
      F.deleteDoc(F.doc(db, "cheers", me.uid, "inbox", c.id)).catch((e) => console.warn(e));
      cheerShown = null; setTimeout(showNextCheer, 400);
    };
    const esc = (e) => { if (e.key === "Escape") done(); };
    document.addEventListener("keydown", esc);
    go.addEventListener("click", () => { done(); if (!lit) window.scrollTo({ top: 0, behavior: "smooth" }); });
    if (!lit) { const later = el("button", "linkbtn", "Позже"); later.type = "button"; later.addEventListener("click", done); acts.append(later); }
    sheet.append(fl, from, q, acts);
    modal.append(sheet); document.body.append(modal); go.focus();
    try { navigator.vibrate && navigator.vibrate([60, 40, 60, 40, 140]); } catch (e) {}
  }

  function bellButton() {
    if (!("Notification" in window) || Notification.permission !== "default") return null;
    const b = el("button", "linkbtn bellbtn", "Включить уведомления, чтобы видеть, когда вас воодушевляют");
    b.type = "button";
    b.addEventListener("click", async () => {
      try { await Notification.requestPermission(); } catch (e) {}
      if (Notification.permission === "granted") O().toast("Уведомления включены");
      renderFriends();
    });
    return b;
  }

  function fmtAhead(n) { n = n || 0; return n > 0 ? "+" + n + " " + O().daysWord(n) : n < 0 ? "−" + Math.abs(n) + " " + O().daysWord(Math.abs(n)) : "по плану"; }

  function friendRow(d, isMe, uid) {
    const t = O().today(), row = el("div", "friend" + (isMe ? " me" : ""));
    const av = el("div", "favatar");
    if (d.photo) { const img = document.createElement("img"); img.src = d.photo; img.alt = ""; img.referrerPolicy = "no-referrer"; img.width = 40; img.height = 40; av.append(img); }
    else av.textContent = (d.name || "?").trim().charAt(0).toUpperCase();
    const mid = el("div"); mid.style.minWidth = "0";
    mid.append(el("div", "fname", isMe ? "Вы" : (d.name || "Читатель")));
    O().KEYS.forEach((k) => {
      const line = el("div", "fline");
      const p = Math.min(d[k + "Next"] || 0, O().DAYS - 1), readToday = d[k + "Last"] === t;
      line.append(el("span", null, (k === "nt" ? "НЗ: " : "ВЗ: ") + (d[k + "Next"] >= O().DAYS ? "пройден" : O().refOf(k, p))));
      const st = el("span", readToday ? "ok" : null, readToday ? "✓" : "—"); st.title = readToday ? "Прочитано сегодня" : "Сегодня ещё не читал(а)"; line.append(st);
      mid.append(line);
    });
    const right = el("div", "fstreak");
    const lit = d.ntLast === t && d.otLast === t;
    right.append(flameSvg(lit), el("span", null, String(d.streak || 0)), el("span", "fahead", "НЗ " + fmtAhead(d.ntAhead)), el("span", "fahead", "ВЗ " + fmtAhead(d.otAhead)));
    row.append(av, mid, right);
    if (!isMe && canCheer(d)) row.append(cheerButton(uid, d));
    row.tabIndex = 0; row.setAttribute("role", "button");
    row.title = isMe ? "Мой профиль" : "Открыть профиль";
    row.addEventListener("click", () => openProfile(isMe ? "me" : uid));
    row.addEventListener("keydown", (e) => { if (e.key === "Enter") openProfile(isMe ? "me" : uid); });
    return row;
  }

  /* ---------- profile screen ---------- */
  let myProfile = {};
  function avatarEl(name, photo, size) {
    const av = el("div", "favatar");
    if (photo) { const img = document.createElement("img"); img.src = photo; img.alt = ""; img.referrerPolicy = "no-referrer"; img.width = size; img.height = size; av.append(img); }
    else av.textContent = (name || "?").trim().charAt(0).toUpperCase();
    return av;
  }
  function closeProfile() { const m = document.querySelector(".fmodal"); if (m) m.remove(); document.removeEventListener("keydown", escClose); }
  function escClose(e) { if (e.key === "Escape") closeProfile(); }

  async function openProfile(id) {
    if (!me) return;
    const isMe = id === "me" || id === me.uid;
    const d = isMe ? Object.assign(O().summary(), { name: me.displayName, photo: me.photoURL, about: myProfile.about || "", friends: myFriends }) : friendData[id];
    if (!d) { O().toast("Профиль друга ещё загружается"); return; }
    closeProfile();
    const t = O().today(), modal = el("div", "fmodal"), sheet = el("div", "fsheet");
    sheet.setAttribute("role", "dialog"); sheet.setAttribute("aria-modal", "true");
    modal.addEventListener("click", (e) => { if (e.target === modal) closeProfile(); });
    document.addEventListener("keydown", escClose);

    const head = el("div", "fhead"), ht = el("div");
    ht.append(el("h2", null, isMe ? (d.name || "Вы") + " (вы)" : (d.name || "Читатель")), el("div", "hint", "Уровень " + (d.level || 1) + " · " + (d.xp || 0) + " XP"));
    const x = el("button", "fclose", "×"); x.type = "button"; x.setAttribute("aria-label", "Закрыть"); x.addEventListener("click", closeProfile);
    head.append(avatarEl(d.name, d.photo, 64), ht, x);

    const stats = el("div", "fstats");
    [[d.streak || 0, "дней подряд"], [d.best || 0, "рекорд"], [(d.ntRead || 0) + (d.otRead || 0), "отрывков"], [d.gems || 0, "алмазов"]].forEach(([v, l]) => { const c = el("div", "fstat"); c.append(el("b", null, String(v)), el("span", null, l)); stats.append(c); });

    const reading = el("div", "freading"); reading.append(el("span", "label", "Где читает"));
    O().KEYS.forEach((k) => {
      const p = Math.min(d[k + "Next"] || 0, O().DAYS - 1), done = (d[k + "Next"] || 0) >= O().DAYS, readToday = d[k + "Last"] === t;
      const row = el("div", "frow"), left = el("div");
      left.append(el("small", null, k === "nt" ? "Новый Завет · " + fmtAhead(d[k + "Ahead"]) : "Ветхий Завет · " + fmtAhead(d[k + "Ahead"])));
      if (done) left.append(el("b", null, "Завет пройден"));
      else { const a = el("a", null, O().refOf(k, p)); a.href = O().urlOf(k, p); a.target = "_blank"; a.rel = "noopener"; left.append(a); }
      row.append(left, el("span", readToday ? "ok" : "hint", readToday ? "✓ сегодня" : "сегодня ещё нет"));
      reading.append(row);
    });

    const aboutBox = el("div", "freading"); aboutBox.append(el("span", "label", "О себе"));
    if (isMe) {
      const ta = document.createElement("textarea"); ta.maxLength = 300; ta.value = d.about || ""; ta.placeholder = "Пара слов о себе: церковь, город, любимая книга Библии…"; ta.style.minHeight = "70px";
      const save = el("button", "btn btn-xp", "Сохранить"); save.type = "button";
      save.addEventListener("click", async () => {
        try { await F.setDoc(myRef, { about: ta.value.trim().slice(0, 300) }, { merge: true }); O().toast("Сохранено"); }
        catch (e) { console.warn(e); O().toast("Не удалось сохранить. Попробуйте позже."); }
      });
      aboutBox.append(ta, save);
    } else aboutBox.append(el("p", "fabout" + (d.about ? "" : " empty"), d.about || "Пока ничего не написал(а)."));

    const badges = el("div", "freading"); badges.append(el("span", "label", "Награды: " + ((d.awards || []).length)));
    const bw = el("div", "fbadges");
    (d.awards || []).forEach((aid) => { const m = O().medal(aid, 40); if (!m) return; const w = el("div"); w.innerHTML = m.svg; w.title = m.name + " — " + m.desc; bw.append(w); });
    if (!(d.awards || []).length) bw.append(el("span", "hint", "Пока нет наград"));
    badges.append(bw);

    sheet.append(head, stats, reading);
    if (!isMe && canCheer(d)) sheet.append(cheerButton(id, d));
    else if (!isMe && !litToday(d) && !litToday(O().summary())) sheet.append(el("p", "hint", "Зажгите сегодня свой огонёк — и сможете воодушевить друга."));
    sheet.append(aboutBox, badges);

    if (!isMe) {
      // друзья друга: можно сразу добавить к себе
      const fof = el("div", "ffof"), others = (d.friends || []).filter((u) => u !== me.uid);
      fof.append(el("span", "label", "Друзья · " + others.length));
      if (!others.length) fof.append(el("span", "hint", "Других друзей пока нет"));
      sheet.append(fof);
      others.slice(0, 50).forEach(async (u) => {
        const row = el("div", "ffrow"); fof.append(row);
        let c = {}; try { const snap = await F.getDoc(F.doc(db, "cards", u)); c = snap.exists() ? snap.data() : {}; } catch (e) {}
        // имя: из карточки человека, из списка друзей друга или из моих друзей
        const known = (d.fof && d.fof[u]) || {}, mine = friendData[u] || {};
        const nm = c.name || known.n || mine.name || "", ph = c.photo || known.p || mine.photo || "";
        row.append(avatarEl(nm, ph, 34), el("span", null, nm || "Читатель"));
        if (!nm) { const h = el("small", "hint", "имя появится, когда он откроет Огонёк"); h.style.margin = "0"; row.querySelector("span").append(document.createElement("br"), h); }
        if (myFriends.includes(u)) { const b = el("span", "hint", "Уже друзья"); b.style.flex = "none"; row.append(b); }
        else {
          const b = el("button", "btn btn-xp", "Добавить"); b.type = "button";
          b.addEventListener("click", async () => { b.disabled = true; const ok = await addFriendUid(u); b.textContent = ok ? "Добавлен ✓" : "Добавить"; b.disabled = ok; });
          row.append(b);
        }
      });
      const rm = el("button", "linkbtn", "Удалить из друзей"); rm.type = "button"; rm.style.alignSelf = "center";
      rm.addEventListener("click", () => {
        if (rm.dataset.armed) { removeFriend(id); closeProfile(); return; }
        rm.dataset.armed = "1"; rm.textContent = "Нажмите ещё раз, чтобы удалить"; setTimeout(() => { delete rm.dataset.armed; rm.textContent = "Удалить из друзей"; }, 4000);
      });
      sheet.append(rm);
    }
    modal.append(sheet); document.body.append(modal); x.focus();
  }

  let friendsOpen = false;
  function renderFriends() {
    if (!me) return;
    $("myCode").textContent = myCode || "…";
    const box = $("friendsList"); box.textContent = "";
    const mine = Object.assign(O().summary(), { name: me.displayName, photo: me.photoURL });
    const rows = [{ d: mine, me: true, uid: me.uid }].concat(myFriends.filter((u) => friendData[u]).map((u) => ({ d: friendData[u], me: false, uid: u })));
    rows.sort((a, b) => (b.d.streak || 0) - (a.d.streak || 0) || (b.d.xp || 0) - (a.d.xp || 0));
    // видно: я и два друга; остальные — в свёрнутом списке
    let shown = 0; const extra = [];
    rows.forEach((r) => { if (r.me || shown < 2) { if (!r.me) shown++; box.append(friendRow(r.d, r.me, r.uid)); } else extra.push(r); });
    if (extra.length) {
      const more = el("div", "friends"); more.hidden = !friendsOpen;
      extra.forEach((r) => more.append(friendRow(r.d, r.me, r.uid)));
      const tg = el("button", "btn fmore"); tg.type = "button"; tg.setAttribute("aria-expanded", String(friendsOpen));
      const label = () => { tg.textContent = friendsOpen ? "Свернуть" : "Показать остальных (" + extra.length + ")"; };
      label();
      tg.addEventListener("click", () => { friendsOpen = !friendsOpen; more.hidden = !friendsOpen; tg.setAttribute("aria-expanded", String(friendsOpen)); label(); });
      box.append(more, tg);
    }
    O().setPathPeople(myFriends.filter((u) => friendData[u]).map((u) => ({ id: u, name: friendData[u].name, photo: friendData[u].photo, nt: friendData[u].ntNext || 0, ot: friendData[u].otNext || 0 })));
    if (!myFriends.length) box.append(el("p", "hint", "Пока нет друзей. Отправьте другу приглашение или введите его код."));
    const bell = bellButton(); if (bell && myFriends.length) box.append(bell);
  }

  $("addFriend").addEventListener("click", () => addFriendByCode($("friendCode").value));
  $("friendCode").addEventListener("keydown", (e) => { if (e.key === "Enter") addFriendByCode($("friendCode").value); });
  $("copyInvite").addEventListener("click", () => {
    const link = location.origin + location.pathname + "?add=" + myCode;
    const text = "Читаем Библию вместе в «Огоньке»! Мой код: " + myCode + "\n" + link;
    const done = () => O().toast("Приглашение скопировано. Отправьте его другу.");
    try { navigator.clipboard.writeText(text).then(done, () => window.prompt("Скопируйте приглашение:", text)); }
    catch (e) { window.prompt("Скопируйте приглашение:", text); }
  });

  /* ---------- session ---------- */
  A.onAuthStateChanged(auth, async (user) => {
    Object.values(friendUnsubs).forEach((u) => u()); friendUnsubs = {}; friendData = {};
    if (myUnsub) { myUnsub(); myUnsub = null; }
    if (inboxUnsub) { inboxUnsub(); inboxUnsub = null; } cheerQueue = []; seenCheers.clear();
    if (!user) {
      me = null; O().setRemote(null); O().onSave = null; O().onPersonClick = null; O().setPathPeople([]); closeProfile();
      $("friendsCard").hidden = true; $("inviteCard").hidden = true; $("logoutBtn").hidden = false;
      if (lsGet(OWNER_KEY)) { lsSet(OWNER_KEY, null); O().setState(O().fresh()); }
      top.textContent = "Войти"; top.classList.remove("user"); topAction = () => { lsSet(SKIP_KEY, null); $("auth").hidden = false; };
      if (lsGet(SKIP_KEY)) { $("auth").hidden = true; showLoginLink(); }
      else { $("account").hidden = true; $("auth").hidden = false; }
      return;
    }
    me = user; lsSet(SKIP_KEY, null); O().setMyPhoto(user.photoURL);
    top.textContent = (user.displayName || user.email || "Аккаунт").split(" ")[0]; top.classList.add("user");
    top.title = "Вы вошли как " + (user.displayName || user.email || "") + ". Нажмите, чтобы выйти.";
    topAction = () => {
      if (top.dataset.armed) { O().setRemote(null); O().onSave = null; A.signOut(auth); return; }
      top.dataset.armed = "1"; const t = top.textContent; top.textContent = "Выйти?";
      setTimeout(() => { delete top.dataset.armed; if (me) top.textContent = t; }, 3000);
    };
    $("auth").hidden = true; $("account").hidden = false; $("logoutBtn").hidden = false;
    $("accountPhone").textContent = "Вы вошли: " + (user.displayName || user.email || "");
    $("storage").textContent = "Прогресс сохраняется в вашем аккаунте";

    // progress left on this device by another account is not mixed in
    const owner = lsGet(OWNER_KEY);
    if (owner && owner !== user.uid) O().setState(O().fresh());
    lsSet(OWNER_KEY, user.uid);

    const ref = F.doc(db, "users", user.uid);
    myRef = F.doc(db, "profiles", user.uid);
    try {
      const snap = await F.getDoc(ref);
      const local = O().getState(), remote = snap.exists() ? snap.data() : null;
      if (remote && O().score(remote) >= O().score(local)) O().setState(remote);
      else await F.setDoc(ref, local);
    } catch (e) { console.warn(e); O().toast("Не удалось загрузить прогресс. Проверьте интернет."); }
    let chain = Promise.resolve();
    O().setRemote((s) => { chain = chain.then(() => F.setDoc(ref, s)).catch((e) => { console.warn(e); O().toast("Не удалось сохранить на сервере. Попробуем при следующей отметке."); }); });

    try {
      await ensureProfile(user);
      if (user.email) await F.setDoc(F.doc(db, "emails", user.email.toLowerCase()), { uid: user.uid }).catch((e) => console.warn(e));
      $("myEmail").textContent = user.email || "";
      $("myId").textContent = user.uid;
      $("friendsCard").hidden = false; $("inviteCard").hidden = false;
      O().onSave = () => { publishSummary(); renderFriends(); };
      publishSummary();
      myUnsub = F.onSnapshot(myRef, (snap) => { myProfile = snap.exists() ? snap.data() : {}; syncFriendSubs(myProfile.friends || []); });
      O().onPersonClick = (id) => openProfile(id);
      listenCheers();
      const add = new URLSearchParams(location.search).get("add");
      if (add) { history.replaceState(null, "", location.pathname); addFriendByCode(add); }
    } catch (e) { console.warn(e); O().toast("Не удалось загрузить друзей. Проверьте настройки Firestore."); }
  });
}

main().catch((e) => {
  console.error(e);
  const top = $("loginTop"); if (top) { top.hidden = false; top.textContent = "Войти"; top.onclick = () => O() && O().toast("Не удалось загрузить вход Google. Проверьте интернет и обновите страницу."); }
  if (O()) O().toast("Не удалось загрузить вход Google. Проверьте интернет и обновите страницу.");
});
