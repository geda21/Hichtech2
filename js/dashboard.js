// js/dashboard.js
document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('uploadForm');
    const logoutBtn = document.getElementById('logoutBtn');

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await window.supabaseClient.auth.signOut();
            sessionStorage.clear();
            window.location.href = 'login.html';
        });
    }

    if (uploadForm) {
        uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const file = document.getElementById('file').files[0];
            const title = document.getElementById('title').value;
            const type = document.getElementById('type').value;

            const fileName = `${Date.now()}_${file.name}`;
            const { data: upData, error: upErr } = await window.supabaseClient.storage.from('uploads').upload(fileName, file);
            if (upErr) return alert(upErr.message);

            const { data: { publicUrl } } = window.supabaseClient.storage.from('uploads').getPublicUrl(fileName);
            await window.supabaseClient.from('posts').insert([{ title, type, file_url: publicUrl }]);
            
            alert("Uploaded!");
            location.reload();
        });
    }

    loadPosts();
});

async function loadPosts() {
    const { data: posts } = await window.supabaseClient.from('posts').select('*').order('created_at', { ascending: false });
    const list = document.getElementById('postsList');
    if (!list) return;

    list.innerHTML = posts.map(p => `
        <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
            <div><h3 class="font-bold">${p.title}</h3><span class="text-xs text-blue-500 uppercase">${p.type}</span></div>
            <a href="${p.file_url}" target="_blank" class="bg-blue-600 text-white px-4 py-1 rounded-lg text-sm">View</a>
        </div>
    `).join('');
}
