/* ===================================================================
   SOS LOCAL — CONSENTIMENTO DE COOKIES (jQuery 3.7.1)
   Componente reutilizável incluído em todas as páginas.

   Funcionamento:
   1. Verifica se já existe o cookie "sosCookiesAceites".
   2. Se não existir, injeta o banner no fundo da página.
   3. "Aceitar"  → grava o cookie com valor "1" durante 180 dias.
   4. "Recusar"  → grava o cookie com valor "0" durante 1 dia
      (não incomoda o utilizador todos os dias, mas volta a perguntar
      periodicamente em vez de assumir uma recusa permanente).
   5. Em qualquer dos casos, o banner é removido com uma transição.

   Apenas cookies essenciais são usados no site (preferência de tema
   e este próprio registo de consentimento) — ver detalhes na
   Política de Cookies em legal.html#cookies.
=================================================================== */

/* ── Auxiliares de cookies ────────────────────────────────────── */
function sosDefinirCookie(nome, valor, dias) {
    var data = new Date();
    data.setTime(data.getTime() + (dias * 24 * 60 * 60 * 1000));
    document.cookie = nome + '=' + valor + ';expires=' + data.toUTCString() + ';path=/;SameSite=Lax';
}

function sosLerCookie(nome) {
    var linhas = document.cookie.split(';');
    for (var i = 0; i < linhas.length; i++) {
        var linha = linhas[i].trim();
        if (linha.indexOf(nome + '=') === 0) {
            return linha.substring(nome.length + 1);
        }
    }
    return null;
}

$(function () {

    /* Já existe uma decisão registada (aceite ou recusa recente)? */
    if (sosLerCookie('sosCookiesAceites') !== null) { return; }

    /* ── Injeta o banner ──────────────────────────────────────── */
    var $banner = $(
        '<div id="aviso-cookies" role="dialog" aria-label="Aviso de cookies">' +
            '<p id="aviso-cookies__texto">' +
                '🍪 Utilizamos cookies essenciais para o funcionamento do site (ex.: preferência de tema). ' +
                'Não usamos cookies de publicidade nem de rastreio. ' +
                'Saiba mais na nossa <a href="/html/legal.html#cookies">Política de Cookies</a>.' +
            '</p>' +
            '<div id="aviso-cookies__acoes">' +
                '<button id="btn-cookies-recusar" type="button">Recusar</button>' +
                '<button id="btn-cookies-aceitar" type="button">Aceitar</button>' +
            '</div>' +
        '</div>'
    );
    $('body').append($banner);

    /* Pequeno atraso para a transição de entrada funcionar */
    setTimeout(function () { $banner.addClass('visivel'); }, 150);

    function fecharBanner() {
        $banner.removeClass('visivel');
        setTimeout(function () { $banner.remove(); }, 400);
    }

    $('#btn-cookies-aceitar').on('click', function () {
        sosDefinirCookie('sosCookiesAceites', '1', 180);
        fecharBanner();
    });

    $('#btn-cookies-recusar').on('click', function () {
        sosDefinirCookie('sosCookiesAceites', '0', 1);
        fecharBanner();
    });
});
