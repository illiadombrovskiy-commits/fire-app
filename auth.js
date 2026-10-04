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
  // вход и выход — только кнопкой вверху (внизу страницы ничего не показываем)
  function showLoginLink() { $("account").hidden = true; }

  /* ---------- friends ---------- */
  let me = null, myRef = null, myCode = "", myNick = "", friendUnsubs = {}, friendData = {}, myUnsub = null, myFriends = [], myFollowing = [], myFollowers = [], myDeclined = [], knownReq = null;

  function randomCode() { let s = ""; const a = new Uint32Array(6); crypto.getRandomValues(a); a.forEach((n) => { s += CODE_ABC[n % CODE_ABC.length]; }); return s; }

  async function ensureProfile(user) {
    const snap = await F.getDoc(myRef);
    const data = snap.exists() ? snap.data() : null;
    myNick = (data && data.nick) || "";
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
  // имя, которое видят друзья: своё (если задано) или из Google
  const myName = () => (myNick || (me && me.displayName) || "Читатель").slice(0, 40);
  function setTopName() { if (me) top.textContent = myName().split(" ")[0]; }
  function publishSummary() {
    clearTimeout(pubTimer);
    pubTimer = setTimeout(() => {
      if (!me) return;
      const s = O().summary();
      // имена и фото моих друзей — чтобы мои друзья видели, кто у меня в друзьях
      const fof = {};
      myFriends.forEach((u) => { const f = friendData[u]; if (f) fof[u] = { n: String(f.name || "").slice(0, 60), p: f.photo || "" }; });
      lastFof = JSON.stringify(fof);
      F.setDoc(myRef, Object.assign(s, { fof, name: myName(), photo: me.photoURL || "", code: myCode, updated: F.serverTimestamp() }), { merge: true })
        .catch((e) => console.warn(e));
      F.setDoc(F.doc(db, "cards", me.uid), { name: myName(), photo: me.photoURL || "" }).catch((e) => console.warn(e));
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
      if (fuid === me.uid) { O().toast("Это вы сами"); return; }
      $("friendCode").value = "";
      openProfile(fuid); // сначала профиль — решите, добавлять ли
    } catch (e) { console.warn(e); O().toast("Не удалось добавить друга. Проверьте код или почту."); }
  }

  // заявка в друзья: я подписываюсь на человека; дружба — когда он примет заявку (или если он уже подписан на меня)
  async function addFriendUid(fuid) {
    if (fuid === me.uid) { O().toast("Это вы сами"); return false; }
    if (myFriends.includes(fuid)) { O().toast("Вы уже друзья"); return false; }
    const ref = F.doc(db, "profiles", fuid), already = myFollowing.includes(fuid);
    try {
      await F.updateDoc(ref, { followers: F.arrayUnion(me.uid) });
      await F.updateDoc(myRef, { following: F.arrayUnion(fuid) });
      let their = {}; try { const sn = await F.getDoc(ref); their = sn.exists() ? sn.data() : {}; } catch (e) {}
      if ((their.following || []).includes(me.uid)) {          // он уже звал меня — сразу друзья
        await F.updateDoc(ref, { friends: F.arrayUnion(me.uid) });
        await F.updateDoc(myRef, { friends: F.arrayUnion(fuid) });
        O().toast("Вы теперь друзья!");
      } else if (already) O().toast("Заявка уже отправлена — ждём, когда друг её примет");
      else O().toast("Заявка отправлена. Пока друг её не примет, вы подписаны на него");
      return true;
    } catch (e) { console.warn(e); O().toast("Не удалось отправить заявку. Попробуйте позже."); return false; }
  }

  async function acceptRequest(uid) {
    try {
      await F.updateDoc(myRef, { friends: F.arrayUnion(uid), following: F.arrayUnion(uid), declined: F.arrayRemove(uid) });
      await F.updateDoc(F.doc(db, "profiles", uid), { friends: F.arrayUnion(me.uid) });
      await F.updateDoc(F.doc(db, "profiles", uid), { followers: F.arrayUnion(me.uid) }).catch(() => {});
      O().toast("Заявка принята — теперь вы друзья!"); if (O().vibrate) O().vibrate([30, 40, 30]);
    } catch (e) { console.warn(e); O().toast("Не удалось принять заявку. Попробуйте позже."); }
  }
  async function declineRequest(uid) {
    try { await F.updateDoc(myRef, { declined: F.arrayUnion(uid) }); O().toast("Заявка отклонена — человек останется подписчиком"); }
    catch (e) { console.warn(e); O().toast("Не удалось. Попробуйте позже."); }
  }

  async function removeFriend(fuid) {
    try {
      await F.updateDoc(myRef, { friends: F.arrayRemove(fuid), following: F.arrayRemove(fuid) });
      await F.updateDoc(F.doc(db, "profiles", fuid), { friends: F.arrayRemove(me.uid) }).catch(() => {});
      await F.updateDoc(F.doc(db, "profiles", fuid), { followers: F.arrayRemove(me.uid) }).catch(() => {});
      O().toast("Друг удалён");
    } catch (e) { console.warn(e); O().toast("Не удалось удалить. Попробуйте позже."); }
  }
  async function unfollow(fuid) {
    try {
      await F.updateDoc(myRef, { following: F.arrayRemove(fuid) });
      await F.updateDoc(F.doc(db, "profiles", fuid), { followers: F.arrayRemove(me.uid) }).catch(() => {});
      O().toast("Вы отписались");
    } catch (e) { console.warn(e); O().toast("Не удалось. Попробуйте позже."); }
  }

  // подписка на профили: друзья и те, на кого я подписан
  function syncFriendSubs(friends, following) {
    myFriends = friends; myFollowing = following;
    const list = [...new Set(friends.concat(following))];
    Object.keys(friendUnsubs).forEach((uid) => { if (!list.includes(uid)) { friendUnsubs[uid](); delete friendUnsubs[uid]; delete friendData[uid]; } });
    list.forEach((uid) => {
      if (friendUnsubs[uid]) return;
      friendUnsubs[uid] = F.onSnapshot(F.doc(db, "profiles", uid),
        (snap) => { if (snap.exists()) friendData[uid] = snap.data(); else delete friendData[uid]; renderFriends(); if (fofChanged()) publishSummary(); },
        () => { delete friendData[uid]; renderFriends(); });
    });
    renderFriends();
  }
  const pendingRequests = () => myFollowers.filter((u) => !myFriends.includes(u) && !myDeclined.includes(u));
  const cardCache = {};
  async function cardOf(uid) {
    if (cardCache[uid]) return cardCache[uid];
    let c = {}; try { const sn = await F.getDoc(F.doc(db, "cards", uid)); c = sn.exists() ? sn.data() : {}; } catch (e) {}
    return (cardCache[uid] = c);
  }

  function flameSvg(lit) {
    const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    s.setAttribute("viewBox", "0 0 64 80"); s.setAttribute("class", "flame" + (lit ? "" : " off")); s.innerHTML = O().FLAME; return s;
  }
  /* ---------- воодушевление и приглашение почитать вместе ---------- */
  const CHEERS = [
    "Зажги свой огонёк — мы ждём тебя!",
    "Не хватает твоего огня сегодня!",
    "Мой огонёк уже горит — зажги и свой!",
    "Духом пламенейте! Ждём тебя сегодня на чтении"
  ];
  const INVITES = [
    "Давай почитаем вместе — зажжём огонь сегодня!",
    "Я начинаю читать. Присоединяйся!",
    "Почитаем Библию вместе? Сегодняшний отрывок ждёт нас",
    "15 минут со Словом — давай прямо сейчас, вместе"
  ];
  const KIND = {
    cheer: { list: CHEERS, limit: 2, key: "ogonek-cheers-sent", field: "cheer", title: "Воодушевить", verb: "воодушевляет вас",
      done: "Вы воодушевили сегодня ✓", full: "Сегодня вы уже воодушевили двух друзей", btn: "Воодушевить",
      rule: (left) => "Воодушевить можно только двух друзей в день. " + (left === 2 ? "Сегодня осталось: 2." : "Сегодня остался ещё один."),
      sent: "Отправлено! Пусть огонёк разгорится", again: "Сегодня вы уже воодушевляли этого друга" },
    invite: { list: INVITES, limit: 1, key: "ogonek-invite-sent", field: "invite", title: "Почитать вместе", verb: "зовёт почитать вместе",
      done: "Приглашение отправлено ✓", full: "Сегодня вы уже позвали друга", btn: "Позвать читать вместе",
      rule: () => "Позвать почитать вместе можно только одного друга в день — до того, как вы начнёте читать.",
      sent: "Приглашение отправлено! Начинайте читать", again: "Сегодня вы уже звали этого друга" }
  };
  const kindOf = (c) => (c && c.kind === "invite" ? "invite" : "cheer");
  const sentMap = (kind) => { try { return JSON.parse(lsGet(KIND[kind].key) || "{}"); } catch (e) { return {}; } };
  // кому я отправил сегодня: этот браузер + профиль (чтобы лимит работал на всех устройствах)
  function sentTodaySet(kind) {
    const t = O().today(), m = sentMap(kind), set = new Set(Object.keys(m).filter((k) => m[k] === t));
    const c = myProfile && myProfile[KIND[kind].field]; if (c && c.d === t) (c.u || []).forEach((u) => set.add(u));
    return set;
  }
  const sentToday = (uid, kind) => sentTodaySet(kind).has(uid);
  const left = (kind) => Math.max(0, KIND[kind].limit - sentTodaySet(kind).size);
  function markSent(uid, kind) {
    const K = KIND[kind], m = sentMap(kind), t = O().today();
    Object.keys(m).forEach((k) => { if (m[k] !== t) delete m[k]; }); m[uid] = t; lsSet(K.key, JSON.stringify(m));
    const u = [...sentTodaySet(kind)], patch = {}; patch[K.field] = { d: t, u };
    myProfile = Object.assign({}, myProfile, patch);
    F.setDoc(myRef, patch, { merge: true }).catch((e) => console.warn(e));
  }
  const litToday = (d) => d && d.ntLast === O().today() && d.otLast === O().today();
  const readAnyToday = (d) => d && (d.ntLast === O().today() || d.otLast === O().today());
  // воодушевлять: мой огонёк сегодня горит, а у друга ещё нет
  const canCheer = (d) => litToday(O().summary()) && !litToday(d);
  // звать почитать вместе: я сегодня ещё не начинал читать, и друг тоже
  const canInvite = (d) => !readAnyToday(O().summary()) && !readAnyToday(d);

  function actionButton(uid, d, kind) {
    const K = KIND[kind], b = el("button", "cheerbtn" + (kind === "invite" ? " invitebtn" : "")); b.type = "button";
    const sent = sentToday(uid, kind), full = !sent && left(kind) === 0;
    b.append(kind === "invite" ? bookSvg() : flameSvg(true), document.createTextNode(sent ? K.done : full ? K.full : K.btn));
    b.disabled = sent || full;
    b.addEventListener("click", (e) => { e.stopPropagation(); openPicker(uid, d, kind); });
    b.addEventListener("keydown", (e) => e.stopPropagation());
    return b;
  }
  function friendAction(uid, d) {
    if (canCheer(d)) return actionButton(uid, d, "cheer");
    if (canInvite(d)) return actionButton(uid, d, "invite");
    return null;
  }
  function bookSvg() {
    const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    s.setAttribute("viewBox", "0 0 24 24"); s.setAttribute("aria-hidden", "true");
    s.innerHTML = '<path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5zM12 6.5v13" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>';
    return s;
  }

  function openPicker(uid, d, kind) {
    const K = KIND[kind];
    if (!sentToday(uid, kind) && left(kind) === 0) { O().toast(K.full); return; }
    closeProfile();
    const modal = el("div", "fmodal"), sheet = el("div", "fsheet");
    sheet.setAttribute("role", "dialog"); sheet.setAttribute("aria-modal", "true");
    modal.addEventListener("click", (e) => { if (e.target === modal) closeProfile(); });
    document.addEventListener("keydown", escClose);
    const head = el("div", "fhead"), ht = el("div");
    ht.append(el("h2", null, K.title), el("div", "hint", (d.name || "Друг") + " получит уведомление"));
    const x = el("button", "fclose", "×"); x.type = "button"; x.setAttribute("aria-label", "Закрыть"); x.addEventListener("click", closeProfile);
    head.append(avatarEl(d.name, d.photo, 64), ht, x);
    const list = el("div", "cheerlist");
    K.list.forEach((txt, i) => {
      const o = el("button", "cheeropt", txt); o.type = "button";
      o.addEventListener("click", async () => {
        list.querySelectorAll("button").forEach((b) => { b.disabled = true; });
        const ok = await sendMsg(uid, i, kind);
        closeProfile();
        if (ok) { renderFriends(); try { navigator.vibrate && navigator.vibrate([30, 40, 30]); } catch (e) {} }
      });
      list.append(o);
    });
    const note = el("p", "hint", K.rule(left(kind))); note.style.margin = "0";
    sheet.append(head, note, el("span", "label", "Выберите слова"), list);
    modal.append(sheet); document.body.append(modal); list.querySelector("button").focus();
  }

  async function sendMsg(uid, i, kind) {
    const K = KIND[kind], day = O().today();
    const data = { from: me.uid, name: String(myName() || "Друг").slice(0, 60), photo: me.photoURL || "", msg: i, day, at: F.serverTimestamp() };
    if (kind === "invite") data.kind = "invite";
    try {
      await F.setDoc(F.doc(db, "cheers", uid, "inbox", me.uid + "_" + day + (kind === "invite" ? "_inv" : "")), data);
      markSent(uid, kind); O().toast(K.sent); return true;
    } catch (e) {
      console.warn(e);
      if (e && e.code === "permission-denied") { markSent(uid, kind); O().toast(K.again); return true; }
      O().toast("Не удалось отправить. Проверьте интернет."); return false;
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
  const msgText = (c) => { const L = KIND[kindOf(c)].list; return L[c.msg] || L[0]; };

  function systemNotify(c) {
    if (!("Notification" in window) || Notification.permission !== "granted" || !document.hidden) return;
    const title = (c.name || "Друг") + " " + KIND[kindOf(c)].verb;
    const opts = { body: msgText(c), icon: "icon-192.png", tag: "cheer-" + c.id, lang: "ru" };
    if (navigator.serviceWorker && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready.then((r) => r.showNotification(title, opts)).catch(() => { try { new Notification(title, opts); } catch (e) {} });
    } else { try { new Notification(title, opts); } catch (e) {} }
  }

  function showNextCheer() {
    if (cheerShown || !cheerQueue.length) return;
    if (document.querySelector(".fmodal")) { setTimeout(showNextCheer, 1500); return; }
    const c = cheerQueue.shift(); cheerShown = c;
    const inv = kindOf(c) === "invite";
    const modal = el("div", "fmodal"), sheet = el("div", "fsheet cheerin");
    sheet.setAttribute("role", "dialog"); sheet.setAttribute("aria-modal", "true");
    const from = el("div", "from"); from.append(avatarEl(c.name, c.photo, 36), el("span", null, (c.name || "Друг") + " " + KIND[kindOf(c)].verb));
    const fl = flameSvg(true);
    const q = el("blockquote", null, "«" + msgText(c) + "»");
    const acts = el("div", "acts");
    const lit = litToday(O().summary());
    const go = el("button", "btn-main", lit ? "Спасибо!" : inv ? "Читать вместе" : "Зажечь огонёк"); go.type = "button";
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
    const b = el("button", "linkbtn bellbtn", "Включить уведомления, чтобы видеть, когда вас воодушевляют или зовут читать");
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
    const act = !isMe && myFriends.includes(uid) && friendAction(uid, d); if (act) row.append(act);
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

  async function openProfile(id, edit) {
    if (!me) return;
    const isMe = id === "me" || id === me.uid;
    let d = isMe ? Object.assign(O().summary(), { name: myName(), photo: me.photoURL, about: myProfile.about || "", friends: myFriends }) : friendData[id];
    if (!d) { // профиль любого пользователя можно посмотреть, прежде чем подписываться
      try { const sn = await F.getDoc(F.doc(db, "profiles", id)); d = sn.exists() ? sn.data() : null; } catch (e) { console.warn(e); }
      if (!d) { O().toast("Не удалось открыть профиль. Возможно, человек ещё не обновил Огонёк."); return; }
    }
    closeProfile();
    const t = O().today(), modal = el("div", "fmodal"), sheet = el("div", "fsheet");
    sheet.setAttribute("role", "dialog"); sheet.setAttribute("aria-modal", "true");
    modal.addEventListener("click", (e) => { if (e.target === modal) closeProfile(); });
    document.addEventListener("keydown", escClose);

    const head = el("div", "fhead"), ht = el("div");
    ht.append(el("h2", null, isMe ? (d.name || "Вы") + " (вы)" : (d.name || "Читатель")), el("div", "hint", (d.streak || 0) + " " + O().plural(d.streak || 0, "день подряд", "дня подряд", "дней подряд")));
    const x = el("button", "fclose", "×"); x.type = "button"; x.setAttribute("aria-label", "Закрыть"); x.addEventListener("click", closeProfile);
    head.append(avatarEl(d.name, d.photo, 64), ht, x);

    const stats = el("div", "fstats");
    [[d.streak || 0, "подряд"], [d.best || 0, "рекорд"], [(d.ntRead || 0) + (d.otRead || 0), "отрывков"], [d.gems || 0, "алмазов"]].forEach(([v, l]) => { const c = el("div", "fstat"); c.append(el("b", null, String(v)), el("span", null, l)); stats.append(c); });

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
    if (isMe && edit) {
      const nameIn = document.createElement("input"); nameIn.type = "text"; nameIn.maxLength = 40; nameIn.className = "nickin";
      nameIn.value = myName(); nameIn.placeholder = "Как вас называть, например: Илья"; nameIn.setAttribute("aria-label", "Имя");
      const nameLbl = el("span", "label", "Имя (его видят друзья)");
      aboutBox.querySelector(".label").textContent = "О себе";
      aboutBox.prepend(nameLbl, nameIn);
      const ta = document.createElement("textarea"); ta.maxLength = 300; ta.value = d.about || ""; ta.placeholder = "Пара слов о себе: церковь, город, любимая книга Библии…"; ta.style.minHeight = "160px"; ta.rows = 6;
      const save = el("button", "btn btn-xp aboutsave", "Сохранить"); save.type = "button";
      const count = el("small", "hint", ta.value.length + " / 300"); count.style.margin = "0";
      ta.addEventListener("input", () => { count.textContent = ta.value.length + " / 300"; save.classList.remove("saved"); save.textContent = "Сохранить"; });
      nameIn.addEventListener("input", () => { save.classList.remove("saved"); save.textContent = "Сохранить"; });
      save.addEventListener("click", async () => {
        save.disabled = true; save.textContent = "Сохраняю…";
        try {
          const nick = nameIn.value.replace(/\s+/g, " ").trim().slice(0, 40);
          myNick = nick && nick !== me.displayName ? nick : "";
          await F.setDoc(myRef, { about: ta.value.trim().slice(0, 300), nick: myNick, name: myName() }, { merge: true });
          await F.setDoc(F.doc(db, "cards", me.uid), { name: myName(), photo: me.photoURL || "" }).catch((e) => console.warn(e));
          myProfile = Object.assign({}, myProfile, { about: ta.value.trim().slice(0, 300), nick: myNick });
          nameIn.value = myName(); setTopName(); renderFriends();
          const h2 = document.querySelector(".fsheet .fhead h2"); if (h2) h2.textContent = myName() + " (вы)";
          save.classList.add("saved"); save.textContent = "Сохранено ✓";
          ta.classList.remove("aboutok"); void ta.offsetWidth; ta.classList.add("aboutok");
          const r = save.getBoundingClientRect(); if (O().burst) O().burst(r.left + r.width / 2, r.top + r.height / 2, 30);
          try { navigator.vibrate && navigator.vibrate([30, 40, 30]); } catch (e) {}
          O().toast("Сохранено — друзья увидят ваше имя и «О себе»");
        } catch (e) { console.warn(e); save.textContent = "Сохранить"; O().toast("Не удалось сохранить. Попробуйте позже."); }
        finally { save.disabled = false; }
      });
      const row = el("div", "aboutrow"); row.append(count, save);
      aboutBox.append(ta, row);
    } else if (isMe) {
      aboutBox.append(el("p", "fabout" + (d.about ? "" : " empty"), d.about || "Вы пока ничего не написали."));
      aboutBox.append(el("small", "hint", "Изменить можно вверху: нажмите на своё имя → «О себе»."));
    } else aboutBox.append(el("p", "fabout" + (d.about ? "" : " empty"), d.about || "Пока ничего не написал(а)."));

    const badges = el("div", "freading"); badges.append(el("span", "label", "Награды: " + ((d.awards || []).length)));
    const bw = el("div", "fbadges");
    (d.awards || []).forEach((aid) => { const m = O().medal(aid, 40); if (!m) return; const w = el("div"); w.innerHTML = m.svg; w.title = m.name + " — " + m.desc; bw.append(w); });
    if (!(d.awards || []).length) bw.append(el("span", "hint", "Пока нет наград"));
    badges.append(bw);

    sheet.append(head, stats, reading);
    const act = !isMe && myFriends.includes(id) && friendAction(id, d);
    if (act) sheet.append(act);
    else if (!isMe && myFriends.includes(id) && !litToday(d) && !litToday(O().summary())) sheet.append(el("p", "hint", "Зажгите сегодня свой огонёк — и сможете воодушевить друга."));
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
        row.style.cursor = "pointer"; row.title = "Открыть профиль";
        row.addEventListener("click", (e) => { if (!e.target.closest("button")) openProfile(u); });
        if (!nm) { const h = el("small", "hint", "имя появится, когда он откроет Огонёк"); h.style.margin = "0"; row.querySelector("span").append(document.createElement("br"), h); }
        if (myFriends.includes(u) || myFollowing.includes(u)) { const b = el("span", "hint", myFriends.includes(u) ? "Уже друзья" : "Заявка отправлена"); b.style.flex = "none"; row.append(b); }
        else {
          const b = el("button", "btn btn-xp", "Добавить"); b.type = "button";
          b.addEventListener("click", async () => { b.disabled = true; const ok = await addFriendUid(u); b.textContent = ok ? "Заявка ✓" : "Добавить"; b.disabled = ok; });
          row.append(b);
        }
      });
      const isFriend = myFriends.includes(id), isFollowing = myFollowing.includes(id), asksMe = myFollowers.includes(id);
      if (!isFriend && !isFollowing) {
        // ещё не подписан: можно отправить заявку или принять входящую
        const box = el("div", "frel");
        box.append(el("p", "hint", asksMe ? "Этот человек хочет стать вашим другом." : "Хотите читать вместе? Отправьте заявку — когда её примут, вы станете друзьями."));
        const go = el("button", "btn-main", asksMe ? "Принять заявку" : "Добавить в друзья"); go.type = "button";
        go.addEventListener("click", async () => { go.disabled = true; if (asksMe) await acceptRequest(id); else await addFriendUid(id); closeProfile(); });
        box.append(go); sheet.insertBefore(box, sheet.children[1]);
        modal.append(sheet); document.body.append(modal); x.focus(); return;
      }
      const lbl = isFriend ? "Удалить из друзей" : "Отменить заявку и отписаться";
      if (!isFriend) { const h = el("p", "hint", "Заявка в друзья отправлена. Пока друг её не примет, вы подписаны на него."); h.style.margin = "0"; sheet.insertBefore(h, sheet.children[1]); }
      const rm = el("button", "linkbtn", lbl); rm.type = "button"; rm.style.alignSelf = "center";
      rm.addEventListener("click", () => {
        if (rm.dataset.armed) { (isFriend ? removeFriend : unfollow)(id); closeProfile(); return; }
        rm.dataset.armed = "1"; rm.textContent = "Нажмите ещё раз для подтверждения"; setTimeout(() => { delete rm.dataset.armed; rm.textContent = lbl; }, 4000);
      });
      sheet.append(rm);
    }
    modal.append(sheet); document.body.append(modal); x.focus();
    if (isMe && edit) { const ta = sheet.querySelector("textarea"); if (ta) { ta.scrollIntoView({ block: "center" }); if (!ta.value) ta.focus(); } }
  }

  let friendsOpen = false, followersOpen = false;
  function renderFriends() {
    if (!me) return;
    $("myCode").textContent = myCode || "…";
    const box = $("friendsList"); box.textContent = "";
    // заявки в друзья (мои подписчики, которых я ещё не принял)
    const reqs = pendingRequests();
    if (reqs.length) {
      const rq = el("div", "freqs"); rq.append(el("span", "label", "Заявки в друзья · " + reqs.length));
      reqs.forEach((u) => {
        const row = el("div", "ffrow freq"), nm = el("span", null, "…"), av = el("div", "favatar", "?");
        row.append(av, nm);
        row.style.cursor = "pointer"; row.title = "Открыть профиль";
        row.addEventListener("click", (e) => { if (!e.target.closest("button")) openProfile(u); });
        cardOf(u).then((c) => { nm.textContent = c.name || "Читатель"; av.replaceWith(avatarEl(c.name, c.photo, 34)); });
        const ok = el("button", "btn btn-xp", "Принять"); ok.type = "button";
        ok.addEventListener("click", () => { ok.disabled = true; acceptRequest(u); });
        const no = el("button", "btn", "Отклонить"); no.type = "button";
        no.addEventListener("click", () => { no.disabled = true; declineRequest(u); });
        const bt = el("div", "fbtns"); bt.append(ok, no); row.append(bt); rq.append(row);
      });
      box.append(rq);
    }
    const mine = Object.assign(O().summary(), { name: myName(), photo: me.photoURL });
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
    // подписки: заявка отправлена, но ещё не принята — видны в списке, но не на тропинке
    const subs = myFollowing.filter((u) => !myFriends.includes(u));
    if (subs.length) {
      const sb = el("div", "fsubs"); sb.append(el("span", "label", "Вы подписаны · ждут подтверждения"));
      subs.forEach((u) => {
        const d = friendData[u] || {}, row = el("div", "ffrow"); row.tabIndex = 0; row.setAttribute("role", "button");
        row.append(avatarEl(d.name, d.photo, 34), el("span", null, d.name || "Читатель"), el("small", "hint", "заявка отправлена"));
        row.addEventListener("click", () => openProfile(u)); sb.append(row);
      });
      box.append(sb);
    }
    // вкладка «Подписчики»: кто подписан на меня, но не друг — можно передумать и добавить в друзья
    const fols = myFollowers.filter((u) => !myFriends.includes(u) && !reqs.includes(u)); // новые заявки показаны выше
    const fd = document.createElement("details"); fd.className = "fold folsbox"; fd.open = followersOpen;
    fd.addEventListener("toggle", () => { followersOpen = fd.open; });
    const sm = document.createElement("summary"); sm.className = "foldhead";
    sm.append(el("span", "label", "Подписчики · " + fols.length), el("span", "chev")); sm.querySelector(".chev").setAttribute("aria-hidden", "true");
    const fb = el("div", "fsubs");
    if (!fols.length) fb.append(el("p", "hint", "Пока нет подписчиков. Подписчик — тот, кто отправил вам заявку, а вы её не приняли."));
    fols.forEach((u) => {
      const row = el("div", "ffrow freq"), nm = el("span", null, "…"), av = el("div", "favatar", "?");
      row.append(av, nm);
      row.style.cursor = "pointer"; row.title = "Открыть профиль";
      row.addEventListener("click", (e) => { if (!e.target.closest("button")) openProfile(u); });
      cardOf(u).then((c) => { nm.textContent = c.name || "Читатель"; av.replaceWith(avatarEl(c.name, c.photo, 34)); });
      const ok = el("button", "btn btn-xp", "Добавить в друзья"); ok.type = "button";
      ok.addEventListener("click", () => { ok.disabled = true; ok.textContent = "…"; acceptRequest(u); });
      const bt = el("div", "fbtns"); bt.append(ok); row.append(bt); fb.append(row);
    });
    fd.append(sm, fb); box.append(fd);
    // на тропинке — только друзья
    O().setPathPeople(myFriends.filter((u) => friendData[u]).map((u) => ({ id: u, name: friendData[u].name, photo: friendData[u].photo, nt: friendData[u].ntNext || 0, ot: friendData[u].otNext || 0 })));
    if (!myFriends.length) box.append(el("p", "hint", "Пока нет друзей. Отправьте другу приглашение или введите его код — он получит заявку."));
    const bell = bellButton(); if (bell && myFriends.length) box.append(bell);
  }

  $("addFriend").addEventListener("click", () => addFriendByCode($("friendCode").value));
  $("friendCode").addEventListener("keydown", (e) => { if (e.key === "Enter") addFriendByCode($("friendCode").value); });
  // копирование без всплывающих окон: сначала Clipboard API, иначе скрытое поле + execCommand (работает и на http)
  function copyText(text) {
    const legacy = () => {
      const ta = document.createElement("textarea"); ta.value = text; ta.setAttribute("readonly", "");
      ta.style.position = "fixed"; ta.style.top = "-1000px"; ta.style.opacity = "0"; document.body.append(ta);
      ta.select(); ta.setSelectionRange(0, text.length);
      let ok = false; try { ok = document.execCommand("copy"); } catch (e) {}
      ta.remove(); return ok;
    };
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text).then(() => true, () => legacy());
    return Promise.resolve(legacy());
  }
  $("copyInvite").addEventListener("click", async () => {
    const btn = $("copyInvite");
    const link = location.origin + location.pathname + "?add=" + myCode;
    const text = "Читаем Библию вместе в «Огоньке»! Мой код: " + myCode + "\n" + link;
    const ok = await copyText(text);
    if (ok) {
      btn.classList.remove("copied"); void btn.offsetWidth; btn.classList.add("copied"); btn.textContent = "Скопировано ✓";
      const r = btn.getBoundingClientRect(); if (O().burst) O().burst(r.left + r.width / 2, r.top + r.height / 2, 24);
      if (O().vibrate) O().vibrate([30, 40, 30]);
      O().toast("Приглашение скопировано. Отправьте его другу.");
      clearTimeout(btn._t); btn._t = setTimeout(() => { btn.classList.remove("copied"); btn.textContent = "Скопировать приглашение"; }, 2500);
    } else {
      O().toast("Не удалось скопировать. Ваш код: " + myCode);
    }
  });

  /* ---------- меню пользователя в шапке: «О себе» и «Выйти» ---------- */
  function closeUserMenu() { const m = document.querySelector(".usermenu"); if (m) m.remove(); top.setAttribute("aria-expanded", "false"); document.removeEventListener("click", outsideMenu, true); document.removeEventListener("keydown", escMenu); }
  function outsideMenu(e) { const m = document.querySelector(".usermenu"); if (m && !m.contains(e.target) && e.target !== top) closeUserMenu(); }
  function escMenu(e) { if (e.key === "Escape") { closeUserMenu(); top.focus(); } }
  function toggleUserMenu() {
    if (document.querySelector(".usermenu")) { closeUserMenu(); return; }
    const m = el("div", "usermenu"); m.setAttribute("role", "menu");
    const who = el("div", "umwho", me ? myName() : "");
    const about = el("button", "umitem", "Имя и о себе"); about.type = "button"; about.setAttribute("role", "menuitem");
    about.addEventListener("click", () => { closeUserMenu(); openProfile("me", true); });
    const out = el("button", "umitem danger", "Выйти"); out.type = "button"; out.setAttribute("role", "menuitem");
    out.addEventListener("click", () => {
      if (out.dataset.armed) { closeUserMenu(); O().setRemote(null); O().onSave = null; A.signOut(auth); return; }
      out.dataset.armed = "1"; out.textContent = "Нажмите ещё раз, чтобы выйти";
      setTimeout(() => { delete out.dataset.armed; out.textContent = "Выйти"; }, 3000);
    });
    m.append(who, about, out);
    const r = top.getBoundingClientRect();
    m.style.top = (r.bottom + window.scrollY + 6) + "px";
    m.style.right = Math.max(8, document.documentElement.clientWidth - r.right) + "px";
    document.body.append(m); top.setAttribute("aria-expanded", "true"); about.focus();
    setTimeout(() => { document.addEventListener("click", outsideMenu, true); document.addEventListener("keydown", escMenu); }, 0);
  }

  /* ---------- session ---------- */
  A.onAuthStateChanged(auth, async (user) => {
    Object.values(friendUnsubs).forEach((u) => u()); friendUnsubs = {}; friendData = {}; myFriends = []; myFollowing = []; myFollowers = []; myDeclined = []; knownReq = null;
    if (myUnsub) { myUnsub(); myUnsub = null; }
    if (inboxUnsub) { inboxUnsub(); inboxUnsub = null; } cheerQueue = []; seenCheers.clear();
    if (!user) {
      closeUserMenu(); top.removeAttribute("aria-haspopup"); top.removeAttribute("aria-expanded"); top.title = "";
      me = null; O().setRemote(null); O().onSave = null; O().onPersonClick = null; O().setPathPeople([]); closeProfile();
      $("friendsCard").hidden = true; $("inviteCard").hidden = true;
      if (lsGet(OWNER_KEY)) { lsSet(OWNER_KEY, null); O().setState(O().fresh()); }
      top.textContent = "Войти"; top.classList.remove("user"); topAction = () => { lsSet(SKIP_KEY, null); $("auth").hidden = false; };
      if (lsGet(SKIP_KEY)) { $("auth").hidden = true; showLoginLink(); }
      else { $("account").hidden = true; $("auth").hidden = false; }
      return;
    }
    me = user; lsSet(SKIP_KEY, null); O().setMyPhoto(user.photoURL);
    top.textContent = (myNick || user.displayName || user.email || "Аккаунт").split(" ")[0]; top.classList.add("user");
    top.title = "Вы вошли как " + (user.displayName || user.email || "");
    top.setAttribute("aria-haspopup", "menu"); top.setAttribute("aria-expanded", "false");
    topAction = () => toggleUserMenu();
    $("auth").hidden = true; $("account").hidden = true;
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
      myUnsub = F.onSnapshot(myRef, (snap) => {
        myProfile = snap.exists() ? snap.data() : {};
        myFollowers = myProfile.followers || []; myDeclined = myProfile.declined || [];
        if ((myProfile.nick || "") !== myNick) { myNick = myProfile.nick || ""; setTopName(); }
        // новая заявка — короткое уведомление
        const pend = pendingRequests();
        if (knownReq) pend.filter((u) => !knownReq.has(u)).forEach((u) => cardOf(u).then((c) => O().toast((c.name || "Читатель") + " хочет стать вашим другом")));
        knownReq = new Set(pend);
        syncFriendSubs(myProfile.friends || [], myProfile.following || []);
      });
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
