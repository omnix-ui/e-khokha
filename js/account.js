// ==========================================
// 👤 E-KHOKHA ACCOUNT DATA ARCHITECTURE (PHASE 3 - SECURE)
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. 🔒 SECURITY ALIGNMENT (Strict Rule Enforcement) ---
    // Ye function ensure karega ki galti se bhi koi auth token localStorage mein na jaye.
    function enforceSecurityRules() {
        const forbiddenKeys = ['password', 'otp', 'token', 'auth_token', 'supabase_session'];
        forbiddenKeys.forEach(key => {
            if (localStorage.getItem(key)) {
                console.warn(`SECURITY ALERT: Removed forbidden key '${key}' from localStorage. Supabase will handle this.`);
                localStorage.removeItem(key);
            }
        });
    }
    enforceSecurityRules(); // Run on page load

    // --- 2. MOCK SUPABASE DATA SCHEMA ---
    const mockSupabaseProfile = {
        user_id: "auth-uuid-placeholder-001", 
        full_name: "Demo User",
        email: "demo@ekhokha.com",
        mobile: "+91 9876543210",
        avatar_url: "https://placehold.co/150x150/1a1a1a/ffffff?text=DU",
        created_at: "2026-08-12T10:00:00Z",
        updated_at: "2026-08-12T10:00:00Z"
    };

    let isLoggedIn = true; // State Controller

    // --- 3. DOM ELEMENTS FETCHING ---
    const loggedInSection = document.getElementById('auth-logged-in');
    const loggedOutSection = document.getElementById('auth-logged-out');
    const logoutBtn = document.getElementById('logout-section');
    const accountMenu = document.querySelector('.account-menu'); // 🔴 NAYI LINE: Menu fetch kiya

    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    const profileMobile = document.getElementById('profile-mobile');
    const profileAvatar = document.getElementById('profile-avatar');

    // --- 4. DYNAMIC RENDERING LOGIC ---
    function renderAccountState() {
        if (isLoggedIn) {
            loggedInSection.style.display = 'block';
            logoutBtn.style.display = 'block';
            if(accountMenu) accountMenu.style.display = 'block'; // 🔴 FIX: Menu show karo
            loggedOutSection.style.display = 'none';

            if (profileName) profileName.textContent = mockSupabaseProfile.full_name;
            if (profileEmail) profileEmail.textContent = mockSupabaseProfile.email;
            if (profileMobile) profileMobile.textContent = mockSupabaseProfile.mobile || 'No mobile added';
            if (profileAvatar && mockSupabaseProfile.avatar_url) {
                profileAvatar.src = mockSupabaseProfile.avatar_url;
                profileAvatar.alt = mockSupabaseProfile.full_name;
            }
        } else {
            loggedInSection.style.display = 'none';
            logoutBtn.style.display = 'none';
            if(accountMenu) accountMenu.style.display = 'none'; // 🔴 FIX: Logout hote hi Menu hide kar do!
            loggedOutSection.style.display = 'block';
        }
    }
    renderAccountState();

    // --- 5. 🚪 SECURE LOGOUT HANDLER (Ready for Supabase) ---
    window.handleFakeLogout = function() {
        const confirmLogout = confirm("Are you sure you want to logout?");
        
        if (confirmLogout) {
            // 🚀 FUTURE SUPABASE CODE GOES HERE:
            // try {
            //     await supabase.auth.signOut();
            //     isLoggedIn = false;
            //     renderAccountState();
            // } catch (error) { console.error("Logout failed", error); }
            
            console.log("Supabase Mock Logout Triggered");
            isLoggedIn = false; 
            renderAccountState(); 
        }
    };
});
