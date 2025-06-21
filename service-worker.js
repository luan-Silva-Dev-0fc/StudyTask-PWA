const CACHE_NAME = 'pwa-cache-v2';
const OFFLINE_URL = 'offline.html';
const DYNAMIC_CACHE = 'dynamic-cache-v2';

const STATIC_FILES = [
  './',
  'index.html',
  'manifest.json',
  'icon-192.png',
  'icon-512.png',
  'assets/splash.mp4',
  OFFLINE_URL
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheWhitelist = [CACHE_NAME, DYNAMIC_CACHE];
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(name => {
          if (!cacheWhitelist.includes(name)) {
            return caches.delete(name);
          }
        })
      );
      self.clients.claim();
      
      // Inicia notificações automáticas recorrentes
      enviarNotificacaoPeriodica();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      
      return fetch(request)
        .then(response => {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          if (request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }
        });
    })
  );
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-tasks') {
    event.waitUntil(syncTasks());
  }
});

async function syncTasks() {
  console.log('[ServiceWorker] Sincronizando tarefas...');
}

// Push Notification (caso seja usado depois)
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {
    title: 'StudyTask',
    body: 'Você tem tarefas pendentes!',
    icon: 'icon-192.png'
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: 'icon-192.png'
    })
  );
});

// Mensagem entre app e SW
self.addEventListener('message', (event) => {
  if (event.data === 'force-update') {
    self.skipWaiting();
  }
});

// Notificação automática a cada 1 hora
function enviarNotificacaoPeriodica() {
  self.registration.showNotification('Atualizações de Atividade', {
    body: 'Veja se há novas atualizações de atividade.',
    icon: 'icon-192.png',
    badge: 'icon-192.png'
  });
  
setTimeout(enviarNotificacaoPeriodica, 8 * 60 * 60 * 1000); // 8 horas
}
