const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config();
const { extractDocxTextWithNumbering } = require('./utils/docxTextExtractor');


// Determine storage path (handle pkg & electron environment)
const rootPath = process.env.APP_ROOT || (process.env.PKG_EXECPATH ? path.dirname(process.execPath) : __dirname);
const DB_PATH = path.join(rootPath, 'db.json');
const HIGHLIGHTS_PATH = path.join(rootPath, 'highlights.json');
const UPLOADS_DIR = path.join(rootPath, 'uploads');

// Ensure uploads directory exists
async function ensureUploadsDir() {
  try {
    await fs.access(UPLOADS_DIR);
  } catch (e) {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    // create .gitkeep if needed
  }
}

ensureUploadsDir();

function formatStructuredContent(text) {
  return text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(formatStructuredLine)
    .filter(Boolean)
    .join('\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function formatStructuredLine(line) {
  const chapterMatch = line.match(/^(第[一二三四五六七八九十百千万零〇两\d]+章)\s*(.*)$/);
  if (chapterMatch) {
    return `# ${joinHeadingText(chapterMatch[1], chapterMatch[2])}`;
  }

  const articleMatch = line.match(/^(第[一二三四五六七八九十百千万零〇两\d]+条)\s*(.*)$/);
  if (articleMatch) {
    return joinHeadingAndBody('##', articleMatch[1], articleMatch[2]);
  }

  const itemMatch = line.match(/^(（[一二三四五六七八九十百千万零〇两\d]+）|\([一二三四五六七八九十百千万零〇两\d]+\))\s*(.*)$/);
  if (itemMatch) {
    return joinHeadingAndBody('###', itemMatch[1], itemMatch[2]);
  }

  return line;
}

function joinHeadingAndBody(marker, heading, body) {
  if (!body) {
    return `${marker} ${heading}`;
  }
  return `${marker} ${heading}\n\n${body}`;
}

function joinHeadingText(prefix, suffix) {
  return suffix ? `${prefix} ${suffix}` : prefix;
}

async function readDB() {
  try {
    const data = await fs.readFile(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}
async function saveDB(data) {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
}

async function readHighlights() {
  try {
    const data = await fs.readFile(HIGHLIGHTS_PATH, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}
async function saveHighlights(data) {
  await fs.writeFile(HIGHLIGHTS_PATH, JSON.stringify(data, null, 2));
}

// 自动修复旧数据的乱码
async function migrateDB() {
  try {
    const db = await readDB();
    let changed = false;
    db.forEach(item => {
      // 检测是否包含 Latin1 范围的特殊字符（典型的乱码特征）
      if (item.name && /[\u0080-\u00ff]/.test(item.name)) {
        try {
          const fixed = Buffer.from(item.name, 'latin1').toString('utf8');
          if (fixed !== item.name && fixed.length > 0 && !fixed.includes('')) {
            item.name = fixed;
            if (item.regulationName && /[\u0080-\u00ff]/.test(item.regulationName)) {
              item.regulationName = Buffer.from(item.regulationName, 'latin1').toString('utf8');
            }
            changed = true;
          }
        } catch (e) { }
      }
    });
    if (changed) {
      console.log('✅ 自动修复了旧数据的乱码');
      await saveDB(db);
    }
  } catch (e) { }
}

migrateDB();

// Extract Regulation metadata
async function extractMetadata(reqFile) {
  // 核心修复：将文件名从 Latin1 强制转码为 UTF-8，解决中文乱码
  const originalName = Buffer.from(reqFile.originalname, 'latin1').toString('utf8');
  let regulationName = originalName.replace(/\.[^/.]+$/, "").replace(/^\d+、/, '').replace(/\（.*?\）|\(.*?\)|\[.*?\]/g, '').split(/[-—]/)[0].trim() || '未命名规章';

  let version = '';
  // Default to year-month from filename if available
  const dateMatch = originalName.match(/(20\d{2})[-.年]?([01]?\d)[-.月]?/);
  if (dateMatch) {
    version = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}`;
  }

  // Attempt to read doc content to find date at the end
  try {
    const ext = path.extname(reqFile.originalname).toLowerCase();
    if (ext === '.docx' || ext === '.doc') {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ path: reqFile.path });
      const rawText = result.value.trim();
      const tail = rawText.slice(-1000); // last 1000 chars
      // matching Chinese dates like 2023年4月 or 二〇二三年四月
      const tailDateMatch = tail.match(/(20\d{2})\s*年\s*([01]?\d)\s*月/);
      if (tailDateMatch) {
        version = `${tailDateMatch[1]}-${tailDateMatch[2].padStart(2, '0')}`;
      }
    }
  } catch (e) { console.error('Error parsing doc content for date:', e); }

  if (!version) {
    const d = new Date();
    version = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  return { regulationName, version };
}

const app = express();

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(UPLOADS_DIR));

// 静态文件服务 (生产环境/编译版)
const buildPath = path.join(__dirname, 'client', 'build');
app.use(express.static(buildPath));

// 文件上传配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'application/pdf'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('只支持Word文档、文本文件和PDF'));
    }
  }
});


// 获取文件列表
app.get('/api/files', async (req, res) => {
  try {
// deleted
    const files = await fs.readdir(UPLOADS_DIR);
    let db = await readDB();

    // Check if there are any files in 'uploads' not in DB
    let needSave = false;
    const fileList = [];

    for (const filename of files) {
      if (filename === '.gitkeep') continue;
      let dbRecord = db.find(f => f.id === filename);
      const filePath = path.join(UPLOADS_DIR, filename);
      const stats = await fs.stat(filePath);

      if (!dbRecord) {
        dbRecord = {
          id: filename,
          name: filename,
          regulationName: filename.replace(/\.[^/.]+$/, ""),
          version: "2023-01",
          size: stats.size,
          uploadDate: stats.birthtime,
          type: path.extname(filename).toLowerCase()
        };
        db.push(dbRecord);
        needSave = true;
      }
      fileList.push(dbRecord);
    }

    if (needSave) { await saveDB(db); }

    res.json({
      files: fileList.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate)),
      total: fileList.length
    });
  } catch (error) {
    res.status(500).json({ error: '获取文件列表失败' });
  }
});

// 上传文件
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '未选择文件' });
    }

    const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
    const autoMeta = await extractMetadata(req.file);

    // User provided values from form priority, otherwise use auto-detected
    const fileInfo = {
      id: req.file.filename,
      name: originalName,
      regulationName: req.body.regulationName || autoMeta.regulationName,
      version: req.body.version || autoMeta.version,
      size: req.file.size,
      uploadDate: new Date().toISOString(),
      type: path.extname(originalName).toLowerCase()
    };

    const db = await readDB();
    db.push(fileInfo);
    await saveDB(db);

    res.json({
      message: '文件上传成功',
      file: fileInfo
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '文件上传失败' });
  }
});

// 更新元数据
app.put('/api/files/:id', async (req, res) => {
  try {
    const db = await readDB();
    const fileIndex = db.findIndex(f => f.id === req.params.id);
    if (fileIndex > -1) {
      db[fileIndex].regulationName = req.body.regulationName || db[fileIndex].regulationName;
      db[fileIndex].version = req.body.version || db[fileIndex].version;
      await saveDB(db);
      res.json({ message: '更新成功', file: db[fileIndex] });
    } else {
      res.status(404).json({ error: '文件未找到' });
    }
  } catch (e) {
    res.status(500).json({ error: '更新失败' });
  }
});


// 删除文件
app.delete('/api/files/:id', async (req, res) => {
  try {
    const filename = req.params.id;
    const filePath = path.join(UPLOADS_DIR, filename);

    try { await fs.unlink(filePath); } catch (e) { } // ignore if already deleted

    let db = await readDB();
    db = db.filter(f => f.id !== filename);
    await saveDB(db);

    res.json({ message: '文件删除成功' });
  } catch (error) {
    res.status(500).json({ error: '文件删除失败' });
  }
});

// 下载原始文件
app.get('/api/files/download/:id', async (req, res) => {
  try {
    const filename = req.params.id;
    console.log('Incoming download request for:', filename);
    const db = await readDB();
    const file = db.find(f => f.id === filename);
    const filePath = path.join(UPLOADS_DIR, filename);
    
    // Verify file exists on disk
    try {
      await fs.access(filePath);
    } catch (e) {
      console.error('File not found on disk:', filePath);
      return res.status(404).send('File not found on disk');
    }

    const originalName = file ? file.name : filename;
    console.log('Sending file with original name:', originalName);
    
    // Use manual headers for better compatibility
    const encodedName = encodeURIComponent(originalName).replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedName}`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    res.sendFile(filePath, (err) => {
      if (err && !res.headersSent) {
        console.error('Error during file transfer:', err);
        res.status(500).send('Error during file transfer');
      }
    });
  } catch (e) {
    console.error('Download route catch error:', e);
    res.status(500).send('Internal Server Error');
  }
});

// 获取文件内容
app.get('/api/files/:id/content', async (req, res) => {
  try {
    const filename = req.params.id;
    const filePath = path.join(UPLOADS_DIR, filename);
    const stats = await fs.stat(filePath);
    const ext = path.extname(filename).toLowerCase();

    let content = '';

    if (ext === '.docx' || ext === '.doc') {
      content = formatStructuredContent(await extractDocxTextWithNumbering(filePath));
    } else if (ext === '.txt') {
      content = await fs.readFile(filePath, 'utf8');
    } else {
      content = ''; // PDF 等暂不读取内容
    }

    res.json({
      name: filename,
      size: stats.size,
      uploadDate: stats.birthtime,
      content: content,
      type: ext
    });
  } catch (error) {
    res.status(500).json({ error: '读取文件内容失败' });
  }
});


const Diff = require('diff');

// 统一获取Markdown内容的辅助函数
async function getMarkdownContent(filename) {
  const filePath = path.join(UPLOADS_DIR, filename);
  const ext = path.extname(filename).toLowerCase();
  let content = '';

  if (ext === '.docx' || ext === '.doc') {
    content = formatStructuredContent(await extractDocxTextWithNumbering(filePath));
  } else if (ext === '.txt') {
    content = await fs.readFile(filePath, 'utf8');
  }
  return content;
}

// Diff endpoint
app.get('/api/files/diff/:id1/:id2', async (req, res) => {
  try {
    const content1 = await getMarkdownContent(req.params.id1);
    const content2 = await getMarkdownContent(req.params.id2);
    // DiffLines creates a clean array of added/removed/unchanged blocks
    const diffResult = Diff.diffLines(content2, content1);
    // Note logic: new is id1, old is id2 => diffLines(old, new) => returns edits from old -> new
    // left is new, right is old. We'll return the diff parts.
    res.json({ diff: diffResult });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Diff failed' });
  }
});

// 根路径
// 根路径转向静态页面 (由下面的 '*' 捕获)
// app.get('/', (req, res) => { ... });

// 获取所有高亮
app.get('/api/highlights', async (req, res) => {
  try {
    const highlights = await readHighlights();
    res.json(highlights);
  } catch (e) {
    res.status(500).json({ error: '获取高亮失败' });
  }
});

// 保存新高亮
app.post('/api/highlights', async (req, res) => {
  try {
    const { text, fileId, regulationName, version, note } = req.body;
    if (!text) return res.status(400).json({ error: '高亮内容不能为空' });
    
    const highlights = await readHighlights();
    const newHighlight = {
      id: Date.now().toString(),
      text,
      fileId,
      regulationName,
      version,
      note: note || '',
      isPinned: false,
      timestamp: new Date().toISOString()
    };
    highlights.push(newHighlight);
    await saveHighlights(highlights);
    res.json(newHighlight);
  } catch (e) {
    res.status(500).json({ error: '保存高亮失败' });
  }
});

// 更新高亮 (如添加笔记、置顶)
app.patch('/api/highlights/:id', async (req, res) => {
    try {
        const { note, isPinned } = req.body;
        let highlights = await readHighlights();
        const index = highlights.findIndex(h => h.id === req.params.id);
        if (index === -1) return res.status(404).send('Not found');
        
        if (note !== undefined) highlights[index].note = note;
        if (isPinned !== undefined) highlights[index].isPinned = isPinned;
        
        await saveHighlights(highlights);
        res.json(highlights[index]);
    } catch (e) {
        res.status(500).json({ error: '更新失败' });
    }
});

// 删除高亮
app.delete('/api/highlights/:id', async (req, res) => {
    try {
        let highlights = await readHighlights();
        highlights = highlights.filter(h => h.id !== req.params.id);
        await saveHighlights(highlights);
        res.json({ message: '删除成功' });
    } catch (e) {
        res.status(500).json({ error: '删除失败' });
    }
});

// SPA Fallback: 确保 React Router 正常工作
app.get('*', (req, res) => {
  res.sendFile(path.join(buildPath, 'index.html'));
});

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, async () => {
  console.log(`\n==========================================`);
  console.log(`🚀 派能科技规章分析系统 - 便携版 启动成功！`);
  console.log(`🔧 服务端口: ${PORT}`);
  console.log(`📁 数据存储: ${rootPath}`);
  console.log(`==========================================\n`);
  
  // 向 Electron 父进程发送就绪信号
  if (process.send) {
    process.send('server-ready');
  }

  // 只有在非生产环境下自动打开浏览器
  if (process.env.NODE_ENV !== 'production' && !process.env.APP_ROOT) {
    try {
        const url = `http://localhost:${PORT}`;
        const start = (process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open');
        require('child_process').exec(`${start} ${url}`);
    } catch (e) { }
  }
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`Error: Port ${PORT} is already in use. Please close other instances.`);
    process.exit(1);
  } else {
    console.error('Server error:', e);
    process.exit(1);
  }
});

module.exports = app;
