// Supabase Configuration
// 1. Go to your Supabase Dashboard
// 2. Click 'Settings' (cog icon) -> 'API'
// 3. Copy the 'Project URL' and 'anon' public key
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_PUBLIC_KEY';

// Initialize the Supabase Client
// We attach it to the 'window' object so auth.js and dashboard.js can use it.
try {
    if (!window['@supabase/supabase-js']) {
        throw new Error("Supabase CDN failed to load. Check your internet connection.");
    }
    
    const { createClient } = window['@supabase/supabase-js'];
    window.supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    console.log("✅ Supabase initialized successfully.");
} catch (error) {
    console.error("❌ Supabase Initialization Error:", error.message);
}

/**
 * Security Helper: Protects pages from unauthorized access.
 * Usage: Call this at the start of dashboard.js
 */
async function protectPage(requiredRole = null) {
    const { data: { session }, error } = await window.supabaseClient.auth.getSession();
    
    // If no session, send them back to login
    if (error || !session) {
        window.location.href = 'login.html';
        return null;
    }

    // If a specific role is required (e.g., 'admin')
    if (requiredRole) {
        const userRole = sessionStorage.getItem('userRole');
        if (userRole !== requiredRole) {
            alert("Access Denied: You do not have permission to view this page.");
            window.location.href = 'login.html';
            return null;
        }
    }

    return session.user;
}
