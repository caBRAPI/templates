/**
 * Servico de Manipulacao DOM - Utilitarios para interacao com elementos HTML.
 * 
 * @module services/dom
 * @description Fornece funcoes para manipulacao de estado de botoes, controle de modais
 *              e sanitizacao de dados para prevencao de XSS.
 * 
 * @author caBRAPI Team
 * @version 1.0.0
 */

/**
 * Exibe uma mensagem temporaria em um botao, desativando-o durante a exibicao.
 * 
 * @function showTemporaryButtonState
 * @description Altera o conteudo do botao para uma mensagem de feedback (ex: "Adicionando...")
 *              e desativa o botao temporariamente. Apos o tempo especificado, restaura o
 *              estado original. Usado para dar feedback visual durante operacoes async.
 * 
 * @param {JQuery<HTMLElement>} $button - Elemento jQuery do botao
 * @param {string} html - Novo conteudo HTML a ser exibido
 * @param {number} [durationMs=1400] - Tempo em milissegundos para restaurar o estado original
 * 
 * @example
 * const $btn = $('#add-to-cart-btn');
 * showTemporaryButtonState($btn, '<i class="fas fa-check"></i> Adicionado');
 */
export function showTemporaryButtonState($button, html, durationMs = 1400) {
  const previous = $button.html();
  $button.prop("disabled", true).html(html);

  setTimeout(() => {
    $button.prop("disabled", false).html(previous);
  }, durationMs);
}

/**
 * Controla a visibilidade de um overlay/modal usando classes utilitarias do Tailwind.
 * 
 * @function setOverlayVisible
 * @description Gerencia a exibicao/ocultacao de modais e overlays.
 *              No mobile, suporta comportamento de bottom sheet com animacao de slide.
 *              Adiciona classe ao body para prevenir scroll quando modal esta aberto.
 * 
 * @param {JQuery<HTMLElement>} $element - Elemento jQuery do modal/overlay
 * @param {boolean} visible - True para exibir, false para ocultar
 * @param {boolean} [isBottomSheet=false] - Se true, adiciona animacao de slide para mobile
 * 
 * @example
 * // Mostrar modal
 * setOverlayVisible($('#checkout'), true);
 * 
 * // Ocultar modal com animacao bottom sheet
 * setOverlayVisible($('#checkout'), false, true);
 */
export function setOverlayVisible($element, visible) {
  if (visible) {
    $element.addClass("is-open");
    document.body.classList.add("checkout-open");
    return;
  }
  $element.removeClass("is-open");
  document.body.classList.remove("checkout-open");
}

/**
 * Escapa caracteres especiais para previnir ataques de injecao de HTML/XSS.
 * 
 * @function escapeHtml
 * @description Substitui caracteres que possuem significado especial em HTML
 *              por suas entidades HTML equivalentes. Essencial para exibir dados
 *              do usuario com seguranca (evita XSS).
 * 
 * @param {string} value - Texto a ser escapado
 * @returns {string} Texto com caracteres especiais convertidos para entidades HTML
 * 
 * @example
 * escapeHtml('<script>alert("xss")</script>');
 * // Retorna: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
 * 
 * @example
 * escapeHtml("Nome: João & Maria");
 * // Retorna: 'Nome: João &amp; Maria'
 */
export function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

