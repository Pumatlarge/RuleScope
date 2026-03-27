const http = require('http');
const fs = require('fs');
const FormData = require('form-data');

// 使用当前目录下的测试文件
const filePath = './uploads/file-1774519041813-339015421.docx';

console.log('=== 测试上传文档并检查编号识别 ===\n');

// 检查文件是否存在
if (!fs.existsSync(filePath)) {
  console.log(`❌ 文件不存在：${filePath}`);
  console.log('\n请使用示例文档进行测试，或者将测试文档复制到 ./uploads/ 目录');
  process.exit(1);
}

const form = new FormData();
form.append('document', fs.createReadStream(filePath));

const req = http.request({
  hostname: 'localhost',
  port: 3001,
  path: '/api/documents/upload',
  method: 'POST',
  headers: form.getHeaders()
}, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      console.log('✅ 上传成功！\n');
      console.log('文档信息:');
      console.log(`  - 文件名：${result.documentInfo?.fileName || 'N/A'}`);
      console.log(`  - 文件路径：${result.documentInfo?.filePath || 'N/A'}`);
      
      console.log('\n提取的文本内容（前 2000 字符）:\n');
      const content = result.documentInfo?.content || '';
      console.log(content.substring(0, 2000));
      
      console.log('\n\n=== 检查编号是否正确提取 ===');
      const lines = content.split('\n');
      
      console.log('\n前 30 行内容:');
      lines.slice(0, 30).forEach((line, i) => {
        if (line.trim()) {
          console.log(`${i + 1}: ${line}`);
        }
      });
      
      console.log('\n\n=== 统计不同类型的编号 ===');
      
      // 数字编号 (1. 2. 3.)
      const numberPattern = /^\d+\.\s/;
      const numberedLines = lines.filter(line => numberPattern.test(line.trim()));
      console.log(`✅ 找到 ${numberedLines.length} 个数字编号行 (1. 格式)`);
      if (numberedLines.length > 0) {
        console.log('示例:', numberedLines.slice(0, 5).map(line => line.trim()).join(', '));
      }
      
      // 中文数字编号 (第一条 第二条)
      const chinesePattern = /^第 [一二三四五六七八九十百千万]+[章节条款]/;
      const chineseLines = lines.filter(line => chinesePattern.test(line.trim()));
      console.log(`✅ 找到 ${chineseLines.length} 个中文数字行`);
      if (chineseLines.length > 0) {
        console.log('示例:', chineseLines.slice(0, 3).map(line => line.trim()).join(', '));
      }
      
      // 括号编号 (（一） (一))
      const bracketPattern = /^[（(][一二三四五六七八九十]+[)）]/;
      const bracketLines = lines.filter(line => bracketPattern.test(line.trim()));
      console.log(`✅ 找到 ${bracketLines.length} 个括号编号行`);
      if (bracketLines.length > 0) {
        console.log('示例:', bracketLines.slice(0, 3).map(line => line.trim()).join(', '));
      }
      
      // 中文数字编号 (一、 二、)
      const chineseNumberPattern = /^[一二三四五六七八九十]+[、.．]/;
      const chineseNumLines = lines.filter(line => chineseNumberPattern.test(line.trim()));
      console.log(`✅ 找到 ${chineseNumLines.length} 个中文数字编号行`);
      if (chineseNumLines.length > 0) {
        console.log('示例:', chineseNumLines.slice(0, 3).map(line => line.trim()).join(', '));
      }
      
      // 检查是否有重复编号
      const duplicatePattern = /^\d+\.\s*第/;
      const duplicateLines = lines.filter(line => duplicatePattern.test(line.trim()));
      console.log(`❌ 发现 ${duplicateLines.length} 个重复编号行 (需要修复)`);
      if (duplicateLines.length > 0) {
        console.log('重复示例:', duplicateLines.slice(0, 2).map(line => line.trim()).join(', '));
      }
      
      console.log('\n✅ 测试完成！');
      
    } catch (error) {
      console.error('❌ 解析响应失败:', error.message);
      console.error('响应内容:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ 请求失败:', error.message);
  console.error('请确保服务器正在运行 (端口 3001)');
});

form.pipe(req);
