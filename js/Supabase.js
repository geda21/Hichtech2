// Supabase Configuration
const SUPABASE_URL = "https://jqguibaxagunlpyicnmo.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_jjNYHSvSj_jDluW4PP5IUQ_1tgtFLBk";

// Initialize Supabase Client
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
    alert(`Error: ${message}`);
};

// Export for global use
window.supabaseClient = supabaseClient;
window.api = {
    supabase: supabaseClient
};
