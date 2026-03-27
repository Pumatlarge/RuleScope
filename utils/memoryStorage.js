// 内存数据存储 - 用于演示和测试 purposes
class MemoryStorage {
  constructor() {
    this.users = [
      {
        _id: 'user001',
        username: 'admin',
        email: 'admin@company.com',
        password: 'admin123', // 实际项目中应该是加密的
        role: 'admin',
        department: '技术部',
        fullName: '系统管理员',
        position: '系统管理员',
        permissions: ['upload', 'edit', 'delete', 'view_all', 'manage_users'],
        isActive: true,
        lastLogin: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'user002',
        username: 'manager',
        email: 'manager@company.com',
        password: 'manager123', // 实际项目中应该是加密的
        role: 'manager',
        department: '人力资源部',
        fullName: '部门经理',
        position: '人力资源经理',
        permissions: ['upload', 'edit', 'view_all'],
        isActive: true,
        lastLogin: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: 'user003',
        username: 'user',
        email: 'user@company.com',
        password: 'user123', // 实际项目中应该是加密的
        role: 'user',
        department: '市场部',
        fullName: '普通用户',
        position: '市场专员',
        permissions: ['upload', 'view_all'],
        isActive: true,
        lastLogin: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    this.documents = [
      {
        _id: 'doc001',
        title: '员工管理制度',
        content: `第一章 总则
第一条 为规范公司员工行为，维护公司正常工作秩序，特制定本制度。
第二条 本制度适用于公司全体员工。
第三条 员工应当遵守国家法律法规和公司各项规章制度。

第二章 考勤管理
第四条 工作时间为周一至周五，上午9:00-12:00，下午13:30-17:30。
第五条 员工应当按时上下班，不得迟到早退。
第六条 因病请假需提供医院证明。

第三章 薪酬福利
第七条 公司实行绩效工资制度。
第八条 员工享受法定节假日福利。
第九条 年度优秀员工可获得额外奖励。

第四章 附则
第十条 本制度自发布之日起生效。
第十一条 本制度由人力资源部负责解释。

签发人：张三
签发日期：2024年1月15日`,
        originalFileName: '员工管理制度.docx',
        storedFileName: 'employee_management.docx',
        fileSize: 5 * 1024, // 5KB
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        department: '人力资源部',
        documentType: '管理制度',
        category: '人事管理',
        keywords: ['员工', '管理', '制度', '考勤', '薪酬'],
        signatory: '张三',
        signatureDate: new Date('2024-01-15'),
        effectiveDate: new Date('2024-02-01'),
        status: 'active',
        version: '1.0',
        isLatest: true,
        uploadedBy: 'user002',
        tags: ['人事', '管理', '制度'],
        description: '公司员工管理的基本制度规范',
        metadata: {
          pageCount: 4,
          wordCount: 156,
          createdDate: new Date('2024-01-15'),
          modifiedDate: new Date('2024-01-15'),
          approvalNumber: 'HR-2024-001'
        },
        createdAt: new Date('2024-01-15T10:00:00Z'),
        updatedAt: new Date('2024-01-15T10:00:00Z')
      },
      {
        _id: 'doc002',
        title: '信息安全管理制度',
        content: `第一章 总则
第一条 为保障公司信息系统安全，防止信息泄露，特制定本制度。
第二条 本制度适用于公司所有信息系统和用户。
第三条 信息安全是公司的重要责任。

第二章 账号管理
第四条 员工应当妥善保管个人账号密码。
第五条 密码长度不少于8位，包含字母和数字。
第六条 定期更换密码，每季度至少一次。

第三章 数据安全
第七条 重要数据应当定期备份。
第八条 不得私自拷贝公司敏感数据。
第九条 离职员工账号应当及时注销。

第四章 网络安全
第十条 不得访问非法网站。
第十一条 不得下载未经授权的软件。
第十二条 定期更新杀毒软件。

第五章 附则
第十三条 本制度自发布之日起生效。
第十四条 本制度由技术部负责解释。

签发人：李四
签发日期：2024年3月20日`,
        originalFileName: '信息安全管理制度.docx',
        storedFileName: 'information_security.docx',
        fileSize: 6 * 1024, // 6KB
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        department: '技术部',
        documentType: '管理制度',
        category: '技术管理',
        keywords: ['信息安全', '账号', '密码', '数据', '网络'],
        signatory: '李四',
        signatureDate: new Date('2024-03-20'),
        effectiveDate: new Date('2024-04-01'),
        status: 'active',
        version: '1.0',
        isLatest: true,
        uploadedBy: 'user001',
        tags: ['技术', '安全', '制度'],
        description: '公司信息安全管理的详细规定',
        metadata: {
          pageCount: 5,
          wordCount: 189,
          createdDate: new Date('2024-03-20'),
          modifiedDate: new Date('2024-03-20'),
          approvalNumber: 'IT-2024-002'
        },
        createdAt: new Date('2024-03-20T14:30:00Z'),
        updatedAt: new Date('2024-03-20T14:30:00Z')
      }
    ];

    this.versions = [
      {
        _id: 'version001',
        documentId: 'doc001',
        version: '1.0',
        title: '员工管理制度',
        content: this.documents[0].content,
        originalFileName: '员工管理制度.docx',
        storedFileName: 'employee_management.docx',
        fileSize: 5 * 1024,
        signatory: '张三',
        signatureDate: new Date('2024-01-15'),
        effectiveDate: new Date('2024-02-01'),
        uploadedBy: 'user002',
        isCurrent: true,
        createdAt: new Date('2024-01-15T10:00:00Z')
      },
      {
        _id: 'version002',
        documentId: 'doc002',
        version: '1.0',
        title: '信息安全管理制度',
        content: this.documents[1].content,
        originalFileName: '信息安全管理制度.docx',
        storedFileName: 'information_security.docx',
        fileSize: 6 * 1024,
        signatory: '李四',
        signatureDate: new Date('2024-03-20'),
        effectiveDate: new Date('2024-04-01'),
        uploadedBy: 'user001',
        isCurrent: true,
        createdAt: new Date('2024-03-20T14:30:00Z')
      }
    ];
  }

  // 用户相关方法
  findUser(filter) {
    let users = this.users;
    
    if (filter.$or) {
      users = this.users.filter(user => {
        return filter.$or.some(condition => {
          return user[condition.$or[0].username] === condition.$or[0].username ||
                 user.email === condition.$or[1].email;
        });
      });
    }
    
    return users[0] || null;
  }

  countUsers() {
    return this.users.length;
  }

  // 文档相关方法
  findDocuments(filter = {}, options = {}) {
    let documents = [...this.documents];

    // 应用过滤条件
    if (filter.department) {
      documents = documents.filter(doc => doc.department === filter.department);
    }
    if (filter.documentType) {
      documents = documents.filter(doc => doc.documentType === filter.documentType);
    }
    if (filter.category) {
      documents = documents.filter(doc => doc.category === filter.category);
    }
    if (filter.status) {
      documents = documents.filter(doc => doc.status === filter.status);
    }
    if (filter.createdAt) {
      documents = documents.filter(doc => {
        if (filter.createdAt.$gte) {
          return doc.createdAt >= filter.createdAt.$gte;
        }
        if (filter.createdAt.$lte) {
          return doc.createdAt <= filter.createdAt.$lte;
        }
        return true;
      });
    }

    // 应用排序
    if (options.sort) {
      const sortField = Object.keys(options.sort)[0];
      const sortOrder = options.sort[sortField];
      documents.sort((a, b) => {
        if (sortOrder === -1) {
          return b[sortField] - a[sortField];
        }
        return a[sortField] - b[sortField];
      });
    }

    // 应用分页
    const skip = (options.page - 1) * options.limit || 0;
    const limit = options.limit || 10;
    const paginatedDocuments = documents.slice(skip, skip + limit);

    return {
      documents: paginatedDocuments,
      total: documents.length,
      pagination: {
        page: options.page || 1,
        limit: options.limit || 10,
        total: documents.length,
        pages: Math.ceil(documents.length / (options.limit || 10))
      }
    };
  }

  findDocumentById(id) {
    return this.documents.find(doc => doc._id === id) || null;
  }

  countDocuments(filter = {}) {
    let count = this.documents.length;
    
    if (filter.department) {
      count = this.documents.filter(doc => doc.department === filter.department).length;
    }
    if (filter.documentType) {
      count = this.documents.filter(doc => doc.documentType === filter.documentType).length;
    }
    if (filter.category) {
      count = this.documents.filter(doc => doc.category === filter.category).length;
    }
    if (filter.status) {
      count = this.documents.filter(doc => doc.status === filter.status).length;
    }
    
    return count;
  }

  // 版本相关方法
  findVersions(filter = {}) {
    let versions = [...this.versions];

    if (filter.documentId) {
      versions = versions.filter(version => version.documentId === filter.documentId);
    }

    // 按版本号排序
    versions.sort((a, b) => {
      const aVersion = parseFloat(a.version);
      const bVersion = parseFloat(b.version);
      return bVersion - aVersion;
    });

    return versions;
  }

  // 搜索方法
  searchDocuments(query, filter = {}) {
    let documents = [...this.documents];
    const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);

    // 应用搜索条件
    documents = documents.filter(doc => {
      if (searchTerms.length === 0) return true;
      
      return searchTerms.every(term => {
        return doc.title.toLowerCase().includes(term) ||
               doc.content.toLowerCase().includes(term) ||
               doc.keywords.some(keyword => keyword.toLowerCase().includes(term)) ||
               doc.department.toLowerCase().includes(term) ||
               doc.documentType.toLowerCase().includes(term);
      });
    });

    // 应用其他过滤条件
    if (filter.department) {
      documents = documents.filter(doc => doc.department === filter.department);
    }
    if (filter.documentType) {
      documents = documents.filter(doc => doc.documentType === filter.documentType);
    }
    if (filter.category) {
      documents = documents.filter(doc => doc.category === filter.category);
    }

    return documents;
  }

  // 获取去重值
  getDocumentTypes() {
    return [...new Set(this.documents.map(doc => doc.documentType))];
  }

  getCategories() {
    return [...new Set(this.documents.map(doc => doc.category))];
  }

  getDepartments() {
    return [...new Set(this.documents.map(doc => doc.department))];
  }

  getKeywords() {
    const allKeywords = this.documents.flatMap(doc => doc.keywords);
    const keywordCounts = {};
    
    allKeywords.forEach(keyword => {
      keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
    });

    return Object.entries(keywordCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([keyword]) => keyword);
  }
}

// 创建全局内存存储实例
const memoryStorage = new MemoryStorage();

module.exports = memoryStorage;