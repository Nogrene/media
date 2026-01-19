// API Base URL
const API_URL = 'http://localhost:5000/api';

// Check authentication
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = 'index.html';
}

// State
let allMedia = [];
let currentFilter = 'all';
let currentMediaId = null;

// Utility: Show alert
function showAlert(container, message, type = 'error') {
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

// Get file icon
function getFileIcon(fileType) {
    const icons = {
        video: '🎥',
        audio: '🎵',
        image: '🖼️',
        pdf: '📄'
    };
    return icons[fileType] || '📁';
}

// Fetch media from API
async function fetchMedia() {
    const loading = document.getElementById('loading');
    const mediaGrid = document.getElementById('mediaGrid');
    const emptyState = document.getElementById('emptyState');

    loading.classList.remove('hidden');
    mediaGrid.innerHTML = '';

    try {
        const response = await fetch(`${API_URL}/media`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401) {
            localStorage.removeItem('token');
            window.location.href = 'index.html';
            return;
        }

        const data = await response.json();
        allMedia = data;

        loading.classList.add('hidden');

        if (allMedia.length === 0) {
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
            renderMedia();
        }
    } catch (error) {
        console.error('Error fetching media:', error);
        loading.classList.add('hidden');
        emptyState.classList.remove('hidden');
    }
}

// Render media grid
function renderMedia() {
    const mediaGrid = document.getElementById('mediaGrid');
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    // Filter media
    let filtered = allMedia;

    if (currentFilter !== 'all') {
        filtered = filtered.filter(m => m.fileType === currentFilter);
    }

    if (searchTerm) {
        filtered = filtered.filter(m =>
            m.originalName.toLowerCase().includes(searchTerm)
        );
    }

    // Render
    mediaGrid.innerHTML = '';

    filtered.forEach(media => {
        const card = document.createElement('div');
        card.className = 'media-item';
        card.onclick = () => openPasswordModal(media);

        card.innerHTML = `
      <div class="lock-badge">🔒</div>
      <div class="media-icon">${getFileIcon(media.fileType)}</div>
      <div class="media-info">
        <h3>${media.originalName}</h3>
        <div class="media-meta">
          <span class="media-type">${media.fileType}</span>
          <span>${formatFileSize(media.size)}</span>
        </div>
      </div>
    `;

        mediaGrid.appendChild(card);
    });

    if (filtered.length === 0) {
        mediaGrid.innerHTML = '<div class="text-center text-muted" style="grid-column: 1 / -1; padding: 2rem;">No files match your search</div>';
    }
}

// Open password modal
function openPasswordModal(media) {
    currentMediaId = media._id;
    document.getElementById('mediaName').textContent = media.originalName;
    document.getElementById('filePassword').value = '';
    document.getElementById('modal-alert').innerHTML = '';
    document.getElementById('passwordModal').classList.add('active');
}

// Close password modal
function closePasswordModal() {
    document.getElementById('passwordModal').classList.remove('active');
    currentMediaId = null;
}

// Verify password and load media
document.getElementById('passwordForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const password = document.getElementById('filePassword').value;
    const alertContainer = document.getElementById('modal-alert');

    try {
        const response = await fetch(`${API_URL}/media/${currentMediaId}/verify`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password })
        });

        const data = await response.json();

        if (response.ok) {
            closePasswordModal();
            loadMedia(data.media);
        } else {
            showAlert(alertContainer, data.message || 'Incorrect password', 'error');
        }
    } catch (error) {
        console.error('Error verifying password:', error);
        showAlert(alertContainer, 'Network error. Please try again.', 'error');
    }
});

// Load and display media
function loadMedia(media) {
    const modal = document.getElementById('mediaModal');
    const viewer = document.getElementById('mediaViewer');
    const title = document.getElementById('viewerTitle');

    title.textContent = media.originalName;
    viewer.innerHTML = '';

    const streamUrl = `${API_URL}/media/${media._id}/stream`;

    if (media.fileType === 'video') {
        viewer.innerHTML = `
      <video controls class="media-player" autoplay>
        <source src="${streamUrl}" type="${media.mimetype}">
        Your browser does not support video playback.
      </video>
    `;
    } else if (media.fileType === 'audio') {
        viewer.innerHTML = `
      <audio controls class="media-player" autoplay style="width: 100%;">
        <source src="${streamUrl}" type="${media.mimetype}">
        Your browser does not support audio playback.
      </audio>
    `;
    } else if (media.fileType === 'image') {
        viewer.innerHTML = `
      <div class="image-viewer" style="text-align: center;">
        <img src="${streamUrl}" alt="${media.originalName}" style="max-width: 100%; max-height: 70vh; border-radius: var(--radius-md); box-shadow: var(--shadow-lg);">
        <br>
        <a href="${streamUrl}" download="${media.originalName}" class="btn btn-primary mt-2">
          📥 Download Image
        </a>
      </div>
    `;
    } else if (media.fileType === 'pdf') {
        viewer.innerHTML = `
      <div class="pdf-viewer">
        <iframe src="${streamUrl}" style="width: 100%; height: 600px; border: none; border-radius: var(--radius-md);"></iframe>
        <a href="${streamUrl}" download="${media.originalName}" class="btn btn-primary mt-2" style="width: 100%;">
          📥 Download PDF
        </a>
      </div>
    `;
    }

    modal.classList.add('active');
}

// Close media modal
function closeMediaModal() {
    const modal = document.getElementById('mediaModal');
    const viewer = document.getElementById('mediaViewer');

    // Stop any playing media
    const video = viewer.querySelector('video');
    const audio = viewer.querySelector('audio');
    if (video) video.pause();
    if (audio) audio.pause();

    viewer.innerHTML = '';
    modal.classList.remove('active');
}

// Search functionality
document.getElementById('searchInput').addEventListener('input', renderMedia);

// Filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderMedia();
    });
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
});

// Initialize
fetchMedia();
