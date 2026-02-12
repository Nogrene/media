const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');
const Admin = require('../models/Admin');
const Media = require('../models/Media');
const upload = require('../middleware/upload');
const { protectAdmin } = require('../middleware/auth');

/**
 * Generate JWT Token
 */
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

/**
 * Initialize default admin if none exists
 */
const initializeAdmin = async () => {
    try {
        const adminCount = await Admin.countDocuments();
        if (adminCount === 0) {
            await Admin.create({
                username: process.env.ADMIN_USERNAME || 'admin',
                password: process.env.ADMIN_PASSWORD || 'LIPAMSEE!41'
            });
            console.log('Default admin created');
        }
    } catch (error) {
        console.error('✗ Error initializing admin:', error.message);
        if (process.env.NODE_ENV === 'development') {
            console.error(error.stack);
        }
    }
};

// Initialize admin on module load
initializeAdmin();

/**
 * @route   POST /api/admin/login
 * @desc    Authenticate admin & get token
 * @access  Public
 */
router.post(
    '/login',
    [
        body('username').notEmpty().withMessage('Username is required'),
        body('password').notEmpty().withMessage('Password is required')
    ],
    async (req, res) => {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, password } = req.body;

        try {
            // Check for admin
            const admin = await Admin.findOne({ username });

            if (admin && (await admin.comparePassword(password))) {
                res.json({
                    _id: admin._id,
                    username: admin.username,
                    role: admin.role,
                    token: generateToken(admin._id)
                });
            } else {
                res.status(401).json({ message: 'Invalid credentials' });
            }
        } catch (error) {
            console.error('✗ Admin login error:', {
                username: req.body.username,
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
            res.status(500).json({ message: 'Server error during login' });
        }
    }
);

/**
 * @route   POST /api/admin/upload
 * @desc    Upload media file with password
 * @access  Private (Admin only)
 */
router.post('/upload', protectAdmin, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const { password } = req.body;

        if (!password || password.length < 4) {
            // Delete uploaded file if password is invalid
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ message: 'Password must be at least 4 characters' });
        }

        // Determine file type
        let fileType;
        if (req.file.mimetype.startsWith('video/')) {
            fileType = 'video';
        } else if (req.file.mimetype.startsWith('audio/')) {
            fileType = 'audio';
        } else if (req.file.mimetype.startsWith('image/')) {
            fileType = 'image';
        } else if (req.file.mimetype === 'application/pdf') {
            fileType = 'pdf';
        } else {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ message: 'Invalid file type' });
        }

        // Create media record
        const media = await Media.create({
            filename: req.file.filename,
            originalName: req.file.originalname,
            filepath: req.file.path,
            fileType,
            mimetype: req.file.mimetype,
            size: req.file.size,
            accessPassword: password,
            uploadedBy: req.admin._id
        });

        res.status(201).json({
            message: 'File uploaded successfully',
            media: {
                _id: media._id,
                originalName: media.originalName,
                fileType: media.fileType,
                size: media.size,
                createdAt: media.createdAt
            }
        });
    } catch (error) {
        // Delete file if database operation fails
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        console.error('✗ File upload error:', {
            filename: req.file?.originalname,
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
        res.status(500).json({ message: 'Error uploading file' });
    }
});

/**
 * @route   GET /api/admin/media
 * @desc    Get all uploaded media
 * @access  Private (Admin only)
 */
router.get('/media', protectAdmin, async (req, res) => {
    try {
        const media = await Media.find()
            .select('-accessPassword')
            .sort({ createdAt: -1 })
            .populate('uploadedBy', 'username');

        res.json(media);
    } catch (error) {
        console.error('✗ Fetch media error:', {
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
        res.status(500).json({ message: 'Error fetching media' });
    }
});

/**
 * @route   PUT /api/admin/media/:id
 * @desc    Update media metadata and/or password
 * @access  Private (Admin only)
 */
router.put('/media/:id', protectAdmin, async (req, res) => {
    try {
        const { originalName, password } = req.body;
        const media = await Media.findById(req.params.id);

        if (!media) {
            return res.status(404).json({ message: 'Media not found' });
        }

        // Update fields if provided
        if (originalName) {
            media.originalName = originalName;
        }

        if (password) {
            if (password.length < 4) {
                return res.status(400).json({ message: 'Password must be at least 4 characters' });
            }
            media.accessPassword = password;
        }

        await media.save();

        res.json({
            message: 'Media updated successfully',
            media: {
                _id: media._id,
                originalName: media.originalName,
                fileType: media.fileType,
                size: media.size
            }
        });
    } catch (error) {
        console.error('✗ Update media error:', {
            mediaId: req.params.id,
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
        res.status(500).json({ message: 'Error updating media' });
    }
});

/**
 * @route   DELETE /api/admin/media/:id
 * @desc    Delete media file
 * @access  Private (Admin only)
 */
router.delete('/media/:id', protectAdmin, async (req, res) => {
    try {
        const media = await Media.findById(req.params.id);

        if (!media) {
            return res.status(404).json({ message: 'Media not found' });
        }

        // Delete file from filesystem
        if (fs.existsSync(media.filepath)) {
            fs.unlinkSync(media.filepath);
        }

        // Delete from database
        await Media.findByIdAndDelete(req.params.id);

        res.json({ message: 'Media deleted successfully' });
    } catch (error) {
        console.error('✗ Delete media error:', {
            mediaId: req.params.id,
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
        res.status(500).json({ message: 'Error deleting media' });
    }
});

module.exports = router;
