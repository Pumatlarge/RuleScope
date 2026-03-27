const mongoose = require('mongoose');
const User = require('../models/User');
const Document = require('../models/Document');
const Version = require('../models/Version');
require('dotenv').config();

const sampleDepartments = [
  '人力资源部',
  '财务部',
  '技术部',
  '市场部',
  '运营部',
  '法务部',
  '行政部',
  '客服部'
];

const sampleDocumentTypes = [
  '管理制度',
  '操作规范',
  '岗位职责',
  '应急预案',
  '工作流程',
  '考核制度',
  '培训制度',
  '安全制度'
];

const sampleCategories = [
  '人事管理',
  '财务管理',
  '技术管理',
  '市场营销',
  '安全生产',
  '质量控制',
  '行政管理',
  '客户服务'
];

const createSampleUser = async () => {
  const adminUser = new User({
    username: 'admin',
    email: 'admin@company.com',
    password: 'admin123',
    role: 'admin',
    department: '技术部',
    fullName: '系统管理员',
    position: '系统管理员',
    permissions: ['upload', 'edit', 'delete', 'view_all', 'manage_users']
  });

  const managerUser = new User({
    username: 'manager',
    email: 'manager@company.com',
    password: 'manager123',
    role: 'manager',
    department: '人力资源部',
    fullName: '部门经理',
    position: '人力资源经理',
    permissions: ['upload', 'edit', 'view_all']
  });

  const normalUser = new User({
    username: 'user',
    email: 'user@company.com',
    password: 'user123',
    role: 'user',
    department: '市场部',
    fullName: '普通用户',
    position: '市场专员',
    permissions: ['upload', 'view_all']
  });

  return [adminUser, managerUser, normalUser];
};

const createSampleDocuments = async (users) => {
  const sampleDocuments = [
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
      department: '人力资源部',
      documentType: '管理制度',
      category: '人事管理',
      signatory: '张三',
      signatureDate: new Date('2024-01-15'),
      effectiveDate: new Date('2024-02-01'),
      uploadedBy: users[1]._id,
      keywords: ['员工', '管理', '制度', '考勤', '薪酬'],
      tags: ['人事', '管理', '制度'],
      description: '公司员工管理的基本制度规范'
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
      department: '技术部',
      documentType: '管理制度',
      category: '技术管理',
      signatory: '李四',
      signatureDate: new Date('2024-03-20'),
      effectiveDate: new Date('2024-04-01'),
      uploadedBy: users[2]._id,
      keywords: ['信息安全', '账号', '密码', '数据', '网络'],
      tags: ['技术', '安全', '制度'],
      description: '公司信息安全管理的详细规定'
    },
    {
      title: '财务报销流程规范',
      content: `第一章 总则
第一条 为规范公司财务报销流程，提高报销效率，特制定本规范。
第二条 本规范适用于公司所有部门和员工。
第三条 财务报销应当遵循真实、合法、及时的原则。

第二章 报销范围
第四条 差旅费：包括交通费、住宿费、餐饮费等。
第五条 办公费：包括文具、耗材、通讯费等。
第六条 业务招待费：包括客户接待、商务活动等。
第七条 其他费用：经批准的其他合理支出。

第三章 报销流程
第八条 填写报销单：如实填写报销项目、金额、日期等。
第九条 附上凭证：提供发票、收据等相关凭证。
第十条 部门审核：部门负责人审核报销单的真实性。
第十一条 财务审核：财务部门审核报销的合规性。
第十二条 领导审批：根据金额大小进行相应级别的审批。
第十三条 财务报销：审核通过后由财务部门安排付款。

第四章 注意事项
第十四条 报销期限：费用发生后15个工作日内提交报销申请。
第十五条 发票要求：发票必须真实有效，抬头为公司名称。
第十六条 报销金额：单笔报销金额超过5000元需提前申请。

第五章 附则
第十七条 本规范自发布之日起生效。
第十八条 本规范由财务部负责解释。

签发人：王五
签发日期：2024年2月10日`,
      department: '财务部',
      documentType: '操作规范',
      category: '财务管理',
      signatory: '王五',
      signatureDate: new Date('2024-02-10'),
      effectiveDate: new Date('2024-03-01'),
      uploadedBy: users[0]._id,
      keywords: ['财务', '报销', '流程', '规范', '制度'],
      tags: ['财务', '报销', '规范'],
      description: '公司财务报销的详细操作规范'
    }
  ];

  const documents = [];
  for (const docData of sampleDocuments) {
    const document = new Document({
      ...docData,
      originalFileName: `${docData.title}.docx`,
      storedFileName: `sample_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.docx`,
      fileSize: 1024 * 5, // 5KB
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      version: '1.0',
      isLatest: true
    });
    
    await document.save();
    documents.push(document);

    const version = new Version({
      documentId: document._id,
      version: document.version,
      title: document.title,
      content: document.content,
      originalFileName: document.originalFileName,
      storedFileName: document.storedFileName,
      fileSize: document.fileSize,
      signatory: document.signatory,
      signatureDate: document.signatureDate,
      effectiveDate: document.effectiveDate,
      uploadedBy: document.uploadedBy,
      isCurrent: true
    });

    await version.save();
  }

  return documents;
};

const initDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/company-regulations', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('数据库连接成功');

    const existingUsers = await User.countDocuments();
    const existingDocuments = await Document.countDocuments();

    if (existingUsers === 0) {
      console.log('创建示例用户...');
      const users = await createSampleUser();
      await User.insertMany(users);
      console.log('示例用户创建成功');
    } else {
      console.log('数据库中已存在用户，跳过用户创建');
    }

    if (existingDocuments === 0) {
      console.log('创建示例文档...');
      const users = await User.find({ role: { $in: ['admin', 'manager'] } });
      const documents = await createSampleDocuments(users);
      console.log(`创建了 ${documents.length} 个示例文档`);
    } else {
      console.log('数据库中已存在文档，跳过文档创建');
    }

    console.log('数据库初始化完成');
    process.exit(0);
  } catch (error) {
    console.error('数据库初始化失败:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  initDatabase();
}

module.exports = { initDatabase, createSampleUser, createSampleDocuments };