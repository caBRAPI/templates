import { APP_CONFIG } from "../main.js";

/**
 * Adaptador do SDK caBRAPI para o modulo front-end.
 */
export class ApiService {
    #client;
    #storeId;

    /**
     * @param {new (...args: any[]) => any} SDK
     * @param {string} storeId
     */
    constructor(SDK, storeId) {
        this.#client = new SDK({
            type: "public",
            config: {}
        });
        this.#storeId = storeId;
    }

    /**
     * @param {number} [page]
     * @returns {Promise<{products: Array<any>, pagination: {page: number, limit: number, total: number, totalPages: number}}>} 
     */
    async getProducts(page = APP_CONFIG.PRODUCTS_PAGE) {
        const response = await this.#client.products.get(this.#storeId, {
            page,
            limit: APP_CONFIG.PRODUCTS_LIMIT
        });

        if (!response?.status && response?.error) {
            throw new Error(response?.message || "Erro ao buscar produtos.");
        }

        return {
            products: Array.isArray(response?.products) ? response.products : [],
            pagination: {
                page: Number(response?.pagination?.page || page || 1),
                limit: Number(response?.pagination?.limit || APP_CONFIG.PRODUCTS_LIMIT),
                total: Number(response?.pagination?.total || 0),
                totalPages: Number(response?.pagination?.totalPages || 1)
            }
        };
    }

    /**
     * @returns {Promise<Array<{id: string, name: string}>>}
     */
    async getCategories() {
        const response = await this.#client.categories.get(this.#storeId, {
            page: 1,
            limit: 100
        });

        if (!response?.status && response?.error) {
            throw new Error(response?.message || "Erro ao buscar categorias.");
        }

        return Array.isArray(response?.categories) ? response.categories : [];
    }

    /**
     * @param {string} code
     * @returns {Promise<any>}
     */
    async validateCoupon(code) {
        return await this.#client.coupons.getByCode(this.#storeId, code);
    }

    /**
     * @param {any} payload
     * @returns {Promise<any>}
     */
    async createPayment(payload) {
        return await this.#client.payments.post(this.#storeId, payload);
    }
}
