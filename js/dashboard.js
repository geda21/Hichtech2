document.addEventListener('DOMContentLoaded', async () => {
    const loadingDiv = document.getElementById('loading');
    
    const showLoading = () => {
        if (loadingDiv) loadingDiv.classList.remove('hidden');
    };
    
    const hideLoading = () => {
        if (loadingDiv) loadingDiv.classList.add('hidden');
    };
    
    // Handle Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            showLoading();
            try {
                await window.supabaseClient.auth.signOut();
                window.location.href = '/index.html';
            } catch (error) {
                alert(error.message);
                hideLoading();
            }
        });
    }
    
    // Get current user
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    
    if (!user) {
        window.location.href = '/login.html';
        return;
    }
    
    // Get user role
    const { data: userData } = await window.supabaseClient
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
    
    const currentRole = userData?.role;
    
    // Handle file upload for admin
    const uploadForm = document.getElementById('uploadForm');
    if (uploadForm && currentRole === 'admin') {
        uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showLoading();
            
            const title = document.getElementById('title').value;
            const type = document.getElementById('type').value;
            const audience = document.getElementById('audience').value;
            const file = document.getElementById('file').files[0];
            
            if (!file) {
                alert('Please select a file');
                hideLoading();
                return;
            }
            
            try {
                // Upload file to Supabase Storage
                const fileName = `${Date.now()}_${file.name}`;
                const { data: uploadData, error: uploadError } = await window.supabaseClient.storage
                    .from('files')
                    .upload(fileName, file);
                
                if (uploadError) throw uploadError;
                
                // Get public URL
                const { data: publicUrlData } = window.supabaseClient.storage
                    .from('files')
                    .getPublicUrl(fileName);
                
                const fileUrl = publicUrlData.publicUrl;
                
                // Save post to database
                const { error: insertError } = await window.supabaseClient
                    .from('posts')
                    .insert([
                        {
                            title,
                            type,
                            file_url: fileUrl,
                            audience
                        }
                    ]);
                
                if (insertError) throw insertError;
                
                alert('Post uploaded successfully!');
                uploadForm.reset();
                loadPosts(currentRole);
            } catch (error) {
                alert(error.message);
                hideLoading();
            } finally {
                hideLoading();
            }
        });
    }
    
    // Load posts based on role
    const loadPosts = async (role) => {
        showLoading();
        try {
            let query = window.supabaseClient.from('posts').select('*');
            
            // Filter posts by audience based on role
            if (role === 'student') {
                query = query.or(`audience.eq.student,audience.eq.all`);
            } else if (role === 'teacher') {
                query = query.or(`audience.eq.teacher,audience.eq.all`);
            } else if (role === 'admin') {
                query = query.order('created_at', { ascending: false });
            }
            
            const { data: posts, error } = await query;
            
            if (error) throw error;
            
            const postsList = document.getElementById('postsList');
            if (postsList) {
                if (posts.length === 0) {
                    postsList.innerHTML = `
                        <div class="text-center py-12">
                            <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                            <h3 class="mt-2 text-sm font-medium text-gray-900">No posts available</h3>
                            <p class="mt-1 text-sm text-gray-500">Check back later for new content.</p>
                        </div>
                    `;
                } else {
                    postsList.innerHTML = posts.map(post => `
                        <div class="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow duration-300">
                            <div class="flex justify-between items-start">
                                <div class="flex-1">
                                    <div class="flex items-center mb-2">
                                        ${post.type === 'pdf' ? '<span class="bg-red-100 text-red-800 text-xs font-semibold px-2 py-1 rounded">PDF</span>' : ''}
                                        ${post.type === 'image' ? '<span class="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">Image</span>' : ''}
                                        ${post.type === 'video' ? '<span class="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">Video</span>' : ''}
                                        <span class="ml-2 bg-gray-100 text-gray-800 text-xs font-semibold px-2 py-1 rounded">${post.audience}</span>
                                    </div>
                                    <h3 class="text-xl font-semibold text-gray-800 mb-2">${escapeHtml(post.title)}</h3>
                                    ${post.type === 'pdf' ? `
                                        <a href="${post.file_url}" target="_blank" class="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium mt-2">
                                            <svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                            </svg>
                                            View PDF
                                        </a>
                                    ` : ''}
                                    ${post.type === 'image' ? `
                                        <div class="mt-4">
                                            <img src="${post.file_url}" alt="${post.title}" class="max-w-full h-auto rounded-lg shadow-md">
                                        </div>
                                    ` : ''}
                                    ${post.type === 'video' ? `
                                        <div class="mt-4">
                                            <video controls class="w-full max-w-2xl rounded-lg shadow-md">
                                                <source src="${post.file_url}">
                                                Your browser does not support the video tag.
                                            </video>
                                        </div>
                                    ` : ''}
                                </div>
                                ${role === 'admin' ? `
                                    <button onclick="deletePost('${post.id}')" class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition duration-300 text-sm font-semibold ml-4">
                                        Delete
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    `).join('');
                }
            }
        } catch (error) {
            alert(error.message);
        } finally {
            hideLoading();
        }
    };
    
    // Delete post function (for admin)
    window.deletePost = async (postId) => {
        if (!confirm('Are you sure you want to delete this post?')) return;
        
        showLoading();
        try {
            const { error } = await window.supabaseClient
                .from('posts')
                .delete()
                .eq('id', postId);
            
            if (error) throw error;
            
            alert('Post deleted successfully!');
            loadPosts(currentRole);
        } catch (error) {
            alert(error.message);
            hideLoading();
        } finally {
            hideLoading();
        }
    };
    
    // Helper function to escape HTML
    function escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
    
    // Load posts
    await loadPosts(currentRole);
});
