/* ===================================================================
   SOS LOCAL — SERVICE WORKER
   Objetivo: garantir que a home e as 4 páginas de emergência (com
   os respetivos números: Polícia 113, Saúde 112, Bombeiros 115,
   Farmácias) continuam acessíveis mesmo sem rede ou com rede fraca —
   o cenário mais crítico para uma plataforma de emergência.

   Estratégia:
   - Instala e pré-armazena o "shell" essencial (HTML + CSS + JS).
   - Para os recursos pré-armazenados: cache primeiro, rede como apoio
     (resposta instantânea, sempre disponível offline).
   - Para tudo o resto do mesmo site: rede primeiro, com fallback
     para cache; se for uma navegação e nada estiver disponível,
     mostra a home guardada em cache (a pior situação é sempre
     "ver a home", nunca um ecrã em branco).
  
=================================================================== */

const CACHE_NAME = 'sos-local-v1';

// "Shell" essencial: home + as 4 páginas de emergência + os
// recursos de que precisam para se apresentarem corretamente offline.
const ASSETS_ESSENCIAIS = [
    './index.html',
    './html/saude.html',
    './html/farmacias.html',
    './html/policia.html',
    './html/bombeiros.html',
    './css/estilo.css',
    './css/index.css',
    './css/detalhes.css',
    './css/dark-mode.css',
    './css/cookies.css',
    './js/menu.js',
    './js/voltar-topo.js',
    './js/dark-mode.js',
    './js/cookies.js',
    './js/localizacao.js',
    './manifest.json',
    './img/icons/favicon.svg',
    './img/icons/favicon-32.png',
    './img/icons/favicon-16.png',
    './img/icons/apple-touch-icon.png',
    './img/icons/icon-192.png',
    './img/icons/icon-512.png'
];

self.addEventListener('install', function (evento) {
    evento.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            // Adiciona cada recurso individualmente: se um falhar (ex.
            // sem rede num recurso específico), os restantes não são
            // afetados — ao contrário de cache.addAll(), que falha tudo
            // se um único pedido falhar.
            return Promise.all(
                ASSETS_ESSENCIAIS.map(function (recurso) {
                    return cache.add(recurso).catch(function (erro) {
                        console.warn('[SOS Local SW] Falha ao pré-armazenar:', recurso, erro);
                    });
                })
            );
        }).then(function () {
            return self.skipWaiting();
        })
    );
});

self.addEventListener('activate', function (evento) {
    evento.waitUntil(
        caches.keys().then(function (nomes) {
            return Promise.all(
                nomes
                    .filter(function (nome) { return nome !== CACHE_NAME; })
                    .map(function (nome) { return caches.delete(nome); })
            );
        }).then(function () {
            return self.clients.claim();
        })
    );
});

function ehRecursoEssencial(url) {
    return ASSETS_ESSENCIAIS.some(function (recurso) {
        return url.pathname.endsWith(recurso.replace('./', '/'));
    });
}

self.addEventListener('fetch', function (evento) {
    const pedido = evento.request;
    const url = new URL(pedido.url);

    // Só geríamos pedidos GET, do mesmo site.
    if (pedido.method !== 'GET' || url.origin !== self.location.origin) {
        return;
    }

    // 1) Shell essencial: cache primeiro (resposta imediata), com
    //    atualização silenciosa em segundo plano quando há rede.
    if (ehRecursoEssencial(url)) {
        evento.respondWith(
            caches.match(pedido).then(function (respostaCache) {
                const pedidoRede = fetch(pedido).then(function (respostaRede) {
                    caches.open(CACHE_NAME).then(function (cache) {
                        cache.put(pedido, respostaRede.clone());
                    });
                    return respostaRede;
                }).catch(function () {
                    return respostaCache;
                });
                return respostaCache || pedidoRede;
            })
        );
        return;
    }

    // 2) Restantes páginas/recursos do site: rede primeiro, cache
    //    como reserva; navegação sem rede e sem cache cai na home.
    evento.respondWith(
        fetch(pedido).then(function (respostaRede) {
            caches.open(CACHE_NAME).then(function (cache) {
                cache.put(pedido, respostaRede.clone());
            });
            return respostaRede;
        }).catch(function () {
            return caches.match(pedido).then(function (respostaCache) {
                if (respostaCache) return respostaCache;
                if (pedido.mode === 'navigate') {
                    return caches.match('./index.html');
                }
                return Response.error();
            });
        })
    );
});
