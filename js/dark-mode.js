/* ===================================================================
   SOS LOCAL — DARK MODE (jQuery 3.7.1)
   Componente reutilizável incluído em todas as páginas.

   Funcionamento:
   1. Lê a preferência guardada em localStorage (chave: 'sos-tema').
   2. Se não houver preferência, respeita prefers-color-scheme do SO.
   3. Aplica data-tema="escuro" ao <html> ANTES do primeiro render
      (o script inline no <head> faz isso; este ficheiro gere o botão
      e a interação do utilizador).
   4. Injecta o botão de alternância no header existente.
   5. Guarda a preferência ao mudar.
=================================================================== */

/* ── Script inline a incluir no <head> de cada página ──────────────
   (reproduzido aqui como comentário; o código real está no HTML)

   <script>
   (function(){
     var t = localStorage.getItem('sos-tema') ||
             (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro');
     if (t === 'escuro') document.documentElement.setAttribute('data-tema','escuro');
   })();
   </script>

   Este bloco síncrono garante zero flash ao recarregar a página.
──────────────────────────────────────────────────────────────────── */

$(function () {

    /* ── SVGs dos ícones ──────────────────────────────────────────── */
    /* Lâmpada acesa — modo escuro activo, clicar volta ao claro */
    var SVG_LAMPADA_ACESA = '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<path d="M9 21h6"/>' +
        '<path d="M12 3a6 6 0 0 1 6 6c0 2.22-1.2 4.16-3 5.2V17H9v-2.8C7.2 13.16 6 11.22 6 9a6 6 0 0 1 6-6z"/>' +
        '<line x1="12" y1="1" x2="12" y2="2.5"/>' +
        '<line x1="4.22" y1="4.22" x2="5.27" y2="5.27"/>' +
        '<line x1="1" y1="12" x2="2.5" y2="12"/>' +
        '<line x1="19.73" y1="5.27" x2="20.78" y2="4.22"/>' +
        '<line x1="21.5" y1="12" x2="23" y2="12"/>' +
        '</svg>';

    /* Lâmpada apagada — modo claro activo, clicar activa escuro */
    var SVG_LAMPADA_APAGADA = '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<path d="M9 21h6"/>' +
        '<path d="M12 3a6 6 0 0 1 6 6c0 2.22-1.2 4.16-3 5.2V17H9v-2.8C7.2 13.16 6 11.22 6 9a6 6 0 0 1 6-6z"/>' +
        '</svg>';

    /* ── Estado actual ────────────────────────────────────────────── */
    var $html   = $('html');
    var $header = $('#site-header');

    function temaActual() {
        return $html.attr('data-tema') === 'escuro' ? 'escuro' : 'claro';
    }

    function modoEscuro() {
        return temaActual() === 'escuro';
    }

    /* ── Injectar botão no header ────────────────────────────────── */
    var $btn = $(
        '<button id="btn-dark-mode" aria-label="Activar modo claro" title="Alternar tema"></button>'
    );
    $header.append($btn);

    /* ── Actualizar ícone, texto e aria-label ─────────────────────
       O texto junto ao ícone mostra sempre o MODO ACTUALMENTE ACTIVO,
       para que fique claro o que aquele ícone representa. */
    function actualizarBotao() {
        if (modoEscuro()) {
            $btn.html(
                SVG_LAMPADA_ACESA + '<span class="btn-dark-mode__label">Modo escuro</span>'
            ).attr('aria-label', 'Modo escuro activo. Clique para activar o modo claro.');
        } else {
            $btn.html(
                SVG_LAMPADA_APAGADA + '<span class="btn-dark-mode__label">Modo claro</span>'
            ).attr('aria-label', 'Modo claro activo. Clique para activar o modo escuro.');
        }
    }

    /* Estado inicial sem transição (evita animação no carregamento) */
    actualizarBotao();

    /* ── Alternar tema ──────────────────────────────────────────── */
    function alternarTema() {
        /* Activa transição suave apenas ao clicar, nunca ao carregar */
        $('body').addClass('tema-transicao');

        var novoTema = modoEscuro() ? 'claro' : 'escuro';

        if (novoTema === 'escuro') {
            $html.attr('data-tema', 'escuro');
        } else {
            $html.removeAttr('data-tema');
        }

        localStorage.setItem('sos-tema', novoTema);
        actualizarBotao();

        /* Remove a classe de transição após a animação terminar */
        setTimeout(function () {
            $('body').removeClass('tema-transicao');
        }, 350);
    }

    /* ── Eventos ────────────────────────────────────────────────── */
    $btn.on('click', alternarTema);

    /* Atalho de teclado: Alt + T (T de Tema) */
    $(document).on('keydown', function (e) {
        if (e.altKey && e.key === 't') {
            e.preventDefault();
            alternarTema();
        }
    });

    /* Responde a mudanças do sistema operativo em tempo real
       (apenas se o utilizador não tiver preferência guardada) */
    if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)')
            .addEventListener('change', function (e) {
                if (!localStorage.getItem('sos-tema')) {
                    if (e.matches) {
                        $html.attr('data-tema', 'escuro');
                    } else {
                        $html.removeAttr('data-tema');
                    }
                    actualizarBotao();
                }
            });
    }
});
