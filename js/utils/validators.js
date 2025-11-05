// Email validation
export function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Uganda phone number validation
export function validatePhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    const ugandaRegex = /^(?:\+256|0)?(7[0-9]|20)\d{7}$/;
    return ugandaRegex.test(cleaned);
}

// Password validation
export function validatePassword(password) {
    return password.length >= 6;
}

// Required field validation
export function validateRequired(value) {
    return value && value.trim().length > 0;
}

// File validation for images
export function validateImageFile(file, maxSizeMB = 5) {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = maxSizeMB * 1024 * 1024;

    if (!file) {
        return { valid: false, error: 'No file selected' };
    }

    if (!validTypes.includes(file.type.toLowerCase())) {
        return { 
            valid: false, 
            error: 'Please select a valid image (JPEG, PNG, GIF, WebP)' 
        };
    }

    if (file.size > maxSize) {
        return { 
            valid: false, 
            error: `Image size must be less than ${maxSizeMB}MB` 
        };
    }

    return { valid: true };
}

// Package weight validation
export function validatePackageWeight(weight) {
    const numWeight = parseFloat(weight);
    return !isNaN(numWeight) && numWeight > 0 && numWeight <= 1000;
}

// Price validation
export function validatePrice(price) {
    const numPrice = parseFloat(price);
    return !isNaN(numPrice) && numPrice > 0;
}
