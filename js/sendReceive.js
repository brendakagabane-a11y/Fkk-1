import { auth, db, storage, serverTimestamp, addDoc, collection, doc, setDoc, ref, uploadBytes, getDownloadURL } from './firebase-config.js';
import authManager from './auth-manager.js';
import { showToast, generateId, formatCurrency } from './utils.js';

class SendReceiveManager {
    constructor() {
        this.selectedDeliveryType = 'direct';
        this.packagePhotos = [];
        this.bookingData = {};
        this.collectionPoints = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadCollectionPoints();
        this.setMinDate();
    }

    setMinDate() {
        // Set minimum date to today
        const today = new Date().toISOString().split('T')[0];
        const pickupDate = document.getElementById('pickup-date');
        if (pickupDate) {
            pickupDate.min = today;
        }
    }

    setupEventListeners() {
        // Delivery type selection
        document.querySelectorAll('.delivery-option').forEach(option => {
            option.addEventListener('click', (e) => this.selectDeliveryType(e.currentTarget));
        });

        // Location buttons
        document.getElementById('current-location-pickup')?.addEventListener('click', () => this.getCurrentLocation('pickup'));
        document.getElementById('current-location-delivery')?.addEventListener('click', () => this.getCurrentLocation('delivery'));

        // Calculate route
        document.getElementById('calculate-route')?.addEventListener('click', () => this.calculateRoute());

        // Package details inputs
        const priceInputs = ['package-type', 'package-weight', 'package-length', 'package-width', 'package-height', 'vehicle-type'];
        priceInputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => this.calculatePrice());
                element.addEventListener('input', () => this.calculatePrice());
            }
        });

        // Package photos
        document.getElementById('select-photos')?.addEventListener('click', () => {
            document.getElementById('package-photos').click();
        });
        document.getElementById('package-photos')?.addEventListener('change', (e) => this.handlePhotoUpload(e));

        // Book now button
        document.getElementById('book-now')?.addEventListener('click', () => this.submitBooking());
    }

    selectDeliveryType(element) {
        // Remove selected class from all options
        document.querySelectorAll('.delivery-option').forEach(option => {
            option.classList.remove('selected');
        });

        // Add selected class to clicked option
        element.classList.add('selected');

        // Get delivery type from data attribute
        const type = element.getAttribute('data-type');
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

        // Update urgency indicator
        this.updateUrgencyIndicator(type);
    }

    updateUrgencyIndicator(type) {
        const urgencyBadge = document.createElement('div');
        urgencyBadge.className = 'absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full';
        
        if (type === 'urgent') {
            urgencyBadge.textContent = 'Priority';
            document.querySelector('.delivery-option[data-type="urgent"]').appendChild(urgencyBadge);
        }
    }

    getCurrentLocation(type) {
        if (navigator.geolocation) {
            showToast('Getting your location...', 'info');
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    
                    // Simulate reverse geocoding (in real app, use Google Maps Geocoding API)
                    const addresses = [
                        "Kampala Road, Kampala",
                        "Nakasero Market, Kampala",
                        "Owino Market, Kampala", 
                        "Makerere University, Kampala",
                        "Ntinda, Kampala"
                    ];
                    const randomAddress = addresses[Math.floor(Math.random() * addresses.length)];
                    
                    if (type === 'pickup') {
                        document.getElementById('pickup-location').value = randomAddress;
                        this.bookingData.pickupLocation = { address: randomAddress, lat, lng };
                    } else {
                        document.getElementById('delivery-location').value = randomAddress;
                        this.bookingData.deliveryLocation = { address: randomAddress, lat, lng };
                    }
                    
                    showToast('Location set successfully', 'success');
                    this.calculatePrice();
                },
                (error) => {
                    console.error('Geolocation error:', error);
                    showToast('Unable to get your location. Please enter manually.', 'error');
                },
                { timeout: 10000 }
            );
        } else {
            showToast('Geolocation is not supported by this browser.', 'error');
        }
    }

    calculateRoute() {
        const pickup = document.getElementById('pickup-location').value;
        const delivery = document.getElementById('delivery-location').value;
        
        if (!pickup || !delivery) {
            showToast('Please enter both pickup and delivery locations', 'error');
            return;
        }
        
        showToast('Calculating route...', 'info');
        
        // Simulate API call delay
        setTimeout(() => {
            // Simulate route calculation (in real app, use Google Maps Distance Matrix API)
            const distance = Math.floor(Math.random() * 50) + 5; // 5-55 km
            const time = Math.floor(distance * 1.5); // 1.5 mins per km
            
            document.getElementById('distance-display').textContent = `${distance} km`;
            document.getElementById('time-display').textContent = `${time} mins`;
            
            this.bookingData.distance = distance;
            this.bookingData.estimatedTime = time;
            
            showToast('Route calculated successfully', 'success');
            this.calculatePrice();
        }, 1500);
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
            urgent: 15000, // 50% more than direct
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
        document.getElementById('price-display').textContent = formatCurrency(total);
        document.getElementById('base-price').textContent = formatCurrency(basePrice);
        document.getElementById('distance-price').textContent = formatCurrency(distanceCost);
        document.getElementById('weight-price').textContent = formatCurrency(weightSurcharge);
        
        this.bookingData.calculatedPrice = total;
        this.bookingData.priceBreakdown = { basePrice, weightSurcharge, distanceCost };
    }

    handlePhotoUpload(e) {
        const files = e.target.files;
        const preview = document.getElementById('photo-preview');
        preview.innerHTML = '';
        
        this.packagePhotos = [];
        
        if (files.length > 5) {
            showToast('Maximum 5 photos allowed', 'error');
            return;
        }
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            // Validate file type and size
            if (!file.type.startsWith('image/')) {
                showToast('Please upload only image files', 'error');
                continue;
            }
            
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                showToast('Image size should be less than 5MB', 'error');
                continue;
            }
            
            this.packagePhotos.push(file);
            
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const imgContainer = document.createElement('div');
                imgContainer.className = 'relative';
                imgContainer.innerHTML = `
                    <img src="${e.target.result}" class="w-20 h-20 object-cover rounded-lg border">
                    <button class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs" data-index="${i}">
                        ×
                    </button>
                `;
                preview.appendChild(imgContainer);
                
                // Add event listener to remove button
                imgContainer.querySelector('button').addEventListener('click', (event) => {
                    event.stopPropagation();
                    const index = parseInt(event.target.getAttribute('data-index'));
                    this.removePhoto(index);
                });
            }
            
            reader.readAsDataURL(file);
        }
        
        if (this.packagePhotos.length > 0) {
            showToast(`${this.packagePhotos.length} photo(s) selected`, 'success');
        }
    }

    removePhoto(index) {
        this.packagePhotos.splice(index, 1);
        // Refresh preview
        const input = document.getElementById('package-photos');
        const newFiles = new DataTransfer();
        this.packagePhotos.forEach(photo => newFiles.items.add(photo));
        input.files = newFiles.files;
        this.handlePhotoUpload({ target: input });
    }

    async uploadPhotos() {
        const photoUrls = [];
        
        if (this.packagePhotos.length === 0) return photoUrls;
        
        showToast('Uploading photos...', 'info');
        
        for (const photo of this.packagePhotos) {
            try {
                const storageRef = ref(storage, `package-photos/${Date.now()}-${photo.name}`);
                const snapshot = await uploadBytes(storageRef, photo);
                const downloadURL = await getDownloadURL(snapshot.ref);
                photoUrls.push(downloadURL);
            } catch (error) {
                console.error('Error uploading photo:', error);
                showToast('Error uploading some photos', 'error');
            }
        }
        
        showToast('Photos uploaded successfully', 'success');
        return photoUrls;
    }

    validateForm() {
        const pickup = document.getElementById('pickup-location').value;
        const delivery = document.getElementById('delivery-location').value;
        const packageType = document.getElementById('package-type').value;
        const senderName = document.getElementById('sender-name').value;
        const senderPhone = document.getElementById('sender-phone').value;
        const receiverName = document.getElementById('receiver-name').value;
        const receiverPhone = document.getElementById('receiver-phone').value;
        
        if (!pickup || !delivery) {
            showToast('Please enter both pickup and delivery locations', 'error');
            return false;
        }
        
        if (!packageType) {
            showToast('Please select a package type', 'error');
            return false;
        }
        
        if (!senderName || !senderPhone) {
            showToast('Please provide sender information', 'error');
            return false;
        }
        
        if (!receiverName || !receiverPhone) {
            showToast('Please provide receiver information', 'error');
            return false;
        }
        
        if (this.selectedDeliveryType === 'store') {
            const pickupPoint = document.getElementById('pickup-points').value;
            const dropoffPoint = document.getElementById('dropoff-points').value;
            if (!pickupPoint || !dropoffPoint) {
                showToast('Please select both pickup and drop-off points', 'error');
                return false;
            }
        }
        
        if (this.selectedDeliveryType === 'group') {
            const pickupZone = document.getElementById('pickup-zone').value;
            const destinationZone = document.getElementById('destination-zone').value;
            if (!pickupZone || !destinationZone) {
                showToast('Please select both pickup and destination zones', 'error');
                return false;
            }
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
        const bookBtn = document.getElementById('book-now');
        const originalText = bookBtn.innerHTML;
        this.setLoadingState(bookBtn, true, 'Processing...');
        
        try {
            // Upload photos if any
            const photoUrls = await this.uploadPhotos();
            
            // Generate booking ID
            const bookingId = generateId('FKC');
            
            // Get form values
            const formData = this.getFormData();
            
            // Prepare booking data
            const bookingData = {
                id: bookingId,
                userId: authManager.currentUser.uid,
                userEmail: authManager.currentUser.email,
                userName: authManager.currentUser.displayName,
                deliveryType: this.selectedDeliveryType,
                status: 'pending',
                ...formData,
                photos: photoUrls,
                calculatedPrice: this.bookingData.calculatedPrice,
                priceBreakdown: this.bookingData.priceBreakdown,
                distance: this.bookingData.distance || 0,
                estimatedTime: this.bookingData.estimatedTime || 0,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };
            
            // Save to Firestore
            const docRef = await addDoc(collection(db, 'bookings'), bookingData);
            
            // Show success modal
            this.showBookingConfirmation(bookingId, bookingData.calculatedPrice, formData);
            
            // Reset form
            this.resetForm();
            
        } catch (error) {
            console.error('Error submitting booking:', error);
            showToast('There was an error processing your booking. Please try again.', 'error');
        } finally {
            // Reset button state
            this.setLoadingState(bookBtn, false, 'Book Now');
        }
    }

    getFormData() {
        return {
            // Sender information
            senderName: document.getElementById('sender-name').value,
            senderPhone: '+256' + document.getElementById('sender-phone').value,
            senderEmail: document.getElementById('sender-email').value || '',
            
            // Receiver information
            receiverName: document.getElementById('receiver-name').value,
            receiverPhone: '+256' + document.getElementById('receiver-phone').value,
            receiverEmail: document.getElementById('receiver-email').value || '',
            
            // Location details
            pickupLocation: document.getElementById('pickup-location').value,
            deliveryLocation: document.getElementById('delivery-location').value,
            
            // Package details
            packageType: document.getElementById('package-type').value,
            packageWeight: parseFloat(document.getElementById('package-weight').value) || 0,
            packageDimensions: {
                length: parseFloat(document.getElementById('package-length').value) || 0,
                width: parseFloat(document.getElementById('package-width').value) || 0,
                height: parseFloat(document.getElementById('package-height').value) || 0
            },
            vehicleType: document.getElementById('vehicle-type').value,
            specialInstructions: document.getElementById('special-instructions').value,
            
            // Pickup & payment
            pickupDate: document.getElementById('pickup-date').value,
            deliveryTime: document.getElementById('delivery-time').value,
            packageValue: parseInt(document.getElementById('package-value').value) || 0,
            paymentMethod: document.querySelector('input[name="payment-method"]:checked').value,
            
            // Additional fields based on delivery type
            ...this.getDeliveryTypeSpecificData()
        };
    }

    getDeliveryTypeSpecificData() {
        const data = {};
        
        if (this.selectedDeliveryType === 'store') {
            data.pickupPoint = document.getElementById('pickup-points').value;
            data.dropoffPoint = document.getElementById('dropoff-points').value;
        } else if (this.selectedDeliveryType === 'group') {
            data.pickupZone = document.getElementById('pickup-zone').value;
            data.destinationZone = document.getElementById('destination-zone').value;
            data.deliveryWindow = document.getElementById('delivery-window').value;
            
            // For group delivery, we need to handle matching logic
            data.groupStatus = 'waiting';
            data.groupMembers = [authManager.currentUser.uid];
        }
        
        return data;
    }

    setLoadingState(button, loading, text) {
        const spinner = button.querySelector('#book-now-spinner');
        const textSpan = button.querySelector('#book-now-text');
        
        button.disabled = loading;
        
        if (spinner) {
            spinner.classList.toggle('hidden', !loading);
        }
        
        if (textSpan) {
            textSpan.textContent = text;
        }
    }

    showBookingConfirmation(bookingId, price, formData) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-xl shadow-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div class="gradient-bg text-white p-6 rounded-t-xl sticky top-0">
                    <div class="flex justify-between items-center">
                        <h2 class="text-2xl font-bold">Booking Confirmed!</h2>
                        <button id="close-confirmation" class="text-white hover:text-gray-200">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                <div class="p-6">
                    <div class="text-center mb-6">
                        <i class="fas fa-check-circle text-green-500 text-5xl mb-4"></i>
                        <h3 class="text-xl font-semibold mb-2">Your booking is confirmed</h3>
                        <div class="bg-primary/10 p-3 rounded-lg mt-3">
                            <p class="text-sm text-gray-600">Delivery ID</p>
                            <p class="font-mono font-bold text-lg text-primary">${bookingId}</p>
                        </div>
                    </div>
                    
                    <div class="space-y-4 mb-6">
                        <div class="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p class="text-gray-600">From</p>
                                <p class="font-semibold">${formData.pickupLocation}</p>
                            </div>
                            <div>
                                <p class="text-gray-600">To</p>
                                <p class="font-semibold">${formData.deliveryLocation}</p>
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p class="text-gray-600">Package</p>
                                <p class="font-semibold capitalize">${formData.packageType}</p>
                            </div>
                            <div>
                                <p class="text-gray-600">Vehicle</p>
                                <p class="font-semibold capitalize">${formData.vehicleType}</p>
                            </div>
                        </div>
                        
                        <div class="border-t pt-3">
                            <p class="text-lg font-semibold text-primary text-center">Total: ${formatCurrency(price)}</p>
                        </div>
                    </div>
                    
                    <div class="space-y-3">
                        <button onclick="window.location.href='tracking.html?id=${bookingId}'" class="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition">
                            <i class="fas fa-map-marker-alt mr-2"></i> Track Delivery
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
            this.resetForm();
            document.getElementById('send-receive').classList.add('hidden');
            document.querySelector('.bg-white.py-12').classList.remove('hidden');
        };
    }

    resetForm() {
        // Reset all form fields
        const form = document.getElementById('send-receive');
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (input.type !== 'button' && input.type !== 'submit') {
                input.value = '';
            }
        });
        
        // Reset delivery type
        this.selectedDeliveryType = 'direct';
        document.querySelectorAll('.delivery-option').forEach(option => {
            option.classList.remove('selected');
        });
        document.querySelector('.delivery-option[data-type="direct"]').classList.add('selected');
        
        // Reset photos
        this.packagePhotos = [];
        document.getElementById('photo-preview').innerHTML = '';
        document.getElementById('package-photos').value = '';
        
        // Reset calculated values
        this.bookingData = {};
        document.getElementById('distance-display').textContent = '-- km';
        document.getElementById('time-display').textContent = '-- mins';
        document.getElementById('price-display').textContent = 'UGX 0';
    }

    async loadCollectionPoints() {
        try {
            // In a real app, this would fetch from Firestore
            // For now, using mock data
            this.collectionPoints = [
                { id: 'nakasero', name: 'Nakasero Market', address: 'Kampala Central', type: 'market' },
                { id: 'owino', name: 'Owino Market', address: 'St. Balikuddembe Market, Kampala', type: 'market' },
                { id: 'kikuubo', name: 'Kikuubo Market', address: 'Kikuubo, Kampala', type: 'market' },
                { id: 'wandegeya', name: 'Wandegeya Market', address: 'Wandegeya, Kampala', type: 'market' },
                { id: 'nakawa', name: 'Nakawa Market', address: 'Nakawa, Kampala', type: 'market' }
            ];
            
            // Populate dropdowns
            const pickupPointsSelect = document.getElementById('pickup-points');
            const dropoffPointsSelect = document.getElementById('dropoff-points');
            
            if (pickupPointsSelect && dropoffPointsSelect) {
                // Add default option
                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.textContent = 'Select location';
                defaultOption.disabled = true;
                defaultOption.selected = true;
                
                pickupPointsSelect.appendChild(defaultOption.cloneNode(true));
                dropoffPointsSelect.appendChild(defaultOption.cloneNode(true));
                
                // Add collection points
                this.collectionPoints.forEach(point => {
                    const option = document.createElement('option');
                    option.value = point.id;
                    option.textContent = `${point.name} - ${point.address}`;
                    
                    pickupPointsSelect.appendChild(option.cloneNode(true));
                    dropoffPointsSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading collection points:', error);
            showToast('Error loading collection points', 'error');
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const sendReceiveManager = new SendReceiveManager();
    window.sendReceiveManager = sendReceiveManager;
});

export default SendReceiveManager;
