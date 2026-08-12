// --- SUCCESS PAGE LOGIC --- //

document.addEventListener('DOMContentLoaded', () => {
    // Checkout page se save kiya hua order data fetch karna
    const latestOrder = JSON.parse(localStorage.getItem('eKhokhaLatestOrder'));

    // Agar by chance koi direct is URL par aa jaye bina order kiye, toh Home bhej do
    if (!latestOrder) {
        window.location.href = "../index.html";
        return;
    }

    // HTML elements mein order ki real details update karna
    document.getElementById('success-order-id').innerText = latestOrder.orderId;
    document.getElementById('success-amount').innerText = '₹' + latestOrder.total;
    
    // Address format
    const completeAddressHTML = `
        <strong>${latestOrder.address.name}</strong><br>
        ${latestOrder.address.house}, ${latestOrder.address.street}<br>
        ${latestOrder.address.city}, ${latestOrder.address.state} - ${latestOrder.address.pincode}<br>
        Mobile: ${latestOrder.address.mobile}
    `;
    
    document.getElementById('success-address').innerHTML = completeAddressHTML;

    // 🔴 PHASE 2 FIX: Ab calculate nahi karna, seedha order object se read karna hai
    const deliveryDate = latestOrder.estimatedDelivery ? latestOrder.estimatedDelivery : "Processing...";
    document.getElementById('success-date').innerText = "By " + deliveryDate;
});
