export function createFriendActions({F,db,O,getContext}){
  // заявка в друзья: я подписываюсь на человека; дружба — когда он примет заявку (или если он уже подписан на меня)
  async function addFriendUid(fuid) {
    if (fuid === getContext().me.uid) { O().toast("Это вы сами"); return false; }
    if (getContext().myFriends.includes(fuid)) { O().toast("Вы уже друзья"); return false; }
    const ref = F.doc(db, "profiles", fuid), already = getContext().myFollowing.includes(fuid);
    try {
      await F.updateDoc(ref, { followers: F.arrayUnion(getContext().me.uid) });
      await F.updateDoc(getContext().myRef, { following: F.arrayUnion(fuid) });
      let their = {}; try { const sn = await F.getDoc(ref); their = sn.exists() ? sn.data() : {}; } catch (e) {}
      if ((their.following || []).includes(getContext().me.uid)) {          // он уже звал меня — сразу друзья
        await F.updateDoc(ref, { friends: F.arrayUnion(getContext().me.uid) });
        await F.updateDoc(getContext().myRef, { friends: F.arrayUnion(fuid) });
        O().toast("Вы теперь друзья!");
      } else if (already) O().toast("Заявка уже отправлена — ждём, когда друг её примет");
      else O().toast("Заявка отправлена. Пока друг её не примет, вы подписаны на него");
      return true;
    } catch (e) { console.warn(e); O().toast("Не удалось отправить заявку. Попробуйте позже."); return false; }
  }

  async function acceptRequest(uid) {
    try {
      await F.updateDoc(getContext().myRef, { friends: F.arrayUnion(uid), following: F.arrayUnion(uid), declined: F.arrayRemove(uid) });
      await F.updateDoc(F.doc(db, "profiles", uid), { friends: F.arrayUnion(getContext().me.uid) });
      await F.updateDoc(F.doc(db, "profiles", uid), { followers: F.arrayUnion(getContext().me.uid) }).catch(() => {});
      O().toast("Заявка принята — теперь вы друзья!"); if (O().vibrate) O().vibrate([30, 40, 30]);
    } catch (e) { console.warn(e); O().toast("Не удалось принять заявку. Попробуйте позже."); }
  }
  async function declineRequest(uid) {
    try { await F.updateDoc(getContext().myRef, { declined: F.arrayUnion(uid) }); O().toast("Заявка отклонена — человек останется подписчиком"); }
    catch (e) { console.warn(e); O().toast("Не удалось. Попробуйте позже."); }
  }

  async function removeFriend(fuid) {
    try {
      await F.updateDoc(getContext().myRef, { friends: F.arrayRemove(fuid), following: F.arrayRemove(fuid) });
      await F.updateDoc(F.doc(db, "profiles", fuid), { friends: F.arrayRemove(getContext().me.uid) }).catch(() => {});
      await F.updateDoc(F.doc(db, "profiles", fuid), { followers: F.arrayRemove(getContext().me.uid) }).catch(() => {});
      O().toast("Друг удалён");
    } catch (e) { console.warn(e); O().toast("Не удалось удалить. Попробуйте позже."); }
  }
  async function unfollow(fuid) {
    try {
      await F.updateDoc(getContext().myRef, { following: F.arrayRemove(fuid) });
      await F.updateDoc(F.doc(db, "profiles", fuid), { followers: F.arrayRemove(getContext().me.uid) }).catch(() => {});
      O().toast("Вы отписались");
    } catch (e) { console.warn(e); O().toast("Не удалось. Попробуйте позже."); }
  }


return {addFriendUid,acceptRequest,declineRequest,removeFriend,unfollow};
}
