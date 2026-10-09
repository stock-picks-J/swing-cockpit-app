// PWA 설치 조건(서비스워커 등록)만 충족하고, 캐싱은 하지 않는다.
// 예전 버전은 fetch 응답을 캐시에 저장했는데, 그게 card.js/card.css 등 자주 바뀌는
// 파일까지 오래 붙잡고 있어서 배포해도 화면에 반영 안 되는 문제가 있었다 (2026-09-22).
// 신호/가격 데이터가 항상 최신이어야 하는 앱이라 오프라인 캐싱의 이득보다 손해가 컸다.
const OLD_CACHES = ["swing-cockpit-v1"];

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => OLD_CACHES.includes(k)).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  e.respondWith(fetch(e.request));
});

// 앱 푸시 알림(2026-10-06): 서버가 보낸 제목/본문을 알림으로 띄우고, 누르면 앱을 연다.
self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { body: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(d.title || "스윙콕핏", {
    body: d.body || "", tag: d.tag || "swing-cockpit", icon: "icon-192.png", badge: "icon-192.png",
    data: { url: d.url || "./" },
  }));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "./";
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
    for (const c of list) { if ("focus" in c) return c.focus(); }
    return self.clients.openWindow(url);
  }));
});
