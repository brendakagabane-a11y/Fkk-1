import FirebaseService from '../services/firebase-service.js';
import { toast } from '../utils/notifications.js';

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.userData = null;
        this.init();
    }

    init() {
        // Listen for auth state changes
        FirebaseService.auth.onAuthStateChanged(async (user) => {
            if (user) {
                this.currentUser = user;
                this.isAuthenticated = true;
                
                // Get user data from Firestore
                const result = await FirebaseService.getUserData(user.uid);
                if (result.success) {
                    this.userData = result.data;
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
        
        if (this.isAuthenticated) {
            authBtn.textContent = 'Log Out';
            authBtn.onclick = () => this.logout();
            
            if (userMenuBtn) {
                userMenuBtn.classList.remove('hidden');
                const displayName = this.userData?.firstName || this.currentUser.displayName || 'Account';
                userMenuBtn.innerHTML = `<i class="fas fa-user mr-2"></i> ${displayName}`;
            }
        } else {
            authBtn.textContent = 'Sign Up';
            authBtn.onclick = () => window.location.href = 'authentication.html';
            
            if (userMenuBtn) {
                userMenuBtn.classList.add('hidden');
            }
        }
    }

    async logout() {
        try {
            await FirebaseService.auth.signOut();
            toast.success('Logged out successfully');
        } catch (error) {
            toast.error('Error logging out');
        }
    }

    checkAuth() {
        if (!this.isAuthenticated) {
            this.showLoginModal();
            return false;
        }
        return true;
    }

    showLoginModal() {
        // Implementation for login modal
        toast.info('Please sign in to continue');
        setTimeout(() => {
            window.location.href = 'authentication.html';
        }, 2000);
    }
}

export default AuthManager;
