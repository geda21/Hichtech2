// js/auth.js
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            const { data, error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
            if (error) return alert(error.message);

            const { data: profile } = await window.supabaseClient.from('users').select('role').eq('id', data.user.id).single();
            sessionStorage.setItem('userRole', profile.role);
            
            const paths = { admin: 'admin.html', teacher: 'teacher.html', student: 'student.html' };
            window.location.href = paths[profile.role] || 'index.html';
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            const { data, error } = await window.supabaseClient.auth.signUp({ email, password });
            if (error) return alert(error.message);

            await window.supabaseClient.from('users').insert([{ id: data.user.id, email, role: 'student' }]);
            alert("Account created! You can now log in.");
            window.location.href = 'login.html';
        });
    }
});
