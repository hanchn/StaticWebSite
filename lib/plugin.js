const fs = require('fs-extra');
const path = require('path');
const { EventEmitter } = require('events');
const Utils = require('./utils');

/**
 * 插件系统
 * 负责插件的加载、管理和钩子系统
 */
class Plugin extends EventEmitter {
  constructor(pluginConfig = {}) {
    super();
    
    this.pluginConfig = pluginConfig;
    this.utils = new Utils();
    
    // 插件存储
    this.plugins = new Map();
    this.hooks = new Map();
    
    // 初始化钩子
    this.initializeHooks();
  }

  /**
   * 初始化钩子系统
   */
  initializeHooks() {
    const defaultHooks = [
      'before:build',
      'after:scan',
      'before:render',
      'after:render',
      'before:write',
      'after:build',
      'dev:reload',
      'plugin:loaded',
      'plugin:error'
    ];
    
    defaultHooks.forEach(hookName => {
      this.hooks.set(hookName, []);
    });
  }

  /**
   * 加载插件
   */
  async loadPlugins() {
    const pluginOrder = this.pluginConfig.order || [];
    const pluginConfigs = this.pluginConfig.config || {};
    
    // 按顺序加载插件
    for (const pluginName of pluginOrder) {
      try {
        await this.loadPlugin(pluginName, pluginConfigs[pluginName] || {});
      } catch (error) {
        this.utils.log(`插件加载失败: ${pluginName} - ${error.message}`, 'error');
        this.emit('plugin:error', { pluginName, error });
      }
    }
    
    this.utils.log(`已加载 ${this.plugins.size} 个插件`, 'info');
  }

  /**
   * 加载单个插件
   * @param {string} pluginName - 插件名称
   * @param {object} config - 插件配置
   */
  async loadPlugin(pluginName, config = {}) {
    // 查找插件文件
    const pluginPath = await this.findPlugin(pluginName);
    
    if (!pluginPath) {
      throw new Error(`插件不存在: ${pluginName}`);
    }
    
    // 加载插件模块
    delete require.cache[pluginPath];
    const PluginModule = require(pluginPath);
    
    // 创建插件实例
    let plugin;
    if (typeof PluginModule === 'function') {
      plugin = new PluginModule(config);
    } else if (typeof PluginModule === 'object') {
      plugin = PluginModule;
    } else {
      throw new Error(`无效的插件格式: ${pluginName}`);
    }
    
    // 验证插件
    this.validatePlugin(plugin, pluginName);
    
    // 注册插件
    this.plugins.set(pluginName, {
      instance: plugin,
      config,
      loaded: true
    });
    
    // 注册钩子
    if (plugin.hooks) {
      this.registerPluginHooks(pluginName, plugin.hooks);
    }
    
    // 初始化插件
    if (typeof plugin.init === 'function') {
      await plugin.init(config);
    }
    
    this.emit('plugin:loaded', { pluginName, plugin });
    this.utils.log(`插件已加载: ${pluginName}`, 'info');
  }

  /**
   * 查找插件文件
   * @param {string} pluginName - 插件名称
   * @returns {Promise<string|null>} 插件文件路径
   */
  async findPlugin(pluginName) {
    const searchPaths = [
      // 本地插件目录
      path.resolve(process.cwd(), 'plugins', pluginName, 'index.js'),
      path.resolve(process.cwd(), 'plugins', `${pluginName}.js`),
      
      // 内置插件
      path.resolve(__dirname, '..', 'plugins', pluginName, 'index.js'),
      path.resolve(__dirname, '..', 'plugins', `${pluginName}.js`),
      
      // npm包
      path.resolve(process.cwd(), 'node_modules', `static-blog-plugin-${pluginName}`, 'index.js'),
      path.resolve(process.cwd(), 'node_modules', pluginName, 'index.js')
    ];
    
    for (const pluginPath of searchPaths) {
      if (await fs.pathExists(pluginPath)) {
        return pluginPath;
      }
    }
    
    return null;
  }

  /**
   * 验证插件
   * @param {object} plugin - 插件实例
   * @param {string} pluginName - 插件名称
   */
  validatePlugin(plugin, pluginName) {
    if (!plugin.name) {
      plugin.name = pluginName;
    }
    
    if (!plugin.version) {
      plugin.version = '1.0.0';
    }
    
    // 验证钩子格式
    if (plugin.hooks) {
      for (const [hookName, handlers] of Object.entries(plugin.hooks)) {
        if (!Array.isArray(handlers) && typeof handlers !== 'function') {
          throw new Error(`插件 ${pluginName} 的钩子 ${hookName} 格式无效`);
        }
      }
    }
  }

  /**
   * 注册插件钩子
   * @param {string} pluginName - 插件名称
   * @param {object} hooks - 钩子定义
   */
  registerPluginHooks(pluginName, hooks) {
    for (const [hookName, handlers] of Object.entries(hooks)) {
      // 确保钩子存在
      if (!this.hooks.has(hookName)) {
        this.hooks.set(hookName, []);
      }
      
      const hookHandlers = this.hooks.get(hookName);
      
      // 注册处理器
      if (Array.isArray(handlers)) {
        handlers.forEach(handler => {
          hookHandlers.push({
            plugin: pluginName,
            handler
          });
        });
      } else if (typeof handlers === 'function') {
        hookHandlers.push({
          plugin: pluginName,
          handler: handlers
        });
      }
    }
  }

  /**
   * 执行钩子
   * @param {string} hookName - 钩子名称
   * @param {...any} args - 钩子参数
   * @returns {Promise<any>} 钩子执行结果
   */
  async executeHook(hookName, ...args) {
    const hookHandlers = this.hooks.get(hookName) || [];
    
    if (hookHandlers.length === 0) {
      return args[0]; // 返回第一个参数作为默认结果
    }
    
    let result = args[0];
    
    for (const { plugin: pluginName, handler } of hookHandlers) {
      try {
        const hookResult = await handler(result, ...args.slice(1));
        
        // 如果钩子返回了值，更新结果
        if (hookResult !== undefined) {
          result = hookResult;
        }
      } catch (error) {
        this.utils.log(`钩子执行失败: ${hookName} (${pluginName}) - ${error.message}`, 'error');
        this.emit('plugin:error', { pluginName, hookName, error });
      }
    }
    
    return result;
  }

  /**
   * 注册自定义钩子
   * @param {string} hookName - 钩子名称
   * @param {Function} handler - 处理函数
   * @param {string} pluginName - 插件名称
   */
  registerHook(hookName, handler, pluginName = 'custom') {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
    }
    
    this.hooks.get(hookName).push({
      plugin: pluginName,
      handler
    });
  }

  /**
   * 移除钩子
   * @param {string} hookName - 钩子名称
   * @param {string} pluginName - 插件名称
   */
  removeHook(hookName, pluginName) {
    const hookHandlers = this.hooks.get(hookName);
    
    if (hookHandlers) {
      const filteredHandlers = hookHandlers.filter(h => h.plugin !== pluginName);
      this.hooks.set(hookName, filteredHandlers);
    }
  }

  /**
   * 获取插件信息
   * @param {string} pluginName - 插件名称
   * @returns {object|null} 插件信息
   */
  getPlugin(pluginName) {
    return this.plugins.get(pluginName) || null;
  }

  /**
   * 获取所有插件
   * @returns {Map} 插件映射
   */
  getAllPlugins() {
    return new Map(this.plugins);
  }

  /**
   * 检查插件是否已加载
   * @param {string} pluginName - 插件名称
   * @returns {boolean} 是否已加载
   */
  isPluginLoaded(pluginName) {
    const plugin = this.plugins.get(pluginName);
    return plugin && plugin.loaded;
  }

  /**
   * 卸载插件
   * @param {string} pluginName - 插件名称
   */
  async unloadPlugin(pluginName) {
    const pluginInfo = this.plugins.get(pluginName);
    
    if (!pluginInfo) {
      throw new Error(`插件不存在: ${pluginName}`);
    }
    
    const { instance } = pluginInfo;
    
    // 调用插件的销毁方法
    if (typeof instance.destroy === 'function') {
      await instance.destroy();
    }
    
    // 移除所有相关钩子
    for (const hookName of this.hooks.keys()) {
      this.removeHook(hookName, pluginName);
    }
    
    // 从插件列表中移除
    this.plugins.delete(pluginName);
    
    this.utils.log(`插件已卸载: ${pluginName}`, 'info');
  }

  /**
   * 重新加载插件
   * @param {string} pluginName - 插件名称
   */
  async reloadPlugin(pluginName) {
    const pluginInfo = this.plugins.get(pluginName);
    
    if (pluginInfo) {
      const config = pluginInfo.config;
      await this.unloadPlugin(pluginName);
      await this.loadPlugin(pluginName, config);
    } else {
      throw new Error(`插件不存在: ${pluginName}`);
    }
  }

  /**
   * 获取钩子列表
   * @param {string} hookName - 钩子名称（可选）
   * @returns {Map|Array} 钩子映射或特定钩子的处理器列表
   */
  getHooks(hookName) {
    if (hookName) {
      return this.hooks.get(hookName) || [];
    }
    return new Map(this.hooks);
  }

  /**
   * 清除所有插件
   */
  async clearPlugins() {
    const pluginNames = Array.from(this.plugins.keys());
    
    for (const pluginName of pluginNames) {
      await this.unloadPlugin(pluginName);
    }
    
    this.utils.log('所有插件已清除', 'info');
  }

  /**
   * 获取插件统计信息
   * @returns {object} 统计信息
   */
  getStats() {
    const stats = {
      totalPlugins: this.plugins.size,
      loadedPlugins: 0,
      totalHooks: this.hooks.size,
      totalHandlers: 0,
      pluginsByHook: {}
    };
    
    // 统计已加载插件
    for (const pluginInfo of this.plugins.values()) {
      if (pluginInfo.loaded) {
        stats.loadedPlugins++;
      }
    }
    
    // 统计钩子处理器
    for (const [hookName, handlers] of this.hooks) {
      stats.totalHandlers += handlers.length;
      stats.pluginsByHook[hookName] = handlers.map(h => h.plugin);
    }
    
    return stats;
  }

  /**
   * 创建插件上下文
   * @param {object} additionalContext - 额外的上下文数据
   * @returns {object} 插件上下文
   */
  createContext(additionalContext = {}) {
    return {
      utils: this.utils,
      registerHook: this.registerHook.bind(this),
      executeHook: this.executeHook.bind(this),
      getPlugin: this.getPlugin.bind(this),
      ...additionalContext
    };
  }
}

module.exports = Plugin;