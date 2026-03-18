document.getElementById('copyPixCodeBtn').addEventListener('click', function() {
    const pixCodeInput = document.getElementById('pixCode');
    pixCodeInput.select();
    pixCodeInput.setSelectionRange(0, 99999); 
    document.execCommand('copy');
    
    const toast = new bootstrap.Toast(document.getElementById('copyToast'));
    toast.show();
});
