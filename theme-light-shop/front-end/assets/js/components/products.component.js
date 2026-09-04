import { APP_CONFIG } from "../main.js";
import { showTemporaryButtonState, escapeHtml } from "../services/dom.service.js";
import { formatCurrency, getProductPlaceholder } from "../services/format.service.js";

/**
 * Componente de Produtos - Gerencia a listagem, filtragem e paginação de produtos.
 * 
 * @class ProductsComponent
 * @description Renderiza cards de produtos com imagens, precos e botoes de adicionar ao carrinho.
 *              Suporta filtragem por categoria e paginacao. Inclui animacoes de entrada e feedback visual.
 * 
 * @author caBRAPI Team
 * @version 1.0.0
 * 
 * @module components/ProductsComponent
 * 
 * @example
 * import { ProductsComponent } from './components/products.component.js';
 * 
 * const products = new ProductsComponent({
 *     onAddToCart: (product) => cartService.add(product),
 *     onPageChange: (page) => loadProducts(page)
 * });
 */
export class ProductsComponent {
    /**
     * Cria o componente de produtos.
     * 
     * @constructor
     * @param {Object} deps - Dependencias do componente
     * @param {function(Object): void} deps.onAddToCart - Callback ao adicionar produto ao carrinho
     * @param {function(number): void} deps.onPageChange - Callback ao mudar de pagina na paginacao
     * 
     * @description Armazena as callbacks e inicializa o estado interno com arrays vazios.
     *              Configura event listeners para interacoes com produtos e paginacao.
     */
    constructor({ onAddToCart, onPageChange }) {
        /**
         * Container da lista de produtos.
         * @type {jQuery}
         */
        this.$list = $("#products-list");

        /**
         * Container da paginacao.
         * @type {jQuery}
         */
        this.$pagination = $("#products-pagination");

        /**
         * Callback para adicionar produto ao carrinho.
         * @type {function(Object): void}
         */
        this.onAddToCart = onAddToCart;

        /**
         * Callback para mudar pagina.
         * @type {function(number): void}
         */
        this.onPageChange = onPageChange;

        /**
         * Lista de produtos carregados.
         * @type {Array<Object>}
         */
        this.products = [];

        /**
         * Categoria atualmente selecionada para filtro.
         * @type {string}
         */
        this.activeCategory = "all";

        /**
         * Estado atual da paginacao.
         * @type {Object}
         * @property {number} page - Pagina atual
         * @property {number} totalPages - Total de paginas
         * @property {number} total - Total de produtos
         */
        this.pagination = { page: 1, totalPages: 1, total: 0 };

        // Configura event listeners
        this.#bindEvents();
    }

    /**
     * Vincula eventos de clique nos botoes de adicionar e paginacao.
     * @private
     * @method #bindEvents
     */
    #bindEvents() {
        $(document).on("click", ".product-add-btn", (event) => {
            const $button = $(event.currentTarget);
            if ($button.prop("disabled") || $button.hasClass("cursor-not-allowed")) return;

            const productId = String($button.data("id"));
            const product = this.products.find((item) => String(item.id) === productId);
            if (!product) return;

            const added = this.onAddToCart(product);
            if (added !== false) {
                $button.addClass("added");
                setTimeout(() => $button.removeClass("added"), 300);
                showTemporaryButtonState(
                    $button,
                    '<i class="fas fa-check mr-2"></i> Adicionado',
                    APP_CONFIG.BUTTON_FEEDBACK_MS
                );
            }
        });

        $(document).on("click", ".products-page-btn", (event) => {
            const targetPage = Number($(event.currentTarget).data("page"));
            if (!targetPage || targetPage === this.pagination.page) return;
            if (typeof this.onPageChange === "function") this.onPageChange(targetPage);
        });
    }

    /**
     * Remove qualquer lógica de detecção e força o preenchimento total.
     */
    #applySmartImageFit() {
        this.$list.find(".product-card-image").each((_, element) => {
            const $img = $(element);
            // Reforça o estilo via JS para garantir que o navegador aplique
            $img.css({
                "width": "100%",
                "height": "100%",
                "object-fit": "cover",
                "object-position": "center",
                "display": "block"
            });
        });
    }

    setProducts(data) {
        const products = Array.isArray(data?.products) ? data.products : [];
        this.pagination = {
            page: Number(data?.pagination?.page || 1),
            totalPages: Number(data?.pagination?.totalPages || 1),
            total: Number(data?.pagination?.total || products.length)
        };
        this.products = products.filter((item) => !item.disabled);
        this.#renderProducts();
        this.#renderPagination();
    }

    setActiveCategory(category) {
        this.activeCategory = String(category || "all");
        this.#renderProducts();
    }

    #getFilteredProducts() {
        if (this.activeCategory === "all") return this.products;
        return this.products.filter((product) =>
            (product.categories || []).some((cat) => String(cat.name) === this.activeCategory)
        );
    }

    #renderProducts() {
        const filtered = this.#getFilteredProducts();

        if (!filtered.length) {
            this.$list.html(`
                <div class="col-span-full text-center py-20 text-[#6b6560]">
                    <i class="fas fa-box-open text-5xl mb-4 block opacity-20"></i>
                    <p>Nenhum produto encontrado.</p>
                </div>
            `);
            return;
        }

        const cards = filtered.map((product, index) => {
            const imageSrc = escapeHtml(product.image || getProductPlaceholder(product.name));
            const stockNum = Number(product.stock);
            const hasStock = !Number.isNaN(stockNum) && stockNum > 0;
            const isDisabled = !hasStock;
            const delay = (index % 6) * 100;

            return `
                <article class="product-card group bg-white rounded-3xl border border-[#e8e4df] overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col h-full" style="animation-delay: ${delay}ms;">
                    <div class="product-card-image-frame relative overflow-hidden bg-[#f8f7f4]" style="aspect-ratio: 4/3; width: 100%;">
                        <img src="${imageSrc}" 
                             alt="${escapeHtml(product.name)}" 
                             class="product-card-image transition-transform duration-700 group-hover:scale-110" 
                             style="width: 100% !important; height: 100% !important; object-fit: cover !important; object-position: center !important; display: block !important;"
                        />
                        <div class="absolute inset-0 bg-gradient-to-t from-[#1a1714]/10 to-transparent pointer-events-none"></div>
                    </div>

                    <div class="p-5 flex flex-col flex-1">
                        <div class="flex-1">
                            <h3 class="font-bold text-[#1a1714] text-lg mb-1 line-clamp-2 leading-tight">
                                ${escapeHtml(product.name)}
                            </h3>
                            <p class="text-sm text-[#6b6560] mb-4 line-clamp-2 leading-relaxed">
                                ${escapeHtml(product.description || "Asset digital exclusivo.")}
                            </p>
                        </div>

                        <div class="mt-auto">
                            <div class="mb-4">
                                <span class="text-[10px] text-[#6b6560] font-bold uppercase tracking-widest">Valor</span>
                                <div class="text-2xl text-[#c8502a] font-black leading-none">
                                    ${formatCurrency(product.price)}
                                </div>
                            </div>

                            <button class="add-to-cart-btn product-add-btn w-full py-3.5 bg-[#1a1714] text-white font-bold rounded-2xl hover:bg-[#c8502a] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#1a1714]"
                                    ${isDisabled ? 'disabled aria-disabled="true"' : ''}
                                    data-id="${escapeHtml(product.id)}"
                                    data-stock="${escapeHtml(product.stock)}">
                                <i class="fas fa-shopping-bag text-sm"></i>
                                <span>${isDisabled ? "ESGOTADO" : "ADICIONAR"}</span>
                            </button>
                        </div>
                    </div>
                </article>
            `;
        });

        this.$list.html(`
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                ${cards.join("")}
            </div>
        `);

        this.#applySmartImageFit();
    }

    #renderPagination() {
        const { page: current, totalPages: total } = this.pagination;
        if (total <= 1) { this.$pagination.html(""); return; }

        let pagesHtml = "";
        for (let i = 1; i <= total; i++) {
            if (i === 1 || i === total || (i >= current - 1 && i <= current + 1)) {
                // No mobile, escondemos os números que não são a página atual para não quebrar a linha
                const mobileClass = i === current ? 'flex' : 'hidden md:flex';
                pagesHtml += `
                    <button class="products-page-btn w-10 h-10 md:w-12 md:h-12 ${mobileClass} items-center justify-center rounded-xl border-2 transition-all font-bold ${i === current ? 'bg-[#1a1714] border-[#1a1714] text-white active-page shadow-lg' : 'border-[#e8e4df] text-[#1a1714] hover:border-[#1a1714]'}" data-page="${i}">
                        ${i}
                    </button>
                `;
            } else if (i === current - 2 || i === current + 2) {
                pagesHtml += `<span class="text-[#e8e4df] hidden md:inline">...</span>`;
            }
        }

        this.$pagination.html(`
            <div class="flex items-center justify-between gap-2 mt-12 mb-8 p-3 md:p-6 bg-white rounded-2xl md:rounded-[2rem] border border-[#e8e4df] mx-2">
                <button class="products-page-btn flex items-center justify-center w-10 h-10 md:w-auto md:px-6 md:py-3 rounded-xl font-bold border-2 border-[#e8e4df] transition-all ${current <= 1 ? 'opacity-20 cursor-not-allowed' : 'text-[#1a1714] hover:bg-[#f8f7f4]'}" 
                        ${current <= 1 ? 'disabled' : ''} data-page="${current - 1}">
                    <i class="fas fa-chevron-left text-xs"></i>
                    <span class="hidden md:inline ml-2">Anterior</span>
                </button>

                <div class="flex items-center gap-1 md:gap-2">
                    ${pagesHtml}
                    <span class="md:hidden text-xs font-bold text-[#6b6560] ml-2">de ${total}</span>
                </div>

                <button class="products-page-btn flex items-center justify-center w-10 h-10 md:w-auto md:px-6 md:py-3 rounded-xl font-bold border-2 border-[#e8e4df] transition-all ${current >= total ? 'opacity-20 cursor-not-allowed' : 'text-[#1a1714] hover:bg-[#f8f7f4]'}" 
                        ${current >= total ? 'disabled' : ''} data-page="${current + 1}">
                    <span class="hidden md:inline mr-2">Próxima</span>
                    <i class="fas fa-chevron-right text-xs"></i>
                </button>
            </div>
        `);
    }

    /**
     * @param {Array<{id: string, qty: number, stock?: number}>} cartItems
     */
    updateButtonsStates(cartItems) {
        $(".product-add-btn").each((_, btn) => {
            const $btn = $(btn);
            const productId = $btn.data("id");
            const cartItem = cartItems.find((item) => String(item.id) === String(productId));

            const stockNum = Number($btn.data("stock"));
            const stock = cartItem ? cartItem.stock : (isNaN(stockNum) ? null : stockNum);
            const inCartQty = cartItem ? cartItem.qty : 0;
            const isDisabled = (stock !== null && stock <= 0) || (stock > 0 && inCartQty >= stock);

            if (isDisabled) {
                $btn.prop("disabled", true).attr("disabled", "disabled").addClass("opacity-50 cursor-not-allowed");
            } else {
                $btn.prop("disabled", false).removeAttr("disabled").removeClass("opacity-50 cursor-not-allowed");
            }
            $btn.find("span").text(isDisabled ? "ESGOTADO" : "ADICIONAR");
        });
    }

}