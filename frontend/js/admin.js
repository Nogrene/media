// API Base URL
const API_URL = 'http://localhost:5000/api';

// State
let adminToken = localStorage.getItem('adminToken');
let allMedia = [];
let deleteMediaId = null;

// Utility: Show alert
function showAlert(containerId, message, type = 'error') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    container.innerHTML = '';
    container.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

// Admin Login
const adminLoginForm = document.getElementById('adminLoginForm');
if (adminLoginForm) {
    // Redirect if already authenticated
    if (adminToken) {
        window.location.href = 'admin-panel.html';
    }

    adminLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(`${API_URL}/admin/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('adminToken', data.token);
                showAlert('alert-container', 'Login successful! Redirecting...', 'success');
                setTimeout(() => {
                    window.location.href = 'admin-panel.html';
                }, 1000);
            } else {
                showAlert('alert-container', data.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            showAlert('alert-container', 'Network error. Please try again.');
        }
    });
}

// Admin Panel
if (window.location.pathname.includes('admin-panel.html')) {
    // Check authentication
    if (!adminToken) {
        window.location.href = 'admin-login.html';
    }

    // File upload handling
    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('fileInput');
    const uploadForm = document.getElementById('uploadForm');
    const fileInfo = document.getElementById('fileInfo');

    // Click to upload
    uploadZone.addEventListener('click', () => {
        fileInput.click();
    });

    // Drag and drop
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('dragover');
    });

    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('dragover');
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');

        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            displayFileInfo(e.dataTransfer.files[0]);
        }
    });

    // File selection
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            displayFileInfo(e.target.files[0]);
        }
    });

    // Display file info
    function displayFileInfo(file) {
        document.getElementById('fileName').textContent = file.name;
        document.getElementById('fileSize').textContent = formatFileSize(file.size);
        fileInfo.classList.remove('hidden');
    }

    // Upload form submission
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const file = fileInput.files[0];
        const password = document.getElementById('filePassword').value;

        if (!file) {
            showAlert('upload-alert', 'Please select a file');
            return;
        }

        if (password.length < 4) {
            showAlert('upload-alert', 'Password must be at least 4 characters');
            return;
        }

        // Create FormData
        const formData = new FormData();
        formData.append('file', file);
        formData.append('password', password);

        // Show loading state
        const submitBtn = uploadForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Uploading...';
        submitBtn.disabled = true;

        try {
            const response = await fetch(`${API_URL}/admin/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${adminToken}`
                },
                body: formData
            });

            const data = await response.json();

            if (response.ok) {
                showAlert('upload-alert', 'File uploaded successfully!', 'success');
                uploadForm.reset();
                fileInfo.classList.add('hidden');
                fetchMedia();
            } else {
                showAlert('upload-alert', data.message || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            showAlert('upload-alert', 'Network error. Please try again.');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });

    // Fetch media
    async function fetchMedia() {
        const loading = document.getElementById('loading');
        const emptyState = document.getElementById('emptyState');
        const mediaTable = document.getElementById('mediaTable');

        loading.classList.remove('hidden');

        try {
            const response = await fetch(`${API_URL}/admin/media`, {
                headers: {
                    'Authorization': `Bearer ${adminToken}`
                }
            });

            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('adminToken');
                window.location.href = 'admin-login.html';
                return;
            }

            const data = await response.json();
            allMedia = data;

            loading.classList.add('hidden');

            if (allMedia.length === 0) {
                emptyState.classList.remove('hidden');
                mediaTable.classList.add('hidden');
            } else {
                emptyState.classList.add('hidden');
                mediaTable.classList.remove('hidden');
                renderMediaTable();
            }
        } catch (error) {
            console.error('Error fetching media:', error);
            loading.classList.add('hidden');
        }
    }

    // Render media table
    function renderMediaTable() {
        const tbody = document.getElementById('mediaTableBody');
        tbody.innerHTML = '';

        allMedia.forEach(media => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
        <td>${media.originalName}</td>
        <td><span class="media-type">${media.fileType}</span></td>
        <td>${formatFileSize(media.size)}</td>
        <td>${formatDate(media.createdAt)}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-secondary btn-icon" onclick="openEditModal('${media._id}')" title="Edit">✏️</button>
            <button class="btn btn-danger btn-icon" onclick="openDeleteModal('${media._id}')" title="Delete">🗑️</button>
          </div>
        </td>
      `;
            tbody.appendChild(tr);
        });
    }

    // Edit modal
    window.openEditModal = function (mediaId) {
        const media = allMedia.find(m => m._id === mediaId);
        if (!media) return;

        document.getElementById('editMediaId').value = media._id;
        document.getElementById('editFileName').value = media.originalName;
        document.getElementById('editPassword').value = '';
        document.getElementById('edit-alert').innerHTML = '';
        document.getElementById('editModal').classList.add('active');
    };

    window.closeEditModal = function () {
        document.getElementById('editModal').classList.remove('active');
    };

    // Edit form submission
    document.getElementById('editForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const mediaId = document.getElementById('editMediaId').value;
        const originalName = document.getElementById('editFileName').value.trim();
        const password = document.getElementById('editPassword').value;

        const body = { originalName };
        if (password) {
            if (password.length < 4) {
                showAlert('edit-alert', 'Password must be at least 4 characters');
                return;
            }
            body.password = password;
        }

        try {
            const response = await fetch(`${API_URL}/admin/media/${mediaId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${adminToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (response.ok) {
                showAlert('edit-alert', 'Media updated successfully!', 'success');
                setTimeout(() => {
                    closeEditModal();
                    fetchMedia();
                }, 1000);
            } else {
                showAlert('edit-alert', data.message || 'Update failed');
            }
        } catch (error) {
            console.error('Update error:', error);
            showAlert('edit-alert', 'Network error. Please try again.');
        }
    });

    // Delete modal
    window.openDeleteModal = function (mediaId) {
        const media = allMedia.find(m => m._id === mediaId);
        if (!media) return;

        deleteMediaId = mediaId;
        document.getElementById('deleteFileName').textContent = media.originalName;
        document.getElementById('deleteModal').classList.add('active');
    };

    window.closeDeleteModal = function () {
        document.getElementById('deleteModal').classList.remove('active');
        deleteMediaId = null;
    };

    // Confirm delete
    document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
        if (!deleteMediaId) return;

        try {
            const response = await fetch(`${API_URL}/admin/media/${deleteMediaId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${adminToken}`
                }
            });

            if (response.ok) {
                closeDeleteModal();
                fetchMedia();
            } else {
                const data = await response.json();
                alert(data.message || 'Delete failed');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('Network error. Please try again.');
        }
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('adminToken');
        window.location.href = 'admin-login.html';
    });

    // Initialize
    fetchMedia();
}
