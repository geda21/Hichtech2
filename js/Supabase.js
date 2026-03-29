// js/supabase.js
const SUPABASE_URL = "https://jqguibaxagunlpyicnmo.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_jjNYHSvSj_jDluW4PP5IUQ_1tgtFLBk";

const { createClient } = window['@supabase/supabase-js'];
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true }
});

window.supabaseClient = supabaseClient;

// Security Guard
async function checkAccess(requiredRole) {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) { window.location.href = 'login.html'; return; }

    const userRole = sessionStorage.getItem('userRole');
    if (requiredRole && userRole !== requiredRole) {
        const homeMap = { 'admin': 'admin.html', 'teacher': 'teacher.html', 'student': 'student.html' };
        window.location.href = homeMap[userRole] || 'login.html';
    }
}
