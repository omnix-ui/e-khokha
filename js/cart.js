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
        emptyCartState.style.display = 'flex';
        cartContainer.style.display = 'none';
        return;
    }

    // 2. Agar cart mein items hain
    emptyCartState.style.display = 'none';
    cartContainer.style.display = 'block';
    
    cartItemsList.innerHTML = ''; 
    let totalAmount = 0;

    // 3. Har item ke liye ek card banao
    cart.forEach((item) => {
        
        // 🔴 PHASE 4 UPGRADE: Database Join Logic
        // Cart array mein ab sirf {product_id, size, quantity} hai. Baaki DB se aayega!
        const productData = getProductById(item.product_id); // app.js se function call kiya
        
        // Agar by chance DB mein product nahi mila (corrupted data), toh skip kar do
        if (!productData) return; 

        // Master DB se live data uthao
        const currentName = productData.basic_info.name;
        const currentPrice = productData.pricing.current_price;
        const currentImage = productData.images[0] || 'IMG';

        // Total live price se calculate hoga
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
        cartItemsList.appendChild(itemDiv);
    });

    // 4. Bill Details Update karo
    document.getElementById('item-total').innerText = '₹' + totalAmount;
    document.getElementById('grand-total').innerText = '₹' + totalAmount;
    document.getElementById('footer-total').innerText = '₹' + totalAmount;
}

// --- BUTTONS LOGIC (+ / - / DELETE) --- //

window.removeItem = function(productId, size) {
    let cart = JSON.parse(localStorage.getItem('eKhokhaCart')) || [];
    
    // Smart Delete
    cart = cart.filter(item => !(item.product_id === productId && item.size === size));
    
    localStorage.setItem('eKhokhaCart', JSON.stringify(cart)); 
    updateCartBadge(); 
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
        updateCartBadge();
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
