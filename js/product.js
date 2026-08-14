// ==========================================
// 📦 E-KHOKHA PRODUCT PAGE ENGINE
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // Check if we are actually on the product page
    const isProductPage = document.querySelector('.product-title'); 
    if (!isProductPage) return; // Agar product page nahi hai, toh yahin ruk jao
        
    // --- 1. Data Fetch ---
    const activeProductId = localStorage.getItem('eKhokhaActiveProductId') || "PROD-001";
    
    // Master Database (app.js) se product dhoondho
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
            
            const mainGrid = document.createElement('div');
            mainGrid.className = 'specs-container'; 
            
            for (const [key, value] of Object.entries(productData.specs)) {
                const specRow = document.createElement('div');
                specRow.className = 'spec-row'; 
                specRow.innerHTML = `
                    <span class="spec-key">${key}</span>
                    <span class="spec-value">${value}</span>
                `;
                mainGrid.appendChild(specRow);
            }
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

    // ==========================================
    // ⭐ PRODUCT PAGE: DYNAMIC RATING INJECTION
    // ==========================================
    const ratingPreviewContainer = document.getElementById('product-page-rating-preview');
    if (ratingPreviewContainer && activeProductId) {
        // App.js ka apna naya review function call kar rahe hain
        const ratingData = calculateDynamicRating(activeProductId); 

        if (ratingData.rating_count > 0) {
            ratingPreviewContainer.innerHTML = `
                <div style="font-size: 36px; font-weight: 700; color: #1a1a1a; line-height: 1;">
                    ${ratingData.score > 0 ? ratingData.score : '0.0'}
                </div>
                <div>
                    <div style="color: #ffb800; font-size: 18px;">
                        ${'★'.repeat(Math.round(ratingData.score))}${'☆'.repeat(5 - Math.round(ratingData.score))}
                    </div>
                    <div style="font-size: 12px; color: #636e72; margin-top: 4px;">
                        Based on ${ratingData.rating_count} verified reviews
                    </div>
                </div>
            `;
        } else {
            ratingPreviewContainer.innerHTML = `
                <div style="font-size: 14px; color: #636e72;">No reviews yet. Be the first to review!</div>
            `;
        }
    }

    // --- E) Dynamic Image Gallery ---
    if (productData) {
        const mainImageEl = document.getElementById('main-product-image');
        const thumbnailListEl = document.getElementById('thumbnail-list');

        if (mainImageEl && thumbnailListEl && productData.images && productData.images.length > 0) {
            mainImageEl.src = productData.images[0];
            thumbnailListEl.innerHTML = '';

            productData.images.forEach((imgUrl, index) => {
                const thumbImg = document.createElement('img');
                thumbImg.src = imgUrl;
                thumbImg.className = `thumb-placeholder ${index === 0 ? 'active' : ''}`; 
                thumbImg.style.width = '60px';
                thumbImg.style.height = '60px';
                thumbImg.style.objectFit = 'cover';
                thumbImg.style.borderRadius = '8px';
                thumbImg.style.cursor = 'pointer';

                thumbImg.addEventListener('click', () => {
                    mainImageEl.src = imgUrl; 
                    document.querySelectorAll('#thumbnail-list .thumb-placeholder').forEach(el => el.classList.remove('active'));
                    thumbImg.classList.add('active');
                });
                thumbnailListEl.appendChild(thumbImg);
            });
        }
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

    // --- 3. ADD TO CART LOGIC --- //
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', () => {
            if(addToCartBtn.disabled) return; 
            
            const size = document.querySelector('.size-btn.active')?.innerText || 'Free Size';
            const quantity = parseInt(document.querySelector('.qty-number').innerText);
            
            let cart = JSON.parse(localStorage.getItem('eKhokhaCart')) || [];
            
            const existingIndex = cart.findIndex(item => item.product_id === activeProductId && item.size === size);
            if (existingIndex > -1) {
                cart[existingIndex].quantity += quantity;
            } else {
                cart.push({ product_id: activeProductId, size: size, quantity: quantity });
            }
            localStorage.setItem('eKhokhaCart', JSON.stringify(cart));
            
            // Call global function from app.js
            if(typeof updateCartBadge === 'function') updateCartBadge();
            alert("Added to Cart!"); 
        });
    }

    // --- 4. BUY NOW LOGIC --- //
    const buyNowBtn = document.querySelector('.btn-buy-now');
    if (buyNowBtn) {
        buyNowBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if(buyNowBtn.disabled) return; 
            
            const size = document.querySelector('.size-btn.active')?.innerText || 'Free Size';
            const quantity = parseInt(document.querySelector('.qty-number').innerText);
            
            const buyNowItem = [{ product_id: activeProductId, size: size, quantity: quantity }];
            
            localStorage.setItem('eKhokhaCheckoutData', JSON.stringify(buyNowItem));
            localStorage.setItem('eKhokhaCheckoutMode', 'route_product');
            window.location.href = "checkout.html";
        });
    }
});
