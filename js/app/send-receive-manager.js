import FirebaseService from '../services/firebase-service.js';
import { toast } from '../utils/notifications.js';
import { generateId, formatCurrency } from '../utils/helpers.js';
import { validatePhone, validatePackageWeight } from '../utils/validators.js';

class SendReceiveManager {
    constructor() {
        this.selectedDeliveryType = 'direct';
        this.packagePhotos = [];
        this.init();
    }

    async submitBooking() {
        if (!this.validateForm()) return;

        const bookBtn = document.getElementById('book-now');
        this.setLoadingState(bookBtn, true, 'Processing...');

        try {
            // 1. Upload photos to ImgBB
            const photoUrls = await this.uploadPhotos();
            
            // 2. Prepare booking data
            const bookingData = this.prepareBookingData(photoUrls);
            
            // 3. Save to Firestore
            const result = await FirebaseService.addDocument('bookings', bookingData);
            
            if (result.success) {
                toast.success('Booking created successfully!');
                this.showBookingConfirmation(bookingData);
                this.resetForm();
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            console.error('Booking error:', error);
            toast.error('Failed to create booking. Please try again.');
        } finally {
            this.setLoadingState(bookBtn, false, 'Book Now');
        }
    }

    prepareBookingData(photoUrls) {
        const formData = this.getFormData();
        
        return {
            // Booking Metadata
            id: generateId('FKC'),
            userId: FirebaseService.auth.currentUser?.uid || 'anonymous',
            userEmail: FirebaseService.auth.currentUser?.email || formData.senderEmail,
            status: 'pending',
            deliveryType: this.selectedDeliveryType,
            
            // Sender Information
            sender: {
                name: formData.senderName,
                phone: formData.senderPhone,
                email: formData.senderEmail
            },
            
            // Receiver Information  
            receiver: {
                name: formData.receiverName,
                phone: formData.receiverPhone,
                email: formData.receiverEmail
            },
            
            // Location Details
            pickupLocation: formData.pickupLocation,
            deliveryLocation: formData.deliveryLocation,
            coordinates: this.bookingData.coordinates || {},
            
            // Package Details
            package: {
                type: formData.packageType,
                weight: formData.packageWeight,
                dimensions: formData.packageDimensions,
                value: formData.packageValue,
                description: formData.specialInstructions,
                photos: photoUrls
            },
            
            // Delivery Details
            vehicleType: formData.vehicleType,
            pickupDate: formData.pickupDate,
            deliveryTime: formData.deliveryTime,
            
            // Pricing
            pricing: {
                total: this.bookingData.calculatedPrice || 0,
                breakdown: this.bookingData.priceBreakdown || {},
                distance: this.bookingData.distance || 0,
                estimatedTime: this.bookingData.estimatedTime || 0
            },
            
            // Payment
            payment: {
                method: formData.paymentMethod,
                status: 'pending'
            },
            
            // Timestamps
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }

    async uploadPhotos() {
        if (this.packagePhotos.length === 0) return [];
        
        try {
            // Using ImgBB for free image hosting
            const uploadPromises = this.packagePhotos.map(file => 
                this.uploadToImgBB(file)
            );
            
            const results = await Promise.all(uploadPromises);
            return results.filter(url => url !== null);
            
        } catch (error) {
            console.error('Photo upload error:', error);
            toast.warning('Some photos failed to upload. Continuing without them.');
            return [];
        }
    }

    async uploadToImgBB(file) {
        // Simple fetch implementation to ImgBB
        const formData = new FormData();
        formData.append('key', '053eefabdcc58e969e80204a6007a066'); // Your API key
        formData.append('image', file);
        
        try {
            const response = await fetch('https://api.imgbb.com/1/upload', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                return data.data.url;
            } else {
                throw new Error(data.error?.message || 'Upload failed');
            }
        } catch (error) {
            console.error('ImgBB upload error:', error);
            return null;
        }
    }
}

export default SendReceiveManager;
