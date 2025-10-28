// ⭐ อัปเดตเวอร์ชัน Cache เพื่อบังคับให้ Service Worker ติดตั้งใหม่
const CACHE_NAME = 'utth-shift-cache-v2';

// ⭐ เพิ่ม holidays.json เข้าไปในรายการไฟล์ที่จะ Cache
const URLS_TO_CACHE = [
  '/',
  'index.html',
  'style.css',
  'script.js',
  'manifest.json',
  'holidays.json', // <-- ไฟล์ใหม่ที่เพิ่มเข้ามา
  'icons/icon-192x192.png',
  'icons/icon-512x512.png',
  'https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600&display=swap',
  'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.11/index.global.min.js',
  'https://cdn.jsdelivr.net/npm/sweetalert2@11',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js'
];

// Event: install - ติดตั้ง Service Worker และ Cache ไฟล์หลัก
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
  self.skipWaiting();
});

// Event: activate - จัดการ Cache เก่า
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache');
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Event: fetch - ดักจับ request และตอบกลับจาก Cache ก่อน (Cache-First Strategy)
self.addEventListener('fetch', event => {
  if (event.request.url.includes('googleapis.com/calendar') || event.request.url.includes('firestore.googleapis.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(
          networkResponse => {
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        );
      })
  );
});