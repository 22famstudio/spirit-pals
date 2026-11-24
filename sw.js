// 게임 파일을 기기에 저장해 두고, 인터넷이 없어도 실행되게 합니다.
// 그림 파일을 바꾼 뒤에는 VERSION 숫자를 올려야 기기에 새 그림이 들어갑니다.
const VERSION = 'spirit-pals-7';
const SHEETS = ['fire', 'water', 'wind', 'earth', 'electric', 'wind_electric', 'water_electric', 'earth_water', 'earth_fire'];
const SFX = ['tap', 'key', 'summon', 'move', 'merge', 'evolve', 'coin', 'hit', 'crit', 'shoot', 'poof',
             'correct', 'win', 'lose', 'start', 'finale', 'wrong', 'nope'];
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png']
  .concat(SHEETS.map(s => './assets/' + s + '.webp'))
  .concat(SFX.map(s => './audio/sfx/' + s + '.wav'));
// 배경음악(audio/bgm*.m4a)은 용량이 커서 미리 저장하지 않고, 인터넷이 될 때 바로 재생함
// 배경 그림은 있을 때만 저장 (없어도 설치가 실패하지 않게)
const OPTIONAL = ['./assets/background.webp'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION)
    .then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))
      .then(() => Promise.all(OPTIONAL.map(f => c.add(new Request(f, { cache: 'reload' })).catch(() => {})))))
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
  if (e.request.url.includes('/audio/bgm')) return; // 음악은 브라우저가 직접 (iPhone은 구간 요청이 필요)
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
