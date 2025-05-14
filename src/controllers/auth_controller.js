const User = require('../models/user');
const { validationResult } = require('express-validator');
const { generateToken, verifyToken } = require('../utils/jwt');
const verifyService = require('../services/VerificationService');
const path = require('path');
const fs = require('fs');

// 头像保存目录
const UPLOAD_DIR = path.join(__dirname, '../../uploads/avatars');
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}


const CODE = {
    SUCCESS: 200,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500
};

/**
 * 注册
 * @param {Object} req - 请求对象{ username, password, email, verify_code }
 * @param {Object} res - 响应对象{ message, code }
 * @returns 
 */
async function register(req, res) {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: '输入验证错误',
                code: CODE.BAD_REQUEST,
                errors: errors.array()
            });
        }

        const { username, password, email, verify_code } = req.body;

        // 检查验证码是否正确
        if (!verifyService.verifyCode(email, verify_code)) {
            return res.status(400).json({
                message: '验证码错误或已过期',
                code: CODE.BAD_REQUEST
            });
        }

        // 检查用户名是否已存在
        const existingUser = await User.findByUsername(username);
        if (existingUser) {
            return res.status(409).json({
                message: '用户名已存在',
                code: CODE.CONFLICT
            });
        }

        // 创建用户
        await User.createUser({
            username: username,
            password: password,
            email: email
        });

        res.status(201).json({
            message: '注册成功',
            code: CODE.SUCCESS
        });
    } catch (error) {
        console.error('注册失败:', error);
        return res.status(500).json({ message: '注册失败' });
    }
}

/**
 * 登录
 * @param {Object} req - 请求对象{ username, password }
 * @param {Object} res - 响应对象{ message, code, user }
 * @returns 
 */
async function login(req, res) {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: '输入验证错误',
                code: CODE.BAD_REQUEST,
                errors: errors.array()
            });
        }

        const { username, password } = req.body;

        // 查找用户
        const user = await User.findByUsername(username)
        if (!user) {
            return res.status(401).json({
                message: '用户名或密码错误',
                code: CODE.UNAUTHORIZED
            });
        }

        const isPasswordValid = await User.verifyPassword(password, user.passwd_hash);
        if (!isPasswordValid) {
            return res.status(401).json({
                message: '用户名或密码错误',
                code: CODE.UNAUTHORIZED
            });
        }

        const token = generateToken({ id: user.id, username: user.username });
        const userInfo = {
            id: user.id,
            username: user.username,
            email: user.email,
            create_at: user.create_at,
            qq_id: user.qq_id,
            netease_id: user.netease_id
        };

        res.setHeader('Authorization', token);
        res.json({
            message: '登录成功',
            code: CODE.SUCCESS,
            user: userInfo
        });
    } catch (error) {
        console.error('登录失败:', error);
        return res.status(500).json({ message: '登录失败' });
    }
}

/**
 * 修改密码
 * @param {Object} req - 请求对象{ username, new_password, email, verify_code }
 * @param {Object} res - 响应对象{ message, code }
 */
async function changePassword(req, res) {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: '输入验证错误',
                code: CODE.BAD_REQUEST,
                errors: errors.array()
            });
        }

        const { username, new_password, email, verify_code } = req.body;

        // 检查验证码是否正确
        if (!verifyService.verifyCode(email, verify_code)) {
            return res.status(400).json({
                message: '验证码错误或已过期',
                code: CODE.BAD_REQUEST
            });
        }

        // 查找用户
        const user = await User.findByUsername(username);
        if (!user) {
            return res.status(404).json({
                message: '用户不存在',
                code: CODE.NOT_FOUND
            });
        }

        // 修改密码
        await User.updatePassword(user.id, new_password);

        res.json({
            message: '密码修改成功',
            code: CODE.SUCCESS
        });

    } catch (error) {
        console.error('修改密码失败:', error);
        return res.status(500).json({ message: '修改密码失败' });
    }
}

/**
 *  绑定平台ID
 * @param {Object} req - 请求对象{ platform, platform_id } Header: { Authorization }
 * @param {Object} res - 响应对象{ message, code }
 */
async function bindPlatformId(req, res) {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: '输入验证错误',
                code: CODE.BAD_REQUEST,
                errors: errors.array()
            });
        }

        const { platform, platform_id } = req.body;
        const token = req.headers.authorization;
        const decodedToken = verifyToken(token);

        if (!decodedToken) {
            return res.status(401).json({
                message: '无效的令牌',
                code: CODE.UNAUTHORIZED
            });
        }

        const userId = decodedToken.id;

        const user = await User.findById(userId);

        // 绑定平台ID
        await User.updateUser({
            id: userId,
            username: decodedToken.username,
            qq_id: platform === 'qq' ? platform_id : user.qq_id,
            netease_id: platform === 'netease' ? platform_id : user.netease_id
        });

        res.json({
            message: '绑定平台ID成功',
            code: CODE.SUCCESS
        });

    } catch (error) {
        console.error('绑定平台ID失败:', error);
        return res.status(500).json({ message: '绑定平台ID失败' });
    }
}

/**
 * 上传头像
 * @param {Object} req - 请求对象{ avatar } Header: { Authorization }
 * @param {Object} res - 响应对象{ message, code }
 */
async function uploadAvatar(req, res) {
    try {
        const token = req.headers.authorization;
        const decodedToken = verifyToken(token);

        if (!decodedToken) {
            return res.status(401).json({
                message: '无效的令牌',
                code: CODE.UNAUTHORIZED
            });
        }

        const userId = decodedToken.id;
        const { avatar } = req.body;
        if (!avatar) {
            return res.status(400).json({
                message: '缺少图片数据',
                code: CODE.BAD_REQUEST
            });
        }

        // 去除 Base64 前缀
        const matches = avatar.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            return res.status(400).json({
                message: '无效的图片数据格式',
                code: CODE.BAD_REQUEST
            });
        }

        // 获取MIME类型和实际的Base64数据
        const imageType = matches[1];
        const imageData = matches[2];
        const buffer = Buffer.from(imageData, 'base64');

        // 根据图片类型决定文件扩展名
        let fileExtension;
        switch (imageType) {
            case 'image/jpeg':
            case 'image/jpg':
                fileExtension = '.jpg';
                break;
            case 'image/png':
                fileExtension = '.png';
                break;
            case 'image/gif':
                fileExtension = '.gif';
                break;
            default:
                fileExtension = '.jpg'; // 默认为jpg
        }

        // 清理之前的头像文件
        const extensions = ['.jpg', '.jpeg', '.png', '.gif'];
        for (const ext of extensions) {
            const oldFilePath = path.join(UPLOAD_DIR, `${userId}${ext}`);
            if (fs.existsSync(oldFilePath)) {
                fs.unlinkSync(oldFilePath);
            }
        }

        // 保存新头像
        const avatarPath = path.join(UPLOAD_DIR, `${userId}${fileExtension}`);
        fs.writeFileSync(avatarPath, buffer);

        res.json({
            message: '头像上传成功',
            code: CODE.SUCCESS
        });

        console.log('头像保存成功:', avatarPath);
    } catch (error) {
        console.error('上传头像失败:', error);
        return res.status(500).json({ message: '上传头像失败' });
    }
}

/**
 * 获取头像
 * @param {Object} req - 请求对象 params: { id }
 * @param {Object} res - 响应对象{ message, code}
 */
async function getAvatar(req, res) {
    try {
        const userId = req.params.id;
        if (!userId) {
            return res.status(400).json({
                message: '无效的用户ID',
                code: CODE.BAD_REQUEST
            });
        }

        // 获取头像路径
        let avatarPath = getAvatarPath(userId);
        if (!avatarPath) {
            avatarPath = path.join(UPLOAD_DIR, 'default.png');
        }

        res.sendFile(avatarPath);
    } catch (error) {
        console.error('获取头像失败:', error);
        return res.status(500).json({ message: '获取头像失败' });
    }
}

function getAvatarPath(userId) {
    const extensions = ['.jpg', '.jpeg', '.png', '.gif'];

    for (const ext of extensions) {
        const filePath = path.join(UPLOAD_DIR, `${userId}${ext}`);
        if (fs.existsSync(filePath)) {
            return filePath;
        }
    }

    return null;
}

module.exports = {
    register,
    login,
    changePassword,
    bindPlatformId,
    uploadAvatar,
    getAvatar
};