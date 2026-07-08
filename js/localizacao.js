/* ===================================================================
   SOS LOCAL — "Minha localização"
   - O MAPA visual mantém-se sempre o Google Maps embed (iframe sem
     chave de API), apenas recentrado na posição real do utilizador.
   - Quando existe uma LISTA associada ao botão (atualmente só em
     farmacias.html), essa lista é reconstruída com dados reais de
     farmácias próximas obtidos via Overpass API (OpenStreetMap) —
     o mapa do Google não expõe dados programáticos sem chave paga
     da Google Places API, por isso a lista usa esta fonte alternativa
     e gratuita. Mapa e lista mostram a mesma zona geográfica, mas
     não estão "ligados" um ao outro estabelecimento a estabelecimento,
     pois vêm de fontes de dados diferentes.
=================================================================== */
(function () {
    "use strict";

    // Configuração por tipo de serviço: termo de pesquisa do Google Maps + textos.
    var CONFIG = {
        hospital: {
            termo: 'hospitais e clínicas',
            titulo: 'hospitais e clínicas',
            emoji: '🏥'
        },
        farmacia: {
            termo: 'farmácias',
            titulo: 'farmácias',
            emoji: '💊',
            overpassTags: ['amenity=pharmacy']
        },
        policia: {
            termo: 'esquadras de polícia',
            titulo: 'esquadras de polícia',
            emoji: '🚓'
        },
        bombeiros: {
            termo: 'quartéis de bombeiros',
            titulo: 'quartéis de bombeiros',
            emoji: '🚒'
        }
    };

    var ZOOM_LOCALIZACAO = 14;
    var RAIO_METROS = 6000; // raio de pesquisa para a lista: 6km
    var OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

    /* -------------------------------------------------------------
       MAPA (Google Maps embed)
    ------------------------------------------------------------- */
    function construirUrlEmbed(termo, lat, lon) {
        var query = encodeURIComponent(termo);
        return 'https://www.google.com/maps?q=' + query +
            '&ll=' + lat + ',' + lon +
            '&z=' + ZOOM_LOCALIZACAO +
            '&output=embed';
    }

    /* -------------------------------------------------------------
       LISTA (dados reais via Overpass API / OpenStreetMap)
    ------------------------------------------------------------- */
    function distanciaKm(lat1, lon1, lat2, lon2) {
        var R = 6371;
        var dLat = (lat2 - lat1) * Math.PI / 180;
        var dLon = (lon2 - lon1) * Math.PI / 180;
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    function formatarDistancia(km) {
        if (km < 1) return Math.round(km * 1000) + ' m';
        return km.toFixed(1).replace('.', ',') + ' km';
    }

    function linkDirecoes(origemLat, origemLon, destLat, destLon) {
        return 'https://www.google.com/maps/dir/?api=1&origin=' + origemLat + ',' + origemLon +
            '&destination=' + destLat + ',' + destLon;
    }

    function construirQueryOverpass(tags, lat, lon) {
        var partes = tags.map(function (tag) {
            var kv = tag.split('=');
            return '  node["' + kv[0] + '"="' + kv[1] + '"](around:' + RAIO_METROS + ',' + lat + ',' + lon + ');\n' +
                   '  way["' + kv[0] + '"="' + kv[1] + '"](around:' + RAIO_METROS + ',' + lat + ',' + lon + ');';
        }).join('\n');
        return '[out:json][timeout:25];\n(\n' + partes + '\n);\nout center 20;';
    }

    function montarMorada(tags) {
        if (!tags) return null;
        var rua = tags['addr:street'];
        var numero = tags['addr:housenumber'];
        var cidade = tags['addr:city'];
        var partes = [];
        if (rua) partes.push(rua + (numero ? ', ' + numero : ''));
        if (cidade) partes.push(cidade);
        return partes.length ? partes.join(', ') : null;
    }

    function procurarFarmacias(tags, lat, lon) {
        var query = construirQueryOverpass(tags, lat, lon);
        return fetch(OVERPASS_URL, {
            method: 'POST',
            body: 'data=' + encodeURIComponent(query)
        }).then(function (resp) {
            if (!resp.ok) throw new Error('Falha na resposta do Overpass API.');
            return resp.json();
        }).then(function (data) {
            var elementos = data.elements || [];
            var locais = elementos.map(function (el) {
                var elLat = el.lat != null ? el.lat : (el.center ? el.center.lat : null);
                var elLon = el.lon != null ? el.lon : (el.center ? el.center.lon : null);
                if (elLat == null || elLon == null) return null;
                var tags = el.tags || {};
                return {
                    nome: tags.name || 'Farmácia (sem nome registado)',
                    lat: elLat,
                    lon: elLon,
                    distancia: distanciaKm(lat, lon, elLat, elLon),
                    telefone: tags.phone || tags['contact:phone'] || null,
                    morada: montarMorada(tags),
                    horario: tags.opening_hours || null
                };
            }).filter(Boolean);

            locais.sort(function (a, b) { return a.distancia - b.distancia; });
            return locais.slice(0, 9);
        });
    }

    function construirCartaoFarmacia(local, origemLat, origemLon) {
        var badge = '';
        var horarioTexto = 'Horário não disponível — confirme por telefone ou no local.';

        if (local.horario === '24/7') {
            badge = '<p class="pharmacy-status pharmacy-status--24h">Aberta 24h</p>';
            horarioTexto = 'Funcionamento 24 horas, todos os dias';
        } else if (local.horario) {
            badge = '<p class="pharmacy-status pharmacy-status--limitado">Ver horário</p>';
            horarioTexto = local.horario;
        }

        var linhaMorada = '<p class="pharmacy-info"><span class="pharmacy-info-icon" aria-hidden="true">📍</span> ' +
            (local.morada || 'Morada não disponível — ver localização no mapa') + '</p>';

        var linhaTelefone = local.telefone
            ? '<p class="pharmacy-info"><span class="pharmacy-info-icon" aria-hidden="true">☎</span> <a href="tel:' + local.telefone + '">' + local.telefone + '</a></p>'
            : '';

        var botaoAcao = local.telefone
            ? '<a href="tel:' + local.telefone + '" class="btn-small pharmacy-call">📞 Ligar agora</a>'
            : '<a href="' + linkDirecoes(origemLat, origemLon, local.lat, local.lon) + '" target="_blank" rel="noopener noreferrer" class="btn-small pharmacy-call">🧭 Direções</a>';

        return '<li class="pharmacy-card pharmacy-card--localizacao">' +
            badge +
            '<h3>' + local.nome + '</h3>' +
            '<p class="pharmacy-info pharmacy-distancia"><span class="pharmacy-info-icon" aria-hidden="true">📏</span> ' + formatarDistancia(local.distancia) + ' da sua localização</p>' +
            '<address>' + linhaMorada + linhaTelefone + '</address>' +
            '<p class="pharmacy-info"><span class="pharmacy-info-icon" aria-hidden="true">🕒</span> ' + horarioTexto + '</p>' +
            botaoAcao +
        '</li>';
    }

    function atualizarListaFarmacias(config, lat, lon, listaContainer, statusContainer) {
        statusContainer.hidden = false;
        statusContainer.classList.remove('erro');
        statusContainer.textContent = '🔎 A procurar farmácias reais perto de si...';

        return procurarFarmacias(config.overpassTags, lat, lon).then(function (locais) {
            if (locais.length === 0) {
                statusContainer.classList.add('erro');
                statusContainer.textContent = 'Não foi encontrada nenhuma farmácia registada num raio de ' +
                    (RAIO_METROS / 1000) + ' km. A lista abaixo mantém-se como referência.';
                return;
            }

            listaContainer.innerHTML = locais.map(function (local) {
                return construirCartaoFarmacia(local, lat, lon);
            }).join('');

            statusContainer.classList.remove('erro');
            statusContainer.textContent = '✅ ' + locais.length + ' farmácia(s) encontrada(s) perto de si. ' +
                'Dados de localização: © colaboradores do OpenStreetMap. Ligue antes de se deslocar para confirmar stock.';
        }).catch(function (erro) {
            statusContainer.classList.add('erro');
            statusContainer.textContent = 'Não foi possível carregar farmácias em tempo real. A lista abaixo mantém-se como referência.';
            console.error(erro);
        });
    }

    /* -------------------------------------------------------------
       BOTÃO
    ------------------------------------------------------------- */
    function estadoBotao(botao, texto, desativado) {
        botao.textContent = texto;
        botao.disabled = !!desativado;
    }

    function inicializarBotao(botao) {
        var tipo = botao.getAttribute('data-tipo');
        var mapaId = botao.getAttribute('data-mapa');
        var resultadosId = botao.getAttribute('data-resultados');
        var listaId = botao.getAttribute('data-lista');
        var statusListaId = botao.getAttribute('data-status-lista');
        var config = CONFIG[tipo];
        var mapaContainer = document.getElementById(mapaId);
        var resultadosContainer = document.getElementById(resultadosId);
        var listaContainer = listaId ? document.getElementById(listaId) : null;
        var statusListaContainer = statusListaId ? document.getElementById(statusListaId) : null;
        var textoOriginal = botao.textContent;

        if (!config || !mapaContainer || !resultadosContainer) return;

        var iframe = mapaContainer.querySelector('iframe');
        if (!iframe) return;

        botao.addEventListener('click', function () {
            if (!('geolocation' in navigator)) {
                resultadosContainer.hidden = false;
                resultadosContainer.innerHTML = '<p class="localizacao-erro">O seu navegador não suporta geolocalização.</p>';
                return;
            }

            estadoBotao(botao, '📍 A obter localização...', true);
            resultadosContainer.hidden = false;
            resultadosContainer.innerHTML = '<p class="localizacao-status">A localizar ' + config.titulo + ' perto de si...</p>';

            navigator.geolocation.getCurrentPosition(function (posicao) {
                var lat = posicao.coords.latitude;
                var lon = posicao.coords.longitude;

                iframe.src = construirUrlEmbed(config.termo, lat, lon);
                resultadosContainer.innerHTML = '<p class="localizacao-status">' + config.emoji +
                    ' O mapa foi atualizado com ' + config.titulo + ' perto da sua localização atual.</p>';

                if (listaContainer && statusListaContainer && config.overpassTags) {
                    atualizarListaFarmacias(config, lat, lon, listaContainer, statusListaContainer).then(function () {
                        estadoBotao(botao, '📍 Atualizar localização', false);
                    });
                } else {
                    estadoBotao(botao, '📍 Atualizar localização', false);
                }
            }, function (erro) {
                estadoBotao(botao, textoOriginal, false);
                var mensagem = 'Não foi possível obter a sua localização.';
                if (erro.code === erro.PERMISSION_DENIED) {
                    mensagem = 'Precisamos da sua permissão de localização para mostrar os serviços mais próximos.';
                } else if (erro.code === erro.TIMEOUT) {
                    mensagem = 'O pedido de localização demorou demasiado tempo. Tente novamente.';
                }
                resultadosContainer.hidden = false;
                resultadosContainer.innerHTML = '<p class="localizacao-erro">' + mensagem + '</p>';
            }, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            });
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        var botoes = document.querySelectorAll('.btn-localizacao');
        botoes.forEach(inicializarBotao);
    });
}());
