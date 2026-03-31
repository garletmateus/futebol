const PRODUTOS_API = "/api/produtos";
const PEDIDOS_API = "/api/pedidos";
const produtosPadrao = [
  { nome:"Corinthians", categoria:"Brasileirao", preco:120, img:"./image/corinthianss.webp", desc:"Camisa do Timão", tamanhos:["P","M","G","GG"] },
  { nome:"Flamengo", categoria:"Brasileirao", preco:100, img:"./image/flamengoo.webp", desc:"Camisa rubro-negra", tamanhos:["P","M","G","GG"] },
  { nome:"Fluminense", categoria:"Brasileirao", preco:111, img:"./image/fluminensee.webp", desc:"Camisa tricolor", tamanhos:["P","M","G","GG"] },
  { nome:"Sao Paulo", categoria:"Brasileirao", preco:100, img:"./image/sao paulo.webp", desc:"Camisa paulista", tamanhos:["P","M","G","GG"] },
  { nome:"Atletico MG", categoria:"Brasileirao", preco:100, img:"./image/atletico mgg.webp", desc:"Camisa do Galo", tamanhos:["P","M","G","GG"] },
  { nome:"Bragantino", categoria:"Brasileirao", preco:130, img:"./image/red bull bragantino.webp", desc:"Camisa Red Bull", tamanhos:["P","M","G","GG"] },
  { nome:"Vasco", categoria:"Brasileirao", preco:90, img:"./image/vascoo.webp", desc:"Camisa Vasco", tamanhos:["P","M","G","GG"] },
  { nome:"Palmeiras", categoria:"Brasileirao", preco:110, img:"./image/palmeirass.webp", desc:"Camisa Palmeiras", tamanhos:["P","M","G","GG"] }
];
const labelsCategoria = { Todos:"Todas as categorias", Brasileirao:"Brasileirão", Selecoes:"Seleções", Europa:"Europa" };
const lista = document.getElementById("lista-produtos");
const categoriasEl = document.getElementById("categorias");
const buscarEl = document.getElementById("buscar");
const buscarTopoEl = document.getElementById("buscarTopo");
const categoriaSelectEl = document.getElementById("categoriaSelect");
const ordenarEl = document.getElementById("ordenar");
const contador = document.getElementById("cart-count");
const cartItems = document.getElementById("cart-items");
const cartTotal = document.getElementById("cart-total");
const mTitulo = document.getElementById("mTitulo");
const mCategoria = document.getElementById("mCategoria");
const mImg = document.getElementById("mImg");
const mDesc = document.getElementById("mDesc");
const mPreco = document.getElementById("mPreco");
const mTamanho = document.getElementById("mTamanho");
const mAdd = document.getElementById("mAdd");
const modalProduto = new bootstrap.Modal(document.getElementById("modalProduto"));
const modalPagamento = new bootstrap.Modal(document.getElementById("modalPagamento"));
let produtos = [];
let carrinho = JSON.parse(localStorage.getItem("resenha-carrinho") || "[]");
let categoriaAtual = "Todos";
let produtoAtual = null;

function labelCategoria(categoria) { return labelsCategoria[categoria] || categoria; }
function mostrarAviso(msg) { document.getElementById("toastMensagem").innerText = msg; new bootstrap.Toast(document.getElementById("toastAviso")).show(); }
function formatarPreco(valor) { return Number(valor).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function sincronizarBusca() { buscarEl.value = buscarTopoEl.value; }
function calcularTotalCarrinho() { return carrinho.reduce((total, item) => total + Number(item.preco), 0); }

async function carregarProdutosAPI() {
  try {
    const resposta = await fetch(PRODUTOS_API);
    if (!resposta.ok) throw new Error("Falha ao carregar produtos");
    const dados = await resposta.json();
    produtos = Array.isArray(dados) && dados.length ? dados : [...produtosPadrao];
  } catch (error) {
    console.error(error);
    produtos = [...produtosPadrao];
  }
}

function renderizarCategorias() {
  const categorias = ["Todos", ...new Set(produtos.map((produto) => produto.categoria))];
  categoriaSelectEl.innerHTML = categorias.map((categoria) => `<option value="${categoria}">${labelCategoria(categoria)}</option>`).join("");
  categoriaSelectEl.value = categoriaAtual;
  categoriasEl.innerHTML = categorias.map((categoria) => `<button class="chip ${categoriaAtual === categoria ? "active" : ""}" data-categoria="${categoria}">${labelCategoria(categoria)}</button>`).join("");
}

function obterBuscaAtual() {
  return (buscarEl.value || buscarTopoEl.value || "").trim().toLowerCase();
}

function obterProdutosFiltrados() {
  const busca = obterBuscaAtual();
  let filtrados = [...produtos];
  if (categoriaAtual !== "Todos") filtrados = filtrados.filter((produto) => produto.categoria === categoriaAtual);
  if (busca) filtrados = filtrados.filter((produto) => produto.nome.toLowerCase().includes(busca) || produto.categoria.toLowerCase().includes(busca) || produto.desc.toLowerCase().includes(busca));
  if (ordenarEl.value === "menor-preco") filtrados.sort((a, b) => a.preco - b.preco);
  else if (ordenarEl.value === "maior-preco") filtrados.sort((a, b) => b.preco - a.preco);
  else if (ordenarEl.value === "nome") filtrados.sort((a, b) => a.nome.localeCompare(b.nome));
  return filtrados;
}

function renderizarProdutos() {
  const itens = obterProdutosFiltrados();
  if (!itens.length) {
    lista.innerHTML = `<div class="empty-state">Nenhum produto encontrado para esse filtro.</div>`;
    return;
  }

  lista.innerHTML = itens.map((produto) => `
    <article class="product-card">
      <div class="product-media">
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
        <select class="form-select tamanho mb-2" data-id="${produto.id}">
          <option value="">Escolha o tamanho</option>
          ${produto.tamanhos.map((tamanho) => `<option value="${tamanho}">${tamanho}</option>`).join("")}
        </select>
        <div class="product-actions">
          <button class="btn-shop primary add" data-id="${produto.id}">Adicionar</button>
          <button class="btn-shop ghost ver" data-id="${produto.id}">Ver mais</button>
        </div>
      </div>
    </article>
  `).join("");
}

function atualizarCarrinho() {
  contador.innerText = carrinho.length;
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
    total += Number(item.preco);
    return `
      <div class="cart-item">
        <img src="${item.img}" alt="${item.nome}" class="cart-thumb">
        <div>
          <strong>${item.nome}</strong>
          <div class="text-secondary">Categoria: ${labelCategoria(item.categoria)}</div>
          <div class="text-secondary">Tamanho: ${item.tamanho}</div>
          <div class="fw-bold mt-1">R$ ${formatarPreco(item.preco)}</div>
        </div>
        <button class="btn btn-outline-danger btn-sm" onclick="removerItem(${index})">Remover</button>
      </div>
    `;
  }).join("");

  cartTotal.innerText = formatarPreco(total);
}

function removerItem(index) { carrinho.splice(index, 1); atualizarCarrinho(); }

function abrirDetalhesProduto(produto) {
  produtoAtual = produto;
  mTitulo.innerText = produto.nome;
  mCategoria.innerText = labelCategoria(produto.categoria);
  mImg.src = produto.img;
  mDesc.innerText = produto.desc;
  mPreco.innerText = formatarPreco(produto.preco);
  mTamanho.innerHTML = `<option value="">Escolha o tamanho</option>${produto.tamanhos.map((tamanho) => `<option value="${tamanho}">${tamanho}</option>`).join("")}`;
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
    itens: carrinho.map((item) => ({ id: item.id, nome: item.nome, categoria: item.categoria, preco: item.preco, tamanho: item.tamanho, img: item.img, quantidade: 1 }))
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

    if (!resposta.ok) throw new Error("Não foi possível criar o pedido.");

    const pedidoCriado = await resposta.json();
    localStorage.setItem("resenha_pedido_atual", JSON.stringify(pedidoCriado));
    localStorage.removeItem("resenha-carrinho");
    carrinho = [];
    atualizarCarrinho();

    if (pedido.metodoPagamento === "Pix") window.location.href = "pagamento_pix.html";
    else if (pedido.metodoPagamento === "Cartão") window.location.href = "pagamento_cartao_credito.html";
    else window.location.href = "pagamento_boleto.html";
  } catch (error) {
    console.error(error);
    mostrarAviso("Não foi possível registrar o pedido agora.");
  }
}

function renderizarTudo() { renderizarCategorias(); renderizarProdutos(); }

categoriasEl.addEventListener("click", (e) => {
  const botao = e.target.closest("[data-categoria]");
  if (!botao) return;
  categoriaAtual = botao.dataset.categoria;
  renderizarTudo();
});

categoriaSelectEl.addEventListener("change", () => { categoriaAtual = categoriaSelectEl.value; renderizarTudo(); });
buscarEl.addEventListener("input", () => { buscarTopoEl.value = buscarEl.value; renderizarProdutos(); });
buscarTopoEl.addEventListener("input", () => { sincronizarBusca(); renderizarProdutos(); });
ordenarEl.addEventListener("change", renderizarProdutos);

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

  if (addBtn) {
    const id = addBtn.dataset.id;
    const produto = produtos.find((item) => String(item.id) === String(id));
    const select = document.querySelector(`.tamanho[data-id="${id}"]`);
    const tamanho = select.value;
    if (!tamanho) {
      select.style.borderColor = "red";
      mostrarAviso("Escolha um tamanho antes de adicionar ao carrinho.");
      return;
    }
    select.style.borderColor = "";
    carrinho.push({ ...produto, tamanho });
    atualizarCarrinho();
    mostrarAviso("Produto adicionado ao carrinho.");
  }

  if (verBtn) {
    const produto = produtos.find((item) => String(item.id) === String(verBtn.dataset.id));
    abrirDetalhesProduto(produto);
  }
});

mAdd.addEventListener("click", () => {
  if (!produtoAtual) return;
  const tamanho = mTamanho.value;
  if (!tamanho) {
    mostrarAviso("Escolha um tamanho para continuar.");
    return;
  }
  carrinho.push({ ...produtoAtual, tamanho });
  atualizarCarrinho();
  modalProduto.hide();
  mostrarAviso("Produto adicionado ao carrinho.");
});

document.getElementById("cartModal").addEventListener("show.bs.modal", renderizarCarrinho);
document.getElementById("ano2").innerText = new Date().getFullYear();

async function iniciarPagina() {
  await carregarProdutosAPI();
  renderizarTudo();
  atualizarCarrinho();
}

iniciarPagina();
