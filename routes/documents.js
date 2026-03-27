const express = require('express');
const multer = require('multer');
const path = require('path');
const documentController = require('../controllers/documentController');
const auth = require('../middleware/auth');
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('只支持Word文档格式 (.docx, .doc)'), false);
    }
  }
});

const router = express.Router();

router.post('/upload', auth, upload.single('document'), documentController.uploadDocument);

router.get('/', auth, documentController.getDocuments);

router.get('/:id', auth, documentController.getDocument);

router.put('/:id', auth, documentController.updateDocument);

router.delete('/:id', auth, documentController.deleteDocument);

router.get('/:id/versions', auth, documentController.getDocumentVersions);

module.exports = router;