const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');

describe('企业规章制度检索管理系统 - 基础功能测试', () => {
  let token;
  let userId;

  beforeAll(async () => {
    // 连接测试数据库
    await mongoose.connect('mongodb://localhost:27017/company-regulations-test', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // 创建测试用户
    const user = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'test123',
      role: 'user',
      department: '测试部',
      fullName: '测试用户',
      permissions: ['upload', 'edit', 'view_all']
    });
    await user.save();
    userId = user._id;

    // 登录获取token
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'testuser',
        password: 'test123'
      });
    token = response.body.token;
  });

  afterAll(async () => {
    // 清理测试数据
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  describe('用户认证测试', () => {
    test('用户登录成功', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'test123'
        });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.username).toBe('testuser');
    });

    test('用户登录失败 - 密码错误', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBeDefined();
    });

    test('获取用户信息', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.user.username).toBe('testuser');
    });
  });

  describe('文档管理测试', () => {
    test('获取文档列表', async () => {
      const response = await request(app)
        .get('/api/documents')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.documents).toBeDefined();
      expect(Array.isArray(response.body.documents)).toBe(true);
    });

    test('搜索文档', async () => {
      const response = await request(app)
        .get('/api/search/documents')
        .query({ query: '测试' })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.results).toBeDefined();
      expect(Array.isArray(response.body.results)).toBe(true);
    });

    test('获取文档类型列表', async () => {
      const response = await request(app)
        .get('/api/search/document-types')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.documentTypes).toBeDefined();
      expect(Array.isArray(response.body.documentTypes)).toBe(true);
    });

    test('获取部门列表', async () => {
      const response = await request(app)
        .get('/api/search/departments')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.departments).toBeDefined();
      expect(Array.isArray(response.body.departments)).toBe(true);
    });
  });

  describe('API健康检查', () => {
    test('根路径访问', async () => {
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('企业规章制度检索管理系统 API');
    });

    test('未知路径返回404', async () => {
      const response = await request(app).get('/api/unknown');
      expect(response.status).toBe(404);
    });
  });
});

describe('系统安全性测试', () => {
  test('未认证访问API应被拒绝', async () => {
    const response = await request(app)
      .get('/api/documents');

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('访问被拒绝，需要认证');
  });

  test('无效token应被拒绝', async () => {
    const response = await request(app)
      .get('/api/documents')
      .set('Authorization', 'Bearer invalid-token');

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('无效的认证信息');
  });
});