const PRODUTOS_API = "/api/produtos";
const PEDIDOS_API = "/api/pedidos";
const PAGAMENTOS_API = "/api/pagamentos";

const SUPABASE_STORAGE =
  "https://yznprlbydruwtdgqwykh.supabase.co/storage/v1/object/public/image/";

const labelsCategoria = {
  Todos: "Todas as categorias",
  Brasileirao: "Brasileirão",
  Selecoes: "Seleções",
  Europa: "Europa"
};

// ============================================================
// ELEMENTOS
// ============================================================

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

const modalProdutoEl = document.getElementById("modalProduto");
const modalPagamentoEl = document.getElementById("modalPagamento");

const modalProduto = modalProdutoEl
  ? new bootstrap.Modal(modalProdutoEl)
  : null;

const modalPagamento = modalPagamentoEl
  ? new bootstrap.Modal(modalPagamentoEl)
  : null;

// ============================================================
// ESTADO
// ============================================================

let produtos = [];

let carrinho = JSON.parse(
  localStorage.getItem("resenha-carrinho") || "[]"
);

let categoriaAtual = "Todos";
let produtoAtual = null;
let falhaAoCarregarProdutos = false;

let bannersCarregados = [
  "./image/banner-brasileirao.webp"
];

let bannerAtual = 0;

// ============================================================
// TEMA
// ============================================================

function aplicarTema(tema) {
  const escuro = tema === "dark";

  document.body.classList.toggle("dark-mode", escuro);

  themeToggle?.classList.toggle("active", escuro);

  if (themeLabel) {
    themeLabel.innerText = escuro
      ? "Modo claro"
      : "Modo escuro";
  }

  localStorage.setItem(
    "resenha-tema",
    escuro ? "dark" : "light"
  );
}

// ============================================================
// IMAGENS
// ============================================================

function testarImagem(src) {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }

    const img = new Image();

    img.onload = () => resolve(src);

    img.onerror = () => {
      console.warn("Imagem não encontrada:", src);
      resolve(null);
    };

    img.src = src;
  });
}

function normalizarImagemSupabase(src) {
  if (!src) {
    return "";
  }

  const valor = String(src).trim();

  /*
   * Se o banco já possui uma URL completa,
   * mantém exatamente essa URL.
   */
  if (/^https?:\/\//i.test(valor)) {
    return valor;
  }

  /*
   * Se vier algo como:
   * /image/vasco01.webp
   *
   * pega somente o nome do arquivo.
   */
  const nomeArquivo = valor
    .replace(/\\/g, "/")
    .split("/")
    .pop();

  if (!nomeArquivo) {
    return "";
  }

  return (
    SUPABASE_STORAGE +
    encodeURIComponent(nomeArquivo)
  );
}

async function obterImagensAutomaticas(produto) {
  const imagemPrincipal = normalizarImagemSupabase(
    produto.img
  );

  if (!imagemPrincipal) {
    return [];
  }

  /*
   * Já é uma URL válida.
   */
  const nomeArquivo = decodeURIComponent(
    imagemPrincipal.split("/").pop()
  );

  /*
   * Exemplo:
   * vasco01.webp
   *
   * procura:
   * vasco01.webp
   * vasco02.webp
   * vasco03.webp
   */

  const match = nomeArquivo.match(
    /^(.*?)(01)(\.[^.]+)$/i
  );

  if (!match) {
    return [imagemPrincipal];
  }

  const prefixo = match[1];
  const extensao = match[3];

  const candidatos = [
    `${prefixo}01${extensao}`,
    `${prefixo}02${extensao}`,
    `${prefixo}03${extensao}`
  ].map(
    (nome) =>
      SUPABASE_STORAGE +
      encodeURIComponent(nome)
  );

  const encontrados = await Promise.all(
    candidatos.map(testarImagem)
  );

  return encontrados.filter(Boolean);
}

async function obterImagensProduto(produto) {
  if (
    Array.isArray(produto.imagens) &&
    produto.imagens.length
  ) {
    return produto.imagens
      .map(normalizarImagemSupabase)
      .filter(Boolean);
  }

  return await obterImagensAutomaticas(produto);
}

// ============================================================
// BANNERS
// ============================================================

async function carregarBanners() {
  if (!heroBanner) {
    return;
  }

  const nomes = [
    "ban",
    "banner 2",
    "banner2"
  ];

  const extensoes = [
    "webp",
    "jpg",
    "jpeg",
    "png"
  ];

  const candidatos = [
    "./image/banner-brasileirao.webp",

    ...nomes.flatMap(
      (nome) =>
        extensoes.map(
          (ext) =>
            `./image/${nome}.${ext}`
        )
    )
  ];

  const encontrados = (
    await Promise.all(
      candidatos.map(testarImagem)
    )
  ).filter(Boolean);

  bannersCarregados = [
    ...new Set(encontrados)
  ];

  if (!bannersCarregados.length) {
    bannersCarregados = [
      "./image/banner-brasileirao.webp"
    ];
  }

  mostrarBanner(0);

  if (bannersCarregados.length > 1) {
    setInterval(() => {
      mostrarBanner(bannerAtual + 1);
    }, 5000);
  }
}

function mostrarBanner(index) {
  if (
    !heroBanner ||
    !bannersCarregados.length
  ) {
    return;
  }

  bannerAtual =
    (index + bannersCarregados.length) %
    bannersCarregados.length;

  heroBanner.style.backgroundImage =
    `url("${bannersCarregados[bannerAtual]}")`;
}

// ============================================================
// UTILITÁRIOS
// ============================================================

function labelCategoria(categoria) {
  return (
    labelsCategoria[categoria] ||
    categoria ||
    ""
  );
}

function mostrarAviso(msg) {
  const toastMensagem =
    document.getElementById("toastMensagem");

  const toastAviso =
    document.getElementById("toastAviso");

  if (!toastMensagem || !toastAviso) {
    console.warn(msg);
    return;
  }

  toastMensagem.innerText = msg;

  new bootstrap.Toast(toastAviso).show();
}

function limparErroProduto() {
  if (!mErroProduto) return;

  mErroProduto.classList.add("d-none");
  mErroProduto.innerText = "";

  mTamanho?.classList.remove("is-invalid");
  mQuantidade?.classList.remove("is-invalid");
}

function mostrarErroProduto(
  msg,
  campos = []
) {
  if (!mErroProduto) {
    mostrarAviso(msg);
    return;
  }

  const modalAberto =
    document
      .getElementById("modalProduto")
      ?.classList.contains("show");

  if (!modalAberto) {
    mostrarAviso(msg);
    return;
  }

  mErroProduto.innerText = msg;

  mErroProduto.classList.remove(
    "d-none"
  );

  if (
    campos.includes("tamanho")
  ) {
    mTamanho?.classList.add(
      "is-invalid"
    );
  }

  if (
    campos.includes("quantidade")
  ) {
    mQuantidade?.classList.add(
      "is-invalid"
    );
  }

  mErroProduto.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });

  mostrarAviso(msg);
}

function formatarPreco(valor) {
  return Number(valor).toLocaleString(
    "pt-BR",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  );
}

function obterEstoque(produto) {
  return Number(
    produto?.estoque || 0
  );
}

function produtoDisponivel(produto) {
  return obterEstoque(produto) > 0;
}

function textoEstoque(produto) {
  const estoque =
    obterEstoque(produto);

  if (estoque <= 0) {
    return "Produto esgotado";
  }

  return estoque === 1
    ? "1 peça disponível"
    : `${estoque} peças disponíveis`;
}

function medidasPorTamanho(tamanho) {
  const tabela = {
    P: ["52 cm", "69 cm"],
    M: ["55 cm", "71 cm"],
    G: ["58 cm", "73 cm"],
    GG: ["61 cm", "75 cm"],
    XG: ["64 cm", "78 cm"]
  };

  return (
    tabela[tamanho] || [
      "Consultar",
      "Consultar"
    ]
  );
}

function descricaoCompletaProduto(produto) {
  return `${produto.desc || ""} Produto feito para quem gosta de camisa de futebol com bom caimento, visual bonito e uso confortável no dia a dia. A peça combina com treino, resenha com os amigos, jogo no estádio ou para completar a coleção. Confira o tamanho antes de comprar e escolha a quantidade desejada conforme o estoque disponível.`;
}

// ============================================================
// CARRINHO
// ============================================================

function calcularTotalCarrinho() {
  return carrinho.reduce(
    (total, item) =>
      total +
      Number(item.preco) *
        Number(item.quantidade || 1),
    0
  );
}

function adicionarAoCarrinho(
  produto,
  tamanho,
  quantidade = 1
) {
  const qtd = Math.max(
    1,
    Number(quantidade || 1)
  );

  const estoque =
    obterEstoque(produto);

  if (qtd > estoque) {
    mostrarErroProduto(
      `Só temos ${estoque} peça${
        estoque === 1 ? "" : "s"
      } disponível${
        estoque === 1 ? "" : "is"
      } desse produto. Diminua a quantidade para continuar.`,
      ["quantidade"]
    );

    return false;
  }

  const itemExistente =
    carrinho.find(
      (item) =>
        String(item.id) ===
          String(produto.id) &&
        item.tamanho === tamanho
    );

  const quantidadeAtual =
    Number(
      itemExistente?.quantidade || 0
    );

  if (
    quantidadeAtual + qtd >
    estoque
  ) {
    mostrarErroProduto(
      `Você já tem ${quantidadeAtual} no carrinho. O estoque desse produto é ${estoque}.`,
      ["quantidade"]
    );

    return false;
  }

  if (itemExistente) {
    itemExistente.quantidade =
      quantidadeAtual + qtd;
  } else {
    carrinho.push({
      ...produto,
      tamanho,
      quantidade: qtd
    });
  }

  atualizarCarrinho();

  mostrarAviso(
    qtd === 1
      ? "Produto adicionado ao carrinho."
      : "Produtos adicionados ao carrinho."
  );

  return true;
}

function atualizarCarrinho() {
  if (contador) {
    contador.innerText =
      carrinho.reduce(
        (total, item) =>
          total +
          Number(item.quantidade || 1),
        0
      );
  }

  localStorage.setItem(
    "resenha-carrinho",
    JSON.stringify(carrinho)
  );

  renderizarCarrinho();
}

function renderizarCarrinho() {
  if (!cartItems || !cartTotal) {
    return;
  }

  if (!carrinho.length) {
    cartItems.innerHTML =
      `<div class="empty-state">Seu carrinho está vazio.</div>`;

    cartTotal.innerText =
      formatarPreco(0);

    return;
  }

  let total = 0;

  cartItems.innerHTML =
    carrinho
      .map((item, index) => {
        const quantidade =
          Number(
            item.quantidade || 1
          );

        const subtotal =
          Number(item.preco) *
          quantidade;

        total += subtotal;

        return `
          <div class="cart-item">

            <img
              src="${normalizarImagemSupabase(
                item.img
              )}"
              alt="${item.nome}"
              class="cart-thumb"
            >

            <div>
              <strong>${item.nome}</strong>

              <div class="text-secondary">
                Categoria:
                ${labelCategoria(
                  item.categoria
                )}
              </div>

              <div class="text-secondary">
                Tamanho: ${item.tamanho}
              </div>

              <div class="text-secondary">
                Quantidade: ${quantidade}
              </div>

              <div class="fw-bold mt-1">
                R$ ${formatarPreco(
                  subtotal
                )}
              </div>
            </div>

            <button
              class="btn btn-outline-danger btn-sm"
              onclick="removerItem(${index})"
            >
              Remover
            </button>

          </div>
        `;
      })
      .join("");

  cartTotal.innerText =
    formatarPreco(total);
}

function removerItem(index) {
  carrinho.splice(index, 1);
  atualizarCarrinho();
}

// ============================================================
// PRODUTOS — API
// ============================================================

async function carregarProdutosAPI() {
  falhaAoCarregarProdutos = false;

  try {
    console.log(
      "===================================="
    );

    console.log(
      "🔄 CARREGANDO PRODUTOS"
    );

    console.log(
      "📡 API:",
      PRODUTOS_API
    );

    const resposta = await fetch(
      PRODUTOS_API,
      {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json"
        }
      }
    );

    console.log(
      "📡 Status:",
      resposta.status
    );

    console.log(
      "📡 URL final:",
      resposta.url
    );

    /*
     * Primeiro lê como TEXTO.
     *
     * Isso evita o erro:
     *
     * Unexpected token ...
     *
     * quando a Vercel retorna uma página
     * de erro em HTML em vez de JSON.
     */
    const texto =
      await resposta.text();

    console.log(
      "📦 Resposta da API:",
      texto.substring(0, 500)
    );

    let dados;

    try {
      dados = JSON.parse(texto);
    } catch (erroJSON) {
      throw new Error(
        `A API não retornou JSON. Status HTTP: ${resposta.status}. Resposta: ${texto.substring(
          0,
          200
        )}`
      );
    }

    if (!resposta.ok) {
      throw new Error(
        dados?.detalhe ||
          dados?.erro ||
          `Erro HTTP ${resposta.status} ao carregar produtos.`
      );
    }

    if (!Array.isArray(dados)) {
      throw new Error(
        "A API respondeu, mas não retornou uma lista de produtos."
      );
    }

    /*
     * Normaliza os dados vindos do PostgreSQL/Supabase.
     */
    produtos = dados.map(
      (produto) => {
        let tamanhos =
          produto.tamanhos;

        /*
         * PostgreSQL/Supabase pode retornar
         * JSON como array ou como string.
         */
        if (
          typeof tamanhos ===
          "string"
        ) {
          try {
            tamanhos =
              JSON.parse(tamanhos);
          } catch {
            tamanhos = [
              "P",
              "M",
              "G",
              "GG"
            ];
          }
        }

        if (
          !Array.isArray(
            tamanhos
          )
        ) {
          tamanhos = [
            "P",
            "M",
            "G",
            "GG"
          ];
        }

        return {
          ...produto,

          id: Number(
            produto.id
          ),

          preco: Number(
            produto.preco || 0
          ),

          estoque: Number(
            produto.estoque || 0
          ),

          tamanhos,

          /*
           * IMPORTANTE:
           * se a API já retornar a URL do Supabase,
           * ela será mantida.
           */
          img:
            normalizarImagemSupabase(
              produto.img
            )
        };
      }
    );

    console.log(
      `✅ ${produtos.length} produtos carregados.`
    );

    if (produtos.length > 0) {
      console.log(
        "🛍️ Primeiro produto:",
        produtos[0]
      );

      console.log(
        "🖼️ URL da primeira imagem:",
        produtos[0].img
      );
    }

    console.log(
      "===================================="
    );

  } catch (error) {
    console.error(
      "❌ ERRO AO CARREGAR PRODUTOS:",
      error
    );

    produtos = [];

    falhaAoCarregarProdutos = true;

    mostrarAviso(
      error.message ||
        "Não foi possível carregar os produtos do banco."
    );
  }
}

// ============================================================
// CATEGORIAS
// ============================================================

function renderizarCategorias() {
  if (
    !categoriaSelectEl ||
    !categoriasEl
  ) {
    return;
  }

  const categorias = [
    "Todos",
    ...new Set(
      produtos
        .map(
          (produto) =>
            produto.categoria
        )
        .filter(Boolean)
    )
  ];

  categoriaSelectEl.innerHTML =
    categorias
      .map(
        (categoria) =>
          `<option value="${categoria}">
            ${labelCategoria(
              categoria
            )}
          </option>`
      )
      .join("");

  if (
    categorias.includes(
      categoriaAtual
    )
  ) {
    categoriaSelectEl.value =
      categoriaAtual;
  } else {
    categoriaAtual =
      "Todos";

    categoriaSelectEl.value =
      "Todos";
  }

  categoriasEl.innerHTML =
    categorias
      .map(
        (categoria) =>
          `<button
            type="button"
            class="chip ${
              categoriaAtual ===
              categoria
                ? "active"
                : ""
            }"
            data-categoria="${categoria}"
          >
            ${labelCategoria(
              categoria
            )}
          </button>`
      )
      .join("");
}

// ============================================================
// BUSCA
// ============================================================

function sincronizarBusca() {
  if (
    buscarEl &&
    buscarTopoEl
  ) {
    buscarEl.value =
      buscarTopoEl.value;
  }
}

function obterBuscaAtual() {
  return (
    buscarEl?.value ||
    buscarTopoEl?.value ||
    ""
  )
    .trim()
    .toLowerCase();
}

// ============================================================
// FILTROS
// ============================================================

function obterProdutosFiltrados() {
  const busca =
    obterBuscaAtual();

  let filtrados = [
    ...produtos
  ];

  if (
    categoriaAtual !==
    "Todos"
  ) {
    filtrados =
      filtrados.filter(
        (produto) =>
          produto.categoria ===
          categoriaAtual
      );
  }

  if (busca) {
    filtrados =
      filtrados.filter(
        (produto) => {
          const nome =
            String(
              produto.nome || ""
            ).toLowerCase();

          const categoria =
            String(
              produto.categoria ||
                ""
            ).toLowerCase();

          const descricao =
            String(
              produto.desc || ""
            ).toLowerCase();

          return (
            nome.includes(
              busca
            ) ||
            categoria.includes(
              busca
            ) ||
            descricao.includes(
              busca
            )
          );
        }
      );
  }

  if (
    ordenarEl?.value ===
    "menor-preco"
  ) {
    filtrados.sort(
      (a, b) =>
        Number(a.preco) -
        Number(b.preco)
    );
  } else if (
    ordenarEl?.value ===
    "maior-preco"
  ) {
    filtrados.sort(
      (a, b) =>
        Number(b.preco) -
        Number(a.preco)
    );
  } else if (
    ordenarEl?.value ===
    "nome"
  ) {
    filtrados.sort(
      (a, b) =>
        String(a.nome || "")
          .localeCompare(
            String(
              b.nome || ""
            )
          )
    );
  }

  return filtrados;
}

// ============================================================
// RENDERIZAR PRODUTOS
// ============================================================

function renderizarProdutos() {
  if (!lista) {
    console.error(
      "❌ Elemento #lista-produtos não encontrado no HTML."
    );

    return;
  }

  if (
    falhaAoCarregarProdutos
  ) {
    lista.innerHTML = `
      <div class="empty-state">
        Não foi possível carregar os produtos do banco de dados.
      </div>
    `;

    return;
  }

  const itens =
    obterProdutosFiltrados();

  if (!itens.length) {
    lista.innerHTML = `
      <div class="empty-state">
        Nenhum produto encontrado para esse filtro.
      </div>
    `;

    return;
  }

  lista.innerHTML =
    itens
      .map(
        (produto) => {
          const preco =
            Number(
              produto.preco || 0
            );

          const precoAntigo =
            preco / 0.86;

          const imagem =
            normalizarImagemSupabase(
              produto.img
            );

          const tamanhos =
            Array.isArray(
              produto.tamanhos
            )
              ? produto.tamanhos
              : [
                  "P",
                  "M",
                  "G",
                  "GG"
                ];

          return `
            <article class="product-card">

              <div
                class="product-media ver-produto"
                data-id="${produto.id}"
              >

                <img
                  src="${imagem}"
                  alt="${produto.nome}"
                  loading="lazy"
                  onerror="this.onerror=null; this.src='${imagem}'"
                >

                <span class="badge-tag">
                  ${labelCategoria(
                    produto.categoria
                  )}
                </span>

              </div>

              <div class="product-body">

                <div class="product-highlight">
                  Personalize
                </div>

                <h3 class="product-name">
                  ${produto.nome}
                </h3>

                <p class="product-desc">
                  ${produto.desc || ""}
                </p>

                <div class="price-box">

                  <div class="pix-price">
                    R$ ${formatarPreco(
                      preco
                    )}
                    no Pix
                  </div>

                  <div class="old-price-row">

                    <span class="old-price">
                      R$ ${formatarPreco(
                        precoAntigo
                      )}
                    </span>

                    <span class="discount">
                      14% off
                    </span>

                  </div>

                </div>

                <div class="product-rating">

                  <div class="stars">
                    ★★★★★
                  </div>

                  <span class="rating-value">
                    5.00
                  </span>

                </div>

                <div class="product-meta">

                  <div class="sizes">
                    ${tamanhos.join(
                      " • "
                    )}
                  </div>

                </div>

                <select
                  class="form-select tamanho mb-2"
                  data-id="${produto.id}"
                  ${
                    produtoDisponivel(
                      produto
                    )
                      ? ""
                      : "disabled"
                  }
                >

                  <option value="">
                    Escolha o tamanho
                  </option>

                  ${tamanhos
                    .map(
                      (tamanho) =>
                        `<option value="${tamanho}">
                          ${tamanho}
                        </option>`
                    )
                    .join("")}

                </select>

                <div class="product-actions">

                  <button
                    type="button"
                    class="btn-shop primary add"
                    data-id="${produto.id}"
                    ${
                      produtoDisponivel(
                        produto
                      )
                        ? ""
                        : "disabled"
                    }
                  >
                    ${
                      produtoDisponivel(
                        produto
                      )
                        ? "Adicionar"
                        : "Esgotado"
                    }
                  </button>

                  <button
                    type="button"
                    class="btn-shop ghost ver"
                    data-id="${produto.id}"
                  >
                    Ver mais
                  </button>

                </div>

              </div>

            </article>
          `;
        }
      )
      .join("");
}

// ============================================================
// DETALHES DO PRODUTO
// ============================================================

async function abrirDetalhesProduto(
  produto
) {
  if (!produto) {
    return;
  }

  if (!modalProduto) {
    console.error(
      "Modal do produto não encontrado."
    );

    return;
  }

  produtoAtual =
    produto;

  limparErroProduto();

  if (mBreadcrumb) {
    mBreadcrumb.innerText =
      `Início / Camisas / ${labelCategoria(
        produto.categoria
      )}`;
  }

  if (mTitulo) {
    mTitulo.innerText =
      produto.nome;
  }

  if (mNomeCompleto) {
    mNomeCompleto.innerText =
      `${produto.nome} - Camisa ${labelCategoria(
        produto.categoria
      )}`;
  }

  if (mCategoria) {
    mCategoria.innerText =
      labelCategoria(
        produto.categoria
      );
  }

  const imagemPrincipal =
    normalizarImagemSupabase(
      produto.img
    );

  if (mImg) {
    mImg.src =
      imagemPrincipal;

    mImg.alt =
      produto.nome;
  }

  const imagensProduto =
    await obterImagensProduto(
      produto
    );

  if (mImg) {
    mImg.src =
      imagensProduto[0] ||
      imagemPrincipal;
  }

  if (mThumbs) {
    mThumbs.innerHTML =
      imagensProduto
        .map(
          (img, index) => `
            <button
              class="detail-thumb ${
                index === 0
                  ? "active"
                  : ""
              }"
              type="button"
              data-img="${img}"
            >

              <img
                src="${img}"
                alt="${produto.nome}"
              >

            </button>
          `
        )
        .join("");
  }

  if (mDesc) {
    mDesc.innerText =
      produto.desc || "";
  }

  if (mDescricaoCompleta) {
    mDescricaoCompleta.innerText =
      descricaoCompletaProduto(
        produto
      );
  }

  if (mPreco) {
    mPreco.innerText =
      formatarPreco(
        produto.preco
      );
  }

  if (mEstoque) {
    mEstoque.innerText =
      textoEstoque(
        produto
      );
  }

  if (mEstoqueBox) {
    mEstoqueBox.className =
      `stock-box mb-3 ${
        produtoDisponivel(
          produto
        )
          ? ""
          : "out"
      }`;
  }

  const tamanhos =
    Array.isArray(
      produto.tamanhos
    )
      ? produto.tamanhos
      : [
          "P",
          "M",
          "G",
          "GG"
        ];

  if (mTamanho) {
    mTamanho.innerHTML =
      `<option value="">
        Escolha o tamanho
      </option>
      ${tamanhos
        .map(
          (tamanho) =>
            `<option value="${tamanho}">
              ${tamanho}
            </option>`
        )
        .join("")}`;

    mTamanho.disabled =
      !produtoDisponivel(
        produto
      );
  }

  if (mTabelaTamanhos) {
    mTabelaTamanhos.innerHTML =
      tamanhos
        .map(
          (tamanho) => {
            const [
              largura,
              altura
            ] =
              medidasPorTamanho(
                tamanho
              );

            return `
              <tr>
                <td>${tamanho}</td>
                <td>${largura}</td>
                <td>${altura}</td>
              </tr>
            `;
          }
        )
        .join("");
  }

  if (mQuantidade) {
    mQuantidade.value = 1;

    mQuantidade.max =
      obterEstoque(
        produto
      );

    mQuantidade.disabled =
      !produtoDisponivel(
        produto
      );
  }

  if (mAdd) {
    mAdd.disabled =
      !produtoDisponivel(
        produto
      );

    mAdd.innerText =
      produtoDisponivel(
        produto
      )
        ? "Adicionar ao carrinho"
        : "Produto esgotado";
  }

  modalProduto.show();
}

// ============================================================
// PAGAMENTO
// ============================================================

function abrirPagamento() {
  if (!carrinho.length) {
    mostrarAviso(
      "Adicione pelo menos um item ao carrinho antes de finalizar."
    );

    return;
  }

  if (modalPagamento) {
    modalPagamento.show();
  }
}

async function abrirCheckoutMercadoPago(
  pedidoCriado,
  itens
) {
  const resposta =
    await fetch(
      `${PAGAMENTOS_API}/mercadopago`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({
          pedidoId:
            pedidoCriado.id,

          itens
        })
      }
    );

  const texto =
    await resposta.text();

  let dadosPagamento;

  try {
    dadosPagamento =
      JSON.parse(texto);
  } catch {
    throw new Error(
      "O servidor de pagamento não retornou JSON."
    );
  }

  if (!resposta.ok) {
    throw new Error(
      dadosPagamento.detalhe ||
        dadosPagamento.erro ||
        "Não foi possível iniciar o Mercado Pago."
    );
  }

  const checkoutUrl =
    dadosPagamento.sandboxInitPoint ||
    dadosPagamento.initPoint;

  if (!checkoutUrl) {
    throw new Error(
      "Mercado Pago não retornou o link de pagamento."
    );
  }

  window.location.href =
    checkoutUrl;
}

async function confirmarPagamento() {
  const pedido = {
    clienteNome:
      document
        .getElementById(
          "checkoutNome"
        )
        ?.value.trim() || "",

    telefone:
      document
        .getElementById(
          "checkoutTelefone"
        )
        ?.value.trim() || "",

    cep:
      document
        .getElementById(
          "checkoutCep"
        )
        ?.value.trim() || "",

    rua:
      document
        .getElementById(
          "checkoutRua"
        )
        ?.value.trim() || "",

    numero:
      document
        .getElementById(
          "checkoutNumero"
        )
        ?.value.trim() || "",

    bairro:
      document
        .getElementById(
          "checkoutBairro"
        )
        ?.value.trim() || "",

    cidade:
      document
        .getElementById(
          "checkoutCidade"
        )
        ?.value.trim() || "",

    complemento:
      document
        .getElementById(
          "checkoutComplemento"
        )
        ?.value.trim() || "",

    metodoPagamento:
      document.getElementById(
        "metodoPagamento"
      )?.value || "",

    statusPagamento:
      "Aguardando pagamento",

    statusEntrega:
      "Pedido recebido",

    total:
      calcularTotalCarrinho(),

    itens:
      carrinho.map(
        (item) => ({
          id: item.id,
          nome: item.nome,
          categoria:
            item.categoria,
          preco: item.preco,
          tamanho:
            item.tamanho,

          img:
            normalizarImagemSupabase(
              item.img
            ),

          quantidade:
            Number(
              item.quantidade ||
                1
            )
        })
      )
  };

  if (!pedido.itens.length) {
    mostrarAviso(
      "Adicione pelo menos um item ao carrinho antes de finalizar."
    );

    return;
  }

  if (
    !pedido.total ||
    pedido.total <= 0
  ) {
    mostrarAviso(
      "O total do carrinho está inválido. Remova o item e adicione novamente."
    );

    return;
  }

  if (
    !pedido.clienteNome ||
    !pedido.telefone ||
    !pedido.cep ||
    !pedido.rua ||
    !pedido.numero ||
    !pedido.bairro ||
    !pedido.cidade
  ) {
    mostrarAviso(
      "Preencha nome, telefone, CEP, rua, número, bairro e cidade."
    );

    return;
  }

  if (!pedido.metodoPagamento) {
    mostrarAviso(
      "Escolha uma forma de pagamento."
    );

    return;
  }

  try {
    const resposta =
      await fetch(
        PEDIDOS_API,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify(
              pedido
            )
        }
      );

    const texto =
      await resposta.text();

    let dadosResposta;

    try {
      dadosResposta =
        JSON.parse(texto);
    } catch {
      throw new Error(
        "O servidor de pedidos não retornou JSON."
      );
    }

    if (!resposta.ok) {
      throw new Error(
        dadosResposta.detalhe ||
          dadosResposta.erro ||
          "Não foi possível criar o pedido."
      );
    }

    if (
      pedido.metodoPagamento ===
      "Mercado Pago"
    ) {
      localStorage.setItem(
        "resenha_pedido_atual",
        JSON.stringify(
          dadosResposta
        )
      );

      await abrirCheckoutMercadoPago(
        dadosResposta,
        pedido.itens
      );

      return;
    }

    localStorage.setItem(
      "resenha_pedido_atual",
      JSON.stringify(
        dadosResposta
      )
    );

    localStorage.removeItem(
      "resenha-carrinho"
    );

    carrinho = [];

    atualizarCarrinho();

    if (
      pedido.metodoPagamento ===
      "Pix"
    ) {
      window.location.href =
        "pagamento_pix.html";
    } else if (
      pedido.metodoPagamento ===
      "Cartão"
    ) {
      window.location.href =
        "pagamento_cartao_credito.html";
    } else {
      window.location.href =
        "pagamento_boleto.html";
    }

  } catch (error) {
    console.error(
      "Erro ao confirmar pagamento:",
      error
    );

    mostrarAviso(
      error.message ||
        "Não foi possível registrar o pedido agora."
    );
  }
}

// ============================================================
// RENDERIZAR TUDO
// ============================================================

function renderizarTudo() {
  renderizarCategorias();
  renderizarProdutos();
}

// ============================================================
// EVENTOS — CATEGORIAS
// ============================================================

categoriasEl?.addEventListener(
  "click",
  (e) => {
    const botao =
      e.target.closest(
        "[data-categoria]"
      );

    if (!botao) {
      return;
    }

    categoriaAtual =
      botao.dataset.categoria;

    renderizarTudo();
  }
);

categoriaSelectEl?.addEventListener(
  "change",
  () => {
    categoriaAtual =
      categoriaSelectEl.value;

    renderizarTudo();
  }
);

// ============================================================
// EVENTOS — BUSCA
// ============================================================

buscarEl?.addEventListener(
  "input",
  () => {
    if (buscarTopoEl) {
      buscarTopoEl.value =
        buscarEl.value;
    }

    renderizarProdutos();
  }
);

buscarTopoEl?.addEventListener(
  "input",
  () => {
    sincronizarBusca();

    renderizarProdutos();
  }
);

// ============================================================
// EVENTOS — ORDENAÇÃO
// ============================================================

ordenarEl?.addEventListener(
  "change",
  renderizarProdutos
);

// ============================================================
// EVENTOS — BANNER
// ============================================================

heroPrev?.addEventListener(
  "click",
  () =>
    mostrarBanner(
      bannerAtual - 1
    )
);

heroNext?.addEventListener(
  "click",
  () =>
    mostrarBanner(
      bannerAtual + 1
    )
);

// ============================================================
// EVENTOS — TEMA
// ============================================================

themeToggle?.addEventListener(
  "click",
  () => {
    aplicarTema(
      document.body.classList.contains(
        "dark-mode"
      )
        ? "light"
        : "dark"
    );
  }
);

// ============================================================
// EVENTOS — MENU
// ============================================================

document
  .querySelectorAll(
    "[data-nav-category]"
  )
  .forEach(
    (link) =>
      link.addEventListener(
        "click",
        (e) => {
          e.preventDefault();

          categoriaAtual =
            link.dataset.navCategory;

          renderizarTudo();

          const mainMenu =
            document.getElementById(
              "mainMenu"
            );

          if (
            mainMenu &&
            window.bootstrap
          ) {
            bootstrap.Collapse
              .getOrCreateInstance(
                mainMenu
              )
              .hide();
          }

          const catalogShell =
            document.querySelector(
              ".catalog-shell"
            );

          if (
            catalogShell
          ) {
            window.scrollTo({
              top:
                catalogShell.offsetTop -
                120,

              behavior:
                "smooth"
            });
          }
        }
      )
  );

// ============================================================
// CLIQUES DOS PRODUTOS
// ============================================================

document.addEventListener(
  "click",
  (e) => {
    const addBtn =
      e.target.closest(
        ".add"
      );

    const verBtn =
      e.target.closest(
        ".ver"
      );

    const produtoMedia =
      e.target.closest(
        ".ver-produto"
      );

    // --------------------------------------------------------
    // ADICIONAR AO CARRINHO
    // --------------------------------------------------------

    if (addBtn) {
      const id =
        addBtn.dataset.id;

      const produto =
        produtos.find(
          (item) =>
            String(item.id) ===
            String(id)
        );

      const select =
        document.querySelector(
          `.tamanho[data-id="${id}"]`
        );

      if (!produto) {
        mostrarAviso(
          "Produto não encontrado no banco de dados."
        );

        return;
      }

      if (
        !produtoDisponivel(
          produto
        )
      ) {
        mostrarAviso(
          "Este produto está esgotado."
        );

        return;
      }

      if (!select) {
        mostrarAviso(
          "Não foi possível encontrar o seletor de tamanho."
        );

        return;
      }

      const tamanho =
        select.value;

      if (!tamanho) {
        select.style.borderColor =
          "red";

        mostrarAviso(
          "Escolha um tamanho antes de adicionar ao carrinho."
        );

        return;
      }

      select.style.borderColor =
        "";

      adicionarAoCarrinho(
        produto,
        tamanho,
        1
      );
    }

    // --------------------------------------------------------
    // VER MAIS
    // --------------------------------------------------------

    if (verBtn) {
      const produto =
        produtos.find(
          (item) =>
            String(item.id) ===
            String(
              verBtn.dataset.id
            )
        );

      if (produto) {
        abrirDetalhesProduto(
          produto
        );
      }
    }

    // --------------------------------------------------------
    // CLICAR NA IMAGEM
    // --------------------------------------------------------

    if (produtoMedia) {
      const produto =
        produtos.find(
          (item) =>
            String(item.id) ===
            String(
              produtoMedia.dataset.id
            )
        );

      if (produto) {
        abrirDetalhesProduto(
          produto
        );
      }
    }
  }
);

// ============================================================
// MINIATURAS
// ============================================================

mThumbs?.addEventListener(
  "click",
  (e) => {
    const thumb =
      e.target.closest(
        ".detail-thumb"
      );

    if (!thumb) {
      return;
    }

    if (mImg) {
      mImg.src =
        thumb.dataset.img;
    }

    mThumbs
      .querySelectorAll(
        ".detail-thumb"
      )
      .forEach(
        (botao) =>
          botao.classList.remove(
            "active"
          )
      );

    thumb.classList.add(
      "active"
    );
  }
);

// ============================================================
// BOTÃO ADICIONAR DO MODAL
// ============================================================

mAdd?.addEventListener(
  "click",
  () => {
    if (!produtoAtual) {
      return;
    }

    if (
      !produtoDisponivel(
        produtoAtual
      )
    ) {
      mostrarErroProduto(
        "Este produto está esgotado.",
        ["quantidade"]
      );

      return;
    }

    const tamanho =
      mTamanho?.value;

    if (!tamanho) {
      mostrarErroProduto(
        "Escolha um tamanho antes de adicionar ao carrinho.",
        ["tamanho"]
      );

      return;
    }

    const quantidade =
      Number(
        mQuantidade?.value ||
          1
      );

    if (
      !Number.isInteger(
        quantidade
      ) ||
      quantidade < 1
    ) {
      mostrarErroProduto(
        "Informe uma quantidade válida, começando em 1.",
        ["quantidade"]
      );

      return;
    }

    if (
      adicionarAoCarrinho(
        produtoAtual,
        tamanho,
        quantidade
      )
    ) {
      limparErroProduto();

      modalProduto?.hide();
    }
  }
);

mTamanho?.addEventListener(
  "change",
  limparErroProduto
);

mQuantidade?.addEventListener(
  "input",
  limparErroProduto
);

// ============================================================
// MODAL CARRINHO
// ============================================================

document
  .getElementById(
    "cartModal"
  )
  ?.addEventListener(
    "show.bs.modal",
    renderizarCarrinho
  );

// ============================================================
// ANO
// ============================================================

const ano2 =
  document.getElementById(
    "ano2"
  );

if (ano2) {
  ano2.innerText =
    new Date().getFullYear();
}

// ============================================================
// INICIAR PÁGINA
// ============================================================

async function iniciarPagina() {
  console.log(
    "🚀 Iniciando Resenha Sports..."
  );

  aplicarTema(
    localStorage.getItem(
      "resenha-tema"
    ) || "light"
  );

  carregarBanners();

  /*
   * PRIMEIRO carrega os produtos.
   * Só depois renderiza a vitrine.
   */
  await carregarProdutosAPI();

  console.log(
    "📦 Total de produtos:",
    produtos.length
  );

  renderizarTudo();

  atualizarCarrinho();

  console.log(
    "✅ Resenha Sports iniciada."
  );
}

iniciarPagina();