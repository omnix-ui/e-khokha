// ==========================================
// E-KHOKHA — SUPABASE CLIENT
// ==========================================

const SUPABASE_URL = "https://kgabhyxzihdkemmfqgbi.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_LigxyFOvXb8X_-fSEneATA_umGUzxf8";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

console.log("✅ Supabase connected");