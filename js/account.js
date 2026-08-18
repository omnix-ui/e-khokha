// ==========================================
// 👤 E-KHOKHA ACCOUNT — SUPABASE AUTH
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // 🛠️ ELEMENTS
    const getEl = id => document.getElementById(id);
    const loggedInSection = getEl('auth-logged-in'), loggedOutSection = getEl('auth-logged-out');
    const logoutBtn = getEl('logout-section'), accountMenu = document.querySelector('.account-menu');
    const profileName = getEl('profile-name'), profileEmail = getEl('profile-email');
    const profileMobile = getEl('profile-mobile'), profileAvatar = getEl('profile-avatar');
    const guestLoginBtn = document.querySelector('.btn-login'), accountMain = document.querySelector('.account-main');
    const accountLoader = getEl('account-loader'), profileModal = getEl('edit-profile-modal');
    const editForm = getEl('edit-profile-form'), editName = getEl('edit-name'), editMobile = getEl('edit-mobile');
    const saveBtn = getEl('save-profile-btn');

    let currentUser = null;

    // 🔄 HELPERS & UI TOGGLES
    const finishLoading = () => { accountMain?.classList.remove('account-loading'); accountLoader?.remove(); };
    const renderLoggedIn = () => { [loggedInSection, accountMenu, logoutBtn].forEach(el => el && (el.style.display = 'block')); if (loggedOutSection) loggedOutSection.style.display = 'none'; };
    const renderLoggedOut = () => { [loggedInSection, accountMenu, logoutBtn].forEach(el => el && (el.style.display = 'none')); if (loggedOutSection) loggedOutSection.style.display = 'block'; };
    const showMsg = (id, msg) => { const el = getEl(id); if (el) { el.textContent = msg; el.hidden = false; } };
    const hideMsg = id => { const el = getEl(id); if (el) el.hidden = true; };
    const closeEditProfile = () => { if (profileModal) profileModal.style.display = 'none'; };

    if (guestLoginBtn) guestLoginBtn.addEventListener('click', () => window.location.href = 'login.html');

    // 🛡️ SUPABASE INIT & SESSION CHECK
    if (typeof supabaseClient === 'undefined') { console.error("E-KHOKHA: Supabase client not loaded."); renderLoggedOut(); return finishLoading(); }

    const loadUserProfile = async (user) => {
        try {
            const { data: profile, error } = await supabaseClient.from('profiles').select('full_name, mobile, avatar_url').eq('user_id', user.id).single();
            if (error && error.code !== 'PGRST116') throw error;
            
            const fullName = profile?.full_name || user.user_metadata?.full_name || 'E-KHOKHA User';
            if (profileName) profileName.textContent = fullName;
            if (profileEmail) profileEmail.textContent = user.email || 'No email';
            if (profileMobile) profileMobile.textContent = profile?.mobile || 'No mobile added';
            if (profileAvatar) { 
                profileAvatar.src = profile?.avatar_url || `https://placehold.co/150x150/1a1a1a/ffffff?text=${encodeURIComponent(fullName.charAt(0).toUpperCase())}`; 
                profileAvatar.alt = fullName; 
            }
        } catch (error) {
            console.error("Profile Load Error:", error);
            if (profileName) profileName.textContent = user.user_metadata?.full_name || 'E-KHOKHA User';
            if (profileEmail) profileEmail.textContent = user.email || 'No email';
            if (profileMobile) profileMobile.textContent = 'No mobile added';
        } finally { renderLoggedIn(); }
    };

    const checkSession = async () => {
        try {
            const { data, error } = await supabaseClient.auth.getSession();
            if (error) throw error;
            if (!data?.session?.user) throw new Error("No session");
            currentUser = data.session.user;
            await loadUserProfile(currentUser);
        } catch (error) {
            currentUser = null; renderLoggedOut();
        } finally { finishLoading(); }
    };
    checkSession();

    // ✏️ EDIT PROFILE LOGIC
    const openEditProfile = () => {
        if (!currentUser) return showMsg('profile-edit-error', 'User session not found.');
        if (editName) editName.value = profileName?.textContent || '';
        if (editMobile) editMobile.value = profileMobile?.textContent === 'No mobile added' ? '' : (profileMobile?.textContent || '');
        hideMsg('profile-edit-error'); hideMsg('profile-edit-success');
        if (profileModal) profileModal.style.display = 'flex';
    };

    getEl('edit-profile-btn')?.addEventListener('click', openEditProfile);
    getEl('close-profile-modal')?.addEventListener('click', closeEditProfile);
    getEl('cancel-profile-edit')?.addEventListener('click', closeEditProfile);

    editForm?.addEventListener('submit', async e => {
        e.preventDefault();
        hideMsg('profile-edit-error'); hideMsg('profile-edit-success');

        const name = editName?.value.trim() || '', mobile = editMobile?.value.trim() || '';
        if (name.length < 2) return showMsg('profile-edit-error', 'Please enter your full name.');
        if (mobile && !/^[0-9]{10}$/.test(mobile)) return showMsg('profile-edit-error', 'Please enter a valid 10-digit mobile number.');
        if (!currentUser) return showMsg('profile-edit-error', 'User session not found.');

        if (!saveBtn) return;
        saveBtn.disabled = true; saveBtn.textContent = 'Saving...';

        try {
            const { error } = await supabaseClient.from('profiles').update({ full_name: name, mobile: mobile || null, updated_at: new Date().toISOString() }).eq('user_id', currentUser.id);
            if (error) throw error;

            if (profileName) profileName.textContent = name;
            if (profileMobile) profileMobile.textContent = mobile || 'No mobile added';
            if (profileAvatar) profileAvatar.src = `https://placehold.co/150x150/1a1a1a/ffffff?text=${encodeURIComponent(name.charAt(0).toUpperCase())}`;

            showMsg('profile-edit-success', 'Profile updated successfully.');
            setTimeout(closeEditProfile, 700);
        } catch (error) {
            console.error('Profile Update Error:', error);
            showMsg('profile-edit-error', error.message || 'Unable to update profile.');
        } finally { saveBtn.disabled = false; saveBtn.textContent = 'Save Changes'; }
    });

    // 🚪 LOGOUT LOGIC
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            if (!confirm("Are you sure you want to logout?")) return;
            logoutBtn.style.pointerEvents = 'none'; logoutBtn.style.opacity = '0.6';
            try {
                const { error } = await supabaseClient.auth.signOut();
                if (error) throw error;
                window.location.href = 'login.html';
            } catch (error) {
                console.error("Logout Error:", error);
                alert("Unable to logout. Please try again.");
                logoutBtn.style.pointerEvents = 'auto'; logoutBtn.style.opacity = '1';
            }
        });
    }

    // 🔄 AUTH STATE LISTENER
    supabaseClient.auth.onAuthStateChange((event, session) => {
        console.log("Account Auth State:", event);
        if (event === 'SIGNED_OUT' || !session) {
            currentUser = null; renderLoggedOut();
            if (accountMain?.classList.contains('account-loading')) finishLoading();
        } else if (['SIGNED_IN', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event)) {
            currentUser = session.user;
        }
    });
});
