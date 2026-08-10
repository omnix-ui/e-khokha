// Ye line file ke sabse top par honi chahiye
let cart = JSON.parse(localStorage.getItem('eKhokhaCart')) || [];

// --- CART PAGE LOGIC & INTERACTIVITY --- //

document.addEventListener('DOMContentLoaded', () => {
    // Page load hote hi cart render karo
    renderCart();
});

function renderCart() {
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
    
    // Purana HTML clear karo naya dalne se pehle
    cartItemsList.innerHTML = ''; 
    let totalAmount = 0;

    // 3. Har item ke liye ek card banao
    cart.forEach((item, index) => {
        let itemTotal = item.price * item.quantity;
        totalAmount += itemTotal;

        const itemDiv = document.createElement('div');
        itemDiv.className = 'cart-item';
        
        // HTML structure bilkul wahi hai jo tune CSS mein design kiya tha
        itemDiv.innerHTML = `
            <div class="cart-item-image">
                <span>${item.image}</span>
            </div>
            <div class="cart-item-info">
                <div class="item-title-row">
                    <div class="item-title">${item.name}</div>
                    <button class="item-delete-btn" onclick="removeItem(${index})">
                        <span class="material-symbols-outlined">delete</span>
                    </button>
                </div>
                <div class="item-size">Size: <b>${item.size}</b></div>
                <div class="item-price-row">
                    <div class="item-price">₹${item.price}</div>
                    <div class="item-qty-controls">
                        <button class="qty-btn-small" onclick="updateQty(${index}, -1)"><span class="material-symbols-outlined">remove</span></button>
                        <span class="qty-number-small">${item.quantity}</span>
                        <button class="qty-btn-small" onclick="updateQty(${index}, 1)"><span class="material-symbols-outlined">add</span></button>
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

// Delete button ka logic
window.removeItem = function(index) {
    cart.splice(index, 1); // Array se item hatao
    localStorage.setItem('eKhokhaCart', JSON.stringify(cart)); // Naya array save karo
    updateCartBadge(); // Upar badge ka number update karo (app.js se)
    renderCart(); // Screen refresh karo
};

// Quantity increase / decrease ka logic
window.updateQty = function(index, change) {
    // Agar quantity 1 hai aur user '-' dabata hai, toh item delete kardo
    if (change === -1 && cart[index].quantity === 1) {
        removeItem(index);
        return;
    }
    
    // Warna quantity badha ya ghata do
    cart[index].quantity += change;
    localStorage.setItem('eKhokhaCart', JSON.stringify(cart));
    updateCartBadge();
    renderCart();
};
// --- PROCEED TO CHECKOUT LOGIC (Route 2: Cart Page se) --- //
const proceedBtn = document.getElementById('proceed-btn'); 

if (proceedBtn) {
    proceedBtn.addEventListener('click', (e) => {
        // Ye line kisi bhi default action ko rok degi
        e.preventDefault(); 
        
        let currentCart = JSON.parse(localStorage.getItem('eKhokhaCart')) || [];
        
        if (currentCart.length === 0) {
            alert("Cart khali hai, pehle kuch add kijiye!");
            return;
        }

        // Traffic police ko batana ki hum Cart page se aa rahe hain
        localStorage.setItem('eKhokhaCheckoutMode', 'route_cart');
        
        // Checkout page par bhejna
        window.location.href = "checkout.html"; 
    });
}
