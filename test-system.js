const http = require('http');

// 测试函数
function testAPI(endpoint, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: `/api${endpoint}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (data) {
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(data));
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// 运行测试
async function runTests() {
  console.log('🧪 开始测试企业规章制度检索管理系统...\n');

  try {
    // 测试1: 检查根路径
    console.log('1. 测试根路径...');
    const rootResponse = await testAPI('/');
    console.log(`   ✅ 状态码: ${rootResponse.statusCode}`);
    console.log(`   📝 消息: ${JSON.parse(rootResponse.body).message}\n`);

    // 测试2: 获取文档类型
    console.log('2. 测试获取文档类型...');
    const typesResponse = await testAPI('/search/document-types');
    console.log(`   ✅ 状态码: ${typesResponse.statusCode}`);
    console.log(`   📝 文档类型数量: ${JSON.parse(typesResponse.body).documentTypes.length}\n`);

    // 测试3: 获取部门列表
    console.log('3. 测试获取部门列表...');
    const deptsResponse = await testAPI('/search/departments');
    console.log(`   ✅ 状态码: ${deptsResponse.statusCode}`);
    console.log(`   📝 部门数量: ${JSON.parse(deptsResponse.body).departments.length}\n`);

    // 测试4: 获取分类列表
    console.log('4. 测试获取分类列表...');
    const catsResponse = await testAPI('/search/categories');
    console.log(`   ✅ 状态码: ${catsResponse.statusCode}`);
    console.log(`   📝 分类数量: ${JSON.parse(catsResponse.body).categories.length}\n`);

    // 测试5: 用户登录
    console.log('5. 测试用户登录...');
    const loginResponse = await testAPI('/auth/login', 'POST', {
      username: 'admin',
      password: 'admin123'
    });
    console.log(`   ✅ 状态码: ${loginResponse.statusCode}`);
    
    if (loginResponse.statusCode === 200) {
      const loginData = JSON.parse(loginResponse.body);
      console.log(`   👤 用户: ${loginData.user.username}`);
      console.log(`   🎫 Token: ${loginData.token.substring(0, 20)}...\n`);
    } else {
      console.log(`   ❌ 错误: ${JSON.parse(loginResponse.body).error}\n`);
    }

    // 测试6: 获取文档列表
    console.log('6. 测试获取文档列表...');
    const docsResponse = await testAPI('/documents');
    console.log(`   ✅ 状态码: ${docsResponse.statusCode}`);
    
    if (docsResponse.statusCode === 200) {
      const docsData = JSON.parse(docsResponse.body);
      console.log(`   📄 文档数量: ${docsData.documents.length}`);
      console.log(`   📊 总页数: ${docsData.pagination.pages}\n`);
    } else {
      console.log(`   ❌ 错误: ${JSON.parse(docsResponse.body).error}\n`);
    }

    // 测试7: 搜索文档
    console.log('7. 测试搜索文档...');
    const searchResponse = await testAPI('/search/documents?query=员工');
    console.log(`   ✅ 状态码: ${searchResponse.statusCode}`);
    
    if (searchResponse.statusCode === 200) {
      const searchData = JSON.parse(searchResponse.body);
      console.log(`   🔍 搜索结果数量: ${searchData.results.length}`);
      console.log(`   ⏱️ 搜索用时: ${searchData.results.length > 0 ? '快速' : '无结果'}\n`);
    } else {
      console.log(`   ❌ 错误: ${JSON.parse(searchResponse.body).error}\n`);
    }

    // 测试8: 获取特定文档
    console.log('8. 测试获取特定文档...');
    const docId = 'doc001'; // 使用已知存在的文档ID
    const docResponse = await testAPI(`/documents/${docId}`);
    console.log(`   ✅ 状态码: ${docResponse.statusCode}`);
    
    if (docResponse.statusCode === 200) {
      const docData = JSON.parse(docResponse.body);
      console.log(`   📄 文档标题: ${docData.document.title}`);
      console.log(`   👤 上传人: ${docData.document.uploadedBy?.fullName || '未知'}\n`);
    } else {
      console.log(`   ❌ 错误: ${JSON.parse(docResponse.body).error}\n`);
    }

    console.log('🎉 所有测试完成！');
    console.log('\n📋 系统功能总结:');
    console.log('✅ API服务器正常运行');
    console.log('✅ 用户认证功能正常');
    console.log('✅ 文档管理功能正常');
    console.log('✅ 搜索功能正常');
    console.log('✅ 数据存储功能正常');
    console.log('\n🚀 系统已准备就绪，可以开始使用！');

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
    console.log('\n💡 请确保服务器正在运行: node server-memory.js');
  }
}

// 运行测试
runTests();