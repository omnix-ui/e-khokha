let currentRatingValue = 0;
let activeProductId = null;
let currentUser = null;
let productReviews = [];

document.addEventListener("DOMContentLoaded", initReviews);

async function initReviews() {
    activeProductId = localStorage.getItem("eKhokhaActiveProductId");
    
    if (!activeProductId) {
        alert("Product not found!");
        window.history.back();
        return;
    }
    
    setupStars();
    
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        currentUser = session?.user || null;
        await loadReviews();
    } catch (error) {
        console.error("Review initialization error:", error);
        showLoadError();
    }
}

async function loadReviews() {
    const { data, error } = await supabaseClient
        .from("reviews")
        .select("review_id,product_id,user_id,rating,review_text,status,is_verified_purchase,created_at")
        .eq("product_id", activeProductId)
        .eq("status", "approved")
        .order("created_at", { ascending: false });
    
    if (error) throw error;
    
    productReviews = data || [];
    renderOverview();
    renderReviewsList();
}

function renderOverview() {
    const container = document.getElementById("rating-overview-container");
    
    if (!productReviews.length) {
        container.innerHTML = `
        <div class="rating-big">0.0</div>
        <div>
            <div class="rating-stars">☆☆☆☆☆</div>
            <div class="rating-count">0 verified ratings</div>
        </div>`;
        return;
    }
    
    const total = productReviews.reduce((sum, r) => sum + Number(r.rating), 0);
    const score = total / productReviews.length;
    const rounded = Math.round(score);
    
    container.innerHTML = `
    <div class="rating-big">${score.toFixed(1)}</div>
    <div>
        <div class="rating-stars">${"★".repeat(rounded)}${"☆".repeat(5-rounded)}</div>
        <div class="rating-count">${productReviews.length} verified rating${productReviews.length===1?"":"s"}</div>
    </div>`;
}

function renderReviewsList() {
    const container = document.getElementById("reviews-list-container");
    const empty = document.getElementById("no-reviews-state");
    
    container.innerHTML = "";
    
    if (!productReviews.length) {
        empty.style.display = "block";
        return;
    }
    
    empty.style.display = "none";
    
    productReviews.forEach(review => {
        const card = document.createElement("div");
        card.className = "review-card";
        
        const header = document.createElement("div");
        header.className = "review-header";
        
        const info = document.createElement("div");
        info.className = "reviewer-info";
        
        info.innerHTML = `
        <div class="reviewer-avatar">U</div>
        <div>
            <div class="reviewer-name">Verified User</div>
            ${review.is_verified_purchase?`<div class="verified-badge"><span class="material-symbols-outlined" style="font-size:14px;">verified</span> Verified Purchase</div>`:""}
        </div>`;
        
        const right = document.createElement("div");
        right.style.textAlign = "right";
        right.innerHTML = `
        <div style="color:#ffb800;font-size:14px;">${"★".repeat(Number(review.rating))}${"☆".repeat(5-Number(review.rating))}</div>
        <div class="review-date">${formatDate(review.created_at)}</div>`;
        
        header.appendChild(info);
        header.appendChild(right);
        
        const text = document.createElement("div");
        text.className = "review-text";
        text.textContent = review.review_text || "";
        
        card.appendChild(header);
        card.appendChild(text);
        container.appendChild(card);
    });
}

function setupStars() {
    const stars = document.querySelectorAll("#star-selector span");
    
    stars.forEach(star => {
        star.addEventListener("click", () => {
            currentRatingValue = Number(star.dataset.val);
            
            stars.forEach(s => {
                s.classList.toggle("active", Number(s.dataset.val) <= currentRatingValue);
            });
        });
    });
}

window.openReviewModal = async function() {
    if (!currentUser) {
        window.location.href = "login.html";
        return;
    }
    
    const { data: existing, error } = await supabaseClient
        .from("reviews")
        .select("review_id")
        .eq("product_id", activeProductId)
        .eq("user_id", currentUser.id)
        .maybeSingle();
    
    if (error) {
        console.error(error);
        alert("Unable to check review status.");
        return;
    }
    
    if (existing) {
        alert("You have already reviewed this product.");
        return;
    }
    
    currentRatingValue = 0;
    document.getElementById("review-text-input").value = "";
    document.querySelectorAll("#star-selector span").forEach(s => s.classList.remove("active"));
    document.getElementById("review-modal").classList.add("active");
};

window.closeReviewModal = function() {
    document.getElementById("review-modal").classList.remove("active");
};

window.handleReviewSubmit = async function() {
    if (!currentUser) {
        window.location.href = "login.html";
        return;
    }
    
    if (!currentRatingValue) {
        alert("Please select a rating.");
        return;
    }
    
    const text = document.getElementById("review-text-input").value.trim();
    
    if (!text) {
        alert("Please write your review.");
        return;
    }
    
    if (text.length > 500) {
        alert("Review cannot exceed 500 characters.");
        return;
    }
    
    const button = document.querySelector(".submit-btn");
    button.disabled = true;
    button.textContent = "Submitting...";
    
    try {
        const { error } = await supabaseClient.from("reviews").insert({
            product_id: activeProductId,
            user_id: currentUser.id,
            rating: currentRatingValue,
            review_text: text,
            status: "pending",
            is_verified_purchase: true
        });
        
        if (error) {
            if (error.code === "23505") {
                throw new Error("You have already reviewed this product.");
            }
            throw error;
        }
        
        alert("Review submitted successfully! It will appear after approval.");
        closeReviewModal();
        currentRatingValue = 0;
        document.querySelectorAll("#star-selector span").forEach(s => s.classList.remove("active"));
        document.getElementById("review-text-input").value = "";
    } catch (error) {
        console.error("Review submit error:", error);
        alert(error.message || "Unable to submit review.");
    } finally {
        button.disabled = false;
        button.textContent = "Submit Review";
    }
};

function formatDate(date) {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function showLoadError() {
    document.getElementById("rating-overview-container").innerHTML = `
    <div style="width:100%;text-align:center;color:#636e72;">Unable to load reviews.</div>`;
}

document.getElementById("review-modal")?.addEventListener("click", e => {
    if (e.target.id === "review-modal") closeReviewModal();
});