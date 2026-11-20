export function createEncouragementService({KIND,lsGet,lsSet,O,F,db,fLit,getProfile,setProfile,getRef,getMe,myName,myPhoto}){
  const sentMap = (kind) => { try { return JSON.parse(lsGet(KIND[kind].key) || "{}"); } catch (e) { return {}; } };
  // кому я отправил сегодня: этот браузер + профиль (чтобы лимит работал на всех устройствах)
  function sentTodaySet(kind) {
    const t = O().today(), m = sentMap(kind), set = new Set(Object.keys(m).filter((k) => m[k] === t));
    const profile=getProfile(); const c = profile && profile[KIND[kind].field]; if (c && c.d === t) (c.u || []).forEach((u) => set.add(u));
    return set;
  }
  const sentToday = (uid, kind) => sentTodaySet(kind).has(uid);
  const left = (kind) => Math.max(0, KIND[kind].limit - sentTodaySet(kind).size);
  function markSent(uid, kind) {
    const K = KIND[kind], m = sentMap(kind), t = O().today();
    Object.keys(m).forEach((k) => { if (m[k] !== t) delete m[k]; }); m[uid] = t; lsSet(K.key, JSON.stringify(m));
    const u = [...sentTodaySet(kind)], patch = {}; patch[K.field] = { d: t, u };
    setProfile(Object.assign({}, getProfile(), patch));
    F.setDoc(getRef(), patch, { merge: true }).catch((e) => console.warn(e));
  }
  const litToday = (d) => !!d && fLit(d, O().today());
  const readAnyToday = (d) => d && (d.ntLast === O().today() || d.otLast === O().today());
  // воодушевлять: мой огонёк сегодня горит, а у друга ещё нет
  const canCheer = (d) => litToday(O().summary()) && !litToday(d);
  // звать почитать вместе: я сегодня ещё не начинал читать, и друг тоже
  const canInvite = (d) => !readAnyToday(O().summary()) && !readAnyToday(d);

  async function sendMsg(uid, i, kind) {
    const K = KIND[kind], day = O().today();
    const data = { from: getMe().uid, name: String(myName() || "Друг").slice(0, 60), photo: myPhoto(), msg: i, day, at: F.serverTimestamp() };
    if (kind !== "cheer") data.kind = kind;
    const suffix = { invite: "_inv", conf: "_conf", confjoin: "_cjoin" }[kind] || "";
    try {
      if (kind === "cheer") {
        const s = O().summary();
        if (!litToday(s)) { O().toast("Сначала зажгите свой огонёк"); return false; }
        // The normal reading sync owns the globe and full profile.
        // Only refresh the day marker required by newer cheer rules.
        await F.setDoc(getRef(), { flameDay: day }, { merge: true });
      }
      await F.setDoc(F.doc(db, "cheers", uid, "inbox", getMe().uid + "_" + day + suffix), data);
      markSent(uid, kind); O().toast(K.sent); return true;
    } catch (e) {
      console.warn(e);
      if (e && e.code === "permission-denied") { O().toast("Отправка не подтверждена сервером."); return false; }
      O().toast("Не удалось отправить: " + (e && e.code ? e.code : "ошибка приложения")); return false;
    }
  }


return {sentTodaySet,sentToday,left,markSent,litToday,readAnyToday,canCheer,canInvite,sendMsg};
}
