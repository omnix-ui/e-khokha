// --- 1️⃣ LOCAL STORAGE SE DATA LENA ---
let userOrders = JSON.parse(localStorage.getItem('eKhokhaUserOrders')) || [];

document.addEventListener('DOMContentLoaded', () => {
    setupOrderFilters();
    
    // Sort latest → oldest 
    const sortedOrders = [...userOrders].reverse();
    
    // Cards render function ko call karo
    renderOrderCards(sortedOrders);
});

// --- 2️⃣ ORDER FILTERS LOGIC (🔴 STRICT MATCHING APPLIED) ---
function setupOrderFilters() {
    const filterTabs = document.querySelectorAll('.filter-tab');
    
    filterTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            filterTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Ab toLowerCase nahi hoga, strictly exact string match hogi (e.g. "Out for Delivery")
            const selectedStatus = tab.getAttribute('data-status'); 
            
            let sortedBase = [...userOrders].reverse();
            let filteredOrders = [];
            
            if (selectedStatus === 'All') {
                filteredOrders = sortedBase;
            } else {
                filteredOrders = sortedBase.filter(order => order.status === selectedStatus);
            }
            renderOrderCards(filteredOrders);
        });
    });
}

// --- 🔴 PATCH 1: STRICT STATUS MAPPING FUNCTION ---
function getStatusClasses(status) {
    // Sirf allowed exact strings par hi background aur text colour assign hoga
    const s = (status || '').trim();
    switch (s) {
        case 'Pending': return { bg: 'status-pending', text: 'text-pending' };
        case 'Confirmed': return { bg: 'status-confirmed', text: 'text-confirmed' };
        case 'Shipped': return { bg: 'status-shipped', text: 'text-shipped' };
        case 'Out for Delivery': return { bg: 'status-out-for-delivery', text: 'text-out-for-delivery' };
        case 'Delivered': return { bg: 'status-delivered', text: 'text-delivered' };
        case 'Cancelled': return { bg: 'status-cancelled', text: 'text-cancelled' };
        // Agar DB se koi kachra aaya, toh default Pending mein daal do
        default: return { bg: 'status-pending', text: 'text-pending' }; 
    }
}

// --- 4️⃣ & 8️⃣ RENDER CARDS & EMPTY STATE LOGIC ---
function renderOrderCards(ordersArray) {
    const container = document.getElementById('order-list-container');
    const emptyState = document.getElementById('empty-state');
    
    if (ordersArray.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'flex';
        return; 
    }
    
    emptyState.style.display = 'none';
    container.style.display = 'flex';
    container.innerHTML = ''; 

    ordersArray.forEach(order => {
        if (!order.items || order.items.length === 0) return;

        const firstItem = order.items[0];
        let extraItemsHtml = '';
        if (order.items.length > 1) {
            extraItemsHtml = `<span class="more-items-badge">+${order.items.length - 1} more items</span>`;
        }

        // 🔴 UPDATE: Get both dot background and text colors
        const statusClasses = getStatusClasses(order.status);

        const displayName = firstItem.name || `Product (${firstItem.product_id || 'Unknown'})`;
        const displayImage = firstItem.image || 'https://placehold.co/150x150/1a1a1a/ffffff?text=No+Image'; 
        const displayTotal = order.total ? order.total : 0; 
        const displaySize = firstItem.size || 'N/A';
        const displayQty = firstItem.quantity || 1;

        const cardHtml = `
            <div class="order-card">
                <div class="order-card-header">
                    <span class="order-id">#${order.orderId}</span>
                    <span class="order-date">${order.date}</span>
                </div>
                <div class="order-card-body">
                    <div class="order-image">
                        <img src="${displayImage}" alt="${displayName}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">
                    </div>
                    <div class="order-details">
                        <div class="order-product-name">${displayName} ${extraItemsHtml}</div>
                        <div class="order-product-meta">Size: ${displaySize} &nbsp;|&nbsp; Qty: ${displayQty}</div>
                        <div class="order-price-payment">
                            <span class="order-price">₹${displayTotal}</span>
                            <span class="order-payment">${order.paymentMethod}</span>
                        </div>
                    </div>
                </div>
                <div class="order-card-footer">
                    <!-- 🔴 UPDATE: Status Dot aur Text dono par color apply hua -->
                    <div class="order-status ${statusClasses.text}">
                        <span class="status-dot ${statusClasses.bg}"></span> ${order.status}
                    </div>
                    <button class="view-details-btn" onclick="openOrderModal('${order.orderId}')">
                        View Details
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
    
    // 🔴 UPDATE: Modal mein bhi strict status colour apply karo
    const statusEl = document.getElementById('modal-order-status');
    statusEl.innerText = order.status;
    const statusClasses = getStatusClasses(order.status);
    statusEl.className = statusClasses.text; // Text class add kardi
    statusEl.style.color = ''; // Purana inline hardcoded color hata diya

    document.getElementById('modal-est-delivery').innerText = order.estimatedDelivery ? order.estimatedDelivery : "N/A";

    document.getElementById('modal-payment-method').innerText = order.paymentMethod;
    
    const displayTotal = order.total ? order.total : 0;
    document.getElementById('modal-total-amount').innerText = '₹' + displayTotal;

    const address = order.address || {};
    document.getElementById('modal-address').innerHTML = `
        <strong>${address.name || 'N/A'}</strong><br>
        ${address.house || ''}, ${address.street || ''}<br>
        ${address.city || ''}, ${address.state || ''} - ${address.pincode || ''}<br>
        Mobile: ${address.mobile || 'N/A'}
    `;

    const productsList = document.getElementById('modal-products-list');
    productsList.innerHTML = '';
    
    order.items.forEach(item => {
        const itemName = item.name || `Product (${item.product_id || 'Unknown'})`;
        const itemImage = item.image || 'https://placehold.co/100x100/1a1a1a/ffffff?text=No+Image';
        
        const unitPrice = item.unit_price !== undefined ? item.unit_price : (item.price || 0); 
        const itemQty = item.quantity || 1;
        const itemSize = item.size || 'N/A';
        const itemTotal = item.item_total !== undefined ? item.item_total : (unitPrice * itemQty);

        productsList.innerHTML += `
            <div class="modal-product-item">
                <div style="display: flex; gap: 12px; align-items: center;">
                    <img src="${itemImage}" alt="${itemName}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px;">
                    <div class="modal-product-info">
                        <span class="modal-product-name">${itemName}</span>
                        <span class="modal-product-meta">Size: ${itemSize} | Qty: ${itemQty}</span>
                    </div>
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
    event.preventDefault(); 
    if (window.history.length > 1 && document.referrer !== "") {
        window.history.back(); 
    } else {
        window.location.href = "../index.html"; 
    }
};
