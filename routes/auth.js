const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role, department, fullName, position, permissions } = req.body;

    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({ error: '用户名或邮箱已存在' });
    }

    const user = new User({
      username,
      email,
      password,
      role: role || 'user',
      department,
      fullName,
      position,
      permissions: permissions || []
    });

    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.status(201).json({
      message: '用户注册成功',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        department: user.department,
        fullName: user.fullName,
        position: user.position,
        permissions: user.permissions
      }
    });
  } catch (error) {
    console.error('用户注册失败:', error);
    res.status(500).json({ error: '用户注册失败', details: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({
      $or: [{ username }, { email: username }]
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      message: '登录成功',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        department: user.department,
        fullName: user.fullName,
        position: user.position,
        permissions: user.permissions
      }
    });
  } catch (error) {
    console.error('用户登录失败:', error);
    res.status(500).json({ error: '用户登录失败', details: error.message });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
        department: req.user.department,
        fullName: req.user.fullName,
        position: req.user.position,
        permissions: req.user.permissions,
        lastLogin: req.user.lastLogin
      }
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({ error: '获取用户信息失败', details: error.message });
  }
});

router.put('/me', auth, async (req, res) => {
  try {
    const { fullName, position, department } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (fullName) user.fullName = fullName;
    if (position) user.position = position;
    if (department) user.department = department;
    
    await user.save();

    res.json({
      message: '用户信息更新成功',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        department: user.department,
        fullName: user.fullName,
        position: user.position,
        permissions: user.permissions
      }
    });
  } catch (error) {
    console.error('更新用户信息失败:', error);
    res.status(500).json({ error: '更新用户信息失败', details: error.message });
  }
});

router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);

    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: '当前密码错误' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: '密码修改成功' });
  } catch (error) {
    console.error('修改密码失败:', error);
    res.status(500).json({ error: '修改密码失败', details: error.message });
  }
});

module.exports = router;