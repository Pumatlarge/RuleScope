const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    index: true
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
  mimeType: {
    type: String,
    required: true,
    default: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  },
  department: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  documentType: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  category: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  keywords: [{
    type: String,
    trim: true
  }],
  signatory: {
    type: String,
    trim: true
  },
  signatureDate: {
    type: Date,
    index: true
  },
  effectiveDate: {
    type: Date,
    index: true
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'archived', 'expired'],
    default: 'draft'
  },
  version: {
    type: String,
    required: true,
    default: '1.0'
  },
  isLatest: {
    type: Boolean,
    default: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  description: {
    type: String,
    trim: true
  },
  metadata: {
    pageCount: Number,
    wordCount: Number,
    createdDate: Date,
    modifiedDate: Date,
    approvalNumber: String,
    relatedDocuments: [String]
  }
}, {
  timestamps: true
});

documentSchema.index({ title: 'text', content: 'text', keywords: 'text' });
documentSchema.index({ department: 1, documentType: 1 });
documentSchema.index({ status: 1, effectiveDate: -1 });
documentSchema.index({ uploadedBy: 1, createdAt: -1 });

module.exports = mongoose.model('Document', documentSchema);