// ==========================================
// 🔍 E-KHOKHA SEARCH ENGINE (PHASE 3 - SECURE)
// ==========================================

document.addEventListener('DOMContentLoaded', async () => {
    await window.eKhokhaDataReady;
    const searchInput = document.getElementById('search-input');
    const clearBtn = document.getElementById('clear-btn');
    const stateInitial = document.getElementById('state-initial');
    const stateNoResults = document.getElementById('state-no-results');
    const resultsGrid = document.getElementById('search-results-grid');
    const searchSummary = document.getElementById('search-summary');
    const resultCount = document.getElementById('result-count');


    // --- 1. CORE SEARCH LOGIC & URL HANDLING ---
    function performSearch(query) {
        const searchTerm = query.trim().toLowerCase();

        // 🔴 PHASE 3: STRICT URL HANDLING
        const url = new URL(window.location);
        if (searchTerm) {
            url.searchParams.set('q', searchTerm);
            window.history.replaceState(null, '', url);
        } else {
            url.searchParams.delete('q');
            window.history.replaceState(null, '', url);
        }

        // Empty State Check
        if (searchTerm === '') {
            clearBtn.style.display = 'none';
            stateInitial.style.display = 'flex';
            stateNoResults.style.display = 'none';
            resultsGrid.style.display = 'none';
            searchSummary.style.display = 'none';
            return;
        }

        clearBtn.style.display = 'flex';

        // Filtering Logic
        const filteredProducts = eKhokhaProducts.filter(product => {
            const pName = (product.basic_info && product.basic_info.name) ? product.basic_info.name.toLowerCase() : '';
            const pCat = (product.basic_info && product.basic_info.category) ? product.basic_info.category.toLowerCase() : '';
            return pName.includes(searchTerm) || pCat.includes(searchTerm); 
        });

        // State Toggles
        if (filteredProducts.length === 0) {
            stateInitial.style.display = 'none';
            stateNoResults.style.display = 'flex';
            resultsGrid.style.display = 'none';
            searchSummary.style.display = 'none';
        } else {
            stateInitial.style.display = 'none';
            stateNoResults.style.display = 'none';
            renderSearchResults(filteredProducts);
        }
    }

    // --- 2. 🔴 PHASE 3: SECURE DOM RENDERING & ID INTEGRITY ---
    function renderSearchResults(products) {
        const countText = products.length === 1 ? '1 product found' : `${products.length} products found`;
        resultCount.innerText = countText;
        searchSummary.style.display = 'block';

        // Safe to use for emptying a container
        resultsGrid.innerHTML = '';
        
        products.forEach(product => {
            // Data Extraction
            const imageSrc = (product.images && product.images.length > 0) ? product.images[0] : 'https://placehold.co/300x300/1a1a1a/ffffff?text=No+Image';
            const nameText = (product.basic_info && product.basic_info.name) ? product.basic_info.name : 'Unknown Product';
            const currentPriceVal = (product.pricing && product.pricing.current_price) ? product.pricing.current_price : 0;
            const originalPriceVal = (product.pricing && product.pricing.original_price) ? product.pricing.original_price : '';
            const discountVal = (product.pricing && product.pricing.discount) ? product.pricing.discount : '';
            const productId = product.product_id;
            const ratingScore = (product.rating && product.rating.score) ? product.rating.score : '';

            // 🛡️ Explicitly Safe DOM Injection (No raw innerHTML for data)
            const card = document.createElement('div');
            card.className = 'product-card';
            // Styling aligned with existing E-Khokha theme
            card.style.background = '#fff';
            card.style.borderRadius = '12px';
            card.style.padding = '10px';
            card.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
            card.style.cursor = 'pointer';

            // 🔴 PHASE 3: STRICT ID INTEGRITY & ROUTING (PATH FIXED)
            card.onclick = () => {
                // Step 1: Click hote hi Product ki ID save karo
                localStorage.setItem('eKhokhaActiveProductId', productId);
                
                // Step 2: Kyunki hum already 'pages' folder mein hain, seedha 'product.html' par jao
                window.location.href = "product.html";
            };

            // Image Container
            const imgContainer = document.createElement('div');
            imgContainer.className = 'product-image';
            imgContainer.style.position = 'relative';
            imgContainer.style.marginBottom = '10px';

            const img = document.createElement('img');
            img.src = imageSrc;
            img.alt = nameText; // Safe via property assignment
            img.style.width = '100%';
            img.style.aspectRatio = '1/1';
            img.style.objectFit = 'cover';
            img.style.borderRadius = '8px';
            imgContainer.appendChild(img);

            if (discountVal) {
                const discountBadge = document.createElement('span');
                discountBadge.className = 'discount-badge';
                discountBadge.style.position = 'absolute';
                discountBadge.style.top = '8px';
                discountBadge.style.left = '8px';
                discountBadge.style.background = '#fd4f6a';
                discountBadge.style.color = '#fff';
                discountBadge.style.fontSize = '10px';
                discountBadge.style.fontWeight = '700';
                discountBadge.style.padding = '2px 6px';
                discountBadge.style.borderRadius = '4px';
                discountBadge.textContent = `${discountVal}% off`;
                imgContainer.appendChild(discountBadge);
            }

            // Info Container
            const infoContainer = document.createElement('div');
            infoContainer.className = 'product-info';

            const title = document.createElement('h3');
            title.style.fontSize = '14px';
            title.style.fontWeight = '600';
            title.style.color = '#2b2b2b';
            title.style.margin = '0 0 6px 0';
            title.style.display = '-webkit-box';
            title.style.webkitLineClamp = '2'; // Restrict to 2 lines
            title.style.webkitBoxOrient = 'vertical';
            title.style.overflow = 'hidden';
            title.textContent = nameText; // 🛡️ 100% Safe Text Injection

            const priceRow = document.createElement('div');
            priceRow.className = 'product-price';

            const currPrice = document.createElement('span');
            currPrice.style.fontWeight = '700';
            currPrice.style.color = '#1a1a1a';
            currPrice.style.fontSize = '16px';
            currPrice.textContent = `₹${currentPriceVal}`; // 🛡️ Safe Number Injection
            priceRow.appendChild(currPrice);

            if (originalPriceVal) {
                const origPrice = document.createElement('span');
                origPrice.style.textDecoration = 'line-through';
                origPrice.style.color = '#a4b0be';
                origPrice.style.fontSize = '12px';
                origPrice.style.marginLeft = '6px';
                origPrice.textContent = `₹${originalPriceVal}`;
                priceRow.appendChild(origPrice);
            }

            // Build the card
            infoContainer.appendChild(title);
            infoContainer.appendChild(priceRow);

            // 🔴 NAYA BLOCK: Rating UI safely injected (Professional E-commerce Look)
            if (ratingScore) {
                const ratingEl = document.createElement('div');
                
                // Hum inline styles se ek premium "Badge" bana rahe hain
                ratingEl.style.display = 'inline-flex';
                ratingEl.style.alignItems = 'center';
                ratingEl.style.backgroundColor = '#388e3c'; // Professional Flipkart Green
                ratingEl.style.color = '#ffffff'; // Clean White Text
                ratingEl.style.fontSize = '11px';
                ratingEl.style.fontWeight = '700';
                ratingEl.style.padding = '3px 6px';
                ratingEl.style.borderRadius = '4px';
                ratingEl.style.marginTop = '8px';
                ratingEl.style.width = 'fit-content'; // Tightly wrap karega (lamba nahi failega)
                ratingEl.style.gap = '2px'; // Text aur star ke beech thoda space
                
                // Star ko text ke peeche daala (e.g., "4.5 ★")
                ratingEl.textContent = `${ratingScore} ★`; 
                infoContainer.appendChild(ratingEl);
            }

            card.appendChild(imgContainer);
            card.appendChild(infoContainer);
            
            // Add safe card to the DOM
            resultsGrid.appendChild(card);
        });
        
        resultsGrid.style.display = 'grid';
    }

    // --- 3. EVENT LISTENERS ---
    searchInput.addEventListener('input', (e) => {
        performSearch(e.target.value);
    });

    clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        performSearch('');
        searchInput.focus(); 
    });

    // --- 4. INITIALIZATION (Check URL on load) ---
    const urlParams = new URLSearchParams(window.location.search);
    const queryFromUrl = urlParams.get('q');
    if (queryFromUrl) {
        searchInput.value = queryFromUrl;
        performSearch(queryFromUrl);
    }
});
