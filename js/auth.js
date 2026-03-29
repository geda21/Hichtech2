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
        if (this.loadingDiv) this.loadingDiv.classList.add('hidden');
    }

    async login(email, password) {
        try {
            const { data: authData, error: authError } = await window.supabaseClient.auth.signInWithPassword({
                email, password
            });

            if (authError) throw authError;

            // Fetch the role from your custom 'users' table
            const { data: userData, error: userError } = await window.supabaseClient
                .from('users')
                .select('role')
                .eq('id', authData.user.id)
                .single();

            if (userError) {
                console.error("Role fetch error:", userError);
                throw new Error("User record not found in database.");
            }

            sessionStorage.setItem('userRole', userData.role);
            sessionStorage.setItem('userEmail', email);

            return userData;
        } catch (error) {
            throw error;
        }
    }

    async signup(email, password) {
        try {
            const { data: authData, error: authError } = await window.supabaseClient.auth.signUp({
                email, password
            });

            if (authError) throw authError;

            if (authData.user) {
                // IMPORTANT: Default role is 'student'. 
                // You must manually change this to 'admin' in the Supabase Dashboard for admins.
                const { error: insertError } = await window.supabaseClient
                    .from('users')
                    .insert([{
                        id: authData.user.id,
                        email: email,
                        role: 'student', 
                        created_at: new Date().toISOString()
                    }]);

                if (insertError) throw insertError;
            }
            return { success: true };
        } catch (error) {
            throw error;
        }
    }

    init() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                this.showLoading('Verifying credentials...');
                const email = document.getElementById('email').value.trim();
                const password = document.getElementById('password').value;

                try {
                    const userData = await this.login(email, password);
                    // Use relative paths ONLY (no starting slash)
                    const redirectMap = {
                        'admin': 'admin.html',
                        'teacher': 'teacher.html',
                        'student': 'student.html'
                    };
                    window.location.href = redirectMap[userData.role] || 'index.html';
                } catch (error) {
                    this.hideLoading();
                    alert("Login Failed: " + error.message);
                }
            });
        }

        const signupForm = document.getElementById('signupForm');
        if (signupForm) {
            signupForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                this.showLoading('Creating secure account...');
                const email = document.getElementById('email').value.trim();
                const password = document.getElementById('password').value;

                try {
                    await this.signup(email, password);
                    alert('Success! Please verify your email, then login.');
                    window.location.href = 'login.html';
                } catch (error) {
                    this.hideLoading();
                    alert("Signup Error: " + error.message);
                }
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => { if(window.supabaseClient) new AuthManager(); });
