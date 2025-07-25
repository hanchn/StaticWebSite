import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../config/config.js';
import { pathExists } from '../utils/file.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.join(__dirname, '..');
const DIST_DIR = path.join(PROJECT_ROOT, config.build.outputDir);

// 创建预览服务器
async function createPreviewServer() {
  const app = express();
  const PORT = config.server.port + 1000; // 使用不同的端口避免冲突
  
  // 检查 dist 目录是否存在
  if (!(await pathExists(DIST_DIR))) {
    console.error('❌ 静态文件目录不存在，请先运行 npm run build 生成静态文件');
    process.exit(1);
  }
  
  // 静态文件服务
  app.use(express.static(DIST_DIR));
  
  // SPA 路由处理 - 对于不存在的路径，尝试返回对应的 HTML 文件
  app.get('*', async (req, res) => {
    const requestPath = req.path;
    
    // 尝试不同的文件路径
    const possiblePaths = [
      path.join(DIST_DIR, requestPath + '.html'),
      path.join(DIST_DIR, requestPath, 'index.html'),
      path.join(DIST_DIR, requestPath + '/index.html')
    ];
    
    for (const filePath of possiblePaths) {
      if (await pathExists(filePath)) {
        return res.sendFile(filePath);
      }
    }
    
    // 如果都找不到，返回 404 页面或首页
    const notFoundPath = path.join(DIST_DIR, '404.html');
    const indexPath = path.join(DIST_DIR, 'index.html');
    
    if (await pathExists(notFoundPath)) {
      return res.status(404).sendFile(notFoundPath);
    } else if (await pathExists(indexPath)) {
      return res.status(404).sendFile(indexPath);
    } else {
      res.status(404).send('页面未找到');
    }
  });
  
  // 启动服务器
  app.listen(PORT, () => {
    console.log('🌐 静态站点预览服务器已启动');
    console.log(`📍 预览地址: http://localhost:${PORT}`);
    console.log(`📁 静态文件目录: ${DIST_DIR}`);
    console.log('💡 提示: 按 Ctrl+C 停止服务器');
  });
  
  // 优雅关闭
  process.on('SIGINT', () => {
    console.log('\n👋 预览服务器已停止');
    process.exit(0);
  });
  
  return app;
}

// 如果直接运行此脚本
if (import.meta.url === `file://${__filename}`) {
  createPreviewServer().catch(console.error);
}

export { createPreviewServer };