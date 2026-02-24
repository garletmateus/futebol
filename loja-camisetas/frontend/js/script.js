fetch("http://localhost:3000/produtos")
  .then(res => res.json())
  .then(produtos => {
    const container = document.getElementById("produtos");

    produtos.forEach(produto => {
      const card = document.createElement("div");
      card.className = "card";

      card.innerHTML = `
        <img src="${produto.imagem}">
        <h3>${produto.time}</h3>
        <p>R$ ${produto.preco.toFixed(2)}</p>
        <button>Comprar</button>
      `;

      container.appendChild(card);
    });
  });