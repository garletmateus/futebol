document.addEventListener("DOMContentLoaded", function() {
  const boletoForm = document.getElementById('boletoForm');
  
  if (boletoForm) {
    boletoForm.addEventListener('submit', function(event) {
      event.preventDefault();
      setTimeout(function() {
        const toastElement = document.getElementById('boletoToast');
        const toast = new bootstrap.Toast(toastElement);
        toast.show();
        boletoForm.reset();
      }, 1000);
    });
  }
});