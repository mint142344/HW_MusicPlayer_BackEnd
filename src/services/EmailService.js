const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();
// console.log(`${process.env.SMTP_HOST} ${process.env.SMTP_PORT} ${process.env.SMTP_USER} ${process.env.SMTP_PASSWORD}`);

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_SECURE,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD,
            },
        });
    }

    /**
     * 生成随机6位验证码
     * @returns {string} 6位数字验证码
     */
    generateVerifyCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    /**
     * 发送验证码邮件
     * @param {string} to  - 接收者邮箱
     * @param {string} verifyCode  - 验证码
     */
    async sendVerifyCode(to, verifyCode) {
        const mailOptions = {
            from: process.env.SMTP_USER,
            to: to,
            subject: 'Harmony Music Player - 验证码',
            text: `您的验证码是：${verifyCode}。5分钟内有效。`,
        };

        try {
            await this.transporter.sendMail(mailOptions);
        } catch (error) {
            console.error(`Error sending email to ${to}:`, error);
        }
    }
}

module.exports = new EmailService();
