import { db, storage, serverTimestamp, addDoc, collection, doc, setDoc, getDocs, query, where, orderBy, ref, uploadBytes, getDownloadURL } from './firebase-config.js';
import authManager from './auth-manager.js';
import { showToast, formatCurrency, debounce } from './utils.js';

class MarketplaceManager {
    constructor() {
        this.products = [];
        this.userListings = [];
        this.selectedCategory = 'all';
        this.searchTerm = '';
        this.sortBy = 'newest';
        this.productPhotos = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadProducts();
        this.checkSellerStatus();
    }

    setupEventListeners() {
        // Marketplace tabs
        document.getElementById('tab-buy')?.addEventListener('click', () => this.switchTab('buy'));
        document.getElementById('tab-sell')?.addEventListener('click', () => this.switchTab('sell'));
        document.getElementById('tab-account')?.addEventListener('click', () => this.switchTab('account'));

        // Category selection
        document.querySelectorAll('[data-category]').forEach(button => {
            button.addEventListener('click', (e) => this.selectCategory(e.target.getAttribute('data-category')));
        });

        // Search functionality
        const searchInput = document.getElementById('product-search');
        const searchButton = document.getElementById('search-products');
        
        if (searchInput) {
            searchInput.addEventListener('input', debounce((e) => {
                this.searchTerm = e.target.value;
                this.loadProducts();
            }, 300));
        }
        
        if (searchButton) {
            searchButton.addEventListener('click', () => {
                this.searchTerm = document.getElementById('product-search').value;
                this.loadProducts();
            });
        }

        // Product listing
        document.getElementById('select-product-photos')?.addEventListener('click', () => {
            document.getElementById('product-photos').click();
        });
        document.getElementById('product-photos')?.addEventListener('change', (e) => this.handleProductPhotoUpload(e));
        document.getElementById('list-product')?.addEventListener('click', () => this.listProduct());

        // Seller account
        document.getElementById('complete-profile')?.addEventListener('click', () => this.completeSellerProfile());
    }

    switchTab(tab) {
        // Update tab buttons
        document.getElementById('tab-buy').classList.remove('tab-active');
        document.getElementById('tab-sell').classList.remove('tab-active');
        document.getElementById('tab-account').classList.remove('tab-active');
        document.getElementById('tab-buy').classList.add('text-gray-500');
        document.getElementById('tab-sell').classList.add('text-gray-500');
        document.getElementById('tab-account').classList.add('text-gray-500');
        
        document.getElementById(`tab-${tab}`).classList.add('tab-active');
        document.getElementById(`tab-${tab}`).classList.remove('text-gray-500');
        
        // Update tab content
        document.getElementById('buy-tab').classList.add('hidden');
        document.getElementById('sell-tab').classList.add('hidden');
        document.getElementById('account-tab').classList.add('hidden');
        
        document.getElementById(`${tab}-tab`).classList.remove('hidden');

        // Load data for account tab
        if (tab === 'account' && authManager.isAuthenticated) {
            this.loadUserListings();
            this.loadSellerEarnings();
        }
    }

    selectCategory(category) {
        this.selectedCategory = category;
        
        // Update category buttons
        document.querySelectorAll('[data-category]').forEach(btn => {
            btn.classList.remove('category-active');
            btn.classList.add('bg-gray-100', 'text-gray-700');
        });
        
        const activeButton = document.querySelector(`[data-category="${category}"]`);
        activeButton.classList.add('category-active');
        activeButton.classList.remove('bg-gray-100', 'text-gray-700');
        
        this.loadProducts();
    }

    async loadProducts() {
        const productsGrid = document.getElementById('products-grid');
        if (!productsGrid) return;

        productsGrid.innerHTML = `
            <div class="col-span-full text-center py-8">
                <div class="loading-spinner mx-auto mb-4"></div>
                <p class="text-gray-500">Loading products...</p>
            </div>
        `;

        try {
            let productsQuery = collection(db, 'products');
            const constraints = [];

            // Apply category filter
            if (this.selectedCategory !== 'all') {
                constraints.push(where('category', '==', this.selectedCategory));
            }

            // Apply search filter
            if (this.searchTerm) {
                // Note: Firestore doesn't support full-text search natively
                // In a real app, you'd use Algolia or similar service
                constraints.push(where('name', '>=', this.searchTerm));
                constraints.push(where('name', '<=', this.searchTerm + '\uf8ff'));
            }

            // Apply sorting
            if (this.sortBy === 'newest') {
                constraints.push(orderBy('createdAt', 'desc'));
            } else if (this.sortBy === 'price-low') {
                constraints.push(orderBy('price', 'asc'));
            } else if (this.sortBy === 'price-high') {
                constraints.push(orderBy('price', 'desc'));
            }

            // Add active products filter
            constraints.push(where('status', '==', 'active'));

            // Execute query
            if (constraints.length > 0) {
                productsQuery = query(productsQuery, ...constraints);
            }

            const querySnapshot = await getDocs(productsQuery);
            this.products = [];
            
            querySnapshot.forEach((doc) => {
                this.products.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            this.renderProducts();

        } catch (error) {
            console.error('Error loading products:', error);
            productsGrid.innerHTML = `
                <div class="col-span-full text-center py-8">
                    <i class="fas fa-exclamation-triangle text-3xl text-gray-400 mb-3"></i>
                    <p class="text-gray-500">Error loading products. Please try again.</p>
                    <button onclick="marketplaceManager.loadProducts()" class="mt-3 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition">
                        Retry
                    </button>
                </div>
            `;
        }
    }

    renderProducts() {
        const productsGrid = document.getElementById('products-grid');
        
        if (this.products.length === 0) {
            productsGrid.innerHTML = `
                <div class="col-span-full text-center py-8">
                    <i class="fas fa-search text-3xl text-gray-400 mb-3"></i>
                    <p class="text-gray-500">No products found</p>
                    <p class="text-sm text-gray-400 mt-1">Try changing your search or filters</p>
                </div>
            `;
            return;
        }

        productsGrid.innerHTML = this.products.map(product => `
            <div class="bg-white rounded-lg shadow-md overflow-hidden card-hover">
                <div class="h-48 bg-gray-200 relative">
                    ${product.images && product.images.length > 0 ? 
                        `<img src="${product.images[0]}" alt="${product.name}" class="w-full h-full object-cover">` :
                        `<div class="w-full h-full flex items-center justify-center text-gray-400">
                            <i class="fas fa-image text-3xl"></i>
                        </div>`
                    }
                    <div class="absolute top-2 right-2">
                        <span class="bg-primary text-white text-xs px-2 py-1 rounded-full">${formatCurrency(product.price)}</span>
                    </div>
                </div>
                
                <div class="p-4">
                    <h3 class="font-semibold text-lg mb-1 truncate">${product.name}</h3>
                    <p class="text-gray-600 text-sm mb-2 line-clamp-2">${product.description || 'No description'}</p>
                    
                    <div class="flex items-center justify-between text-sm text-gray-500 mb-3">
                        <span class="capitalize">${product.category}</span>
                        <span>Qty: ${product.quantity}</span>
                    </div>
                    
                    <div class="flex items-center justify-between">
                        <div class="flex items-center">
                            <div class="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs text-gray-600 mr-2">
                                <i class="fas fa-user"></i>
                            </div>
                            <span class="text-sm text-gray-600">${product.sellerName || 'Seller'}</span>
                        </div>
                        
                        <div class="flex space-x-2">
                            <button onclick="marketplaceManager.viewProduct('${product.id}')" class="px-3 py-1 bg-primary text-white text-sm rounded hover:bg-primary-dark transition">
                                View
                            </button>
                            <button onclick="marketplaceManager.chatWithSeller('${product.id}')" class="px-3 py-1 border border-primary text-primary text-sm rounded hover:bg-primary hover:text-white transition">
                                <i class="fas fa-comment"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    viewProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-xl shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div class="gradient-bg text-white p-6 rounded-t-xl">
                    <div class="flex justify-between items-center">
                        <h2 class="text-2xl font-bold">Product Details</h2>
                        <button id="close-product-modal" class="text-white hover:text-gray-200">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                
                <div class="p-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            ${product.images && product.images.length > 0 ? 
                                `<img src="${product.images[0]}" alt="${product.name}" class="w-full h-64 object-cover rounded-lg">` :
                                `<div class="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                                    <i class="fas fa-image text-4xl"></i>
                                </div>`
                            }
                        </div>
                        
                        <div>
                            <h3 class="text-2xl font-bold mb-2">${product.name}</h3>
                            <p class="text-3xl font-bold text-primary mb-4">${formatCurrency(product.price)}</p>
                            
                            <div class="space-y-3 mb-4">
                                <div>
                                    <span class="font-semibold">Category:</span>
                                    <span class="ml-2 capitalize">${product.category}</span>
                                </div>
                                <div>
                                    <span class="font-semibold">Quantity Available:</span>
                                    <span class="ml-2">${product.quantity}</span>
                                </div>
                                <div>
                                    <span class="font-semibold">Seller:</span>
                                    <span class="ml-2">${product.sellerName || 'Unknown'}</span>
                                </div>
                            </div>
                            
                            <div class="mb-4">
                                <h4 class="font-semibold mb-2">Description</h4>
                                <p class="text-gray-700">${product.description || 'No description available.'}</p>
                            </div>
                            
                            <div class="space-y-3">
                                <button onclick="marketplaceManager.buyProduct('${product.id}')" class="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition">
                                    <i class="fas fa-shopping-cart mr-2"></i> Buy Now
                                </button>
                                <button onclick="marketplaceManager.bookDelivery('${product.id}')" class="w-full py-2 border border-primary text-primary font-semibold rounded-lg hover:bg-primary hover:text-white transition">
                                    <i class="fas fa-truck mr-2"></i> Deliver with FikaConnect
                                </button>
                                <button onclick="marketplaceManager.chatWithSeller('${product.id}')" class="w-full py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition">
                                    <i class="fas fa-comment mr-2"></i> Chat with Seller
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('close-product-modal').onclick = () => modal.remove();
    }

    async buyProduct(productId) {
        if (!authManager.checkAuth()) return;
        
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        showToast('Redirecting to checkout...', 'info');
        // In a real app, this would redirect to a checkout page
        setTimeout(() => {
            showToast('Checkout functionality would be implemented here', 'info');
        }, 1000);
    }

    bookDelivery(productId) {
        if (!authManager.checkAuth()) return;
        
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        // Redirect to send/receive section with product details pre-filled
        showToast('Redirecting to delivery booking...', 'info');
        showSection('send-receive');
        
        // Pre-fill package details
        setTimeout(() => {
            document.getElementById('package-type').value = 'medium';
            document.getElementById('package-weight').value = '1';
            document.getElementById('special-instructions').value = `Product: ${product.name}`;
            showToast('Please complete the delivery details', 'info');
        }, 500);
    }

    chatWithSeller(productId) {
        if (!authManager.checkAuth()) {
            showToast('Please sign in to chat with sellers', 'error');
            return;
        }

        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        showToast(`Opening chat with ${product.sellerName || 'seller'}...`, 'info');
        // In a real app, this would open a chat interface
    }

    handleProductPhotoUpload(e) {
        const files = e.target.files;
        const preview = document.getElementById('product-photo-preview');
        preview.innerHTML = '';
        
        this.productPhotos = [];
        
        if (files.length > 5) {
            showToast('Maximum 5 photos allowed', 'error');
            return;
        }
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            if (!file.type.startsWith('image/')) {
                showToast('Please upload only image files', 'error');
                continue;
            }
            
            if (file.size > 5 * 1024 * 1024) {
                showToast('Image size should be less than 5MB', 'error');
                continue;
            }
            
            this.productPhotos.push(file);
            
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const imgContainer = document.createElement('div');
                imgContainer.className = 'relative';
                imgContainer.innerHTML = `
                    <img src="${e.target.result}" class="w-20 h-20 object-cover rounded-lg border">
                    <button class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs" data-index="${i}">
                        ×
                    </button>
                `;
                preview.appendChild(imgContainer);
                
                imgContainer.querySelector('button').addEventListener('click', (event) => {
                    event.stopPropagation();
                    const index = parseInt(event.target.getAttribute('data-index'));
                    this.removeProductPhoto(index);
                });
            }
            
            reader.readAsDataURL(file);
        }
        
        if (this.productPhotos.length > 0) {
            showToast(`${this.productPhotos.length} photo(s) selected`, 'success');
        }
    }

    removeProductPhoto(index) {
        this.productPhotos.splice(index, 1);
        const input = document.getElementById('product-photos');
        const newFiles = new DataTransfer();
        this.productPhotos.forEach(photo => newFiles.items.add(photo));
        input.files = newFiles.files;
        this.handleProductPhotoUpload({ target: input });
    }

    async listProduct() {
        if (!authManager.checkAuth()) {
            showToast('Please sign in to list products', 'error');
            return;
        }

        const productName = document.getElementById('product-name').value;
        const productCategory = document.getElementById('product-category').value;
        const productDescription = document.getElementById('product-description').value;
        const productPrice = document.getElementById('product-price').value;
        const productQuantity = document.getElementById('product-quantity').value;

        if (!productName || !productCategory || !productPrice || !productQuantity) {
            showToast('Please fill in all required fields', 'error');
            return;
        }

        if (this.productPhotos.length === 0) {
            showToast('Please add at least one product photo', 'error');
            return;
        }

        const listBtn = document.getElementById('list-product');
        const originalText = listBtn.innerHTML;
        listBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Listing...';
        listBtn.disabled = true;

        try {
            // Upload product photos
            const imageUrls = [];
            for (const photo of this.productPhotos) {
                const storageRef = ref(storage, `product-images/${Date.now()}-${photo.name}`);
                const snapshot = await uploadBytes(storageRef, photo);
                const downloadURL = await getDownloadURL(snapshot.ref);
                imageUrls.push(downloadURL);
            }

            // Create product document
            const productData = {
                name: productName,
                category: productCategory,
                description: productDescription,
                price: parseInt(productPrice),
                quantity: parseInt(productQuantity),
                images: imageUrls,
                sellerId: authManager.currentUser.uid,
                sellerName: authManager.userData?.firstName + ' ' + (authManager.userData?.lastName || ''),
                sellerEmail: authManager.currentUser.email,
                status: 'active',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            await addDoc(collection(db, 'products'), productData);

            showToast('Product listed successfully!', 'success');
            this.resetProductForm();
            this.switchTab('account');
            this.loadUserListings();

        } catch (error) {
            console.error('Error listing product:', error);
            showToast('Error listing product. Please try again.', 'error');
        } finally {
            listBtn.innerHTML = originalText;
            listBtn.disabled = false;
        }
    }

    resetProductForm() {
        document.getElementById('product-name').value = '';
        document.getElementById('product-category').value = '';
        document.getElementById('product-description').value = '';
        document.getElementById('product-price').value = '';
        document.getElementById('product-quantity').value = '';
        document.getElementById('product-photos').value = '';
        document.getElementById('product-photo-preview').innerHTML = '';
        this.productPhotos = [];
    }

    async loadUserListings() {
        if (!authManager.isAuthenticated) return;

        const listingsContainer = document.getElementById('my-listings');
        listingsContainer.innerHTML = `
            <div class="text-center py-4">
                <div class="loading-spinner mx-auto mb-2"></div>
                <p class="text-gray-600">Loading your listings...</p>
            </div>
        `;

        try {
            const listingsQuery = query(
                collection(db, 'products'),
                where('sellerId', '==', authManager.currentUser.uid),
                orderBy('createdAt', 'desc')
            );

            const querySnapshot = await getDocs(listingsQuery);
            this.userListings = [];
            
            querySnapshot.forEach((doc) => {
                this.userListings.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            this.renderUserListings();

        } catch (error) {
            console.error('Error loading user listings:', error);
            listingsContainer.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-exclamation-triangle text-xl text-gray-400 mb-2"></i>
                    <p class="text-gray-600">Error loading listings</p>
                </div>
            `;
        }
    }

    renderUserListings() {
        const listingsContainer = document.getElementById('my-listings');
        
        if (this.userListings.length === 0) {
            listingsContainer.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-box-open text-3xl text-gray-400 mb-3"></i>
                    <p class="text-gray-600">You haven't listed any products yet</p>
                    <button onclick="marketplaceManager.switchTab('sell')" class="mt-3 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition text-sm">
                        List Your First Product
                    </button>
                </div>
            `;
            return;
        }

        listingsContainer.innerHTML = this.userListings.map(listing => `
            <div class="border-b border-gray-200 py-4 last:border-b-0">
                <div class="flex items-center space-x-3">
                    <div class="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0">
                        ${listing.images && listing.images.length > 0 ? 
                            `<img src="${listing.images[0]}" alt="${listing.name}" class="w-full h-full object-cover rounded-lg">` :
                            `<div class="w-full h-full flex items-center justify-center text-gray-400">
                                <i class="fas fa-image"></i>
                            </div>`
                        }
                    </div>
                    
                    <div class="flex-grow">
                        <h4 class="font-semibold">${listing.name}</h4>
                        <p class="text-sm text-gray-600">${formatCurrency(listing.price)} • Qty: ${listing.quantity}</p>
                        <p class="text-xs text-gray-500 capitalize">${listing.category}</p>
                    </div>
                    
                    <div class="flex space-x-2">
                        <span class="px-2 py-1 text-xs rounded-full ${listing.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                            ${listing.status}
                        </span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async loadSellerEarnings() {
        if (!authManager.isAuthenticated) return;

        // In a real app, this would calculate earnings from sales
        // For now, using mock data
        const totalEarnings = 0; // This would be calculated from orders
        
        document.getElementById('total-earnings').textContent = formatCurrency(totalEarnings);
    }

    completeSellerProfile() {
        if (!authManager.checkAuth()) return;
        
        showToast('Redirecting to profile completion...', 'info');
        // In a real app, this would redirect to profile editing
        setTimeout(() => {
            showToast('Profile completion form would open here', 'info');
        }, 1000);
    }

    checkSellerStatus() {
        if (authManager.isAuthenticated && authManager.userData) {
            const isSeller = authManager.userData.userType === 'seller';
            if (!isSeller) {
                // Show upgrade prompt for non-sellers
                this.showSellerUpgradePrompt();
            }
        }
    }

    showSellerUpgradePrompt() {
        const sellTab = document.getElementById('tab-sell');
        if (sellTab) {
            sellTab.innerHTML = '<i class="fas fa-store mr-2"></i> Become a Seller';
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const marketplaceManager = new MarketplaceManager();
    window.marketplaceManager = marketplaceManager;
});

export default MarketplaceManager;
