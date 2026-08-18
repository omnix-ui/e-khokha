// ==========================================
// ✅ E-KHOKHA SUCCESS PAGE
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    const latestOrder = JSON.parse(localStorage.getItem('eKhokhaLatestOrder'));

    if (!latestOrder) {
        window.location.href = "../index.html";
        return;
    }

    const address = latestOrder.address || {};
    const items = Array.isArray(latestOrder.items) ? latestOrder.items : [];

    const setText = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value ?? "—";
    };

    const money = value => '₹' + Math.round(Number(value) || 0);

    // ==========================================
    // ORDER INFORMATION
    // ==========================================

    setText('success-order-id', latestOrder.orderId);
    setText('success-order-date', latestOrder.date || "—");
    setText('success-payment', latestOrder.paymentMethod || "Cash on Delivery");
    setText('success-amount', money(latestOrder.total));

    // ==========================================
    // DELIVERY INFORMATION
    // ==========================================

    setText('success-name', address.name || "—");
    setText('success-mobile', address.mobile || "—");

    const addressParts = [
        address.house,
        address.street,
        address.city,
        address.state ? `${address.state} - ${address.pincode || ''}` : address.pincode
    ].filter(Boolean);

    setText('success-address', addressParts.join(', '));

    setText(
        'success-date',
        latestOrder.estimatedDelivery
            ? "By " + latestOrder.estimatedDelivery
            : "Processing..."
    );

    // ==========================================
    // ORDERED PRODUCTS
    // ==========================================

    const itemsContainer = document.getElementById('success-items');

    items.forEach(item => {
        const quantity = Number(item.quantity) || 0;
        const unitPrice = Number(item.unit_price) || 0;
        const originalPrice = Number(item.original_price) || unitPrice;
        const itemTotal = Number(item.item_total) || unitPrice * quantity;

        const itemBox = document.createElement('div');
        itemBox.className = 'success-product';

        const image = document.createElement('img');
        image.className = 'product-image';
        image.src = item.image || 'https://placehold.co/100x100/eeeeee/333333?text=Product';
        image.alt = item.name || 'Product';
        image.onerror = () => {
            image.src = 'https://placehold.co/100x100/eeeeee/333333?text=Product';
        };

        const info = document.createElement('div');
        info.className = 'product-info';

        const name = document.createElement('h4');
        name.textContent = item.name || 'Product';

        const variant = document.createElement('p');
        const variantType = item.variant_type === 'color' ? 'Color' : 'Size';

        variant.textContent = item.variant_value
            ? `${variantType}: ${item.variant_value} • Qty: ${quantity}`
            : `Qty: ${quantity}`;

        const priceBox = document.createElement('div');
        priceBox.className = 'product-price';

        const currentPrice = document.createElement('strong');
        currentPrice.textContent = money(unitPrice);

        priceBox.appendChild(currentPrice);

        if (originalPrice > unitPrice) {
            const oldPrice = document.createElement('del');
            oldPrice.textContent = money(originalPrice);

            const discount = document.createElement('span');
            discount.className = 'discount-badge';

            const discountPercentage = item.discount_percentage ||
                Math.round(((originalPrice - unitPrice) / originalPrice) * 100);

            discount.textContent = `${discountPercentage}% OFF`;

            priceBox.append(oldPrice, discount);
        }

        const total = document.createElement('small');
        total.className = 'item-total';
        total.textContent = `${money(itemTotal)} total`;

        info.append(name, variant, priceBox, total);
        itemBox.append(image, info);
        itemsContainer.appendChild(itemBox);
    });

    // ==========================================
    // PRICE DETAILS
    // ==========================================

    const subtotal = Number(latestOrder.item_total) || 0;
    const couponDiscount = Number(latestOrder.discount_amount) || 0;

    setText('success-subtotal', money(subtotal));

    // ==========================================
    // COUPON
    // ==========================================

    const couponRow = document.getElementById('success-coupon-row');

    if (latestOrder.coupon_applied && couponDiscount > 0) {
        setText(
            'success-coupon-label',
            `Coupon (${latestOrder.coupon_applied})`
        );

        setText(
            'success-coupon',
            '-' + money(couponDiscount)
        );
    } else {
        couponRow?.remove();
    }
});