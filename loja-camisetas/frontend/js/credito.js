  document.getElementById('paymentForm').addEventListener('submit', function(event) {
    event.preventDefault();
    setTimeout(function() {
      const toast = new bootstrap.Toast(document.getElementById('paymentToast'));
      toast.show();
    }, 800);
});
