// 内存数据库初始化脚本 - 用于测试 purposes
const fs = require('fs');
const path = require('path');

async function createMemoryDatabase() {
  try {
    // 创建uploads目录
    const uploadsPath = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadsPath)) {
      fs.mkdirSync(uploadsPath, { recursive: true });
      console.log('✅ 创建uploads目录');
    }

    // 创建示例文档文件
    const sampleDocuments = [
      {
        id: 'doc001',
        filename: '员工管理制度.docx',
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
签发日期：2024年1月15日`
      },
      {
        id: 'doc002',
        filename: '信息安全管理制度.docx',
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
签发日期：2024年3月20日`
      }
    ];

    // 创建示例文档文件
    sampleDocuments.forEach(doc => {
      const filePath = path.join(uploadsPath, doc.filename);
      fs.writeFileSync(filePath, doc.content, 'utf8');
      console.log(`✅ 创建示例文档: ${doc.filename}`);
    });

    console.log('🎉 内存数据库初始化完成');
    console.log('📝 现在可以启动系统进行测试');
    console.log('💡 注意：这是一个简化版本，用于演示系统功能');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 内存数据库初始化失败:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  createMemoryDatabase();
}

module.exports = { createMemoryDatabase };