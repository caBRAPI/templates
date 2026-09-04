import { formatCurrency } from "../services/format.service.js";
import { escapeHtml } from "../services/dom.service.js";

/**
 * Componente de Checkout - Responsável por toda a interface e lógica do formulário de checkout.
 * 
 * @class CheckoutComponent
 * @description Gerencia a renderização dos itens do carrinho, validação de formulários,
 *              aplicação de cupons, mensagens de feedback (toast) e submissão do pedido.
 * 
 * @author caBRAPI Team
 * @version 1.0.0
 * 
 * @module components/CheckoutComponent
 * 
 * @example
 * import { CheckoutComponent } from './components/checkout.component.js';
 * 
 * const checkout = new CheckoutComponent({
 *     onRemoveItem: (id) => cartService.remove(id),
 *     onQuantityChange: (id, delta) => cartService.updateQuantity(id, delta),
 *     onApplyCoupon: async () => await validateCoupon(),
 *     onSubmit: async () => await processPayment(),
 *     onPaymentMethodChange: (method) => updateButton(method)
 * });
 */
export class CheckoutComponent {
    /**
     * Cria uma nova instância do componente de checkout.
     * 
     * @constructor
     * @param {Object} handlers - Callbacks para tratar eventos do checkout
     * @param {function(string): void} handlers.onRemoveItem - Callback ao remover item do carrinho
     * @param {function(string, number): void} handlers.onQuantityChange - Callback ao alterar quantidade
     * @param {function(): Promise<void>|void} handlers.onApplyCoupon - Callback para aplicar cupom
     * @param {function(): Promise<void>|void} handlers.onSubmit - Callback para submeter o formulário
     * @param {function(string): void} handlers.onPaymentMethodChange - Callback ao mudar método de pagamento
     * 
     * @description Inicializa o componente, vincula elementos DOM e configura event listeners.
     *              Os handlers são fornecidos pela aplicação principal para manter o desacoplamento.
     */
    constructor(handlers) {
        /**
         * Callbacks externos para tratamento de eventos.
         * @type {Object}
         * @private
         */
        this.handlers = handlers;

        /**
         * Container dos itens do carrinho.
         * @type {jQuery}
         */
        this.$items = $("#checkout-items");

        /**
         * Elemento de exibicao do total.
         * @type {jQuery}
         */
        this.$total = $("#checkout-total");

        /**
         * Elemento do toast de mensagens.
         * @type {jQuery}
         */
        this.$toast = $("#checkout-toast");

        /**
         * Status de aplicacao do cupom.
         * @type {jQuery}
         */
        this.$couponStatus = $("#checkout-coupon-status");

        /**
         * Input do campo cupom.
         * @type {jQuery}
         */
        this.$couponInput = $("#checkout-coupon");

        /**
         * Input do campo CPF.
         * @type {jQuery}
         */
        this.$cpfInput = $("#checkout-cpf");

        /**
         * Input do campo telefone.
         * @type {jQuery}
         */
        this.$phoneInput = $("#checkout-phone");

        /**
         * Botao de submissao do formulario.
         * @type {jQuery}
         */
        this.$submitButton = $("#checkout-submit");

        /**
         * Botao de aplicar cupom.
         * @type {jQuery}
         */
        this.$couponButton = $("#checkout-apply-coupon");

        /**
         * Mapeamento de elementos de erro por campo.
         * @type {Object.<string, jQuery>}
         */
        this.$fieldErrors = {
            name: $("#checkout-name-error"),
            cpf: $("#checkout-cpf-error"),
            email: $("#checkout-email-error"),
            nickname: $("#checkout-nickname-error")
        };

        // Vincula eventos dos elementos DOM
        this.#bindEvents();
    }

    /**
     * Vincula todos os event listeners necessarios.
     * @private
     * @method #bindEvents
     * @description Configura listeners para:
     *              - Remocao de itens do carrinho
     *              - Alteracao de quantidade
     *              - Aplicacao de cupom
     *              - Formatacao de CPF e telefone
     *              - Mudanca de metodo de pagamento
     *              - Submissao do formulario
     */
    #bindEvents() {
        this.$items.on("click", ".checkout-remove-btn", (event) => {
            const id = String($(event.currentTarget).data("id"));
            this.handlers.onRemoveItem(id);
        });

        this.$items.on("click", ".checkout-qty-btn", (event) => {
            const $button = $(event.currentTarget);
            const id = String($button.data("id"));
            const delta = Number($button.data("delta"));
            this.handlers.onQuantityChange(id, delta);
        });

        this.$couponButton.on("click", async () => {
            await this.handlers.onApplyCoupon();
        });

        this.$couponInput.on("input", () => {
            this.setCouponStatus(null);
        });

        this.$phoneInput.on("input", (event) => {
            const $input = $(event.currentTarget);
            const formatted = this.#formatPhone($input.val());
            if ($input.val() !== formatted) {
                $input.val(formatted);
            }
        });

        this.$cpfInput.on("input", (event) => {
            const $input = $(event.currentTarget);
            const formatted = this.#formatCpf($input.val());
            if ($input.val() !== formatted) {
                $input.val(formatted);
            }
        });

        $("#checkout-form").on("submit", async (event) => {
            event.preventDefault();
            await this.handlers.onSubmit();
        });
    }

    /**
     * @param {Array<{id: string, name: string, image: string | null, price: number, qty: number}>} items
     */
    renderItems(items) {
        if (!items.length) {
            this.$items.html('<p class="text-center py-8 text-[#6b6560]">Carrinho vazio</p>');
            return;
        }

        const html = items.map((item) => {
            return `
                <div class="flex items-center gap-2 p-2 bg-[#f8f7f4] rounded-xl">
                    <img src="${escapeHtml(item.image || "https://placehold.co/64x64/F0EDE8/9CA3AF")}" alt="${escapeHtml(item.name)}" class="w-12 h-12 rounded-lg object-cover shrink-0" />
                    <div class="flex-1 min-w-0">
                        <p class="font-medium text-xs text-[#1a1714] truncate">${escapeHtml(item.name)}</p>
                        <p class="text-[#6b6560] text-xs">${formatCurrency(item.price)}</p>
                    </div>
                    <div class="flex items-center gap-1 shrink-0">
                        <button class="checkout-qty-btn w-7 h-7 rounded-lg bg-white border border-[#e8e4df] text-[#1a1714] hover:bg-[#f8f7f4] disabled:opacity-50 disabled:cursor-not-allowed" ${Number(item.qty) <= 1 ? 'disabled' : ''} data-id="${escapeHtml(item.id)}" data-delta="-1">
                            <i class="fas fa-minus text-xs"></i>
                        </button>
                        <span class="w-6 text-center text-sm font-bold">${Number(item.qty)}</span>
                        <button class="checkout-qty-btn w-7 h-7 rounded-lg bg-white border border-[#e8e4df] text-[#1a1714] hover:bg-[#f8f7f4] disabled:opacity-50 disabled:cursor-not-allowed" ${item.stock !== null && Number(item.stock) > 0 && Number(item.qty) >= Number(item.stock) ? 'disabled' : ''} data-id="${escapeHtml(item.id)}" data-delta="1">
                            <i class="fas fa-plus text-xs"></i>
                        </button>
                    </div>
                    <button class="checkout-remove-btn text-red-500 hover:text-red-700 p-1 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed" data-id="${escapeHtml(item.id)}">
                        <i class="fas fa-trash text-xs"></i>
                    </button>
                </div>
            `;
        }).join("");

        this.$items.html(html);
    }

    /**
     * @param {number} value
     */
    setTotal(value) {
        this.$total.text(formatCurrency(value));
    }

/**
     * @returns {{
     *   name: string,
     *   nickname: string,
     *   email: string,
     *   phone: string,
     *   cpf: string,
     *   note: string,
     *   coupon: string,
     *   paymentMethod: string
     * }}
     */
    getFormData() {
        return {
            name: String($("#checkout-name").val() || "").trim(),
            nickname: String($("#checkout-nickname").val() || "").trim(),
            email: String($("#checkout-email").val() || "").trim(),
            phone: String($("#checkout-phone").val() || "").replace(/\D/g, ""),
            cpf: String($("#checkout-cpf").val() || "").replace(/\D/g, ""),
            note: String($("#checkout-note").val() || "").trim(),
            coupon: String($("#checkout-coupon").val() || "").trim(),
            paymentMethod: String($('input[name="payment_method"]:checked').val() || "PIX")
        };
    }

    /**
     * @param {"name"|"email"|"nickname"} field
     * @param {string} text
     */
    setFieldError(field, text) {
        const $error = this.$fieldErrors[field];
        if (!$error || !$error.length) return;

        if (!text) {
            $error.addClass("hidden").text("");
            return;
        }

        $error.removeClass("hidden").text(text);
    }

    clearFieldErrors() {
        Object.keys(this.$fieldErrors).forEach((field) => {
            this.setFieldError(field, "");
        });
    }

    /**
     * @param {string|number|undefined|null} value
     * @returns {string}
     */
    #formatCpf(value) {
        const digits = String(value || "").replace(/\D/g, "").slice(0, 11);
        const parts = [];

        if (digits.length > 0) parts.push(digits.slice(0, 3));
        if (digits.length > 3) parts.push(digits.slice(3, 6));
        if (digits.length > 6) parts.push(digits.slice(6, 9));

        let formatted = parts.join(".");
        if (digits.length > 9) {
            formatted += `-${digits.slice(9, 11)}`;
        }

        return formatted;
    }

    /**
     * @param {string|number|undefined|null} value
     * @returns {string}
     */
    #formatPhone(value) {
        const digits = String(value || "").replace(/\D/g, "").slice(0, 11);
        if (digits.length === 0) return "";
        if (digits.length <= 2) return `(${digits}`;
        if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
    }

    /**
     * @param {"PIX"|"CARD"|"BOLETO"|"SALDO"} method
     */
    setSubmitLabel(method) {
        const labels = {
            PIX: '<i class="fas fa-qrcode mr-2"></i> Pagar com PIX',
            CARD: '<i class="fas fa-credit-card mr-2"></i> Pagar com Cartão',
            BOLETO: '<i class="fas fa-barcode mr-2"></i> Pagar com Boleto',
            SALDO: '<i class="fas fa-wallet mr-2"></i> Pagar com Saldo MP',
        };
        this.$submitButton.html(labels[method] || labels.PIX);
    }

    /**
     * @param {boolean} loading
     * @param {"PIX"|"CARD"|"BOLETO"|"SALDO"} method
     */
    setSubmitLoading(loading, method) {
        if (loading) {
            this.$submitButton.prop("disabled", true).html('<i class="fas fa-spinner fa-spin mr-2"></i> Processando...');
            return;
        }

        this.$submitButton.prop("disabled", false);
        this.setSubmitLabel(method);
    }

    /**
     * @param {boolean} loading
     */
    setCouponLoading(loading) {
        if (loading) {
            this.$couponButton.prop("disabled", true).html('<i class="fas fa-spinner fa-spin mr-2"></i> Validando...');
            return;
        }

        this.$couponButton.prop("disabled", false).html('<i class="fas fa-ticket mr-2"></i> Aplicar');
    }

    /**
     * @param {"error"|"success"} type
     * @param {string} text
     */
    showMessage(type, text) {
        if (this.messageTimer) {
            clearTimeout(this.messageTimer);
        }

        const bgColor = type === "success" ? "#22c55e" : "#ef4444";
        const textColor = "#ffffff";

        this.$toast
            .css({ backgroundColor: bgColor, color: textColor })
            .text(text)
            .removeClass("opacity-0", "pointer-events-none", "-translate-y-4")
            .addClass("opacity-100", "translate-y-0");

        this.messageTimer = setTimeout(() => {
            this.hideMessage();
        }, 3500);
    }

    hideMessage() {
        if (this.messageTimer) {
            clearTimeout(this.messageTimer);
            this.messageTimer = null;
        }

        this.$toast
            .addClass("opacity-0", "-translate-y-4")
            .removeClass("opacity-100", "translate-y-0");
    }

    hideAllMessages() {
        this.hideMessage();
        this.clearFieldErrors();
    }

    /**
     * @param {{type: "success"|"error", text: string} | null} state
     */
    setCouponStatus(state) {
        if (!state) {
            this.$couponStatus.addClass("hidden").text("").removeClass("text-green-700 text-red-600");
            return;
        }

        this.$couponStatus
            .removeClass("hidden text-green-700 text-red-600")
            .addClass(state.type === "success" ? "text-green-700" : "text-red-600")
            .text(state.text);
    }

    resetForm() {
        const form = $("#checkout-form")[0];
        if (form) form.reset();
        this.setSubmitLabel("PIX");
        this.setCouponStatus(null);
    }
}
