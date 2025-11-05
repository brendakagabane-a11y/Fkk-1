// Simple test script
console.log('✅ TEST: JavaScript is loading!');

// Basic show/hide function
function showSection(sectionId) {
    console.log('Trying to show:', sectionId);
    
    // Hide all sections
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        section.classList.add('hidden');
    });
    
    // Show the selected section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.remove('hidden');
        console.log('✅ Section shown:', sectionId);
    } else {
        console.log('❌ Section not found:', sectionId);
    }
}

// Make function available globally
window.showSection = showSection;

// Add click listeners to service cards
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM loaded!');
    
    const cards = document.querySelectorAll('.card-hover');
    console.log('Found cards:', cards.length);
    
    cards.forEach(card => {
        card.addEventListener('click', function() {
            const sectionMap = {
                'Send/Receive': 'send-receive',
                'Marketplace': 'marketplace', 
                'Track': 'tracking',
                'Drive': 'drivers'
            };
            
            const cardText = this.querySelector('h3').textContent;
            const sectionId = sectionMap[cardText];
            
            if (sectionId) {
                showSection(sectionId);
            }
        });
    });
    
    // Add back button functionality
    const backButtons = document.querySelectorAll('[id^="back-to-services"]');
    backButtons.forEach(button => {
        button.addEventListener('click', function() {
            document.querySelectorAll('section').forEach(section => {
                section.classList.add('hidden');
            });
            document.querySelector('.bg-white.py-12').classList.remove('hidden');
        });
    });
    
    console.log('✅ All event listeners added!');
});
