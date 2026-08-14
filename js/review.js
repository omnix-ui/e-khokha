// ==========================================
// ⭐ E-KHOKHA REVIEW LOGIC (PHASE 3 - SECURE)
// ==========================================

let currentRatingValue = 0; // Tracks stars selected in modal
const MOCK_CURRENT_USER_ID = "auth-uuid-placeholder-001"; // Rule 3: Simulate logged-in user

document.addEventListener('DOMContentLoaded', () => {
    // 1. GET ACTIVE PRODUCT ID
    const activeProductId = localStorage.getItem('eKhokhaActiveProductId');
    if (!activeProductId) {
        alert("Product not found!");
        window.history.back();
        return;
    }

    // 2. RENDER OVERVIEW (Rule 9)
    function renderOverview() {
        const ratingData = calculateDynamicRating(activeProductId);
        const overviewContainer = document.getElementById('rating-overview-container');
        
        overviewContainer.innerHTML = `
            <div class="rating-big">${ratingData.score > 0 ? ratingData.score : '0.0'}</div>
            <div>
                <div class="rating-stars">
                    ${'★'.repeat(Math.round(ratingData.score))}${'☆'.repeat(5 - Math.round(ratingData.score))}
                </div>
                <div class="rating-count">${ratingData.rating_count} verified ratings</div>
            </div>
        `;
    }

    // 3. SECURE RENDER REVIEWS LIST (Rule 6 & 7)
    function renderReviewsList() {
        const reviewsContainer = document.getElementById('reviews-list-container');
        const emptyState = document.getElementById('no-reviews-state');
        reviewsContainer.innerHTML = ''; // Clear

        const approvedReviews = getApprovedReviews(activeProductId);

        if (approvedReviews.length === 0) {
            emptyState.style.display = 'block';
            return;
        }
        emptyState.style.display = 'none';

        approvedReviews.forEach(review => {
            // Secure DOM Elements
            const card = document.createElement('div');
            card.className = 'review-card';

            // Top row
            const header = document.createElement('div');
            header.className = 'review-header';
            
            const info = document.createElement('div');
            info.className = 'reviewer-info';
            
            // Masking User Name for privacy logic (Future feature, hardcoding "User" for now)
            info.innerHTML = `
                <div class="reviewer-avatar">U</div>
                <div>
                    <div class="reviewer-name">Verified User</div>
                    ${review.is_verified_purchase ? `<div class="verified-badge"><span class="material-symbols-outlined" style="font-size:14px;">verified</span> Verified Purchase</div>` : ''}
                </div>
            `;
            
            // Stars & Date
            const rightSide = document.createElement('div');
            rightSide.style.textAlign = 'right';
            rightSide.innerHTML = `
                <div style="color:#ffb800; font-size:14px;">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div>
                <div class="review-date">${new Date(review.created_at).toLocaleDateString()}</div>
            `;

            header.appendChild(info);
            header.appendChild(rightSide);

            // Review Text (SECURE TEXTCONTENT INJECTION)
            const textEl = document.createElement('div');
            textEl.className = 'review-text';
            textEl.textContent = review.review_text; // NO innerHTML vulnerability!

            card.appendChild(header);
            card.appendChild(textEl);
            reviewsContainer.appendChild(card);
        });
    }

    renderOverview();
    renderReviewsList();

    // 4. STAR RATING SELECTOR LOGIC
    const stars = document.querySelectorAll('#star-selector span');
    stars.forEach(star => {
        star.addEventListener('click', function() {
            currentRatingValue = parseInt(this.getAttribute('data-val'));
            
            // Update UI Stars
            stars.forEach(s => {
                if (parseInt(s.getAttribute('data-val')) <= currentRatingValue) {
                    s.classList.add('active');
                } else {
                    s.classList.remove('active');
                }
            });
        });
    });
});

// 5. MODAL CONTROLS
window.openReviewModal = function() {
    document.getElementById('review-modal').classList.add('active');
};
window.closeReviewModal = function() {
    document.getElementById('review-modal').classList.remove('active');
};

// 6. SUBMIT REVIEW LOGIC (Rule 8)
window.handleReviewSubmit = function() {
    const activeProductId = localStorage.getItem('eKhokhaActiveProductId');
    const textInput = document.getElementById('review-text-input').value;

    // Use app.js logic (Rule 5 & 7 validation happens inside submitReview)
    const result = submitReview(activeProductId, MOCK_CURRENT_USER_ID, currentRatingValue, textInput);

    if (result.success) {
        alert(result.message + " (It will appear here once approved by admin).");
        closeReviewModal();
        
        // Reset form
        currentRatingValue = 0;
        document.querySelectorAll('#star-selector span').forEach(s => s.classList.remove('active'));
        document.getElementById('review-text-input').value = '';
        
        // We do NOT call renderReviewsList() immediately because the new review is "pending" (Rule 6)
    } else {
        alert(result.message); // Show validation error (e.g., text too long)
    }
};
