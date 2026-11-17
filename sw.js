// Service worker: guarda os arquivos do site para abrir offline.
// Ao mudar arquivos, aumente a versão (lavclean-v2...) para limpar o cache antigo.
const CACHE = "lavclean-v2";
const ARQUIVOS = [
  "./", "./index.html", "./manifest.webmanifest",
  "./login.html", "./inicio.html", "./servicos.html", "./confirmar-pedido.html",
  "./meus-pedidos.html", "./perfil.html", "./endereco.html",
  "./style.css", "./responsive.css",
  "./storage.js", "./validation.js", "./services.js", "./auth.js", "./firebase-config.js", "./orders.js", "./loja.js", "./app.js",
  "./logo.png", "./maquina.svg", "./toalhas-cesto.svg", "./loja.svg", "./roupas.svg",
  "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"
];
self.addEventListener("install", e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting())));
self.addEventListener("activate", e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
// Rede primeiro (vê as mudanças logo); se estiver offline, usa o cache. Só arquivos do próprio site.
self.addEventListener("fetch", e => {
  const r = e.request;
  const url = new URL(r.url);
  if (r.method !== "GET" || (url.origin !== location.origin && url.hostname !== "www.gstatic.com")) return;
  e.respondWith(fetch(r).then(res => {
    if (res.ok || res.type === "opaque") { const copia = res.clone(); caches.open(CACHE).then(c => c.put(r, copia)); }
    return res;
  }).catch(() => caches.match(r, { ignoreSearch: true }).then(m => m || caches.match("./login.html"))));
});
