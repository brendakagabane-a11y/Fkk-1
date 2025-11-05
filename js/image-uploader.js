import { IMGBB_API_KEY } from './firebase-config.js';
import { showToast } from './utils.js';

class ImageUploader {
    constructor() {
        this.apiKey = IMGBB_API_KEY;
        this.baseUrl = 'https://api.imgbb.com/1/upload';
        
        // Validate API key on initialization
        this.validateApiKey();
    }

    validateApiKey() {
        if (!this.apiKey || this.apiKey === 'your-imgbb-api-key-here') {
            console.warn('ImgBB API key not configured. Image uploads will fail.');
        } else {
            console.log('ImgBB API key loaded successfully');
        }
    }

    // Convert file to base64
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    // Upload single image to ImgBB
    async uploadImage(file) {
        try {
            // Validate file first
            const validation = this.validateImage(file);
            if (!validation.valid) {
                throw new Error(validation.error);
            }

            // Convert to base64
            const base64Image = await this.fileToBase64(file);
            const base64Data = base64Image.split(',')[1]; // Remove data:image/... header

            // Prepare form data
            const formData = new FormData();
            formData.append('key', this.apiKey);
            formData.append('image', base64Data);
            formData.append('name', `fikaconnect_${Date.now()}_${file.name.replace(/\s+/g, '_')}`);
            formData.append('expiration', '600'); // 10 minutes - optional

            // Upload to ImgBB
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error?.message || `Upload failed: ${data.status}`);
            }

            console.log('Image uploaded successfully:', data.data);

            return {
                url: data.data.url,
                displayUrl: data.data.display_url,
                deleteUrl: data.data.delete_url,
                thumbUrl: data.data.thumb?.url || data.data.url,
                mediumUrl: data.data.medium?.url || data.data.url,
                imageId: data.data.id
            };

        } catch (error) {
            console.error('Image upload error:', error);
            
            // Provide more user-friendly error messages
            if (error.message.includes('key') || error.message.includes('API')) {
                throw new Error('Image upload service is temporarily unavailable. Please try again later.');
            } else if (error.message.includes('size')) {
                throw new Error('Image is too large. Please select a smaller image (max 10MB).');
            } else {
                throw new Error('Failed to upload image. Please try again.');
            }
        }
    }

    // Upload multiple images with better error handling
    async uploadMultipleImages(files) {
        if (!files || files.length === 0) {
            return [];
        }

        // Validate all files first
        for (const file of files) {
            const validation = this.validateImage(file);
            if (!validation.valid) {
                throw new Error(`Invalid file: ${file.name} - ${validation.error}`);
            }
        }

        const uploadPromises = files.map(file => 
            this.uploadImage(file).catch(error => {
                // Log error but don't stop other uploads
                console.error(`Failed to upload ${file.name}:`, error);
                return null;
            })
        );

        const results = await Promise.all(uploadPromises);
        
        // Filter out failed uploads
        const successfulUploads = results.filter(result => result !== null);
        
        if (successfulUploads.length === 0) {
            throw new Error('All image uploads failed. Please check your connection and try again.');
        }

        if (successfulUploads.length < files.length) {
            console.warn(`${files.length - successfulUploads.length} images failed to upload`);
        }

        return successfulUploads;
    }

    // Upload with progress tracking
    async uploadWithProgress(files, onProgress) {
        const results = [];
        const totalFiles = files.length;

        for (let i = 0; i < files.length; i++) {
            try {
                if (onProgress) {
                    onProgress((i / totalFiles) * 100, `Uploading image ${i + 1} of ${totalFiles}`);
                }

                const result = await this.uploadImage(files[i]);
                results.push(result);

                if (onProgress) {
                    onProgress(((i + 1) / totalFiles) * 100, `Uploaded image ${i + 1} of ${totalFiles}`);
                }

            } catch (error) {
                console.error(`Failed to upload image ${i + 1}:`, error);
                // Continue with other images even if one fails
                showToast(`Failed to upload ${files[i].name}`, 'error');
            }
        }

        return results;
    }

    // Validate image before upload
    validateImage(file) {
        const validTypes = [
            'image/jpeg', 
            'image/jpg', 
            'image/png', 
            'image/gif', 
            'image/webp',
            'image/bmp'
        ];
        const maxSize = 10 * 1024 * 1024; // 10MB

        if (!file) {
            return {
                valid: false,
                error: 'No file selected'
            };
        }

        if (!validTypes.includes(file.type.toLowerCase())) {
            return {
                valid: false,
                error: 'Please select a valid image (JPEG, PNG, GIF, WebP, BMP)'
            };
        }

        if (file.size > maxSize) {
            return {
                valid: false,
                error: 'Image size must be less than 10MB'
            };
        }

        return { valid: true };
    }

    // Test API connection
    async testConnection() {
        try {
            // Create a small test image
            const canvas = document.createElement('canvas');
            canvas.width = 1;
            canvas.height = 1;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, 1, 1);
            
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            const file = new File([blob], 'test.png', { type: 'image/png' });
            
            const result = await this.uploadImage(file);
            console.log('ImgBB API test successful:', result);
            return true;
            
        } catch (error) {
            console.error('ImgBB API test failed:', error);
            return false;
        }
    }

    // Get image info (for debugging)
    async getImageInfo(imageUrl) {
        // This is a simple implementation - ImgBB doesn't have a direct API for this
        console.log('Image URL:', imageUrl);
        return { url: imageUrl, status: 'uploaded' };
    }
}

// Create global instance and test connection
const imageUploader = new ImageUploader();

// Test the API connection when the module loads
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Testing ImgBB API connection...');
    const isConnected = await imageUploader.testConnection();
    if (isConnected) {
        console.log('✅ ImgBB API connection successful!');
    } else {
        console.warn('❌ ImgBB API connection failed. Check your API key.');
    }
});

export default imageUploader;
