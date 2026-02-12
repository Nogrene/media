// API Base URL
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : 'https://media-9mxu.onrender.com/api';

// Utility: Show alert message
function showAlert(message, type = 'error') {
    const container = document.getElementById('alert-container');
    if (!container) return;

    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    container.innerHTML = '';
    container.appendChild(alert);

    setTimeout(() => {
        alert.remove();
    }, 5000);
}

// Utility: Get token from localStorage
function getToken() {
    return localStorage.getItem('token');
}

// Utility: Set token in localStorage
function setToken(token) {
    localStorage.setItem('token', token);
}

// Utility: Remove token from localStorage
function removeToken() {
    localStorage.removeItem('token');
}

// Utility: Check if user is authenticated
function isAuthenticated() {
    return !!getToken();
}

// Redirect to dashboard if already authenticated
function redirectIfAuthenticated() {
    if (isAuthenticated() && window.location.pathname.includes('index.html')) {
        window.location.href = 'dashboard.html';
    }
    if (isAuthenticated() && window.location.pathname.includes('signup.html')) {
        window.location.href = 'dashboard.html';
    }
}

// Handle signup
const signupForm = document.getElementById('signupForm');
if (signupForm) {
    redirectIfAuthenticated();

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Client-side validation
        if (password !== confirmPassword) {
            showAlert('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            showAlert('Password must be at least 8 characters long');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                setToken(data.token);
                showAlert('Account created successfully! Redirecting...', 'success');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                showAlert(data.message || 'Signup failed');
            }
        } catch (error) {
            console.error('Signup error:', error);
            showAlert('Network error. Please try again.');
        }
    });
}

// Handle login
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    redirectIfAuthenticated();

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                setToken(data.token);
                showAlert('Login successful! Redirecting...', 'success');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                showAlert(data.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            showAlert('Network error. Please try again.');
        }
    });
}
