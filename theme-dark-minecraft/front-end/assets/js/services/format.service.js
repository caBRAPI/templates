/**
 * Servico de Formatacao - Utilitarios para formatacao de dados de exibicao.
 * 
 * @module services/format
 * @description Fornece funcoes para formatar valores monetarios e gerar placeholders.
 * 
 * @author caBRAPI Team
 * @version 1.0.0
 */

/**
 * Formata um numero para o padrao monetario brasileiro (BRL).
 * 
 * @function formatCurrency
 * @description Converte um valor numerico para string formatada em Real Brasileiro.
 *              Utiliza a API Intl.NumberFormat para formatacao correta de Locale.
 * 
 * @param {number} value - Valor numerico a ser formatado
 * @returns {string} String formatada com o simbolo R$ e separadores brasileiros
 * 
 * @example
 * formatCurrency(100);           // "R$ 100,00"
 * formatCurrency(1234.56);       // "R$ 1.234,56"
 * formatCurrency(0);            // "R$ 0,00"
 * 
 * @see Intl.NumberFormat
 * @see https://developer.mozilla.org/pt-BR/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat
 */
export function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(Number(value || 0));
}

/**
 * Gera uma URL de imagem placeholder para produtos sem imagem definida.
 * 
 * @function getProductPlaceholder
 * @description Retorna uma URL de imagem do servico placehold.co com texto customizavel.
 *              Usada como fallback quando a API nao retorna imagem do produto.
 * 
 * @param {string} [text="Produto"] - Texto a ser exibido na imagem placeholder
 * @returns {string} URL completa da imagem placeholder
 * 
 * @example
 * getProductPlaceholder();              // URL com texto "Produto"
 * getProductPlaceholder("Licenca");    // URL com texto "Licenca"
 * getProductPlaceholder("VIP");         // URL com texto "VIP"
 */
export function getProductPlaceholder(text = "Produto") {
  return `https://placehold.co/600x420/F0EDE8/9CA3AF?text=${encodeURIComponent(text)}`;
}
