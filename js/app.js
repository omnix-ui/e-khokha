// ==========================================
// 📂 E-KHOKHA MASTER CATEGORY DATABASE
// ==========================================
const eKhokhaCategories = [
    { category_id: "CAT-001", name: "Fashion", slug: "fashion", icon: "checkroom" },
    { category_id: "CAT-002", name: "Gadgets", slug: "gadgets", icon: "smartphone" }, 
    { category_id: "CAT-003", name: "Beauty", slug: "beauty", icon: "face" },
    { category_id: "CAT-004", name: "Home", slug: "home", icon: "chair" }
];

// ==========================================
// ⭐ E-KHOKHA MASTER REVIEWS DATABASE
// ==========================================
let eKhokhaReviews = [
    {
        review_id: "REV-001",
        product_id: "PROD-001", 
        user_id: "auth-uuid-placeholder-001", 
        rating: 5,
        review_text: "Amazing t-shirt! The fabric is really soft and comfortable.",
        created_at: "2026-08-10T14:30:00Z",
        updated_at: "2026-08-10T14:30:00Z",
        status: "approved", 
        is_verified_purchase: true 
    },
    {
        review_id: "REV-002",
        product_id: "PROD-001",
        user_id: "auth-uuid-placeholder-002",
        rating: 4,
        review_text: "Good fit, but color is slightly darker than the image.",
        created_at: "2026-08-11T10:15:00Z",
        updated_at: "2026-08-11T10:15:00Z",
        status: "approved",
        is_verified_purchase: true
    },
    {
        review_id: "REV-003",
        product_id: "PROD-002",
        user_id: "auth-uuid-placeholder-001",
        rating: 5,
        review_text: "Best earbuds at this price. Bass is crazy!",
        created_at: "2026-08-12T09:00:00Z",
        updated_at: "2026-08-12T09:00:00Z",
        status: "pending", 
        is_verified_purchase: false
    }
];

// ==========================================
// ⚙️ REVIEWS CORE FUNCTIONS (Supabase Ready)
// ==========================================
function getApprovedReviews(productId) {
    return eKhokhaReviews.filter(r => r.product_id === productId && r.status === 'approved');
}

function calculateDynamicRating(productId) {
    const approvedReviews = getApprovedReviews(productId);
    
    if (approvedReviews.length === 0) {
        return { score: 0, rating_count: 0 };
    }
    
    const sum = approvedReviews.reduce((total, review) => total + review.rating, 0);
    const avgScore = (sum / approvedReviews.length).toFixed(1); 
    
    return {
        score: parseFloat(avgScore),
        rating_count: approvedReviews.length
    };
}

function submitReview(productId, userId, ratingValue, reviewText) {
    if (ratingValue < 1 || ratingValue > 5 || !Number.isInteger(ratingValue)) {
        return { success: false, message: "Invalid rating. Must be between 1 and 5." };
    }
    
    const cleanText = reviewText ? reviewText.trim() : "";
    if (cleanText === "" || cleanText.length > 500) {
        return { success: false, message: "Review text must be between 1 and 500 characters." };
    }

    const existingReviewIndex = eKhokhaReviews.findIndex(r => r.product_id === productId && r.user_id === userId);
    const timestamp = new Date().toISOString();

    if (existingReviewIndex > -1) {
        eKhokhaReviews[existingReviewIndex].rating = ratingValue;
        eKhokhaReviews[existingReviewIndex].review_text = cleanText; 
        eKhokhaReviews[existingReviewIndex].updated_at = timestamp;
        eKhokhaReviews[existingReviewIndex].status = "pending"; 
        
        return { success: true, action: "updated", message: "Review updated and sent for approval." };
    } else {
        const newReview = {
            review_id: `REV-${Date.now()}`, 
            product_id: productId,
            user_id: userId,
            rating: ratingValue,
            review_text: cleanText,
            created_at: timestamp,
            updated_at: timestamp,
            status: "pending", 
            is_verified_purchase: false 
        };
        eKhokhaReviews.push(newReview);
        
        return { success: true, action: "created", message: "Review submitted for approval." };
    }
}

// ==========================================
// 🎟️ E-KHOKHA MASTER COUPONS DATABASE
// ==========================================
const eKhokhaCoupons = [
    {
        coupon_id: "COUPON-001",
        code: "WELCOME100",
        type: "fixed",
        value: 100,
        min_order_amount: 999,
        max_discount_amount: null,
        start_at: "2026-08-01T00:00:00Z",
        expires_at: "2026-08-31T23:59:59Z", 
        usage_limit: 1000,
        used_count: 125,
        per_user_limit: 1,
        status: "active",
        description: "Get ₹100 off on orders above ₹999."
    },
    {
        coupon_id: "COUPON-002",
        code: "SAVE10",
        type: "percentage",
        value: 10,
        min_order_amount: 1499,
        max_discount_amount: 300,
        start_at: "2026-08-01T00:00:00Z",
        expires_at: "2026-09-15T23:59:59Z", 
        usage_limit: 500,
        used_count: 80,
        per_user_limit: 1,
        status: "active",
        description: "Get 10% off up to ₹300."
    },
    {
        coupon_id: "COUPON-003",
        code: "EXPIRED50",
        type: "fixed",
        value: 50,
        min_order_amount: 499,
        max_discount_amount: null,
        start_at: "2026-07-01T00:00:00Z",
        expires_at: "2026-07-31T23:59:59Z", 
        usage_limit: 500,
        used_count: 500,
        per_user_limit: 1,
        status: "inactive",
        description: "Get ₹50 off on orders above ₹499."
    }
];

// ==========================================
// 🔔 E-KHOKHA MASTER NOTIFICATIONS DATABASE
// ==========================================
const eKhokhaNotifications = [
    {
        notification_id: "NOTIF-001",
        user_id: "auth-uuid-placeholder-001",
        type: "order",
        title: "Order Confirmed",
        message: "Your order #EK1234 has been confirmed successfully.",
        related_order_id: "ORD-001",
        is_read: false,
        created_at: "2026-08-14T10:30:00Z"
    },
    {
        notification_id: "NOTIF-002",
        user_id: "auth-uuid-placeholder-001",
        type: "delivery",
        title: "Out for Delivery",
        message: "Your order #EK1234 is out for delivery.",
        related_order_id: "ORD-001",
        is_read: false,
        created_at: "2026-08-14T08:00:00Z"
    },
    {
        notification_id: "NOTIF-003",
        user_id: "auth-uuid-placeholder-001",
        type: "coupon",
        title: "Special Offer",
        message: "Get ₹100 OFF on orders above ₹999.",
        related_coupon_id: "COUPON-001",
        is_read: true,
        created_at: "2026-08-13T12:00:00Z"
    }
];

// ==========================================
// 📦 E-KHOKHA MASTER PRODUCT DATABASE (MOCK)
// ==========================================
const eKhokhaProducts = [
    {
        product_id: "PROD-001",
        basic_info: {
            name: "Men Solid Casual T-Shirt",
            description: "Premium cotton solid casual t-shirt for everyday wear.",
            category: "Fashion",
            category_id: "CAT-001" 
        },
        pricing: { current_price: 399, original_price: 999, discount: 60 },
        rating: { score: 4.5, rating_count: 2450, review_count: 150 },
        stock: { status: "in_stock", count: 150 },
        variants: ["S", "M", "L", "XL", "XXL"],
        specs: { "Fabric": "100% Cotton", "Fit": "Regular Fit" },
        images: ["https://placehold.co/600x800/1a1a1a/ffffff?text=T-Shirt+Main"]
    },
    {
        product_id: "PROD-002",
        basic_info: {
            name: "Wireless Bluetooth Earbuds Pro",
            description: "High-quality bass, noise cancellation.",
            category: "Gadgets",
            category_id: "CAT-002" 
        },
        pricing: { current_price: 899, original_price: 2499, discount: 64 },
        rating: { score: 4.2, rating_count: 1205, review_count: 85 },
        stock: { status: "in_stock", count: 50 },
        variants: ["Black", "White"], 
        specs: { "Type": "In-Ear", "Battery Life": "24 Hours" },
        images: ["https://placehold.co/600x600/1a1a1a/ffffff?text=Earbuds+Main"]
    },
    {
        product_id: "PROD-003",
        basic_info: {
            name: "Men's Running Sneakers",
            description: "Lightweight and durable running shoes.",
            category: "Fashion",
            category_id: "CAT-001" 
        },
        pricing: { current_price: 699, original_price: 1599, discount: 56 },
        rating: { score: 4.0, rating_count: 890, review_count: 45 },
        stock: { status: "out_of_stock", count: 0 },
        variants: ["UK 7", "UK 8", "UK 9", "UK 10"],
        specs: { "Upper Material": "Mesh", "Sole": "EVA" },
        images: ["https://placehold.co/600x400/1a1a1a/ffffff?text=Sneakers+Main"]
    }
];

function getProductById(id) {
    return eKhokhaProducts.find(product => product.product_id === id);
}

// ==========================================
// ⚙️ E-KHOKHA GLOBAL JAVASCRIPT 
// ==========================================

function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    if (badge) {
        let cart = JSON.parse(localStorage.getItem('eKhokhaCart')) || [];
        let totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        badge.innerText = totalItems;
        badge.style.display = totalItems > 0 ? 'flex' : 'none';
    }
}

// Global Function for Notification Unread Count
function getUnreadNotificationCount(userId) {
    const readList = JSON.parse(localStorage.getItem('eKhokhaReadNotifications')) || [];
    const unreadCount = eKhokhaNotifications.filter(n => 
        n.user_id === userId && 
        n.is_read === false && 
        !readList.includes(n.notification_id)
    ).length;
    return unreadCount;
}

// Global UI Updater for Notification Badge
function updateNotificationBadge() {
    const notifBadge = document.getElementById('notif-badge');
    if (notifBadge) {
        const count = getUnreadNotificationCount("auth-uuid-placeholder-001");
        notifBadge.innerText = count > 9 ? '9+' : count;
        notifBadge.style.display = count > 0 ? 'flex' : 'none';
    }
}

// Page Load Initialization
document.addEventListener('DOMContentLoaded', () => {
    updateCartBadge();
    updateNotificationBadge(); // 🔴 Added Notification Badge Updater

    // --- HOME SEARCH REDIRECTION LOGIC --- //
    const homeSearchBox = document.querySelector('.search-container');
    const homeSearchInput = document.querySelector('.search-box input');

    if (homeSearchBox) {
        homeSearchBox.style.cursor = 'pointer'; 
        homeSearchBox.addEventListener('click', () => {
            window.location.href = "pages/search.html";
        });
    }

    if (homeSearchInput) {
        homeSearchInput.style.cursor = 'pointer'; 
        homeSearchInput.addEventListener('click', (e) => {
            e.stopPropagation(); 
            window.location.href = "pages/search.html";
        });
    }

    // --- HOME PAGE CATEGORY LOGIC --- //
    const homeCatList = document.getElementById('home-category-list');
    if (homeCatList) {
        homeCatList.innerHTML = ''; 
        
        homeCatList.innerHTML += `
            <div class="category-card active" onclick="window.location.href='pages/category.html?category=all'">
                <div class="cat-icon"><span class="material-symbols-outlined">apps</span></div>
                <span>All</span>
            </div>
        `;

        eKhokhaCategories.forEach(cat => {
            homeCatList.innerHTML += `
                <div class="category-card" onclick="window.location.href='pages/category.html?category=${cat.slug}'">
                    <div class="cat-icon"><span class="material-symbols-outlined">${cat.icon}</span></div>
                    <span>${cat.name}</span>
                </div>
            `;
        });

        homeCatList.innerHTML += `
            <div class="category-card" onclick="window.location.href='pages/category.html'">
                <div class="cat-icon"><span class="material-symbols-outlined">more_horiz</span></div>
                <span>More</span>
            </div>
        `;
    }

    // --- HOME PAGE LOGIC (Phase 3) --- //
    const homeProductGrid = document.getElementById('home-product-grid');
    if (homeProductGrid) {
        homeProductGrid.innerHTML = ''; 
        
        eKhokhaProducts.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            
            card.onclick = () => openProduct(product.product_id);

            card.innerHTML = `
                <div class="product-image">
                    <img src="${product.images[0]}" alt="${product.basic_info.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 12px 12px 0 0;">
                </div>

                <div class="product-info">
                    <p class="product-name">${product.basic_info.name}</p>
                    <div class="price-row">
                        <span class="current-price">₹${product.pricing.current_price}</span>
                        <span class="original-price">₹${product.pricing.original_price}</span>
                        <span class="discount">${product.pricing.discount}% off</span>
                    </div>
                    <div class="rating">
                        ★ ${product.rating.score}
                    </div>
                </div>
            `;
            homeProductGrid.appendChild(card);
        });
    }
});

// --- HOME PAGE REDIRECTION --- //
window.openProduct = function(productId) {
    localStorage.setItem('eKhokhaActiveProductId', productId);
    window.location.href = "pages/product.html";
};
