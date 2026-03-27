const http = require('http');

// 简单的测试函数
function testRequest(path, callback) {
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: path,
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    }
  };

  const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => {
      body += chunk;
    });
    res.on('end', () => {
      callback(null, {
        statusCode: res.statusCode,
        headers: res.headers,
        body: body
      });
    });
  });

  req.on('error', (err) => {
    callback(err);
  });

  req.end();
}

console.log('🧪 开始简单测试...\n');

// 测试1: 根路径
testRequest('/', (err, res) => {
  if (err) {
    console.error('❌ 根路径测试失败:', err.message);
    return;
  }
  
  console.log('1. 根路径测试:');
  console.log(`   状态码: ${res.statusCode}`);
  
  if (res.statusCode === 200) {
    try {
      const data = JSON.parse(res.body);
      console.log(`   ✅ 成功: ${data.message}`);
    } catch (e) {
      console.log(`   📝 响应: ${res.body.substring(0, 100)}...`);
    }
  } else {
    console.log(`   ❌ 失败: ${res.statusCode} - ${res.body}`);
  }
  
  // 测试2: 文档类型
  testRequest('/api/search/document-types', (err, res) => {
    if (err) {
      console.error('❌ 文档类型测试失败:', err.message);
      return;
    }
    
    console.log('\n2. 文档类型测试:');
    console.log(`   状态码: ${res.statusCode}`);
    
    if (res.statusCode === 200) {
      try {
        const data = JSON.parse(res.body);
        console.log(`   ✅ 成功: 找到 ${data.documentTypes.length} 个文档类型`);
        console.log(`   📋 类型: ${data.documentTypes.join(', ')}`);
      } catch (e) {
        console.log(`   ❌ JSON解析失败: ${e.message}`);
      }
    } else {
      console.log(`   ❌ 失败: ${res.statusCode} - ${res.body}`);
    }
    
    // 测试3: 用户登录
    console.log('\n3. 用户登录测试:');
    
    const postData = JSON.stringify({
      username: 'admin',
      password: 'admin123'
    });
    
    const loginOptions = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const loginReq = http.request(loginOptions, (loginRes) => {
      let loginBody = '';
      loginRes.on('data', (chunk) => {
        loginBody += chunk;
      });
      loginRes.on('end', () => {
        console.log(`   状态码: ${loginRes.statusCode}`);
        
        if (loginRes.statusCode === 200) {
          try {
            const loginData = JSON.parse(loginBody);
            console.log(`   ✅ 登录成功: ${loginData.user.username}`);
            console.log(`   🎫 Token: ${loginData.token.substring(0, 20)}...`);
          } catch (e) {
            console.log(`   ❌ JSON解析失败: ${e.message}`);
          }
        } else {
          console.log(`   ❌ 登录失败: ${loginRes.statusCode} - ${loginBody}`);
        }
        
        console.log('\n🎉 测试完成！');
      });
    });
    
    loginReq.on('error', (err) => {
      console.error('❌ 登录请求失败:', err.message);
    });
    
    loginReq.write(postData);
    loginReq.end();
  });
});