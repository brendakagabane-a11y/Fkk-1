// Simple test to check if JS is loading
console.log('✅ FikaConnect JS loaded!');

// Basic functionality
let currentUser = null;
let selectedCategory = 'all';

// Show service options (main dashboard)
function showServiceOptions() {
    document.querySelectorAll('section').forEach(section => {
        section.classList.add('hidden');
    });
    document.querySelector('.bg-white.py-12').classList.remove('hidden');
}

// Show specific section
function showSection(sectionId) {
    document.querySelectorAll('section').forEach(section => {
        section.classList.add('hidden');
    });
    document.getElementById(sectionId).classList.remove('hidden');
    document.getElementById(sectionId).classList.add('fade-in');
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Toggle About modal
function toggleAbout() {
    const modal = document.getElementById('about-modal');
    modal.classList.toggle('hidden');
}

// Toggle Feedback modal
function toggleFeedback() {
    const modal = document.getElementById('feedback-modal');
    modal.classList.toggle('hidden');
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Page loaded successfully!');
    
    // Set up back buttons
    document.getElementById('back-to-services')?.addEventListener('click', showServiceOptions);
    document.getElementById('back-to-services-marketplace')?.addEventListener('click', showServiceOptions);
    document.getElementById('back-to-services-tracking')?.addEventListener('click', showServiceOptions);
    document.getElementById('back-to-services-drivers')?.addEventListener('click', showServiceOptions);
    
    // Set up modal close buttons
    document.getElementById('close-about')?.addEventListener('click', toggleAbout);
    document.getElementById('close-feedback')?.addEventListener('click', toggleFeedback);
    
    // Set up floating feedback button
    document.getElementById('floating-feedback')?.addEventListener('click', toggleFeedback);
    
    // Set up service cards
    document.querySelectorAll('.card-hover').forEach(card => {
        card.addEventListener('click', function() {
            const sectionId = this.getAttribute('onclick')?.match(/showSection\('([^']+)'\)/)?.[1];
            if (sectionId) {
                showSection(sectionId);
            }
        });
    });

    // Simple form interaction for testing
    const bookButton = document.getElementById('book-now');
    if (bookButton) {
        bookButton.addEventListener('click', function() {
            alert('Booking functionality would work here! For now, this shows the JS is working.');
        });
    }

    console.log('✅ All event listeners set up!');
});

// Make functions available globally
window.showServiceOptions = showServiceOptions;
window.showSection = showSection;
window.toggleAbout = toggleAbout;
window.toggleFeedback = toggleFeedback;
