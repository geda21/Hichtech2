document.addEventListener('DOMContentLoaded', async () => {
    const loadingDiv = document.getElementById('loading');
    
    const showLoading = () => {
        if (loadingDiv) loadingDiv.classList.remove('hidden');
    };
    
    const hideLoading = () => {
        if (loadingDiv) loadingDiv.classList.add('hidden');
    };
    
    showLoading();
    
    try {
        // Check if user is already logged in
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        
        if (user) {
            // Get user role
            const { data: userData } = await window.supabaseClient
                .from('users')
                .select('role')
                .eq('id', user.id)
                .single();
            
            if (userData) {
                const role = userData.role;
                // Redirect to appropriate dashboard
                if (role === 'admin') {
                    window.location.href = '/admin.html';
                } else if (role === 'student') {
                    window.location.href = '/student.html';
                } else if (role === 'teacher') {
                    window.location.href = '/teacher.html';
                }
            }
        }
    } catch (error) {
        console.error('Error checking authentication:', error);
    } finally {
        hideLoading();
    }
});
