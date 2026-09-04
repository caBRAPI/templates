import { caBRAPI } from "https://cdn.jsdelivr.net/npm/@cabrapi/sdk/dist/index.js";
// Configurações injetadas diretamente aqui (antes em config.js)
export const APP_CONFIG = {
    CART_STORAGE_KEY: "cabrapi_theme_light_shop_cart",
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

/**
 * Aplicação principal do template Theme Light Shop.
 * Responsável por inicializar todos os componentes, gerenciar o estado do carrinho,
 * tratar eventos de interação do usuário e coordenar a comunicação com a API.
 * 
 * @class ThemeLightShopApp
 * @description Classe principal que coordena toda a aplicação da loja virtual.
 *              Gerencia: produtos, categorias, carrinho, checkout, cupons e pagamentos.
 * 
 * @author caBRAPI Team
 * @version 1.0.0
 * 
 * @property {ApiService|null} apiService - Serviço de comunicação com a API
 * @property {CartStorageService} cartStorage - Serviço de persistência do carrinho
 * @property {ProductsComponent|null} productsComponent - Componente de listagem de produtos
 * @property {CategoriesComponent|null} categoriesComponent - Componente de filtros de categoria
 * @property {CartDrawerComponent|null} cartDrawer - Componente do drawer do carrinho
 * @property {CheckoutComponent|null} checkoutComponent - Componente do formulário de checkout
 * @property {PaymentModalComponent} paymentModal - Componente do modal de pagamento
 * @property {string|null} appliedCouponCode - Código do cupom aplicado atualmente
 * @property {string} storeId - ID da loja para conexão com a API
 * @property {number} currentPage - Página atual da paginação de produtos
 * @property {string} activeCategory - Categoria ativa para filtro de produtos
 */
class ThemeLightShopApp {
    /**
     * Construtor da aplicação principal.
     * Inicializa os serviços e componentes necessários.
     * 
     * @constructor
     * @description Cria uma nova instância da aplicação, inicializando os serviços
     *              de carrinho, pagamento e configurando o estado inicial.
     */
    constructor() {
        /** @type {ApiService|null} Serviço de API - será inicializado no init() */
        this.apiService = null;
        
        /** @type {CartStorageService} Serviço de persistência do carrinho */
        this.cartStorage = new CartStorageService();
        
        /** @type {ProductsComponent|null} Componente de produtos */
        this.productsComponent = null;
        
        /** @type {CategoriesComponent|null} Componente de categorias */
        this.categoriesComponent = null;
        
        /** @type {CartDrawerComponent|null} Componente do drawer */
        this.cartDrawer = null;
        
        /** @type {CheckoutComponent|null} Componente de checkout */
        this.checkoutComponent = null;
        
        /** @type {PaymentModalComponent} Componente de modal de pagamento */
        this.paymentModal = new PaymentModalComponent();

        /** @type {string|null} Código do cupom aplicado */
        this.appliedCouponCode = null;
        
        /** @type {string} ID da loja */
        this.storeId = "";
        
        /** @type {number} Página atual */
        this.currentPage = 1;
        
        /** @type {string} Categoria ativa */
        this.activeCategory = "all";
    }

    /**
     * Inicializa a aplicação completa.
     * Aguarda a disponibilização do jQuery e do SDK caBRAPI, configura todos os componentes
     * e carrega os dados iniciais (categorias e produtos).
     * 
     * @async
     * @method init
     * @description Método principal de inicialização da aplicação.
     *              Executa as seguintes etapas:
     *              1. Aguarda jQuery estar disponível
     *              2. Aguarda SDK caBRAPI estar disponível
     *              3. Extrai o ID da loja da tag meta HTML
     *              4. Cria o serviço de API
     *              5. Instancia todos os componentes (produtos, categorias, carrinho, checkout)
     *              6. Sincroniza o estado do carrinho com a UI
     *              7. Carrega categorias e produtos da API
     * 
     * @returns {Promise<void>} Promessa que resolve quando a inicialização completa
     * @throws {Error} Exibe mensagem de erro se a meta 'loja-id' não for encontrada
     * 
     * @example
     * const app = new ThemeLightShopApp();
     * app.init();
     */
    async init() {
        // Aguarda jQuery estar disponível
        if (!window.jQuery) {
            setTimeout(() => this.init(), 80);
            return;
        }

        // Aguarda SDK caBRAPI estar disponível
        if (!caBRAPI) {
            setTimeout(() => this.init(), 100);
            return;
        }

        // Extrai o ID da loja da tag meta
        this.storeId = String($("meta[name='loja-id']").attr("content") || "").trim();

        if (!this.storeId || this.storeId.length === 0 || this.storeId === "STORE_ID") {
            $("#products-list").html(`
                <div class="text-center py-12 text-orange-600">
                    <i class="fas fa-triangle-exclamation text-4xl mb-3 block"></i>
                    <p class="text-lg">Você precisa configurar o ID da loja.</p>
                </div>
            `);
            return;
        }

        // Inicializa o serviço de API com o SDK
        this.apiService = new ApiService(caBRAPI, this.storeId);

        this.mercadoPago = null;

        // Cria componente de produtos com callbacks
        this.productsComponent = new ProductsComponent({
            onAddToCart: (product) => this.handleAddToCart(product),
            onPageChange: (page) => this.handlePageChange(page)
        });

        // Cria componente de categorias com callbacks
        this.categoriesComponent = new CategoriesComponent({
            onCategoryChange: (category) => this.handleCategoryChange(category)
        });

        // Inicializa o drawer do carrinho
        this.cartDrawer = new CartDrawerComponent();
        this.cartDrawer.bindEvents();

        // Inicializa o checkout com todos os handlers
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

        // Sincroniza UI do carrinho com dados persistidos
        this.syncCartUI();
        
        // Carrega dados iniciais
        await this.loadCategories();
        await this.loadProducts();
    }

    /**
     * Carrega as categorias de produtos da API.
     * 
     * @async
     * @method loadCategories
     * @description Busca as categorias disponíveis na API e atualiza o componente.
     *              Em caso de erro, exibe lista vazia de categorias.
     * 
     * @returns {Promise<void>} Promessa que resolve após carregar categorias
     * 
     * @example
     * await app.loadCategories();
     */
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
                <div class="text-center py-12 text-orange-600">
                    <i class="fas fa-triangle-exclamation text-4xl mb-3 block"></i>
                    <p>Não foi possivel carregar os produtos.</p>
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
            this.checkoutComponent.showMessage("error", "Este produto esta sem estoque.");
            return false;
        }
        this.cartStorage.addProduct(product);
        this.syncCartUI();
        return true;
    }

    handleRemoveItem(productId) {
        this.cartStorage.removeProduct(productId);
        this.syncCartUI();
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
                text: "Digite um cupom para aplicar."
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
                text: `Cupom aplicado: ${String(couponData.code).toUpperCase()} (-${Number(couponData.discount || 0)}%)`
            });

            return true;
        } catch (error) {
            this.appliedCouponCode = null;
            this.checkoutComponent.setCouponStatus({
                type: "error",
                text: "Cupom invalido, expirado ou indisponivel para esta loja."
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
            this.checkoutComponent.showMessage("error", "Seu carrinho está vazio.");
            return;
        }

        const form = this.checkoutComponent.getFormData();
        const errors = [];

        if (!isValidName(form.name)) {
            this.checkoutComponent.setFieldError("name", "Informe um nome válido com pelo menos 3 caracteres.");
            errors.push("nome");
        }

        if (!isValidNickname(form.nickname)) {
            this.checkoutComponent.setFieldError("nickname", "O apelido deve ter entre 4 e 32 caracteres.");
            errors.push("apelido");
        }

        if (!isValidEmail(form.email)) {
            this.checkoutComponent.setFieldError("email", "Informe um e-mail válido.");
            errors.push("e-mail");
        }

        if (form.cpf && !isValidCpf(form.cpf)) {
            this.checkoutComponent.setFieldError("cpf", "O CPF deve ter 11 números.");
            errors.push("CPF");
        }

        if (errors.length > 0) {
            this.checkoutComponent.showMessage("error", `Corrija os campos: ${errors.join(", ")}`);
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
            this.checkoutComponent.showMessage("success", "Pagamento criado com sucesso.");
        } catch (error) {
            this.checkoutComponent.showMessage("error", String(error?.message || "Erro ao processar pagamento."));
        } finally {
            this.checkoutComponent.setSubmitLoading(false, paymentMethod);
        }
    }
}

const app = new ThemeLightShopApp();
app.init();
