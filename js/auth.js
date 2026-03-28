document.addEventListener('DOMContentLoaded', () => {
    const loadingDiv = document.getElementById('loading');
    
    const showLoading = () => {
        if (loadingDiv) loadingDiv.classList.remove('hidden');
    };
    
    const hideLoading = () => {
        if (loadingDiv) loadingDiv.classList.add('hidden');
    };
    
    // Handle Login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showLoading();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            try {
                // Authenticate user
                const { data: authData, error: authError } = await window.supabaseClient.auth.signInWithPassword({
                    email,
                    password
                });
                
                if (authError) throw authError;
                
                // Get user role from users table
                const { data: userData, error: userError } = await window.supabaseClient
                    .from('users')
                    .select('role')
                    .eq('id', authData.user.id)
                    .single();
                
                if (userError) throw userError;
                
                const role = userData.role;
                
                // Redirect based on role
                if (role === 'admin') {
                    window.location.href = '/admin.html';
                } else if (role === 'student') {
                    window.location.href = '/student.html';
                } else if (role === 'teacher') {
                    window.location.href = '/teacher.html';
                } else {
                    throw new Error('Invalid role assigned');
                }
            } catch (error) {
                alert(error.message);
                hideLoading();
            }
        });
    }
    
    // Handle Signup
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showLoading();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            try {
                // Create user in Supabase Auth
                const { data: authData, error: authError } = await window.supabaseClient.auth.signUp({
                    email,
                    password
                });
                
                if (authError) throw authError;
                
                // Insert user into users table with student role
                const { error: insertError } = await window.supabaseClient
                    .from('users')
                    .insert([
                        { 
                            id: authData.user.id, 
                            email: email, 
                            role: 'student' 
                        }
                    ]);
                
                if (insertError) throw insertError;
                
                alert('Account created successfully! Please login.');
                window.location.href = '/login.html';
            } catch (error) {
                alert(error.message);
                hideLoading();
            }
        });
    }
});
