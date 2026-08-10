// --- 1️⃣ LOCAL STORAGE SE DATA LENA ---
// LocalStorage se 'eKhokhaUserOrders' uthao, agar nahi hai toh khali array []
let userOrders = JSON.parse(localStorage.getItem('eKhokhaUserOrders')) || [];

document.addEventListener('DOMContentLoaded', () => {
    setupOrderFilters();
    
    // Sort latest → oldest (Array ko reverse kar diya taaki naya upar aaye)
    const sortedOrders = [...userOrders].reverse();
    
    // Cards render function ko call karo
    renderOrderCards(sortedOrders);
});

// --- 2️⃣ ORDER FILTERS LOGIC ---
function setupOrderFilters() {
    const filterTabs = document.querySelectorAll('.filter-tab');
    
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const selectedStatus = tab.getAttribute('data-status').toLowerCase(); 
            
            // Filter karne se pehle bhi latest->oldest sort apply karenge
            let sortedBase = [...userOrders].reverse();
            let filteredOrders = [];
            
            if (selectedStatus === 'all') {
                filteredOrders = sortedBase;
            } else {
                filteredOrders = sortedBase.filter(order => {
                    return order.status.toLowerCase() === selectedStatus;
                });
            }
            renderOrderCards(filteredOrders);
        });
    });
}

function getStatusColor(status) {
    const s = status.toLowerCase();
    if (s.includes('pending')) return 'status-pending';
    if (s.includes('shipped')) return 'status-shipped';
    if (s.includes('delivered')) return 'status-delivered';
    if (s.includes('cancelled')) return 'status-cancelled';
    return 'status-pending'; 
}

// --- 4️⃣ & 8️⃣ RENDER CARDS & EMPTY STATE LOGIC ---
function renderOrderCards(ordersArray) {
    const container = document.getElementById('order-list-container');
    const emptyState = document.getElementById('empty-state');
    
    // Agar orders nahi hain -> Empty state dikhao
    if (ordersArray.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'flex';
        return; 
    }
    
    // Agar orders hain -> Cards render karo
    emptyState.style.display = 'none';
    container.style.display = 'flex';
    container.innerHTML = ''; 

    ordersArray.forEach(order => {
        const firstItem = order.items[0];
        let extraItemsHtml = '';
        if (order.items.length > 1) {
            extraItemsHtml = `<span class="more-items-badge">+${order.items.length - 1} more items</span>`;
        }

        const colorClass = getStatusColor(order.status);

        const cardHtml = `
            <div class="order-card">
                <div class="order-card-header">
                    <span class="order-id">#${order.orderId}</span>
                    <span class="order-date">${order.date}</span>
                </div>
                <div class="order-card-body">
                    <div class="order-image">${firstItem.image}</div>
                    <div class="order-details">
                        <div class="order-product-name">${firstItem.name} ${extraItemsHtml}</div>
                        <div class="order-product-meta">Size: ${firstItem.size} &nbsp;|&nbsp; Qty: ${firstItem.quantity}</div>
                        <div class="order-price-payment">
                            <span class="order-price">₹${order.total}</span>
                            <span class="order-payment">${order.paymentMethod}</span>
                        </div>
                    </div>
                </div>
                <div class="order-card-footer">
                    <div class="order-status">
                        <span class="status-dot ${colorClass}"></span> ${order.status}
                    </div>
                    <button class="view-details-btn" onclick="openOrderModal('${order.orderId}')">
                        View Details <span class="material-symbols-outlined">arrow_forward</span>
                    </button>
                </div>
            </div>
        `;
        container.innerHTML += cardHtml;
    });
}

// --- 7️⃣ VIEW DETAILS MODAL ---
window.openOrderModal = function(orderId) {
    const order = userOrders.find(o => o.orderId === orderId);
    if (!order) return;

    document.getElementById('modal-order-id').innerText = '#' + order.orderId;
    document.getElementById('modal-order-date').innerText = order.date;
    
    const statusEl = document.getElementById('modal-order-status');
    statusEl.innerText = order.status;
    statusEl.style.color = (order.status.toLowerCase().includes('delivered')) ? '#1dd1a1' : '#ff9f43';

    document.getElementById('modal-est-delivery').innerText = order.estimatedDelivery || "3-5 Business Days";
    document.getElementById('modal-payment-method').innerText = order.paymentMethod;
    document.getElementById('modal-total-amount').innerText = '₹' + order.total;

    // Checkout form ke variables se directly map
    document.getElementById('modal-address').innerHTML = `
        <strong>${order.address.name}</strong><br>
        Pincode: ${order.address.pincode}<br>
        Mobile: ${order.address.mobile}
    `;
    const productsList = document.getElementById('modal-products-list');
    productsList.innerHTML = '';
    order.items.forEach(item => {
        let itemTotal = item.price * item.quantity;
        productsList.innerHTML += `
            <div class="modal-product-item">
                <div class="modal-product-info">
                    <span class="modal-product-name">${item.image} ${item.name}</span>
                    <span class="modal-product-meta">Size: ${item.size} | Qty: ${item.quantity}</span>
                </div>
                <span class="modal-product-price">₹${itemTotal}</span>
            </div>
        `;
    });

    document.getElementById('order-modal').classList.add('active');
}

window.closeOrderModal = function() {
    document.getElementById('order-modal').classList.remove('active');
}
// --- BACK BUTTON LOGIC ---
window.handleBackButton = function(event) {
    event.preventDefault(); // Default click ko roko
    
    // Check if history is available
    if (window.history.length > 1 && document.referrer !== "") {
        window.history.back(); // go back
    } else {
        window.location.href = "../index.html"; // go Home
    }
};
