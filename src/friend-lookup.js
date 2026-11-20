export function createFriendLookup(F,db){
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


return findFriendUid;
}
