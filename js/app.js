// ==========================================
// 📂 E-KHOKHA MASTER DATABASES & HELPERS
// ==========================================
let eKhokhaCategories = [];
let eKhokhaProducts = [];

// ⭐ E-KHOKHA MASTER REVIEWS DATABASE
let eKhokhaReviews = [
    { review_id: "REV-001", product_id: "PROD-001", user_id: "auth-uuid-placeholder-001", rating: 5, review_text: "Amazing t-shirt! The fabric is really soft and comfortable.", created_at: "2026-08-10T14:30:00Z", updated_at: "2026-08-10T14:30:00Z", status: "approved", is_verified_purchase: true },
    { review_id: "REV-002", product_id: "PROD-001", user_id: "auth-uuid-placeholder-002", rating: 4, review_text: "Good fit, but color is slightly darker than the image.", created_at: "2026-08-11T10:15:00Z", updated_at: "2026-08-11T10:15:00Z", status: "approved", is_verified_purchase: true },
    { review_id: "REV-003", product_id: "PROD-002", user_id: "auth-uuid-placeholder-001", rating: 5, review_text: "Best earbuds at this price. Bass is crazy!", created_at: "2026-08-12T09:00:00Z", updated_at: "2026-08-12T09:00:00Z", status: "pending", is_verified_purchase: false }
];

// 🎟️ E-KHOKHA MASTER COUPONS DATABASE
const eKhokhaCoupons = [
    { coupon_id: "COUPON-001", code: "WELCOME100", type: "fixed", value: 100, min_order_amount: 999, max_discount_amount: null, start_at: "2026-08-01T00:00:00Z", expires_at: "2026-08-31T23:59:59Z", usage_limit: 1000, used_count: 125, per_user_limit: 1, status: "active", description: "Get ₹100 off on orders above ₹999." },
    { coupon_id: "COUPON-002", code: "SAVE10", type: "percentage", value: 10, min_order_amount: 1499, max_discount_amount: 300, start_at: "2026-08-01T00:00:00Z", expires_at: "2026-09-15T23:59:59Z", usage_limit: 500, used_count: 80, per_user_limit: 1, status: "active", description: "Get 10% off up to ₹300." },
    { coupon_id: "COUPON-003", code: "EXPIRED50", type: "fixed", value: 50, min_order_amount: 499, max_discount_amount: null, start_at: "2026-07-01T00:00:00Z", expires_at: "2026-07-31T23:59:59Z", usage_limit: 500, used_count: 500, per_user_limit: 1, status: "inactive", description: "Get ₹50 off on orders above ₹499." }
];

// 🔔 E-KHOKHA MASTER NOTIFICATIONS DATABASE
const eKhokhaNotifications = [
    { notification_id: "NOTIF-001", user_id: "auth-uuid-placeholder-001", type: "order", title: "Order Confirmed", message: "Your order #EK1234 has been confirmed successfully.", related_order_id: "ORD-001", is_read: false, created_at: "2026-08-14T10:30:00Z" },
    { notification_id: "NOTIF-002", user_id: "auth-uuid-placeholder-001", type: "delivery", title: "Out for Delivery", message: "Your order #EK1234 is out for delivery.", related_order_id: "ORD-001", is_read: false, created_at: "2026-08-14T08:00:00Z" },
    { notification_id: "NOTIF-003", user_id: "auth-uuid-placeholder-001", type: "coupon", title: "Special Offer", message: "Get ₹100 OFF on orders above ₹999.", related_coupon_id: "COUPON-001", is_read: true, created_at: "2026-08-13T12:00:00Z" }
];

// ==========================================
// ⚙️ REVIEWS FUNCTIONS
// ==========================================
function getApprovedReviews(productId) {
    return eKhokhaReviews.filter(r => r.product_id === productId && r.status === 'approved');
}

function calculateDynamicRating(productId) {
    const approvedReviews = getApprovedReviews(productId);
    if (approvedReviews.length === 0) return { score: 0, rating_count: 0 };
    
    const sum = approvedReviews.reduce((total, review) => total + review.rating, 0);
    const avgScore = (sum / approvedReviews.length).toFixed(1); 
    
    return { score: parseFloat(avgScore), rating_count: approvedReviews.length };
}

function submitReview(productId, userId, ratingValue, reviewText) {
    if (ratingValue < 1 || ratingValue > 5 || !Number.isInteger(ratingValue)) {
        return { success: false, message: "Invalid rating. Must be between 1 and 5." };
    }
    
    const cleanText = reviewText ? reviewText.trim() : "";
    if (cleanText === "" || cleanText.length > 500) {
        return { success: false, message: "Review text must be between 1 and 500 characters." };
    }

    const existingIndex = eKhokhaReviews.findIndex(r => r.product_id === productId && r.user_id === userId);
    const timestamp = new Date().toISOString();

    if (existingIndex > -1) {
        eKhokhaReviews[existingIndex].rating = ratingValue;
        eKhokhaReviews[existingIndex].review_text = cleanText; 
        eKhokhaReviews[existingIndex].updated_at = timestamp;
        eKhokhaReviews[existingIndex].status = "pending"; 
        return { success: true, action: "updated", message: "Review updated and sent for approval." };
    } else {
        const newReview = { review_id: `REV-${Date.now()}`, product_id: productId, user_id: userId, rating: ratingValue, review_text: cleanText, created_at: timestamp, updated_at: timestamp, status: "pending", is_verified_purchase: false };
        eKhokhaReviews.push(newReview);
        return { success: true, action: "created", message: "Review submitted for approval." };
    }
}

// ==========================================
// 🔥 SUPABASE LIVE CATALOG LOADER
// ==========================================
async function loadEkhokhaCatalog() {
    try {
        const [categoriesRes, productsRes, variantsRes, specsRes, imagesRes] = await Promise.all([
            supabaseClient.from("categories").select("*").eq("status", "active").order("created_at", { ascending: true }),
            supabaseClient.from("products").select("*").eq("status", "active").order("created_at", { ascending: true }),
            supabaseClient.from("product_variants").select("*").eq("status", "active"),
            supabaseClient.from("product_specs").select("*"),
            supabaseClient.from("product_images").select("*").order("display_order", { ascending: true })
        ]);

        if (categoriesRes.error) throw categoriesRes.error;
        if (productsRes.error) throw productsRes.error;
        if (variantsRes.error) throw variantsRes.error;
        if (specsRes.error) throw specsRes.error;
        if (imagesRes.error) throw imagesRes.error;

        eKhokhaCategories = (categoriesRes.data || []).map(cat => ({
            category_id: cat.category_id, name: cat.name, slug: cat.slug, icon: cat.icon || "category"
        }));

        eKhokhaProducts = (productsRes.data || []).map(product => {
            const productVariants = (variantsRes.data || []).filter(v => v.product_id === product.product_id).map(v => ({
                variant_id: v.variant_id, variant_type: v.variant_type, variant_value: v.variant_value, stock_quantity: v.stock_quantity || 0, status: v.status
            }));

            const productSpecs = {};
            (specsRes.data || []).filter(s => s.product_id === product.product_id).forEach(s => {
                productSpecs[s.spec_name] = s.spec_value;
            });

            const productImages = (imagesRes.data || []).filter(i => i.product_id === product.product_id)
                .sort((a, b) => a.display_order - b.display_order).map(i => i.image_url);

            const stockCount = productVariants.reduce((total,v)=>total+Number(v.stock_quantity||0),0);
            let stockStatus = "in_stock";
            
            if (stockCount <= 0) stockStatus = "out_of_stock";
            else if (stockCount <= 5) stockStatus = "low_stock";

            const discount = product.discount_percentage !== null && product.discount_percentage !== undefined 
                ? Number(product.discount_percentage) 
                : (product.original_price > 0 ? Math.round(((product.original_price - product.current_price) / product.original_price) * 100) : 0);

            const categoryInfo = eKhokhaCategories.find(cat => cat.category_id === product.category_id);

            return {
                product_id: product.product_id,
                basic_info: { name: product.name, description: product.description || "", category_id: product.category_id, category: categoryInfo ? categoryInfo.name : "" },
                pricing: { current_price: Number(product.current_price), original_price: product.original_price !== null ? Number(product.original_price) : Number(product.current_price), discount: discount },
                rating: { score: 0, rating_count: 0, review_count: 0 },
                stock: { status: stockStatus, count: stockCount },
                variants: productVariants,
                specs: productSpecs,
                images: productImages
            };
        });

        console.log("✅ E-KHOKHA Catalog Loaded");
    } catch (error) {
        console.error("❌ E-KHOKHA Catalog Load Failed:", error);
        eKhokhaCategories = []; eKhokhaProducts = [];
        throw error;
    }
}

// ==========================================
// ⚙️ E-KHOKHA GLOBAL JAVASCRIPT & UTILS
// ==========================================
window.getProductById = function(productId) {
    return eKhokhaProducts.find(product => product.product_id === productId) || null;
};

// Global promise
window.eKhokhaDataReady = loadEkhokhaCatalog();

window.openProduct = function(productId) {
    localStorage.setItem('eKhokhaActiveProductId', productId);
    window.location.href = "pages/product.html";
};

function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    if (badge) {
        let cart = JSON.parse(localStorage.getItem('eKhokhaCart')) || [];
        let totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        badge.innerText = totalItems;
        badge.style.display = totalItems > 0 ? 'flex' : 'none';
    }
}

function getUnreadNotificationCount(userId) {
    const readList = JSON.parse(localStorage.getItem('eKhokhaReadNotifications')) || [];
    return eKhokhaNotifications.filter(n => n.user_id === userId && n.is_read === false && !readList.includes(n.notification_id)).length;
}

function updateNotificationBadge() {
    const notifBadge = document.getElementById('notif-badge');
    if (notifBadge) {
        const count = getUnreadNotificationCount("auth-uuid-placeholder-001");
        notifBadge.innerText = count > 9 ? '9+' : count;
        notifBadge.style.display = count > 0 ? 'flex' : 'none';
    }
}

// ==========================================
// 🚀 PAGE LOAD INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    await window.eKhokhaDataReady;
    
    updateCartBadge();
    updateNotificationBadge();

    // --- HOME SEARCH REDIRECTION LOGIC ---
    const homeSearchBox = document.querySelector('.search-container');
    const homeSearchInput = document.querySelector('.search-box input');

    if (homeSearchBox) {
        homeSearchBox.style.cursor = 'pointer'; 
        homeSearchBox.addEventListener('click', () => { window.location.href = "pages/search.html"; });
    }

    if (homeSearchInput) {
        homeSearchInput.style.cursor = 'pointer'; 
        homeSearchInput.addEventListener('click', (e) => { 
            e.stopPropagation(); 
            window.location.href = "pages/search.html"; 
        });
    }

    // --- HOME PAGE CATEGORY LOGIC ---
    const homeCatList = document.getElementById('home-category-list');
    if (homeCatList) {
        homeCatList.innerHTML = `
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

    // --- HOME PAGE LOGIC (Phase 3) ---
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
                    <div class="rating">★ ${product.rating.score}</div>
                </div>
            `;
            homeProductGrid.appendChild(card);
        });
    }
});
