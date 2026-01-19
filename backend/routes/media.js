const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const Media = require('../models/Media');
const { protect } = require('../middleware/auth');

/**
 * @route   GET /api/media
 * @desc    Get all available media (without passwords)
 * @access  Private (User only)
 */
router.get('/', protect, async (req, res) => {
    try {
        const media = await Media.find()
            .select('-accessPassword -filepath')
            .sort({ createdAt: -1 });

        res.json(media);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching media' });
    }
});

/**
 * @route   POST /api/media/:id/verify
 * @desc    Verify file password and issue access token
 * @access  Private (User only)
 */
router.post('/:id/verify', protect, async (req, res) => {
    try {
        const { password } = req.body;
        const media = await Media.findById(req.params.id);

        if (!media) {
            return res.status(404).json({ message: 'Media not found' });
        }

        if (!password) {
            return res.status(400).json({ message: 'Password is required' });
        }

        // Compare password
        const isMatch = await media.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect password' });
        }

        // Password is correct - return success with file info
        res.json({
            message: 'Password verified',
            media: {
                _id: media._id,
                originalName: media.originalName,
                fileType: media.fileType,
                mimetype: media.mimetype,
                size: media.size
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error verifying password' });
    }
});

/**
 * @route   GET /api/media/:id/stream
 * @desc    Stream media file (after password verification)
 * @access  Private (User only)
 */
router.get('/:id/stream', protect, async (req, res) => {
    try {
        const media = await Media.findById(req.params.id);

        if (!media) {
            return res.status(404).json({ message: 'Media not found' });
        }

        // Check if file exists
        if (!fs.existsSync(media.filepath)) {
            return res.status(404).json({ message: 'File not found on server' });
        }

        // Get file stats for proper streaming
        const stat = fs.statSync(media.filepath);
        const fileSize = stat.size;
        const range = req.headers.range;

        if (range) {
            // Handle range request (for video/audio seeking)
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunksize = (end - start) + 1;
            const file = fs.createReadStream(media.filepath, { start, end });
            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': media.mimetype,
            };
            res.writeHead(206, head);
            file.pipe(res);
        } else {
            // Send entire file
            const head = {
                'Content-Length': fileSize,
                'Content-Type': media.mimetype,
            };
            res.writeHead(200, head);
            fs.createReadStream(media.filepath).pipe(res);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error streaming file' });
    }
});

module.exports = router;
