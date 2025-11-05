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
        this.setupEventListeners();
        this.initializeManagers();
        this.checkAuthentication();
        
        console.log('FikaConnect App initialized');
    }

    setupEventListeners() {
        // Navigation
        document.getElementById('back-to-services')?.addEventListener('click', () => this.showServiceOptions());
        document.getElementById('back-to-services-marketplace')?.addEventListener('click', () => this.showServiceOptions());
        document.getElementById('back-to-services-tracking')?.addEventListener('click', () => this.showServiceOptions());
        document.getElementById('back-to-services-drivers')?.addEventListener('click', () => this.showServiceOptions());

        // Service cards
        document.querySelectorAll('[data-service]').forEach(card => {
            card.addEventListener('click', (e) => {
                const service = e.currentTarget.getAttribute('data-service');
                this.showSection(service);
            });
        });

        // About modal
        document.getElementById('close-about')?.addEventListener('click', () => this.toggleAbout());
        document.querySelector('[onclick="toggleAbout()"]')?.addEventListener('click', () => this.toggleAbout());

        // Feedback system
        this.setupFeedbackSystem();
    }

    initializeManagers() {
        this.managers.auth = new AuthManager();
        this.managers.sendReceive = new SendReceiveManager();
        this.managers.marketplace = new MarketplaceManager();
        this.managers.tracking = new TrackingManager();
        this.managers.drivers = new DriversManager();
    }

    checkAuthentication() {
        // Auth state will be handled by AuthManager
    }

    showServiceOptions() {
        this.hideAllSections();
        document.querySelector('.service-options').classList.remove('hidden');
        this.currentSection = 'services';
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    showSection(sectionId) {
        this.hideAllSections();
        
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.remove('hidden');
            section.classList.add('fade-in');
            this.currentSection = sectionId;
            
            // Notify the appropriate manager
            if (this.managers[sectionId]) {
                this.managers[sectionId].onSectionShow();
            }
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            toast.error(`Section ${sectionId} not found`);
        }
    }

    hideAllSections() {
        // Hide all main sections
        document.querySelectorAll('main > section').forEach(section => {
            section.classList.add('hidden');
        });
        
        // Hide service options
        document.querySelector('.service-options')?.classList.add('hidden');
    }

    setupFeedbackSystem() {
        const feedbackBtn = document.getElementById('floating-feedback');
        const feedbackModal = document.getElementById('feedback-modal');
        const closeFeedback = document.getElementById('close-feedback');
        const submitFeedback = document.getElementById('submit-feedback');

        if (feedbackBtn && feedbackModal) {
            feedbackBtn.addEventListener('click', () => this.toggleFeedback());
            closeFeedback?.addEventListener('click', () => this.toggleFeedback());
            submitFeedback?.addEventListener('click', () => this.submitFeedback());
        }

        // Setup rating stars
        this.setupRatingStars();
    }

    setupRatingStars() {
        const stars = document.querySelectorAll('[data-rating]');
        stars.forEach(star => {
            star.addEventListener('click', (e) => {
                const rating = parseInt(e.target.getAttribute('data-rating'));
                this.setRating(rating);
            });
        });
    }

    setRating(rating) {
        const stars = document.querySelectorAll('[data-rating]');
        stars.forEach(star => {
            const starRating = parseInt(star.getAttribute('data-rating'));
            if (starRating <= rating) {
                star.classList.remove('far');
                star.classList.add('fas', 'text-yellow-500');
            } else {
                star.classList.remove('fas', 'text-yellow-500');
                star.classList.add('far', 'text-gray-400');
            }
        });
    }

    toggleAbout() {
        const modal = document.getElementById('about-modal');
        modal?.classList.toggle('hidden');
    }

    toggleFeedback() {
        const modal = document.getElementById('feedback-modal');
        modal?.classList.toggle('hidden');
    }

    submitFeedback() {
        const rating = document.querySelector('[data-rating].fas')?.getAttribute('data-rating') || 0;
        const feedback = document.getElementById('feedback-text')?.value || '';

        // Simulate feedback submission
        console.log('Feedback submitted:', { rating, feedback });
        
        // In a real app, send to backend
        FirebaseService.addDocument('feedback', {
            rating: parseInt(rating),
            feedback: feedback,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        });

        toast.success('Thank you for your feedback!');
        this.toggleFeedback();
        
        // Reset form
        this.setRating(0);
        document.getElementById('feedback-text').value = '';
    }

    // Global method to check auth before actions
    requireAuth(action, message = 'Please sign in to continue') {
        if (!this.managers.auth.isAuthenticated) {
            this.managers.auth.showLoginModal(message);
            return false;
        }
        return true;
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.fikaApp = new FikaConnectApp();
});

export default FikaConnectApp;
