// Dashboard Management System
class DashboardManager {
    constructor() {
        this.loadingDiv = document.getElementById('loading');
        this.currentRole = null;
        this.currentUser = null;
        this.posts = [];
        this.currentFilter = 'all';
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

    async init() {
        try {
            this.showLoading('Initializing dashboard...');

            // Check authentication
            const { data: { user }, error: authError } = await window.supabaseClient.auth.getUser();
            
            if (authError || !user) {
                window.location.href = '/login.html';
                return;
            }

            this.currentUser = user;

            // Get user role
            const { data: userData, error: userError } = await window.supabaseClient
                .from('users')
                .select('role')
                .eq('id', user.id)
                .single();

            if (userError) throw userError;

            this.currentRole = userData.role;
            
            // Set user email in UI
            const userEmailSpan = document.getElementById('userEmail');
            if (userEmailSpan) {
                userEmailSpan.textContent = user.email;
            }

            // Setup logout button
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', async () => {
                    await this.logout();
                });
            }

            // Setup upload form for admin
            if (this.currentRole === 'admin') {
                this.setupUploadForm();
                await this.loadStats();
            }

            // Setup filter buttons
            this.setupFilters();

            // Load posts
            await this.loadPosts();

        } catch (error) {
            console.error('Init error:', error);
            alert(error.message);
        } finally {
            this.hideLoading();
        }
    }

    async logout() {
        try {
            this.showLoading('Logging out...');
            await window.supabaseClient.auth.signOut();
            sessionStorage.clear();
            window.location.href = '/index.html';
        } catch (error) {
            this.hideLoading();
            alert(error.message);
        }
    }

    async loadStats() {
        try {
            // Count total posts
            const { count: postsCount } = await window.supabaseClient
                .from('posts')
                .select('*', { count: 'exact', head: true });

            // Count students
            const { count: studentsCount } = await window.supabaseClient
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'student');

            // Count teachers
            const { count: teachersCount } = await window.supabaseClient
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'teacher');

            const totalPostsSpan = document.getElementById('totalPosts');
            const totalStudentsSpan = document.getElementById('totalStudents');
            const totalTeachersSpan = document.getElementById('totalTeachers');

            if (totalPostsSpan) totalPostsSpan.textContent = postsCount || 0;
            if (totalStudentsSpan) totalStudentsSpan.textContent = studentsCount || 0;
            if (totalTeachersSpan) totalTeachersSpan.textContent = teachersCount || 0;

        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    setupUploadForm() {
        const uploadForm = document.getElementById('uploadForm');
        if (uploadForm) {
            uploadForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.uploadPost();
            });
        }
    }

    async uploadPost() {
        this.showLoading('Uploading file...');

        const title = document.getElementById('title').value.trim();
        const type = document.getElementById('type').value;
        const audience = document.getElementById('audience').value;
        const file = document.getElementById('file').files[0];

        if (!title) {
            alert('Please enter a title');
            this.hideLoading();
            return;
        }

        if (!file) {
            alert('Please select a file');
            this.hideLoading();
            return;
        }

        // Validate file size (max 50MB)
        if (file.size > 50 * 1024 * 1024) {
            alert('File size must be less than 50MB');
            this.hideLoading();
            return;
        }

        try {
            // Generate unique filename
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

            // Upload to storage
            const { data: uploadData, error: uploadError } = await window.supabaseClient.storage
                .from('files')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: publicUrlData } = window.supabaseClient.storage
                .from('files')
                .getPublicUrl(fileName);

            const fileUrl = publicUrlData.publicUrl;

            // Save to database
            const { error: insertError } = await window.supabaseClient
                .from('posts')
                .insert([{
                    title,
                    type,
                    file_url: fileUrl,
                    audience,
                    created_by: this.currentUser.id,
                    created_at: new Date().toISOString()
                }]);

            if (insertError) throw insertError;

            alert('Post uploaded successfully!');
            document.getElementById('uploadForm').reset();
            await this.loadPosts();
            await this.loadStats();

        } catch (error) {
            alert(error.message);
        } finally {
            this.hideLoading();
        }
    }

    setupFilters() {
        const filterAll = document.getElementById('filterAll');
        const filterPDF = document.getElementById('filterPDF');
        const filterImage = document.getElementById('filterImage');
        const filterVideo = document.getElementById('filterVideo');

        if (filterAll) {
            filterAll.addEventListener('click', () => {
                this.currentFilter = 'all';
                this.updateFilterButtons('all');
                this.renderPosts();
            });
        }

        if (filterPDF) {
            filterPDF.addEventListener('click', () => {
                this.currentFilter = 'pdf';
                this.updateFilterButtons('pdf');
                this.renderPosts();
            });
        }

        if (filterImage) {
            filterImage.addEventListener('click', () => {
                this.currentFilter = 'image';
                this.updateFilterButtons('image');
                this.renderPosts();
            });
        }

        if (filterVideo) {
            filterVideo.addEventListener('click', () => {
                this.currentFilter = 'video';
                this.updateFilterButtons('video');
                this.renderPosts();
            });
        }
    }

    updateFilterButtons(activeFilter) {
        const filters = ['all', 'pdf', 'image', 'video'];
        const buttons = {
            all: document.getElementById('filterAll'),
            pdf: document.getElementById('filterPDF'),
            image: document.getElementById('filterImage'),
            video: document.getElementById('filterVideo')
        };

        filters.forEach(filter => {
            const btn = buttons[filter];
            if (btn) {
                if (filter === activeFilter) {
                    btn.className = this.currentRole === 'student' 
                        ? 'px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold'
                        : 'px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold';
                } else {
                    btn.className = 'px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-300';
                }
            }
        });
    }

    async loadPosts() {
        try {
            this.showLoading('Loading content...');

            let query = window.supabaseClient
                .from('posts')
                .select('*')
                .order('created_at', { ascending: false });

            // Filter by audience based on role
            if (this.currentRole === 'student') {
                query = query.or(`audience.eq.student,audience.eq.all`);
            } else if (this.currentRole === 'teacher') {
                query = query.or(`audience.eq.teacher,audience.eq.all`);
            }

            const { data: posts, error } = await query;

            if (error) throw error;

            this.posts = posts || [];
            this.renderPosts();

        } catch (error) {
            console.error('Error loading posts:', error);
            alert(error.message);
        } finally {
            this.hideLoading();
        }
    }

    renderPosts() {
        const postsList = document.getElementById('postsList');
        if (!postsList) return;

        let filteredPosts = this.posts;
        
        // Apply type filter
        if (this.currentFilter !== 'all') {
            filteredPosts = this.posts.filter(post => post.type === this.currentFilter);
        }

        if (filteredPosts.length === 0) {
            postsList.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <h3 class="mt-2 text-sm font-medium text-gray-900">No posts available</h3>
                    <p class="mt-1 text-sm text-gray-500">Check back later for new content.</p>
                </div>
            `;
            return;
        }

        const gridCols = this.currentRole === 'admin' ? '' : 'grid md:grid-cols-2 lg:grid-cols-3';
        postsList.className = this.currentRole === 'admin' ? 'space-y-4' : `grid md:grid-cols-2 lg:grid-cols-3 gap-6`;
        
        postsList.innerHTML = filteredPosts.map(post => this.renderPostCard(post)).join('');
    }

    renderPostCard(post) {
        const isAdmin = this.currentRole === 'admin';
        
        let contentHtml = '';
        
        if (post.type === 'pdf') {
            contentHtml = `
                <a href="${post.file_url}" target="_blank" class="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium mt-3">
                    <svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    View Document
                </a>
            `;
        } else if (post.type === 'image') {
            contentHtml = `
                <div class="mt-3">
                    <img src="${post.file_url}" alt="${this.escapeHtml(post.title)}" class="w-full h-48 object-cover rounded-lg shadow-md">
                </div>
            `;
        } else if (post.type === 'video') {
            contentHtml = `
                <div class="mt-3">
                    <video controls class="w-full rounded-lg shadow-md">
                        <source src="${post.file_url}">
                        Your browser does not support the video tag.
                    </video>
                </div>
            `;
        }

        const cardClass = isAdmin 
            ? 'border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow duration-300'
            : 'bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300';

        const typeColors = {
            pdf: 'bg-red-100 text-red-800',
            image: 'bg-green-100 text-green-800',
            video: 'bg-blue-100 text-blue-800'
        };

        const audienceColors = {
            student: 'bg-yellow-100 text-yellow-800',
            teacher: 'bg-purple-100 text-purple-800',
            all: 'bg-gray-100 text-gray-800'
        };

        return `
            <div class="${cardClass}">
                <div class="${isAdmin ? '' : 'p-6'}">
                    <div class="flex items-center justify-between mb-3">
                        <div class="flex space-x-2">
                            <span class="text-xs font-semibold px-2 py-1 rounded ${typeColors[post.type]}">${post.type.toUpperCase()}</span>
                            <span class="text-xs font-semibold px-2 py-1 rounded ${audienceColors[post.audience]}">${post.audience}</span>
                        </div>
                        ${isAdmin ? `
                            <button onclick="window.dashboardManager.deletePost('${post.id}')" class="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition text-sm">
                                Delete
                            </button>
                        ` : ''}
                    </div>
                    <h3 class="text-xl font-semibold text-gray-800 mb-2">${this.escapeHtml(post.title)}</h3>
                    <p class="text-xs text-gray-500 mb-3">${new Date(post.created_at).toLocaleDateString()}</p>
                    ${contentHtml}
                </div>
            </div>
        `;
    }

    async deletePost(postId) {
        if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) return;

        this.showLoading('Deleting post...');
        try {
            const { error } = await window.supabaseClient
                .from('posts')
                .delete()
                .eq('id', postId);

            if (error) throw error;

            alert('Post deleted successfully!');
            await this.loadPosts();
            await this.loadStats();

        } catch (error) {
            alert(error.message);
        } finally {
            this.hideLoading();
        }
    }

    escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
}

// Initialize dashboard
let dashboardManager = null;
document.addEventListener('DOMContentLoaded', () => {
    dashboardManager = new DashboardManager();
    window.dashboardManager = dashboardManager;
});
