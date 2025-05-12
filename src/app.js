const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const userRouter = require('./routes/user_router');
app.use('/user', userRouter);


app.get('/', (req, res) => {
    res.send('Welcome to Harmony Music Player!');
});

// 处理404错误
app.use((req, res) => {
    res.status(404).json({
        message: '请求的资源不存在',
        code: '404'
    });
});

// 全局错误处理
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: '服务器内部错误',
        code: '500'
    });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

