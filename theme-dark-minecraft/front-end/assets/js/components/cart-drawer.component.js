import { setOverlayVisible } from "../services/dom.service.js";

/**
 * Controla abertura/fechamento do drawer de checkout e contador do carrinho.
 */
export class CartDrawerComponent {
  constructor() {
    this.$drawer = $("#checkout");
    this.$openButton = $("#cart-toggle");
    this.$closeButton = $("#checkout-close");
    this.$count = $("#cart-count");
  }

  bindEvents() {
    this.$openButton.on("click", (event) => {
      event.preventDefault();
      this.open();
    });

    this.$closeButton.on("click", () => this.close());

    this.$drawer.on("click", (event) => {
      if ($(event.target).is(this.$drawer)) {
        this.close();
      }
    });
  }

  open() {
    setOverlayVisible(this.$drawer, true, true);
  }

  close() {
    setOverlayVisible(this.$drawer, false, true);
  }

  /**
      * @param {number} count
      */
  setCount(count) {
    const prevCount = parseInt(this.$count.text() || "0", 10);
    this.$count.text(String(Number(count || 0)));
    this.$count.toggleClass("hidden", Number(count) <= 0);

    if (count > prevCount && window.innerWidth >= 768) {
      this.$count.addClass("bump");
      setTimeout(() => this.$count.removeClass("bump"), 300);
    }

    if (count > 0) {
      this.$openButton.addClass("has-items");
    } else {
      this.$openButton.removeClass("has-items");
    }
  }
}

// Nav scroll + mobile gesture (no duplicate checkout handlers)
document.addEventListener("DOMContentLoaded", function () {
  const navToggle = document.getElementById("nav-toggle");
  const navMobile = document.getElementById("nav-mobile");
  if (navToggle && navMobile) {
    const toggleMenu = () => {
      const open = navMobile.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(open));
      navToggle.innerHTML = open
        ? '<i class="fas fa-xmark"></i>'
        : '<i class="fas fa-bars"></i>';
    };
    navToggle.addEventListener("click", toggleMenu);
    navMobile.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", toggleMenu);
    });
  }

  const nav = document.querySelector("nav");
  if (nav) {
    window.addEventListener("scroll", function () {
      if (window.pageYOffset > 20) {
        nav.classList.add("scrolled");
      } else {
        nav.classList.remove("scrolled");
      }
    });
  }

  const checkoutPanel = document.getElementById("checkout-panel");
  if (checkoutPanel && window.innerWidth < 768) {
    const handle = checkoutPanel.querySelector('.mobile-gesture-handle');
    if (handle) {
      let startY = 0;
      let isDragging = false;

      handle.addEventListener('touchstart', function (e) {
        startY = e.touches[0].clientY;
        isDragging = true;
      }, { passive: true });

      document.addEventListener('touchmove', function (e) {
        if (!isDragging) return;
        const diff = e.touches[0].clientY - startY;
        if (diff > 0 && !checkoutPanel.classList.contains('translate-y-full')) {
          checkoutPanel.style.transform = `translateY(${Math.min(diff, 150)}px)`;
        }
      }, { passive: true });

      document.addEventListener('touchend', function (e) {
        if (!isDragging) return;
        isDragging = false;
        checkoutPanel.style.transform = '';
        if (e.changedTouches[0].clientY - startY > 100) {
          document.getElementById("checkout-close").click();
        }
      });
    }
  }
});