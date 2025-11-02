import { auth, db, storage, serverTimestamp, addDoc, collection, doc, setDoc, ref, uploadBytes, getDownloadURL } from './firebase-config.js';
import authManager from './auth-manager.js';

class SendReceiveManager {
    constructor() {
        this.selectedDeliveryType = 'direct';
        this.packagePhotos = [];
        this.bookingData = {};
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadCollectionPoints();
    }

    setupEventListeners() {
        // Delivery type selection
        document.querySelectorAll('.delivery-option').forEach(option => {
            option.addEventListener('click', (e) => this.selectDeliveryType(e.currentTarget));
        });

        // Location buttons
        document.querySelector('[onclick*="getCurrentLocation(\'pickup\')"]').addEventListener('click', () => this.getCurrentLocation('pickup'));
        document.querySelector('[onclick*="getCurrentLocation(\'delivery\')"]').addEventListener('click', () => this.getCurrentLocation('delivery'));

        // Calculate route
        document.querySelector('[onclick="calculateRoute()"]').addEventListener('click', () => this.calculateRoute());

        // Package details inputs
        document.getElementById('package-type').addEventListener('change', () => this.calculatePrice());
        document.getElementById('package-weight').addEventListener('input', () => this.calculatePrice());
        document.getElementById('package-length').addEventListener('input', () => this.calculatePrice());
        document.getElementById('package-width').addEventListener('input', () => this.calculatePrice());
        document.getElementById('package-height').addEventListener('input', () => this.calculatePrice());
        document.getElementById('vehicle-type').addEventListener('change', () => this.calculatePrice());

        // Package photos
        document.getElementById('package-photos').addEventListener('change', (e) => this.handlePhotoUpload(e));

        // Book now button
        document.querySelector('[onclick="submitBooking()"]').addEventListener('click', () => this.submitBooking());
    }

    selectDeliveryType(element) {
        // Remove selected class from all options
        document.querySelectorAll('.delivery-option').forEach(option => {
            option.classList.remove('selected');
        });

        // Add selected class to clicked option
        element.classList.add('selected');

        // Get delivery type from data attribute or text content
        const type = element.querySelector('h4').textContent.toLowerCase();
        this.selectedDeliveryType = type;

        // Show/hide relevant fields based on delivery type
        this.toggleDeliveryTypeFields(type);

        // Recalculate price
        this.calculatePrice();
    }

    toggleDeliveryTypeFields(type) {
        // Hide all special fields first
        document.querySelectorAll('.delivery-type-field').forEach(field => {
            field.style.display = 'none';
        });

        // Show fields relevant to selected type
        if (type === 'store') {
            document.getElementById('store-pickup-fields').style.display = 'block';
        } else if (type === 'group') {
            document.getElementById('group-delivery-fields').style.display = 'block';
        }
    }

    getCurrentLocation(type) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    
                    // In a real app, you would reverse geocode to get address
                    const address = `Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
                    
                    if (type === 'pickup') {
                        document.getElementById('pickup-location').value = address;
                        this.bookingData.pickupLocation = { address, lat, lng };
                    } else {
                        document.getElementById('delivery-location').value = address;
                        this.bookingData.deliveryLocation = { address, lat, lng };
                    }
                    
                    this.calculatePrice();
                },
                (error) => {
                    alert('Unable to get your location. Please enter manually.');
                }
            );
        } else {
            alert('Geolocation is not supported by this browser.');
        }
    }

    calculateRoute() {
        const pickup = document.getElementById('pickup-location').value;
        const delivery = document.getElementById('delivery-location').value;
        
        if (!pickup || !delivery) {
            alert('Please enter both pickup and delivery locations');
            return;
        }
        
        // Simulate route calculation (in real app, use Google Maps API)
        const distance = Math.floor(Math.random() * 50) + 5; // 5-55 km
        const time = Math.floor(distance * 1.5); // 1.5 mins per km
        
        document.getElementById('distance-display').textContent = `${distance} km`;
        document.getElementById('time-display').textContent = `${time} mins`;
        
        this.bookingData.distance = distance;
        this.bookingData.estimatedTime = time;
        
        this.calculatePrice();
    }

    calculatePrice() {
        const packageType = document.getElementById('package-type').value;
        const weight = parseFloat(document.getElementById('package-weight').value) || 0;
        const length = parseFloat(document.getElementById('package-length').value) || 0;
        const width = parseFloat(document.getElementById('package-width').value) || 0;
        const height = parseFloat(document.getElementById('package-height').value) || 0;
        const vehicleType = document.getElementById('vehicle-type').value;
        const distance = this.bookingData.distance || 0;
        
        // Base prices for delivery types
        const basePrices = {
            direct: 10000,
            store: 7000,
            urgent: 20000,
            group: 5000
        };
        
        // Calculate base price
        let basePrice = basePrices[this.selectedDeliveryType] || 10000;
        
        // Adjust for package type
        const typeMultipliers = {
            document: 1,
            small: 1.2,
            medium: 1.5,
            large: 2,
            fragile: 1.8
        };
        
        basePrice *= (typeMultipliers[packageType] || 1);
        
        // Adjust for weight (UGX 500 per kg over 5kg)
        const weightSurcharge = Math.max(0, weight - 5) * 500;
        
        // Adjust for vehicle type
        const vehicleMultipliers = {
            boda: 1,
            pickup: 1.3,
            van: 1.5,
            truck: 2
        };
        
        basePrice *= (vehicleMultipliers[vehicleType] || 1);
        
        // Distance factor
        const distanceCost = distance * 300;
        
        // Calculate total
        const total = basePrice + weightSurcharge + distanceCost;
        
        // Update display
        document.getElementById('price-display').textContent = `UGX ${total.toLocaleString()}`;
        document.getElementById('base-price').textContent = basePrice.toLocaleString();
        document.getElementById('distance-price').textContent = distanceCost.toLocaleString();
        document.getElementById('weight-price').textContent = weightSurcharge.toLocaleString();
        
        this.bookingData.calculatedPrice = total;
    }

    handlePhotoUpload(e) {
        const files = e.target.files;
        const preview = document.getElementById('photo-preview');
        preview.innerHTML = '';
        
        this.packagePhotos = [];
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            this.packagePhotos.push(file);
            
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const img = document.createElement('div');
                img.className = 'relative';
                img.innerHTML = `
                    <img src="${e.target.result}" class="w-20 h-20 object-cover rounded-lg">
                    <button class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs" data-index="${i}">
                        ×
                    </button>
                `;
                preview.appendChild(img);
                
                // Add event listener to remove button
                img.querySelector('button').addEventListener('click', (event) => {
                    event.stopPropagation();
                    const index = parseInt(event.target.getAttribute('data-index'));
                    this.removePhoto(index);
                });
            }
            
            reader.readAsDataURL(file);
        }
    }

    removePhoto(index) {
        this.packagePhotos.splice(index, 1);
        this.handlePhotoUpload({ target: { files: this.packagePhotos } });
    }

    async uploadPhotos() {
        const photoUrls = [];
        
        for (const photo of this.packagePhotos) {
            const storageRef = ref(storage, `package-photos/${Date.now()}-${photo.name}`);
            await uploadBytes(storageRef, photo);
            const downloadURL = await getDownloadURL(storageRef);
            photoUrls.push(downloadURL);
        }
        
        return photoUrls;
    }

    validateForm() {
        const pickup = document.getElementById('pickup-location').value;
        const delivery = document.getElementById('delivery-location').value;
        const packageType = document.getElementById('package-type').value;
        
        if (!pickup || !delivery) {
            alert('Please enter both pickup and delivery locations');
            return false;
        }
        
        if (!packageType) {
            alert('Please select a package type');
            return false;
        }
        
        return true;
    }

    async submitBooking() {
        // Check authentication
        if (!authManager.checkAuth()) {
            return;
        }
        
        // Validate form
        if (!this.validateForm()) {
            return;
        }
        
        // Show loading state
        const bookBtn = document.querySelector('[onclick="submitBooking()"]');
        const originalText = bookBtn.innerHTML;
        bookBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Processing...';
        bookBtn.disabled = true;
        
        try {
            // Upload photos if any
            const photoUrls = this.packagePhotos.length > 0 ? await this.uploadPhotos() : [];
            
            // Generate booking ID
            const bookingId = 'FKC-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
            
            // Prepare booking data
            const bookingData = {
                id: bookingId,
                userId: authManager.currentUser.uid,
                userEmail: authManager.currentUser.email,
                userName: authManager.currentUser.displayName,
                deliveryType: this.selectedDeliveryType,
                pickupLocation: document.getElementById('pickup-location').value,
                deliveryLocation: document.getElementById('delivery-location').value,
                packageType: document.getElementById('package-type').value,
                packageWeight: parseFloat(document.getElementById('package-weight').value) || 0,
                packageDimensions: {
                    length: parseFloat(document.getElementById('package-length').value) || 0,
                    width: parseFloat(document.getElementById('package-width').value) || 0,
                    height: parseFloat(document.getElementById('package-height').value) || 0
                },
                vehicleType: document.getElementById('vehicle-type').value,
                specialInstructions: document.getElementById('special-instructions').value,
                photos: photoUrls,
                calculatedPrice: this.bookingData.calculatedPrice,
                distance: this.bookingData.distance || 0,
                estimatedTime: this.bookingData.estimatedTime || 0,
                status: 'pending',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };
            
            // Add sender and receiver details if available
            const senderName = document.getElementById('sender-name')?.value;
            const senderPhone = document.getElementById('sender-phone')?.value;
            const receiverName = document.getElementById('receiver-name')?.value;
            const receiverPhone = document.getElementById('receiver-phone')?.value;
            
            if (senderName) bookingData.senderName = senderName;
            if (senderPhone) bookingData.senderPhone = senderPhone;
            if (receiverName) bookingData.receiverName = receiverName;
            if (receiverPhone) bookingData.receiverPhone = receiverPhone;
            
            // Save to Firestore
            await addDoc(collection(db, 'bookings'), bookingData);
            
            // Show success modal
            this.showBookingConfirmation(bookingId, bookingData.calculatedPrice);
            
        } catch (error) {
            console.error('Error submitting booking:', error);
            alert('There was an error processing your booking. Please try again.');
        } finally {
            // Reset button state
            bookBtn.innerHTML = originalText;
            bookBtn.disabled = false;
        }
    }

    showBookingConfirmation(bookingId, price) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-xl shadow-lg max-w-md w-full mx-4">
                <div class="gradient-bg text-white p-6 rounded-t-xl">
                    <div class="flex justify-between items-center">
                        <h2 class="text-2xl font-bold">Booking Confirmed!</h2>
                        <button id="close-confirmation" class="text-white hover:text-gray-200">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                <div class="p-6">
                    <div class="text-center mb-4">
                        <i class="fas fa-check-circle text-green-500 text-5xl mb-4"></i>
                        <h3 class="text-xl font-semibold mb-2">Your booking is confirmed</h3>
                        <p class="text-gray-600 mb-4">Delivery ID: <span class="font-mono font-bold">${bookingId}</span></p>
                        <p class="text-lg font-semibold text-primary">Total: UGX ${price.toLocaleString()}</p>
                    </div>
                    
                    <div class="space-y-3 mt-6">
                        <button onclick="window.location.href='tracking.html?id=${bookingId}'" class="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition">
                            Track Delivery
                        </button>
                        <button id="close-confirmation-btn" class="w-full py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        document.getElementById('close-confirmation').onclick = () => modal.remove();
        document.getElementById('close-confirmation-btn').onclick = () => {
            modal.remove();
            // Reset form and go back to service options
            document.getElementById('send-receive').classList.add('hidden');
            document.querySelector('.bg-white.py-12').classList.remove('hidden');
        };
    }

    async loadCollectionPoints() {
        // This would load collection points from Firestore
        // For now, we'll use mock data
        const collectionPoints = [
            { id: 1, name: 'Nakasero Market', address: 'Kampala Central' },
            { id: 2, name: 'Owino Market', address: 'Kampala' },
            { id: 3, name: 'Kikuubo Market', address: 'Kampala' }
        ];
        
        // Populate dropdowns if they exist
        const pickupPointsSelect = document.getElementById('pickup-points');
        const dropoffPointsSelect = document.getElementById('dropoff-points');
        
        if (pickupPointsSelect && dropoffPointsSelect) {
            collectionPoints.forEach(point => {
                const option = document.createElement('option');
                option.value = point.id;
                option.textContent = `${point.name} - ${point.address}`;
                
                pickupPointsSelect.appendChild(option.cloneNode(true));
                dropoffPointsSelect.appendChild(option);
            });
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const sendReceiveManager = new SendReceiveManager();
    window.sendReceiveManager = sendReceiveManager;
});

export default SendReceiveManager;
