const express = require('express');
const Version = require('../models/Version');
const VersionComparator = require('../utils/versionComparator');
const auth = require('../middleware/auth');

const router = express.Router();
const versionComparator = new VersionComparator();

router.get('/documents/:id', auth, async (req, res) => {
  try {
    const documentId = req.params.id;
    const { version1, version2 } = req.query;

    if (!version1 || !version2) {
      return res.status(400).json({ error: '需要指定两个版本号进行比较' });
    }

    const versions = await Version.find({
      documentId,
      version: { $in: [version1, version2] }
    }).lean();

    if (versions.length !== 2) {
      return res.status(404).json({ error: '找不到指定的版本' });
    }

    const version1Data = versions.find(v => v.version === version1);
    const version2Data = versions.find(v => v.version === version2);

    if (!version1Data || !version2Data) {
      return res.status(404).json({ error: '找不到指定的版本' });
    }

    const comparison = await versionComparator.compareVersions(version1Data, version2Data);
    const htmlComparison = versionComparator.generateHTMLComparison(comparison);

    res.json({
      comparison,
      html: htmlComparison
    });
  } catch (error) {
    console.error('版本比较失败:', error);
    res.status(500).json({ error: '版本比较失败', details: error.message });
  }
});

router.get('/documents/:id/all', auth, async (req, res) => {
  try {
    const documentId = req.params.id;
    const versions = await Version.find({ documentId })
      .sort({ version: -1 })
      .populate('uploadedBy', 'username fullName department')
      .lean();

    res.json({ versions });
  } catch (error) {
    console.error('获取版本列表失败:', error);
    res.status(500).json({ error: '获取版本列表失败', details: error.message });
  }
});

router.get('/documents/:id/latest', auth, async (req, res) => {
  try {
    const documentId = req.params.id;
    const latestVersion = await Version.findOne({ 
      documentId,
      isCurrent: true 
    })
      .populate('uploadedBy', 'username fullName department')
      .lean();

    if (!latestVersion) {
      return res.status(404).json({ error: '未找到当前版本' });
    }

    res.json({ version: latestVersion });
  } catch (error) {
    console.error('获取最新版本失败:', error);
    res.status(500).json({ error: '获取最新版本失败', details: error.message });
  }
});

module.exports = router;