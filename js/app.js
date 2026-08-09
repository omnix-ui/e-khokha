// --- E-KHOKHA GLOBAL JAVASCRIPT --- //

// 1. LocalStorage se Cart Data Load karna (Agar nahi hai toh khali array [])
let cart = JSON.parse(localStorage.getItem('eKhokhaCart')) || [];

// 2. Cart Badge Update karne ka Function
function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    if (badge) {
        // Cart mein total kitni quantity hai wo count karna
        let totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        badge.innerText = totalItems;
        
        // Agar cart khali hai toh badge chupa do (Display none)
        badge.style.display = totalItems > 0 ? 'flex' : 'none';
    }
}

// 3. Page load hote hi badge set karna
document.addEventListener('DOMContentLoaded', () => {
    updateCartBadge();
});

// 4. "Add to Cart" Button ka Logic (Product Details Page)
const addToCartBtn = document.getElementById('add-to-cart-btn');

if (addToCartBtn) {
    addToCartBtn.addEventListener('click', () => {
        
        // HTML (DOM) se product ki details nikalna
        const title = document.querySelector('.product-title').innerText;
        const priceText = document.querySelector('.current-price').innerText;
        const price = parseInt(priceText.replace('₹', '').replace(',', '')); // ₹399 ko 399 number banayega
        
        const activeSizeBtn = document.querySelector('.size-btn.active');
        const size = activeSizeBtn ? activeSizeBtn.innerText : 'Free Size';
        
        const qtyText = document.querySelector('.qty-number').innerText;
        const quantity = parseInt(qtyText);

        // Dummy Product ID (Backend aane tak manual ID rakh rahe hain)
        const productId = "PROD-101"; 

        // Check karna ki ye item (same ID aur Size) pehle se cart mein hai kya?
        const existingItemIndex = cart.findIndex(item => item.id === productId && item.size === size);

        if (existingItemIndex > -1) {
            // Agar pehle se hai toh naya add mat karo, sirf Quantity badha do
            cart[existingItemIndex].quantity += quantity;
        } else {
            // Agar naya item hai toh Cart array mein push kardo
            cart.push({
                id: productId,
                name: title,
                price: price,
                size: size,
                quantity: quantity,
                image: "IMG" // Dummy image
            });
        }

        // Cart ko LocalStorage mein save karna (Taaki refresh pe delete na ho)
        localStorage.setItem('eKhokhaCart', JSON.stringify(cart));
        
        // Badge ka number turant update karna
        updateCartBadge();

        // Customer ko feedback dena
        alert("🛒 Item added to Cart successfully!");
    });
}
// --- 1️⃣ HOME TO PRODUCT FLOW --- //

// Function: Home page par product card par click karne ke liye
window.openProduct = function(name, currentPrice, originalPrice) {
    // 1. Product ka data ek object mein pack karna
    const productData = {
        name: name,
        currentPrice: currentPrice,
        originalPrice: originalPrice
    };
    
    // 2. Data ko LocalStorage (Temporary DB) mein save karna
    localStorage.setItem('eKhokhaActiveProduct', JSON.stringify(productData));
    
    // 3. User ko Product Details page par bhej dena
    window.location.href = "pages/product.html";
};

// Function: Jab Product page load ho, tab data show karna
document.addEventListener('DOMContentLoaded', () => {
    // Check karna ki kya hum product.html par hain
    if (window.location.pathname.includes('product.html')) {
        const activeProduct = JSON.parse(localStorage.getItem('eKhokhaActiveProduct'));
        
        if (activeProduct) {
            // HTML elements ko naye data se update karna
            document.querySelector('.product-title').innerText = activeProduct.name;
            document.querySelector('.current-price').innerText = '₹' + activeProduct.currentPrice;
            
            // Original price ko bhi update karna
            const originalPriceEl = document.querySelector('.original-price');
            if (originalPriceEl) {
                originalPriceEl.innerText = '₹' + activeProduct.originalPrice;
            }
        }
    }
});
// --- PRODUCT PAGE LOGIC (Load Data, Size, Qty, Buy Now) --- //

document.addEventListener('DOMContentLoaded', () => {
    
    // NAYA TARIQA: URL check karne ki jagah page ke andar ka element check karo
    const isProductPage = document.querySelector('.product-title'); 

    if (isProductPage) { // Agar product title mojood hai, toh ye product page hai
        
        // 1. DATA LOAD KARNA (Home se jo tap kiya tha)
        const activeProduct = JSON.parse(localStorage.getItem('eKhokhaActiveProduct'));
        if (activeProduct) {
            document.querySelector('.product-title').innerText = activeProduct.name;
            document.querySelector('.current-price').innerText = '₹' + activeProduct.currentPrice;
            const originalPriceEl = document.querySelector('.original-price');
            if (originalPriceEl) {
                originalPriceEl.innerText = '₹' + activeProduct.originalPrice;
            }
        }

        // 2. SIZE SELECTION LOGIC
        const sizeBtns = document.querySelectorAll('.size-list .size-btn:not(.disabled)');
        sizeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                sizeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // 3. QUANTITY (+ / -) LOGIC
        const qtyMinusBtn = document.querySelector('.qty-controls .qty-btn:first-child');
        const qtyPlusBtn = document.querySelector('.qty-controls .qty-btn:last-child');
        const qtyNumber = document.querySelector('.qty-controls .qty-number');

        if (qtyMinusBtn && qtyPlusBtn && qtyNumber) {
            qtyMinusBtn.addEventListener('click', () => {
                let qty = parseInt(qtyNumber.innerText);
                if (qty > 1) qtyNumber.innerText = qty - 1;
            });
            qtyPlusBtn.addEventListener('click', () => {
                let qty = parseInt(qtyNumber.innerText);
                if (qty < 10) qtyNumber.innerText = qty + 1;
            });
        }

        // 4. BUY NOW LOGIC
        const buyNowBtn = document.querySelector('.btn-buy-now');
        if (buyNowBtn) {
            buyNowBtn.addEventListener('click', (e) => {
                e.preventDefault(); 
                
                const name = document.querySelector('.product-title').innerText;
                const priceText = document.querySelector('.current-price').innerText;
                const price = parseInt(priceText.replace(/[^0-9]/g, ''));
                
                const activeSizeBtn = document.querySelector('.size-list .size-btn.active');
                const size = activeSizeBtn ? activeSizeBtn.innerText : 'Free Size';
                
                const quantity = parseInt(document.querySelector('.qty-controls .qty-number').innerText);

                const buyNowItem = [{
                    id: "PROD-DIRECT",
                    name: name,
                    price: price,
                    size: size,
                    quantity: quantity,
                    image: "IMG"
                }];

                localStorage.setItem('eKhokhaCheckoutData', JSON.stringify(buyNowItem));
                localStorage.setItem('eKhokhaCheckoutMode', 'buynow');
                
                window.location.href = "checkout.html";
            });
        }
    }
});
