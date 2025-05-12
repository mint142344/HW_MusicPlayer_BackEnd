const { validationResult } = require('express-validator');
const emailService = require('../services/EmailService');
const verifyService = require('../services/VerificationService');

const CODE = {
    SUCCESS: 200,
    BAD_REQUEST: 400,
    SERVER_ERROR: 500,
};

/**
 * 发送验证码
 * @param {Object} req - 请求对象{ email }
 * @param {Object} res - 响应对象
 * @returns 
 */
async function sendVerifyCode(req, res) {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: '输入验证失败',
                coed: CODE.BAD_REQUEST,
                errors: errors.array()
            });
        };

        const { email } = req.body;
        const verifyCode = emailService.generateVerifyCode();

        // 保存验证码
        verifyService.saveCode(email, verifyCode);
        // 发送验证码
        await emailService.sendVerifyCode(email, verifyCode);

        res.json({
            message: '验证码已发送',
            code: CODE.SUCCESS,
        });
    } catch (error) {
        console.error('Error sending verification code:', error);
        return res.status(CODE.SERVER_ERROR).json({
            message: '服务器内部错误',
            code: CODE.SERVER_ERROR,
        });
    }
}

module.exports = {
    sendVerifyCode,
};