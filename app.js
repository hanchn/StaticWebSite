import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config/config.js';
import indexRouter from './routes/index.js';
import adminRouter from './routes/admin.js';
import apiRouter from './routes/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = config.server.port || 3000;

// 设置视图引擎
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 中间件配置
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'content/uploads')));

// 全局变量
app.locals.config = config;
app.locals.moment = (await import('moment')).default;

// 路由配置
app.use('/', indexRouter);
app.use('/admin', adminRouter);
app.use('/api', apiRouter);

// 404 错误处理
app.use((req, res) => {
  res.status(404).render('pages/404', {
    title: '页面未找到 - ' + config.site.title,
    message: '抱歉，您访问的页面不存在。'
  });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('pages/error', {
    title: '服务器错误 - ' + config.site.title,
    message: '服务器内部错误，请稍后重试。',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 博客服务器已启动`);
  console.log(`📍 本地地址: http://localhost:${PORT}`);
  console.log(`🔧 管理界面: http://localhost:${PORT}/admin`);
  console.log(`📝 开发模式: ${process.env.NODE_ENV || 'development'}`);
});

export default app;