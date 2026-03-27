const Document = require('../models/Document');

class SearchController {
  async searchDocuments(req, res) {
    try {
      const {
        query = '',
        department = '',
        documentType = '',
        category = '',
        status = '',
        dateFrom = '',
        dateTo = '',
        signatureDateFrom = '',
        signatureDateTo = '',
        effectiveDateFrom = '',
        effectiveDateTo = '',
        page = 1,
        limit = 10,
        sortBy = 'relevance',
        sortOrder = 'desc'
      } = req.query;

      const filter = {};
      const sort = {};

      if (department) filter.department = department;
      if (documentType) filter.documentType = documentType;
      if (category) filter.category = category;
      if (status) filter.status = status;

      if (dateFrom || dateTo) {
        filter.createdAt = {};
        if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
        if (dateTo) filter.createdAt.$lte = new Date(dateTo);
      }

      if (signatureDateFrom || signatureDateTo) {
        filter.signatureDate = {};
        if (signatureDateFrom) filter.signatureDate.$gte = new Date(signatureDateFrom);
        if (signatureDateTo) filter.signatureDate.$lte = new Date(signatureDateTo);
      }

      if (effectiveDateFrom || effectiveDateTo) {
        filter.effectiveDate = {};
        if (effectiveDateFrom) filter.effectiveDate.$gte = new Date(effectiveDateFrom);
        if (effectiveDateTo) filter.effectiveDate.$lte = new Date(effectiveDateTo);
      }

      let searchResults;
      let total;

      if (query.trim()) {
        searchResults = await this.performTextSearch(filter, query, page, limit, sortBy, sortOrder);
        total = await this.getTextSearchCount(filter, query);
      } else {
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
        searchResults = await Document.find(filter)
          .sort(sort)
          .skip((page - 1) * limit)
          .limit(parseInt(limit))
          .populate('uploadedBy', 'username fullName department')
          .lean();
        total = await Document.countDocuments(filter);
      }

      const results = searchResults.map(doc => ({
        ...doc,
        relevanceScore: this.calculateRelevanceScore(doc, query),
        highlightedContent: this.highlightSearchTerms(doc.content, query)
      }));

      res.json({
        results: sortBy === 'relevance' ? results.sort((a, b) => b.relevanceScore - a.relevanceScore) : results,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        filters: {
          query,
          department,
          documentType,
          category,
          status,
          dateFrom,
          dateTo,
          signatureDateFrom,
          signatureDateTo,
          effectiveDateFrom,
          effectiveDateTo
        }
      });
    } catch (error) {
      console.error('搜索文档失败:', error);
      res.status(500).json({ error: '搜索文档失败', details: error.message });
    }
  }

  async performTextSearch(filter, query, page, limit, sortBy, sortOrder) {
    const searchQuery = this.buildSearchQuery(query);
    
    if (sortBy === 'relevance') {
      return Document.find(filter)
        .search(searchQuery)
        .sort({ score: { $meta: 'textScore' } })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .populate('uploadedBy', 'username fullName department')
        .lean();
    } else {
      return Document.find(filter)
        .find({ $text: { $search: searchQuery } })
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .populate('uploadedBy', 'username fullName department')
        .lean();
    }
  }

  async getTextSearchCount(filter, query) {
    const searchQuery = this.buildSearchQuery(query);
    return Document.countDocuments({
      ...filter,
      $text: { $search: searchQuery }
    });
  }

  buildSearchQuery(query) {
    const terms = query.trim().split(/\s+/).filter(term => term.length > 0);
    return terms.join(' ');
  }

  calculateRelevanceScore(document, query) {
    if (!query.trim()) return 0;

    const terms = query.toLowerCase().split(/\s+/).filter(term => term.length > 0);
    let score = 0;

    terms.forEach(term => {
      const titleMatches = (document.title.toLowerCase().match(new RegExp(term, 'g')) || []).length;
      const keywordMatches = (document.keywords.join(' ').toLowerCase().match(new RegExp(term, 'g')) || []).length;
      const contentMatches = (document.content.toLowerCase().match(new RegExp(term, 'g')) || []).length;

      score += titleMatches * 10;
      score += keywordMatches * 5;
      score += contentMatches * 1;
    });

    return score;
  }

  highlightSearchTerms(content, query) {
    if (!query.trim()) return content;

    const terms = query.trim().split(/\s+/).filter(term => term.length > 0);
    let highlightedContent = content;

    terms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      highlightedContent = highlightedContent.replace(regex, '<mark>$1</mark>');
    });

    return highlightedContent;
  }

  async getDocumentTypes(req, res) {
    try {
      const documentTypes = await Document.distinct('documentType');
      res.json({ documentTypes });
    } catch (error) {
      console.error('获取文档类型失败:', error);
      res.status(500).json({ error: '获取文档类型失败', details: error.message });
    }
  }

  async getCategories(req, res) {
    try {
      const categories = await Document.distinct('category');
      res.json({ categories });
    } catch (error) {
      console.error('获取分类失败:', error);
      res.status(500).json({ error: '获取分类失败', details: error.message });
    }
  }

  async getDepartments(req, res) {
    try {
      const departments = await Document.distinct('department');
      res.json({ departments });
    } catch (error) {
      console.error('获取部门列表失败:', error);
      res.status(500).json({ error: '获取部门列表失败', details: error.message });
    }
  }

  async getAdvancedSearchSuggestions(req, res) {
    try {
      const { type = 'all', limit = 10 } = req.query;

      const suggestions = {};

      if (type === 'all' || type === 'documentTypes') {
        const documentTypes = await Document.distinct('documentType');
        suggestions.documentTypes = documentTypes.slice(0, limit);
      }

      if (type === 'all' || type === 'categories') {
        const categories = await Document.distinct('category');
        suggestions.categories = categories.slice(0, limit);
      }

      if (type === 'all' || type === 'departments') {
        const departments = await Document.distinct('department');
        suggestions.departments = departments.slice(0, limit);
      }

      if (type === 'all' || type === 'keywords') {
        const keywords = await Document.distinct('keywords');
        const allKeywords = keywords.flat();
        const keywordCounts = {};
        
        allKeywords.forEach(keyword => {
          keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
        });

        suggestions.keywords = Object.entries(keywordCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, limit)
          .map(([keyword]) => keyword);
      }

      res.json({ suggestions });
    } catch (error) {
      console.error('获取搜索建议失败:', error);
      res.status(500).json({ error: '获取搜索建议失败', details: error.message });
    }
  }
}

module.exports = new SearchController();