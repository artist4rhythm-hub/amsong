// 앱 화면 파일만 기기에 보관 (본문은 로그인 후 Firestore에서 받아 기기에 보관)
// 앱 파일을 고쳐 올릴 때마다 아래 이름의 숫자를 하나 올려 주세요.
const CACHE = "amsong-shell-v4";
const SHELL = ["./", "index.html", "app.css", "app.js", "backend.js", "firebase-config.js", "manifest.webmanifest",
  "icons/icon-192.png", "icons/icon-512.png", "icons/icon-180.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// 같은 주소의 파일만: 먼저 인터넷에서 새 파일을 받고, 안 되면 보관본 사용
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(e.request).then((r) => r || caches.match("index.html")))
  );
});
