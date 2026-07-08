/* ===================================================================
   SOS LOCAL — BOTÃO "VOLTAR AO TOPO" (jQuery 3.7.1)
   Componente reutilizável: inclua este script em qualquer página
   do projeto após o jQuery. Não requer nenhuma alteração no HTML
   existente — o elemento é injetado dinamicamente no <body>.
=================================================================== */
$(function () {

    /* ── 1. Injetar o botão no DOM ─────────────────────────────── */
    var $btn = $(
        '<button id="voltar-topo" aria-label="Voltar ao topo da página" title="Voltar ao topo">' +
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" ' +
                'aria-hidden="true" focusable="false">' +
                '<polyline points="18 15 12 9 6 15"></polyline>' +
            '</svg>' +
        '</button>'
    );
    $('body').append($btn);

    /* ── 2. Limiar de scroll a partir do qual o botão aparece ─── */
    var LIMIAR_SCROLL = 300;   // px
    var DURACAO_FADE  = 300;   // ms
    var DURACAO_SCROLL = 500;  // ms

    /* ── 3. Mostrar / esconder com fadeIn / fadeOut ────────────── */
    function actualizarVisibilidade() {
        if ($(window).scrollTop() >= LIMIAR_SCROLL) {
            $btn.fadeIn(DURACAO_FADE);
        } else {
            $btn.fadeOut(DURACAO_FADE);
        }
    }

    // Verificação inicial (caso a página já esteja com scroll ao carregar)
    actualizarVisibilidade();

    $(window).on('scroll.voltarTopo', actualizarVisibilidade);

    /* ── 4. Scroll suave ao topo ao clicar ────────────────────── */
    $btn.on('click', function () {
        $('html, body').animate({ scrollTop: 0 }, DURACAO_SCROLL, 'swing');
    });

    /* ── 5. Acessibilidade: tecla Enter / Space ────────────────── */
    $btn.on('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            $btn.trigger('click');
        }
    });
});
