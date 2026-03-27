const memoryStorage = require('../utils/memoryStorage');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

class MemoryController {
  // 用户认证相关
  async login(credentials) {
    const user = memoryStorage.findUser({
      $or: [
        { username: credentials.username },
        { email: credentials.username }
      ]
    });

    if (!user || !user.isActive) {
      return {
        success: false,
        error: '用户名或密码错误'
      };
    }

    // 简单的密码验证（实际项目中应该使用bcrypt）
    if (user.password !== credentials.password) {
      return {
        success: false,
        error: '用户名或密码错误'
      };
    }

    // 更新最后登录时间
    user.lastLogin = new Date();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    return {
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        department: user.department,
        fullName: user.fullName,
        position: user.position,
        permissions: user.permissions
      }
    };
  }

  async register(userData) {
    // 检查用户是否已存在
    const existingUser = memoryStorage.findUser({
      $or: [
        { username: userData.username },
        { email: userData.email }
      ]
    });

    if (existingUser) {
      return {
        success: false,
        error: '用户名或邮箱已存在'
      };
    }

    // 创建新用户
    const newUser = {
      _id: 'user' + Date.now(),
      username: userData.username,
      email: userData.email,
      password: userData.password, // 实际项目中应该加密
      role: userData.role || 'user',
      department: userData.department,
      fullName: userData.fullName,
      position: userData.position,
      permissions: userData.permissions || [],
      isActive: true,
      lastLogin: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    memoryStorage.users.push(newUser);

    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    return {
      success: true,
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
        fullName: newUser.fullName,
        position: newUser.position,
        permissions: newUser.permissions
      }
    };
  }

  async getProfile(userId) {
    const user = memoryStorage.users.find(u => u._id === userId);
    if (!user) {
      return {
        success: false,
        error: '用户不存在'
      };
    }

    return {
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        department: user.department,
        fullName: user.fullName,
        position: user.position,
        permissions: user.permissions,
        lastLogin: user.lastLogin
      }
    };
  }

  async updateProfile(userId, userData) {
    const user = memoryStorage.users.find(u => u._id === userId);
    if (!user) {
      return {
        success: false,
        error: '用户不存在'
      };
    }

    // 更新用户信息
    Object.assign(user, userData);
    user.updatedAt = new Date();

    return {
      success: true,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        department: user.department,
        fullName: user.fullName,
        position: user.position,
        permissions: user.permissions
      }
    };
  }

  // 文档相关
  async getDocuments(params) {
    const filter = {};
    const options = {
      page: parseInt(params.page) || 1,
      limit: parseInt(params.limit) || 10,
      sort: {}
    };

    if (params.department) filter.department = params.department;
    if (params.documentType) filter.documentType = params.documentType;
    if (params.category) filter.category = params.category;
    if (params.status) filter.status = params.status;
    
    if (params.sortBy) {
      options.sort[params.sortBy] = params.sortOrder === 'desc' ? -1 : 1;
    }

    const result = memoryStorage.findDocuments(filter, options);
    
    // 添加上传人信息
    result.documents = result.documents.map(doc => ({
      ...doc,
      uploadedBy: memoryStorage.users.find(u => u._id === doc.uploadedBy) || null
    }));

    return result;
  }

  async getDocument(id) {
    const document = memoryStorage.findDocumentById(id);
    if (!document) {
      return {
        success: false,
        error: '文档不存在'
      };
    }

    const versions = memoryStorage.findVersions({ documentId: id });
    const uploadedBy = memoryStorage.users.find(u => u._id === document.uploadedBy) || null;

    return {
      success: true,
      document: {
        ...document,
        uploadedBy
      },
      versions: versions.map(v => ({
        ...v,
        uploadedBy: memoryStorage.users.find(u => u._id === v.uploadedBy) || null
      }))
    };
  }

  async searchDocuments(params) {
    const filter = {};
    if (params.department) filter.department = params.department;
    if (params.documentType) filter.documentType = params.documentType;
    if (params.category) filter.category = params.category;

    const results = memoryStorage.searchDocuments(params.query, filter);
    
    // 添加分页
    const page = parseInt(params.page) || 1;
    const limit = parseInt(params.limit) || 10;
    const skip = (page - 1) * limit;
    
    const paginatedResults = results.slice(skip, skip + limit);
    const totalPages = Math.ceil(results.length / limit);

    return {
      success: true,
      results: paginatedResults.map(doc => ({
        ...doc,
        relevanceScore: this.calculateRelevanceScore(doc, params.query),
        highlightedContent: this.highlightSearchTerms(doc.content, params.query)
      })),
      pagination: {
        page,
        limit,
        total: results.length,
        pages: totalPages
      },
      filters: {
        query: params.query,
        department: params.department,
        documentType: params.documentType,
        category: params.category
      }
    };
  }

  async getDocumentTypes() {
    return {
      success: true,
      documentTypes: memoryStorage.getDocumentTypes()
    };
  }

  async getCategories() {
    return {
      success: true,
      categories: memoryStorage.getCategories()
    };
  }

  async getDepartments() {
    return {
      success: true,
      departments: memoryStorage.getDepartments()
    };
  }

  async getSuggestions(params) {
    return {
      success: true,
      suggestions: {
        documentTypes: memoryStorage.getDocumentTypes().slice(0, 10),
        categories: memoryStorage.getCategories().slice(0, 10),
        departments: memoryStorage.getDepartments().slice(0, 10),
        keywords: memoryStorage.getKeywords()
      }
    };
  }

  // 辅助方法
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
}

module.exports = new MemoryController();