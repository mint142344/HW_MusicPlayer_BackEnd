const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/auth_controller');
const emailController = require('../controllers/email_controller');
const { upload } = require('../services/FileService');

const router = express.Router();

// 1.发送验证码
router.post('/verify_code', [
    // 验证邮箱
    body('email')
        .isEmail()
        .withMessage('请提供有效的电子邮件地址')
        .normalizeEmail()
], emailController.sendVerifyCode);

// 2.注册
router.post('/register', [
    // 验证用户名
    body('username')
        .isLength({ min: 3, max: 50 })
        .withMessage('用户名长度应在3-50个字符之间')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('用户名只能包含字母、数字和下划线'),

    // 验证密码
    body('password')
        .isLength({ min: 6 })
        .withMessage('密码长度至少为6个字符'),

    // 验证邮箱
    body('email')
        .isEmail()
        .withMessage('请提供有效的电子邮件地址')
        .normalizeEmail(),

    // 验证验证码
    body('verify_code')
        .isLength({ min: 6, max: 6 })
        .isNumeric()
        .withMessage('验证码应为6位数字')
], userController.register);

// 3.登录
router.post('/login', [
    // 验证用户名
    body('username')
        .notEmpty()
        .withMessage('用户名不能为空'),

    // 验证密码
    body('password')
        .notEmpty()
        .withMessage('密码不能为空')
], userController.login);

// 4.修改密码
router.post('/password', [
    body('username')
        .notEmpty()
        .withMessage('用户名不能为空'),

    body('new_password')
        .isLength({ min: 6 })
        .withMessage('新密码长度至少为6个字符'),

    body('email')
        .isEmail()
        .withMessage('请提供有效的电子邮件地址')
        .normalizeEmail(),

    body('verify_code')
        .isLength({ min: 6, max: 6 })
        .isNumeric()
        .withMessage('验证码应为6位数字')
], userController.changePassword);

// 5.绑定平台id
router.post('/platform', [
    // qq | netease
    body('platform')
        .isIn(['qq', 'netease'])
        .withMessage('平台只能是qq或netease'),

    body('platform_id')
        .notEmpty()
        .withMessage('平台ID不能为空'),
], userController.bindPlatformId);

// 6.上传头像
router.post('/avatar', [
    // 验证头像文件
    upload.single('avatar'),
], userController.uploadAvatar);

// 7.获取头像
router.get('/avatar/:id', userController.getAvatar);

module.exports = router;