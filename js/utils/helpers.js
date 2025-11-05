// Format currency for Uganda
export function formatCurrency(amount, currency = 'UGX') {
    return new Intl.NumberFormat('en-UG', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0
    }).format(amount);
}

// Generate unique IDs
export function generateId(prefix = 'FKC') {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `${prefix}-${timestamp}-${random}`.toUpperCase();
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

// Calculate distance between two points (simplified)
export function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
}

// Format phone number for Uganda
export function formatPhoneNumber(phone) {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
        return '+256' + cleaned.substring(1);
    } else if (cleaned.startsWith('256')) {
        return '+' + cleaned;
    } else if (cleaned.length === 9) {
        return '+256' + cleaned;
    }
    return phone;
}

// Get current date in YYYY-MM-DD format
export function getCurrentDate() {
    return new Date().toISOString().split('T')[0];
}

// Create loading spinner HTML
export function createLoadingSpinner(size = 'md') {
    const sizes = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8'
    };
    
    return `
        <div class="flex justify-center items-center">
            <div class="${sizes[size]} border-2 border-gray-300 border-t-primary rounded-full animate-spin"></div>
        </div>
    `;
}
