// Main Application Entry Point
class App {
    constructor() {
        this.loadingDiv = document.getElementById('loading');
        this.init();
    }

    showLoading() {
        if (this.loadingDiv) {
            this.loadingDiv.classList.remove('hidden');
        }
    }

    hideLoading() {
        if (this.loadingDiv) {
            this.loadingDiv.classList.add('hidden');
        }
    }

    async init() {
        this.showLoading();

        try {
            // Check if user is logged in
            const { data: { user }, error } = await window.supabaseClient.auth.getUser();

            if (user && !error) {
                // Get user role
                const { data: userData } = await window.supabaseClient
                    .from('users')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                if (userData) {
                    // Redirect to appropriate dashboard
                    const redirectMap = {
                        'admin': '/admin.html',
                        'student': '/student.html',
                        'teacher': '/teacher.html'
                    };

                    if (redirectMap[userData.role]) {
                        window.location.href = redirectMap[userData.role];
                        return;
                    }
                }
            }
        } catch (error) {
            console.error('Error checking authentication:', error);
        } finally {
            this.hideLoading();
        }
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
