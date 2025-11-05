import { toast } from '../utils/notifications.js';

class TrackingManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        const trackBtn = document.getElementById('track-delivery');
        if (trackBtn) {
            trackBtn.addEventListener('click', () => this.trackDelivery());
        }
    }

    async trackDelivery() {
        const deliveryId = document.getElementById('delivery-id').value.trim();
        
        if (!deliveryId) {
            toast.error('Please enter a delivery ID');
            return;
        }

        // Show loading
        toast.info('Tracking delivery...');

        // Simulate API call
        setTimeout(() => {
            this.showTrackingResults(deliveryId);
        }, 1500);
    }

    showTrackingResults(deliveryId) {
        const results = document.getElementById('tracking-results');
        const loginPrompt = document.getElementById('tracking-login-prompt');
        
        // For demo, always show results
        results.classList.remove('hidden');
        if (loginPrompt) loginPrompt.classList.add('hidden');
        
        // Update progress (simulated)
        this.updateProgress(75);
        
        // Update driver info
        document.getElementById('driver-name').textContent = 'Driver: Robert K.';
        document.getElementById('driver-vehicle').textContent = 'Vehicle: Boda Boda';
        document.getElementById('estimated-delivery').textContent = 'Today, 3:45 PM';
        
        toast.success(`Tracking delivery ${deliveryId}`);
    }

    updateProgress(percent) {
        const progressFill = document.getElementById('progress-fill');
        if (progressFill) {
            progressFill.style.width = `${percent}%`;
        }
        
        // Update status indicators
        const statuses = ['ordered', 'picked', 'route', 'delivered'];
        statuses.forEach((status, index) => {
            const element = document.getElementById(`status-${status}`);
            if (element) {
                const statusPercent = (index + 1) * 25;
                if (percent >= statusPercent) {
                    element.classList.remove('bg-gray-300');
                    element.classList.add('bg-green-500');
                }
            }
        });
    }

    onSectionShow() {
        // Reset tracking when section is shown
        document.getElementById('delivery-id').value = '';
        const results = document.getElementById('tracking-results');
        if (results) results.classList.add('hidden');
    }
}

export default TrackingManager;
