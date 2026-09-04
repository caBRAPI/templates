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

// Inicializa o componente do drawer de carrinho
document.addEventListener("DOMContentLoaded", function () {
  const nav = document.querySelector("nav");
  const cartCount = document.getElementById("cart-count");
  const cartToggle = document.getElementById("cart-toggle");

  let lastScroll = 0;
  window.addEventListener("scroll", function () {
    const currentScroll = window.pageYOffset;
    if (currentScroll > 20) {
      nav.classList.add("scrolled");
    } else {
      nav.classList.remove("scrolled");
    }
    lastScroll = currentScroll;
  });

  const originalSetCount = window.__cartSetCount;
  window.__cartSetCount = function (count) {
    if (originalSetCount) originalSetCount(count);
    if (cartCount) {
      cartCount.textContent = count;
      if (count > 0) {
        cartToggle.classList.add("has-items");
        cartCount.classList.add("bump");
        setTimeout(function () {
          cartCount.classList.remove("bump");
        }, 300);
      } else {
        cartToggle.classList.remove("has-items");
      }
    }
  };

  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px"
  };

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("animate-fade-in-up");
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll("section").forEach(function (section) {
    observer.observe(section);
  });

  document.querySelectorAll(".feature-card").forEach(function (card, index) {
    card.style.animationDelay = (index * 100) + "ms";
    card.classList.add("stagger-item");
  });

  document.querySelectorAll(".stat-card").forEach(function (card, index) {
    card.style.animationDelay = (index * 100) + "ms";
    card.classList.add("stagger-item");
  });

  const heroImage = document.querySelector("#hero > div > div > div:nth-child(2)");
  if (heroImage) {
    heroImage.classList.add("animate-slide-right");
  }

  const checkout = document.getElementById("checkout");
  const checkoutPanel = document.getElementById("checkout-panel");
  const checkoutClose = document.getElementById("checkout-close");

  function isMobile() {
    return window.innerWidth < 768;
  }

  function openCheckout() {
    checkout.classList.remove("opacity-0", "pointer-events-none");
    checkoutPanel.classList.remove("translate-y-full");
    if (isMobile()) {
      document.body.classList.add("checkout-open");
    }
  }

  function closeCheckout() {
    checkout.classList.add("opacity-0", "pointer-events-none");
    checkoutPanel.classList.add("translate-y-full");
    document.body.classList.remove("checkout-open");
  }

  cartToggle.addEventListener("click", function (e) {
    e.preventDefault();
    openCheckout();
  });

  checkoutClose.addEventListener("click", closeCheckout);

  checkout.addEventListener("click", function (e) {
    if (e.target === checkout) {
      closeCheckout();
    }
  });

  if (isMobile()) {
    let startY = 0;
    let currentY = 0;
    let isDragging = false;

    const handle = checkoutPanel.querySelector('.mobile-gesture-handle');

    handle.addEventListener('touchstart', function (e) {
      startY = e.touches[0].clientY;
      isDragging = true;
    }, { passive: true });

    document.addEventListener('touchmove', function (e) {
      if (!isDragging) return;
      currentY = e.touches[0].clientY;
      const diff = currentY - startY;

      if (diff > 0 && checkoutPanel.classList.contains('translate-y-full') === false) {
        const translateY = Math.min(diff, 150);
        checkoutPanel.style.transform = `translateY(${translateY}px)`;
      }
    }, { passive: true });

    document.addEventListener('touchend', function (e) {
      if (!isDragging) return;
      isDragging = false;
      checkoutPanel.style.transform = '';

      const diff = currentY - startY;
      if (diff > 100) {
        closeCheckout();
      }
    });
  }
});