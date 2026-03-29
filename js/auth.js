// Authentication Management System
class AuthManager {
    constructor() {
        this.loadingDiv = document.getElementById('loading');
        this.init();
    }

    showLoading(message = 'Loading...') {
        if (this.loadingDiv) {
            const textElement = this.loadingDiv.querySelector('p');
            if (textElement) textElement.textContent = message;
            this.loadingDiv.classList.remove('hidden');
        }
    }

    hideLoading() {
        if (this.loadingDiv) {
            this.loadingDiv.classList.add('hidden');
        }
    }

    async validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error('Please enter a valid email address');
        }
        return true;
    }

    async validatePassword(password) {
        if (password.length < 6) {
            throw new Error('Password must be at least 6 characters long');
        }
        return true;
    }

    async login(email, password) {
        try {
            await this.validateEmail(email);
            await this.validatePassword(password);

            const { data: authData, error: authError } = await window.supabaseClient.auth.signInWithPassword({
                email,
                password
            });

            if (authError) throw authError;

            const { data: userData, error: userError } = await window.supabaseClient
                .from('users')
                .select('role')
                .eq('id', authData.user.id)
                .single();

            if (userError) throw userError;

            // Store user info in session storage
            sessionStorage.setItem('userRole', userData.role);
            sessionStorage.setItem('userEmail', email);

            return userData;
        } catch (error) {
            throw error;
        }
    }

    async signup(email, password) {
        try {
            await this.validateEmail(email);
            await this.validatePassword(password);

            // Note: In Supabase, signUp might return a user even if 
            // email confirmation is required.
            const { data: authData, error: authError } = await window.supabaseClient.auth.signUp({
                email,
                password
            });

            if (authError) throw authError;

            // Only insert into public.users if auth was successful
            if (authData.user) {
                const { error: insertError } = await window.supabaseClient
                    .from('users')
                    .insert([
                        {
                            id: authData.user.id,
                            email: email,
                            role: 'student', // Default role
                            created_at: new Date().toISOString()
                        }
                    ]);

                if (insertError) throw insertError;
            }

            return { success: true };
        } catch (error) {
            throw error;
        }
    }

    init() {
        // Handle Login
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                this.showLoading('Signing in...');

                const email = document.getElementById('email').value.trim();
                const password = document.getElementById('password').value;

                try {
                    const userData = await this.login(email, password);

                    // FIXED: Removed leading slashes for GitHub Pages compatibility
                    const redirectMap = {
                        'admin': 'admin.html',
                        'student': 'student.html',
                        'teacher': 'teacher.html'
                    };

                    window.location.href = redirectMap[userData.role] || 'index.html';
                } catch (error) {
                    this.hideLoading();
                    alert(error.message);
                }
            });
        }

        // Handle Signup
        const signupForm = document.getElementById('signupForm');
        if (signupForm) {
            signupForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                this.showLoading('Creating account...');

                const email = document.getElementById('email').value.trim();
                const password = document.getElementById('password').value;

                try {
                    await this.signup(email, password);
                    alert('Account created successfully! Please check your email to verify your account.');
                    // FIXED: Removed leading slash
                    window.location.href = 'login.html';
                } catch (error) {
                    this.hideLoading();
                    alert(error.message);
                }
            });
        }
    }
}

// Initialize authentication
document.addEventListener('DOMContentLoaded', () => {
    // Check if supabaseClient is available from supabase.js
    if (window.supabaseClient) {
        new AuthManager();
    } else {
        console.error("Supabase client not initialized. Check your supabase.js file.");
    }
});
