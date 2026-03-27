const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const memoryRoutes = require('./routes/memoryRoutes');

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP 15分钟内最多100个请求
  message: {
    error: '请求过于频繁，请稍后再试'
  }
});

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(limiter);

app.use('/api', memoryRoutes);

app.get('/', (req, res) => {
  res.json({
    message: '企业规章制度检索管理系统 API (内存演示版)',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      documents: '/api/documents',
      search: '/api/search',
      users: '/api/users'
    },
    note: '这是一个演示版本，使用内存存储数据'
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? err.message : '请联系管理员'
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 企业规章制度检索管理系统启动成功！`);
  console.log(`🔧 后端API地址: http://localhost:${PORT}`);
  console.log(`📖 API文档: http://localhost:${PORT}`);
  console.log(`💾 当前使用内存存储演示模式`);
  console.log(`📱 前端地址: http://localhost:3000`);
  console.log('');
  console.log(`👤 默认用户账号:`);
  console.log(`  管理员: admin / admin123`);
  console.log(`  经理: manager / manager123`);
  console.log(`  普通用户: user / user123`);
  console.log('');
  console.log(`📋 示例文档:`);
  console.log(`  员工管理制度 - 人力资源部`);
  console.log(`  信息安全管理制度 - 技术部`);
});

module.exports = app;