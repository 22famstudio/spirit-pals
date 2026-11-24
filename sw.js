// 게임 파일을 기기에 저장해 두고, 인터넷이 없어도 실행되게 합니다.
// 게임을 고친 뒤에는 VERSION 숫자를 올려야 기기에 새 버전이 들어갑니다.
const VERSION = 'spirit-pals-5';
const SHEETS = ['fire', 'water', 'wind', 'earth', 'electric', 'wind_electric', 'water_electric', 'earth_water', 'earth_fire'];
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png']
  .concat(SHEETS.map(s => './assets/' + s + '.webp'));

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION)
    .then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  const page = e.request.mode === 'navigate' || e.request.url.endsWith('.html');
  if (page) {
    // 게임 화면: 인터넷이 되면 새 버전을 받고, 안 되면 저장해 둔 것으로 실행
    e.respondWith(
      fetch(e.request, { cache: 'no-cache' }).then(res => {
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put(e.request, copy));
        return res;
      }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(hit => hit || caches.match('./index.html')))
    );
  } else {
    // 그림·아이콘: 저장해 둔 것을 먼저 사용
    e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request)));
  }
});
