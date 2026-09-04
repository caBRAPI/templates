import { APP_CONFIG } from "../main.js";
import { setOverlayVisible, escapeHtml } from "../services/dom.service.js";

export class PaymentModalComponent {
  constructor() {
    this.$pixModal = $("#pix-modal");
    this.$pixPanel = $("#pix-modal-panel");
    this.$cardModal = $("#card-modal");
    this.$cardPanel = $("#card-modal-panel");
  }

  showFromPaymentResponse(response) {
    const payment = response?.data?.payment || {};

    if (payment?.init_point) {
      window.location.href = payment.init_point;
      return;
    }

    if (payment?.qr_code) {
      this.#showPix(payment);
      return;
    }

    if (payment?.url) {
      window.location.href = payment.url;
      return;
    }
  }

  #showPix(payment) {
    const qr = payment?.qr_code || {};
    let image = qr.image || "";

    if (image && !String(image).startsWith("data:") && !String(image).startsWith("http")) {
      image = `data:image/png;base64,${image}`;
    }

    this.$pixPanel.html(`
            <div class="mb-5">
                <i class="fas fa-qrcode text-4xl text-[#3ddc84] mb-3 block"></i>
                <h3 class="text-xl font-bold text-[#e8e8e8]">Pagamento PIX</h3>
                <p class="text-[#8b8b8b] text-sm mt-1">Escaneie o QR Code com seu banco.</p>
            </div>
            ${image ? `<img src="${escapeHtml(image)}" alt="QR Code PIX" class="w-48 h-48 mx-auto mb-4 rounded-xl border-2 border-[#2a2a2a] p-2">` : ""}
            ${qr.base_64 ? `
                <div class="flex gap-2 mb-4">
                    <input id="pix-code" readonly value="${escapeHtml(qr.base_64)}" class="flex-1 px-3 py-2 bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg text-xs font-mono min-w-0 text-[#e8e8e8]" />
                    <button id="pix-copy" class="px-3 py-2 bg-[#3ddc84] text-[#0d0d0d] rounded-lg hover:bg-[#2bc06e] transition-colors shrink-0" title="Copiar codigo PIX">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
            ` : ""}
            <button id="pix-close" class="w-full py-3 border-2 border-[#2a2a2a] text-[#8b8b8b] font-semibold rounded-xl hover:border-[#3ddc84] hover:text-[#3ddc84] transition-all">
                Concluir
            </button>
        `);

    setOverlayVisible(this.$pixModal, true);

    $("#pix-copy").off("click").on("click", async () => {
      try {
        await navigator.clipboard.writeText(String(qr.base_64 || ""));
        const $copyButton = $("#pix-copy");
        $copyButton.html('<i class="fas fa-check"></i>');
        setTimeout(() => {
          $copyButton.html('<i class="fas fa-copy"></i>');
        }, APP_CONFIG.COPY_FEEDBACK_MS);
      } catch {
        // Ignora falha de clipboard em ambientes sem permissao.
      }
    });

    $("#pix-close").off("click").on("click", () => {
      setOverlayVisible(this.$pixModal, false);
    });
  }

  #showCard(payment) {
    this.$cardPanel.html(`
           <div class="text-center p-8 bg-[#161616] rounded-[2.5rem] shadow-2xl border border-[#2a2a2a]">
    <div class="inline-flex items-center justify-center w-20 h-20 bg-[#3ddc84] rounded-full mb-6 shadow-lg">
        <i class="fas fa-credit-card text-2xl text-[#0d0d0d]"></i>
    </div>
    
    <h3 class="text-2xl font-black text-[#e8e8e8] tracking-tighter mb-2">Pagamento com Cartão</h3>
    <p class="text-[#8b8b8b] text-sm mb-8 leading-relaxed max-w-[240px] mx-auto">
      Método de pagamento: cartão. Clique abaixo para abrir o portal seguro.
    </p>

    ${payment.url ? `
        <a href="${escapeHtml(payment.url)}" 
           target="_blank" 
           rel="noopener" 
           class="block w-full py-5 bg-[#3ddc84] text-[#0d0d0d] font-black rounded-2xl text-center mb-4 hover:bg-[#2bc06e] active:scale-[0.97] transition-all shadow-xl shadow-black/20 uppercase tracking-[0.15em] text-[11px]">
            <span class="text-[#0d0d0d] !opacity-100">FINALIZAR PAGAMENTO</span>
        </a>
    ` : ""}

    ${payment.uuid ? `
        <div class="inline-block bg-[#1e1e1e] rounded-full px-4 py-1.5 mb-8 border border-[#2a2a2a]">
            <p class="text-[#8b8b8b] text-[9px] font-bold tracking-widest uppercase">
                REF: <span class="text-[#3ddc84] font-black">${escapeHtml(payment.uuid.split('-')[0])}</span>
            </p>
        </div>
    ` : ""}

    <button id="card-close" class="w-full py-3 border-2 border-[#2a2a2a] text-[#8b8b8b] font-semibold rounded-xl hover:border-[#3ddc84] hover:text-[#3ddc84] transition-all">
      Concluir
    </button>
</div>
        `);

    setOverlayVisible(this.$cardModal, true);

    $("#card-close").off("click").on("click", () => {
      setOverlayVisible(this.$cardModal, false);
    });
  }
}
