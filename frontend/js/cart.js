document.addEventListener("DOMContentLoaded", function() {
  const addToCartButtons = document.querySelectorAll('.btn-primary');

  addToCartButtons.forEach(button => {
    button.addEventListener('click', function(event) {
      event.preventDefault(); // Evita o comportamento padrão do link

      // Obter o nome e o preço do produto
      const productName = this.parentElement.querySelector('.card-title').textContent.trim();
      const productPrice = this.parentElement.querySelector('.card-text').textContent.trim();

      // Redirecionar para a página do carrinho
      window.location.href = `carrinho.html?nome=${productName}&preco=${productPrice}`;
    });
  });
});