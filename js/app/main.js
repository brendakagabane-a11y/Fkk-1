import FirebaseService from '../services/firebase-service.js';
import AuthManager from './auth-manager.js';
import SendReceiveManager from './send-receive-manager.js';
import MarketplaceManager from './marketplace-manager.js';
import TrackingManager from './tracking-manager.js';
import DriversManager from './drivers-manager.js';
import { toast } from '../utils/notifications.js';

class FikaConnectApp {
    constructor() {
        this.currentSection = 'services';
        this.managers = {};
        this.init();
    }

    init() {
        console.log('🚀 Initializing FikaConnect App...');
        
        // Initialize Firebase first
        this.initializeFirebase()
            .then(() => {
                this.initializeManagers();
                this.setupEventListeners();
                this.setupGlobalHandlers();
                this.checkAuthentication();
                
                console.log('✅ FikaConnect App initialized successfully');
            })
            .catch(error => {
                console.error('❌ App initialization failed:', error);
                toast.error('Failed to initialize application');
            });
    }

    async initializeFirebase() {
        try {
            // Firebase is already initialized in the service
            console.log('🔥 Firebase service initialized');
            return true;
        } catch (error) {
            console.error('Firebase initialization error:', error);
            throw error;
        }
    }

    initializeManagers() {
        console.log('🔄 Initializing managers...');
        
        try {
            this.managers = {
                auth: new AuthManager(),
                sendReceive: new SendReceiveManager(),
                marketplace: new MarketplaceManager(),
                tracking: new TrackingManager(),
                drivers: new DriversManager()
            };
            
            // Make managers globally available for debugging
            window.authManager = this.managers.auth;
            window.sendReceiveManager = this.managers.sendReceive;
            window.marketplaceManager = this.managers.marketplace;
            window.trackingManager = this.managers.tracking;
            window.driversManager = this.managers.drivers;
            
            console.log('✅ All managers initialized');
        } catch (error) {
            console.error('Manager initialization error:', error);
            toast.error('Some features may not work properly');
        }
    }

    setupEventListeners() {
        console.log('🔧 Setting up event listeners...');
        
        // Navigation back buttons
        this.setupBackButtons();
        
        // Service cards
        this.setupServiceCards();
        
        // Modal controls
        this.setupModals();
        
        // Global UI elements
        this.setupGlobalUI();
        
        console.log('✅ Event listeners setup complete');
    }

    setupBackButtons() {
        const backButtons = [
            { id: 'back-to-services', handler: () => this.showServiceOptions() },
            { id: 'back-to-services-marketplace', handler: () => this.showServiceOptions() },
            { id: 'back-to-services-tracking', handler: () => this.showServiceOptions() },
            { id: 'back-to-services-drivers', handler: () => this.showServiceOptions() }
        ];

        backButtons.forEach(({ id, handler }) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('click', handler);
            } else {
                console.warn(`Back button not found: ${id}`);
            }
        });
    }

    setupServiceCards() {
        const serviceCards = document.querySelectorAll('[data-service]');
        
        if (serviceCards.length === 0) {
            console.warn('No service cards found with [data-service] attribute');
            return;
        }

        serviceCards.forEach(card => {
            card.addEventListener('click', (e) => {
                const service = e.currentTarget.getAttribute('data-service');
                console.log(`🎯 Service card clicked: ${service}`);
                this.showSection(service);
            });
            
            // Add hover effects
            card.style.cursor = 'pointer';
        });

        console.log(`✅ ${serviceCards.length} service cards configured`);
    }

    setupModals() {
        // About modal
        const aboutButton = document.querySelector('[onclick*="toggleAbout"]');
        const closeAbout = document.getElementById('close-about');
        
        if (aboutButton) {
            aboutButton.addEventListener('click', () => this.toggleAbout());
        }
        if (closeAbout) {
            closeAbout.addEventListener('click', () => this.toggleAbout());
        }

        // Feedback modal
        this.setupFeedbackSystem();
    }

    setupFeedbackSystem() {
        const feedbackBtn = document.getElementById('floating-feedback');
        const closeFeedback = document.getElementById('close-feedback');
        const submitFeedback = document.getElementById('submit-feedback');

        if (feedbackBtn) {
            feedbackBtn.addEventListener('click', () => this.toggleFeedback());
        } else {
            console.warn('Floating feedback button not found');
        }

        if (closeFeedback) {
            closeFeedback.addEventListener('click', () => this.toggleFeedback());
        }

        if (submitFeedback) {
            submitFeedback.addEventListener('click', () => this.submitFeedback());
        }

        // Setup rating stars
        this.setupRatingStars();
    }

    setupRatingStars() {
        const starsContainer = document.querySelectorAll('[data-rating]');
        
        starsContainer.forEach(star => {
            star.addEventListener('click', (e) => {
                const rating = parseInt(e.target.getAttribute('data-rating'));
                this.setRating(rating);
            });
            
            star.addEventListener('mouseenter', (e) => {
                const rating = parseInt(e.target.getAttribute('data-rating'));
                this.highlightStars(rating);
            });
        });

        // Reset stars on mouse leave
        const starsArea = document.querySelector('.flex.space-x-1');
        if (starsArea) {
            starsArea.addEventListener('mouseleave', () => {
                const currentRating = this.getCurrentRating();
                this.highlightStars(currentRating);
            });
        }
    }

    setupGlobalUI() {
        // Set minimum date for pickup date
        this.setMinDate();
        
        // Initialize any global UI components
        this.initializeGlobalComponents();
    }

    setMinDate() {
        const today = new Date().toISOString().split('T')[0];
        const pickupDate = document.getElementById('pickup-date');
        
        if (pickupDate) {
            pickupDate.min = today;
            if (!pickupDate.value) {
                pickupDate.value = today;
            }
        }
    }

    initializeGlobalComponents() {
        // Add any global component initialization here
        console.log('🌍 Global components initialized');
    }

    setupGlobalHandlers() {
        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.onPageVisible();
            }
        });

        // Handle online/offline status
        window.addEventListener('online', () => {
            toast.success('Connection restored');
        });

        window.addEventListener('offline', () => {
            toast.warning('You are currently offline');
        });
    }

    onPageVisible() {
        // Refresh data when page becomes visible again
        if (this.currentSection !== 'services') {
            this.refreshCurrentSection();
        }
    }

    refreshCurrentSection() {
        const managerKey = this.getManagerKeyForSection(this.currentSection);
        if (managerKey && this.managers[managerKey] && this.managers[managerKey].refresh) {
            this.managers[managerKey].refresh();
        }
    }

    showServiceOptions() {
        console.log('🏠 Showing service options');
        
        this.hideAllSections();
        const serviceOptions = document.querySelector('.service-options');
        
        if (serviceOptions) {
            serviceOptions.classList.remove('hidden');
            this.currentSection = 'services';
            
            // Add fade-in animation
            serviceOptions.classList.add('fade-in');
            
            // Scroll to top smoothly
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
            console.log('✅ Service options shown');
        } else {
            console.error('Service options section not found');
        }
    }

    showSection(sectionId) {
        console.log(`📁 Showing section: ${sectionId}`);
        
        if (!sectionId) {
            console.error('No section ID provided');
            return;
        }

        this.hideAllSections();
        
        const section = document.getElementById(sectionId);
        if (!section) {
            console.error(`Section not found: ${sectionId}`);
            toast.error(`Section "${sectionId}" not found`);
            return;
        }

        // Show the section
        section.classList.remove('hidden');
        section.classList.add('fade-in');
        this.currentSection = sectionId;
        
        // Initialize section-specific functionality
        this.initializeSectionManager(sectionId);
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        console.log(`✅ Section "${sectionId}" shown successfully`);
    }

    hideAllSections() {
        // Hide all main sections
        const sections = document.querySelectorAll('main > section');
        sections.forEach(section => {
            section.classList.add('hidden');
            section.classList.remove('fade-in');
        });
        
        // Hide service options
        const serviceOptions = document.querySelector('.service-options');
        if (serviceOptions) {
            serviceOptions.classList.add('hidden');
        }
        
        console.log('📂 All sections hidden');
    }

    initializeSectionManager(sectionId) {
        const managerMap = {
            'send-receive': 'sendReceive',
            'marketplace': 'marketplace', 
            'tracking': 'tracking',
            'drivers': 'drivers'
        };
        
        const managerKey = managerMap[sectionId];
        
        if (managerKey && this.managers[managerKey]) {
            console.log(`🎛️ Initializing manager for: ${sectionId}`);
            
            // Call the manager's section show handler if it exists
            if (typeof this.managers[managerKey].onSectionShow === 'function') {
                this.managers[managerKey].onSectionShow();
            }
            
            // Load data for the section
            if (typeof this.managers[managerKey].loadData === 'function') {
                this.managers[managerKey].loadData();
            }
        } else {
            console.warn(`No manager found for section: ${sectionId}`);
        }
    }

    getManagerKeyForSection(sectionId) {
        const managerMap = {
            'send-receive': 'sendReceive',
            'marketplace': 'marketplace', 
            'tracking': 'tracking',
            'drivers': 'drivers'
        };
        return managerMap[sectionId];
    }

    // Rating system methods
    setRating(rating) {
        console.log(`⭐ Setting rating: ${rating}`);
        this.currentRating = rating;
        this.highlightStars(rating);
    }

    highlightStars(rating) {
        const stars = document.querySelectorAll('[data-rating]');
        stars.forEach(star => {
            const starRating = parseInt(star.getAttribute('data-rating'));
            if (starRating <= rating) {
                star.classList.remove('far', 'text-gray-400');
                star.classList.add('fas', 'text-yellow-500');
            } else {
                star.classList.remove('fas', 'text-yellow-500');
                star.classList.add('far', 'text-gray-400');
            }
        });
    }

    getCurrentRating() {
        return this.currentRating || 0;
    }

    // Modal methods
    toggleAbout() {
        const modal = document.getElementById('about-modal');
        if (modal) {
            modal.classList.toggle('hidden');
            console.log('ℹ️ About modal toggled');
        }
    }

    toggleFeedback() {
        const modal = document.getElementById('feedback-modal');
        if (modal) {
            modal.classList.toggle('hidden');
            console.log('💬 Feedback modal toggled');
            
            // Reset form when opening
            if (!modal.classList.contains('hidden')) {
                this.setRating(0);
                const feedbackText = document.getElementById('feedback-text');
                if (feedbackText) feedbackText.value = '';
            }
        }
    }

    submitFeedback() {
        const rating = this.getCurrentRating();
        const feedbackElement = document.getElementById('feedback-text');
        const feedback = feedbackElement ? feedbackElement.value : '';

        if (rating === 0) {
            toast.warning('Please select a rating');
            return;
        }

        console.log('📝 Submitting feedback:', { rating, feedback });

        // Simulate API call
        setTimeout(() => {
            // Save to Firestore
            FirebaseService.addDocument('feedback', {
                rating: rating,
                feedback: feedback,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                section: this.currentSection
            }).then(result => {
                if (result.success) {
                    toast.success('Thank you for your feedback!');
                    this.toggleFeedback();
                } else {
                    throw new Error(result.error);
                }
            }).catch(error => {
                console.error('Feedback submission error:', error);
                toast.error('Failed to submit feedback');
            });
        }, 1000);
    }

    // Authentication methods
    checkAuthentication() {
        // This will be handled by AuthManager
        console.log('🔐 Authentication check initiated');
    }

    requireAuth(action, message = 'Please sign in to continue') {
        if (!this.managers.auth || !this.managers.auth.isAuthenticated) {
            if (this.managers.auth) {
                this.managers.auth.showLoginModal(message);
            } else {
                toast.warning(message);
                setTimeout(() => {
                    window.location.href = 'authentication.html';
                }, 2000);
            }
            return false;
        }
        return true;
    }

    // Utility methods
    showLoading(selector, show = true) {
        const element = document.querySelector(selector);
        if (element) {
            if (show) {
                element.classList.remove('hidden');
            } else {
                element.classList.add('hidden');
            }
        }
    }

    disableElement(selector, disable = true) {
        const element = document.querySelector(selector);
        if (element) {
            element.disabled = disable;
        }
    }

    // Error handling
    handleError(error, context = '') {
        console.error(`❌ Error in ${context}:`, error);
        
        let userMessage = 'An unexpected error occurred';
        
        if (error.message.includes('network') || error.message.includes('offline')) {
            userMessage = 'Network error. Please check your connection.';
        } else if (error.message.includes('permission') || error.message.includes('auth')) {
            userMessage = 'Authentication required. Please sign in.';
        } else if (error.message.includes('quota') || error.message.includes('limit')) {
            userMessage = 'Service temporarily unavailable. Please try again later.';
        }
        
        toast.error(userMessage);
        
        // You can add more specific error handling here
        return userMessage;
    }

    // Debug methods (remove in production)
    debug() {
        console.group('🔍 FikaConnect App Debug Info');
        console.log('Current Section:', this.currentSection);
        console.log('Managers:', Object.keys(this.managers));
        console.log('Firebase Auth:', FirebaseService.auth?.currentUser);
        console.log('Online Status:', navigator.onLine);
        console.groupEnd();
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM fully loaded, initializing FikaConnect...');
    
    try {
        window.fikaApp = new FikaConnectApp();
        
        // Make app available globally for debugging
        window.fikaApp.debug();
        
        // Add global error handler
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            toast.error('A JavaScript error occurred');
        });
        
        console.log('🎉 FikaConnect App ready!');
        
    } catch (error) {
        console.error('💥 Fatal error during app initialization:', error);
        
        // Show user-friendly error message
        const errorElement = document.createElement('div');
        errorElement.className = 'fixed top-0 left-0 right-0 bg-red-500 text-white p-4 text-center z-50';
        errorElement.innerHTML = `
            <strong>Application Error</strong>: Failed to initialize. 
            <button onclick="location.reload()" class="ml-2 underline">Reload Page</button>
        `;
        document.body.appendChild(errorElement);
    }
});

// Global helper functions
window.showSection = (sectionId) => {
    if (window.fikaApp) {
        window.fikaApp.showSection(sectionId);
    } else {
        console.error('FikaConnect app not initialized');
    }
};

window.showServiceOptions = () => {
    if (window.fikaApp) {
        window.fikaApp.showServiceOptions();
    } else {
        console.error('FikaConnect app not initialized');
    }
};

window.toggleAbout = () => {
    if (window.fikaApp) {
        window.fikaApp.toggleAbout();
    }
};

window.toggleFeedback = () => {
    if (window.fikaApp) {
        window.fikaApp.toggleFeedback();
    }
};

export default FikaConnectApp;
