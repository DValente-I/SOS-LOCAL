/**
 * SOS LOCAL — Carrossel do Guia de Sobrevivência (ajuda.html)
 * Requer jQuery 3.7.1 (já carregado no header).
 * Activo apenas em mobile (≤ 768px); em desktop não executa nenhuma
 * lógica de DOM para não afectar o grid original.
 *
 * Funcionalidades:
 *  - Navegação por botões (← →)
 *  - Navegação por toque (swipe horizontal, delta mínimo 50px)
 *  - Indicadores de paginação com aria-current
 *  - aria-live para leitores de ecrã
 *  - Respeita prefers-reduced-motion (desactiva animação)
 */

$(function () {

    /* ---------------------------------------------------------------
       Verificação de breakpoint — apenas mobile
    --------------------------------------------------------------- */
    var BREAKPOINT = 768;

    function isMobile() {
        return window.matchMedia('(max-width: ' + BREAKPOINT + 'px)').matches;
    }

    /* Sai cedo se não for mobile (guard clause) */
    if (!isMobile()) return;

    /* ---------------------------------------------------------------
       Preferência de movimento reduzido
    --------------------------------------------------------------- */
    var prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
    ).matches;

    /* ---------------------------------------------------------------
       Referências DOM
    --------------------------------------------------------------- */
    var $wrapper     = $('.carrossel-wrapper');
    var $faixa       = $wrapper.find('.carrossel-faixa');
    var $slides      = $faixa.find('.blog-post');
    var $btnAnterior = $wrapper.find('.carrossel-btn--anterior');
    var $btnProximo  = $wrapper.find('.carrossel-btn--proximo');
    var $pontos      = $wrapper.find('.carrossel-ponto');
    var $anuncio     = $wrapper.find('.carrossel-anuncio');

    var total  = $slides.length;
    var atual  = 0;

    /* ---------------------------------------------------------------
       Função principal: mover para slide N
    --------------------------------------------------------------- */
    function irPara(indice) {
        /* Limites */
        if (indice < 0 || indice >= total) return;

        atual = indice;

        /* Desactiva animação se o utilizador preferir */
        if (prefersReducedMotion) {
            $faixa.css('transition', 'none');
        }

        /* Translação horizontal */
        $faixa.css('transform', 'translateX(-' + (atual * 100) + '%)');

        /* Actualiza indicadores */
        $pontos.each(function (i) {
            $(this).attr('aria-current', i === atual ? 'true' : 'false');
        });

        /* Actualiza botões */
        $btnAnterior.prop('disabled', atual === 0);
        $btnProximo.prop('disabled', atual === total - 1);

        /* Anuncia para leitores de ecrã */
        var tituloSlide = $slides.eq(atual).find('h3').text().trim();
        $anuncio.text('Guia ' + (atual + 1) + ' de ' + total + ': ' + tituloSlide);
    }

    /* ---------------------------------------------------------------
       Eventos: botões de navegação
    --------------------------------------------------------------- */
    $btnAnterior.on('click', function () {
        irPara(atual - 1);
    });

    $btnProximo.on('click', function () {
        irPara(atual + 1);
    });

    /* ---------------------------------------------------------------
       Eventos: pontos de paginação
    --------------------------------------------------------------- */
    $pontos.on('click', function () {
        irPara($(this).data('indice'));
    });

    /* ---------------------------------------------------------------
       Navegação por teclado nos pontos (← → setas)
    --------------------------------------------------------------- */
    $pontos.on('keydown', function (e) {
        if (e.key === 'ArrowLeft')  { e.preventDefault(); irPara(atual - 1); }
        if (e.key === 'ArrowRight') { e.preventDefault(); irPara(atual + 1); }
    });

    /* ---------------------------------------------------------------
       Swipe por toque
    --------------------------------------------------------------- */
    var toqueInicioX = null;
    var toqueInicioY = null;
    var DELTA_MIN    = 50; /* px mínimos para considerar swipe */

    $wrapper.on('touchstart', function (e) {
        var toque = e.originalEvent.touches[0];
        toqueInicioX = toque.clientX;
        toqueInicioY = toque.clientY;
    });

    $wrapper.on('touchend', function (e) {
        if (toqueInicioX === null) return;

        var toque   = e.originalEvent.changedTouches[0];
        var deltaX  = toqueInicioX - toque.clientX;
        var deltaY  = Math.abs(toqueInicioY - toque.clientY);

        /* Ignora gestos predominantemente verticais (scroll da página) */
        if (deltaY > Math.abs(deltaX)) {
            toqueInicioX = null;
            return;
        }

        if (deltaX > DELTA_MIN)  irPara(atual + 1); /* swipe para a esquerda → próximo */
        if (deltaX < -DELTA_MIN) irPara(atual - 1); /* swipe para a direita  → anterior */

        toqueInicioX = null;
        toqueInicioY = null;
    });

    /* ---------------------------------------------------------------
       Estado inicial
    --------------------------------------------------------------- */
    irPara(0);
});
