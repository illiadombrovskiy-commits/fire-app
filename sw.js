// Огонёк: вечерние напоминания (push) и открытие приложения по нажатию на уведомление
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("push", (e) => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (x) { d = { data: { body: e.data && e.data.text() } }; }
  const n = d.notification || {}, m = d.data || {};
  const title = m.title || n.title || "Огонёк";
  const opts = { body: m.body || n.body || "Пора зажечь огонёк", icon: "icon-192.png", badge: "icon-192.png", tag: m.tag || "remind", lang: "ru", data: { url: m.url || "./" } };
  e.waitUntil(self.registration.showNotification(title, opts));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
    for (const c of list) if ("focus" in c) return c.focus();
    return self.clients.openWindow("./");
  }));
});
// пустой обработчик запросов — нужен некоторым браузерам, чтобы предложить «Установить приложение»
self.addEventListener("fetch", () => {});
