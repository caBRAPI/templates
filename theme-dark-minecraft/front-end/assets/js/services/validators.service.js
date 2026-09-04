/**
 * Servico de Validacao - Fornece funcoes para validar dados de entrada do formulario.
 * 
 * @module services/validators
 * @description Utilitario para validacao de campos do checkout como nome, email, CPF e nickname.
 *              As validacoes sao realizadas tanto no cliente quanto no servidor por seguranca.
 * 
 * @author caBRAPI Team
 * @version 1.0.0
 */

/**
 * Valida o nome completo do cliente.
 * 
 * @function isValidName
 * @description Verifica se o nome tem pelo menos 3 caracteres apos trim.
 *              Nomes invalidos incluem strings vazias, apenas espacos ou menos de 3 caracteres.
 * 
 * @param {string} value - Nome a ser validado
 * @returns {boolean} True se o nome for valido (>= 3 caracteres), false caso contrario
 * 
 * @example
 * isValidName("João Silva"); // true
 * isValidName("Jo");         // false
 * isValidName("   ");        // false
 */
export function isValidName(value) {
  return String(value || "").trim().length >= 3;
}

/**
 * Valida o nickname/apelido do cliente.
 * 
 * @function isValidNickname
 * @description Verifica se o apelido tem entre 4 e 32 caracteres.
 *              O campo e opcional, entao retorna true se vazio.
 * 
 * @param {string} value - Nickname a ser validado
 * @returns {boolean} True se o nickname for valido ou vazio, false caso contrario
 * 
 * @example
 * isValidNickname("joao123");     // true
 * isValidNickname("abc");         // false
 * isValidNickname("");            // true (opcional)
 */
export function isValidNickname(value) {
  const nickname = String(value || "").trim();
  if (!nickname) return true;
  return nickname.length >= 4 && nickname.length <= 32;
}

/**
 * Valida o CPF do cliente.
 * 
 * @function isValidCpf
 * @description Verifica se o CPF possui exatamente 11 digitos numericos.
 *              Nao valida digitos verificadores, apenas o formato.
 * 
 * @param {string} value - CPF a ser validado (pode conter mascara)
 * @returns {boolean} True se o CPF tiver 11 digitos, false caso contrario
 * 
 * @example
 * isValidCpf("12345678901");      // true
 * isValidCpf("123.456.789-01");  // true
 * isValidCpf("123");              // false
 */
export function isValidCpf(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.length === 11;
}

/**
 * Valida o endereco de e-mail do cliente.
 * 
 * @function isValidEmail
 * @description Verifica se o e-mail possui formato valido (texto@texto.texto).
 *              Requerido e obrigatorio para entrega digital.
 * 
 * @param {string} value - E-mail a ser validado
 * @returns {boolean} True se o e-mail for valido, false caso contrario
 * 
 * @example
 * isValidEmail("cliente@email.com");    // true
 * isValidEmail("invalido");             // false
 * isValidEmail("");                     // false
 */
export function isValidEmail(value) {
  const email = String(value || "").trim();
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length >= 12;
}

/**
 * Verifica se o carrinho possui itens.
 * 
 * @function hasCartItems
 * @description Verifica se o array de itens do carrinho nao esta vazio.
 *              Usado para permitir/submeter o checkout apenas com itens.
 * 
 * @param {Array<unknown>} items - Lista de itens do carrinho
 * @returns {boolean} True se existir pelo menos 1 item, false se vazio
 * 
 * @example
 * hasCartItems([{id: 1}, {id: 2}]);  // true
 * hasCartItems([]);                   // false
 */
export function hasCartItems(items) {
  return Array.isArray(items) && items.length > 0;
}
