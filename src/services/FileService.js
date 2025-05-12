const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { verifyToken } = require('../utils/jwt');

// 上传目录
const UPLOAD_DIR = path.join(__dirname, '../../uploads/avatars');
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// 用户id作为文件名
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const token = req.headers.authorization;
        const decodedToken = verifyToken(token);
        const userId = decodedToken.id;
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${userId}${ext}`);
    }
});

// 过滤器
const fileFilter = (req, file, cb) => {
    // 接受的图片类型
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true); // 接受文件
    } else {
        cb(new Error('不支持的文件类型。请上传 JPG, JPEG, PNG 或 GIF 图片。'), false);
    }
};

// 上传配置
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 // 限制文件大小为1MB
    },
    fileFilter: fileFilter
});


// 获取头像路径
function getAvatarPath(userId) {
    const extensions = ['.jpg', '.jpeg', '.png', '.gif'];
    for (const ext of extensions) {
        const filePath = path.join(UPLOAD_DIR, `${userId}${ext}`);
        if (fs.existsSync(filePath)) {
            return filePath;
        }
    }
    // 默认头像
    return path.join(UPLOAD_DIR, 'default.png');
}


module.exports = {
    upload,
    UPLOAD_DIR,
    getAvatarPath
};