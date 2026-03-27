const Document = require('../models/Document');
const Version = require('../models/Version');
const DocumentProcessor = require('../utils/documentProcessor');
const path = require('path');
const fs = require('fs').promises;

class DocumentController {
  constructor() {
    this.documentProcessor = new DocumentProcessor();
  }

  async uploadDocument(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: '未选择文件' });
      }

      const documentInfo = await this.documentProcessor.processDocument(req.file.path);
      const keywords = this.documentProcessor.extractKeywords(documentInfo.content);
      const wordCount = this.documentProcessor.countWords(documentInfo.content);

      const document = new Document({
        title: req.body.title || documentInfo.metadata?.fileName || '未命名文档',
        content: documentInfo.content,
        originalFileName: req.file.originalname,
        storedFileName: req.file.filename,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        department: req.body.department,
        documentType: req.body.documentType,
        category: req.body.category,
        keywords: keywords,
        signatory: documentInfo.signatory || req.body.signatory,
        signatureDate: documentInfo.signatureDate || req.body.signatureDate,
        effectiveDate: documentInfo.effectiveDate || req.body.effectiveDate,
        uploadedBy: req.user.id,
        tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [],
        description: req.body.description,
        metadata: {
          ...documentInfo.metadata,
          wordCount: wordCount
        }
      });

      await document.save();

      const version = new Version({
        documentId: document._id,
        version: document.version,
        title: document.title,
        content: document.content,
        originalFileName: document.originalFileName,
        storedFileName: document.storedFileName,
        fileSize: document.fileSize,
        signatory: document.signatory,
        signatureDate: document.signatureDate,
        effectiveDate: document.effectiveDate,
        uploadedBy: document.uploadedBy,
        isCurrent: true
      });

      await version.save();

      await fs.unlink(req.file.path);

      res.status(201).json({
        message: '文档上传成功',
        document: {
          id: document._id,
          title: document.title,
          version: document.version,
          department: document.department,
          documentType: document.documentType,
          signatureDate: document.signatureDate,
          effectiveDate: document.effectiveDate
        }
      });
    } catch (error) {
      console.error('文档上传失败:', error);
      res.status(500).json({ error: '文档上传失败', details: error.message });
    }
  }

  async getDocuments(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        department,
        documentType,
        category,
        status,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const filter = {};
      if (department) filter.department = department;
      if (documentType) filter.documentType = documentType;
      if (category) filter.category = category;
      if (status) filter.status = status;

      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const skip = (page - 1) * limit;

      const [documents, total] = await Promise.all([
        Document.find(filter)
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit))
          .populate('uploadedBy', 'username fullName department')
          .lean(),
        Document.countDocuments(filter)
      ]);

      res.json({
        documents,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('获取文档列表失败:', error);
      res.status(500).json({ error: '获取文档列表失败', details: error.message });
    }
  }

  async getDocument(req, res) {
    try {
      const document = await Document.findById(req.params.id)
        .populate('uploadedBy', 'username fullName department')
        .lean();

      if (!document) {
        return res.status(404).json({ error: '文档不存在' });
      }

      const versions = await Version.find({ documentId: document._id })
        .sort({ version: -1 })
        .populate('uploadedBy', 'username fullName department')
        .lean();

      res.json({
        document,
        versions
      });
    } catch (error) {
      console.error('获取文档详情失败:', error);
      res.status(500).json({ error: '获取文档详情失败', details: error.message });
    }
  }

  async updateDocument(req, res) {
    try {
      const document = await Document.findById(req.params.id);
      if (!document) {
        return res.status(404).json({ error: '文档不存在' });
      }

      const oldVersion = document.version;
      const newVersion = this.incrementVersion(oldVersion);

      Object.assign(document, req.body);
      document.version = newVersion;
      document.isLatest = true;

      document.markModified('metadata');
      await document.save();

      const version = new Version({
        documentId: document._id,
        version: document.version,
        title: document.title,
        content: document.content,
        originalFileName: document.originalFileName,
        storedFileName: document.storedFileName,
        fileSize: document.fileSize,
        signatory: document.signatory,
        signatureDate: document.signatureDate,
        effectiveDate: document.effectiveDate,
        uploadedBy: req.user.id,
        isCurrent: true,
        changes: req.body.changes || '',
        previousVersion: oldVersion
      });

      await version.save();

      res.json({
        message: '文档更新成功',
        document: {
          id: document._id,
          title: document.title,
          version: document.version,
          changes: version.changes
        }
      });
    } catch (error) {
      console.error('更新文档失败:', error);
      res.status(500).json({ error: '更新文档失败', details: error.message });
    }
  }

  async deleteDocument(req, res) {
    try {
      const document = await Document.findById(req.params.id);
      if (!document) {
        return res.status(404).json({ error: '文档不存在' });
      }

      if (document.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: '无权限删除此文档' });
      }

      await Document.findByIdAndDelete(req.params.id);
      await Version.deleteMany({ documentId: req.params.id });

      res.json({ message: '文档删除成功' });
    } catch (error) {
      console.error('删除文档失败:', error);
      res.status(500).json({ error: '删除文档失败', details: error.message });
    }
  }

  async getDocumentVersions(req, res) {
    try {
      const versions = await Version.find({ documentId: req.params.id })
        .sort({ version: -1 })
        .populate('uploadedBy', 'username fullName department')
        .lean();

      res.json({ versions });
    } catch (error) {
      console.error('获取文档版本失败:', error);
      res.status(500).json({ error: '获取文档版本失败', details: error.message });
    }
  }

  incrementVersion(version) {
    const parts = version.split('.');
    const major = parseInt(parts[0] || 0);
    const minor = parseInt(parts[1] || 0);
    
    if (minor >= 99) {
      return `${major + 1}.0`;
    } else {
      return `${major}.${minor + 1}`;
    }
  }
}

module.exports = new DocumentController();