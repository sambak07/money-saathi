const VERSION = 'money-saathi-v1'
const SHELL = ["/", "/manifest.webmanifest", "/icon.svg"]
self.addEventListener('install', event => { event.waitUntil(caches.open(VERSION).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting())) })
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('money-saathi-') && key !== VERSION).map(key => caches.delete(key)))).then(() => self.clients.claim())) })
self.addEventListener('fetch', event => { if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) return; event.respondWith(fetch(event.request).then(response => { if (response.ok && event.request.destination !== 'document') { const copy = response.clone(); void caches.open(VERSION).then(cache => cache.put(event.request, copy)) } return response }).catch(() => caches.match(event.request).then(cached => cached || caches.match('/')))) })
