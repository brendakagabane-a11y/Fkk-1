import { auth, onAuthStateChanged, db, getDoc, doc } from './firebase-config.js';

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.init();
    }

    init() {
        // Listen for auth state changes
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                this.currentUser = user;
                this.isAuthenticated = true;
                
                // Get user data from Firestore
                try {
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    if (userDoc.exists()) {
                        this.currentUser.data = userDoc.data();
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                }
                
                this.updateUI();
            } else {
                this.currentUser = null;
                this.isAuthenticated = false;
                this.updateUI();
            }
        });
    }

    updateUI() {
        const authBtn = document.getElementById('auth-btn');
        const userMenuBtn = document.getElementById('user-menu-btn');
        
        if (this.isAuthenticated && this.currentUser) {
            authBtn.textContent = 'Log Out';
            authBtn.onclick = () => this.logout();
            
            if (userMenuBtn) {
                userMenuBtn.classList.remove('hidden');
                userMenuBtn.innerHTML = `<i class="fas fa-user mr-2"></i> ${this.currentUser.displayName || 'Account'}`;
            }
        } else {
            authBtn.textContent = 'Sign Up';
            authBtn.onclick = () => window.location.href = 'authentication.html';
            
            if (userMenuBtn) {
                userMenuBtn.classList.add('hidden');
            }
        }
    }

    logout() {
        auth.signOut().then(() => {
            window.location.reload();
        });
    }

    // Check if user is authenticated
    checkAuth() {
        if (!this.isAuthenticated) {
            this.showLoginModal();
            return false;
        }
        return true;
    }

    showLoginModal() {
        // Create and show login modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-xl shadow-lg max-w-md w-full mx-4">
                <div class="gradient-bg text-white p-6 rounded-t-xl">
                    <div class="flex justify-between items-center">
                        <h2 class="text-2xl font-bold">Sign In Required</h2>
                        <button id="close-auth-modal" class="text-white hover:text-gray-200">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                <div class="p-6">
                    <p class="text-gray-700 mb-4">Please sign in to continue with your booking.</p>
                    <div class="flex space-x-3">
                        <button onclick="window.location.href='authentication.html'" class="flex-1 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition">
                            Sign In
                        </button>
                        <button id="cancel-auth" class="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        document.getElementById('close-auth-modal').onclick = () => modal.remove();
        document.getElementById('cancel-auth').onclick = () => modal.remove();
    }
}

// Create global instance
const authManager = new AuthManager();
export default authManager;
