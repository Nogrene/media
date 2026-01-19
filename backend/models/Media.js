const mongoose = require('mongoose');
const { hashPassword, comparePassword } = require('../utils/password');

const mediaSchema = new mongoose.Schema({
    filename: {
        type: String,
        required: true
    },
    originalName: {
        type: String,
        required: true
    },
    filepath: {
        type: String,
        required: true
    },
    fileType: {
        type: String,
        required: true,
        enum: ['video', 'audio', 'image', 'pdf']
    },
    mimetype: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    accessPassword: {
        type: String,
        required: [true, 'Access password is required']
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash access password before saving
mediaSchema.pre('save', async function (next) {
    if (!this.isModified('accessPassword')) {
        return next();
    }
    this.accessPassword = await hashPassword(this.accessPassword);
    next();
});

// Method to compare access password
mediaSchema.methods.comparePassword = async function (candidatePassword) {
    return await comparePassword(candidatePassword, this.accessPassword);
};

module.exports = mongoose.model('Media', mediaSchema);
