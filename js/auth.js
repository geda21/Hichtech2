// js/auth.js
class AuthManager {
    constructor() {
        this.loadingDiv = document.getElementById('loading');
        this.init();
    }

    async login(email, password) {
        try {
            const { data: authData, error: authError } = await window.supabaseClient.auth.signInWithPassword({
                email, password
            });

            if (authError) throw authError;

            // Fetch user's professional role from the database
            const { data: userData, error: userError } = await window.supabaseClient
                .from('users')
                .select('role')
                .eq('id', authData.user.id)
                .single();

            if (userError) throw new Error("Could not verify user role.");

            // Save role for the session
            sessionStorage.setItem('userRole', userData.role);
            return userData.role;
        } catch (error) {
            throw error;
        }
    }

    init() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('email').value;
                const pass = document.getElementById('password').value;

                try {
                    const role = await this.login(email, pass);
                    
                    // FIXED: Professional relative redirects
                    const redirectMap = {
                        'admin': 'admin.html',
                        'teacher': 'teacher.html',
                        'student': 'student.html'
                    };

                    const target = redirectMap[role] || 'index.html';
                    console.log(`Access Granted. Role: ${role}. Redirecting to ${target}`);
                    window.location.href = target;
                    
                } catch (error) {
                    alert("Authentication Error: " + error.message);
                }
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => new AuthManager());
