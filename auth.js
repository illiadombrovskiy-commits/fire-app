// Вход по номеру телефона (Firebase Authentication) и хранение прогресса (Cloud Firestore).
import { firebaseConfig } from "./firebase-config.js";

const SDK = "https://www.gstatic.com/firebasejs/10.12.2/";
const $ = (id) => document.getElementById(id);
const OWNER_KEY = "ogonek-owner";

const configured = firebaseConfig && firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("ВСТАВЬТЕ");

function showError(msg) { const e = $("authError"); e.textContent = msg; e.hidden = !msg; }

const ERRORS = {
  "auth/invalid-phone-number": "Номер введён неверно. Пример: +7 900 123-45-67.",
  "auth/missing-phone-number": "Введите номер телефона.",
  "auth/too-many-requests": "Слишком много попыток. Подождите немного и попробуйте снова.",
  "auth/quota-exceeded": "Лимит СМС на сегодня исчерпан. Попробуйте позже.",
  "auth/invalid-verification-code": "Неверный код. Проверьте СМС и введите код ещё раз.",
  "auth/code-expired": "Код устарел. Нажмите «Отправить снова».",
  "auth/operation-not-allowed": "Вход по телефону не включён или СМС в этот регион запрещены. Проверьте настройки Firebase (см. инструкцию).",
  "auth/billing-not-enabled": "Для отправки СМС в проекте Firebase нужно подключить оплату (тариф Blaze).",
  "auth/captcha-check-failed": "Проверка «я не робот» не прошла. Обновите страницу и попробуйте снова.",
  "auth/network-request-failed": "Нет связи с сервером. Проверьте интернет.",
  "auth/unauthorized-domain": "Этот адрес сайта не добавлен в разрешённые домены Firebase."
};
const errText = (e) => ERRORS[e && e.code] || ("Не получилось: " + ((e && (e.code || e.message)) || "неизвестная ошибка"));

function normalizePhone(raw) {
  let d = (raw || "").replace(/\D/g, "");
  if (d.length === 11 && d[0] === "8") d = "7" + d.slice(1);
  if (d.length === 10 && d[0] === "9") d = "7" + d;
  return d ? "+" + d : "";
}
function prettyPhone(p) {
  const m = /^\+7(\d{3})(\d{3})(\d{2})(\d{2})$/.exec(p || "");
  return m ? `+7 ${m[1]} ${m[2]}-${m[3]}-${m[4]}` : (p || "");
}

async function main() {
  if (!window.Ogonek) return;
  if (!configured) {
    const note = document.createElement("div");
    note.className = "demo-note";
    note.textContent = "Демо-режим: вход по телефону ещё не настроен, прогресс хранится только в этом браузере.";
    document.querySelector(".app").prepend(note);
    return;
  }

  const [{ initializeApp }, A, F] = await Promise.all([
    import(SDK + "firebase-app.js"),
    import(SDK + "firebase-auth.js"),
    import(SDK + "firebase-firestore.js")
  ]);
  const app = initializeApp(firebaseConfig);
  const auth = A.getAuth(app);
  auth.languageCode = "ru";
  const db = F.getFirestore(app);

  let verifier = null, confirmation = null, lastPhone = "", resendTimer = null;

  function getVerifier() {
    if (!verifier) verifier = new A.RecaptchaVerifier(auth, "sendBtn", { size: "invisible" });
    return verifier;
  }
  function resetVerifier() { try { verifier && verifier.clear(); } catch (e) {} verifier = null; }

  function startResendCountdown() {
    const b = $("resendBtn"); let left = 60; b.disabled = true;
    clearInterval(resendTimer);
    const tick = () => { b.textContent = left > 0 ? `Отправить снова (${left})` : "Отправить снова"; if (left-- <= 0) { b.disabled = false; clearInterval(resendTimer); } };
    tick(); resendTimer = setInterval(tick, 1000);
  }

  async function sendCode(phone) {
    showError("");
    const btn = $("sendBtn"); btn.disabled = true; btn.textContent = "Отправляем…";
    try {
      confirmation = await A.signInWithPhoneNumber(auth, phone, getVerifier());
      lastPhone = phone;
      $("stepPhone").hidden = true; $("stepCode").hidden = false;
      $("code").value = ""; $("code").focus();
      startResendCountdown();
    } catch (e) {
      console.warn(e); showError(errText(e)); resetVerifier();
    } finally {
      btn.disabled = false; btn.textContent = "Получить код по СМС";
    }
  }

  $("sendBtn").addEventListener("click", () => {
    const phone = normalizePhone($("phone").value);
    if (phone.length < 11) { showError(ERRORS["auth/invalid-phone-number"]); return; }
    sendCode(phone);
  });
  $("phone").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); $("sendBtn").click(); } });

  async function verify() {
    const code = $("code").value.replace(/\D/g, "");
    if (code.length < 6) { showError("Введите 6 цифр из СМС."); return; }
    showError("");
    const btn = $("verifyBtn"); btn.disabled = true; btn.textContent = "Проверяем…";
    try { await confirmation.confirm(code); }
    catch (e) { console.warn(e); showError(errText(e)); }
    finally { btn.disabled = false; btn.textContent = "Войти"; }
  }
  $("verifyBtn").addEventListener("click", verify);
  $("code").addEventListener("input", () => { if ($("code").value.replace(/\D/g, "").length === 6) verify(); });
  $("code").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); verify(); } });
  $("changePhone").addEventListener("click", () => { $("stepCode").hidden = true; $("stepPhone").hidden = false; showError(""); resetVerifier(); });
  $("resendBtn").addEventListener("click", () => { resetVerifier(); $("stepCode").hidden = true; $("stepPhone").hidden = false; sendCode(lastPhone); });
  $("authForm").addEventListener("submit", (e) => e.preventDefault());

  $("logoutBtn").addEventListener("click", async () => {
    window.Ogonek.setRemote(null);
    await A.signOut(auth);
  });

  A.onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.Ogonek.setRemote(null);
      try { localStorage.removeItem(OWNER_KEY); } catch (e) {}
      window.Ogonek.setState(window.Ogonek.fresh());
      $("account").hidden = true;
      $("stepCode").hidden = true; $("stepPhone").hidden = false;
      $("auth").hidden = false;
      return;
    }
    $("auth").hidden = true;
    $("account").hidden = false;
    $("accountPhone").textContent = "Вы вошли: " + prettyPhone(user.phoneNumber);
    $("storage").textContent = "Прогресс сохраняется в вашем аккаунте";

    // progress left on this device by another account is not mixed in
    let owner = null; try { owner = localStorage.getItem(OWNER_KEY); } catch (e) {}
    if (owner && owner !== user.uid) window.Ogonek.setState(window.Ogonek.fresh());
    try { localStorage.setItem(OWNER_KEY, user.uid); } catch (e) {}

    const ref = F.doc(db, "users", user.uid);
    try {
      const snap = await F.getDoc(ref);
      const local = window.Ogonek.getState();
      const remote = snap.exists() ? snap.data() : null;
      if (remote && window.Ogonek.score(remote) >= window.Ogonek.score(local)) {
        window.Ogonek.setState(remote);
      } else {
        await F.setDoc(ref, local);
      }
    } catch (e) {
      console.warn(e);
      window.Ogonek.toast("Не удалось загрузить прогресс с сервера. Проверьте интернет.");
    }
    let chain = Promise.resolve();
    window.Ogonek.setRemote((s) => {
      chain = chain.then(() => F.setDoc(ref, s)).catch((e) => { console.warn(e); window.Ogonek.toast("Не удалось сохранить на сервере. Попробуем при следующей отметке."); });
    });
  });
}

main().catch((e) => { console.error(e); });
