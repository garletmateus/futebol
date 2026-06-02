const PRODUTOS_API = "/api/produtos";
const PEDIDOS_API = "/api/pedidos";
const labelsCategoria = {
  Todos: "Todas as categorias",
  Brasileirao: "Brasileirão",
  Selecoes: "Seleções",
  Europa: "Europa"
};

const lista = document.getElementById("lista-produtos");
const categoriasEl = document.getElementById("categorias");
const buscarEl = document.getElementById("buscar");
const buscarTopoEl = document.getElementById("buscarTopo");
const categoriaSelectEl = document.getElementById("categoriaSelect");
const ordenarEl = document.getElementById("ordenar");
const heroBanner = document.querySelector(".hero-banner");
const heroPrev = document.querySelector(".hero-arrow.left");
const heroNext = document.querySelector(".hero-arrow.right");
const contador = document.getElementById("cart-count");
const cartItems = document.getElementById("cart-items");
const cartTotal = document.getElementById("cart-total");
const themeToggle = document.getElementById("themeToggle");
const themeLabel = document.getElementById("themeLabel");
const mBreadcrumb = document.getElementById("mBreadcrumb");
const mTitulo = document.getElementById("mTitulo");
const mNomeCompleto = document.getElementById("mNomeCompleto");
const mCategoria = document.getElementById("mCategoria");
const mImg = document.getElementById("mImg");
const mThumbs = document.getElementById("mThumbs");
const mDesc = document.getElementById("mDesc");
const mDescricaoCompleta = document.getElementById("mDescricaoCompleta");
const mPreco = document.getElementById("mPreco");
const mEstoque = document.getElementById("mEstoque");
const mEstoqueBox = document.getElementById("mEstoqueBox");
const mTamanho = document.getElementById("mTamanho");
const mTabelaTamanhos = document.getElementById("mTabelaTamanhos");
const mQuantidade = document.getElementById("mQuantidade");
const mErroProduto = document.getElementById("mErroProduto");
const mAdd = document.getElementById("mAdd");
const modalProduto = new bootstrap.Modal(document.getElementById("modalProduto"));
const modalPagamento = new bootstrap.Modal(document.getElementById("modalPagamento"));

let produtos = [];
let carrinho = JSON.parse(localStorage.getItem("resenha-carrinho") || "[]");
let categoriaAtual = "Todos";
let produtoAtual = null;
let falhaAoCarregarProdutos = false;
let bannersCarregados = ["./image/banner-brasileirao.webp"];
let bannerAtual = 0;

function aplicarTema(tema) {
  const escuro = tema === "dark";
  document.body.classList.toggle("dark-mode", escuro);
  themeToggle?.classList.toggle("active", escuro);
  if (themeLabel) themeLabel.innerText = escuro ? "Modo claro" : "Modo escuro";
  localStorage.setItem("resenha-tema", escuro ? "dark" : "light");
}

function testarImagem(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function carregarBanners() {
  if (!heroBanner) return;

  const nomes = ["ban", "banner 2", "banner2"];
  const extensoes = ["webp", "jpg", "jpeg", "png"];
  const candidatos = [
    "./image/banner-brasileirao.webp",
    ...nomes.flatMap((nome) => extensoes.map((ext) => `./image/${nome}.${ext}`))
  ];

  const encontrados = (await Promise.all(candidatos.map(testarImagem))).filter(Boolean);
  bannersCarregados = [...new Set(encontrados)];
  mostrarBanner(0);

  if (bannersCarregados.length > 1) {
    setInterval(() => mostrarBanner(bannerAtual + 1), 5000);
  }
}

function mostrarBanner(index) {
  if (!heroBanner || !bannersCarregados.length) return;
  bannerAtual = (index + bannersCarregados.length) % bannersCarregados.length;
  heroBanner.style.backgroundImage = `url("${bannersCarregados[bannerAtual]}")`;
}

function labelCategoria(categoria) {
  return labelsCategoria[categoria] || categoria;
}

function mostrarAviso(msg) {
  document.getElementById("toastMensagem").innerText = msg;
  new bootstrap.Toast(document.getElementById("toastAviso")).show();
}

function limparErroProduto() {
  mErroProduto.classList.add("d-none");
  mErroProduto.innerText = "";
  mTamanho.classList.remove("is-invalid");
  mQuantidade.classList.remove("is-invalid");
}

function mostrarErroProduto(msg, campos = []) {
  const modalAberto = document.getElementById("modalProduto").classList.contains("show");

  if (!modalAberto) {
    mostrarAviso(msg);
    return;
  }

  mErroProduto.innerText = msg;
  mErroProduto.classList.remove("d-none");

  if (campos.includes("tamanho")) mTamanho.classList.add("is-invalid");
  if (campos.includes("quantidade")) mQuantidade.classList.add("is-invalid");

  mErroProduto.scrollIntoView({ behavior: "smooth", block: "center" });
  mostrarAviso(msg);
}

function formatarPreco(valor) {
  return Number(valor).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function obterEstoque(produto) {
  return Number(produto.estoque || 0);
}

function produtoDisponivel(produto) {
  return obterEstoque(produto) > 0;
}

function textoEstoque(produto) {
  const estoque = obterEstoque(produto);
  if (estoque <= 0) return "Produto esgotado";
  return estoque === 1 ? "1 peça disponível" : `${estoque} peças disponíveis`;
}

function medidasPorTamanho(tamanho) {
  const tabela = {
    P: ["52 cm", "69 cm"],
    M: ["55 cm", "71 cm"],
    G: ["58 cm", "73 cm"],
    GG: ["61 cm", "75 cm"],
    XG: ["64 cm", "78 cm"]
  };

  return tabela[tamanho] || ["Consultar", "Consultar"];
}

function descricaoCompletaProduto(produto) {
  return `${produto.desc} Produto feito para quem gosta de camisa de futebol com bom caimento, visual bonito e uso confortável no dia a dia. A peça combina com treino, resenha com os amigos, jogo no estádio ou para completar a coleção. Confira o tamanho antes de comprar e escolha a quantidade desejada conforme o estoque disponível.`;
}

function obterImagensProduto(produto) {
  const imagens = Array.isArray(produto.imagens) && produto.imagens.length ? produto.imagens : [produto.img];
  return [...new Set(imagens.filter(Boolean))];
}

function sincronizarBusca() {
  buscarEl.value = buscarTopoEl.value;
}

function calcularTotalCarrinho() {
  return carrinho.reduce((total, item) => total + Number(item.preco) * Number(item.quantidade || 1), 0);
}

function adicionarAoCarrinho(produto, tamanho, quantidade = 1) {
  const qtd = Math.max(1, Number(quantidade || 1));
  const estoque = obterEstoque(produto);

  if (qtd > estoque) {
    mostrarErroProduto(`Só temos ${estoque} peça${estoque === 1 ? "" : "s"} disponível${estoque === 1 ? "" : "is"} desse produto. Diminua a quantidade para continuar.`, ["quantidade"]);
    return false;
  }

  const itemExistente = carrinho.find((item) =>
    String(item.id) === String(produto.id) && item.tamanho === tamanho
  );
  const quantidadeAtual = Number(itemExistente?.quantidade || 0);

  if (quantidadeAtual + qtd > estoque) {
    mostrarErroProduto(`Você já tem ${quantidadeAtual} no carrinho. O estoque desse produto é ${estoque}.`, ["quantidade"]);
    return false;
  }

  if (itemExistente) {
    itemExistente.quantidade = quantidadeAtual + qtd;
  } else {
    carrinho.push({ ...produto, tamanho, quantidade: qtd });
  }

  atualizarCarrinho();
  mostrarAviso(qtd === 1 ? "Produto adicionado ao carrinho." : "Produtos adicionados ao carrinho.");
  return true;
}

async function carregarProdutosAPI() {
  falhaAoCarregarProdutos = false;

  try {
    const resposta = await fetch(PRODUTOS_API, { cache: "no-store" });
    const dados = await resposta.json();

    if (!resposta.ok) {
      throw new Error(dados.detalhe || dados.erro || "Falha ao carregar produtos do banco.");
    }

    produtos = Array.isArray(dados) ? dados : [];
  } catch (error) {
    console.error(error);
    produtos = [];
    falhaAoCarregarProdutos = true;
    mostrarAviso(error.message || "Não foi possível carregar os produtos do banco.");
  }
}

function renderizarCategorias() {
  const categorias = ["Todos", ...new Set(produtos.map((produto) => produto.categoria))];
  categoriaSelectEl.innerHTML = categorias
    .map((categoria) => `<option value="${categoria}">${labelCategoria(categoria)}</option>`)
    .join("");
  categoriaSelectEl.value = categoriaAtual;
  categoriasEl.innerHTML = categorias
    .map((categoria) => `<button class="chip ${categoriaAtual === categoria ? "active" : ""}" data-categoria="${categoria}">${labelCategoria(categoria)}</button>`)
    .join("");
}

function obterBuscaAtual() {
  return (buscarEl.value || buscarTopoEl.value || "").trim().toLowerCase();
}

function obterProdutosFiltrados() {
  const busca = obterBuscaAtual();
  let filtrados = [...produtos];

  if (categoriaAtual !== "Todos") {
    filtrados = filtrados.filter((produto) => produto.categoria === categoriaAtual);
  }

  if (busca) {
    filtrados = filtrados.filter((produto) =>
      produto.nome.toLowerCase().includes(busca) ||
      produto.categoria.toLowerCase().includes(busca) ||
      produto.desc.toLowerCase().includes(busca)
    );
  }

  if (ordenarEl.value === "menor-preco") filtrados.sort((a, b) => a.preco - b.preco);
  else if (ordenarEl.value === "maior-preco") filtrados.sort((a, b) => b.preco - a.preco);
  else if (ordenarEl.value === "nome") filtrados.sort((a, b) => a.nome.localeCompare(b.nome));

  return filtrados;
}

function renderizarProdutos() {
  if (falhaAoCarregarProdutos) {
    lista.innerHTML = `<div class="empty-state">Não foi possível carregar os produtos do banco de dados.</div>`;
    return;
  }

  const itens = obterProdutosFiltrados();

  if (!itens.length) {
    lista.innerHTML = `<div class="empty-state">Nenhum produto encontrado para esse filtro.</div>`;
    return;
  }

  lista.innerHTML = itens.map((produto) => `
    <article class="product-card">
      <div class="product-media ver-produto" data-id="${produto.id}">
        <img src="${produto.img}" alt="${produto.nome}">
        <span class="badge-tag">${labelCategoria(produto.categoria)}</span>
      </div>
      <div class="product-body">
        <h3 class="product-name">${produto.nome}</h3>
        <p class="product-desc">${produto.desc}</p>
        <div class="product-meta">
          <div class="product-price">R$ ${formatarPreco(produto.preco)}</div>
          <div class="sizes">${produto.tamanhos.join(" • ")}</div>
        </div>
        <select class="form-select tamanho mb-2" data-id="${produto.id}" ${produtoDisponivel(produto) ? "" : "disabled"}>
          <option value="">Escolha o tamanho</option>
          ${produto.tamanhos.map((tamanho) => `<option value="${tamanho}">${tamanho}</option>`).join("")}
        </select>
        <div class="product-actions">
          <button class="btn-shop primary add" data-id="${produto.id}" ${produtoDisponivel(produto) ? "" : "disabled"}>${produtoDisponivel(produto) ? "Adicionar" : "Esgotado"}</button>
          <button class="btn-shop ghost ver" data-id="${produto.id}">Ver mais</button>
        </div>
      </div>
    </article>
  `).join("");
}

function atualizarCarrinho() {
  contador.innerText = carrinho.reduce((total, item) => total + Number(item.quantidade || 1), 0);
  localStorage.setItem("resenha-carrinho", JSON.stringify(carrinho));
  renderizarCarrinho();
}

function renderizarCarrinho() {
  if (!carrinho.length) {
    cartItems.innerHTML = `<div class="empty-state">Seu carrinho está vazio.</div>`;
    cartTotal.innerText = formatarPreco(0);
    return;
  }

  let total = 0;
  cartItems.innerHTML = carrinho.map((item, index) => {
    const quantidade = Number(item.quantidade || 1);
    const subtotal = Number(item.preco) * quantidade;
    total += subtotal;
    return `
      <div class="cart-item">
        <img src="${item.img}" alt="${item.nome}" class="cart-thumb">
        <div>
          <strong>${item.nome}</strong>
          <div class="text-secondary">Categoria: ${labelCategoria(item.categoria)}</div>
          <div class="text-secondary">Tamanho: ${item.tamanho}</div>
          <div class="text-secondary">Quantidade: ${quantidade}</div>
          <div class="fw-bold mt-1">R$ ${formatarPreco(subtotal)}</div>
        </div>
        <button class="btn btn-outline-danger btn-sm" onclick="removerItem(${index})">Remover</button>
      </div>
    `;
  }).join("");

  cartTotal.innerText = formatarPreco(total);
}

function removerItem(index) {
  carrinho.splice(index, 1);
  atualizarCarrinho();
}

function abrirDetalhesProduto(produto) {
  produtoAtual = produto;
  limparErroProduto();
  mBreadcrumb.innerText = `Início / Camisas / ${labelCategoria(produto.categoria)}`;
  mTitulo.innerText = produto.nome;
  mNomeCompleto.innerText = `${produto.nome} - Camisa ${labelCategoria(produto.categoria)}`;
  mCategoria.innerText = labelCategoria(produto.categoria);
  mImg.src = produto.img;
  mImg.alt = produto.nome;
  const imagensProduto = obterImagensProduto(produto);
  mImg.src = imagensProduto[0] || produto.img;
  mThumbs.innerHTML = imagensProduto.map((img, index) => `
    <button class="detail-thumb ${index === 0 ? "active" : ""}" type="button" data-img="${img}">
      <img src="${img}" alt="${produto.nome}">
    </button>
  `).join("");
  mDesc.innerText = produto.desc;
  mDescricaoCompleta.innerText = descricaoCompletaProduto(produto);
  mPreco.innerText = formatarPreco(produto.preco);
  mEstoque.innerText = textoEstoque(produto);
  mEstoqueBox.className = `stock-box mb-3 ${produtoDisponivel(produto) ? "" : "out"}`;
  mTamanho.innerHTML = `<option value="">Escolha o tamanho</option>${produto.tamanhos.map((tamanho) => `<option value="${tamanho}">${tamanho}</option>`).join("")}`;
  mTabelaTamanhos.innerHTML = produto.tamanhos.map((tamanho) => {
    const [largura, altura] = medidasPorTamanho(tamanho);
    return `<tr><td>${tamanho}</td><td>${largura}</td><td>${altura}</td></tr>`;
  }).join("");
  mTamanho.disabled = !produtoDisponivel(produto);
  mQuantidade.value = 1;
  mQuantidade.max = obterEstoque(produto);
  mQuantidade.disabled = !produtoDisponivel(produto);
  mAdd.disabled = !produtoDisponivel(produto);
  mAdd.innerText = produtoDisponivel(produto) ? "Adicionar ao carrinho" : "Produto esgotado";
  modalProduto.show();
}

function abrirPagamento() {
  if (!carrinho.length) {
    mostrarAviso("Adicione pelo menos um item ao carrinho antes de finalizar.");
    return;
  }

  modalPagamento.show();
}

async function confirmarPagamento() {
  const pedido = {
    clienteNome: document.getElementById("checkoutNome").value.trim(),
    telefone: document.getElementById("checkoutTelefone").value.trim(),
    cep: document.getElementById("checkoutCep").value.trim(),
    rua: document.getElementById("checkoutRua").value.trim(),
    numero: document.getElementById("checkoutNumero").value.trim(),
    bairro: document.getElementById("checkoutBairro").value.trim(),
    cidade: document.getElementById("checkoutCidade").value.trim(),
    complemento: document.getElementById("checkoutComplemento").value.trim(),
    metodoPagamento: document.getElementById("metodoPagamento").value,
    statusPagamento: "Aguardando pagamento",
    statusEntrega: "Pedido recebido",
    total: calcularTotalCarrinho(),
    itens: carrinho.map((item) => ({
      id: item.id,
      nome: item.nome,
      categoria: item.categoria,
      preco: item.preco,
      tamanho: item.tamanho,
      img: item.img,
      quantidade: Number(item.quantidade || 1)
    }))
  };

  if (!pedido.clienteNome || !pedido.telefone || !pedido.cep || !pedido.rua || !pedido.numero || !pedido.bairro || !pedido.cidade) {
    mostrarAviso("Preencha os dados de entrega antes de continuar.");
    return;
  }

  try {
    const resposta = await fetch(PEDIDOS_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pedido)
    });

    const dadosResposta = await resposta.json();

    if (!resposta.ok) {
      throw new Error(dadosResposta.detalhe || dadosResposta.erro || "Não foi possível criar o pedido.");
    }

    localStorage.setItem("resenha_pedido_atual", JSON.stringify(dadosResposta));
    localStorage.removeItem("resenha-carrinho");
    carrinho = [];
    atualizarCarrinho();

    if (pedido.metodoPagamento === "Pix") window.location.href = "pagamento_pix.html";
    else if (pedido.metodoPagamento === "Cartão") window.location.href = "pagamento_cartao_credito.html";
    else window.location.href = "pagamento_boleto.html";
  } catch (error) {
    console.error(error);
    mostrarAviso(error.message || "Não foi possível registrar o pedido agora.");
  }
}

function renderizarTudo() {
  renderizarCategorias();
  renderizarProdutos();
}

categoriasEl.addEventListener("click", (e) => {
  const botao = e.target.closest("[data-categoria]");
  if (!botao) return;
  categoriaAtual = botao.dataset.categoria;
  renderizarTudo();
});

categoriaSelectEl.addEventListener("change", () => {
  categoriaAtual = categoriaSelectEl.value;
  renderizarTudo();
});

buscarEl.addEventListener("input", () => {
  buscarTopoEl.value = buscarEl.value;
  renderizarProdutos();
});

buscarTopoEl.addEventListener("input", () => {
  sincronizarBusca();
  renderizarProdutos();
});

ordenarEl.addEventListener("change", renderizarProdutos);

heroPrev?.addEventListener("click", () => mostrarBanner(bannerAtual - 1));
heroNext?.addEventListener("click", () => mostrarBanner(bannerAtual + 1));

themeToggle?.addEventListener("click", () => {
  aplicarTema(document.body.classList.contains("dark-mode") ? "light" : "dark");
});

document.querySelectorAll("[data-nav-category]").forEach((link) => link.addEventListener("click", (e) => {
  e.preventDefault();
  categoriaAtual = link.dataset.navCategory;
  renderizarTudo();
  bootstrap.Collapse.getOrCreateInstance(document.getElementById("mainMenu")).hide();
  window.scrollTo({ top: document.querySelector(".catalog-shell").offsetTop - 120, behavior: "smooth" });
}));

document.addEventListener("click", (e) => {
  const addBtn = e.target.closest(".add");
  const verBtn = e.target.closest(".ver");
  const produtoMedia = e.target.closest(".ver-produto");

  if (addBtn) {
    const id = addBtn.dataset.id;
    const produto = produtos.find((item) => String(item.id) === String(id));
    const select = document.querySelector(`.tamanho[data-id="${id}"]`);
    const tamanho = select.value;

    if (!produto) {
      mostrarAviso("Produto não encontrado no banco de dados.");
      return;
    }

    if (!produtoDisponivel(produto)) {
      mostrarAviso("Este produto está esgotado.");
      return;
    }

    if (!tamanho) {
      select.style.borderColor = "red";
      mostrarAviso("Escolha um tamanho antes de adicionar ao carrinho.");
      return;
    }

    select.style.borderColor = "";
    adicionarAoCarrinho(produto, tamanho, 1);
  }

  if (verBtn) {
    const produto = produtos.find((item) => String(item.id) === String(verBtn.dataset.id));
    if (produto) abrirDetalhesProduto(produto);
  }

  if (produtoMedia) {
    const produto = produtos.find((item) => String(item.id) === String(produtoMedia.dataset.id));
    if (produto) abrirDetalhesProduto(produto);
  }
});

mThumbs.addEventListener("click", (e) => {
  const thumb = e.target.closest(".detail-thumb");
  if (!thumb) return;
  mImg.src = thumb.dataset.img;
  mThumbs.querySelectorAll(".detail-thumb").forEach((botao) => botao.classList.remove("active"));
  thumb.classList.add("active");
});

mAdd.addEventListener("click", () => {
  if (!produtoAtual) return;

  if (!produtoDisponivel(produtoAtual)) {
    mostrarErroProduto("Este produto está esgotado.", ["quantidade"]);
    return;
  }

  const tamanho = mTamanho.value;
  if (!tamanho) {
    mostrarErroProduto("Escolha um tamanho antes de adicionar ao carrinho.", ["tamanho"]);
    return;
  }

  const quantidade = Number(mQuantidade.value || 1);
  if (!Number.isInteger(quantidade) || quantidade < 1) {
    mostrarErroProduto("Informe uma quantidade válida, começando em 1.", ["quantidade"]);
    return;
  }

  if (adicionarAoCarrinho(produtoAtual, tamanho, quantidade)) {
    limparErroProduto();
    modalProduto.hide();
  }
});

mTamanho.addEventListener("change", limparErroProduto);
mQuantidade.addEventListener("input", limparErroProduto);

document.getElementById("cartModal").addEventListener("show.bs.modal", renderizarCarrinho);
document.getElementById("ano2").innerText = new Date().getFullYear();

async function iniciarPagina() {
  aplicarTema(localStorage.getItem("resenha-tema") || "light");
  carregarBanners();
  await carregarProdutosAPI();
  renderizarTudo();
  atualizarCarrinho();
}

iniciarPagina();
