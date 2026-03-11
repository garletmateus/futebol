function listar() {
  fetch("http://localhost:3000/produtos")
    .then(r => r.json())
    .then(d => {
      lista.innerHTML = "";
      d.forEach(p => {
        lista.innerHTML += `
          <div class="card">
            <h3>${p.nome}</h3>
            <p>R$ ${p.preco}</p>
            <button onclick="excluir(${p.id})">Excluir</button>
          </div>
        `;
      });
    });
}