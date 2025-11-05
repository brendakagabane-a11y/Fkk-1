import { toast } from '../utils/notifications.js';

class DriversManager {
    constructor() {
        this.init();
    }

    init() {
        console.log('🚗 DriversManager initialized');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Apply now buttons
        const applyButtons = document.querySelectorAll('#drivers button');
        applyButtons.forEach(button => {
            if (button.textContent.includes('Apply Now')) {
                button.addEventListener('click', (e) => {
                    this.handleDriverApplication(e.target);
                });
            }
        });

        // Support chat
        const supportButton = document.getElementById('chat-with-support');
        if (supportButton) {
            supportButton.addEventListener('click', () => this.chatWithSupport());
        }
    }

    handleDriverApplication(button) {
        const vehicleType = button.closest('.bg-gray-50')?.querySelector('h4')?.textContent || 'driver';
        toast.info(`Opening ${vehicleType} application form...`);
        
        // Redirect to authentication with driver role
        setTimeout(() => {
            window.location.href = `authentication.html?role=driver&type=${vehicleType.toLowerCase()}`;
        }, 1500);
    }

    chatWithSupport() {
        toast.info('Connecting you with Fika support...');
        
        setTimeout(() => {
            alert('Fika Support: Hello! How can we help you with your driver application?\n\nCall us: +256 700 123 456\nEmail: drivers@fikaconnect.com');
        }, 1000);
    }

    onSectionShow() {
        console.log('🚗 Drivers section shown');
        // Load driver-specific data if needed
    }

    loadData() {
        // Load driver testimonials, requirements, etc.
        console.log('📊 Loading drivers data...');
    }
}

export default DriversManager;
