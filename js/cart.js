// --- CART PAGE LOGIC & INTERACTIVITY --- //

document.addEventListener('DOMContentLoaded', () => {
    // Page load hote hi cart render karo
    renderCart();
});

function renderCart() {
    let cart = JSON.parse(localStorage.getItem('eKhokhaCart')) || [];
    
    const emptyCartState = document.getElementById('empty-cart-state');
    const cartContainer = document.getElementById('cart-items-container');
    const cartItemsList = document.getElementById('cart-items-list');

    // 1. Agar cart khali hai
    if (cart.length === 0) {
        if(emptyCartState) emptyCartState.style.display = 'flex';
        if(cartContainer) cartContainer.style.display = 'none';
        return;
    }

    // 2. Agar cart mein items hain
    if(emptyCartState) emptyCartState.style.display = 'none';
    if(cartContainer) cartContainer.style.display = 'block';
    
    if(cartItemsList) cartItemsList.innerHTML = ''; 
    let totalAmount = 0;

    // 3. Har item ke liye ek card banao
    cart.forEach((item) => {
        // app.js se live data uthao
        const productData = getProductById(item.product_id); 
        
        if (!productData) return; // Corrupted data skip karo

        const currentName = productData.basic_info.name;
        const currentPrice = productData.pricing.current_price;
        const currentImage = productData.images[0] || 'IMG';

        let itemTotal = currentPrice * item.quantity;
        totalAmount += itemTotal;

        const itemDiv = document.createElement('div');
        itemDiv.className = 'cart-item';
        
        itemDiv.innerHTML = `
            <div class="cart-item-image">
                <img src="${currentImage}" alt="${currentName}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">
            </div>

            <div class="cart-item-info">
                <div class="item-title-row">
                    <div class="item-title">${currentName}</div>
                    <button class="item-delete-btn" onclick="removeItem('${item.product_id}', '${item.size}')">
                        <span class="material-symbols-outlined">delete</span>
                    </button>
                </div>
                <div class="item-size">Size: <b>${item.size}</b></div>
                <div class="item-price-row">
                    <div class="item-price">₹${currentPrice}</div>
                    <div class="item-qty-controls">
                        <button class="qty-btn-small" onclick="updateQty('${item.product_id}', '${item.size}', -1)"><span class="material-symbols-outlined">remove</span></button>
                        <span class="qty-number-small">${item.quantity}</span>
                        <button class="qty-btn-small" onclick="updateQty('${item.product_id}', '${item.size}', 1)"><span class="material-symbols-outlined">add</span></button>
                    </div>
                </div>
            </div>
        `;
        if(cartItemsList) cartItemsList.appendChild(itemDiv);
    });

    // 4. Bill & Coupon Logic Update
    let finalTotal = totalAmount;
    let appliedCoupon = JSON.parse(localStorage.getItem('eKhokhaAppliedCoupon'));

    const couponRow = document.getElementById('coupon-discount-row');
    const couponDiscountText = document.getElementById('cart-coupon-discount');
    const couponStatusText = document.getElementById('coupon-status-text');
    const couponActionBtn = document.getElementById('coupon-action-btn');

    function resetCouponUI() {
        if(couponRow) couponRow.style.display = 'none';
        if(couponStatusText) {
            couponStatusText.innerText = 'Apply Coupon';
            couponStatusText.style.color = '#1a1a1a';
        }
        if(couponActionBtn) {
            couponActionBtn.innerText = 'Apply';
            couponActionBtn.style.color = '#fd4f6a';
            couponActionBtn.href = 'coupon.html';
            couponActionBtn.onclick = null;
        }
    }

    if (appliedCoupon && typeof eKhokhaCoupons !== 'undefined') {
        const masterCoupon = eKhokhaCoupons.find(c => c.code === appliedCoupon.code);
        
        if (masterCoupon && totalAmount >= masterCoupon.min_order_amount) {
            let currentDiscount = 0;
            if (masterCoupon.type === 'fixed') {
                currentDiscount = masterCoupon.value;
            } else if (masterCoupon.type === 'percentage') {
                currentDiscount = (totalAmount * masterCoupon.value) / 100;
                if (masterCoupon.max_discount_amount && currentDiscount > masterCoupon.max_discount_amount) {
                    currentDiscount = masterCoupon.max_discount_amount;
                }
            }
            
            if (currentDiscount > totalAmount) currentDiscount = totalAmount;
            finalTotal -= currentDiscount;
            
            if(couponRow) couponRow.style.display = 'flex';
            if(couponDiscountText) couponDiscountText.innerText = `-₹${Math.round(currentDiscount)}`;
            
            if(couponStatusText) {
                couponStatusText.innerText = `'${masterCoupon.code}' Applied`;
                couponStatusText.style.color = '#388e3c';
            }
            if(couponActionBtn) {
                couponActionBtn.innerText = 'Remove';
                couponActionBtn.style.color = '#636e72';
                couponActionBtn.href = '#';
                couponActionBtn.onclick = (e) => {
                    e.preventDefault();
                    localStorage.removeItem('eKhokhaAppliedCoupon');
                    renderCart(); 
                };
            }
        } else {
            localStorage.removeItem('eKhokhaAppliedCoupon');
            resetCouponUI();
        }
    } else {
        resetCouponUI();
    }

    // Bill Details Update karo
    const itemTotalEl = document.getElementById('item-total');
    const grandTotalEl = document.getElementById('grand-total');
    const footerTotalEl = document.getElementById('footer-total');

    if(itemTotalEl) itemTotalEl.innerText = '₹' + totalAmount;
    if(grandTotalEl) grandTotalEl.innerText = '₹' + Math.round(finalTotal);
    if(footerTotalEl) footerTotalEl.innerText = '₹' + Math.round(finalTotal);
}

// --- BUTTONS LOGIC (+ / - / DELETE) --- //

window.removeItem = function(productId, size) {
    let cart = JSON.parse(localStorage.getItem('eKhokhaCart')) || [];
    cart = cart.filter(item => !(item.product_id === productId && item.size === size));
    localStorage.setItem('eKhokhaCart', JSON.stringify(cart)); 
    if(typeof updateCartBadge === 'function') updateCartBadge(); 
    renderCart(); 
};

window.updateQty = function(productId, size, change) {
    let cart = JSON.parse(localStorage.getItem('eKhokhaCart')) || [];
    const index = cart.findIndex(item => item.product_id === productId && item.size === size);
    
    if (index > -1) {
        if (change === -1 && cart[index].quantity === 1) {
            removeItem(productId, size);
            return;
        }
        cart[index].quantity += change;
        localStorage.setItem('eKhokhaCart', JSON.stringify(cart));
        if(typeof updateCartBadge === 'function') updateCartBadge();
        renderCart();
    }
};

// --- PROCEED TO CHECKOUT LOGIC --- //
const proceedBtn = document.getElementById('proceed-btn'); 

if (proceedBtn) {
    proceedBtn.addEventListener('click', (e) => {
        e.preventDefault(); 
        let currentCart = JSON.parse(localStorage.getItem('eKhokhaCart')) || [];
        if (currentCart.length === 0) {
            alert("Cart khali hai, pehle kuch add kijiye!");
            return;
        }
        localStorage.setItem('eKhokhaCheckoutMode', 'route_cart');
        window.location.href = "checkout.html"; 
    });
}
