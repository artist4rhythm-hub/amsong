// 앱 화면 파일만 기기에 보관 (본문은 로그인 후 Firestore에서 받아 기기에 보관)
// 앱 파일을 고쳐 올릴 때마다 아래 이름의 숫자를 하나 올려 주세요.
const CACHE = "amsong-shell-v6";
const SHELL = ["./", "index.html", "app.css", "app.js", "backend.js", "firebase-config.js", "manifest.webmanifest",
  "icons/icon-192.png", "icons/icon-512.png", "icons/icon-180.png"];

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
