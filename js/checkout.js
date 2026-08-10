// --- CHECKOUT PAGE LOGIC --- //

document.addEventListener('DOMContentLoaded', () => {
    renderCheckoutSummary();
});

function renderCheckoutSummary() {
    const checkoutItemsList = document.getElementById('checkout-items-list');
    let checkoutItems = [];
    
    // Check karo ki user Cart se aaya hai ya Product Page se
    const checkoutMode = localStorage.getItem('eKhokhaCheckoutMode');

    // 🔴 UPDATE: 'buynow' ki jagah 'route_product'
    if (checkoutMode === 'route_product') {
        checkoutItems = JSON.parse(localStorage.getItem('eKhokhaCheckoutData')) || [];
    } 
    // 🔴 UPDATE: explicitly 'route_cart' check kar rahe hain
    else if (checkoutMode === 'route_cart') {
        checkoutItems = JSON.parse(localStorage.getItem('eKhokhaCart')) || [];
    }

    // Agar empty hai toh Home par bhej do
    if (checkoutItems.length === 0) {
        alert("No items to checkout! Redirecting to Home...");
        window.location.href = "../index.html";
        return;
    }

    checkoutItemsList.innerHTML = '';
    let totalAmount = 0;

    // Items ko Checkout page par show karna
    checkoutItems.forEach(item => {
        let itemTotal = item.price * item.quantity;
        totalAmount += itemTotal;

        const itemDiv = document.createElement('div');
        itemDiv.className = 'checkout-item';
        
        itemDiv.innerHTML = `
            <div class="mini-image">
                <span>${item.image}</span>
            </div>
            <div class="mini-details">
                <div class="mini-title">${item.name}</div>
                <div class="mini-qty-price">
                    <span>Qty: ${item.quantity} | Size: ${item.size}</span>
                    <span class="mini-price">₹${itemTotal}</span>
                </div>
            </div>
        `;
        checkoutItemsList.appendChild(itemDiv);
    });

    // Bill Details update karna
    document.getElementById('checkout-item-total').innerText = '₹' + totalAmount;
    document.getElementById('checkout-grand-total').innerText = '₹' + totalAmount;
    document.getElementById('footer-pay-amount').innerText = '₹' + totalAmount;
}

// --- PLACE ORDER LOGIC --- //
const placeOrderBtn = document.getElementById('place-order-btn');

if (placeOrderBtn) {
    placeOrderBtn.addEventListener('click', () => {
        
        // 1. Form Validation
        const addressForm = document.getElementById('address-form');
        if (!addressForm.checkValidity()) {
            addressForm.reportValidity(); 
            return;
        }

        // 2. Order Data Prepare karna 
        let checkoutItems = [];
        const checkoutMode = localStorage.getItem('eKhokhaCheckoutMode');

        if (checkoutMode === 'route_product') {
            checkoutItems = JSON.parse(localStorage.getItem('eKhokhaCheckoutData')) || [];
        } else if (checkoutMode === 'route_cart') {
            checkoutItems = JSON.parse(localStorage.getItem('eKhokhaCart')) || [];
        }

        let totalAmount = checkoutItems.reduce((total, item) => total + (item.price * item.quantity), 0);
        
        const orderId = "EKHOKHA-" + Math.floor(100000 + Math.random() * 900000);

        // 🔴 EXACT ORIGINAL ADDRESS VARIABLES
        const latestOrder = {
            orderId: orderId,
            items: checkoutItems, 
            total: totalAmount,
            address: {
                name: document.getElementById('fullName').value,
                mobile: document.getElementById('mobile').value,
                pincode: document.getElementById('pincode').value
            },
            paymentMethod: "Cash on Delivery",
            date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            status: "Pending" // Bas ye naya hai Order page ke liye
        };

        // A) Success Page Data
        localStorage.setItem('eKhokhaLatestOrder', JSON.stringify(latestOrder));

        // B) Order History (Orders Page) ke liye
        let userOrders = JSON.parse(localStorage.getItem('eKhokhaUserOrders')) || [];
        userOrders.push(latestOrder);
        localStorage.setItem('eKhokhaUserOrders', JSON.stringify(userOrders));

        // 3. Cart aur Temporary data ko clean karna
        if (checkoutMode === 'route_cart') {
            localStorage.setItem('eKhokhaCart', JSON.stringify([]));
        }
        
        localStorage.removeItem('eKhokhaCheckoutData');
        localStorage.removeItem('eKhokhaCheckoutMode');

        // 4. Order Success Page par bhejna
        window.location.href = "success.html"; 
    });
}
