// ===== STORAGE KEYS =====
const STORAGE_KEYS = {
    USERS: 'sims_users',
    LOGGED_USER: 'sims_loggedInUser',
    PRODUCTS: 'sims_products',
    PROFILE_IMAGE: 'sims_profile_image',
    NOTIFICATIONS: 'sims_notifications',
    SETTINGS: 'sims_settings'
};

// ===== GLOBAL VARIABLES =====
let currentEditId = null;
let deleteId = null;
let products = [];
let filteredProducts = [];
let currentPage = 1;
const itemsPerPage = 10;
let notifications = [];
let settings = {};
let revenueChart, categoryChart, stockChart;

// ===== INITIALIZE STORAGE =====
function initializeStorage() {
    // Users
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([]));
    }
    
    // Products with sample data
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
        const sampleProducts = [
            { id: 'PRD-001', name: 'Wireless Keyboard', category: 'Electronics', quantity: 45, price: 49.99 },
            { id: 'PRD-002', name: 'USB-C Hub', category: 'Accessories', quantity: 0, price: 29.99 },
            { id: 'PRD-003', name: 'Wireless Mouse', category: 'Electronics', quantity: 32, price: 24.99 },
            { id: 'PRD-004', name: 'Laptop Stand', category: 'Accessories', quantity: 15, price: 39.99 },
            { id: 'PRD-005', name: 'HDMI Cable', category: 'Cables', quantity: 0, price: 12.99 }
        ];
        localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(sampleProducts));
    }
    
    // Profile images
    if (!localStorage.getItem(STORAGE_KEYS.PROFILE_IMAGE)) {
        localStorage.setItem(STORAGE_KEYS.PROFILE_IMAGE, JSON.stringify({}));
    }
    
    // Notifications
    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
    }
    
    // Settings
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({
            emailNotifications: true,
            lowStockAlerts: true,
            darkMode: false
        }));
    }
}

// ===== AUTH FUNCTIONS =====
function getUsers() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS)) || [];
}

function getLoggedInUser() {
    const user = localStorage.getItem(STORAGE_KEYS.LOGGED_USER);
    return user ? JSON.parse(user) : null;
}

function logout() {
    showLoading('Logging out...');
    setTimeout(() => {
        localStorage.removeItem(STORAGE_KEYS.LOGGED_USER);
        window.location.href = 'login.html';
    }, 800);
}

// ===== VALIDATION =====
function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
}

// ===== UI HELPERS =====
function showLoading(message = 'Loading...') {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        const textEl = overlay.querySelector('.loading-text');
        if (textEl) textEl.textContent = message;
        overlay.classList.remove('hidden');
    }
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

function showMessage(elementId, message, isSuccess = false) {
    const msgElement = document.getElementById(elementId);
    if (!msgElement) return;
    
    const textSpan = msgElement.querySelector('span') || msgElement;
    textSpan.textContent = message;
    
    msgElement.classList.remove('hidden', 'success');
    if (isSuccess) msgElement.classList.add('success');
}

function hideMessage(elementId) {
    const el = document.getElementById(elementId);
    if (el) el.classList.add('hidden');
}

// ===== PROFILE IMAGE =====
function getProfileImage(email) {
    const images = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILE_IMAGE)) || {};
    return images[email] || null;
}

function saveProfileImage(email, imageData) {
    const images = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILE_IMAGE)) || {};
    images[email] = imageData;
    localStorage.setItem(STORAGE_KEYS.PROFILE_IMAGE, JSON.stringify(images));
}

function updateProfileImage(email) {
    const imageData = getProfileImage(email);
    const profileImage = document.getElementById('profileImage');
    const sidebarAvatar = document.getElementById('sidebarAvatar');
    const profileAvatar = document.getElementById('profileAvatar');
    
    if (imageData) {
        if (profileImage) profileImage.innerHTML = `<img src="${imageData}" alt="Profile">`;
        if (sidebarAvatar) sidebarAvatar.innerHTML = `<img src="${imageData}" alt="Profile">`;
        if (profileAvatar) {
            profileAvatar.innerHTML = '';
            profileAvatar.style.backgroundImage = `url(${imageData})`;
            profileAvatar.style.backgroundSize = 'cover';
        }
    } else {
        const user = getLoggedInUser();
        const initial = user ? user.fullName.charAt(0).toUpperCase() : 'U';
        
        if (profileImage) profileImage.innerHTML = '<i class="fas fa-user"></i>';
        if (sidebarAvatar) sidebarAvatar.innerHTML = '<i class="fas fa-user"></i>';
        if (profileAvatar) {
            profileAvatar.style.backgroundImage = '';
            profileAvatar.textContent = initial;
        }
    }
}

// ===== NOTIFICATION FUNCTIONS =====
function getNotifications() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) || [];
}

function addNotification(notification) {
    notifications = getNotifications();
    const newNotification = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        read: false,
        ...notification
    };
    
    notifications.unshift(newNotification);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    updateNotificationBadge();
    showToast(notification.message);
}

function updateNotificationBadge() {
    notifications = getNotifications();
    const unreadCount = notifications.filter(n => !n.read).length;
    const badges = document.querySelectorAll('.badge');
    badges.forEach(badge => {
        badge.textContent = unreadCount;
        badge.style.display = unreadCount === 0 ? 'none' : 'block';
    });
}

// ===== PRODUCT FUNCTIONS =====
function getProducts() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS)) || [];
}

function saveProducts(products) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
}

function generateProductId() {
    return `PRD-${Math.floor(Math.random() * 900 + 100)}`;
}

// ===== DASHBOARD FUNCTIONS =====
function updateDashboard() {
    const products = getProducts();
    const total = products.length;
    const inStock = products.filter(p => p.quantity > 0).length;
    const outStock = products.filter(p => p.quantity === 0).length;
    
    document.getElementById('totalProducts').textContent = total;
    document.getElementById('inStockProducts').textContent = inStock;
    document.getElementById('outStockProducts').textContent = outStock;
    
    const inStockPercent = total > 0 ? Math.round((inStock / total) * 100) : 0;
    const outStockPercent = total > 0 ? Math.round((outStock / total) * 100) : 0;
    document.getElementById('inStockPercent').textContent = inStockPercent + '%';
    document.getElementById('outStockPercent').textContent = outStockPercent + '%';
    
    // Recent products
    const recent = products.slice(0, 4);
    const tbody = document.getElementById('recentProductsTable');
    if (tbody) {
        if (recent.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state"><i class="fas fa-box-open"></i><br>No products</td></tr>';
        } else {
            tbody.innerHTML = recent.map(p => `
                <tr>
                    <td><strong>${p.id}</strong></td>
                    <td>${p.name}</td>
                    <td>${p.category}</td>
                    <td>${p.quantity}</td>
                    <td>$${p.price.toFixed(2)}</td>
                    <td><span class="status-badge ${p.quantity > 0 ? 'status-instock' : 'status-outstock'}">${p.quantity > 0 ? 'In Stock' : 'Out'}</span></td>
                </tr>
            `).join('');
        }
    }
    
    // Chart
    updateInventoryChart(products);
}

function updateInventoryChart(products) {
    const chartBars = document.getElementById('chartBars');
    if (!chartBars) return;
    
    const categories = {};
    products.forEach(p => categories[p.category] = (categories[p.category] || 0) + 1);
    
    if (Object.keys(categories).length === 0) {
        chartBars.innerHTML = '<div class="empty-chart">No data</div>';
        return;
    }
    
    const max = Math.max(...Object.values(categories), 1);
    chartBars.innerHTML = Object.entries(categories).map(([cat, count]) => 
        `<div class="bar" style="height: ${(count / max) * 180}px;"><div class="bar-label">${cat}</div></div>`
    ).join('');
}

// ===== PRODUCTS PAGE FUNCTIONS =====
function loadProductsPage() {
    products = getProducts();
    filteredProducts = [...products];
    
    // Update stats
    const total = products.length;
    const inStock = products.filter(p => p.quantity > 0).length;
    const outStock = products.filter(p => p.quantity === 0).length;
    
    document.getElementById('totalProductsCount').textContent = total;
    document.getElementById('inStockCount').textContent = inStock;
    document.getElementById('outStockCount').textContent = outStock;
    
    // Load categories
    const categories = [...new Set(products.map(p => p.category))];
    const filter = document.getElementById('categoryFilter');
    if (filter) {
        filter.innerHTML = '<option value="">All Categories</option>';
        categories.forEach(cat => filter.innerHTML += `<option value="${cat}">${cat}</option>`);
    }
    
    renderProductsTable();
    hideLoading();
}

function renderProductsTable() {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageProducts = filteredProducts.slice(start, end);
    const tbody = document.getElementById('productsTableBody');
    
    if (!tbody) return;
    
    if (pageProducts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><i class="fas fa-box-open"></i><br>No products found</td></tr>';
    } else {
        tbody.innerHTML = pageProducts.map(p => `
            <tr>
                <td><strong>${p.id}</strong></td>
                <td>${p.name}</td>
                <td><span class="category-badge">${p.category}</span></td>
                <td class="${p.quantity < 10 ? 'low-quantity' : ''}">${p.quantity}</td>
                <td>$${p.price.toFixed(2)}</td>
                <td><span class="status-badge ${p.quantity > 0 ? 'status-instock' : 'status-outstock'}">${p.quantity > 0 ? 'In Stock' : 'Out'}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-edit" onclick="editProduct('${p.id}')"><i class="fas fa-edit"></i></button>
                        <button class="btn-delete" onclick="confirmDelete('${p.id}', '${p.name}')"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');
    }
    
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages || 1}`;
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages || totalPages === 0;
}

// ===== PRODUCT CRUD =====
window.editProduct = function(id) {
    const product = getProducts().find(p => p.id === id);
    if (!product) return;
    
    currentEditId = id;
    document.getElementById('modalTitle').querySelector('span').textContent = 'Edit Product';
    document.getElementById('editProductId').value = id;
    document.getElementById('prodName').value = product.name;
    document.getElementById('prodCategory').value = product.category;
    document.getElementById('prodQuantity').value = product.quantity;
    document.getElementById('prodPrice').value = product.price;
    document.getElementById('productModal').classList.remove('hidden');
};

window.confirmDelete = function(id, name) {
    deleteId = id;
    document.getElementById('deleteProductName').textContent = name;
    document.getElementById('deleteModal').classList.remove('hidden');
};

function saveProduct() {
    const name = document.getElementById('prodName').value.trim();
    const category = document.getElementById('prodCategory').value.trim();
    const quantity = parseInt(document.getElementById('prodQuantity').value);
    const price = parseFloat(document.getElementById('prodPrice').value);
    const msg = document.getElementById('productMessage');
    
    if (!name || !category) {
        msg.textContent = 'Name and category are required';
        msg.classList.remove('hidden');
        return;
    }
    
    if (isNaN(quantity) || quantity < 0) {
        msg.textContent = 'Please enter a valid quantity';
        msg.classList.remove('hidden');
        return;
    }
    
    if (isNaN(price) || price < 0) {
        msg.textContent = 'Please enter a valid price';
        msg.classList.remove('hidden');
        return;
    }
    
    msg.classList.add('hidden');
    products = getProducts();
    
    if (currentEditId) {
        const index = products.findIndex(p => p.id === currentEditId);
        if (index !== -1) {
            products[index] = { ...products[index], name, category, quantity, price };
            addNotification({ title: 'Updated', message: `${name} updated`, icon: 'fa-edit', color: '#f39c12' });
        }
    } else {
        products.push({ id: generateProductId(), name, category, quantity, price });
        addNotification({ title: 'Added', message: `${name} added`, icon: 'fa-plus-circle', color: '#27ae60' });
    }
    
    saveProducts(products);
    closeModal();
    
    if (document.getElementById('productsTableBody')) loadProductsPage();
    if (document.getElementById('recentProductsTable')) updateDashboard();
}

function closeModal() {
    document.getElementById('productModal').classList.add('hidden');
    document.getElementById('prodName').value = '';
    document.getElementById('prodCategory').value = '';
    document.getElementById('prodQuantity').value = '';
    document.getElementById('prodPrice').value = '';
    document.getElementById('productMessage').classList.add('hidden');
    currentEditId = null;
}

function deleteProduct() {
    if (!deleteId) return;
    
    products = getProducts();
    const product = products.find(p => p.id === deleteId);
    products = products.filter(p => p.id !== deleteId);
    saveProducts(products);
    
    addNotification({ title: 'Deleted', message: `${product.name} removed`, icon: 'fa-trash', color: '#e74c3c' });
    document.getElementById('deleteModal').classList.add('hidden');
    
    if (document.getElementById('productsTableBody')) loadProductsPage();
    if (document.getElementById('recentProductsTable')) updateDashboard();
}

// ===== REPORTS FUNCTIONS =====
function loadReports() {
    const products = getProducts();
    const totalRevenue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    const totalOrders = products.reduce((sum, p) => sum + p.quantity, 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const lowStockCount = products.filter(p => p.quantity > 0 && p.quantity < 10).length;
    
    document.getElementById('totalRevenue').textContent = `$${totalRevenue.toFixed(2)}`;
    document.getElementById('totalOrders').textContent = totalOrders;
    document.getElementById('avgOrderValue').textContent = `$${avgOrderValue.toFixed(2)}`;
    document.getElementById('lowStockCount').textContent = lowStockCount;
    
    initCharts(products);
    hideLoading();
}

function initCharts(products) {
    // Destroy existing charts if they exist
    if (revenueChart) revenueChart.destroy();
    if (categoryChart) categoryChart.destroy();
    if (stockChart) stockChart.destroy();
    
    // Revenue Chart
    if (document.getElementById('revenueChart')) {
        const ctx1 = document.getElementById('revenueChart').getContext('2d');
        revenueChart = new Chart(ctx1, {
            type: 'line',
            data: {
                labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
                datasets: [{
                    label: 'Revenue',
                    data: [12000,19000,15000,25000,22000,30000,28000,35000,32000,38000,42000,45000],
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102,126,234,0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#667eea',
                    pointBorderColor: 'white',
                    pointBorderWidth: 2,
                    pointRadius: 4
                }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, ticks: { callback: value => '$' + value } }
                }
            }
        });
    }
    
    // Category Chart
    if (document.getElementById('categoryChart')) {
        const categories = {};
        products.forEach(p => categories[p.category] = (categories[p.category] || 0) + 1);
        
        const ctx2 = document.getElementById('categoryChart').getContext('2d');
        categoryChart = new Chart(ctx2, {
            type: 'doughnut',
            data: {
                labels: Object.keys(categories),
                datasets: [{
                    data: Object.values(categories),
                    backgroundColor: ['#667eea','#764ba2','#f39c12','#e74c3c','#27ae60','#3498db'],
                    borderWidth: 0
                }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: { legend: { position: 'bottom' } },
                cutout: '60%'
            }
        });
    }
    
    // Stock Chart
    if (document.getElementById('stockChart')) {
        const inStock = products.filter(p => p.quantity > 0).length;
        const outStock = products.filter(p => p.quantity === 0).length;
        
        const ctx3 = document.getElementById('stockChart').getContext('2d');
        stockChart = new Chart(ctx3, {
            type: 'bar',
            data: {
                labels: ['In Stock','Out of Stock'],
                datasets: [{
                    data: [inStock, outStock],
                    backgroundColor: ['#27ae60','#e74c3c'],
                    borderRadius: 8,
                    barPercentage: 0.6
                }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 } }
                }
            }
        });
    }
}

// ===== SETTINGS FUNCTIONS =====
function loadSettings() {
    const user = getLoggedInUser();
    if (!user) return;
    
    settings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || {
        emailNotifications: true,
        lowStockAlerts: true,
        darkMode: false
    };
    
    document.getElementById('profileName').value = user.fullName;
    document.getElementById('profileEmail').value = user.email;
    document.getElementById('profileAvatar').textContent = user.fullName.charAt(0).toUpperCase();
    
    document.getElementById('emailNotifications').checked = settings.emailNotifications;
    document.getElementById('lowStockAlerts').checked = settings.lowStockAlerts;
    document.getElementById('darkMode').checked = settings.darkMode;
    
    if (settings.darkMode) document.body.classList.add('dark-mode');
    
    updateProfileImage(user.email);
    hideLoading();
}

function saveSettings() {
    settings = {
        emailNotifications: document.getElementById('emailNotifications').checked,
        lowStockAlerts: document.getElementById('lowStockAlerts').checked,
        darkMode: document.getElementById('darkMode').checked
    };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    
    if (settings.darkMode) document.body.classList.add('dark-mode');
    else document.body.classList.remove('dark-mode');
    
    showToast('Settings saved');
}

// ===== NAVIGATION =====
function setupNavigation() {
    // Menu toggle
    const menuToggle = document.getElementById('menuToggle');
    const hiddenNav = document.getElementById('hiddenNav');
    const sidebar = document.getElementById('sidebar');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            this.classList.toggle('active');
            if (hiddenNav) hiddenNav.classList.toggle('show');
            if (sidebar) sidebar.classList.toggle('show');
        });
    }
    
    // Navigation links
    document.querySelectorAll('[data-page]').forEach(el => {
        el.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.dataset.page;
            if (page === 'logout') logout();
            else window.location.href = `${page}.html`;
        });
    });
    
    // Profile dropdown
    const profileDropdown = document.getElementById('profileDropdown');
    const dropdownMenu = document.getElementById('dropdownMenu');
    
    if (profileDropdown && dropdownMenu) {
        profileDropdown.addEventListener('click', function(e) {
            e.stopPropagation();
            dropdownMenu.classList.toggle('show');
        });
    }
    
    // Close menus on outside click
    document.addEventListener('click', function(e) {
        if (hiddenNav && !e.target.closest('.menu-toggle') && !e.target.closest('.hidden-nav')) {
            hiddenNav.classList.remove('show');
            if (menuToggle) menuToggle.classList.remove('active');
        }
        if (dropdownMenu && !e.target.closest('.profile-dropdown') && !e.target.closest('.dropdown-menu')) {
            dropdownMenu.classList.remove('show');
        }
    });
    
    // Profile menu items
    const viewProfile = document.getElementById('viewProfile');
    const uploadPhoto = document.getElementById('uploadPhoto');
    const goToSettings = document.getElementById('goToSettings');
    const profileLogout = document.getElementById('profileLogout');
    const hiddenLogout = document.getElementById('hiddenLogout');
    
    if (viewProfile) viewProfile.addEventListener('click', e => e.preventDefault());
    if (uploadPhoto) uploadPhoto.addEventListener('click', uploadProfilePhoto);
    if (goToSettings) goToSettings.addEventListener('click', () => window.location.href = 'settings.html');
    if (profileLogout) profileLogout.addEventListener('click', logout);
    if (hiddenLogout) hiddenLogout.addEventListener('click', logout);
}

function uploadProfilePhoto() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const user = getLoggedInUser();
            if (user) {
                saveProfileImage(user.email, e.target.result);
                updateProfileImage(user.email);
                showToast('Profile photo updated');
            }
        };
        reader.readAsDataURL(file);
    };
    input.click();
}

// ===== PAGE INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    // Hide loading overlay initially
    hideLoading();
    initializeStorage();
    
    const currentPage = window.location.pathname.split('/').pop();
    const user = getLoggedInUser();
    
    // Check authentication for protected pages
    const protectedPages = ['dashboard.html', 'products.html', 'reports.html', 'settings.html'];
    if (protectedPages.includes(currentPage) && !user) {
        window.location.href = 'login.html';
        return;
    }
    
    // Update user info if logged in
    if (user) {
        document.getElementById('sidebarUserName').textContent = user.fullName;
        document.getElementById('sidebarUserEmail').textContent = user.email;
        
        const welcomeMsg = document.getElementById('welcomeMessage');
        if (welcomeMsg) welcomeMsg.textContent = `Welcome back, ${user.fullName.split(' ')[0]}!`;
        
        updateProfileImage(user.email);
    }
    
    // Page-specific initialization
    if (currentPage === 'dashboard.html') {
        showLoading('Loading dashboard...');
        setTimeout(() => {
            updateDashboard();
            hideLoading();
        }, 800);
    }
    
    if (currentPage === 'products.html') {
        showLoading('Loading products...');
        setTimeout(loadProductsPage, 800);
    }
    
    if (currentPage === 'reports.html') {
        showLoading('Loading reports...');
        setTimeout(loadReports, 800);
    }
    
    if (currentPage === 'settings.html') {
        showLoading('Loading settings...');
        setTimeout(loadSettings, 800);
    }
    
    setupNavigation();
    updateNotificationBadge();
    
    // Login page - if already logged in, redirect
    if (currentPage === 'login.html' && user) {
        window.location.href = 'dashboard.html';
    }
    
    // Register page password validation
    const regPassword = document.getElementById('regPassword');
    if (regPassword) {
        regPassword.addEventListener('input', function() {
            const pwd = this.value;
            document.getElementById('reqLength').innerHTML = (pwd.length >= 8 ? '<i class="fas fa-check-circle" style="color:#27ae60"></i>' : '<i class="far fa-circle"></i>') + ' 8+ characters';
            document.getElementById('reqUppercase').innerHTML = (/[A-Z]/.test(pwd) ? '<i class="fas fa-check-circle" style="color:#27ae60"></i>' : '<i class="far fa-circle"></i>') + ' Uppercase';
            document.getElementById('reqLowercase').innerHTML = (/[a-z]/.test(pwd) ? '<i class="fas fa-check-circle" style="color:#27ae60"></i>' : '<i class="far fa-circle"></i>') + ' Lowercase';
            document.getElementById('reqNumber').innerHTML = (/[0-9]/.test(pwd) ? '<i class="fas fa-check-circle" style="color:#27ae60"></i>' : '<i class="far fa-circle"></i>') + ' Number';
        });
    }
});

// ===== EVENT LISTENERS =====
// Login
document.getElementById('loginBtn')?.addEventListener('click', function() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showMessage('errorMessage', 'All fields required');
        return;
    }
    
    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
        showMessage('errorMessage', 'Invalid email or password');
        return;
    }
    
    showLoading('Logging in...');
    setTimeout(() => {
        localStorage.setItem(STORAGE_KEYS.LOGGED_USER, JSON.stringify({ 
            fullName: user.fullName, 
            email: user.email,
            id: user.id 
        }));
        window.location.href = 'dashboard.html';
    }, 1500);
});

// Register
document.getElementById('registerBtn')?.addEventListener('click', function() {
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirm = document.getElementById('regConfirmPassword').value;
    const terms = document.getElementById('termsCheck')?.checked || false;
    
    if (!name || !email || !password || !confirm) {
        showMessage('errorMessage', 'All fields required');
        return;
    }
    
    if (!terms) {
        showMessage('errorMessage', 'You must accept the terms');
        return;
    }
    
    if (!validateEmail(email)) {
        showMessage('errorMessage', 'Invalid email format');
        return;
    }
    
    const users = getUsers();
    if (users.some(u => u.email === email)) {
        showMessage('errorMessage', 'Email already exists');
        return;
    }
    
    if (!validatePassword(password)) {
        showMessage('errorMessage', 'Password must be 8+ chars with uppercase, lowercase, and number');
        return;
    }
    
    if (password !== confirm) {
        showMessage('errorMessage', 'Passwords do not match');
        return;
    }
    
    users.push({ 
        id: Date.now(), 
        fullName: name, 
        email, 
        password,
        createdAt: new Date().toISOString()
    });
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    
    showMessage('successMessage', 'Registration successful! Redirecting...', true);
    
    showLoading('Creating account...');
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 2000);
});

// Logout button
document.getElementById('logoutBtn')?.addEventListener('click', logout);

// Product modal buttons
document.getElementById('addProductBtn')?.addEventListener('click', () => {
    currentEditId = null;
    document.getElementById('modalTitle').querySelector('span').textContent = 'Add New Product';
    document.getElementById('editProductId').value = '';
    document.getElementById('prodName').value = '';
    document.getElementById('prodCategory').value = '';
    document.getElementById('prodQuantity').value = '';
    document.getElementById('prodPrice').value = '';
    document.getElementById('productModal').classList.remove('hidden');
});

document.getElementById('quickAddBtn')?.addEventListener('click', () => {
    document.getElementById('addProductBtn')?.click();
});

document.getElementById('closeModal')?.addEventListener('click', closeModal);
document.getElementById('cancelModal')?.addEventListener('click', closeModal);
document.getElementById('closeDeleteModal')?.addEventListener('click', () => document.getElementById('deleteModal').classList.add('hidden'));
document.getElementById('cancelDelete')?.addEventListener('click', () => document.getElementById('deleteModal').classList.add('hidden'));
document.getElementById('saveProductBtn')?.addEventListener('click', saveProduct);
document.getElementById('confirmDelete')?.addEventListener('click', deleteProduct);

// Products search and filter
document.getElementById('searchProducts')?.addEventListener('input', function(e) {
    const term = e.target.value.toLowerCase();
    const category = document.getElementById('categoryFilter').value;
    filteredProducts = products.filter(p => 
        (p.name.toLowerCase().includes(term) || p.id.toLowerCase().includes(term)) &&
        (!category || p.category === category)
    );
    currentPage = 1;
    renderProductsTable();
});

document.getElementById('categoryFilter')?.addEventListener('change', function(e) {
    const category = e.target.value;
    const term = document.getElementById('searchProducts').value.toLowerCase();
    filteredProducts = products.filter(p => 
        (p.name.toLowerCase().includes(term) || p.id.toLowerCase().includes(term)) &&
        (!category || p.category === category)
    );
    currentPage = 1;
    renderProductsTable();
});

// Pagination
document.getElementById('prevPage')?.addEventListener('click', () => {
    if (currentPage > 1) { currentPage--; renderProductsTable(); }
});

document.getElementById('nextPage')?.addEventListener('click', () => {
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    if (currentPage < totalPages) { currentPage++; renderProductsTable(); }
});

// Reports chart period
document.querySelectorAll('.chart-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.chart-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
        const period = this.dataset.period;
        let data, labels;
        
        if (period === 'daily') {
            labels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
            data = [1200,1900,1500,2500,2200,3000,2800];
        } else if (period === 'weekly') {
            labels = ['Week 1','Week 2','Week 3','Week 4'];
            data = [8500,9200,7800,10500];
        } else {
            labels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            data = [12000,19000,15000,25000,22000,30000,28000,35000,32000,38000,42000,45000];
        }
        
        if (revenueChart) {
            revenueChart.data.labels = labels;
            revenueChart.data.datasets[0].data = data;
            revenueChart.update();
        }
    });
});

// Export buttons
document.getElementById('exportPDF')?.addEventListener('click', () => {
    addNotification({ title: 'Export', message: 'PDF report generated', icon: 'fa-file-pdf', color: '#667eea' });
    showToast('PDF exported');
});

document.getElementById('exportExcel')?.addEventListener('click', () => {
    addNotification({ title: 'Export', message: 'Excel report generated', icon: 'fa-file-excel', color: '#27ae60' });
    showToast('Excel exported');
});

document.getElementById('exportCSV')?.addEventListener('click', () => {
    const products = getProducts();
    let csv = 'ID,Name,Category,Quantity,Price,Status\n';
    products.forEach(p => {
        csv += `${p.id},${p.name},${p.category},${p.quantity},${p.price},${p.quantity > 0 ? 'In Stock' : 'Out of Stock'}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    
    addNotification({ title: 'Export', message: 'CSV exported', icon: 'fa-file-csv', color: '#f39c12' });
});

document.getElementById('printReport')?.addEventListener('click', () => window.print());

// Settings
document.getElementById('saveProfileBtn')?.addEventListener('click', function() {
    const newName = document.getElementById('profileName').value;
    const user = getLoggedInUser();
    if (!user) return;
    
    const users = getUsers();
    const index = users.findIndex(u => u.email === user.email);
    if (index !== -1) {
        users[index].fullName = newName;
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        user.fullName = newName;
        localStorage.setItem(STORAGE_KEYS.LOGGED_USER, JSON.stringify(user));
        
        document.getElementById('sidebarUserName').textContent = newName;
        document.getElementById('profileAvatar').textContent = newName.charAt(0).toUpperCase();
        
        addNotification({ title: 'Profile', message: 'Profile updated', icon: 'fa-user-check', color: '#27ae60' });
        showToast('Profile updated');
    }
});

document.getElementById('changeAvatarBtn')?.addEventListener('click', uploadProfilePhoto);
document.getElementById('removeAvatarBtn')?.addEventListener('click', function() {
    const user = getLoggedInUser();
    if (user) {
        saveProfileImage(user.email, null);
        updateProfileImage(user.email);
        showToast('Photo removed');
    }
});

document.querySelectorAll('#emailNotifications, #lowStockAlerts, #darkMode').forEach(input => {
    input.addEventListener('change', saveSettings);
});

document.getElementById('backupDataBtn')?.addEventListener('click', function() {
    const data = {
        products: getProducts(),
        users: getUsers(),
        settings: JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS)) || {}
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sims_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    
    addNotification({ title: 'Backup', message: 'Data backed up', icon: 'fa-database', color: '#27ae60' });
});

document.getElementById('restoreDataBtn')?.addEventListener('click', function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                if (data.products) localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(data.products));
                if (data.users) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(data.users));
                if (data.settings) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
                
                showToast('Data restored, refresh page');
                setTimeout(() => window.location.reload(), 2000);
            } catch {
                showToast('Invalid backup file', 'error');
            }
        };
        reader.readAsText(file);
    };
    input.click();
});

document.getElementById('resetDataBtn')?.addEventListener('click', function() {
    if (confirm('⚠️ WARNING: This will delete ALL data. This action cannot be undone. Continue?')) {
        localStorage.clear();
        showToast('All data reset');
        setTimeout(() => window.location.href = 'register.html', 2000);
    }
});

// Password change
document.getElementById('updatePasswordBtn')?.addEventListener('click', function() {
    const current = document.getElementById('currentPassword').value;
    const newPass = document.getElementById('newPassword').value;
    const confirm = document.getElementById('confirmNewPassword').value;
    
    if (!current || !newPass || !confirm) {
        alert('All fields are required');
        return;
    }
    
    if (newPass !== confirm) {
        alert('New passwords do not match');
        return;
    }
    
    if (newPass.length < 8) {
        alert('Password must be at least 8 characters');
        return;
    }
    
    const user = getLoggedInUser();
    const users = getUsers();
    const userIndex = users.findIndex(u => u.email === user.email);
    
    if (userIndex !== -1) {
        if (users[userIndex].password !== current) {
            alert('Current password is incorrect');
            return;
        }
        
        users[userIndex].password = newPass;
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        
        document.getElementById('passwordModal').classList.add('hidden');
        showToast('Password updated');
    }
});

// Close modals on outside click
window.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.classList.add('hidden');
    }
});

// Password modal buttons
document.getElementById('closePasswordModal')?.addEventListener('click', () => {
    document.getElementById('passwordModal').classList.add('hidden');
});

document.getElementById('cancelPassword')?.addEventListener('click', () => {
    document.getElementById('passwordModal').classList.add('hidden');
});