// ==========================================
// 🎟️ E-KHOKHA COUPON ENGINE (Supabase Ready)
// ==========================================

const MOCK_USER_ID = "auth-uuid-placeholder-001"; 

document.addEventListener('DOMContentLoaded', () => {
    renderCoupons();
});

// 1. HELPER: Get Total Cart Amount
function calculateCartTotal() {
    let cart = JSON.parse(localStorage.getItem('eKhokhaCart')) || [];
    let total = 0;
    cart.forEach(item => {
        const product = getProductById(item.product_id); // app.js se live price nikalenge
        if (product) total += (product.pricing.current_price * item.quantity);
    });
    return total;
}

// 2. RENDER COUPONS (Hide Expired)
function renderCoupons() {
    const container = document.getElementById('available-coupons-container');
    const currentDate = new Date();
    
    // Sirf Active aur Non-Expired coupons dikhao
    const availableCoupons = eKhokhaCoupons.filter(c => c.status === 'active' && new Date(c.expires_at) >= currentDate);

    if (availableCoupons.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding: 20px; color:#636e72;">No coupons available right now.</div>`;
        return;
    }

    container.innerHTML = '';
    availableCoupons.forEach(coupon => {
        const expDate = new Date(coupon.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        
        const card = document.createElement('div');
        card.style.background = '#fff';
        card.style.borderRadius = '12px';
        card.style.padding = '15px';
        card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
        card.style.borderLeft = '4px solid #fd4f6a';

        let titleText = coupon.type === 'fixed' ? `₹${coupon.value} OFF` : `${coupon.value}% OFF`;

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                <div>
                    <div style="background: #fff0f2; border: 1px dashed #fd4f6a; color: #fd4f6a; padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 14px; display: inline-block; margin-bottom: 8px;">
                        ${coupon.code}
                    </div>
                    <div style="font-weight: 700; font-size: 16px; color: #1a1a1a;">${titleText}</div>
                    <div style="font-size: 12px; color: #636e72; margin-top: 2px;">On orders above ₹${coupon.min_order_amount}</div>
                </div>
                <button onclick="applyCoupon('${coupon.code}')" style="background: transparent; color: #fd4f6a; border: none; font-weight: 700; font-size: 14px; cursor: pointer;">Apply</button>
            </div>
            <hr style="border: none; border-top: 1px solid #f1f2f6; margin: 10px 0;">
            <div style="font-size: 13px; color: #2d3436; margin-bottom: 5px;">${coupon.description}</div>
            <div style="font-size: 11px; color: #a4b0be; font-weight: 600;">Valid till ${expDate}</div>
        `;
        container.appendChild(card);
    });
}

// 3. CORE VALIDATION FUNCTION
window.applyCoupon = function(code) {
    const cartTotal = calculateCartTotal();
    
    if (cartTotal === 0) {
        alert("Your cart is empty! Add items to apply coupons.");
        return;
    }

    const coupon = eKhokhaCoupons.find(c => c.code.toUpperCase() === code.toUpperCase());
    const currentDate = new Date();

    if (!coupon) { alert("Invalid coupon code"); return; }
    if (coupon.status !== 'active' || currentDate < new Date(coupon.start_at)) { alert("This coupon is currently unavailable"); return; }
    if (currentDate > new Date(coupon.expires_at)) { alert("This coupon has expired"); return; }
    if (cartTotal < coupon.min_order_amount) { alert(`Minimum order value is ₹${coupon.min_order_amount}`); return; }
    if (coupon.used_count >= coupon.usage_limit) { alert("This coupon has reached its usage limit"); return; }

    // Save to localStorage & redirect back to cart
    const appliedData = { code: coupon.code };
    localStorage.setItem('eKhokhaAppliedCoupon', JSON.stringify(appliedData));
    
    // Go back to cart, the updated cart.js will automatically do the math!
    window.history.back(); 
};

// 4. MANUAL INPUT BOX LOGIC
window.handleManualApply = function() {
    const code = document.getElementById('manual-coupon-input').value.trim();
    if (!code) { alert("Please enter a coupon code"); return; }
    applyCoupon(code);
};
