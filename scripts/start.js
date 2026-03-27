const fs = require('fs');
const path = require('path');
const { initDatabase } = require('./initDatabase');

async function checkEnvironment() {
  console.log('检查环境配置...');
  
  // 检查Node.js版本
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (majorVersion < 16) {
    console.error('❌ 错误：需要Node.js 16.0.0或更高版本');
    console.error(`当前版本：${nodeVersion}`);
    process.exit(1);
  }
  
  console.log(`✅ Node.js版本检查通过：${nodeVersion}`);
  
  // 检查环境变量文件
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ 错误：缺少环境变量文件');
    console.error('请复制.env.example文件为.env并配置相关参数');
    process.exit(1);
  }
  
  console.log('✅ 环境变量文件检查通过');
  
  // 检查uploads目录
  const uploadsPath = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
    console.log('✅ 创建uploads目录');
  }
  
  console.log('✅ 环境检查完成');
}

async function startServer() {
  try {
    console.log('🚀 启动企业规章制度检索管理系统...');
    
    // 检查环境
    await checkEnvironment();
    
    // 初始化数据库
    console.log('📊 初始化数据库...');
    await initDatabase();
    
    // 启动服务器
    const server = require('../server');
    
    console.log('🎉 系统启动成功！');
    console.log('📱 前端地址：http://localhost:3000');
    console.log('🔧 后端API：http://localhost:3001');
    console.log('📖 API文档：http://localhost:3001');
    console.log('');
    console.log('默认用户账号：');
    console.log('  管理员：admin / admin123');
    console.log('  经理：manager / manager123');
    console.log('  普通用户：user / user123');
    
  } catch (error) {
    console.error('❌ 启动失败:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  startServer();
}

module.exports = { startServer, checkEnvironment };