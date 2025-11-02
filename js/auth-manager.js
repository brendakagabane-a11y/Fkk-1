import { auth, onAuthStateChanged, db, getDoc, doc, signOut } from './firebase-config.js';
import { showToast } from './utils.js';

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.userData = null;
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
                        this.userData = userDoc.data();
                        console.log('User data loaded:', this.userData);
                    } else {
                        console.log('No user data found in Firestore');
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                }
                
                this.updateUI();
            } else {
                this.currentUser = null;
                this.isAuthenticated = false;
                this.userData = null;
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
                const displayName = this.userData?.firstName || this.currentUser.displayName || 'Account';
                userMenuBtn.innerHTML = `<i class="fas fa-user mr-2"></i> ${displayName}`;
                userMenuBtn.onclick = () => this.showUserMenu();
            }
        } else {
            authBtn.textContent = 'Sign Up';
            authBtn.onclick = () => window.location.href = 'authentication.html';
            
            if (userMenuBtn) {
                userMenuBtn.classList.add('hidden');
            }
        }
    }

    showUserMenu() {
        // Create user menu modal
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-xl shadow-lg max-w-sm w-full mx-4">
                <div class="gradient-bg text-white p-6 rounded-t-xl">
                    <div class="flex justify-between items-center">
                        <h2 class="text-xl font-bold">My Account</h2>
                        <button id="close-user-menu" class="text-white hover:text-gray-200">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                <div class="p-4">
                    <div class="flex items-center mb-4">
                        <div class="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white mr-3">
                            <i class="fas fa-user"></i>
                        </div>
                        <div>
                            <p class="font-semibold">${this.userData?.firstName || 'User'} ${this.userData?.lastName || ''}</p>
                            <p class="text-sm text-gray-600">${this.currentUser.email}</p>
                            <p class="text-xs text-gray-500 capitalize">${this.userData?.userType || 'customer'}</p>
                        </div>
                    </div>
                    
                    <div class="space-y-2">
                        <button onclick="window.location.href='dashboards.html'" class="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-lg transition">
                            <i class="fas fa-tachometer-alt mr-2 text-gray-600"></i> Dashboard
                        </button>
                        <button onclick="window.location.href='my-bookings.html'" class="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-lg transition">
                            <i class="fas fa-shipping-fast mr-2 text-gray-600"></i> My Bookings
                        </button>
                        <button onclick="window.location.href='profile.html'" class="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-lg transition">
                            <i class="fas fa-user-edit mr-2 text-gray-600"></i> Edit Profile
                        </button>
                        <button id="user-menu-logout" class="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-lg transition text-red-600">
                            <i class="fas fa-sign-out-alt mr-2"></i> Log Out
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        document.getElementById('close-user-menu').onclick = () => modal.remove();
        document.getElementById('user-menu-logout').onclick = () => {
            modal.remove();
            this.logout();
        };
    }

    async logout() {
        try {
            await signOut(auth);
            showToast('Logged out successfully', 'success');
            window.location.reload();
        } catch (error) {
            console.error('Logout error:', error);
            showToast('Error logging out', 'error');
        }
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

    // Get current user data
    getUserData() {
        return this.userData;
    }

    // Check if user has specific role
    hasRole(role) {
        return this.userData?.userType === role;
    }
}

// Create global instance
const authManager = new AuthManager();
export default authManager;
