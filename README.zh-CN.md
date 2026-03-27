# RuleScope

RuleScope 是一个用于规章制度文档浏览、检索与大纲识别的桌面软件。它适合处理 Word、文本和 PDF 文件，尤其支持识别 Word 中的自动编号结构，例如“第一章”“第一条”“（一）”这类层级标题。

[English README](./README.md)

## 功能特点

- 基于 Electron 的桌面应用
- React + Ant Design 前端
- 内嵌 Express 后端
- 支持上传 `.docx`、`.doc`、`.txt`、`.pdf`
- 自动识别 Word 连续编号并生成大纲
- 支持文档内搜索和大纲跳转
- 支持高亮摘录与笔记
- 支持中英文界面切换
- 支持 Windows 便携版打包

## 截图

![RuleScope 截图](./assets/screenshots/rulescope-main.png)

## EXE 使用方式

推荐普通用户直接使用 GitHub Releases 中提供的 Windows 便携版。

### 使用步骤

1. 打开 GitHub 上最新的 Release 页面。
2. 下载便携版压缩包或便携版目录。
3. 解压到本地任意文件夹。
4. 运行 `RuleScope.exe` 或该目录中的主程序。
5. 保持可执行文件与 `resources` 文件夹在同一目录下。

### 注意事项

- 无需安装。
- 程序在便携版模式下会将上传文件和本地元数据保存在可执行文件附近。
- 如果要迁移程序，请整体移动整个便携目录。
- 不要单独删除 `resources` 文件夹或语言文件。

## 本地开发

### 环境要求

- 建议 Node.js 18 及以上
- npm 8 及以上

### 安装依赖

```bash
npm install
cd client
npm install
```

### 开发模式运行

后端：

```bash
npm start
```

前端：

```bash
cd client
npm start
```

或同时启动：

```bash
npm run dev
```

### 构建前端

```bash
cd client
npm run build
```

### 本地运行 Electron

```bash
npm run electron
```

## 项目结构

```text
client/                 React 前端
controllers/            后端控制器
middleware/             Express 中间件
models/                 数据模型
routes/                 API 路由
scripts/                工具脚本
tests/                  测试文件
utils/                  文档解析工具
main.js                 Electron 入口
server-filemanager.js   桌面版后端入口
```

## 运行时数据

桌面版运行时会使用本地 JSON 和上传目录：

- `db.json`
- `highlights.json`
- `uploads/`

这些运行时文件不会提交到 Git。

## 许可证

MIT
