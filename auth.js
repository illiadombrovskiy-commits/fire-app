// Вход через Google (Firebase Authentication), прогресс и друзья (Cloud Firestore).
import { firebaseConfig } from "./firebase-config.js?v=202610031821";
import { createEncouragementService } from "./src/encouragement-service.js?v=reading-sync-1";
import { createFriendActions } from "./src/friend-actions.js?v=refactor11";
import { createEncouragementConfig } from "./src/encouragement-config.js?v=refactor10";
import { createFriendLookup } from "./src/friend-lookup.js?v=refactor10";
import { shrinkPhoto } from "./src/profile-photo.js?v=refactor9";
import { fKeys,fLabel,fShort,fDone,fRef,fUrl,fLit } from "./src/friend-progress.js?v=reading-sync-1";

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
  let me = null, myRef = null, myCode = "", myNick = "", myNameSet = false, friendUnsubs = {}, friendData = {}, myUnsub = null, myFriends = [], myFollowing = [], myFollowers = [], myDeclined = [], knownReq = null, globeHide = false, activeProfileId = null;

  function randomCode() { let s = ""; const a = new Uint32Array(6); crypto.getRandomValues(a); a.forEach((n) => { s += CODE_ABC[n % CODE_ABC.length]; }); return s; }

  async function ensureProfile(user) {
    const snap = await F.getDoc(myRef);
    const data = snap.exists() ? snap.data() : null;
    globeHide = !!(data && data.globeHide);
    myNick = (data && data.nick) || ""; myNameSet = !!(data && (data.nameSet || data.nick));
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
      const profileUpdate = Object.assign(s, { flameDay: fLit(s, O().today()) ? O().today() : "", fof, name: myName(), photo: myPhoto(), updated: F.serverTimestamp() });
      if (myCode) profileUpdate.code = myCode; // never erase codes when initialization fails
      F.setDoc(myRef, profileUpdate, { merge: true })
        .catch((e) => { console.warn("Could not publish reading status", e); O().toast("Чтение сохранено на телефоне, но пока не синхронизировано с друзьями."); });
      F.setDoc(F.doc(db, "cards", me.uid), { name: myName(), photo: myPhoto() }).catch((e) => console.warn(e));
      publishGlobe(s);
    }, 1200);
  }

  // друг ищется по коду (6 знаков), по почте Google или по ID
  const findFriendUid=createFriendLookup(F,db);

  async function addFriendByCode(input) {
    const raw = (input || "").trim();
    if (!raw) { O().toast("Введите код, почту или ID друга"); return; }
    try {
      const fuid = await findFriendUid(raw);
      if (fuid === undefined) { O().toast("Введите код из 6 знаков, почту Google или ID друга"); return; }
      if (!fuid) { O().toast(raw.includes("@") ? "Человек с такой почтой ещё не входил в приложение «В Слове»" : "Код не найден. Проверьте его ещё раз."); return; }
      if (fuid === me.uid) { O().toast("Это вы сами"); return; }
      $("friendCode").value = "";
      openProfile(fuid); // сначала профиль — решите, добавлять ли
    } catch (e) { console.warn(e); O().toast("Не удалось добавить друга. Проверьте код или почту."); }
  }

  const {addFriendUid,acceptRequest,declineRequest,removeFriend,unfollow}=createFriendActions({F,db,O,getContext:()=>({me,myRef,myFriends,myFollowing})});

  // подписка на профили: друзья и те, на кого я подписан
  function syncFriendSubs(friends, following) {
    myFriends = friends; myFollowing = following;
    const list = [...new Set(friends.concat(following))];
    Object.keys(friendUnsubs).forEach((uid) => { if (!list.includes(uid)) { friendUnsubs[uid](); delete friendUnsubs[uid]; delete friendData[uid]; } });
    list.forEach((uid) => {
      if (friendUnsubs[uid]) return;
      friendUnsubs[uid] = F.onSnapshot(F.doc(db, "profiles", uid),
        (snap) => {
          const before = friendData[uid];
          if (snap.exists()) friendData[uid] = snap.data(); else delete friendData[uid];
          renderFriends();
          // Refresh an open friend's profile instead of leaving a frozen snapshot.
          if (activeProfileId === uid && JSON.stringify(before) !== JSON.stringify(friendData[uid]) && document.querySelector(".fmodal")) {
            openProfile(uid, false, true);
          }
          if (globeList && window.OgonekGlobe && window.OgonekGlobe.isOpen()) refreshGlobeList();
          if (fofChanged()) publishSummary();
        },
        (e) => { console.warn("Friend subscription failed", e); delete friendData[uid]; renderFriends(); if (globeList) refreshGlobeList(); });
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

  const flameSvg = window.OgonekProgressVisual.flameSvg;
  /* ---------- воодушевление и приглашение почитать вместе ---------- */
  const {CHEERS,INVITES,KIND,kindOf}=createEncouragementConfig();
  const {sentTodaySet,sentToday,left,markSent,litToday,readAnyToday,canCheer,canInvite,sendMsg}=createEncouragementService({KIND,lsGet,lsSet,O,F,db,fLit,getProfile:()=>myProfile,setProfile:v=>{myProfile=v},getRef:()=>myRef,getMe:()=>me,myName,myPhoto});

  function actionButton(uid, d, kind) {
    const K = KIND[kind], b = el("button", "cheerbtn" + (kind === "invite" ? " invitebtn" : "")); b.type = "button";
    const sent = sentToday(uid, kind), full = !sent && left(kind) === 0;
    b.append(kind === "invite" ? bookSvg() : flameSvg(true), document.createTextNode(sent ? K.done : full ? K.full : K.btn));
    b.disabled = sent || full;
    b.addEventListener("click", (e) => { e.stopPropagation(); openPicker(uid, d, kind); });
    b.addEventListener("keydown", (e) => e.stopPropagation());
    return b;
  }
  // пол: братья — братьям, сёстры — сёстрам; пока кто-то не выбрал пол — как раньше
  const myG = () => { try { return (window.ogGender && window.ogGender()) || ""; } catch (e) { return ""; } };
  const sameSex = (d) => { const g = myG(), h = d && d.gender; return !g || !h || g === h; };
  function friendAction(uid, d) {
    if (!sameSex(d)) return null;
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
    try { if (O().ntLoad && !O().ntLoad().friends) return; } catch (e) {} // «От друзей» выключено в настройках уведомлений
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
    const ck = kindOf(c), isConf = ck === "conf" || ck === "confjoin";
    const lit = isConf ? false : litToday(O().summary());
    const go = el("button", "btn-main", isConf ? (ck === "confjoin" ? "Присоединиться" : "Открыть челлендж") : lit ? "Спасибо!" : inv ? "Читать вместе" : "Зажечь огонёк"); go.type = "button";
    acts.append(go);
    const done = () => {
      modal.remove(); document.removeEventListener("keydown", esc);
      F.deleteDoc(F.doc(db, "cheers", me.uid, "inbox", c.id)).catch((e) => console.warn(e));
      cheerShown = null; setTimeout(showNextCheer, 400);
    };
    const esc = (e) => { if (e.key === "Escape") done(); };
    document.addEventListener("keydown", esc);
    go.addEventListener("click", () => { done(); if (isConf && window.confGo) { window.confGo(ck === "confjoin"); return; } if (!lit) window.scrollTo({ top: 0, behavior: "smooth" }); });
    if (!lit) { const later = el("button", "linkbtn", "Позже"); later.type = "button"; later.addEventListener("click", done); acts.append(later); }
    sheet.append(fl, from, q, acts);
    modal.append(sheet); document.body.append(modal); go.focus();
    try { navigator.vibrate && navigator.vibrate([60, 40, 60, 40, 140]); } catch (e) {}
  }

  // одно согласие на всё: воодушевления и приглашения от друзей + напоминания
  function bellButton() {
    if (!("Notification" in window) || Notification.permission !== "default") return null;
    const b = el("button", "linkbtn bellbtn", "🔔 Включить уведомления: напоминания и воодушевления от друзей");
    b.type = "button";
    b.addEventListener("click", async () => {
      let perm = "default"; try { perm = await Notification.requestPermission(); } catch (e) {}
      if (perm === "granted") {
        lsSet(REMIND_KEY, "1"); await refreshPush();
        O().toast("Уведомления включены");
      }
      renderFriends();
    });
    return b;
  }

  function fmtAhead(n) { n = n || 0; return n > 0 ? "+" + n + " " + O().daysWord(n) : n < 0 ? "−" + Math.abs(n) + " " + O().daysWord(Math.abs(n)) : "по плану"; }

  // расписание друга: у каждого может быть своё — показываем его собственные отрывки
  function friendPassages(d) {
    const s = d && d.globeSchedule;
    return s && Array.isArray(s.passages) && s.passages.length
      ? s.passages.filter(p => p && typeof p.ref === "string").slice(0, 3) : null;
  }
  function friendRow(d, isMe, uid) {
    const t = O().today(), row = el("div", "friend" + (isMe ? " me" : ""));
    const av = el("div", "favatar");
    if (d.photo) { const img = document.createElement("img"); img.src = d.photo; img.alt = ""; img.referrerPolicy = "no-referrer"; img.width = 40; img.height = 40; av.append(img); }
    else av.textContent = (d.name || "?").trim().charAt(0).toUpperCase();
    const mid = el("div"); mid.style.minWidth = "0";
    mid.append(el("div", "fname", isMe ? "Вы" : (d.name || "Читатель")));
    fKeys(d).forEach((k) => {
      const line = el("div", "fline");
      const readToday = d[k + "Last"] === t;
      line.append(el("span", null, fShort(d, k) + ": " + (fDone(d, k) ? "пройден" : fRef(d, k))));
      const st = el("span", readToday ? "ok" : null, readToday ? "✓" : "—"); st.title = readToday ? "Прочитано сегодня" : "Сегодня ещё не читал(а)"; line.append(st);
      mid.append(line);
    });
    const right = el("div", "fstreak");
    const lit = fLit(d, t);
    right.append(flameSvg(lit), el("span", null, String(d.streak || 0)), ...fKeys(d).map((k) => el("span", "fahead", fShort(d, k) + " " + fmtAhead(d[k + "Ahead"]))));
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
  // своё фото: загруженное с телефона (profiles.photoX, маленький JPEG data:) или фото Google
  function myPhoto() { return (myProfile && myProfile.photoX) || (me && me.photoURL) || ""; }
  function myPhotoS() { return (myProfile && myProfile.photoX && myProfile.photoS) || (me && me.photoURL) || ""; }
  function myPhotoHQ() { return (myProfile && myProfile.photoX && myProfile.photoHQ) || ""; }
  // фото с телефона: квадрат size×size JPEG, не длиннее maxLen знаков
  async function saveMyPhoto(ph) {
    ph = ph || { thumb: "", big: "", small: "" };
    myProfile = Object.assign({}, myProfile, { photoX: ph.thumb, photoHQ: ph.big, photoS: ph.small });
    await F.setDoc(myRef, { photoX: ph.thumb, photoHQ: ph.big, photoS: ph.small, photo: myPhoto() }, { merge: true });
    await F.setDoc(F.doc(db, "cards", me.uid), { name: myName(), photo: myPhoto() }).catch((e) => console.warn(e));
    O().setMyPhoto(myPhoto()); publishSummary(); renderFriends();
  }
  function avatarEl(name, photo, size, hq) {
    const av = el("div", "favatar");
    if (photo) { const img = document.createElement("img"); img.src = photo; img.alt = ""; img.referrerPolicy = "no-referrer"; img.width = size; img.height = size; if (hq) img.dataset.hq = hq; av.append(img); }
    else av.textContent = (name || "?").trim().charAt(0).toUpperCase();
    return av;
  }
  function closeProfile() { const m = document.querySelector(".fmodal"); if (m) m.remove(); activeProfileId = null; document.removeEventListener("keydown", escClose); }
  function escClose(e) { if (e.key === "Escape") closeProfile(); }

  async function openProfile(id, edit, skipRefresh) {
    if (!me) return;
    const isMe = id === "me" || id === me.uid;
    let d = isMe ? Object.assign(O().summary(), { name: myName(), photo: myPhoto(), about: myProfile.about || "", friends: myFriends }) : friendData[id];
    if (!d) { // профиль любого пользователя можно посмотреть, прежде чем подписываться
      try {
        const ref = F.doc(db, "profiles", id);
        const sn = await (F.getDocFromServer ? F.getDocFromServer(ref) : F.getDoc(ref));
        d = sn.exists() ? sn.data() : null;
      } catch (e) { console.warn(e); }
      if (!d) { O().toast("Не удалось открыть профиль. Проверьте интернет и попробуйте ещё раз."); return; }
    }
    closeProfile();
    activeProfileId = isMe ? me.uid : id;
    // Show cached data instantly; revalidate it from the actual server.
    if (!isMe && !skipRefresh && F.getDocFromServer) {
      const shown = d;
      F.getDocFromServer(F.doc(db, "profiles", id)).then((sn) => {
        if (!sn.exists()) return;
        const latest = sn.data();
        friendData[id] = latest;
        if (JSON.stringify(shown) !== JSON.stringify(latest)) {
          renderFriends();
          if (activeProfileId === id && document.querySelector(".fmodal")) openProfile(id, false, true);
        }
      }).catch((e) => console.warn("Could not refresh friend profile", e));
    }
    const t = O().today(), modal = el("div", "fmodal"), sheet = el("div", "fsheet");
    sheet.setAttribute("role", "dialog"); sheet.setAttribute("aria-modal", "true");
    modal.addEventListener("click", (e) => { if (e.target === modal) closeProfile(); });
    document.addEventListener("keydown", escClose);

    const head = el("div", "fhead"), ht = el("div");
    ht.append(el("h2", null, isMe ? (d.name || "Вы") + " (вы)" : (d.name || "Читатель")), el("div", "hint", (d.streak || 0) + " " + O().plural(d.streak || 0, "день подряд", "дня подряд", "дней подряд")));
    const x = el("button", "fclose", "×"); x.type = "button"; x.setAttribute("aria-label", "Закрыть"); x.addEventListener("click", closeProfile);
    head.append(avatarEl(d.name, d.photo, 64, isMe ? myPhotoHQ() : (d.photoHQ || "")), ht, x);

    const stats = el("div", "fstats");
    [[d.streak || 0, "подряд"], [d.best || 0, "рекорд"], [(d.ntRead || 0) + (d.otRead || 0), "отрывков"], [d.gems || 0, "алмазов"]].forEach(([v, l]) => { const c = el("div", "fstat"); c.append(el("b", null, String(v)), el("span", null, l)); stats.append(c); });

    const reading = el("div", "freading"); reading.append(el("span", "label", "Где читает"));
    const passages = friendPassages(d);
    if (passages) {
      reading.append(el("small", "hint", "Расписание: " + (d.globeSchedule.name || d.planName || "Моё расписание")));
      passages.forEach((p) => {
        const row = el("div", "frow"), left = el("div");
        const samePlan = d.globeSchedule.name === d.planName;
        const matchingKey = samePlan ? fKeys(d).find(k => fRef(d,k) === p.ref && (!p.key || p.key === k)) : null;
        const pace = Number.isFinite(p.ahead) ? p.ahead : matchingKey && Number.isFinite(d[matchingKey+"Ahead"]) ? d[matchingKey+"Ahead"] : null;
        const label = p.label === "НЗ" ? "Новый Завет" : p.label === "ВЗ" ? "Ветхий Завет" : p.label || "Отрывок";
        left.append(el("small", null, label + (pace === null ? " · нет данных о темпе" : " · " + fmtAhead(pace))));
        const safeUrl = (u) => { try { const x = new URL(u); return x.protocol === "https:" ? x.href : ""; } catch (_) { return ""; } };
        const matching = fKeys(d).find(k => fRef(d, k) === p.ref);
        const url = p.ref && (safeUrl(p.url) || (matching && safeUrl(fUrl(d, matching))) || (O().urlOfRef && safeUrl(O().urlOfRef(p.ref))));
        if (url) { const a = el("a", null, p.ref); a.href = url; a.target = "_blank"; a.rel = "noopener"; left.append(a); }
        else left.append(el("b", null, p.ref || "Пройдено"));
        row.append(left, el("span", p.last === t ? "ok" : "hint", p.last === t ? "✓ сегодня" : "сегодня ещё нет"));
        reading.append(row);
      });
    } else {
    if (d.planName && (d.plan || "spb") !== O().planId) reading.append(el("small", "hint", "Расписание: " + d.planName));
    fKeys(d).forEach((k) => {
      const done = fDone(d, k), readToday = d[k + "Last"] === t;
      const row = el("div", "frow"), left = el("div");
      left.append(el("small", null, fLabel(d, k) + " · " + fmtAhead(d[k + "Ahead"])));
      if (done) left.append(el("b", null, "Пройдено"));
      else { const a = el("a", null, fRef(d, k)); a.href = fUrl(d, k); a.target = "_blank"; a.rel = "noopener"; left.append(a); }
      row.append(left, el("span", readToday ? "ok" : "hint", readToday ? "✓ сегодня" : "сегодня ещё нет"));
      reading.append(row);
    });
    }

    const aboutBox = el("div", "freading"); aboutBox.append(el("span", "label", "О себе"));
    if (isMe && edit) {
      const nameIn = document.createElement("input"); nameIn.type = "text"; nameIn.maxLength = 40; nameIn.className = "nickin";
      nameIn.value = myName(); nameIn.placeholder = "Как вас называть, например: Илья"; nameIn.setAttribute("aria-label", "Имя");
      const nameLbl = el("span", "label", "Имя (его видят друзья)");
      aboutBox.querySelector(".label").textContent = "О себе";
      // фото профиля: загрузить с телефона / вернуть фото Google
      const phRow = el("div", "phrow"), phAv = avatarEl(myName(), myPhoto(), 64);
      const fin = document.createElement("input"); fin.type = "file"; fin.accept = "image/*"; fin.hidden = true;
      const phBtn = el("button", "btn phbtn"); phBtn.append(O().ico("camera"), el("span", null, "Сменить фото")); phBtn.type = "button"; phBtn.addEventListener("click", () => fin.click());
      const phBack = el("button", "linkbtn phback", "Вернуть фото Google"); phBack.type = "button"; phBack.hidden = !(myProfile && myProfile.photoX) || !me.photoURL;
      let phAvRef = phAv;
      const updHead = () => { const h = document.querySelector(".fsheet .fhead .favatar"); if (h) h.replaceWith(avatarEl(myName(), myPhoto(), 64, myPhotoHQ())); };
      fin.addEventListener("change", async () => {
        const f = fin.files && fin.files[0]; fin.value = ""; if (!f) return;
        phBtn.disabled = true; phBtn.lastChild.textContent = "Загружаю…";
        try { const d = await shrinkPhoto(f); await saveMyPhoto(d); phAvRef.replaceWith(phAvRef = avatarEl(myName(), myPhoto(), 64)); updHead(); phBack.hidden = !me.photoURL; O().toast("Фото обновлено — его увидят друзья"); }
        catch (e) { console.warn(e); O().toast("Не удалось загрузить фото. Попробуйте другое."); }
        phBtn.disabled = false; phBtn.lastChild.textContent = "Сменить фото";
      });
      phBack.addEventListener("click", async () => { try { await saveMyPhoto(null); phAvRef.replaceWith(phAvRef = avatarEl(myName(), myPhoto(), 64)); updHead(); phBack.hidden = true; O().toast("Вернули фото Google"); } catch (e) { console.warn(e); } });
      const phCol = el("div", "phcol"); phCol.append(phBtn, phBack); phRow.append(phAv, phCol, fin);
      aboutBox.prepend(el("span", "label", "Фото"), phRow, nameLbl, nameIn);
      const ta = document.createElement("textarea"); ta.maxLength = 300; ta.value = d.about || ""; ta.placeholder = "Пара слов о себе: церковь, город, любимая книга Библии…"; ta.style.minHeight = "160px"; ta.rows = 6;
      const save = el("button", "btn btn-xp aboutsave", "Сохранить"); save.type = "button";
      const count = el("small", "hint", ta.value.length + " / 300"); count.style.margin = "0";
      ta.addEventListener("input", () => { count.textContent = ta.value.length + " / 300"; save.classList.remove("saved"); save.textContent = "Сохранить"; });
      nameIn.addEventListener("input", () => { save.classList.remove("saved"); save.textContent = "Сохранить"; });
      save.addEventListener("click", async () => {
        save.disabled = true; save.textContent = "Сохраняю…";
        try {
          const nick = nameIn.value.replace(/\s+/g, " ").trim().slice(0, 40);
          if (nick.length < 2) { O().toast("Введите имя — его видят друзья"); nameIn.focus(); save.textContent = "Сохранить"; return; }
          myNick = nick && nick !== me.displayName ? nick : "";
          await F.setDoc(myRef, { about: ta.value.trim().slice(0, 300), nick: myNick, name: myName() }, { merge: true });
          await F.setDoc(F.doc(db, "cards", me.uid), { name: myName(), photo: myPhoto() }).catch((e) => console.warn(e));
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

    // книжная полка: какие книги прочитаны и когда
    const bl = isMe ? null : (Array.isArray(d.books) ? d.books : []);
    const bn = isMe ? O().booksCount() : bl.length;
    const shelfBtn = el("button", "bsbtn", "📚 " + (isMe ? "Моя книжная полка" : "Книжная полка") + " · " + bn + " из 66"); shelfBtn.type = "button";
    shelfBtn.addEventListener("click", () => O().openBooks(isMe ? null : bl, isMe ? null : (d.name || "").split(" ")[0]));
    // пройденные расписания (и для друзей), а у себя — ещё и управление своими расписаниями
    const pd = isMe ? null : (Array.isArray(d.plansDone) ? d.plansDone : []);
    const pathBtn = el("button", "bsbtn", "🏁 Прочитанные расписания · " + (isMe ? O().finishedCount() : pd.length)); pathBtn.type = "button";
    pathBtn.addEventListener("click", () => O().openFinished(isMe ? null : pd, isMe ? null : (d.name || "").split(" ")[0]));
    const prow = el("div", "fprow"); prow.append(pathBtn);
    prow.style.gridTemplateColumns = "1fr"; // свои расписания и челленджи — во вкладке «Расписания»
    sheet.append(head, stats, shelfBtn, prow, reading);
    const act = !isMe && myFriends.includes(id) && friendAction(id, d);
    if (act) sheet.append(act);
    else if (!isMe && myFriends.includes(id) && !litToday(d) && !litToday(O().summary())) sheet.append(el("p", "hint", "Зажгите сегодня свой огонёк — и сможете воодушевить друга."));
    // стихи, которые затронули (из сводки профиля)
    try { const nb = O().notesEl && O().notesEl(d.notes, isMe); if (nb) sheet.append(nb); } catch (e) { console.warn(e); }
    sheet.append(aboutBox, badges);

    if (!isMe) {
      // друзья друга: можно сразу добавить к себе
      const fof = el("div", "ffof"), others = (d.friends || []).filter((u) => u !== me.uid);
      // я тоже его друг — показываем себя первым, а в счётчике учитываем
      const meToo = myFriends.includes(id) || (d.friends || []).includes(me.uid), total = others.length + (meToo ? 1 : 0);
      fof.append(el("span", "label", "Друзья · " + total));
      if (meToo) { const r = el("div", "ffrow ffme"); r.append(avatarEl(myName(), myPhoto(), 34), el("span", null, myName() + " (вы)")); const b = el("span", "hint", "Это вы"); b.style.flex = "none"; r.append(b); fof.append(r); }
      if (!total) fof.append(el("span", "hint", "Друзей пока нет"));
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
        if (!nm) { const h = el("small", "hint", "имя появится, когда он откроет «В Слове»"); h.style.margin = "0"; row.querySelector("span").append(document.createElement("br"), h); }
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

  let allOpen = false, allTab = "friends";
  function sortedRows() {
    const mine = Object.assign(O().summary(), { name: myName(), photo: myPhoto() });
    const rows = [{ d: mine, me: true, uid: me.uid }].concat(myFriends.filter((u) => friendData[u]).map((u) => ({ d: friendData[u], me: false, uid: u })));
    return rows.sort((a, b) => (b.d.streak || 0) - (a.d.streak || 0));
  }
  const followersOnly = () => myFollowers.filter((u) => !myFriends.includes(u) && !pendingRequests().includes(u));
  const subsOnly = () => myFollowing.filter((u) => !myFriends.includes(u));
  function personRow(u, btnText, onBtn, note) {
    const row = el("div", "ffrow freq"), nm = el("span", null, "…"), av = el("div", "favatar", "?");
    row.append(av, nm); row.style.cursor = "pointer"; row.title = "Открыть профиль";
    row.addEventListener("click", (e) => { if (!e.target.closest("button")) openProfile(u); });
    const d = friendData[u];
    if (d && d.name) { nm.textContent = d.name; av.replaceWith(avatarEl(d.name, d.photo, 34)); }
    else cardOf(u).then((c) => { nm.textContent = c.name || "Читатель"; av.replaceWith(avatarEl(c.name, c.photo, 34)); });
    if (note) { const h = el("small", "hint", note); h.style.margin = "0"; row.append(h); }
    if (btnText) { const b = el("button", "btn btn-xp", btnText); b.type = "button"; b.addEventListener("click", () => { b.disabled = true; b.textContent = "…"; onBtn(u); }); const bt = el("div", "fbtns"); bt.append(b); row.append(bt); }
    return row;
  }
  // отдельный экран: все друзья, подписчики и подписки (удобно, когда друзей много)
  function openAll(tab) {
    closeProfile(); allTab = tab || allTab; allOpen = true;
    const modal = el("div", "fmodal fall"), sheet = el("div", "fsheet");
    sheet.setAttribute("role", "dialog"); sheet.setAttribute("aria-modal", "true");
    modal.addEventListener("click", (e) => { if (e.target === modal) closeAll(); });
    document.addEventListener("keydown", escAll);
    modal.append(sheet); document.body.append(modal); drawAll();
  }
  function closeAll() { allOpen = false; const m = document.querySelector(".fall"); if (m) m.remove(); document.removeEventListener("keydown", escAll); }
  function escAll(e) { if (e.key === "Escape") closeAll(); }
  function drawAll() {
    const sheet = document.querySelector(".fall .fsheet"); if (!sheet) { allOpen = false; return; }
    sheet.textContent = "";
    const head = el("div", "fhead"), h = el("h2", null, "Друзья и подписчики");
    const x = el("button", "fclose", "×"); x.type = "button"; x.setAttribute("aria-label", "Закрыть"); x.addEventListener("click", closeAll);
    head.append(h, x);
    const rows = sortedRows(), reqs = pendingRequests(), fols = followersOnly(), subs = subsOnly();
    const tabs = el("div", "ftabs");
    [["friends", "Друзья", rows.length - 1], ["followers", "Подписчики", fols.length + reqs.length], ["subs", "Подписки", subs.length]].forEach(([k, t, n]) => {
      const b = el("button", "ftab" + (allTab === k ? " on" : ""), t + " · " + n); b.type = "button";
      b.addEventListener("click", () => { allTab = k; drawAll(); }); tabs.append(b);
    });
    const list = el("div", "friends");
    if (allTab === "friends") {
      rows.forEach((r) => list.append(friendRow(r.d, r.me, r.uid)));
      if (rows.length < 2) list.append(el("p", "hint", "Пока нет друзей."));
    } else if (allTab === "followers") {
      reqs.forEach((u) => list.append(personRow(u, "Принять", acceptRequest, "новая заявка")));
      fols.forEach((u) => list.append(personRow(u, "Добавить в друзья", acceptRequest)));
      if (!reqs.length && !fols.length) list.append(el("p", "hint", "Пока нет подписчиков. Подписчик — тот, кто отправил вам заявку, а вы её не приняли."));
    } else {
      subs.forEach((u) => list.append(personRow(u, null, null, "заявка отправлена")));
      if (!subs.length) list.append(el("p", "hint", "Вы ни на кого не подписаны. Подписка — это ваша заявка, которую ещё не приняли."));
    }
    const top = el("div", "fallTop"); top.append(head, tabs); // шапка с крестиком и вкладками не уезжает при прокрутке
    sheet.append(top, list);
  }
  $("friendsAll").addEventListener("click", () => openAll("friends"));

  /* ---------- глобус читателей ---------- */
  // globe/{uid}: имя, фото, книга, которую человек читает сейчас, огонёк и серия. Видят все вошедшие; можно скрыть себя.
  function globeDoc(s) { return globeFrom(s, myName(), myPhotoS(), myFriends.length); }
  // запись для глобуса из сводки (своей или друга из его профиля)
  // ещё не начал читать: новая версия пишет noPlan / chosen; у старой версии смотрим, что ничего не прочитано
  function stillChoosing(s) {
    if (!s) return false;
    // кто хоть что-то прочитал (есть серия, рекорд, прочитанные отрывки) — уже не на острове, что бы ни было записано в флагах
    const rd = (s.ntRead || 0) + (s.otRead || 0) + ((s.conf && s.conf.u) || 0);
    if (rd > 0 || s.streak > 0 || s.best > 0 || (s.plansDone || []).length) return false;
    // профиль пишется с merge: старый noPlan:true мог остаться рядом с новым chosen:true — тогда верим chosen
    if (s.chosen === true) return false;
    if (s.noPlan === true) return true;
    return !s.plan || s.plan === "spb";
  }
  const toIce = (p) => Object.assign(p, { b: -2, spots: [], refs: ["Ещё выбирает расписание"], plan: "" });
  // сегодняшний стих — его видят все на глобусе до полуночи: только ссылка на стих, без слов
  function verseOf(s) {
    const t = O().today();
    const n = (Array.isArray(s && s.notes) ? s.notes : []).find((z) => z && z.v && z.d === t);
    return n ? { note: String(n.v).slice(0, 40), nd: n.d } : {};
  }
  function globeFrom(s, name, photo, fc) {
    const doc = Object.assign(globeFrom0(s, name, photo, fc), verseOf(s));
    if (typeof s.heroFlameDay === "string") {
      doc.lit = s.heroFlameDay === O().today() ? O().today() : "";
      if (Array.isArray(doc.spots)) doc.spots = doc.spots.map(p => Object.assign({}, p, {l: !!doc.lit}));
    }
    return doc;
  }
  function globeFrom0(s, name, photo, fc) {
    const t = O().today(), keys = fKeys(s), G = window.OgonekGlobe;
    // ещё не выбрал расписание — стоит на «Острове выбора», без книги
    if (stillChoosing(s)) return { name: String(name || "Читатель").slice(0, 60), photo: photo || "", b: -2, refs: ["Ещё выбирает расписание"], plan: "", streak: s.streak || 0, lit: "", seen: t, fc: fc || 0, spots: [] };
    if ("globeSchedule" in s && G && G.schedulePosition) {
      return {
        name: String(name || "Читатель").slice(0, 60), photo: photo || "",
        streak: s.streak || 0, seen: t, fc: fc || 0,
        ...G.schedulePosition(s.globeSchedule, t),
      };
    }
    let b = -1;
    if (G) for (const k of keys) { if (fDone(s, k)) continue; const i = G.bookIndex(fRef(s, k)); if (i >= 0) { b = i; break; } }
    return {
      name: String(name || "Читатель").slice(0, 60), photo: photo || "", b,
      refs: keys.slice(0, 3).map((k) => (fShort(s, k) + ": " + (fDone(s, k) ? "пройден" : fRef(s, k))).slice(0, 60)),
      plan: String(s.planName || "").slice(0, 60), streak: s.streak || 0,
      lit: fLit(s, t) ? t : "", seen: t, fc: fc || 0,
      // по огоньку на каждой книге, которую человек читает сейчас (НЗ и ВЗ): горит, если этот отрывок прочитан сегодня
      spots: G ? keys.filter((k) => !fDone(s, k)).map((k) => ({ b: G.bookIndex(fRef(s, k)), l: s[k + "Last"] === t })).filter((x) => x.b >= 0).slice(0, 3) : []
    };
  }
  function publishGlobe(s) {
    if (!me) return;
    const ref = F.doc(db, "globe", me.uid);
    const doc = globeDoc(s);
    // если правила Firestore ещё не обновлены (нет полей note/nd) — сохраняем без стиха
    (globeHide ? F.deleteDoc(ref) : F.setDoc(ref, doc).catch(() => { const d2 = Object.assign({}, doc); if (String(d2.photo || "").length > 500) d2.photo = (me.photoURL || "").slice(0, 500); return F.setDoc(ref, d2).catch(() => { delete d2.note; delete d2.nd; return F.setDoc(ref, d2); }); })).catch((e) => console.warn(e));
  }
  const relOf = (u) => myFriends.includes(u) ? "friend" : myFollowing.includes(u) ? "pending" : myFollowers.includes(u) && !myDeclined.includes(u) ? "req" : "";
  // Live public globe documents are the source of truth for daily flames.
  // Profile summaries are only a fallback for friends using an older version.
  let globeList = null, globeDocs = [], globeUnsub = null;
  function stopGlobeLive() {
    if (globeUnsub) { globeUnsub(); globeUnsub = null; }
    globeDocs = []; globeList = null;
  }
  function refreshGlobeList() {
    const G = window.OgonekGlobe;
    if (!me || !globeList || !G || !G.isOpen()) return;
    const mine = Object.assign(globeDoc(O().summary()), { id: me.uid, rel: "me" });
    const byId = new Map();
    globeDocs.forEach((p) => { if (p.id !== me.uid) byId.set(p.id, Object.assign({}, p, { rel: relOf(p.id) })); });
    Object.keys(friendData).forEach((uid) => {
      const d = friendData[uid]; if (!d) return;
      if (d.globeHide) { byId.delete(uid); return; }
      // Do not overwrite a recent globe document with a stale cached profile.
      if (!byId.has(uid)) {
        try { byId.set(uid, Object.assign(globeFrom(d, d.name, d.photo, (d.friends || []).length), { id: uid, rel: relOf(uid) })); }
        catch (e) { console.warn(e); }
      }
    });
    const list = [mine, ...byId.values()];
    list.forEach((p) => {
      if (!p.note || (p.rel !== "me" && p.rel !== "friend")) return;
      const d = p.rel === "me" ? O().summary() : friendData[p.id];
      const n = (d && Array.isArray(d.notes) ? d.notes : []).find((z) => z && z.v === p.note);
      if (n && n.w) p.w = String(n.w).slice(0, 1000);
    });
    globeList = list;
    G.setPeople(list);
  }
  function globeRelSync() { refreshGlobeList(); }
  function openGlobe() {
    const G = window.OgonekGlobe; if (!G || !me) return;
    stopGlobeLive();
    const mine = Object.assign(globeDoc(O().summary()), { id: me.uid, rel: "me" });
    globeList = [mine];
    G.open({
      people: [mine], visible: !globeHide, loading: true, onClose: stopGlobeLive,
      onAdd: async (id) => { const ok = await addFriendUid(id); if (!ok) return false; return myFollowers.includes(id) ? "friend" : "pending"; },
      onProfile: (id) => openProfile(id === me.uid ? "me" : id),
      onToggle: async () => {
        globeHide = !globeHide;
        try {
          await F.setDoc(myRef, { globeHide }, { merge: true });
          publishGlobe(O().summary());
          O().toast(globeHide ? "Вы скрыты с глобуса" : "Теперь вас видно на глобусе");
        } catch (e) { console.warn(e); globeHide = !globeHide; O().toast("Не удалось. Попробуйте позже."); }
        return !globeHide;
      }
    });
    // The previous getDocs call returned a one-time snapshot; live updates
    // now arrive while the globe is open, including on other people's phones.
    const q = F.query(F.collection(db, "globe"), F.limit(1000));
    globeUnsub = F.onSnapshot(q, (snap) => {
      globeDocs = [];
      snap.forEach((d) => {
        if (d.id === me.uid) return;
        const x = d.data();
        globeDocs.push({
          id: d.id, name: String(x.name || "Читатель").slice(0, 60), photo: x.photo || "",
          b: typeof x.b === "number" ? x.b : -1,
          spots: Array.isArray(x.spots) ? x.spots.slice(0, 3) : null,
          refs: Array.isArray(x.refs) ? x.refs.slice(0, 3).map(String) : [],
          plan: String(x.plan || ""), streak: x.streak || 0, lit: x.lit || "",
          fc: x.fc || 0, note: typeof x.note === "string" ? x.note.slice(0, 40) : "",
          nd: typeof x.nd === "string" ? x.nd : ""
        });
      });
      refreshGlobeList();
    }, (e) => {
      console.warn("Globe live updates failed", e);
      O().toast("Не удалось обновить глобус. Проверьте интернет.");
      refreshGlobeList();
    });
  }
  // Retry cloud publication on reconnect and when the app returns to the screen.
  function republishPresence() {
    if (!me || !myRef) return;
    publishSummary();
    if (globeList) refreshGlobeList();
  }
  window.addEventListener("online", republishPresence);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) republishPresence(); });
  {
    // глобус открывается кнопкой в центре нижней панели; в «Друзьях» отдельной кнопки больше нет
    window.ogonekOpenGlobe = () => openGlobe();
  }

  /* ---------- поиск друзей: по имени среди друзей, подписчиков и всех читателей «В Слове»; код или почта — сразу профиль ---------- */
  let fsReaders = null, fsReadersAt = 0, fsTimer = 0;
  const fsNorm = (s) => String(s || "").toLowerCase().replace(/ё/g, "е").replace(/\s+/g, " ").trim();
  async function fsLoadReaders() {
    if (fsReaders && Date.now() - fsReadersAt < 300000) return fsReaders;
    const out = [];
    try {
      const snap = await F.getDocs(F.query(F.collection(db, "globe"), F.limit(1000)));
      snap.forEach((d) => { const x = d.data() || {}; out.push({ uid: d.id, name: String(x.name || ""), photo: x.photo || "" }); });
    } catch (e) { console.warn(e); }
    fsReaders = out; fsReadersAt = Date.now(); return out;
  }
  function fsSetup() {
    if ($("fsearch")) return;
    const wrap = el("div", "fsearch"); wrap.id = "fsearch";
    const inp = document.createElement("input"); inp.type = "search"; inp.id = "fsInput"; inp.className = "fsinput";
    inp.placeholder = "🔍 Имя, код или почта"; inp.autocomplete = "off"; inp.setAttribute("enterkeyhint", "search");
    const clr = el("button", "fsclear", "×"); clr.type = "button"; clr.hidden = true; clr.setAttribute("aria-label", "Очистить");
    const res = el("div", "fsres"); res.id = "fsRes"; res.hidden = true;
    const row = el("div", "fsbar"); row.append(inp, clr); wrap.append(row, res);
    $("friendsList").before(wrap);
    const run = () => { clr.hidden = !inp.value; clearTimeout(fsTimer); fsTimer = setTimeout(() => fsSearch(inp.value), 250); };
    inp.addEventListener("input", run);
    inp.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); clearTimeout(fsTimer); fsSearch(inp.value, true); inp.blur(); } });
    // нажатие в любом другом месте экрана убирает клавиатуру — не нужно жать «Готово»
    const hideKb = (e) => { if (document.activeElement === inp && e.target !== inp && e.target !== clr) inp.blur(); };
    document.addEventListener("touchstart", hideKb, { passive: true, capture: true });
    document.addEventListener("mousedown", hideKb, true);
    clr.addEventListener("click", () => { inp.value = ""; clr.hidden = true; res.hidden = true; res.textContent = ""; inp.focus(); });
  }
  function fsPerson(uid, name, photo, note) {
    const row = el("div", "ffrow freq fsrow"); row.style.cursor = "pointer"; row.title = "Открыть профиль";
    const nm = el("span", "fsname", name || "Читатель");
    row.append(avatarEl(name, photo, 34), nm);
    if (note) row.append(el("small", "fsnote", note));
    const go = el("span", "fsgo", "›"); row.append(go);
    row.addEventListener("click", () => openProfile(uid === me.uid ? "me" : uid));
    return row;
  }
  async function fsSearch(raw, enter) {
    const res = $("fsRes"); if (!res) return;
    const q = String(raw || "").trim(), nq = fsNorm(q);
    if (!nq) { res.hidden = true; res.textContent = ""; return; }
    res.hidden = false; res.textContent = "";
    // код из 6 знаков или почта — ищем точно и открываем профиль
    const code = q.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const looksCode = !/\s/.test(q) && code.length === 6 && /^[A-Za-z0-9-]+$/.test(q), looksMail = q.includes("@");
    if (looksCode || looksMail) {
      const b = el("button", "btn btn-xp fsbtn", looksMail ? "Найти по почте " + q : "Найти по коду " + code); b.type = "button";
      b.addEventListener("click", () => addFriendByCode(q)); res.append(b);
      if (enter) { addFriendByCode(q); return; }
    }
    if (nq.length < 2) { res.append(el("p", "hint fshint", "Введите хотя бы две буквы имени")); return; }
    const words = nq.split(" "), hit = (name) => { const n = fsNorm(name); return words.every((w) => n.includes(w)); };
    const seen = new Set([me.uid]);
    // свои: друзья, заявки, подписчики и подписки
    const mine = [];
    const rel = (u) => myFriends.includes(u) ? "друг" : pendingRequests().includes(u) ? "заявка вам" : myFollowing.includes(u) ? "заявка отправлена" : myFollowers.includes(u) ? "подписчик" : "";
    const known = [...new Set(myFriends.concat(myFollowing, myFollowers))];
    await Promise.all(known.map(async (u) => {
      const d = friendData[u]; let name = d && d.name, photo = d && d.photo;
      if (!name) { const c = await cardOf(u); name = c.name; photo = c.photo; }
      if (name && hit(name)) { mine.push({ uid: u, name, photo }); seen.add(u); }
    }));
    if (fsNorm($("fsInput") && $("fsInput").value) !== nq) return; // пока искали, запрос изменился
    if (mine.length) {
      res.append(el("span", "label", "Ваши друзья и подписки"));
      mine.sort((a, b) => a.name.localeCompare(b.name, "ru")).forEach((p) => res.append(fsPerson(p.uid, p.name, p.photo, rel(p.uid))));
    }
    const wait = el("p", "hint fshint", "Ищу среди читателей «В Слове»…"); res.append(wait);
    const all = await fsLoadReaders();
    if (fsNorm($("fsInput") && $("fsInput").value) !== nq) return;
    wait.remove();
    const others = all.filter((p) => !seen.has(p.uid) && p.name && hit(p.name)).sort((a, b) => a.name.localeCompare(b.name, "ru"));
    if (others.length) {
      res.append(el("span", "label", "Читатели «В Слове» · " + others.length));
      others.slice(0, 30).forEach((p) => res.append(fsPerson(p.uid, p.name, p.photo, "")));
      if (others.length > 30) res.append(el("p", "hint fshint", "Показаны первые 30 — уточните имя"));
    }
    if (!mine.length && !others.length) res.append(el("p", "hint fshint", "Никого не нашли. Попросите у друга код из 6 знаков или его почту Google и введите сюда."));
    else res.append(el("p", "hint fshint", "Нажмите на человека, чтобы открыть профиль и добавить в друзья."));
  }

  function renderFriends() {
    if (!me) return;
    try { fsSetup(); } catch (e) { console.warn(e); }
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
    const rows = sortedRows();
    // на главной: я и два друга; все остальные — на отдельном экране «Все друзья и подписчики»
    let shown = 0;
    rows.forEach((r) => { if (r.me || shown < 2) { if (!r.me) shown++; box.append(friendRow(r.d, r.me, r.uid)); } });
    const more = rows.length - 1 - shown, fols = followersOnly(), subs = subsOnly();
    if (more > 0 || fols.length || subs.length) {
      const tg = el("button", "btn fmore"); tg.type = "button";
      tg.textContent = more > 0 ? "Показать всех друзей (" + (rows.length - 1) + ")" : "Подписчики и подписки";
      tg.addEventListener("click", () => openAll(more > 0 ? "friends" : fols.length ? "followers" : "subs"));
      box.append(tg);
    }
    $("friendsAll").hidden = false;
    if (allOpen) drawAll();
    // на пути — только друзья
    O().setPathPeople(myFriends.filter((u) => friendData[u]).map((u) => ({ id: u, name: friendData[u].name, photo: friendData[u].photo, nt: friendData[u].ntNext || 0, ot: friendData[u].otNext || 0, conf: friendData[u].conf || null, notes: Array.isArray(friendData[u].notes) ? friendData[u].notes.slice(0, 10) : [], plan: friendData[u].plan || "spb", keys: friendData[u].keys, refs: (Array.isArray(friendData[u].keys) && friendData[u].keys.length ? friendData[u].keys : ["nt", "ot"]).map((k) => friendData[u][k + "Ref"] || null) })));
    if (!myFriends.length) box.append(el("p", "hint", "Пока нет друзей. Отправьте другу приглашение или введите его код — он получит заявку."));
    const bell = bellButton(); if (bell) box.append(bell);
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
    const text = (window.confInviteText && window.confInviteText(myCode)) || ("Мой код в «В Слове»: " + myCode + "\n" + link);
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

  /* ---------- обязательное имя при первом входе ---------- */
  function askName(user) {
    return new Promise((resolve) => {
      const modal = el("div", "fmodal namegate"), sheet = el("div", "fsheet");
      sheet.setAttribute("role", "dialog"); sheet.setAttribute("aria-modal", "true");
      const h = el("h2", null, "Как вас зовут?");
      const p = el("p", "hint", "Это имя увидят ваши друзья. Без имени продолжить нельзя."); p.style.margin = "0";
      const inp = document.createElement("input"); inp.type = "text"; inp.maxLength = 40; inp.className = "nickin";
      inp.placeholder = "Например: " + ((user.displayName || "Илья").split(" ")[0]); inp.setAttribute("aria-label", "Имя"); inp.autocomplete = "given-name";
      const go = el("button", "btn-main", "Продолжить"); go.type = "button"; go.disabled = true;
      const ok = () => inp.value.replace(/\s+/g, " ").trim().length >= 2;
      inp.addEventListener("input", () => { go.disabled = !ok(); });
      const save = async () => {
        if (!ok()) { inp.focus(); return; }
        go.disabled = true; go.textContent = "Сохраняю…";
        const nick = inp.value.replace(/\s+/g, " ").trim().slice(0, 40);
        myNick = nick; myNameSet = true;
        try {
          await F.setDoc(myRef, { nick, name: nick, nameSet: true }, { merge: true });
          await F.setDoc(F.doc(db, "cards", user.uid), { name: nick, photo: user.photoURL || "" }).catch(() => {});
        } catch (e) { console.warn(e); }
        setTopName(); modal.remove(); resolve();
      };
      go.addEventListener("click", save);
      inp.addEventListener("keydown", (e) => { if (e.key === "Enter") save(); });
      sheet.append(h, p, inp, go); modal.append(sheet); document.body.append(modal);
      setTimeout(() => inp.focus(), 50);
    });
  }

  /* ---------- напоминание в 22:00: пуш через Firebase Cloud Messaging, рассылает GitHub Actions (.github/scripts/remind.py) ---------- */
  const REMIND_KEY = "ogonek-remind", REMIND_HIDE = "ogonek-remind-hide";
  const pushCapable = () => "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && "ontouchend" in document);
  const remindOn = () => lsGet(REMIND_KEY) !== "0" && "Notification" in window && Notification.permission === "granted"; // включено по умолчанию
  let MSG = null;
  async function pushToken() {
    const reg = await navigator.serviceWorker.register("sw.js"); await navigator.serviceWorker.ready;
    if (!MSG) { const Msg = await import(SDK + "firebase-messaging.js"); if (!(await Msg.isSupported())) throw new Error("unsupported"); MSG = { Msg, m: Msg.getMessaging(app) }; }
    return MSG.Msg.getToken(MSG.m, { serviceWorkerRegistration: reg });
  }
  async function savePush(token, on) {
    let cfg = null, hours = [22]; try { cfg = O().ntLoad(); hours = O().ntHours(cfg); } catch (e) {}
    const base = { on: !!on && hours.length > 0, hour: hours.includes(22) ? 22 : (hours[hours.length - 1] || 22), tz: -new Date().getTimezoneOffset(), updated: F.serverTimestamp() };
    if (token) base.tokens = F.arrayUnion(token);
    const ref = F.doc(db, "push", me.uid);
    // новые поля: hours (все часы напоминаний) и friends; если правила Firestore их ещё не знают — сохраняем как раньше
    try { await F.setDoc(ref, Object.assign({}, base, { hours, friends: cfg ? !!cfg.friends : true }), { merge: true }); }
    catch (e) { console.warn(e); await F.setDoc(ref, base, { merge: true }); }
  }
  // окно «Уведомления» (из меню имени и из подсказки «Новое»)
  window.ogonekOpenNotify = () => openNotifySettings();
  function notifyStatus() { if (!pushCapable()) return "unsupported"; return Notification.permission; }
  function openNotifySettings() {
    O().openNotify({
      status: notifyStatus,
      ask: () => enableReminder(),
      save: async (c, hours) => {
        lsSet(REMIND_KEY, hours.length ? "1" : "0");
        if (notifyStatus() !== "granted") return;
        let t = null; try { t = await pushToken(); } catch (e) { console.warn(e); }
        await savePush(t, hours.length > 0);
      },
      test: async () => {
        if (notifyStatus() !== "granted") { O().toast("Сначала разрешите уведомления"); return; }
        try { const reg = await navigator.serviceWorker.ready; await reg.showNotification("В Слове", { body: "Так будет выглядеть напоминание: огонёк сегодня ещё не горит 🙏", icon: "icon-192.png", tag: "ogonek-test" }); }
        catch (e) { console.warn(e); O().toast("Не получилось показать уведомление"); }
      }
    });
  }
  async function enableReminder() {
    if (!me) return;
    if (!pushCapable()) {
      if (isIOS()) { O().toast("На iPhone напоминания работают, когда приложение «В Слове» добавлено на экран «Домой». Откройте его оттуда и включите снова."); const l = $("installLink"); if (l && !l.hidden) l.click(); }
      else O().toast("Этот браузер не умеет присылать уведомления. Попробуйте Chrome.");
      return;
    }
    let perm = Notification.permission;
    if (perm === "default") { try { perm = await Notification.requestPermission(); } catch (e) {} }
    if (perm !== "granted") { O().toast("Уведомления запрещены. Разрешите их для приложения «В Слове» в настройках браузера или телефона."); return; }
    try {
      const t = await pushToken(); await savePush(t, true);
      lsSet(REMIND_KEY, "1"); lsSet(REMIND_HIDE, null);
      { let tx = "22:00"; try { tx = O().ntText(O().ntLoad()); } catch (e) {} O().toast("Готово! Если не прочитаете, «В Слове» напомнит: " + tx); }
    } catch (e) { console.warn(e); O().toast("Не получилось включить напоминание. Проверьте интернет и попробуйте ещё раз."); }
  }
  async function disableReminder() {
    lsSet(REMIND_KEY, "0");
    try { await savePush(null, false); } catch (e) { console.warn(e); }
    O().toast("Напоминание выключено");
  }
  async function refreshPush() { // токен иногда меняется — обновляем его и часовой пояс при каждом входе
    if (!remindOn() || !pushCapable()) return;
    try { await savePush(await pushToken(), true); lsSet(REMIND_KEY, "1"); } catch (e) { console.warn(e); }
  }
  // кто уже разрешил уведомления — напоминание подключается само при входе
  function autoReminder() { if (me && remindOn() && pushCapable()) refreshPush(); }

  /* ---------- меню пользователя в шапке: «О себе» и «Выйти» ---------- */
  function closeUserMenu() { const m = document.querySelector(".usermenu"); if (m) m.remove(); top.setAttribute("aria-expanded", "false"); document.removeEventListener("click", outsideMenu, true); document.removeEventListener("keydown", escMenu); }
  function outsideMenu(e) { const m = document.querySelector(".usermenu"); if (m && !m.contains(e.target) && e.target !== top) closeUserMenu(); }
  function escMenu(e) { if (e.key === "Escape") { closeUserMenu(); top.focus(); } }
  function toggleUserMenu() {
    if (document.querySelector(".usermenu")) { closeUserMenu(); return; }
    const m = el("div", "usermenu"); m.setAttribute("role", "menu");
    const who = el("div", "umwho", me ? myName() : "");
    const item = (cls, icon, text) => { const b = el("button", "umitem umico" + cls); b.type = "button"; b.setAttribute("role", "menuitem"); const i = el("span", "umi"); try { i.append(O().ico(icon)); } catch (e) {} const t = el("span", "umt", text); b.append(i, t); return b; };
    const about = item(window.ogonekPtr && window.ogonekPtr() === "on" ? " ptr" : "", "user", "Профиль");
    about.addEventListener("click", () => { closeUserMenu(); openProfile("me", true); });
    const bell = item("", "bell", "Уведомления");
    try { if (O().ntNew && O().ntNew()) bell.append(el("span", "newbadge", "Новое")); } catch (e) {}
    bell.addEventListener("click", () => { closeUserMenu(); openNotifySettings(); });
    const out = item(" danger", "exit", "Выйти"), outT = out.querySelector(".umt");
    out.addEventListener("click", () => {
      if (out.dataset.armed) { closeUserMenu(); O().setRemote(null); O().onSave = null; A.signOut(auth); return; }
      out.dataset.armed = "1"; outT.textContent = "Нажмите ещё раз, чтобы выйти";
      setTimeout(() => { delete out.dataset.armed; outT.textContent = "Выйти"; }, 3000);
    });
    m.append(who, about, bell, out);
    const r = top.getBoundingClientRect();
    m.style.top = (r.bottom + window.scrollY + 6) + "px";
    m.style.right = Math.max(8, document.documentElement.clientWidth - r.right) + "px";
    document.body.append(m); top.setAttribute("aria-expanded", "true"); about.focus();
    setTimeout(() => { document.addEventListener("click", outsideMenu, true); document.addEventListener("keydown", escMenu); }, 0);
  }

  /* ---------- онлайн-команды конференции «Восхождение на Синай» ---------- */
  let teamInvUnsub = null;
  function setupTeams() {
    if (!window.confNet) return;
    const tref = (code) => F.doc(db, "teams", code);
    const net = {
      uid: me.uid, name: () => myName(), get photo() { return myPhoto(); }, code: () => myCode,
      cheer: (uid, i, join) => sendMsg(uid, i, join ? "confjoin" : "conf"),
      cheerLeft: () => left("conf"),
      cheerSent: (uid, join) => sentToday(uid, join ? "confjoin" : "conf"),
      friends: () => myFriends.filter((u) => sameSex(friendData[u])).map((u) => ({ uid: u, name: (friendData[u] && friendData[u].name) || "Друг", photo: (friendData[u] && friendData[u].photo) || "", g: (friendData[u] && friendData[u].gender) || "" })),
      async create(data) {
        for (let i = 0; i < 6; i++) {
          const code = randomCode();
          const ok = await F.runTransaction(db, async (tx) => {
            const s = await tx.get(tref(code));
            if (s.exists()) return false;
            tx.set(tref(code), Object.assign({}, data, { code, owner: me.uid, members: [me.uid] }));
            return true;
          }).catch((e) => { console.warn(e); return false; });
          if (ok) return code;
        }
        throw new Error("Не удалось создать команду");
      },
      async get(code) { const s = await F.getDoc(tref(code)); return s.exists() ? s.data() : null; },
      watch(code, cb, err) { return F.onSnapshot(tref(code), (s) => cb(s.exists() ? s.data() : null), (e) => { console.warn(e); if (e && e.code === "permission-denied") cb(null); if (err) err(e); }); },
      act(code, fn) {
        return F.runTransaction(db, async (tx) => {
          const s = await tx.get(tref(code));
          if (!s.exists()) return false;
          const p = fn(s.data());
          if (!p) return false;
          tx.update(tref(code), p);
          return true;
        });
      },
      update(code, patch) { return F.updateDoc(tref(code), patch); },
      invite(uid, code, tname) {
        return F.setDoc(F.doc(db, "teaminv", uid, "inbox", code), { from: me.uid, name: String(myName()).slice(0, 60), team: code, tname: String(tname).slice(0, 40), at: Date.now() });
      },
      dropInvite(code) { return F.deleteDoc(F.doc(db, "teaminv", me.uid, "inbox", code)).catch(() => {}); }
    };
    if (teamInvUnsub) teamInvUnsub();
    teamInvUnsub = F.onSnapshot(F.collection(db, "teaminv", me.uid, "inbox"), (qs) => {
      const list = []; qs.forEach((d) => list.push(d.data()));
      if (window.confNet && window.confNet.invites) window.confNet.invites(list);
    }, (e) => console.warn(e));
    const team = new URLSearchParams(location.search).get("team");
    if (team) history.replaceState(null, "", location.pathname);
    window.confNet(net, team);
  }

  /* ---------- жизненные группы: читать вместе (groups/{КОД}) ---------- */
  let groupsUnsub = null, groupInvUnsub = null;
  function setupGroups() {
    if (!window.ogGroupsNet) return;
    const gref = (code) => F.doc(db, "groups", code);
    const nm = () => String(myName() || "Читатель").slice(0, 40), ph = () => myPhoto();
    const net = {
      uid: me.uid, name: nm, photo: ph(),
      del: () => F.deleteField(),
      // друзья из «В Слове» — чтобы позвать их в группу
      friends: () => myFriends.filter((u) => sameSex(friendData[u])).map((u) => ({ uid: u, name: (friendData[u] && friendData[u].name) || "Друг", photo: (friendData[u] && friendData[u].photo) || "", g: (friendData[u] && friendData[u].gender) || "" })),
      invite(uid, code, gname) {
        return F.setDoc(F.doc(db, "groupinv", uid, "inbox", code), { from: me.uid, name: nm(), photo: ph(), group: code, gname: String(gname || "").slice(0, 60), at: Date.now() });
      },
      dropInvite(code) { return F.deleteDoc(F.doc(db, "groupinv", me.uid, "inbox", code)).catch(() => {}); },
      // отозвать своё приглашение / проверить, ждёт ли оно ещё ответа
      revoke(uid, code) { return F.deleteDoc(F.doc(db, "groupinv", uid, "inbox", code)); },
      async invAlive(uid, code) { const s = await F.getDoc(F.doc(db, "groupinv", uid, "inbox", code)); return s.exists(); },
      watchInv(cb) {
        if (groupInvUnsub) groupInvUnsub();
        groupInvUnsub = F.onSnapshot(F.collection(db, "groupinv", me.uid, "inbox"),
          (qs) => { const list = []; qs.forEach((d) => list.push(d.data())); cb(list); }, (e) => console.warn(e));
      },
      watchMine(cb) {
        if (groupsUnsub) groupsUnsub();
        groupsUnsub = F.onSnapshot(F.query(F.collection(db, "groups"), F.where("members", "array-contains", me.uid)),
          (qs) => { const list = []; qs.forEach((d) => list.push(d.data())); list.sort((x, y) => String(x.created || "").localeCompare(String(y.created || ""))); cb(list); },
          (e) => console.warn(e));
        return () => { if (groupsUnsub) { groupsUnsub(); groupsUnsub = null; } };
      },
      async create(data) {
        for (let i = 0; i < 6; i++) {
          const code = randomCode();
          const ok = await F.runTransaction(db, async (tx) => {
            const s = await tx.get(gref(code));
            if (s.exists()) return false;
            tx.set(gref(code), Object.assign({}, data, { code, owner: me.uid, members: [me.uid], names: { [me.uid]: nm() }, photos: { [me.uid]: ph() } }));
            return true;
          }).catch((e) => { console.warn(e); return false; });
          if (ok) return code;
        }
        throw new Error("Не удалось создать группу");
      },
      async get(code) { const s = await F.getDoc(gref(code)); return s.exists() ? s.data() : null; },
      update(code, patch) { return F.updateDoc(gref(code), patch); },
      remove(code) { return F.deleteDoc(gref(code)); }, // удалить группу — только создатель
      join(code) {
        return F.runTransaction(db, async (tx) => {
          const s = await tx.get(gref(code)); if (!s.exists()) return false;
          const d = s.data(), m = d.members || [];
          if (m.includes(me.uid)) return true;
          if (m.length >= (d.size || 4)) return false;
          tx.update(gref(code), { members: m.concat(me.uid), ["names." + me.uid]: nm(), ["photos." + me.uid]: ph() });
          return true;
        });
      },
      leave(code) {
        return F.runTransaction(db, async (tx) => {
          const s = await tx.get(gref(code)); if (!s.exists()) return;
          const d = s.data(), m = (d.members || []).filter((u) => u !== me.uid);
          if (!m.length) { tx.delete(gref(code)); return; }
          const patch = { members: m };
          if (d.owner === me.uid) patch.owner = m[0]; // создатель ушёл — группу ведёт следующий
          tx.update(gref(code), patch);
        });
      }
    };
    const q = new URLSearchParams(location.search), code = (q.get("group") || q.get("fire") || "").toUpperCase();
    if (code) history.replaceState(null, "", location.pathname);
    window.ogGroupsNet(net, /^[A-Z0-9]{6}$/.test(code) ? code : null);
  }

  /* ---------- session ---------- */
  // для «первого входа по шагам» (index.html openOnb)
  window.ogSignIn = () => $("googleBtn").click();
  window.ogSkipLogin = () => { lsSet(SKIP_KEY, "1"); $("auth").hidden = true; showLoginLink(); };
  window.ogAuthInfo = () => ({ logged: !!me, name: me ? myName() : "", nameSet: myNameSet });
  window.ogEnableReminder = () => enableReminder();
  window.ogSaveNick = async (nick) => {
    if (!me) return; nick = String(nick || "").replace(/\s+/g, " ").trim().slice(0, 40); if (nick.length < 2) return;
    myNick = nick; myNameSet = true; setTopName();
    if (!myRef) myRef = F.doc(db, "profiles", me.uid);
    await F.setDoc(myRef, { nick, name: nick, nameSet: true }, { merge: true }).catch((e) => console.warn(e));
    await F.setDoc(F.doc(db, "cards", me.uid), { name: nick, photo: myPhoto() }).catch((e) => console.warn(e));
    try { publishSummary(); } catch (e) {}
  };
  A.onAuthStateChanged(auth, async (user) => {
    Object.values(friendUnsubs).forEach((u) => u()); friendUnsubs = {}; friendData = {}; myFriends = []; myFollowing = []; myFollowers = []; myDeclined = []; knownReq = null;
    if (myUnsub) { myUnsub(); myUnsub = null; }
    if (inboxUnsub) { inboxUnsub(); inboxUnsub = null; } cheerQueue = []; seenCheers.clear();
    if (teamInvUnsub) { teamInvUnsub(); teamInvUnsub = null; } if (window.confNet) window.confNet(null);
    if (groupsUnsub) { groupsUnsub(); groupsUnsub = null; } if (groupInvUnsub) { groupInvUnsub(); groupInvUnsub = null; } if (window.ogGroupsNet) window.ogGroupsNet(null);
    if (!user) {
      closeUserMenu(); closeAll(); top.removeAttribute("aria-haspopup"); top.removeAttribute("aria-expanded"); top.title = "";
      if (window.OgonekGlobe) window.OgonekGlobe.close();
      me = null; O().setRemote(null); O().onSave = null; O().onPersonClick = null; O().setPathPeople([]); closeProfile();
      $("friendsCard").hidden = true; $("inviteCard").hidden = true;
      { const fe = $("friendsEmpty"); if (fe) fe.hidden = false; }
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
    autoReminder();

    // progress left on this device by another account is not mixed in
    const owner = lsGet(OWNER_KEY);
    if (owner && owner !== user.uid) O().setState(O().fresh());
    lsSet(OWNER_KEY, user.uid);

    const ref = F.doc(db, "users", user.uid);
    myRef = F.doc(db, "profiles", user.uid);
    try {
      const snap = await F.getDoc(ref);
      const local = O().getState(), remote = snap.exists() ? snap.data() : null;
      if (remote) {
         // A higher local action count does not make its selected plan newer.
         // Preserve the server's authoritative plan and progress on login.
         O().setState(remote);
       } else await F.setDoc(ref, local);
    } catch (e) { console.warn(e); O().toast("Не удалось загрузить прогресс. Проверьте интернет."); }
    if (O().progressLoaded) O().progressLoaded();
    try { window.dispatchEvent(new Event("og-auth")); } catch (e) {}
    let chain = Promise.resolve();
    O().setRemote((s) => { chain = chain.then(() => F.setDoc(ref, s)).catch((e) => { console.warn(e); O().toast("Не удалось сохранить на сервере. Попробуем при следующей отметке."); }); return chain; });
    // Register publishing before profile initialization, which may stall offline.
    O().onSave = () => { publishSummary(); renderFriends(); if (globeList) refreshGlobeList(); };
    publishSummary();

    try {
      try { await ensureProfile(user); }
      catch (e) { console.warn("Profile initialization failed; keep reading sync active", e); O().toast("Не удалось полностью загрузить профиль. Синхронизация продолжится при подключении."); }
      if (!myNameSet && !window.__onbActive && !document.body.classList.contains("onbon")) await askName(user); // в «первом входе» имя спрашивается на своём шаге
      if (user.email) await F.setDoc(F.doc(db, "emails", user.email.toLowerCase()), { uid: user.uid }).catch((e) => console.warn(e));
      $("myEmail").textContent = user.email || "";
      $("myId").textContent = user.uid;
      $("friendsCard").hidden = false; $("inviteCard").hidden = false;
      { const fe = $("friendsEmpty"); if (fe) fe.hidden = true; } // подсказка «Войдите через Google» не нужна
      publishSummary(); // refresh the invitation code and display name after initialization
      window.ogSetGender = (g) => { if (g !== "m" && g !== "f") return; if (myProfile.gender === g) return; myProfile = Object.assign({}, myProfile, { gender: g }); F.setDoc(myRef, { gender: g }, { merge: true }).catch((e) => console.warn(e)); renderFriends(); };
      let genderAsked = false;
      myUnsub = F.onSnapshot(myRef, (snap) => {
        const oldPh = myPhoto(); myProfile = snap.exists() ? snap.data() : {}; if (myPhoto() !== oldPh) O().setMyPhoto(myPhoto());
        // пол: из профиля → на телефон; выбран на телефоне, а в профиле нет → в профиль; нигде нет → одно окно «Ваш пол»
        { const pg = myProfile.gender, lg = myG();
          if (pg === "m" || pg === "f") { if (pg !== lg && window.ogGenderLocal) window.ogGenderLocal(pg); }
          else if (lg) window.ogSetGender(lg);
          else if (snap.exists() && !genderAsked) { genderAsked = true; const ask = () => { if (document.body.classList.contains("onbon") || window.__onbActive) return setTimeout(ask, 2000); if (!myG() && window.ogAskGender) window.ogAskGender(); }; setTimeout(ask, 1500); } }
        myFollowers = myProfile.followers || []; myDeclined = myProfile.declined || [];
        if ((myProfile.nick || "") !== myNick) { myNick = myProfile.nick || ""; setTopName(); }
        if (!!myProfile.globeHide !== globeHide) { globeHide = !!myProfile.globeHide; if (window.OgonekGlobe) window.OgonekGlobe.setVisible(!globeHide); }
        // новая заявка — короткое уведомление
        const pend = pendingRequests();
        if (knownReq) pend.filter((u) => !knownReq.has(u)).forEach((u) => cardOf(u).then((c) => O().toast((c.name || "Читатель") + " хочет стать вашим другом")));
        knownReq = new Set(pend);
        syncFriendSubs(myProfile.friends || [], myProfile.following || []);
        globeRelSync();
      });
      O().onPersonClick = (id) => openProfile(id);
      window.addEventListener("og-gender", () => { try { renderFriends(); } catch (e) {} });
      listenCheers();
      try { setupTeams(); } catch (e) { console.warn(e); }
      try { setupGroups(); } catch (e) { console.warn(e); }
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
