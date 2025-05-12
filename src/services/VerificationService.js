class VerificationService {
    constructor() {
        // 存储结构 {email: {code: '123456', expiry: 1234567890}}
        this.codes = new Map();

        // 过期时间(毫秒) - 5分钟
        this.codeExpiryTime = 5 * 60 * 1000;
    }

    /**
     * 保存验证码
     * @param {string} email 
     * @param {string} code 
     */
    saveCode(email, code) {
        this.codes.set(email.toLowerCase(), {
            code: code,
            expiry: Date.now() + this.codeExpiryTime
        });
    }

    /**
     * 验证验证码
     * @param {string} email 
     * @param {string} code 
     * @returns {boolean}
     */
    verifyCode(email, code) {
        const emailLower = email.toLowerCase();
        const value = this.codes.get(emailLower);

        // 验证码不存在或已过期
        if (!value || Date.now() > value.expiry) {
            return false;
        }

        // 检查验证码匹配
        if (value.code !== code) {
            return false;
        }

        // 验证成功，删除验证码
        this.codes.delete(emailLower);
        return true;
    }

    /**
     * 清除过期的验证码
     */
    cleanupExpiredCodes() {
        const now = Date.now();
        for (const [email, value] of this.codes.entries()) {
            if (value.expiry < now) {
                this.codes.delete(email);
            }
        }
    }
}

// 每10分钟清理一次过期验证码
const verifycationService = new VerificationService();
setInterval(() => {
    verifycationService.cleanupExpiredCodes();
}, 10 * 60 * 1000);

module.exports = verifycationService;