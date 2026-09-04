import { APP_CONFIG } from "../main.js";

/**
 * Servico de Persistencia do Carrinho - Gerencia o estado do carrinho de compras.
 * 
 * @class CartStorageService
 * @description Responsavel por armazenar, recuperar e manipular os itens do carrinho
 *              usando localStorage do navegador. Implementa cache em memoria para
 *              performance e controle de estoque.
 * 
 * @author caBRAPI Team
 * @version 1.0.0
 * 
 * @module services/CartStorageService
 * 
 * @example
 * import { CartStorageService } from './services/cart-storage.service.js';
 * 
 * const cart = new CartStorageService();
 * cart.addProduct({ id: 1, name: 'Produto', price: 99.90 });
 * const items = cart.getItems();
 * const total = cart.getTotalPrice();
 */
export class CartStorageService {
  /**
   * Cache em memoria dos itens do carrinho.
   * Evita leitura repetida do localStorage.
   * @type {Array<Object>|null}
   * @private
   */
  #cache = null;

  /**
   * Recupera todos os itens do carrinho do localStorage.
   * 
   * @method getItems
   * @description Retorna a lista de itens armazenados. Utiliza cache em memoria
   *              para evitar leituras repetidas. Faz parse seguro do JSON.
   * 
   * @returns {Array<{id: string, name: string, image: string|null, price: number, qty: number, stock?: number}>}
   *          Array de itens do carrinho com propriedades: id, name, image, price, qty, stock (opcional)
   * 
   * @example
   * const items = cart.getItems();
   * // Retorna: [{id: "1", name: "Licenca VIP", image: "url...", price: 99.90, qty: 1}]
   */
  getItems() {
    if (this.#cache) return this.#cache;

    try {
      const raw = localStorage.getItem(APP_CONFIG.CART_STORAGE_KEY);
      this.#cache = raw ? JSON.parse(raw) : [];
    } catch {
      this.#cache = [];
    }

    return this.#cache;
  }

  /**
   * Salva os itens no localStorage e atualiza o cache.
   * 
   * @method #save
   * @private
   * @description Serializa o array de itens para JSON e armazena no localStorage.
   * 
   * @param {Array<unknown>} nextItems - Lista de itens a ser salva
   */
  #save(nextItems) {
    this.#cache = Array.isArray(nextItems) ? nextItems : [];
    localStorage.setItem(APP_CONFIG.CART_STORAGE_KEY, JSON.stringify(this.#cache));
  }

  /**
   * Adiciona um produto ao carrinho ou incrementa a quantidade.
   * 
   * @method addProduct
   * @description Verifica se o produto ja existe no carrinho. Se existir, incrementa
   *              a quantidade (respeitando o limite de estoque). Se nao existir,
   *              adiciona como novo item.
   * 
   * @param {Object} product - Produto a ser adicionado
   * @param {string|number} product.id - ID unico do produto
   * @param {string} product.name - Nome do produto
   * @param {string|null} product.image - URL da imagem do produto
   * @param {number} product.price - Preco unitario
   * @param {number|null} product.stock - Quantidade em estoque (null = ilimitado)
   * 
   * @returns {Array<Object>} Lista atualizada de itens
   * 
   * @example
   * cart.addProduct({ id: 1, name: 'VIP', price: 99.90, stock: 10 });
   */
  addProduct(product) {
    const items = this.getItems();
    const id = String(product.id);
    const found = items.find((item) => String(item.id) === id);
    const stock = product.stock === null || product.stock === undefined ? null : Number(product.stock);

    // Verifica se produto esta fora de estoque
    if (stock !== null && stock <= 0) {
      return items;
    }

    if (found) {
      // Produto ja existe - incrementa quantidade se houver estoque
      const foundStock = found.stock === null || found.stock === undefined ? null : Number(found.stock);
      if (foundStock !== null && found.qty >= foundStock) {
        return items; // Limite de estoque atingido
      }
      found.qty += 1;
    } else {
      // Novo produto - adiciona ao array
      items.push({
        id,
        name: String(product.name || "Produto"),
        image: product.image || null,
        price: Number(product.price || 0),
        qty: 1,
        stock: stock
      });
    }

    this.#save(items);
    return items;
  }

  /**
   * Remove um produto do carrinho.
   * 
   * @method removeProduct
   * @description Filtra o array de itens removendo o produto com o ID especificado.
   * 
   * @param {string|number} productId - ID do produto a ser removido
   * @returns {Array<Object>} Lista atualizada de itens
   * 
   * @example
   * cart.removeProduct(1);
   */
  removeProduct(productId) {
    const id = String(productId);
    const items = this.getItems().filter((item) => String(item.id) !== id);
    this.#save(items);
    return items;
  }

  /**
   * Altera a quantidade de um produto no carrinho.
   * 
   * @method changeQuantity
   * @description Incrementa (delta > 0) ou decrementa (delta < 0) a quantidade.
   *              Se a quantidade atingir zero, remove o produto. Verifica estoque.
   * 
   * @param {string|number} productId - ID do produto
   * @param {number} delta - Variação de quantidade (+1 ou -1)
   * @returns {Array<Object>} Lista atualizada de itens
   * 
   * @example
   * cart.changeQuantity(1, 1);  // Adiciona 1
   * cart.changeQuantity(1, -1); // Remove 1
   */
  changeQuantity(productId, delta) {
    const id = String(productId);
    const items = this.getItems();
    const found = items.find((item) => String(item.id) === id);

    if (!found) {
      return items;
    }

    const stock = found.stock === null || found.stock === undefined ? null : Number(found.stock);

    // Verifica limite de estoque ao aumentar
    if (delta > 0 && stock !== null && found.qty >= stock) {
      return items;
    }

    found.qty += delta;
    
    // Remove produto se quantidade for zero ou negativa
    if (found.qty <= 0) {
      return this.removeProduct(productId);
    }
    
    const filtered = items.filter((item) => item.qty > 0);
    this.#save(filtered);
    return filtered;
  }

  /**
   * Esvazia completamente o carrinho.
   * 
   * @method clear
   * @description Remove todos os itens do carrinho, limpando o localStorage.
   * 
   * @example
   * cart.clear();
   */
  clear() {
    this.#save([]);
  }

  /**
   * Calcula a quantidade total de itens no carrinho.
   * 
   * @method getTotalItems
   * @description Soma a quantidade (qty) de todos os itens.
   * 
   * @returns {number} Total de itens (soma das quantidades)
   * 
   * @example
   * const total = cart.getTotalItems(); // ex: 5
   */
  getTotalItems() {
    return this.getItems().reduce((sum, item) => sum + Number(item.qty || 0), 0);
  }

  /**
   * Calcula o valor total do carrinho.
   * 
   * @method getTotalPrice
   * @description Multiplica preco por quantidade de cada item e soma o total.
   * 
   * @returns {number} Valor total em centavos (ex: 9990 = R$ 99,90)
   * 
   * @example
   * const total = cart.getTotalPrice();
   */
  getTotalPrice() {
    return this.getItems().reduce((sum, item) => {
      return sum + Number(item.price || 0) * Number(item.qty || 0);
    }, 0);
  }
}
