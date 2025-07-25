const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs-extra');
const Utils = require('./utils');
const Builder = require('./builder');

/**
 * 开发服务器
 * 提供热重载和实时预览功能
 */
class DevServer {
  constructor(config = {}) {
    this.config = {
      port: 3000,
      host: 'localhost',
      open: true,
      livereload: true,
      watchIgnore: ['node_modules', '.git', 'dist'],
      ...config
    };
    
    this.utils = new Utils();
    this.builder = null;
    this.app = null;
    this.server = null;
    this.io = null;
    this.watcher = null;
    
    this.isBuilding = false;
    this.buildQueue = [];
    this.clients = new Set();
    
    // 绑定方法
    this.handleFileChange = this.utils.debounce(this.handleFileChange.bind(this), 300);
  }

  /**
   * 启动开发服务器
   * @param {object} builderConfig - 构建器配置
   */
  async start(builderConfig = {}) {
    try {
      // 初始化构建器
      this.builder = new Builder(builderConfig);
      
      // 执行初始构建
      this.utils.log('执行初始构建...', 'info');
      await this.builder.build();
      
      // 创建Express应用
      this.createApp();
      
      // 创建HTTP服务器
      this.createServer();
      
      // 设置Socket.IO
      this.setupSocketIO();
      
      // 启动文件监听
      this.startWatching();
      
      // 启动服务器
      await this.listen();
      
      this.utils.log(`开发服务器已启动: http://${this.config.host}:${this.config.port}`, 'info');
      
      // 自动打开浏览器
      if (this.config.open) {
        await this.openBrowser();
      }
      
    } catch (error) {
      this.utils.log(`开发服务器启动失败: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * 创建Express应用
   */
  createApp() {
    this.app = express();
    
    // 中间件
    this.app.use(this.loggerMiddleware.bind(this));
    this.app.use(this.corsMiddleware.bind(this));
    
    // 静态文件服务
    const outputDir = this.builder.config.build.output;
    this.app.use(express.static(outputDir));
    
    // API路由
    this.setupApiRoutes();
    
    // 开发工具路由
    this.setupDevRoutes();
    
    // SPA回退
    this.app.get('*', this.spaFallback.bind(this));
    
    // 错误处理
    this.app.use(this.errorHandler.bind(this));
  }

  /**
   * 创建HTTP服务器
   */
  createServer() {
    this.server = http.createServer(this.app);
  }

  /**
   * 设置Socket.IO
   */
  setupSocketIO() {
    if (!this.config.livereload) {
      return;
    }
    
    this.io = socketIo(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    
    this.io.on('connection', (socket) => {
      this.clients.add(socket);
      this.utils.log(`客户端已连接: ${socket.id}`, 'debug');
      
      socket.on('disconnect', () => {
        this.clients.delete(socket);
        this.utils.log(`客户端已断开: ${socket.id}`, 'debug');
      });
      
      // 发送初始状态
      socket.emit('status', {
        building: this.isBuilding,
        ready: true
      });
    });
  }

  /**
   * 设置API路由
   */
  setupApiRoutes() {
    // 构建状态API
    this.app.get('/api/status', (req, res) => {
      res.json({
        building: this.isBuilding,
        clients: this.clients.size,
        config: {
          livereload: this.config.livereload,
          port: this.config.port
        }
      });
    });
    
    // 手动重建API
    this.app.post('/api/rebuild', async (req, res) => {
      try {
        await this.rebuild('manual');
        res.json({ success: true, message: '重建完成' });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });
    
    // 清除缓存API
    this.app.post('/api/clear-cache', (req, res) => {
      try {
        this.builder.clearCache();
        res.json({ success: true, message: '缓存已清除' });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });
  }

  /**
   * 设置开发工具路由
   */
  setupDevRoutes() {
    // 开发工具页面
    this.app.get('/dev-tools', (req, res) => {
      res.send(this.generateDevToolsPage());
    });
    
    // 实时重载脚本
    this.app.get('/livereload.js', (req, res) => {
      res.type('application/javascript');
      res.send(this.generateLivereloadScript());
    });
  }

  /**
   * 启动文件监听
   */
  startWatching() {
    const watchPaths = [
      this.builder.config.build.content,
      this.builder.config.build.templates,
      this.builder.config.build.public,
      'site.config.js',
      'build.config.js'
    ].filter(Boolean);
    
    const watchOptions = {
      ignored: this.config.watchIgnore.map(pattern => 
        path.resolve(process.cwd(), pattern)
      ),
      persistent: true,
      ignoreInitial: true
    };
    
    this.watcher = chokidar.watch(watchPaths, watchOptions);
    
    this.watcher
      .on('add', (filePath) => this.handleFileChange('add', filePath))
      .on('change', (filePath) => this.handleFileChange('change', filePath))
      .on('unlink', (filePath) => this.handleFileChange('unlink', filePath))
      .on('addDir', (dirPath) => this.handleFileChange('addDir', dirPath))
      .on('unlinkDir', (dirPath) => this.handleFileChange('unlinkDir', dirPath))
      .on('error', (error) => {
        this.utils.log(`文件监听错误: ${error.message}`, 'error');
      });
    
    this.utils.log(`开始监听文件变化: ${watchPaths.join(', ')}`, 'info');
  }

  /**
   * 处理文件变化
   * @param {string} event - 事件类型
   * @param {string} filePath - 文件路径
   */
  async handleFileChange(event, filePath) {
    const relativePath = path.relative(process.cwd(), filePath);
    this.utils.log(`文件${event}: ${relativePath}`, 'debug');
    
    // 检查是否为配置文件
    const isConfigFile = ['site.config.js', 'build.config.js'].includes(path.basename(filePath));
    
    if (isConfigFile) {
      this.utils.log('配置文件已更改，重新加载配置...', 'info');
      await this.reloadConfig();
    }
    
    // 执行重建
    await this.rebuild(event, filePath);
  }

  /**
   * 重新加载配置
   */
  async reloadConfig() {
    try {
      // 清除require缓存
      const configFiles = [
        path.resolve(process.cwd(), 'site.config.js'),
        path.resolve(process.cwd(), 'build.config.js')
      ];
      
      configFiles.forEach(file => {
        delete require.cache[file];
      });
      
      // 重新初始化构建器
      const newBuilder = new Builder();
      await newBuilder.init();
      
      this.builder = newBuilder;
      
      this.utils.log('配置已重新加载', 'info');
      
    } catch (error) {
      this.utils.log(`配置重新加载失败: ${error.message}`, 'error');
    }
  }

  /**
   * 重建站点
   * @param {string} trigger - 触发原因
   * @param {string} filePath - 变化的文件路径
   */
  async rebuild(trigger = 'unknown', filePath = '') {
    // 防止重复构建
    if (this.isBuilding) {
      this.buildQueue.push({ trigger, filePath });
      return;
    }
    
    this.isBuilding = true;
    
    try {
      // 通知客户端开始构建
      this.broadcast('build:start', { trigger, filePath });
      
      const startTime = Date.now();
      
      // 执行构建
      await this.builder.build();
      
      const buildTime = Date.now() - startTime;
      
      this.utils.log(`重建完成 (${buildTime}ms)`, 'info');
      
      // 通知客户端构建完成
      this.broadcast('build:complete', { 
        trigger, 
        filePath, 
        buildTime,
        timestamp: new Date().toISOString()
      });
      
      // 如果启用了实时重载，通知客户端刷新
      if (this.config.livereload) {
        this.broadcast('reload');
      }
      
    } catch (error) {
      this.utils.log(`重建失败: ${error.message}`, 'error');
      
      // 通知客户端构建失败
      this.broadcast('build:error', {
        trigger,
        filePath,
        error: error.message,
        stack: error.stack
      });
      
    } finally {
      this.isBuilding = false;
      
      // 处理队列中的构建请求
      if (this.buildQueue.length > 0) {
        const next = this.buildQueue.shift();
        setImmediate(() => this.rebuild(next.trigger, next.filePath));
      }
    }
  }

  /**
   * 广播消息给所有客户端
   * @param {string} event - 事件名称
   * @param {any} data - 数据
   */
  broadcast(event, data = {}) {
    if (this.io) {
      this.io.emit(event, data);
    }
  }

  /**
   * 启动服务器监听
   */
  async listen() {
    return new Promise((resolve, reject) => {
      this.server.listen(this.config.port, this.config.host, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * 打开浏览器
   */
  async openBrowser() {
    const url = `http://${this.config.host}:${this.config.port}`;
    
    try {
      const { default: open } = await import('open');
      await open(url);
    } catch (error) {
      this.utils.log(`无法自动打开浏览器: ${error.message}`, 'warn');
      this.utils.log(`请手动访问: ${url}`, 'info');
    }
  }

  /**
   * 停止开发服务器
   */
  async stop() {
    this.utils.log('正在停止开发服务器...', 'info');
    
    // 停止文件监听
    if (this.watcher) {
      await this.watcher.close();
    }
    
    // 关闭Socket.IO
    if (this.io) {
      this.io.close();
    }
    
    // 关闭HTTP服务器
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(() => {
          this.utils.log('开发服务器已停止', 'info');
          resolve();
        });
      });
    }
  }

  /**
   * 日志中间件
   */
  loggerMiddleware(req, res, next) {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      const status = res.statusCode;
      const method = req.method;
      const url = req.url;
      
      if (status >= 400) {
        this.utils.log(`${method} ${url} ${status} - ${duration}ms`, 'warn');
      } else {
        this.utils.log(`${method} ${url} ${status} - ${duration}ms`, 'debug');
      }
    });
    
    next();
  }

  /**
   * CORS中间件
   */
  corsMiddleware(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  }

  /**
   * SPA回退处理
   */
  async spaFallback(req, res) {
    const outputDir = this.builder.config.build.output;
    const indexPath = path.join(outputDir, 'index.html');
    
    try {
      if (await fs.pathExists(indexPath)) {
        let content = await fs.readFile(indexPath, 'utf8');
        
        // 注入实时重载脚本
        if (this.config.livereload) {
          content = this.injectLivereloadScript(content);
        }
        
        res.type('html').send(content);
      } else {
        res.status(404).send('Page not found');
      }
    } catch (error) {
      res.status(500).send(`Server error: ${error.message}`);
    }
  }

  /**
   * 错误处理中间件
   */
  errorHandler(error, req, res, next) {
    this.utils.log(`服务器错误: ${error.message}`, 'error');
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }

  /**
   * 注入实时重载脚本
   * @param {string} html - HTML内容
   * @returns {string} 注入脚本后的HTML
   */
  injectLivereloadScript(html) {
    const script = `
<script src="/socket.io/socket.io.js"></script>
<script src="/livereload.js"></script>
`;
    
    return html.replace('</body>', `${script}</body>`);
  }

  /**
   * 生成实时重载脚本
   * @returns {string} JavaScript代码
   */
  generateLivereloadScript() {
    return `
(function() {
  const socket = io();
  let isReloading = false;
  
  // 连接状态指示器
  const indicator = document.createElement('div');
  indicator.id = 'dev-indicator';
  indicator.style.cssText = \`
    position: fixed;
    top: 10px;
    right: 10px;
    padding: 8px 12px;
    background: #4CAF50;
    color: white;
    border-radius: 4px;
    font-family: monospace;
    font-size: 12px;
    z-index: 10000;
    transition: all 0.3s ease;
  \`;
  indicator.textContent = '🟢 Connected';
  document.body.appendChild(indicator);
  
  // 事件处理
  socket.on('connect', () => {
    indicator.style.background = '#4CAF50';
    indicator.textContent = '🟢 Connected';
    console.log('[DevServer] Connected to development server');
  });
  
  socket.on('disconnect', () => {
    indicator.style.background = '#f44336';
    indicator.textContent = '🔴 Disconnected';
    console.log('[DevServer] Disconnected from development server');
  });
  
  socket.on('build:start', (data) => {
    indicator.style.background = '#FF9800';
    indicator.textContent = '🟡 Building...';
    console.log('[DevServer] Build started:', data);
  });
  
  socket.on('build:complete', (data) => {
    indicator.style.background = '#4CAF50';
    indicator.textContent = '🟢 Build Complete';
    console.log('[DevServer] Build completed in', data.buildTime + 'ms');
  });
  
  socket.on('build:error', (data) => {
    indicator.style.background = '#f44336';
    indicator.textContent = '🔴 Build Error';
    console.error('[DevServer] Build error:', data.error);
  });
  
  socket.on('reload', () => {
    if (!isReloading) {
      isReloading = true;
      console.log('[DevServer] Reloading page...');
      window.location.reload();
    }
  });
  
  // 键盘快捷键
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Shift + R: 手动重建
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'R') {
      e.preventDefault();
      fetch('/api/rebuild', { method: 'POST' })
        .then(res => res.json())
        .then(data => console.log('[DevServer] Manual rebuild:', data))
        .catch(err => console.error('[DevServer] Rebuild failed:', err));
    }
    
    // Ctrl/Cmd + Shift + C: 清除缓存
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
      e.preventDefault();
      fetch('/api/clear-cache', { method: 'POST' })
        .then(res => res.json())
        .then(data => console.log('[DevServer] Cache cleared:', data))
        .catch(err => console.error('[DevServer] Clear cache failed:', err));
    }
  });
})();
`;
  }

  /**
   * 生成开发工具页面
   * @returns {string} HTML内容
   */
  generateDevToolsPage() {
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>开发工具 - Static Blog Generator</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 {
      color: #333;
      margin-bottom: 30px;
    }
    .section {
      margin-bottom: 30px;
      padding: 20px;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
    }
    .section h2 {
      margin-top: 0;
      color: #555;
    }
    button {
      background: #007cba;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      margin-right: 10px;
      margin-bottom: 10px;
    }
    button:hover {
      background: #005a87;
    }
    .status {
      padding: 10px;
      border-radius: 4px;
      margin: 10px 0;
    }
    .status.success {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }
    .status.error {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }
    .status.info {
      background: #d1ecf1;
      color: #0c5460;
      border: 1px solid #bee5eb;
    }
    pre {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 4px;
      overflow-x: auto;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🛠️ 开发工具</h1>
    
    <div class="section">
      <h2>构建控制</h2>
      <button onclick="rebuild()">🔄 重新构建</button>
      <button onclick="clearCache()">🗑️ 清除缓存</button>
      <div id="build-status"></div>
    </div>
    
    <div class="section">
      <h2>服务器状态</h2>
      <div id="server-status"></div>
      <button onclick="refreshStatus()">🔄 刷新状态</button>
    </div>
    
    <div class="section">
      <h2>快捷键</h2>
      <ul>
        <li><kbd>Ctrl/Cmd + Shift + R</kbd> - 手动重建</li>
        <li><kbd>Ctrl/Cmd + Shift + C</kbd> - 清除缓存</li>
      </ul>
    </div>
    
    <div class="section">
      <h2>实时日志</h2>
      <div id="logs"></div>
      <button onclick="clearLogs()">清除日志</button>
    </div>
  </div>
  
  <script src="/socket.io/socket.io.js"></script>
  <script>
    const socket = io();
    const buildStatus = document.getElementById('build-status');
    const serverStatus = document.getElementById('server-status');
    const logs = document.getElementById('logs');
    
    function showStatus(element, message, type = 'info') {
      element.innerHTML = \`<div class="status \${type}">\${message}</div>\`;
    }
    
    function addLog(message, type = 'info') {
      const timestamp = new Date().toLocaleTimeString();
      const logEntry = document.createElement('div');
      logEntry.className = \`status \${type}\`;
      logEntry.innerHTML = \`[\${timestamp}] \${message}\`;
      logs.appendChild(logEntry);
      logs.scrollTop = logs.scrollHeight;
    }
    
    async function rebuild() {
      try {
        showStatus(buildStatus, '正在重建...', 'info');
        const response = await fetch('/api/rebuild', { method: 'POST' });
        const data = await response.json();
        
        if (data.success) {
          showStatus(buildStatus, data.message, 'success');
        } else {
          showStatus(buildStatus, data.error, 'error');
        }
      } catch (error) {
        showStatus(buildStatus, \`重建失败: \${error.message}\`, 'error');
      }
    }
    
    async function clearCache() {
      try {
        const response = await fetch('/api/clear-cache', { method: 'POST' });
        const data = await response.json();
        
        if (data.success) {
          showStatus(buildStatus, data.message, 'success');
        } else {
          showStatus(buildStatus, data.error, 'error');
        }
      } catch (error) {
        showStatus(buildStatus, \`清除缓存失败: \${error.message}\`, 'error');
      }
    }
    
    async function refreshStatus() {
      try {
        const response = await fetch('/api/status');
        const data = await response.json();
        
        serverStatus.innerHTML = \`
          <pre>\${JSON.stringify(data, null, 2)}</pre>
        \`;
      } catch (error) {
        showStatus(serverStatus, \`获取状态失败: \${error.message}\`, 'error');
      }
    }
    
    function clearLogs() {
      logs.innerHTML = '';
    }
    
    // Socket事件
    socket.on('connect', () => {
      addLog('已连接到开发服务器', 'success');
    });
    
    socket.on('disconnect', () => {
      addLog('与开发服务器断开连接', 'error');
    });
    
    socket.on('build:start', (data) => {
      addLog(\`开始构建: \${data.trigger}\`, 'info');
    });
    
    socket.on('build:complete', (data) => {
      addLog(\`构建完成 (\${data.buildTime}ms)\`, 'success');
    });
    
    socket.on('build:error', (data) => {
      addLog(\`构建失败: \${data.error}\`, 'error');
    });
    
    // 初始化
    refreshStatus();
  </script>
</body>
</html>
`;
  }
}

module.exports = DevServer;