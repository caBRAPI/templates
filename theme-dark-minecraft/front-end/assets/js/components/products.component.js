import { APP_CONFIG } from "../main.js";
import { showTemporaryButtonState, escapeHtml } from "../services/dom.service.js";
import { formatCurrency, getProductPlaceholder } from "../services/format.service.js";

function parseMarkdown(text) {
    if (!text) return "";
    if (typeof marked !== "undefined") {
        return marked.parse(text);
    }
    let html = escapeHtml(text);
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/`(.*?)`/g, '<code style="background:#2a2a2a;padding:2px 6px;border-radius:4px;font-size:11px;">$1</code>');
    html = html.replace(/\n/g, '<br>');
    return html;
}

function hasMarkdownSyntax(text) {
    if (!text) return false;
    return /\*\*|\*|`|\n|#|\-|\[.*?\]\(.*?\)/.test(text);
}

export class ProductsComponent {
    constructor({ onAddToCart, onPageChange }) {
        this.$list = $("#products-list");
        this.$pagination = $("#products-pagination");
        this.onAddToCart = onAddToCart;
        this.onPageChange = onPageChange;
        this.products = [];
        this.activeCategory = "all";
        this.pagination = { page: 1, totalPages: 1, total: 0 };
        this.#bindEvents();
    }

    #bindEvents() {
        $(document).on("click", ".product-add-btn", (event) => {
            event.stopPropagation();
            const $button = $(event.currentTarget);
            if ($button.prop("disabled")) return;

            const productId = String($button.data("id"));
            const product = this.products.find((item) => String(item.id) === productId);
            if (!product) return;

            const added = this.onAddToCart(product);
            if (added !== false) {
                showTemporaryButtonState(
                    $button,
                    '<i class="fas fa-check" style="margin-right:6px;"></i> Adicionado',
                    APP_CONFIG.BUTTON_FEEDBACK_MS
                );
            }
        });

        $(document).on("click", ".products-page-btn", (event) => {
            const targetPage = Number($(event.currentTarget).data("page"));
            if (!targetPage || targetPage === this.pagination.page) return;
            if (typeof this.onPageChange === "function") this.onPageChange(targetPage);
        });

        $(document).on("click", ".product-card", (event) => {
            if ($(event.target).closest(".product-add-btn").length) return;
            if ($(event.target).closest(".product-desc-btn").length) return;
            const $card = $(event.currentTarget);
            const productId = $card.data("id");
            const product = this.products.find((item) => String(item.id) === String(productId));
            if (product) {
                this.#showProductModal(product);
            }
        });

        $(document).on("click", ".product-desc-btn", (event) => {
            event.stopPropagation();
            const $btn = $(event.currentTarget);
            const productId = String($btn.data("id"));
            const product = this.products.find((item) => String(item.id) === productId);
            if (product) {
                this.#showDescModal(product);
            }
        });
    }

    #showDescModal(product) {
        const rawDesc = product.description || "";
        const hasMd = hasMarkdownSyntax(rawDesc);
        const descHtml = hasMd ? parseMarkdown(rawDesc) : escapeHtml(rawDesc);

        const mdStyles = `
            .md-content h1 { font-family:'Press Start 2P',monospace; font-size:14px; color:#3ddc84; margin:16px 0 8px 0; }
            .md-content h2 { font-family:'Press Start 2P',monospace; font-size:12px; color:#3ddc84; margin:14px 0 6px 0; }
            .md-content h3 { font-family:'Press Start 2P',monospace; font-size:10px; color:#3ddc84; margin:12px 0 4px 0; }
            .md-content p { margin:8px 0; line-height:1.8; }
            .md-content strong { color:#e8e8e8; }
            .md-content em { color:#8b8b8b; }
            .md-content code { background:#1a1a1a; padding:2px 6px; border:1px solid #2a2a2a; font-size:11px; border-radius:4px; }
            .md-content pre { background:#1a1a1a; border:2px solid #2a2a2a; padding:12px; border-radius:8px; overflow-x:auto; margin:8px 0; }
            .md-content pre code { background:transparent; border:none; padding:0; }
            .md-content ul { list-style:disc; padding-left:20px; margin:8px 0; }
            .md-content ol { list-style:decimal; padding-left:20px; margin:8px 0; }
            .md-content li { margin:4px 0; line-height:1.7; }
            .md-content a { color:#3ddc84; text-decoration:underline; }
            .md-content blockquote { border-left:4px solid #3ddc84; padding-left:12px; margin:8px 0; color:#8b8b8b; }
            .md-content hr { border:none; border-top:2px solid #2a2a2a; margin:16px 0; }
            .md-content table { border-collapse:collapse; width:100%; margin:8px 0; }
            .md-content th, .md-content td { border:2px solid #2a2a2a; padding:8px 12px; text-align:left; }
            .md-content th { background:#1a1a1a; font-family:'Press Start 2P',monospace; font-size:8px; }
        `;

        const modalHtml = `
            <div id="desc-modal" style="position:fixed;inset:0;z-index:600;background:rgba(0,0,0,0.85);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:16px;" onclick="if(event.target===this)this.remove()">
                <div style="background:#121212;border:4px solid #2a2a2a;max-width:500px;width:100%;max-height:80vh;overflow-y:auto;clip-path:polygon(0 8px,8px 8px,8px 0,calc(100% - 8px) 0,calc(100% - 8px) 8px,100% 8px,100% calc(100% - 8px),calc(100% - 8px) calc(100% - 8px),calc(100% - 8px) 100%,8px 100%,8px calc(100% - 8px),0 calc(100% - 8px));">
                    <style>${mdStyles}</style>
                    <div style="padding:24px;">
                        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
                            <h3 style="font-family:'Press Start 2P',monospace;font-size:12px;color:#e8e8e8;">Descricao</h3>
                            <button onclick="document.getElementById('desc-modal').remove()" style="width:32px;height:32px;background:#1a1a1a;border:2px solid #3a3a3a;color:#e8e8e8;cursor:pointer;display:flex;align-items:center;justify-content:center;clip-path:polygon(0 2px,2px 2px,2px 0,calc(100% - 2px) 0,calc(100% - 2px) 2px,100% 2px,100% calc(100% - 2px),calc(100% - 2px) calc(100% - 2px),calc(100% - 2px) 100%,2px 100%,2px calc(100% - 2px),0 calc(100% - 2px));">
                                <i class="fas fa-xmark" style="font-size:10px;"></i>
                            </button>
                        </div>
                        <div class="md-content" style="font-size:13px;color:#8b8b8b;line-height:1.8;">
                            ${descHtml}
                        </div>
                    </div>
                </div>
            </div>
        `;
        $("body").append(modalHtml);
    }

    #showProductModal(product) {
        const imageSrc = escapeHtml(product.image || getProductPlaceholder(product.name));
        const stockNum = Number(product.stock);
        const hasStock = !Number.isNaN(stockNum) && stockNum > 0;

        const modalHtml = `
            <div id="product-modal" style="position:fixed;inset:0;z-index:600;background:rgba(0,0,0,0.85);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:16px;" onclick="if(event.target===this)this.remove()">
                <div style="background:#121212;border:4px solid #2a2a2a;max-width:600px;width:100%;max-height:90vh;overflow-y:auto;clip-path:polygon(0 8px,8px 8px,8px 0,calc(100% - 8px) 0,calc(100% - 8px) 8px,100% 8px,100% calc(100% - 8px),calc(100% - 8px) calc(100% - 8px),calc(100% - 8px) 100%,8px 100%,8px calc(100% - 8px),0 calc(100% - 8px));">
                    <div style="position:relative;">
                        <img src="${imageSrc}" style="width:100%;height:280px;object-fit:cover;display:block;" />
                        <button onclick="document.getElementById('product-modal').remove()" style="position:absolute;top:12px;right:12px;width:40px;height:40px;background:rgba(0,0,0,0.7);border:3px solid #3a3a3a;color:#e8e8e8;cursor:pointer;display:flex;align-items:center;justify-content:center;clip-path:polygon(0 3px,3px 3px,3px 0,calc(100% - 3px) 0,calc(100% - 3px) 3px,100% 3px,100% calc(100% - 3px),calc(100% - 3px) calc(100% - 3px),calc(100% - 3px) 100%,3px 100%,3px calc(100% - 3px),0 calc(100% - 3px));">
                            <i class="fas fa-xmark"></i>
                        </button>
                    </div>
                    <div style="padding:24px;">
                        <h2 style="font-family:'Press Start 2P',monospace;font-size:14px;color:#e8e8e8;margin-bottom:16px;line-height:1.8;">${escapeHtml(product.name)}</h2>
                        ${hasStock ? `<p style="font-family:'Press Start 2P',monospace;font-size:8px;color:#3ddc84;margin-bottom:8px;"><i class="fas fa-check-circle" style="margin-right:6px;"></i>Em estoque (${stockNum} disponiveis)</p>` : `<p style="font-family:'Press Start 2P',monospace;font-size:8px;color:#ef4444;margin-bottom:8px;"><i class="fas fa-times-circle" style="margin-right:6px;"></i>ESGOTADO</p>`}
                        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:20px;">
                            <span style="font-family:'Press Start 2P',monospace;font-size:16px;color:#3ddc84;">${formatCurrency(product.price)}</span>
                            <button class="product-add-btn" data-id="${escapeHtml(product.id)}" data-stock="${escapeHtml(product.stock)}" ${!hasStock ? 'disabled' : ''} style="padding:14px 24px;background:${hasStock ? '#3ddc84' : '#2a2a2a'};color:${hasStock ? '#0d0d0d' : '#5a5a5a'};border:none;font-family:'Press Start 2P',monospace;font-size:10px;cursor:${hasStock ? 'pointer' : 'not-allowed'};clip-path:polygon(0 4px,4px 4px,4px 0,calc(100% - 4px) 0,calc(100% - 4px) 4px,100% 4px,100% calc(100% - 4px),calc(100% - 4px) calc(100% - 4px),calc(100% - 4px) 100%,4px 100%,4px calc(100% - 4px),0 calc(100% - 4px));">
                                <i class="fas fa-shopping-bag" style="margin-right:8px;"></i>${hasStock ? "ADICIONAR" : "ESGOTADO"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        $("body").append(modalHtml);
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
                <div class="empty-state">
                    <i class="fas fa-box-open"></i>
                    <p>Nenhum produto encontrado</p>
                </div>
            `);
            return;
        }

        const cards = filtered.map((product) => {
            const imageSrc = escapeHtml(product.image || getProductPlaceholder(product.name));
            const stockNum = Number(product.stock);
            const hasStock = !Number.isNaN(stockNum) && stockNum > 0;
            const isDisabled = !hasStock;
            const hasDesc = Boolean(product.description);

            return `
                <article class="product-card" data-id="${escapeHtml(product.id)}">
                    <div class="product-card-image">
                        <img src="${imageSrc}" alt="${escapeHtml(product.name)}" />
                        ${!hasStock ? '<div class="product-card-badge">ESGOTADO</div>' : ''}
                    </div>
                    <div class="product-card-body">
                        <h3 class="product-card-title">${escapeHtml(product.name)}</h3>
                        <div class="product-card-footer">
                            <span class="product-card-price">${formatCurrency(product.price)}</span>
                            <div style="display:flex;gap:6px;">
                                ${hasDesc ? `<button class="product-desc-btn" data-id="${escapeHtml(product.id)}" style="width:36px;height:36px;background:#1a1a1a;border:2px solid #2a2a2a;color:#8b8b8b;cursor:pointer;display:flex;align-items:center;justify-content:center;clip-path:polygon(0 2px,2px 2px,2px 0,calc(100% - 2px) 0,calc(100% - 2px) 2px,100% 2px,100% calc(100% - 2px),calc(100% - 2px) calc(100% - 2px),calc(100% - 2px) 100%,2px 100%,2px calc(100% - 2px),0 calc(100% - 2px));" title="Ver descricao"><i class="fas fa-eye" style="font-size:12px;"></i></button>` : ''}
                                <button class="product-add-btn ${isDisabled ? 'disabled' : ''}" ${isDisabled ? 'disabled' : ''} data-id="${escapeHtml(product.id)}" data-stock="${escapeHtml(product.stock)}">
                                    <i class="fas fa-shopping-bag" style="font-size:12px;"></i>
                                    <span>${isDisabled ? "ESGOTADO" : "ADICIONAR"}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </article>
            `;
        });

        this.$list.html(cards.join(""));
    }

    #renderPagination() {
        const { page: current, totalPages: total } = this.pagination;
        if (total <= 1) { this.$pagination.html(""); return; }

        let pagesHtml = "";
        for (let i = 1; i <= total; i++) {
            if (i === 1 || i === total || (i >= current - 1 && i <= current + 1)) {
                const isActive = i === current;
                pagesHtml += `
                    <button class="products-page-btn ${isActive ? 'active' : ''}" data-page="${i}">
                        ${i}
                    </button>
                `;
            } else if (i === current - 2 || i === current + 2) {
                pagesHtml += `<span style="color:#3a3a3a;">...</span>`;
            }
        }

        this.$pagination.html(`
            <div class="products-pagination-inner">
                <button class="products-page-btn" data-page="${current - 1}" ${current <= 1 ? 'disabled' : ''}>
                    <i class="fas fa-chevron-left"></i>
                </button>
                <div class="products-pagination-pages">
                    ${pagesHtml}
                </div>
                <button class="products-page-btn" data-page="${current + 1}" ${current >= total ? 'disabled' : ''}>
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `);
    }

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
                $btn.prop("disabled", true).addClass("disabled");
                $btn.find("span").text("ESGOTADO");
            } else {
                $btn.prop("disabled", false).removeClass("disabled");
                $btn.find("span").text("ADICIONAR");
            }
        });
    }
}
