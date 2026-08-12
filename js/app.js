// ==========================================
// 📂 E-KHOKHA MASTER CATEGORY DATABASE
// ==========================================
const eKhokhaCategories = [
    { category_id: "CAT-001", name: "Fashion", slug: "fashion", icon: "checkroom" },
    { category_id: "CAT-002", name: "Gadgets", slug: "gadgets", icon: "smartphone" }, // Tera smartphone icon
    { category_id: "CAT-003", name: "Beauty", slug: "beauty", icon: "face" },
    { category_id: "CAT-004", name: "Home", slug: "home", icon: "chair" }
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
            category_id: "CAT-001" // 🔴 NEW: Supabase Relationship
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
            category_id: "CAT-002" // 🔴 NEW: Supabase Relationship
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
            category_id: "CAT-001" // 🔴 NEW: Supabase Relationship
        },
        pricing: { current_price: 699, original_price: 1599, discount: 56 },
        rating: { score: 4.0, rating_count: 890, review_count: 45 },
        stock: { status: "out_of_stock", count: 0 },
        variants: ["UK 7", "UK 8", "UK 9", "UK 10"],
        specs: { "Upper Material": "Mesh", "Sole": "EVA" },
        images: ["https://placehold.co/600x400/1a1a1a/ffffff?text=Sneakers+Main"]
    }
];

// Helper Function
function getProductById(id) {
    return eKhokhaProducts.find(product => product.product_id === id);
}

// ==========================================
// ⚙️ E-KHOKHA GLOBAL JAVASCRIPT 
// ==========================================

// Global function jo har page par chahiye
function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    if (badge) {
        let cart = JSON.parse(localStorage.getItem('eKhokhaCart')) || [];
        let totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        badge.innerText = totalItems;
        badge.style.display = totalItems > 0 ? 'flex' : 'none';
    }
}

// 1. Page Load hote hi sabse pehle ye chalao
document.addEventListener('DOMContentLoaded', () => {
    updateCartBadge();
    // --- 🔴 HOME SEARCH REDIRECTION LOGIC --- //
    const homeSearchBox = document.querySelector('.search-container');
    const homeSearchInput = document.querySelector('.search-box input');

    // Agar user Home page par hai aur search container exist karta hai
    if (homeSearchBox) {
        homeSearchBox.style.cursor = 'pointer'; // UI update
        homeSearchBox.addEventListener('click', () => {
            window.location.href = "pages/search.html";
        });
    }

    // Double safety: Agar user specifically input ke andar tap kare
    if (homeSearchInput) {
        homeSearchInput.style.cursor = 'pointer'; // UI update
        homeSearchInput.addEventListener('click', (e) => {
            e.stopPropagation(); // Event bubble na ho
            window.location.href = "pages/search.html";
        });
    }
        // --- HOME PAGE CATEGORY LOGIC --- //
    const homeCatList = document.getElementById('home-category-list');
    if (homeCatList) {
        homeCatList.innerHTML = ''; 
        
        // "All" Button (Links to category page)
        homeCatList.innerHTML += `
            <div class="category-card active" onclick="window.location.href='pages/category.html?category=all'">
                <div class="cat-icon"><span class="material-symbols-outlined">apps</span></div>
                <span>All</span>
            </div>
        `;

        // Dynamic Categories loop
        eKhokhaCategories.forEach(cat => {
            homeCatList.innerHTML += `
                <div class="category-card" onclick="window.location.href='pages/category.html?category=${cat.slug}'">
                    <div class="cat-icon"><span class="material-symbols-outlined">${cat.icon}</span></div>
                    <span>${cat.name}</span>
                </div>
            `;
        });

        // "More" Button
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
        homeProductGrid.innerHTML = ''; // Khali karo
        
        // Database ke har product ke liye ek card banao
        eKhokhaProducts.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            
            // 🔴 Naya click function: Sirf ID bhej rahe hain
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

    
    // --- PRODUCT PAGE LOGIC --- //
    const isProductPage = document.querySelector('.product-title'); 
    if (isProductPage) {
        
        // --- 1. Data Fetch ---
        const activeProductId = localStorage.getItem('eKhokhaActiveProductId') || "PROD-001";
        const productData = getProductById(activeProductId);

        if (productData) {
            // A) Basic Info & Pricing
            document.querySelector('.product-title').innerText = productData.basic_info.name;
            document.querySelector('.current-price').innerText = '₹' + productData.pricing.current_price;
            
            const origPrice = document.querySelector('.original-price');
            if (origPrice && productData.pricing.original_price) {
                origPrice.innerText = '₹' + productData.pricing.original_price;
            }

            const descEl = document.querySelector('.product-description');
            if(descEl) descEl.innerText = productData.basic_info.description;

            // B) Dynamic Variants (Sizes/Colors)
            const sizeList = document.querySelector('.size-list');
            if (sizeList && productData.variants) {
                sizeList.innerHTML = ''; 
                
                productData.variants.forEach((variant, index) => {
                    const btn = document.createElement('button');
                    btn.className = `size-btn ${index === 0 ? 'active' : ''}`; 
                    btn.innerText = variant;
                    sizeList.appendChild(btn);
                });

                const sizeBtns = document.querySelectorAll('.size-list .size-btn');
                sizeBtns.forEach(btn => {
                    btn.addEventListener('click', () => {
                        sizeBtns.forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                    });
                });
            }

            // C) Dynamic Specifications (Professional Grid Format)
            const specsContainer = document.querySelector('.specs-list'); 
            if (specsContainer && productData.specs) {
                specsContainer.innerHTML = ''; // Purana kachra saaf
                
                // 1. Ek main box (wrapper) banayenge border aur design ke liye
                const mainGrid = document.createElement('div');
                mainGrid.className = 'specs-container'; 
                
                // 2. Loop lagakar Myntra-style rows banayenge
                for (const [key, value] of Object.entries(productData.specs)) {
                    const specRow = document.createElement('div');
                    specRow.className = 'spec-row'; // Nayi CSS class
                    
                    // Left mein heading, Right mein uski value
                    specRow.innerHTML = `
                        <span class="spec-key">${key}</span>
                        <span class="spec-value">${value}</span>
                    `;
                    
                    mainGrid.appendChild(specRow);
                }
                
                // 3. Final grid ko screen par daal do
                specsContainer.appendChild(mainGrid);
            }

            // D) Stock Management
            const stockStatusEl = document.querySelector('.stock-status');
            const addToCartBtn = document.getElementById('add-to-cart-btn');
            const buyNowBtn = document.querySelector('.btn-buy-now');

            if (productData.stock.status === 'out_of_stock') {
                if (stockStatusEl) {
                    stockStatusEl.innerText = "Out of Stock";
                    stockStatusEl.style.color = 'red';
                }
                if (addToCartBtn) addToCartBtn.disabled = true;
                if (buyNowBtn) buyNowBtn.disabled = true;
            } else {
                if (stockStatusEl) {
                    stockStatusEl.innerText = "In Stock";
                    stockStatusEl.style.color = 'green';
                }
            }
        }
            // --- E) Dynamic Image Gallery (Phase 2 Upgrade) ---
            const mainImageEl = document.getElementById('main-product-image');
            const thumbnailListEl = document.getElementById('thumbnail-list');

            if (mainImageEl && thumbnailListEl && productData.images && productData.images.length > 0) {
                // 1. By default, sabse pehli image (images[0]) ko Main Image banao
                mainImageEl.src = productData.images[0];
                
                // Purana kachra saaf karo
                thumbnailListEl.innerHTML = '';

                // 2. Loop lagakar saari images ke thumbnails banao
                productData.images.forEach((imgUrl, index) => {
                    const thumbImg = document.createElement('img');
                    thumbImg.src = imgUrl;
                    // Pehle thumbnail ko 'active' class do
                    thumbImg.className = `thumb-placeholder ${index === 0 ? 'active' : ''}`; 
                    // Thodi si inline styling taaki HTML ki CSS ke sath set baith jaye
                    thumbImg.style.width = '60px';
                    thumbImg.style.height = '60px';
                    thumbImg.style.objectFit = 'cover';
                    thumbImg.style.borderRadius = '8px';
                    thumbImg.style.cursor = 'pointer';

                    // 3. Click Event: Jab koi thumbnail par click kare toh wo Main Image ban jaye
                    thumbImg.addEventListener('click', () => {
                        mainImageEl.src = imgUrl; // Main image update
                        
                        // Active class ko naye thumbnail par shift karo
                        document.querySelectorAll('#thumbnail-list .thumb-placeholder').forEach(el => el.classList.remove('active'));
                        thumbImg.classList.add('active');
                    });

                    thumbnailListEl.appendChild(thumbImg);
                });
            }

        // --- 2. Quantity Logic ---
        const qtyMinusBtn = document.querySelector('.qty-controls .qty-btn:first-child');
        const qtyPlusBtn = document.querySelector('.qty-controls .qty-btn:last-child');
        const qtyNumber = document.querySelector('.qty-controls .qty-number');

        if (qtyMinusBtn && qtyPlusBtn && qtyNumber) {
            qtyMinusBtn.addEventListener('click', () => {
                let qty = parseInt(qtyNumber.innerText);
                if (qty > 1) qtyNumber.innerText = qty - 1;
            });
            qtyPlusBtn.addEventListener('click', () => {
                let qty = parseInt(qtyNumber.innerText);
                if (qty < 10) qtyNumber.innerText = qty + 1;
            });
        }

        // --- 3. ADD TO CART LOGIC (Strict Architecture) --- //
        const addToCartBtn = document.getElementById('add-to-cart-btn');
        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', () => {
                if(addToCartBtn.disabled) return; 
                
                const size = document.querySelector('.size-btn.active')?.innerText || 'Free Size';
                const quantity = parseInt(document.querySelector('.qty-number').innerText);
                const productId = localStorage.getItem('eKhokhaActiveProductId') || "PROD-001";

                let cart = JSON.parse(localStorage.getItem('eKhokhaCart')) || [];
                
                const existingIndex = cart.findIndex(item => item.product_id === productId && item.size === size);
                if (existingIndex > -1) {
                    cart[existingIndex].quantity += quantity;
                } else {
                    cart.push({ product_id: productId, size: size, quantity: quantity });
                }
                localStorage.setItem('eKhokhaCart', JSON.stringify(cart));
                updateCartBadge();
                alert("Added to Cart!"); 
            });
        }

        // --- 4. BUY NOW LOGIC (Strict Architecture) --- //
        const buyNowBtn = document.querySelector('.btn-buy-now');
        if (buyNowBtn) {
            buyNowBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if(buyNowBtn.disabled) return; 
                
                const size = document.querySelector('.size-btn.active')?.innerText || 'Free Size';
                const quantity = parseInt(document.querySelector('.qty-number').innerText);
                const productId = localStorage.getItem('eKhokhaActiveProductId') || "PROD-001";

                const buyNowItem = [{ product_id: productId, size: size, quantity: quantity }];
                
                localStorage.setItem('eKhokhaCheckoutData', JSON.stringify(buyNowItem));
                localStorage.setItem('eKhokhaCheckoutMode', 'route_product');
                window.location.href = "checkout.html";
            });
        }
    }
});

// --- HOME PAGE REDIRECTION --- //
// 🔴 UPGRADE: Ab sirf ID pass hogi, kachra nahi!
window.openProduct = function(productId) {
    localStorage.setItem('eKhokhaActiveProductId', productId);
    window.location.href = "pages/product.html";
};
