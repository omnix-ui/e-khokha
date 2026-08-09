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
    const addr = latestOrder.address;
    document.getElementById('success-address').innerText = `${addr.name}, ${addr.pincode}`;

    // Estimated Delivery Date logic (Aaj se 4 din baad)
    const today = new Date();
    today.setDate(today.getDate() + 4); 
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    document.getElementById('success-date').innerText = "By " + today.toLocaleDateString('en-IN', options);
});
