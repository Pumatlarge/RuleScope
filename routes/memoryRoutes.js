const express = require('express');
const memoryController = require('../controllers/memoryController');
const router = express.Router();

// 认证路由
router.post('/auth/login', memoryController.login);
router.post('/auth/register', memoryController.register);
router.get('/auth/me', memoryController.getProfile);
router.put('/auth/me', memoryController.updateProfile);

// 文档路由
router.get('/documents', memoryController.getDocuments);
router.get('/documents/:id', memoryController.getDocument);

// 搜索路由
router.get('/search/documents', memoryController.searchDocuments);
router.get('/search/document-types', memoryController.getDocumentTypes);
router.get('/search/categories', memoryController.getCategories);
router.get('/search/departments', memoryController.getDepartments);
router.get('/search/suggestions', memoryController.getSuggestions);

module.exports = router;