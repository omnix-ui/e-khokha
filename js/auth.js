// ==========================================
// 🔐 E-KHOKHA AUTHENTICATION ENGINE
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // 🛠️ HELPERS
    const showMessage = (id, msg) => { const el = document.getElementById(id); if (el) { el.textContent = msg; el.hidden = false; } };
    const hideMessage = id => { const el = document.getElementById(id); if (el) el.hidden = true; };
    const setBtnLoading = (btn, loading, text) => { if (btn) { btn.disabled = loading; btn.textContent = loading ? "Please wait..." : text; } };

    // 👁️ PASSWORD TOGGLE
    const setupToggle = (inId, btnId) => {
        const input = document.getElementById(inId), btn = document.getElementById(btnId);
        if (!input || !btn) return;
        btn.addEventListener('click', () => {
            const isPass = input.type === 'password';
            input.type = isPass ? 'text' : 'password';
            const icon = btn.querySelector('.material-symbols-outlined');
            if (icon) icon.textContent = isPass ? 'visibility_off' : 'visibility';
            btn.setAttribute('aria-label', isPass ? 'Hide password' : 'Show password');
        });
    };
    setupToggle('login-password', 'toggle-login-password');
    setupToggle('signup-password', 'toggle-signup-password');
    setupToggle('signup-confirm-password', 'toggle-confirm-password');

    // 📝 SIGNUP
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async e => {
            e.preventDefault();
            hideMessage('signup-error'); hideMessage('signup-success');
            
            const name = document.getElementById('signup-name').value.trim();
            const email = document.getElementById('signup-email').value.trim().toLowerCase();
            const pass = document.getElementById('signup-password').value;
            const confirm = document.getElementById('signup-confirm-password').value;
            const btn = document.getElementById('signup-submit');

            if (name.length < 2) return showMessage('signup-error', 'Please enter your full name.');
            if (pass.length < 8) return showMessage('signup-error', 'Password must be at least 8 characters.');
            if (pass !== confirm) return showMessage('signup-error', 'Passwords do not match.');

            setBtnLoading(btn, true, 'Create Account');
            try {
                const { data, error } = await supabaseClient.auth.signUp({
    email,password:pass,
    options:{data:{full_name:name},emailRedirectTo:`${window.location.origin}/pages/verify-success.html`}
});
                if (error) throw error;
                if (data.user && !data.session) {
                    showMessage('signup-success', 'Account created! Please check your email and verify your account before logging in.');
                    signupForm.reset();
                } else if (data.session) {
                    showMessage('signup-success', 'Account created successfully! Redirecting...');
                    setTimeout(() => window.location.href = "../index.html", 1000);
                }
            } catch (error) {
                console.error("Signup Error:", error);
                showMessage('signup-error', error.message.toLowerCase().includes('already registered') ? 'Email already registered. Please login instead.' : (error.message || "Unable to create account."));
            } finally { setBtnLoading(btn, false, 'Create Account'); }
        });
    }

    // 🔑 LOGIN
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async e => {
            e.preventDefault();
            hideMessage('login-error'); hideMessage('login-success');
            
            const email = document.getElementById('login-email').value.trim().toLowerCase();
            const pass = document.getElementById('login-password').value;
            const btn = document.getElementById('login-submit');

            if (!email || !pass) return showMessage('login-error', 'Please enter your email and password.');

            setBtnLoading(btn, true, 'Login');
            try {
                const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password: pass });
                if (error) throw error;
                if (!data.user || !data.session) throw new Error('Login session could not be created.');
                showMessage('login-success', 'Login successful! Redirecting...');
                setTimeout(() => window.location.href = "../index.html", 700);
            } catch (error) {
                console.error("Login Error:", error);
                let msg = error.message || "Unable to login.";
                if (msg.toLowerCase().includes('email not confirmed')) msg = 'Please verify your email before logging in.';
                else if (msg.toLowerCase().includes('invalid login credentials')) msg = 'Incorrect email or password.';
                showMessage('login-error', msg);
            } finally { setBtnLoading(btn, false, 'Login'); }
        });
    }

    // 🔄 FORGOT PASSWORD
    const forgotBtn = document.getElementById('forgot-password');
    if (forgotBtn) {
        forgotBtn.addEventListener('click', async () => {
            const emailInput = document.getElementById('login-email');
            const email = emailInput?.value.trim().toLowerCase();
            hideMessage('login-error'); hideMessage('login-success');

            if (!email) { showMessage('login-error', 'Enter your email first, then click Forgot Password.'); emailInput?.focus(); return; }

            forgotBtn.disabled = true; forgotBtn.textContent = 'Sending...';
            try {
                const { error } = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/pages/reset-password.html` });
                if (error) throw error;
                showMessage('login-success', 'Password reset link has been sent to your email.');
            } catch (error) {
                console.error("Password Reset Error:", error);
                showMessage('login-error', error.message || 'Unable to send password reset email.');
            } finally { forgotBtn.disabled = false; forgotBtn.textContent = 'Forgot Password?'; }
        });
    }

    // 🔐 AUTH STATE
    supabaseClient.auth.onAuthStateChange((event, session) => {
        console.log("E-KHOKHA Auth:", event);
        if (session?.user) console.log("✅ Logged in:", session.user.email);
    });
});
// ==========================================
// 🔐 RESET PASSWORD
// ==========================================

document.addEventListener('DOMContentLoaded', async () => {
    const resetForm = document.getElementById('reset-password-form');
    if (!resetForm) return;

    const passInput = document.getElementById('reset-password'), confirmInput = document.getElementById('reset-confirm-password'), btn = document.getElementById('reset-submit');
    const showMsg = (id, msg) => { const el = document.getElementById(id); if (el) { el.textContent = msg; el.hidden = false; } };
    const hideMsg = id => { const el = document.getElementById(id); if (el) el.hidden = true; };

    // 👁️ PASSWORD TOGGLE
    const setupToggle = (inputId, buttonId) => {
        const input = document.getElementById(inputId), button = document.getElementById(buttonId);
        if (!input || !button) return;
        button.addEventListener('click', () => {
            const isPass = input.type === 'password', icon = button.querySelector('.material-symbols-outlined');
            input.type = isPass ? 'text' : 'password';
            if (icon) icon.textContent = isPass ? 'visibility_off' : 'visibility';
        });
    };
    setupToggle('reset-password', 'toggle-reset-password');
    setupToggle('reset-confirm-password', 'toggle-reset-confirm-password');

    // 🔑 CHECK RECOVERY SESSION
    let { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
    if (sessionError) console.error("Recovery Session Error:", sessionError);
    let recoverySession = sessionData?.session;

    if (!recoverySession) {
        await new Promise(res => setTimeout(res, 500)); // Wait for Supabase URL processing
        const { data: retryData } = await supabaseClient.auth.getSession();
        recoverySession = retryData?.session || null;
    }

    if (!recoverySession) {
        showMsg('reset-error', 'Password reset link is invalid or expired. Please request a new link.');
        return btn.disabled = true;
    }
    console.log("✅ Password recovery session detected");

    // 🔄 UPDATE PASSWORD
    resetForm.addEventListener('submit', async e => {
        e.preventDefault();
        hideMsg('reset-error'); hideMsg('reset-success');

        const pass = passInput.value, confirm = confirmInput.value;
        if (pass.length < 8) return showMsg('reset-error', 'Password must be at least 8 characters.');
        if (pass !== confirm) return showMsg('reset-error', 'Passwords do not match.');

        btn.disabled = true; btn.textContent = 'Updating...';
        try {
            const { data, error } = await supabaseClient.auth.updateUser({ password: pass });
            if (error) throw error;
            console.log("✅ Password updated:", data.user?.email);
            showMsg('reset-success', 'Password updated successfully! Redirecting to login...');
            resetForm.reset();
            await supabaseClient.auth.signOut(); // Force login with new password
            setTimeout(() => window.location.href = 'login.html', 1500);
        } catch (error) {
            console.error("Password Update Error:", error);
            showMsg('reset-error', error.message || 'Unable to update password.');
            btn.disabled = false; btn.textContent = 'Update Password';
        }
    });
});

// ==========================================
// 👤 SESSION + LOGOUT MANAGEMENT
// ==========================================

window.eKhokhaAuth = {
    getUser: async () => {
        const { data, error } = await supabaseClient.auth.getUser();
        if (error) { console.error("Get User Error:", error); return null; }
        return data.user || null;
    },
    getSession: async () => {
        const { data, error } = await supabaseClient.auth.getSession();
        if (error) { console.error("Get Session Error:", error); return null; }
        return data.session || null;
    },
    logout: async () => {
        const { error } = await supabaseClient.auth.signOut();
        if (error) { console.error("Logout Error:", error); alert("Unable to logout. Please try again."); return false; }
        window.location.href = "../index.html"; return true;
    }
};

// 🚪 LOGOUT BUTTON LISTENER
document.addEventListener('click', e => {
    if (!e.target.closest('[data-logout]')) return;
    e.preventDefault();
    if (confirm("Are you sure you want to logout?")) window.eKhokhaAuth.logout();
});

// 🔒 LOGIN/SIGNUP PAGE REDIRECT (Prevent logged-in users from seeing Auth pages)
document.addEventListener('DOMContentLoaded', async () => {
    if (!document.getElementById('login-form') && !document.getElementById('signup-form')) return;
    const session = await window.eKhokhaAuth.getSession();
    if (session?.user) window.location.href = "../index.html";
});
