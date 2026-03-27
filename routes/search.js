const express = require('express');
const searchController = require('../controllers/searchController');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/documents', auth, searchController.searchDocuments);

router.get('/document-types', auth, searchController.getDocumentTypes);

router.get('/categories', auth, searchController.getCategories);

router.get('/departments', auth, searchController.getDepartments);

router.get('/suggestions', auth, searchController.getAdvancedSearchSuggestions);

module.exports = router;