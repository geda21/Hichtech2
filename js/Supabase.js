// js/supabase.js

// Supabase Configuration provided by user
const SUPABASE_URL = "https://jqguibaxagunlpyicnmo.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_jjNYHSvSj_jDluW4PP5IUQ_1tgtFLBk";

// Initialize Supabase Client with Pro settings
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
});

// Global error handler
window.handleError = (error, context = '') => {
    console.error(`Error in ${context}:`, error);
    const message = error.message || 'An unexpected error occurred';
    // Smooth alert for professional feel
    alert(`Hi Tech Academy - ${context}: ${message}`);
};

// Export for global use across auth.js and dashboard.js
window.supabaseClient = supabaseClient;
window.api = {
    supabase: supabaseClient
};

/**
 * PRO ROLE PROTECTOR
 * Blocks unauthorized access. Add checkAccess('admin') to admin.html, etc.
 */
async function checkAccess(requiredRole) {
    const { data: { session }, error } = await window.supabaseClient.auth.getSession();
    
    if (error || !session) {
        window.location.href = 'login.html';
        return;
    }

    const userRole = sessionStorage.getItem('userRole');

    if (requiredRole && userRole !== requiredRole) {
        console.warn(`Access Denied: ${userRole} attempted to enter ${requiredRole} zone.`);
        
        const homeMap = { 
            'admin': 'admin.html', 
            'teacher': 'teacher.html', 
            'student': 'student.html' 
        };
        
        window.location.href = homeMap[userRole] || 'login.html';
    }
}
