# Secure Media Platform

A secure media platform where users can sign up, log in, and access protected media files (video, audio, images, PDF). Each file is locked with its own password set by the admin.

## Features

### User Features
- Sign up with email and password
- Secure login with JWT authentication
- Browse available media files
- Search and filter by file type (video, audio, images, PDF)
- Password-protected file access
- Stream video and audio files
- View and download PDF files

### Admin Features
- Separate admin login
- Upload media files (video, audio, images, PDF)
- Set unique access password for each file
- Manage uploaded files (edit, delete)
- View upload history

## Tech Stack

**Frontend:**
- HTML5
- CSS3 (Modern dark theme with glassmorphism)
- Vanilla JavaScript

**Backend:**
- Node.js
- Express
- MongoDB
- JWT Authentication
- Bcrypt for password hashing
- Multer for file uploads

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (running locally or remote connection)

### Setup Steps

1. **Clone or navigate to the project directory:**
```bash
cd C:\Users\HomePC\Desktop\paidfor
```

2. **Install backend dependencies:**
```bash
cd backend
npm install
```

3. **Configure environment variables:**
Edit `backend/.env` if needed:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/secure-media-platform
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
ADMIN_USERNAME=admin
ADMIN_PASSWORD=LIPAMSEE!41
```

4. **Start MongoDB:**
Make sure MongoDB is running on your system.

5. **Start the backend server:**
```bash
npm start
```

The server will run on `http://localhost:5000`

6. **Open the frontend:**
Navigate to the frontend directory and open `index.html` in your browser, or use a local server:
```bash
cd ../frontend
# If you have Python installed:
python -m http.server 8080
```

Then visit `http://localhost:8080`

## Usage

### For Users

1. **Sign Up:**
   - Go to `signup.html`
   - Enter your email and password (min 8 characters)
   - Create your account

2. **Log In:**
   - Go to `index.html`
   - Enter your credentials
   - Access your media dashboard

3. **Access Media:**
   - Browse available files
   - Use search and filters
   - Click on a file
   - Enter the file's password
   - View/play the media

### For Admin

1. **Log In:**
   - Go to `admin-login.html`
   - Username: `admin`
   - Password: `LIPAMSEE!41`

2. **Upload Media:**
   - Click or drag-and-drop files
   - Supported: Video, Audio, Images, PDF (max 100MB)
   - Set an access password (min 4 characters)
   - Upload

3. **Manage Media:**
   - View uploaded files
   - Edit file names and passwords
   - Delete files

## Security Features

- All passwords hashed with bcrypt
- JWT-based authentication
- Protected API routes
- File-level password protection
- Input validation
- File type restrictions
- Size limits on uploads

## Project Structure

```
paidfor/
├── backend/
│   ├── config/db.js
│   ├── models/
│   ├── middleware/
│   ├── routes/
│   ├── utils/
│   ├── uploads/
│   ├── server.js
│   └── package.json
└── frontend/
    ├── css/styles.css
    ├── js/
    ├── index.html
    ├── signup.html
    ├── dashboard.html
    ├── admin-login.html
    └── admin-panel.html
```

## Default Credentials

**Admin:**

*Note: Change these in production!*

## API Endpoints

### User Auth
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login

### Admin
- `POST /api/admin/login` - Admin login
- `POST /api/admin/upload` - Upload media (protected)
- `GET /api/admin/media` - List all media (protected)
- `PUT /api/admin/media/:id` - Update media (protected)
- `DELETE /api/admin/media/:id` - Delete media (protected)

### Media Access
- `GET /api/media` - List available media (protected)
- `POST /api/media/:id/verify` - Verify file password (protected)
- `GET /api/media/:id/stream` - Stream media file (protected)

## License

ISC
