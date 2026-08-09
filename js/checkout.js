// --- CHECKOUT PAGE LOGIC --- //

document.addEventListener('DOMContentLoaded', () => {
    renderCheckoutSummary();
});

function renderCheckoutSummary() {
    const checkoutItemsList = document.getElementById('checkout-items-list');
    let checkoutItems = [];
    
    // Check karo ki user Cart se aaya hai ya Buy Now se
    const checkoutMode = localStorage.getItem('eKhokhaCheckoutMode');

    if (checkoutMode === 'buynow') {
        // Buy Now wala single item uthao
        checkoutItems = JSON.parse(localStorage.getItem('eKhokhaCheckoutData')) || [];
    } else {
        // Normal Cart wale items uthao
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
        
        // 1. Form Validation (Check karna ki address poora bhara hai ya nahi)
        const addressForm = document.getElementById('address-form');
        if (!addressForm.checkValidity()) {
            addressForm.reportValidity(); // HTML5 ka default error popup dikhayega
            return;
        }

        // 2. Order Data Prepare karna 
        let checkoutItems = [];
        const checkoutMode = localStorage.getItem('eKhokhaCheckoutMode');

        // Yahan par hum check kar rahe hain ki data kahan se uthana hai
        if (checkoutMode === 'buynow') {
            checkoutItems = JSON.parse(localStorage.getItem('eKhokhaCheckoutData')) || [];
        } else {
            checkoutItems = JSON.parse(localStorage.getItem('eKhokhaCart')) || [];
        }

        // Total calculate karo based on actual checkout items
        let totalAmount = checkoutItems.reduce((total, item) => total + (item.price * item.quantity), 0);
        
        // Ek random 6 digit Order ID generate karna
        const orderId = "EKHOKHA-" + Math.floor(100000 + Math.random() * 900000);

        const latestOrder = {
            orderId: orderId,
            items: checkoutItems, // Yahan sahi data jayega
            total: totalAmount,
            address: {
                name: document.getElementById('fullName').value,
                mobile: document.getElementById('mobile').value,
                pincode: document.getElementById('pincode').value
            },
            paymentMethod: "Cash on Delivery",
            date: new Date().toLocaleDateString()
        };

        // Order ki details localStorage mein save karna taaki Success Page par dikha sakein
        localStorage.setItem('eKhokhaLatestOrder', JSON.stringify(latestOrder));

        // 3. Cart aur Temporary data ko clean karna
        if (checkoutMode === 'cart') {
            // Agar normal cart se checkout tha, tabhi cart khali karo
            localStorage.setItem('eKhokhaCart', JSON.stringify([]));
        }
        
        // Buy Now wala temporary data clear kardo (chahe mode koi bhi ho)
        localStorage.removeItem('eKhokhaCheckoutData');
        localStorage.removeItem('eKhokhaCheckoutMode');

        // 4. Order Success Page par bhejna
        window.location.href = "success.html"; 
    });
}
