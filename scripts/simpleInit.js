const mongoose = require('mongoose');
const User = require('../models/User');
const Document = require('../models/Document');
const Version = require('../models/Version');
require('dotenv').config();

async function simpleInit() {
  try {
    // 尝试连接MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/company-regulations', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ 数据库连接成功');

    // 检查是否已有数据
    const userCount = await User.countDocuments();
    const docCount = await Document.countDocuments();

    if (userCount === 0) {
      console.log('📝 创建示例用户...');
      const users = [
        {
          username: 'admin',
          email: 'admin@company.com',
          password: 'admin123',
          role: 'admin',
          department: '技术部',
          fullName: '系统管理员',
          permissions: ['upload', 'edit', 'delete', 'view_all', 'manage_users']
        },
        {
          username: 'manager',
          email: 'manager@company.com',
          password: 'manager123',
          role: 'manager',
          department: '人力资源部',
          fullName: '部门经理',
          permissions: ['upload', 'edit', 'view_all']
        },
        {
          username: 'user',
          email: 'user@company.com',
          password: 'user123',
          role: 'user',
          department: '市场部',
          fullName: '普通用户',
          permissions: ['upload', 'view_all']
        }
      ];

      await User.insertMany(users);
      console.log('✅ 示例用户创建成功');
    } else {
      console.log(`ℹ️  已有 ${userCount} 个用户，跳过用户创建`);
    }

    if (docCount === 0) {
      console.log('📄 创建示例文档...');
      const users = await User.find({ role: { $in: ['admin', 'manager'] } });
      
      const documents = [
        {
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
          storedFileName: 'sample_employee_001.docx',
          fileSize: 1024 * 5,
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          department: '人力资源部',
          documentType: '管理制度',
          category: '人事管理',
          signatory: '张三',
          signatureDate: new Date('2024-01-15'),
          effectiveDate: new Date('2024-02-01'),
          uploadedBy: users[1]._id,
          keywords: ['员工', '管理', '制度', '考勤', '薪酬'],
          tags: ['人事', '管理', '制度'],
          description: '公司员工管理的基本制度规范',
          version: '1.0',
          isLatest: true
        },
        {
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
          storedFileName: 'sample_security_002.docx',
          fileSize: 1024 * 6,
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          department: '技术部',
          documentType: '管理制度',
          category: '技术管理',
          signatory: '李四',
          signatureDate: new Date('2024-03-20'),
          effectiveDate: new Date('2024-04-01'),
          uploadedBy: users[0]._id,
          keywords: ['信息安全', '账号', '密码', '数据', '网络'],
          tags: ['技术', '安全', '制度'],
          description: '公司信息安全管理的详细规定',
          version: '1.0',
          isLatest: true
        }
      ];

      const savedDocuments = await Document.insertMany(documents);
      
      // 为每个文档创建版本记录
      for (const doc of savedDocuments) {
        const version = new Version({
          documentId: doc._id,
          version: doc.version,
          title: doc.title,
          content: doc.content,
          originalFileName: doc.originalFileName,
          storedFileName: doc.storedFileName,
          fileSize: doc.fileSize,
          signatory: doc.signatory,
          signatureDate: doc.signatureDate,
          effectiveDate: doc.effectiveDate,
          uploadedBy: doc.uploadedBy,
          isCurrent: true
        });
        await version.save();
      }

      console.log(`✅ 创建了 ${savedDocuments.length} 个示例文档`);
    } else {
      console.log(`ℹ️  已有 ${docCount} 个文档，跳过文档创建`);
    }

    console.log('🎉 数据库初始化完成');
    process.exit(0);
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message);
    console.log('💡 请确保MongoDB服务正在运行');
    console.log('💡 或者修改.env文件中的MONGODB_URI配置');
    process.exit(1);
  }
}

if (require.main === module) {
  simpleInit();
}

module.exports = { simpleInit };