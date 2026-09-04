import { escapeHtml } from "../services/dom.service.js";

/**
 * Renderiza e controla os filtros de categoria.
 */
export class CategoriesComponent {
  /**
   * @param {{ onCategoryChange: (category: string) => void }} deps
   */
  constructor({ onCategoryChange }) {
    this.$filters = $("#category-filters");
    this.onCategoryChange = onCategoryChange;
    this.categories = [];
    this.activeCategory = "all";

    this.#bindEvents();
  }

  #bindEvents() {
    $(document).on("click", ".category-filter-btn", (event) => {
      const $btn = $(event.currentTarget);
      const category = String($btn.data("category") || "all");
      if (category === this.activeCategory) return;

      $btn.siblings().removeClass("active");
      $btn.addClass("active");

      this.activeCategory = category;
      this.render();

      if (typeof this.onCategoryChange === "function") {
        this.onCategoryChange(category);
      }
    });
  }

  /**
   * @param {Array<{id?: string, name?: string}>} categories
   */
  setCategories(categories) {
    this.categories = (Array.isArray(categories) ? categories : [])
      .filter((category) => category?.name)
      .map((category) => ({
        id: String(category.id || category.name),
        name: String(category.name)
      }));

    this.render();
  }

  /**
   * @param {string} category
   */
  setActiveCategory(category) {
    this.activeCategory = String(category || "all");
    this.render();
  }

  render() {
    const allClass = this.activeCategory === "all"
      ? "bg-[#c8502a] text-white"
      : "bg-white text-[#6b6560] border border-[#e8e4df]";

    const html = [
      `<button class="category-btn category-filter-btn px-4 py-2 rounded-full text-sm font-medium transition-all ${allClass} stagger-item" style="animation-delay: 0ms;" data-category="all">Todos</button>`
    ];

    this.categories.forEach((category, index) => {
      const active = this.activeCategory === category.name;
      const className = active
        ? "bg-[#c8502a] text-white"
        : "bg-white text-[#6b6560] border border-[#e8e4df] hover:border-[#c8502a] hover:text-[#c8502a]";

      html.push(
        `<button class="category-btn category-filter-btn px-4 py-2 rounded-full text-sm font-medium transition-all ${className} stagger-item" style="animation-delay: ${(index + 1) * 80}ms;" data-category="${escapeHtml(category.name)}">${escapeHtml(category.name)}</button>`
      );
    });

    this.$filters.html(html.join(""));
  }
}
