const mongoose = require('mongoose');

const versionSchema = new mongoose.Schema({
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: true,
    index: true
  },
  version: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  originalFileName: {
    type: String,
    required: true
  },
  storedFileName: {
    type: String,
    required: true,
    unique: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  changes: {
    type: String,
    trim: true
  },
  signatory: {
    type: String,
    trim: true
  },
  signatureDate: {
    type: Date
  },
  effectiveDate: {
    type: Date
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isCurrent: {
    type: Boolean,
    default: false
  },
  previousVersion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Version'
  },
  comparisonData: {
    addedLines: [Number],
    removedLines: [Number],
    modifiedLines: [Number]
  }
}, {
  timestamps: true
});

versionSchema.index({ documentId: 1, version: -1 });
versionSchema.index({ uploadedBy: 1, createdAt: -1 });

module.exports = mongoose.model('Version', versionSchema);