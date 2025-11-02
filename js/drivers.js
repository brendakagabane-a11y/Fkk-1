import authManager from './auth-manager.js';
import { showToast } from './utils.js';

class DriversManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadDriverTestimonials();
    }

    setupEventListeners() {
        // Apply now buttons are handled via onclick attributes in HTML
        // Support chat button
        document.getElementById('chat-with-support')?.addEventListener('click', () => this.chatWithSupport());
        
        // Driver benefits tooltips
        this.setupBenefitTooltips();
    }

    setupBenefitTooltips() {
        const benefits = [
            {
                element: document.querySelector('[class*="fa-money-bill-wave"]')?.closest('div'),
                title: 'Competitive Earnings',
                description: 'Earn up to UGX 50,000 daily with our transparent pricing model'
            },
            {
                element: document.querySelector('[class*="fa-shield-alt"]')?.closest('div'),
                title: 'Insurance Coverage',
                description: 'Comprehensive insurance for you and the goods you deliver'
            },
            {
                element: document.querySelector('[class*="fa-mobile-alt"]')?.closest('div'),
                title: 'Easy-to-Use App',
                description: 'Simple interface designed specifically for Ugandan drivers'
            },
            {
                element: document.querySelector('[class*="fa-clock"]')?.closest('div'),
                title: 'Flexible Schedule',
                description: 'Work when you want, take breaks when you need'
            }
        ];

        benefits.forEach(benefit => {
            if (benefit.element) {
                benefit.element.addEventListener('mouseenter', () => this.showBenefitTooltip(benefit));
                benefit.element.addEventListener('mouseleave', () => this.hideBenefitTooltip());
            }
        });
    }

    showBenefitTooltip(benefit) {
        // Create tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'absolute z-10 bg-white p-3 rounded-lg shadow-lg border border-gray-200 max-w-xs';
        tooltip.innerHTML = `
            <h4 class="font-semibold text-primary mb-1">${benefit.title}</h4>
            <p class="text-sm text-gray-600">${benefit.description}</p>
        `;
        
        // Position tooltip
        const rect = benefit.element.getBoundingClientRect();
        tooltip.style.top = `${rect.top - tooltip.offsetHeight - 10}px`;
        tooltip.style.left = `${rect.left + rect.width / 2 - 100}px`;
        
        tooltip.id = 'benefit-tooltip';
        document.body.appendChild(tooltip);
    }

    hideBenefitTooltip() {
        const tooltip = document.getElementById('benefit-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }

    loadDriverTestimonials() {
        // Mock testimonials - in real app, these would come from Firestore
        const testimonials = [
            {
                name: "Robert Kato",
                role: "Boda Boda Driver",
                location: "Kampala",
                text: "FikaConnect has helped me earn a stable income. The app is easy to use and payments come on time. I've been able to save enough to repair my motorcycle.",
                rating: 5,
                joinDate: "2024"
            },
            {
                name: "Sarah Nalwoga",
                role: "Van Driver", 
                location: "Jinja",
                text: "As a female driver, I appreciate the safety features and support from FikaConnect. The customers are verified and the routes are well-planned.",
                rating: 4,
                joinDate: "2024"
            },
            {
                name: "David Ochieng",
                role: "Truck Driver",
                location: "Masaka",
                text: "The group delivery feature has helped me maximize my truck's capacity. I'm earning more while serving multiple customers on the same route.",
                rating: 5,
                joinDate: "2023"
            }
        ];

        this.displayTestimonials(testimonials);
    }

    displayTestimonials(testimonials) {
        const testimonialContainer = document.querySelector('#drivers .bg-gray-50.p-4.rounded-lg');
        if (!testimonialContainer) return;

        // Rotate testimonials every 10 seconds
        let currentTestimonial = 0;
        
        const showTestimonial = (index) => {
            const testimonial = testimonials[index];
            testimonialContainer.innerHTML = `
                <div class="flex items-start">
                    <div class="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white mr-4 flex-shrink-0">
                        <i class="fas fa-user"></i>
                    </div>
                    <div>
                        <div class="flex items-center mb-2">
                            <div class="flex text-yellow-400 mr-2">
                                ${'★'.repeat(testimonial.rating)}${'☆'.repeat(5 - testimonial.rating)}
                            </div>
                            <span class="text-sm text-gray-500">${testimonial.joinDate}</span>
                        </div>
                        <p class="text-gray-700 italic mb-3">"${testimonial.text}"</p>
                        <p class="text-sm font-semibold">- ${testimonial.name}, ${testimonial.role}</p>
                        <p class="text-xs text-gray-500">${testimonial.location}</p>
                    </div>
                </div>
            `;
        };

        // Show first testimonial
        showTestimonial(currentTestimonial);

        // Rotate testimonials
        setInterval(() => {
            currentTestimonial = (currentTestimonial + 1) % testimonials.length;
            showTestimonial(currentTestimonial);
        }, 10000);
    }

    chatWithSupport() {
        if (!authManager.checkAuth()) return;

        showToast('Connecting you with Fika support...', 'info');
        
        // Simulate chat opening
        setTimeout(() => {
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            modal.innerHTML = `
                <div class="bg-white rounded-xl shadow-lg max-w-md w-full mx-4">
                    <div class="gradient-bg text-white p-6 rounded-t-xl">
                        <div class="flex justify-between items-center">
                            <h2 class="text-2xl font-bold">Fika Support</h2>
                            <button id="close-support-chat" class="text-white hover:text-gray-200">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                    <div class="p-6">
                        <div class="text-center mb-6">
                            <div class="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-3">
                                <i class="fas fa-headset"></i>
                            </div>
                            <h3 class="text-xl font-semibold mb-2">Hello ${authManager.userData?.firstName || 'there'}!</h3>
                            <p class="text-gray-600">How can we help you with your driver application?</p>
                        </div>
                        
                        <div class="space-y-3">
                            <button onclick="driversManager.askQuestion('requirements')" class="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                                <i class="fas fa-file-alt mr-2 text-primary"></i> What documents do I need?
                            </button>
                            <button onclick="driversManager.askQuestion('earnings')" class="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                                <i class="fas fa-money-bill-wave mr-2 text-primary"></i> How much can I earn?
                            </button>
                            <button onclick="driversManager.askQuestion('verification')" class="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                                <i class="fas fa-user-check mr-2 text-primary"></i> How long does verification take?
                            </button>
                            <button onclick="driversManager.askQuestion('other')" class="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                                <i class="fas fa-question-circle mr-2 text-primary"></i> Other questions
                            </button>
                        </div>
                        
                        <div class="mt-6 pt-4 border-t border-gray-200">
                            <p class="text-sm text-gray-600 text-center">Prefer to talk to a human?</p>
                            <button onclick="driversManager.callSupport()" class="w-full mt-2 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition">
                                <i class="fas fa-phone mr-2"></i> Call Support: +256 700 123 456
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            document.getElementById('close-support-chat').onclick = () => modal.remove();
        }, 1000);
    }

    askQuestion(type) {
        const questions = {
            requirements: "To become a FikaConnect driver, you'll need:\n• Valid driver's license\n• National ID\n• Vehicle registration\n• Insurance certificate\n• Recent passport photo",
            earnings: "Our drivers typically earn:\n• Boda Boda: UGX 20,000 - 50,000 daily\n• Van/Truck: UGX 50,000 - 150,000 daily\nEarnings vary based on your availability and the routes you choose.",
            verification: "The verification process usually takes 2-3 business days once all your documents are submitted. We'll notify you via SMS when your account is approved.",
            other: "For other questions, please call our support team at +256 700 123 456 or visit our driver center in Kampala."
        };

        alert(questions[type] || questions.other);
    }

    callSupport() {
        const phoneNumber = "+256700123456";
        const confirmCall = confirm(`Call FikaConnect support at ${phoneNumber}?`);
        if (confirmCall) {
            window.location.href = `tel:${phoneNumber}`;
        }
    }

    // Method to handle driver application redirect with parameters
    applyAsDriver(vehicleType) {
        if (!authManager.isAuthenticated) {
            // Redirect to authentication with driver parameters
            window.location.href = `authentication.html?role=driver&type=${vehicleType}`;
        } else {
            // User is already authenticated, check if they need to complete profile
            if (authManager.userData?.userType !== 'driver') {
                showToast('Redirecting to driver application...', 'info');
                // In a real app, this would redirect to driver application form
                setTimeout(() => {
                    showToast('Driver application form would open here', 'info');
                }, 1000);
            } else {
                showToast('You are already a registered driver!', 'info');
            }
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const driversManager = new DriversManager();
    window.driversManager = driversManager;
});

export default DriversManager;
