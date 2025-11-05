import { auth, db, serverTimestamp, addDoc, collection, query, where, getDocs } from './firebase-config.js';
import authManager from './auth-manager.js';
import imageUploader from './image-uploader.js';
import { showToast, generateId, formatCurrency, formatPhone } from './utils.js';

class SendReceiveManager {
    constructor() {
        this.selectedDeliveryType = 'direct';
        this.packagePhotos = [];
        this.bookingData = {};
        this.collectionPoints = [];
        this.groupDeliveries = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadCollectionPoints();
        this.setMinDate();
        this.loadGroupDeliveries();
    }

    setMinDate() {
        // Set minimum date to today
        const today = new Date().toISOString().split('T')[0];
        const pickupDate = document.getElementById('pickup-date');
        if (pickupDate) {
            pickupDate.min = today;
            // Set default to today
            pickupDate.value = today;
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

        // Group delivery fields
        document.getElementById('pickup-zone')?.addEventListener('change', () => this.checkGroupMatches());
        document.getElementById('destination-zone')?.addEventListener('change', () => this.checkGroupMatches());
        document.getElementById('delivery-window')?.addEventListener('change', () => this.checkGroupMatches());

        // Store pickup fields
        document.getElementById('pickup-points')?.addEventListener('change', () => this.calculateStorePrice());
        document.getElementById('dropoff-points')?.addEventListener('change', () => this.calculateStorePrice());
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

        // Show appropriate instructions
        this.showDeliveryInstructions(type);
    }

    toggleDeliveryTypeFields(type) {
        // Hide all special fields first
        document.querySelectorAll('.delivery-type-field').forEach(field => {
            field.style.display = 'none';
        });

        // Show fields relevant to selected type
        if (type === 'store') {
            document.getElementById('store-pickup-fields').style.display = 'block';
            this.calculateStorePrice();
        } else if (type === 'group') {
            document.getElementById('group-delivery-fields').style.display = 'block';
            this.checkGroupMatches();
        }

        // Update urgency indicator
        this.updateUrgencyIndicator(type);
    }

    updateUrgencyIndicator(type) {
        // Remove any existing badges
        document.querySelectorAll('.urgency-badge').forEach(badge => badge.remove());

        if (type === 'urgent') {
            const badge = document.createElement('div');
            badge.className = 'urgency-badge absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full';
            badge.textContent = 'Priority';
            document.querySelector('.delivery-option[data-type="urgent"]').appendChild(badge);
        }
    }

    showDeliveryInstructions(type) {
        const instructions = {
            direct: 'Door-to-door delivery with real-time tracking',
            urgent: 'Priority service with faster delivery times (+50% fee)',
            store: 'Pick up and drop off at partner locations for lower costs',
            group: 'Share transport costs with others going the same way'
        };

        // You could display these instructions in the UI
        console.log(`Delivery type: ${type} - ${instructions[type]}`);
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
        
        if (this.selectedDeliveryType === 'store') {
            // For store pickup, use fixed distance
            this.bookingData.distance = 8;
            this.bookingData.estimatedTime = 15;
        } else {
            // Simulate route calculation
            const distance = Math.floor(Math.random() * 50) + 5; // 5-55 km
            const time = Math.floor(distance * 1.5); // 1.5 mins per km
            
            this.bookingData.distance = distance;
            this.bookingData.estimatedTime = time;
        }
        
        this.updateRouteDisplay();
        this.calculatePrice();
    }

    updateRouteDisplay() {
        document.getElementById('distance-display').textContent = `${this.bookingData.distance || '--'} km`;
        document.getElementById('time-display').textContent = `${this.bookingData.estimatedTime || '--'} mins`;
    }

    calculatePrice() {
        const packageType = document.getElementById('package-type').value;
        const weight = parseFloat(document.getElementById('package-weight').value) || 0;
        const length = parseFloat(document.getElementById('package-length').value) || 0;
        const width = parseFloat(document.getElementById('package-width').value) || 0;
        const height = parseFloat(document.getElementById('package-height').value) || 0;
        const vehicleType = document.getElementById('vehicle-type').value;
        const distance = this.bookingData.distance || 0;
        
        let total = 0;
        let priceBreakdown = {};

        if (this.selectedDeliveryType === 'store') {
            total = this.calculateStorePrice();
            priceBreakdown = { basePrice: total, weightSurcharge: 0, distanceCost: 0 };
        } else {
            // Base prices for delivery types
            const basePrices = {
                direct: 10000,
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
            total = basePrice + weightSurcharge + distanceCost;
            priceBreakdown = { basePrice, weightSurcharge, distanceCost };
        }
        
        // Update display
        document.getElementById('price-display').textContent = formatCurrency(total);
        document.getElementById('base-price').textContent = formatCurrency(priceBreakdown.basePrice);
        document.getElementById('distance-price').textContent = formatCurrency(priceBreakdown.distanceCost);
        document.getElementById('weight-price').textContent = formatCurrency(priceBreakdown.weightSurcharge);
        
        this.bookingData.calculatedPrice = total;
        this.bookingData.priceBreakdown = priceBreakdown;
    }

    calculateStorePrice() {
        const pickupPoint = document.getElementById('pickup-points').value;
        const dropoffPoint = document.getElementById('dropoff-points').value;
        
        if (!pickupPoint || !dropoffPoint) {
            return 7000; // Default store price
        }
        
        // Fixed pricing for store-to-store delivery
        return 7000;
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
        
        let validFilesCount = 0;
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            // Validate file using our uploader
            const validation = imageUploader.validateImage(file);
            if (!validation.valid) {
                showToast(`Skipped ${file.name}: ${validation.error}`, 'warning');
                continue;
            }
            
            this.packagePhotos.push(file);
            validFilesCount++;
            
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const imgContainer = document.createElement('div');
                imgContainer.className = 'relative';
                imgContainer.innerHTML = `
                    <img src="${e.target.result}" class="w-20 h-20 object-cover rounded-lg border" alt="Package photo ${i + 1}">
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
        
        if (validFilesCount > 0) {
            showToast(`📸 ${validFilesCount} photo(s) selected and ready for upload`, 'success');
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
        if (this.packagePhotos.length === 0) return [];

        showToast('Uploading photos to ImgBB...', 'info');

        try {
            // Use ImgBB for free image hosting with progress
            const uploadResults = await imageUploader.uploadMultipleImages(this.packagePhotos);
            
            // Extract just the URLs for storage
            const photoUrls = uploadResults.map(result => result.url);
            
            showToast(`✅ ${photoUrls.length} photo(s) uploaded successfully!`, 'success');
            return photoUrls;

        } catch (error) {
            console.error('Error uploading photos to ImgBB:', error);
            
            // Check if it's an API key error
            if (error.message.includes('API key') || error.message.includes('unavailable')) {
                showToast('⚠️ Image service temporarily down. Proceeding without photos.', 'warning');
                return [];
            }
            
            // For other errors, show the message
            showToast(`❌ Photo upload failed: ${error.message}`, 'error');
            throw error;
        }
    }

    validateForm() {
        const pickup = document.getElementById('pickup-location').value;
        const delivery = document.getElementById('delivery-location').value;
        const packageType = document.getElementById('package-type').value;
        const senderName = document.getElementById('sender-name').value;
        const senderPhone = document.getElementById('sender-phone').value;
        const receiverName = document.getElementById('receiver-name').value;
        const receiverPhone = document.getElementById('receiver-phone').value;
        const pickupDate = document.getElementById('pickup-date').value;
        const deliveryTime = document.getElementById('delivery-time').value;
        
        // Basic validation
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
        
        if (!pickupDate) {
            showToast('Please select a pickup date', 'error');
            return false;
        }
        
        if (!deliveryTime) {
            showToast('Please select a delivery time', 'error');
            return false;
        }
        
        // Phone validation
        if (senderPhone && !this.validateUgandaPhone(senderPhone)) {
            showToast('Please enter a valid Uganda phone number for sender', 'error');
            return false;
        }
        
        if (receiverPhone && !this.validateUgandaPhone(receiverPhone)) {
            showToast('Please enter a valid Uganda phone number for receiver', 'error');
            return false;
        }
        
        // Delivery type specific validation
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
            const deliveryWindow = document.getElementById('delivery-window').value;
            
            if (!pickupZone || !destinationZone) {
                showToast('Please select both pickup and destination zones', 'error');
                return false;
            }
            
            if (!deliveryWindow) {
                showToast('Please select a delivery time window', 'error');
                return false;
            }
        }
        
        return true;
    }

    validateUgandaPhone(phone) {
        const cleaned = phone.replace(/\D/g, '');
        return cleaned.length === 9 && cleaned.startsWith('7');
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
            let bookingData;
            
            if (this.selectedDeliveryType === 'group') {
                // Handle group delivery logic
                bookingData = await this.handleGroupDelivery();
            } else {
                // Handle individual delivery
                bookingData = await this.handleIndividualDelivery();
            }
            
            // Save to Firestore
            const docRef = await addDoc(collection(db, 'bookings'), bookingData);
            
            // Show success modal
            this.showBookingConfirmation(bookingData.id, bookingData.calculatedPrice, bookingData);
            
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

    async handleIndividualDelivery() {
        // Upload photos if any
        const photoUrls = await this.uploadPhotos();
        
        // Generate booking ID
        const bookingId = generateId('FKC');
        
        // Get form values
        const formData = this.getFormData();
        
        // Prepare booking data
        return {
            id: bookingId,
            userId: authManager.currentUser.uid,
            userEmail: authManager.currentUser.email,
            userName: authManager.currentUser.displayName || `${formData.senderName}`,
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
    }

    async handleGroupDelivery() {
        const pickupZone = document.getElementById('pickup-zone').value;
        const destinationZone = document.getElementById('destination-zone').value;
        const deliveryWindow = document.getElementById('delivery-window').value;
        
        // Check for existing group deliveries
        const matchingGroup = this.findMatchingGroup(pickupZone, destinationZone, deliveryWindow);
        
        if (matchingGroup && matchingGroup.members.length < 4) {
            // Join existing group
            return await this.joinExistingGroup(matchingGroup);
        } else {
            // Create new group
            return await this.createNewGroup();
        }
    }

    findMatchingGroup(pickupZone, destinationZone, deliveryWindow) {
        return this.groupDeliveries.find(group => 
            group.pickupZone === pickupZone &&
            group.destinationZone === destinationZone &&
            group.deliveryWindow === deliveryWindow &&
            group.status === 'waiting' &&
            group.members.length < 4
        );
    }

    async joinExistingGroup(group) {
        // Upload photos
        const photoUrls = await this.uploadPhotos();
        
        // Get form data
        const formData = this.getFormData();
        
        // Calculate shared price (average of group)
        const sharedPrice = Math.floor((group.totalPrice + this.bookingData.calculatedPrice) / (group.members.length + 1));
        
        // Create booking for joining member
        const bookingData = {
            id: generateId('FKC'),
            userId: authManager.currentUser.uid,
            userEmail: authManager.currentUser.email,
            userName: authManager.currentUser.displayName || `${formData.senderName}`,
            deliveryType: 'group',
            status: 'confirmed',
            groupId: group.id,
            ...formData,
            photos: photoUrls,
            calculatedPrice: sharedPrice,
            priceBreakdown: { basePrice: sharedPrice, weightSurcharge: 0, distanceCost: 0 },
            distance: group.distance || 0,
            estimatedTime: group.estimatedTime || 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };
        
        // Update group in Firestore (in real implementation)
        console.log('Joining group:', group.id);
        
        return bookingData;
    }

    async createNewGroup() {
        // Upload photos
        const photoUrls = await this.uploadPhotos();
        
        // Get form data
        const formData = this.getFormData();
        
        // Generate group ID
        const groupId = generateId('GRP');
        
        // Create booking
        const bookingData = {
            id: generateId('FKC'),
            userId: authManager.currentUser.uid,
            userEmail: authManager.currentUser.email,
            userName: authManager.currentUser.displayName || `${formData.senderName}`,
            deliveryType: 'group',
            status: 'waiting',
            groupId: groupId,
            groupStatus: 'waiting',
            groupMembers: [authManager.currentUser.uid],
            ...formData,
            photos: photoUrls,
            calculatedPrice: this.bookingData.calculatedPrice,
            priceBreakdown: this.bookingData.priceBreakdown,
            distance: this.bookingData.distance || 0,
            estimatedTime: this.bookingData.estimatedTime || 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };
        
        // Create group delivery record (in real implementation)
        console.log('Creating new group:', groupId);
        
        return bookingData;
    }

    getFormData() {
        const paymentMethod = document.querySelector('input[name="payment-method"]:checked');
        
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
            paymentMethod: paymentMethod ? paymentMethod.value : 'cash',
            
            // Additional fields based on delivery type
            ...this.getDeliveryTypeSpecificData()
        };
    }

    getDeliveryTypeSpecificData() {
        const data = {};
        
        if (this.selectedDeliveryType === 'store') {
            data.pickupPoint = document.getElementById('pickup-points').value;
            data.dropoffPoint = document.getElementById('dropoff-points').value;
            data.pickupPointName = document.getElementById('pickup-points').options[document.getElementById('pickup-points').selectedIndex]?.text || '';
            data.dropoffPointName = document.getElementById('dropoff-points').options[document.getElementById('dropoff-points').selectedIndex]?.text || '';
        } else if (this.selectedDeliveryType === 'group') {
            data.pickupZone = document.getElementById('pickup-zone').value;
            data.destinationZone = document.getElementById('destination-zone').value;
            data.deliveryWindow = document.getElementById('delivery-window').value;
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

                        <div class="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p class="text-gray-600">Pickup Date</p>
                                <p class="font-semibold">${formData.pickupDate}</p>
                            </div>
                            <div>
                                <p class="text-gray-600">Delivery Time</p>
                                <p class="font-semibold capitalize">${formData.deliveryTime}</p>
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
                        <button onclick="window.location.href='my-bookings.html'" class="w-full py-2 border border-primary text-primary font-semibold rounded-lg hover:bg-primary hover:text-white transition">
                            <i class="fas fa-list mr-2"></i> View All Bookings
                        </button>
                        <button id="close-confirmation-btn" class="w-full py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition">
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
                if (input.type === 'radio') {
                    input.checked = input.value === 'cash'; // Reset to cash
                } else if (input.id === 'pickup-date') {
                    // Keep today's date as default
                    input.value = new Date().toISOString().split('T')[0];
                } else {
                    input.value = '';
                }
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
        
        // Hide special fields
        document.querySelectorAll('.delivery-type-field').forEach(field => {
            field.style.display = 'none';
        });
    }

    async loadCollectionPoints() {
        try {
            // Mock collection points - in real app, fetch from Firestore
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
                // Clear existing options
                pickupPointsSelect.innerHTML = '';
                dropoffPointsSelect.innerHTML = '';
                
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

    async loadGroupDeliveries() {
        try {
            // In real app, fetch from Firestore
            // For now, using mock data
            this.groupDeliveries = [
                {
                    id: 'GRP-123',
                    pickupZone: 'kampala',
                    destinationZone: 'wakiso',
                    deliveryWindow: 'morning',
                    status: 'waiting',
                    members: ['user1', 'user2'],
                    totalPrice: 15000,
                    distance: 20,
                    estimatedTime: 30
                }
            ];
        } catch (error) {
            console.error('Error loading group deliveries:', error);
        }
    }

    checkGroupMatches() {
        const pickupZone = document.getElementById('pickup-zone').value;
        const destinationZone = document.getElementById('destination-zone').value;
        const deliveryWindow = document.getElementById('delivery-window').value;
        
        if (pickupZone && destinationZone && deliveryWindow) {
            const matchingGroup = this.findMatchingGroup(pickupZone, destinationZone, deliveryWindow);
            
            if (matchingGroup) {
                this.showGroupMatchNotification(matchingGroup);
            }
        }
    }

    showGroupMatchNotification(group) {
        const notification = document.createElement('div');
        notification.className = 'bg-green-50 border border-green-200 rounded-lg p-4 mb-4';
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-users text-green-500 mr-3"></i>
                <div class="flex-1">
                    <p class="text-green-800 font-semibold">Group Delivery Available!</p>
                    <p class="text-green-600 text-sm">Join ${group.members.length} other(s) going the same way and save ${formatCurrency(this.bookingData.calculatedPrice - (group.totalPrice / (group.members.length + 1)))}</p>
                </div>
                <button id="join-group-btn" class="ml-2 px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition">
                    Join Group
                </button>
            </div>
        `;
        
        const existingNotification = document.querySelector('.bg-green-50.border-green-200');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        document.getElementById('group-delivery-fields').prepend(notification);
        
        document.getElementById('join-group-btn').addEventListener('click', () => {
            this.joinGroupDelivery(group);
        });
    }

    joinGroupDelivery(group) {
        // Update the booking to join the group
        showToast('Joining group delivery...', 'info');
        // The actual joining happens in submitBooking()
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const sendReceiveManager = new SendReceiveManager();
    window.sendReceiveManager = sendReceiveManager;
});

export default SendReceiveManager;
