// ==========================================
// 📂 E-KHOKHA CATEGORY LOGIC (PHASE 3 - SECURE)
// ==========================================

document.addEventListener('DOMContentLoaded', async () => {
    const tabsContainer = document.getElementById('page-category-tabs');
    const productsGrid = document.getElementById('category-products-grid');
    const emptyState = document.getElementById('category-empty-state');

    // ==========================================
// 🔥 WAIT FOR SUPABASE CATALOG
// ==========================================

if (typeof window.eKhokhaDataReady === 'undefined') {
    console.error("E-Khokha Error: Supabase catalog loader not found!");
    return;
}

try {
    await window.eKhokhaDataReady;
} catch (error) {
    console.error("E-Khokha Error: Failed to load catalog.", error);
    return;
}
    // 1. READ URL SLUG (List 2, Point 5: URL mein slug)
    const urlParams = new URLSearchParams(window.location.search);
    let activeSlug = urlParams.get('category') || 'all';

    // 2. VALIDATE & RESOLVE CATEGORY (List 2, Point 6: 'All' is UI only)
    let activeCategoryObj = null;
    if (activeSlug !== 'all') {
        activeCategoryObj = eKhokhaCategories.find(c => c.slug === activeSlug);
        if (!activeCategoryObj) {
            console.warn("Invalid category slug. Falling back to 'all'.");
            activeSlug = 'all'; // Fallback
            window.history.replaceState(null, '', 'category.html');
        }
    }

    // 3. RENDER CATEGORY TABS
    function renderTabs() {
        tabsContainer.innerHTML = ''; // Tabs structure safe hai
        
        // UI ONLY 'All' Tab
        tabsContainer.innerHTML += `
            <div class="category-card ${activeSlug === 'all' ? 'active' : ''}" onclick="window.location.href='category.html?category=all'">
                <div class="cat-icon"><span class="material-symbols-outlined">apps</span></div>
                <span>All</span>
            </div>
        `;

        // Database Driven Tabs
        eKhokhaCategories.forEach(cat => {
            tabsContainer.innerHTML += `
                <div class="category-card ${activeSlug === cat.slug ? 'active' : ''}" onclick="window.location.href='category.html?category=${cat.slug}'">
                    <div class="cat-icon"><span class="material-symbols-outlined">${cat.icon}</span></div>
                    <span>${cat.name}</span>
                </div>
            `;
        });
        
        // Auto-scroll active tab
        setTimeout(() => {
            const activeEl = tabsContainer.querySelector('.active');
            if(activeEl) activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }, 100);
    }

    // 4. 🛡️ SECURE DOM RENDERING & EXACT ID FILTERING
    function renderProducts() {
        productsGrid.innerHTML = ''; // Clear container
        
        // EXACT ID MATCHING (List 2, Point 4 & List 1, Point 2)
        let filteredProducts = eKhokhaProducts;
        if (activeSlug !== 'all' && activeCategoryObj) {
            // Matching purely by category_id, NOT name!
            filteredProducts = eKhokhaProducts.filter(p => p.basic_info && p.basic_info.category_id === activeCategoryObj.category_id);
        }

        if (filteredProducts.length === 0) {
            productsGrid.style.display = 'none';
            emptyState.style.display = 'flex';
            return;
        }

        productsGrid.style.display = 'grid';
        emptyState.style.display = 'none';

        // 🛡️ NO innerHTML VULNERABILITY (List 1, Point 3 Fixed)
        filteredProducts.forEach(product => {
            const imageSrc = (product.images && product.images.length > 0) ? product.images[0] : '';
            const nameText = product.basic_info.name;
            const currentPriceVal = product.pricing.current_price;
            const originalPriceVal = product.pricing.original_price;
            const discountVal = product.pricing.discount;
            const ratingScore = (product.rating && product.rating.score) ? product.rating.score : '';

            // Card Container
            const card = document.createElement('div');
            card.className = 'product-card';
            card.style.background = '#fff';
            card.style.borderRadius = '12px';
            card.style.padding = '10px';
            card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
            card.style.cursor = 'pointer';
            
            card.onclick = () => {
                localStorage.setItem('eKhokhaActiveProductId', product.product_id);
                window.location.href = "product.html";
            };

            // Image Section
            const imgContainer = document.createElement('div');
            imgContainer.className = 'product-image';
            imgContainer.style.position = 'relative';
            imgContainer.style.marginBottom = '10px';

            const img = document.createElement('img');
            img.src = imageSrc;
            img.alt = nameText; 
            img.style.width = '100%';
            img.style.aspectRatio = '1/1';
            img.style.objectFit = 'cover';
            img.style.borderRadius = '8px';
            imgContainer.appendChild(img);

            if (discountVal) {
                const discountBadge = document.createElement('span');
                discountBadge.style.position = 'absolute';
                discountBadge.style.top = '8px';
                discountBadge.style.left = '8px';
                discountBadge.style.background = '#fd4f6a';
                discountBadge.style.color = '#fff';
                discountBadge.style.fontSize = '10px';
                discountBadge.style.fontWeight = '700';
                discountBadge.style.padding = '2px 6px';
                discountBadge.style.borderRadius = '4px';
                discountBadge.textContent = `${discountVal}% off`;
                imgContainer.appendChild(discountBadge);
            }

            // Info Section
            const infoContainer = document.createElement('div');
            infoContainer.className = 'product-info';

            const title = document.createElement('h3');
            title.style.fontSize = '14px';
            title.style.fontWeight = '600';
            title.style.color = '#2b2b2b';
            title.style.margin = '0 0 6px 0';
            title.style.display = '-webkit-box';
            title.style.webkitLineClamp = '2'; 
            title.style.webkitBoxOrient = 'vertical';
            title.style.overflow = 'hidden';
            title.textContent = nameText; // Safe Text

            const priceRow = document.createElement('div');
            priceRow.className = 'product-price';

            const currPrice = document.createElement('span');
            currPrice.style.fontWeight = '700';
            currPrice.style.color = '#1a1a1a';
            currPrice.style.fontSize = '16px';
            currPrice.textContent = `₹${currentPriceVal}`;
            priceRow.appendChild(currPrice);

            if (originalPriceVal) {
                const origPrice = document.createElement('span');
                origPrice.style.textDecoration = 'line-through';
                origPrice.style.color = '#a4b0be';
                origPrice.style.fontSize = '12px';
                origPrice.style.marginLeft = '6px';
                origPrice.textContent = `₹${originalPriceVal}`;
                priceRow.appendChild(origPrice);
            }

            infoContainer.appendChild(title);
            infoContainer.appendChild(priceRow);

            if (ratingScore) {
                const ratingEl = document.createElement('div');
                ratingEl.style.display = 'inline-flex';
                ratingEl.style.alignItems = 'center';
                ratingEl.style.backgroundColor = '#388e3c'; 
                ratingEl.style.color = '#ffffff';
                ratingEl.style.fontSize = '11px';
                ratingEl.style.fontWeight = '700';
                ratingEl.style.padding = '3px 6px';
                ratingEl.style.borderRadius = '4px';
                ratingEl.style.marginTop = '8px';
                ratingEl.style.width = 'fit-content';
                ratingEl.style.gap = '2px';
                ratingEl.textContent = `${ratingScore} ★`;
                infoContainer.appendChild(ratingEl);
            }

            card.appendChild(imgContainer);
            card.appendChild(infoContainer);
            productsGrid.appendChild(card);
        });
    }

    renderTabs();
    renderProducts();
});
