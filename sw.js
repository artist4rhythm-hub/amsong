// 앱 화면 파일만 기기에 보관 (본문은 로그인 후 Firestore에서 받아 기기에 보관)
// 앱 파일을 고쳐 올릴 때마다 아래 이름의 숫자를 하나 올려 주세요.
const CACHE = "amsong-shell-v13";
const SHELL = ["./", "index.html", "app.css", "app.js", "backend.js", "firebase-config.js", "manifest.webmanifest",
  "icons/icon-192.png", "icons/icon-512.png", "icons/icon-180.png",
  "icons/icon-maskable-192.png", "icons/icon-maskable-512.png", "icons/favicon-32.png", "icons/crest.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// 같은 주소의 파일만: 기기에 보관된 파일로 바로 열고(빠름), 뒤에서 새 파일을 받아 다음번을 위해 보관
// (새 버전을 올리면 이 파일의 숫자가 바뀌어 기기가 새 파일을 통째로 다시 받아요)
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith(
    caches.open(CACHE).then(async (c) => {
      const hit = await c.match(e.request, { ignoreSearch: true });
      const fresh = fetch(e.request).then((res) => {
        if (res && res.ok) c.put(e.request, res.clone()).catch(() => {});
        return res;
      }).catch(() => null);
      if (hit) { e.waitUntil(fresh); return hit; }
      return (await fresh) || (await c.match("index.html")) || Response.error();
    })
  );
});

// ── 아침 알림 받기 (GitHub 알림 실행 → Firebase 클라우드 메시징 → 이 기기)
// 앱이 닫혀 있어도 기기에 알림을 띄우고, 누르면 앱을 엶
self.addEventListener("push", (e) => {
  let d = {};
  try {
    const j = e.data ? e.data.json() : {};
    d = Object.assign({}, j.notification || {}, j.data || {});
  } catch (err) {
    d = { body: e.data ? e.data.text() : "" };
  }
  const title = d.title || "말씀선포";
  e.waitUntil(self.registration.showNotification(title, {
    body: d.body || "오늘 말씀 선포 하셨나요?",
    icon: "icons/icon-192.png",
    tag: d.tag || "amsong",
    renotify: true,
    data: { link: d.link || "./" }
  }));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.link) || "./", self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
    for (const c of list) {
      if (c.url.startsWith(self.registration.scope) && "focus" in c) return c.focus();
    }
    return self.clients.openWindow(url);
  }));
});
