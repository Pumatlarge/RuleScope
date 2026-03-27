const DocumentProcessor = require('./utils/documentProcessor');

async function testNumbering() {
  const processor = new DocumentProcessor();
  const filePath = 'd:\\Onedrive\\Documents\\Software Engineering\\02-Doing\\Company regulations search engine\\02_规章制度归档\\14、 派能科技-董事会战略委员会工作细则【2025年10月修改，清洁版本】（董事会）.docx';
  
  console.log('=== 测试开发文件夹中的编号识别 ===\n');
  
  try {
    const result = await processor.processDocument(filePath);
    
    console.log('提取的文本内容（前2000字符）:\n');
    console.log(result.content.substring(0, 2000));
    
    console.log('\n\n=== 检查编号是否正确提取 ===');
    const lines = result.content.split('\n');
    
    console.log('\n前30行内容:');
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
    const chinesePattern = /^第[一二三四五六七八九十百千万]+[章节条款]/;
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
    console.error('测试失败:', error.message);
    console.error(error.stack);
  }
}

testNumbering();