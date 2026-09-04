const CACHE_NAME = 'kitaplus-v2';

// התראות Push (FCM) — טעינת ה-SDK בגרסת ה-compat כי ל-service worker אין
// תמיכת מודולים; ה-init חייב לקרות כאן כדי ש-Firebase יוכל להציג התראה
// גם כשהאתר סגור לגמרי (background message).
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBKFa8DtbZdZcn-nDclearM86QmnCe6SM0",
  authDomain: "hyper-fucos.firebaseapp.com",
  databaseURL: "https://hyper-fucos-default-rtdb.firebaseio.com",
  projectId: "hyper-fucos",
  storageBucket: "hyper-fucos.firebasestorage.app",
  messagingSenderId: "126453149478",
  appId: "1:126453149478:web:8f5643d5a622014e915be7"
});

firebase.messaging();

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

// Network-first for same-origin GET requests, with a cache fallback for
// offline resilience. Everything else (cross-origin, POST to the API) is
// left untouched so the browser handles it natively.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (new URL(event.request.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // שומרים במטמון רק תגובות תקינות; 404/500 לא נכנסים למטמון ולא מוצגים במצב לא מקוון
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
