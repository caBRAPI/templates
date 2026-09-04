import { caBRAPI } from "https://cdn.jsdelivr.net/npm/@cabrapi/sdk/dist/index.js";

export const APP_CONFIG = {
    CART_STORAGE_KEY: "cabrapi_theme_dark_minecraft_cart",
    PRODUCTS_PAGE: 1,
    PRODUCTS_LIMIT: 3,
    PRODUCT_IMAGE_FIT_DEFAULT: "cover",
    BUTTON_FEEDBACK_MS: 1400,
    COPY_FEEDBACK_MS: 1800
};

export const PAYMENT_GATEWAYS = {
    PIX: "MERCADOPAGO_ORDER_PIX",
    CARD: "MERCADOPAGO_ORDER_CARD",
    BOLETO: "MERCADOPAGO_ORDER_BOLETO",
    SALDO: "MERCADOPAGO_ORDER_SALDO"
};

import { ApiService } from "./services/api.service.js";
import { CartStorageService } from "./services/cart-storage.service.js";
import { isValidEmail, isValidName, isValidNickname, isValidCpf, hasCartItems } from "./services/validators.service.js";
import { CategoriesComponent } from "./components/categories.component.js";
import { ProductsComponent } from "./components/products.component.js";
import { CartDrawerComponent } from "./components/cart-drawer.component.js";
import { CheckoutComponent } from "./components/checkout.component.js";
import { PaymentModalComponent } from "./components/payment-modal.component.js";

class ThemeDarkMinecraftApp {
    constructor() {
        this.apiService = null;
        this.cartStorage = new CartStorageService();
        this.productsComponent = null;
        this.categoriesComponent = null;
        this.cartDrawer = null;
        this.checkoutComponent = null;
        this.paymentModal = new PaymentModalComponent();
        this.appliedCouponCode = null;
        this.storeId = "";
        this.currentPage = 1;
        this.activeCategory = "all";
    }

    async init() {
        if (!window.jQuery) {
            setTimeout(() => this.init(), 80);
            return;
        }

        if (!caBRAPI) {
            setTimeout(() => this.init(), 100);
            return;
        }

        this.storeId = String($("meta[name='loja-id']").attr("content") || "").trim();

        if (!this.storeId || this.storeId.length === 0 || this.storeId === "STORE_ID") {
            $("#products-list").html(`
                <div class="empty-state">
                    <i class="fas fa-cube"></i>
                    <p>Configure o ID da loja</p>
                </div>
            `);
            return;
        }

        this.apiService = new ApiService(caBRAPI, this.storeId);
        this.mercadoPago = null;

        this.productsComponent = new ProductsComponent({
            onAddToCart: (product) => this.handleAddToCart(product),
            onPageChange: (page) => this.handlePageChange(page)
        });

        this.categoriesComponent = new CategoriesComponent({
            onCategoryChange: (category) => this.handleCategoryChange(category)
        });

        this.cartDrawer = new CartDrawerComponent();
        this.cartDrawer.bindEvents();

        this.checkoutComponent = new CheckoutComponent({
            onRemoveItem: (id) => this.handleRemoveItem(id),
            onQuantityChange: (id, delta) => this.handleQuantityChange(id, delta),
            onApplyCoupon: async () => {
                await this.handleApplyCoupon();
            },
            onSubmit: async () => {
                await this.handleCheckoutSubmit();
            },
            onPaymentMethodChange: (method) => {
                const key = method in PAYMENT_GATEWAYS ? method : "PIX";
                this.checkoutComponent.setSubmitLabel(key);
            }
        });

        this.syncCartUI();
        await this.loadCategories();
        await this.loadProducts();
    }

    async loadCategories() {
        try {
            const categories = await this.apiService.getCategories();
            this.categoriesComponent.setCategories(categories);
            this.categoriesComponent.setActiveCategory(this.activeCategory);
        } catch {
            this.categoriesComponent.setCategories([]);
            this.categoriesComponent.setActiveCategory("all");
        }
    }

    async loadProducts(page = 1) {
        try {
            this.currentPage = page;
            const data = await this.apiService.getProducts(page);
            const cartItems = this.cartStorage.getItems();
            const productsWithCartQty = data.products.map((product) => {
                const inCart = cartItems.find((item) => String(item.id) === String(product.id));
                return { ...product, inCartQty: inCart ? inCart.qty : 0 };
            });
            this.productsComponent.setProducts({ ...data, products: productsWithCartQty });
            this.productsComponent.setActiveCategory(this.activeCategory);
        } catch (error) {
            $("#products-list").html(`
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Falha ao carregar produtos</p>
                </div>
            `);
        }
    }

    handlePageChange(page) {
        this.loadProducts(page);
        $("#shop")[0]?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    handleCategoryChange(category) {
        this.activeCategory = String(category || "all");
        this.productsComponent.setActiveCategory(this.activeCategory);
    }

    handleAddToCart(product) {
        const stock = product.stock === null || product.stock === undefined ? null : Number(product.stock);

        if (stock !== null && stock <= 0) {
            this.checkoutComponent.showMessage("error", "Produto sem estoque disponivel!");
            return false;
        }

        this.cartStorage.addProduct(product);
        this.syncCartUI();
        this.checkoutComponent.showMessage("success", "Produto adicionado ao carrinho!");
        return true;
    }

    handleRemoveItem(productId) {
        this.cartStorage.removeProduct(productId);
        this.syncCartUI();
        this.checkoutComponent.showMessage("success", "Produto removido do carrinho!");
    }

    handleQuantityChange(productId, delta) {
        this.cartStorage.changeQuantity(productId, delta);
        this.syncCartUI();
    }

    syncCartUI() {
        const items = this.cartStorage.getItems();
        this.cartDrawer.setCount(this.cartStorage.getTotalItems());
        this.checkoutComponent.renderItems(items);
        this.checkoutComponent.setTotal(this.cartStorage.getTotalPrice());
        this.productsComponent.updateButtonsStates(items);
    }

    async handleApplyCoupon() {
        this.checkoutComponent.hideMessage();

        const { coupon } = this.checkoutComponent.getFormData();
        if (!coupon) {
            this.appliedCouponCode = null;
            this.checkoutComponent.setCouponStatus({
                type: "error",
                text: "Digite um codigo de cupom!"
            });
            return false;
        }

        this.checkoutComponent.setCouponLoading(true);

        try {
            const response = await this.apiService.validateCoupon(coupon);
            const couponData = response?.coupon;

            if (!response?.status || !couponData?.code) {
                throw new Error("Cupom invalido ou indisponivel.");
            }

            this.appliedCouponCode = String(couponData.code);
            this.checkoutComponent.setCouponStatus({
                type: "success",
                text: `Cupom aplicado: ${String(couponData.code).toUpperCase()}`
            });

            return true;
        } catch (error) {
            this.appliedCouponCode = null;
            this.checkoutComponent.setCouponStatus({
                type: "error",
                text: "Cupom invalido ou expirado!"
            });
            return false;
        } finally {
            this.checkoutComponent.setCouponLoading(false);
        }
    }

    async handleCheckoutSubmit() {
        this.checkoutComponent.hideAllMessages();

        const items = this.cartStorage.getItems();
        if (!hasCartItems(items)) {
            this.checkoutComponent.showMessage("error", "Adicione produtos ao carrinho primeiro!");
            return;
        }

        const form = this.checkoutComponent.getFormData();

        if (!isValidName(form.name)) {
            this.checkoutComponent.setFieldError("name", "Nome muito curto");
            this.checkoutComponent.showMessage("error", "Preencha o Nome");
            return;
        }

        if (form.nickname && !isValidNickname(form.nickname)) {
            this.checkoutComponent.setFieldError("nickname", "Nickname invalido");
            this.checkoutComponent.showMessage("error", "Preencha o Nickname");
            return;
        }

        if (!isValidEmail(form.email)) {
            this.checkoutComponent.setFieldError("email", "E-mail invalido");
            this.checkoutComponent.showMessage("error", "Preencha o E-mail");
            return;
        }

        if (form.cpf && !isValidCpf(form.cpf)) {
            this.checkoutComponent.setFieldError("cpf", "CPF invalido");
            this.checkoutComponent.showMessage("error", "Preencha o CPF");
            return;
        }

        if (form.coupon && !this.appliedCouponCode) {
            const ok = await this.handleApplyCoupon();
            if (!ok) {
                return;
            }
        }

        if (!form.coupon) {
            this.appliedCouponCode = null;
            this.checkoutComponent.setCouponStatus(null);
        }

        const paymentMethod = form.paymentMethod || "PIX";
        const gatewayKey = paymentMethod in PAYMENT_GATEWAYS ? paymentMethod : "PIX";

        const payload = {
            name: form.name,
            email: form.email,
            cpf: form.cpf || undefined,
            gateway: PAYMENT_GATEWAYS[gatewayKey] || PAYMENT_GATEWAYS.PIX,
            coupon: this.appliedCouponCode || undefined,
            metadata: {
                ...(form.note ? { observation: form.note } : {}),
                ...(form.phone ? { phone: form.phone } : {}),
                ...(form.nickname ? { nickname: form.nickname } : {})
            },
            items: items.map((item) => ({
                productId: String(item.id),
                quantity: Number(item.qty)
            }))
        };

        this.checkoutComponent.setSubmitLoading(true, paymentMethod);

        try {
            const response = await this.apiService.createPayment(payload);
            if (!response?.status) {
                throw new Error(response?.message || "Falha ao criar pagamento.");
            }

            this.paymentModal.showFromPaymentResponse(response);

            this.cartStorage.clear();
            this.syncCartUI();
            this.appliedCouponCode = null;
            this.checkoutComponent.resetForm();
            this.checkoutComponent.showMessage("success", "Pedido realizado com sucesso!");
        } catch (error) {
            this.checkoutComponent.showMessage("error", String(error?.message || "Erro ao processar pagamento."));
        } finally {
            this.checkoutComponent.setSubmitLoading(false, paymentMethod);
        }
    }
}

const app = new ThemeDarkMinecraftApp();
app.init();
