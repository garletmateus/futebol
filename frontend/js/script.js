document.addEventListener("DOMContentLoaded", () => {
  const addButtons = document.querySelectorAll(".btn-add-to-cart");
  const cartItemsEl = document.getElementById("cart-items");
  const cartCountEl = document.getElementById("cart-count");
  const cartTotalEl = document.getElementById("cart-total");
  const payBtn = document.getElementById("pay-btn");

  function getCart() {
    return JSON.parse(localStorage.getItem("resenha-carrinho")) || [];
  }

  function saveCart(cart) {
    localStorage.setItem("resenha-carrinho", JSON.stringify(cart));
  }

  if (addButtons.length) {
    addButtons.forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        const card = button.closest(".card");
        if (!card) return;

        const nome = card.querySelector(".card-title")?.textContent?.trim() || "Produto";
        const precoTexto = card.querySelector(".card-text")?.textContent || "0";
        const preco = Number((precoTexto.match(/[\d,.]+/) || ["0"])[0].replace(".", "").replace(",", "."));
        const img = card.querySelector("img")?.getAttribute("src") || "";

        const cart = getCart();
        cart.push({ nome, preco, img, categoria: "Brasileirao", tamanho: "M" });
        saveCart(cart);
        window.location.href = "carrinho.html";
      });
    });
  }

  function renderCartPage() {
    if (!cartItemsEl || !cartCountEl || !cartTotalEl) return;
    const cart = getCart();
    cartCountEl.textContent = cart.length;

    if (!cart.length) {
      cartItemsEl.innerHTML = '<li class="list-group-item p-4 text-center text-muted">Seu carrinho esta vazio.</li>';
      cartTotalEl.textContent = 'R$ 0,00';
      return;
    }

    let total = 0;
    cartItemsEl.innerHTML = cart.map((item, index) => {
      total += Number(item.preco || 0);
      return `
        <li class="list-group-item d-flex align-items-center justify-content-between p-3">
          <div class="d-flex align-items-center gap-3">
            <img src="${item.img}" alt="${item.nome}" style="width:72px;height:72px;object-fit:cover;border-radius:12px;">
            <div>
              <strong>${item.nome}</strong><br>
              <span class="text-muted small">Tamanho: ${item.tamanho || "M"}</span>
            </div>
          </div>
          <div class="text-end">
            <div class="fw-bold mb-2">R$ ${Number(item.preco || 0).toFixed(0)},00</div>
            <button class="btn btn-sm btn-outline-danger" data-remove="${index}">Remover</button>
          </div>
        </li>
      `;
    }).join("");

    cartTotalEl.textContent = `R$ ${total.toFixed(0)},00`;

    cartItemsEl.querySelectorAll("[data-remove]").forEach((button) => {
      button.addEventListener("click", () => {
        const cart = getCart();
        cart.splice(Number(button.dataset.remove), 1);
        saveCart(cart);
        renderCartPage();
      });
    });
  }

  if (payBtn) {
    payBtn.addEventListener("click", () => {
      const metodo = document.getElementById("paymentMethod")?.value;
      if (!metodo) return;
      localStorage.removeItem("resenha-carrinho");
      if (metodo === "pix") window.location.href = "pagamento_pix.html";
      else if (metodo === "creditCard" || metodo === "debitCard") window.location.href = "pagamento_cartao_credito.html";
      else window.location.href = "pagamento_boleto.html";
    });
  }

  renderCartPage();
});
