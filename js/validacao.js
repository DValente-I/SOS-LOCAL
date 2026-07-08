/* ===================================================================
   SOS LOCAL — VALIDAÇÃO DO FORMULÁRIO DE CONTACTO
   Usado apenas em contato.html (#contact-form).

   Regra de implementação:
   - As funções de validação abaixo são JavaScript puro, sem
     dependência de jQuery nem de qualquer plugin de validação.
   - O jQuery é usado exclusivamente para manipulação do DOM
     (selecionar elementos, ouvir eventos, mostrar/ocultar
     mensagens de erro, alternar classes).
=================================================================== */

/* -------------------------------------------------------------
   FUNÇÕES PURAS DE VALIDAÇÃO (JavaScript, sem jQuery)
   Cada função recebe um valor e devolve uma mensagem de erro
   (string) ou null quando o valor é válido — fáceis de testar
   isoladamente, independentes do DOM.
------------------------------------------------------------- */

/**
 * Remove espaços nas extremidades e colapsa espaços internos
 * repetidos, para avaliar o "conteúdo real" do texto.
 */
function limparTexto(valor) {
    return String(valor || '').trim();
}

/**
 * Valida o campo Nome Completo.
 * Regras: obrigatório, não pode ser só espaços, mínimo 3
 * caracteres úteis, e deve conter apenas letras (com acentos),
 * espaços e hífen — sem números nem símbolos.
 */
function validarNome(valor) {
    var texto = limparTexto(valor);

    if (texto.length === 0) {
        return 'Por favor, escreva o seu nome.';
    }
    if (texto.length < 3) {
        return 'O nome deve ter pelo menos 3 letras.';
    }
    var apenasLetras = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/;
    if (!apenasLetras.test(texto)) {
        return 'O nome não deve conter números ou símbolos.';
    }
    return null;
}

/**
 * Valida o campo E-mail.
 * Regras: obrigatório, não pode ser só espaços, e deve
 * corresponder a um padrão simples "algo@algo.algo".
 */
function validarEmail(valor) {
    var texto = limparTexto(valor);

    if (texto.length === 0) {
        return 'Por favor, indique o seu e-mail.';
    }
    var padraoEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!padraoEmail.test(texto)) {
        return 'Indique um e-mail válido (exemplo: nome@dominio.com).';
    }
    return null;
}

/**
 * Valida o campo Mensagem.
 * Regras: obrigatório, não pode ser só espaços, mínimo 10
 * caracteres úteis (mensagem minimamente descritiva).
 */
function validarMensagem(valor) {
    var texto = limparTexto(valor);

    if (texto.length === 0) {
        return 'Por favor, escreva a sua mensagem.';
    }
    if (texto.length < 10) {
        return 'A mensagem deve ter pelo menos 10 caracteres.';
    }
    return null;
}

/* -------------------------------------------------------------
   MANIPULAÇÃO DO DOM (jQuery)
------------------------------------------------------------- */
$(function () {
    var $form = $('#contact-form');
    if (!$form.length) {
        // Esta página não tem o formulário de contacto — nada a fazer.
        return;
    }

    var $nome = $('#nome');
    var $email = $('#email');
    var $msg = $('#msg');
    var $sucesso = $('#form-sucesso');

    // Mapa entre cada campo, a sua função de validação e o
    // elemento onde a respetiva mensagem de erro é apresentada.
    var camposValidaveis = [
        { $campo: $nome, validar: validarNome, $erro: $('#erro-nome') },
        { $campo: $email, validar: validarEmail, $erro: $('#erro-email') },
        { $campo: $msg, validar: validarMensagem, $erro: $('#erro-msg') }
    ];

    function mostrarErro(item, mensagem) {
        item.$campo
            .addClass('campo-invalido')
            .attr('aria-invalid', 'true');
        item.$erro.text(mensagem);
    }

    function limparErro(item) {
        item.$campo
            .removeClass('campo-invalido')
            .attr('aria-invalid', 'false');
        item.$erro.text('');
    }

    /**
     * Valida um único campo e atualiza a interface (classe +
     * mensagem). Devolve true se o campo for válido.
     */
    function validarCampo(item) {
        var mensagemErro = item.validar(item.$campo.val());
        if (mensagemErro) {
            mostrarErro(item, mensagemErro);
            return false;
        }
        limparErro(item);
        return true;
    }

    // Validação em tempo real: ao sair de cada campo (blur).
    // Os dados escritos nunca são alterados ou apagados — só se
    // lê o valor atual para avaliar a sua validade.
    camposValidaveis.forEach(function (item) {
        item.$campo.on('blur', function () {
            validarCampo(item);
        });

        // Se o utilizador já tinha visto um erro e está a corrigir,
        // o feedback atualiza-se enquanto escreve, sem esperar
        // por outro blur — melhora a perceção de progresso.
        item.$campo.on('input', function () {
            if (item.$campo.hasClass('campo-invalido')) {
                validarCampo(item);
            }
        });
    });

    // Validação completa ao submeter o formulário.
    $form.on('submit', function (evento) {
        $sucesso.text('');

        var todosValidos = true;
        var primeiroInvalido = null;

        camposValidaveis.forEach(function (item) {
            var valido = validarCampo(item);
            if (!valido && !primeiroInvalido) {
                primeiroInvalido = item.$campo;
            }
            todosValidos = todosValidos && valido;
        });

        if (!todosValidos) {
            // Impede o envio enquanto existirem erros, e mantém
            // todos os valores já escritos pelo utilizador.
            evento.preventDefault();
            primeiroInvalido.trigger('focus');
            return false;
        }

        // Não existe servidor/backend neste projeto académico, por
        // isso o envio real é feito por e-mail: constrói-se um link
        // "mailto:" com os dados preenchidos e abre-se o cliente de
        // e-mail do utilizador já com o assunto e o corpo da
        // mensagem prontos, endereçado ao e-mail institucional.
        evento.preventDefault();

        var destinatario = 'geral@soslocal.ao';
        var assuntoEscolhido = $('#assunto option:selected').text();
        var linhaAssunto = encodeURIComponent('[SOS Local] ' + assuntoEscolhido + ' — ' + $nome.val().trim());
        var corpoMensagem = encodeURIComponent(
            'Nome: ' + $nome.val().trim() + '\n' +
            'E-mail: ' + $email.val().trim() + '\n' +
            'Assunto: ' + assuntoEscolhido + '\n\n' +
            'Mensagem:\n' + $msg.val().trim()
        );

        window.location.href = 'mailto:' + destinatario + '?subject=' + linhaAssunto + '&body=' + corpoMensagem;

        $sucesso.text('A abrir o seu cliente de e-mail com a mensagem preenchida para ' + destinatario +
            '. Se não abrir automaticamente, envie-nos diretamente para esse endereço.');
    });
});
