// Utility functions for the application

// Show toast notification
export function showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'fixed top-4 right-4 z-50 space-y-2';
        document.body.appendChild(toastContainer);
    }
    
    const toastId = 'toast-' + Date.now();
    
    let bgColor = 'bg-blue-500';
    let icon = 'fas fa-info-circle';
    
    if (type === 'success') {
        bgColor = 'bg-green-500';
        icon = 'fas fa-check-circle';
    } else if (type === 'error') {
        bgColor = 'bg-red-500';
        icon = 'fas fa-exclamation-circle';
    } else if (type === 'warning') {
        bgColor = 'bg-yellow-500';
        icon = 'fas fa-exclamation-triangle';
    }
    
    const toast = document.createElement('div');
    toast.id = toastId;
    toast.className = `${bgColor} text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 max-w-sm animate-slide-in-right`;
    toast.innerHTML = `
        <i class="${icon} text-xl"></i>
        <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (document.getElementById(toastId)) {
            toast.classList.remove('animate-slide-in-right');
            toast.classList.add('animate-slide-out-right');
            setTimeout(() => toast.remove(), 300);
        }
    }, 5000);
}

// Format currency
export function formatCurrency(amount, currency = 'UGX') {
    return `${currency} ${amount.toLocaleString()}`;
}

// Generate unique ID
export function generateId(prefix = 'FKC') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Validate email
export function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Validate phone number (Uganda format)
export function validatePhone(phone) {
    const re = /^(?:\+256|0)(7[0-9]|20)\d{7}$/;
    return re.test(phone);
}

// Debounce function for search inputs
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
