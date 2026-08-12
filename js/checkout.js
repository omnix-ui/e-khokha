// --- CHECKOUT PAGE LOGIC --- //

document.addEventListener('DOMContentLoaded', () => {
    renderCheckoutSummary();
});

function renderCheckoutSummary() {
    const checkoutItemsList = document.getElementById('checkout-items-list');
    let checkoutItems = [];
    
    // Check karo ki user Cart se aaya hai ya Product Page se
    const checkoutMode = localStorage.getItem('eKhokhaCheckoutMode');

    if (checkoutMode === 'route_product') {
        checkoutItems = JSON.parse(localStorage.getItem('eKhokhaCheckoutData')) || [];
    } 
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

    // Items ko live Master Database se Join karke Checkout par dikhana
    checkoutItems.forEach(item => {
        const productData = getProductById(item.product_id); // DB Call
        if (!productData) return; // Agar data missing hai toh ignore karo

        const currentName = productData.basic_info.name;
        const currentPrice = productData.pricing.current_price;
        const currentImage = productData.images[0] || 'https://placehold.co/100x100/1a1a1a/ffffff?text=No+Image';

        // UI ko Live DB se dikhana (Cart price par trust nahi)
        let unit_price = currentPrice;
        let itemTotal = unit_price * item.quantity;
        totalAmount += itemTotal;

        const itemDiv = document.createElement('div');
        itemDiv.className = 'checkout-item';
        
        itemDiv.innerHTML = `
            <div class="mini-image">
                <img src="${currentImage}" alt="${currentName}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 6px;">
            </div>

            <div class="mini-details">
                <div class="mini-title">${currentName}</div>
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

let isSubmitting = false; // 🔴 Flag for Double-Tap Protection

if (placeOrderBtn) {
    placeOrderBtn.addEventListener('click', () => {
        
        // --- 🔴 START: LOCK THE BUTTON ---
        if (isSubmitting) return; // Agar pehle se click ho chuka hai, toh ignore karo
        isSubmitting = true; // Flag on
        
        const originalText = placeOrderBtn.innerHTML; // Purana text yaad rakho
        placeOrderBtn.innerHTML = "Placing Order..."; // Visual loading state
        placeOrderBtn.style.opacity = "0.7";
        placeOrderBtn.style.pointerEvents = "none";
        
        // Helper function (agar validation fail ho, toh unlock karne ke liye)
        const unlockButton = () => {
            isSubmitting = false;
            placeOrderBtn.innerHTML = originalText;
            placeOrderBtn.style.opacity = "1";
            placeOrderBtn.style.pointerEvents = "auto";
        };
        // --- END: LOCK THE BUTTON ---

        // 1. Form Validation (Address check)
        const addressForm = document.getElementById('address-form');
        if (!addressForm.checkValidity()) {
            addressForm.reportValidity(); unlockButton();
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
                // --- 🔴 PATCH 1: STRICT VALIDATION ENGINE ---
        if (!checkoutItems || checkoutItems.length === 0) {
            alert("Security Alert: Your checkout list is empty! Order cannot be placed.");unlockButton();
            return; // Yahin rok do
        }

        let isDataValid = true;
        let validationError = "";

        checkoutItems.forEach(item => {
            const productData = getProductById(item.product_id);
            if (!productData) {
                isDataValid = false;
                validationError = `Error: Product ID (${item.product_id}) is invalid.`;
            } else if (!item.quantity || item.quantity <= 0 || isNaN(item.quantity)) {
                isDataValid = false;
                validationError = `Error: Invalid quantity detected.`;
            } else if (!item.size || item.size === '') {
                isDataValid = false;
                validationError = `Error: Missing size/variant.`;
            }
        });

        if (!isDataValid) {
            alert(validationError + "\nPlease check your order and try again.");unlockButton();
            return; // Order fail, temporary data safe rahega
        }
        // -------------------------------------------


        // Total calculation from Live DB Price
        let totalAmount = 0;
        checkoutItems.forEach(item => {
            const productData = getProductById(item.product_id);
            if (productData) {
                totalAmount += (productData.pricing.current_price * item.quantity);
            }
        });
                // --- 🔴 PATCH 5: TOTAL AMOUNT VALIDATION ---
        if (totalAmount <= 0 || isNaN(totalAmount)) {
            alert("Security Alert: Invalid total amount calculation.");
            unlockButton();
            return; 
        }
        const orderId = "EKHOKHA-" + Math.floor(100000 + Math.random() * 900000);

        // EXACT CALCULATION OF ESTIMATED DELIVERY
        const estDateObj = new Date();
        estDateObj.setDate(estDateObj.getDate() + 4); // Aaj se 4 din baad ki delivery
        const estimatedDeliveryString = estDateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

        const latestOrder = {
            orderId: orderId,
            
            // STRICT PRICE SNAPSHOT
            items: checkoutItems.map(item => {
                const productData = getProductById(item.product_id);
                const currentPrice = productData ? productData.pricing.current_price : 0;
                const originalPrice = productData ? productData.pricing.original_price : 0;
                
                return {
                    product_id: item.product_id, 
                    name: productData ? productData.basic_info.name : "Unknown Product",
                    image: productData && productData.images[0] ? productData.images[0] : "https://placehold.co/100x100/1a1a1a/ffffff?text=No+Image",
                    size: item.size,             
                    quantity: item.quantity, 
                    unit_price: currentPrice,          
                    original_price: originalPrice,     
                    item_total: currentPrice * item.quantity 
                };
            }),
            
            // 🔥 YAHAN THI GADBAD! Ye line ab properly add ho gayi hai.
            total: totalAmount,

            address: {
                name: document.getElementById('fullName').value,
                mobile: document.getElementById('mobile').value,
                house: document.getElementById('house').value,
                street: document.getElementById('street').value,
                city: document.getElementById('city').value,
                state: document.getElementById('state').value,
                pincode: document.getElementById('pincode').value
            },
            paymentMethod: "Cash on Delivery",
            date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            status: "Pending",
            estimatedDelivery: estimatedDeliveryString 
        };

        // A) Success Page Data
        localStorage.setItem('eKhokhaLatestOrder', JSON.stringify(latestOrder));

        // B) Order History (Orders Page) ke liye (🔴 PHASE 2: DUPLICATE LOCK)
        let userOrders = JSON.parse(localStorage.getItem('eKhokhaUserOrders')) || [];
        
        // Check karo ki kya ye orderId pehle se database mein hai?
        const isDuplicate = userOrders.some(order => order.orderId === latestOrder.orderId);
        
        if (!isDuplicate) {
            userOrders.push(latestOrder); // Sirf tabhi save karo jab duplicate na ho
            localStorage.setItem('eKhokhaUserOrders', JSON.stringify(userOrders));
        } else {
            console.warn("Duplicate order detected and blocked from History.");
        }

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
