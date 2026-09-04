import { formatCurrency } from "../services/format.service.js";
import { escapeHtml } from "../services/dom.service.js";

export class CheckoutComponent {
    constructor(handlers) {
        this.handlers = handlers;
        this.$items = $("#checkout-items");
        this.$total = $("#checkout-total");
        this.$toast = $("#checkout-toast");
        this.$couponStatus = $("#checkout-coupon-status");
        this.$couponInput = $("#checkout-coupon");
        this.$cpfInput = $("#checkout-cpf");
        this.$phoneInput = $("#checkout-phone");
        this.$submitButton = $("#checkout-submit");
        this.$couponButton = $("#checkout-apply-coupon");
        this.$fieldErrors = {
            name: $("#checkout-name-error"),
            cpf: $("#checkout-cpf-error"),
            email: $("#checkout-email-error"),
            nickname: $("#checkout-nickname-error")
        };
        this.#bindEvents();
    }

    #bindEvents() {
        this.$items.on("click", ".checkout-remove-btn", (event) => {
            event.stopPropagation();
            const id = String($(event.currentTarget).data("id"));
            this.handlers.onRemoveItem(id);
        });

        this.$items.on("click", ".checkout-qty-btn", (event) => {
            event.stopPropagation();
            const $button = $(event.currentTarget);
            if ($button.prop("disabled")) return;
            const id = String($button.data("id"));
            const delta = Number($button.data("delta"));
            this.handlers.onQuantityChange(id, delta);
        });

        this.$couponButton.off("click").on("click", async (event) => {
            event.preventDefault();
            event.stopPropagation();
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

        this.$submitButton.off("click").on("click", async (event) => {
            event.preventDefault();
            event.stopPropagation();
            await this.handlers.onSubmit();
        });

        $("#checkout-form").off("submit").on("submit", async (event) => {
            event.preventDefault();
            event.stopPropagation();
            await this.handlers.onSubmit();
        });
    }

    renderItems(items) {
        if (!items.length) {
            this.$items.html(`
                <div class="empty-cart-state">
                    <div class="empty-cart-icon">
                        <i class="fas fa-shopping-cart"></i>
                    </div>
                    <p class="empty-cart-title">Carrinho vazio</p>
                    <p class="empty-cart-desc">Adicione produtos para continuar</p>
                </div>
            `);
            return;
        }

        const html = items.map((item) => {
            return `
                <div class="checkout-item-pixel checkout-item">
                    <img src="${escapeHtml(item.image || "https://placehold.co/64x64/1a1a1a/3a3a3a")}" alt="${escapeHtml(item.name)}" class="checkout-item-img checkout-item-img-pixel" />
                    <div class="checkout-item-info">
                        <p class="checkout-item-title">${escapeHtml(item.name)}</p>
                        <p class="checkout-item-meta">${formatCurrency(item.price)}</p>
                    </div>
                    <div class="checkout-item-actions">
                        <button class="checkout-qty-btn" ${Number(item.qty) <= 1 ? 'disabled' : ''} data-id="${escapeHtml(item.id)}" data-delta="-1">
                            <i class="fas fa-minus" style="font-size:8px;"></i>
                        </button>
                        <span class="checkout-item-qty">${Number(item.qty)}</span>
                        <button class="checkout-qty-btn" ${item.stock !== null && Number(item.stock) > 0 && Number(item.qty) >= Number(item.stock) ? 'disabled' : ''} data-id="${escapeHtml(item.id)}" data-delta="1">
                            <i class="fas fa-plus" style="font-size:8px;"></i>
                        </button>
                    </div>
                    <button class="checkout-remove-btn" data-id="${escapeHtml(item.id)}">
                        <i class="fas fa-trash" style="font-size:8px;"></i>
                    </button>
                </div>
            `;
        }).join("");

        this.$items.html(html);
    }

    setTotal(value) {
        this.$total.text(formatCurrency(value));
    }

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

    setFieldError(field, text) {
        const $error = this.$fieldErrors[field];
        if (!$error || !$error.length) return;

        if (!text) {
            $error.removeClass("visible").text("");
            return;
        }

        $error.addClass("visible").text(text);
    }

    clearFieldErrors() {
        Object.keys(this.$fieldErrors).forEach((field) => {
            this.setFieldError(field, "");
        });
    }

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

    #formatPhone(value) {
        const digits = String(value || "").replace(/\D/g, "").slice(0, 11);
        if (digits.length === 0) return "";
        if (digits.length <= 2) return `(${digits}`;
        if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
    }

    setSubmitLabel(method) {
        const labels = {
            PIX: '<i class="fas fa-qrcode" style="margin-right:8px;"></i> Pagar com PIX',
            CARD: '<i class="fas fa-credit-card" style="margin-right:8px;"></i> Pagar com Cartao',
            BOLETO: '<i class="fas fa-barcode" style="margin-right:8px;"></i> Pagar com Boleto',
            SALDO: '<i class="fas fa-wallet" style="margin-right:8px;"></i> Pagar com Saldo',
        };
        this.$submitButton.html(labels[method] || labels.PIX);
    }

    setSubmitLoading(loading, method) {
        if (loading) {
            this.$submitButton.prop("disabled", true).html('<i class="fas fa-spinner fa-spin" style="margin-right:8px;"></i> Processando...');
            return;
        }
        this.$submitButton.prop("disabled", false);
        this.setSubmitLabel(method);
    }

    setCouponLoading(loading) {
        if (loading) {
            this.$couponButton.prop("disabled", true).html('<i class="fas fa-spinner fa-spin" style="margin-right:4px;"></i>...');
            return;
        }
        this.$couponButton.prop("disabled", false).html('<i class="fas fa-ticket" style="margin-right:6px;"></i> Aplicar');
    }

    showMessage(type, text) {
        if (this.messageTimer) {
            clearTimeout(this.messageTimer);
        }

        const success = type === "success";
        const icon = success ? "fa-circle-check" : "fa-circle-exclamation";
        const accent = success ? "var(--green)" : "#ef6a66";

        this.$toast
            .removeClass("toast-success toast-error")
            .addClass(success ? "toast-success" : "toast-error")
            .html(`<span class="toast-icon"><i class="fas ${icon}"></i></span><span class="toast-text">${text}</span>`)
            .removeClass("opacity-0")
            .addClass("opacity-100");

        this.messageTimer = setTimeout(() => {
            this.hideMessage();
        }, 4500);
    }

    hideMessage() {
        if (this.messageTimer) {
            clearTimeout(this.messageTimer);
            this.messageTimer = null;
        }
        this.$toast
            .addClass("opacity-0")
            .removeClass("opacity-100");
    }

    hideAllMessages() {
        this.hideMessage();
        this.clearFieldErrors();
    }

    setCouponStatus(state) {
        this.$couponStatus.removeClass("visible").text("");
        if (!state) {
            this.hideMessage();
            return;
        }

        const type = state.type === "success" ? "success" : "error";
        this.showMessage(type, state.text);
    }

    resetForm() {
        const form = $("#checkout-form")[0];
        if (form) form.reset();
        this.setSubmitLabel("PIX");
        this.setCouponStatus(null);
    }
}
