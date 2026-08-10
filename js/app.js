// --- E-KHOKHA GLOBAL JAVASCRIPT --- //

// Global functions jo har page par chahiye
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
    
    // --- PRODUCT PAGE LOGIC --- //
    const isProductPage = document.querySelector('.product-title'); 
    if (isProductPage) {
        // Data Load
        const activeProduct = JSON.parse(localStorage.getItem('eKhokhaActiveProduct'));
        if (activeProduct) {
            document.querySelector('.product-title').innerText = activeProduct.name;
            document.querySelector('.current-price').innerText = '₹' + activeProduct.currentPrice;
            const origPrice = document.querySelector('.original-price');
            if (origPrice) origPrice.innerText = '₹' + activeProduct.originalPrice;
        }

        // Size Selection
        const sizeBtns = document.querySelectorAll('.size-list .size-btn');
        sizeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                sizeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Quantity Logic
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

        // --- ADD TO CART LOGIC (Smart Merge) --- //
        const addToCartBtn = document.getElementById('add-to-cart-btn');
        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', () => {
                const name = document.querySelector('.product-title').innerText;
                const price = parseInt(document.querySelector('.current-price').innerText.replace(/[^0-9]/g, ''));
                const size = document.querySelector('.size-btn.active')?.innerText || 'Free Size';
                const quantity = parseInt(document.querySelector('.qty-number').innerText);
                
                const uniqueId = name.replace(/\s+/g, '-') + '-' + size;
                let cart = JSON.parse(localStorage.getItem('eKhokhaCart')) || [];
                
                const existingIndex = cart.findIndex(item => item.id === uniqueId);
                if (existingIndex > -1) {
                    cart[existingIndex].quantity += quantity;
                } else {
                    cart.push({ id: uniqueId, name, price, size, quantity, image: "IMG" });
                }
                localStorage.setItem('eKhokhaCart', JSON.stringify(cart));
                updateCartBadge();
                alert("Added to Cart!"); // Yahan hum baad mein Toast dalenge
            });
        }

        // --- BUY NOW LOGIC --- //
        const buyNowBtn = document.querySelector('.btn-buy-now');
        if (buyNowBtn) {
            buyNowBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const name = document.querySelector('.product-title').innerText;
                const price = parseInt(document.querySelector('.current-price').innerText.replace(/[^0-9]/g, ''));
                const size = document.querySelector('.size-btn.active')?.innerText || 'Free Size';
                const quantity = parseInt(document.querySelector('.qty-number').innerText);

                const buyNowItem = [{ id: "PROD-DIRECT", name, price, size, quantity, image: "IMG" }];
                localStorage.setItem('eKhokhaCheckoutData', JSON.stringify(buyNowItem));
                localStorage.setItem('eKhokhaCheckoutMode', 'route_product');
                window.location.href = "checkout.html";
            });
        }
    }
});

// --- HOME PAGE REDIRECTION --- //
window.openProduct = function(name, currentPrice, originalPrice) {
    localStorage.setItem('eKhokhaActiveProduct', JSON.stringify({ name, currentPrice, originalPrice }));
    window.location.href = "pages/product.html";
};
