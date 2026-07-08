/* ===================================================================
   SOS LOCAL — MENU DE NAVEGAÇÃO RESPONSIVO (jQuery 3.7.1)
   Reutilizado por todas as páginas do projeto.
   Reaproveita o HTML existente (#menu-toggle, #top-navigation) sem
   alterar a estrutura, os links ou o texto do menu.
=================================================================== */
$(function () {
    var $toggle = $('#menu-toggle');
    var $nav = $('#top-navigation');
    var $links = $nav.find('a');

    if (!$toggle.length || !$nav.length) {
        return;
    }

    // Liga semanticamente o botão ao menu que controla (acessibilidade)
    $toggle.attr('aria-controls', 'top-navigation');

    function abrirMenu() {
        $nav.addClass('aberto').stop(true, true).slideDown(250);
        $toggle.attr('aria-expanded', 'true');
    }

    function fecharMenu() {
        // Em desktop o menu não usa slideUp (já está sempre visível);
        // a classe "aberto" é o que controla o estado em mobile.
        $nav.removeClass('aberto').stop(true, true).slideUp(200, function () {
            // Remove o style inline deixado pelo slideUp, para que o
            // CSS de desktop (sem JS) volte a controlar a exibição
            // caso a janela seja redimensionada.
            $nav.removeAttr('style');
        });
        $toggle.attr('aria-expanded', 'false');
    }

    function menuAberto() {
        return $nav.hasClass('aberto');
    }

    // Alterna o menu ao clicar no botão hambúrguer
    $toggle.on('click', function () {
        if (menuAberto()) {
            fecharMenu();
        } else {
            abrirMenu();
        }
    });

    // Fecha automaticamente o menu ao clicar em qualquer link de navegação
    $links.on('click', function () {
        if (menuAberto()) {
            fecharMenu();
        }
    });

    // Acessibilidade: tecla Esc fecha o menu e devolve o foco ao botão
    $(document).on('keydown', function (e) {
        if (e.key === 'Escape' && menuAberto()) {
            fecharMenu();
            $toggle.trigger('focus');
        }
    });

    // Evita estado inconsistente ao redimensionar de mobile para desktop
    // com o menu aberto (o botão hambúrguer desaparece em desktop via CSS).
    $(window).on('resize', function () {
        if ($(window).width() > 768 && menuAberto()) {
            $nav.removeClass('aberto').removeAttr('style');
            $toggle.attr('aria-expanded', 'false');
        }
    });

    // Destaque dinâmico da página ativa — reforço sobre a marcação
    // já existente no HTML (class="nav-ativo"), comparando o caminho
    // do link com o caminho atual da página.
    var caminhoAtual = window.location.pathname.split('/').pop() || 'index.html';

    $links.each(function () {
        var href = $(this).attr('href');
        if (!href) {
            return;
        }
        var pagina = href.split('/').pop();
        if (pagina === caminhoAtual) {
            $links.removeClass('nav-ativo');
            $(this).addClass('nav-ativo');
        }
    });
});
