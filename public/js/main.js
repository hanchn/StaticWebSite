/**
 * 静态网站生成器 - 前端脚本
 * 提供基础的交互功能和用户体验增强
 */

(function() {
  'use strict';
  
  // 全局配置
  const config = {
    searchDebounceTime: 300,
    scrollThreshold: 100,
    animationDuration: 300
  };
  
  // 工具函数
  const utils = {
    // 防抖函数
    debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },
    
    // 节流函数
    throttle(func, limit) {
      let inThrottle;
      return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
          func.apply(context, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    },
    
    // 平滑滚动到元素
    scrollToElement(element, offset = 0) {
      if (!element) return;
      
      const elementPosition = element.offsetTop - offset;
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    },
    
    // 获取元素相对于视口的位置
    getElementPosition(element) {
      const rect = element.getBoundingClientRect();
      return {
        top: rect.top + window.pageYOffset,
        left: rect.left + window.pageXOffset,
        bottom: rect.bottom + window.pageYOffset,
        right: rect.right + window.pageXOffset
      };
    },
    
    // 检查元素是否在视口中
    isElementInViewport(element) {
      const rect = element.getBoundingClientRect();
      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      );
    },
    
    // 格式化日期
    formatDate(date, format = 'YYYY-MM-DD') {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      
      return format
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day);
    },
    
    // 复制文本到剪贴板
    async copyToClipboard(text) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (err) {
        // 降级方案
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
          document.body.removeChild(textArea);
          return true;
        } catch (err) {
          document.body.removeChild(textArea);
          return false;
        }
      }
    },
    
    // 显示通知
    showNotification(message, type = 'info', duration = 3000) {
      const notification = document.createElement('div');
      notification.className = `notification notification-${type}`;
      notification.textContent = message;
      
      // 样式
      Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 20px',
        borderRadius: '6px',
        color: 'white',
        fontWeight: '500',
        zIndex: '9999',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease',
        maxWidth: '300px',
        wordWrap: 'break-word'
      });
      
      // 根据类型设置背景色
      const colors = {
        info: '#3b82f6',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444'
      };
      notification.style.backgroundColor = colors[type] || colors.info;
      
      document.body.appendChild(notification);
      
      // 显示动画
      setTimeout(() => {
        notification.style.transform = 'translateX(0)';
      }, 10);
      
      // 自动隐藏
      setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }, duration);
    }
  };
  
  // 导航功能
  const navigation = {
    init() {
      this.initMobileMenu();
      this.initScrollSpy();
      this.initBackToTop();
    },
    
    // 移动端菜单
    initMobileMenu() {
      const header = document.querySelector('.site-header');
      if (!header) return;
      
      // 创建移动端菜单按钮
      const menuButton = document.createElement('button');
      menuButton.className = 'mobile-menu-button';
      menuButton.innerHTML = `
        <span class="hamburger">
          <span></span>
          <span></span>
          <span></span>
        </span>
      `;
      
      // 添加样式
      const style = document.createElement('style');
      style.textContent = `
        .mobile-menu-button {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
        }
        
        .hamburger {
          display: flex;
          flex-direction: column;
          width: 24px;
          height: 18px;
          justify-content: space-between;
        }
        
        .hamburger span {
          display: block;
          height: 2px;
          background: #374151;
          border-radius: 1px;
          transition: all 0.3s ease;
        }
        
        .mobile-menu-button.active .hamburger span:nth-child(1) {
          transform: rotate(45deg) translate(6px, 6px);
        }
        
        .mobile-menu-button.active .hamburger span:nth-child(2) {
          opacity: 0;
        }
        
        .mobile-menu-button.active .hamburger span:nth-child(3) {
          transform: rotate(-45deg) translate(6px, -6px);
        }
        
        @media (max-width: 768px) {
          .mobile-menu-button {
            display: block;
          }
          
          .site-nav {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            transform: translateY(-100%);
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
          }
          
          .site-nav.active {
            transform: translateY(0);
            opacity: 1;
            visibility: visible;
          }
          
          .nav-menu {
            flex-direction: column;
            padding: 1rem;
            gap: 0;
          }
          
          .nav-menu li {
            border-bottom: 1px solid #e5e7eb;
          }
          
          .nav-menu li:last-child {
            border-bottom: none;
          }
          
          .nav-menu a {
            display: block;
            padding: 1rem 0;
            border-bottom: none;
          }
        }
      `;
      
      document.head.appendChild(style);
      
      // 插入菜单按钮
      const headerContent = header.querySelector('.header-content');
      if (headerContent) {
        headerContent.appendChild(menuButton);
      }
      
      // 菜单切换功能
      const nav = header.querySelector('.site-nav');
      if (nav) {
        menuButton.addEventListener('click', () => {
          menuButton.classList.toggle('active');
          nav.classList.toggle('active');
        });
        
        // 点击外部关闭菜单
        document.addEventListener('click', (e) => {
          if (!header.contains(e.target)) {
            menuButton.classList.remove('active');
            nav.classList.remove('active');
          }
        });
      }
    },
    
    // 滚动监听
    initScrollSpy() {
      const navLinks = document.querySelectorAll('.nav-menu a[href^="#"]');
      if (navLinks.length === 0) return;
      
      const sections = Array.from(navLinks).map(link => {
        const href = link.getAttribute('href');
        const section = document.querySelector(href);
        return { link, section, href };
      }).filter(item => item.section);
      
      if (sections.length === 0) return;
      
      const updateActiveLink = utils.throttle(() => {
        const scrollPosition = window.pageYOffset + 100;
        
        for (let i = sections.length - 1; i >= 0; i--) {
          const section = sections[i].section;
          if (section.offsetTop <= scrollPosition) {
            // 移除所有活动状态
            sections.forEach(item => item.link.classList.remove('active'));
            // 添加当前活动状态
            sections[i].link.classList.add('active');
            break;
          }
        }
      }, 100);
      
      window.addEventListener('scroll', updateActiveLink);
      updateActiveLink(); // 初始调用
    },
    
    // 返回顶部按钮
    initBackToTop() {
      const backToTop = document.createElement('button');
      backToTop.className = 'back-to-top';
      backToTop.innerHTML = '↑';
      backToTop.setAttribute('aria-label', '返回顶部');
      
      // 样式
      Object.assign(backToTop.style, {
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        background: '#667eea',
        color: 'white',
        border: 'none',
        cursor: 'pointer',
        fontSize: '20px',
        zIndex: '1000',
        opacity: '0',
        visibility: 'hidden',
        transition: 'all 0.3s ease',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
      });
      
      document.body.appendChild(backToTop);
      
      // 滚动显示/隐藏
      const toggleBackToTop = utils.throttle(() => {
        if (window.pageYOffset > config.scrollThreshold) {
          backToTop.style.opacity = '1';
          backToTop.style.visibility = 'visible';
        } else {
          backToTop.style.opacity = '0';
          backToTop.style.visibility = 'hidden';
        }
      }, 100);
      
      window.addEventListener('scroll', toggleBackToTop);
      
      // 点击返回顶部
      backToTop.addEventListener('click', () => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      });
      
      // 悬停效果
      backToTop.addEventListener('mouseenter', () => {
        backToTop.style.background = '#5a67d8';
        backToTop.style.transform = 'scale(1.1)';
      });
      
      backToTop.addEventListener('mouseleave', () => {
        backToTop.style.background = '#667eea';
        backToTop.style.transform = 'scale(1)';
      });
    }
  };
  
  // 搜索功能
  const search = {
    init() {
      this.initSearchBox();
      this.initQuickSearch();
    },
    
    // 搜索框功能
    initSearchBox() {
      const searchInputs = document.querySelectorAll('input[type="search"], input[placeholder*="搜索"]');
      
      searchInputs.forEach(input => {
        const debouncedSearch = utils.debounce((query) => {
          this.performSearch(query, input);
        }, config.searchDebounceTime);
        
        input.addEventListener('input', (e) => {
          debouncedSearch(e.target.value.trim());
        });
        
        // 回车搜索
        input.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            this.performSearch(input.value.trim(), input);
          }
        });
      });
    },
    
    // 执行搜索
    async performSearch(query, inputElement) {
      if (!query) {
        this.clearSearchResults(inputElement);
        return;
      }
      
      try {
        // 如果有搜索API，调用API
        if (window.searchAPI) {
          const results = await window.searchAPI.search(query);
          this.displaySearchResults(results, inputElement);
        } else {
          // 降级到页面内搜索
          this.performPageSearch(query, inputElement);
        }
      } catch (error) {
        console.error('搜索失败:', error);
        utils.showNotification('搜索失败，请稍后重试', 'error');
      }
    },
    
    // 页面内搜索
    performPageSearch(query, inputElement) {
      const searchableElements = document.querySelectorAll('article, .post-card, .search-item');
      const results = [];
      
      searchableElements.forEach(element => {
        const text = element.textContent.toLowerCase();
        const queryLower = query.toLowerCase();
        
        if (text.includes(queryLower)) {
          const title = element.querySelector('h1, h2, h3, .post-title, .title');
          const link = element.querySelector('a');
          
          results.push({
            title: title ? title.textContent : '无标题',
            url: link ? link.href : '#',
            excerpt: this.extractExcerpt(text, queryLower)
          });
        }
      });
      
      this.displaySearchResults(results, inputElement);
    },
    
    // 提取摘要
    extractExcerpt(text, query, maxLength = 150) {
      const index = text.indexOf(query);
      if (index === -1) return text.substring(0, maxLength) + '...';
      
      const start = Math.max(0, index - 50);
      const end = Math.min(text.length, index + query.length + 50);
      
      let excerpt = text.substring(start, end);
      if (start > 0) excerpt = '...' + excerpt;
      if (end < text.length) excerpt = excerpt + '...';
      
      return excerpt;
    },
    
    // 显示搜索结果
    displaySearchResults(results, inputElement) {
      this.clearSearchResults(inputElement);
      
      if (results.length === 0) {
        this.showNoResults(inputElement);
        return;
      }
      
      const resultsContainer = document.createElement('div');
      resultsContainer.className = 'search-results';
      
      // 样式
      Object.assign(resultsContainer.style, {
        position: 'absolute',
        top: '100%',
        left: '0',
        right: '0',
        background: 'white',
        border: '1px solid #e5e7eb',
        borderTop: 'none',
        borderRadius: '0 0 0.5rem 0.5rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        maxHeight: '400px',
        overflowY: 'auto',
        zIndex: '1000'
      });
      
      results.slice(0, 10).forEach(result => {
        const item = document.createElement('a');
        item.href = result.url;
        item.className = 'search-result-item';
        item.innerHTML = `
          <div class="result-title">${this.highlightQuery(result.title, inputElement.value)}</div>
          <div class="result-excerpt">${this.highlightQuery(result.excerpt, inputElement.value)}</div>
        `;
        
        // 样式
        Object.assign(item.style, {
          display: 'block',
          padding: '0.75rem',
          borderBottom: '1px solid #f3f4f6',
          textDecoration: 'none',
          color: '#374151'
        });
        
        item.addEventListener('mouseenter', () => {
          item.style.background = '#f9fafb';
        });
        
        item.addEventListener('mouseleave', () => {
          item.style.background = 'white';
        });
        
        resultsContainer.appendChild(item);
      });
      
      // 定位搜索结果
      const parent = inputElement.parentElement;
      if (parent) {
        parent.style.position = 'relative';
        parent.appendChild(resultsContainer);
        
        // 点击外部关闭结果
        const closeResults = (e) => {
          if (!parent.contains(e.target)) {
            this.clearSearchResults(inputElement);
            document.removeEventListener('click', closeResults);
          }
        };
        
        setTimeout(() => {
          document.addEventListener('click', closeResults);
        }, 100);
      }
    },
    
    // 高亮查询词
    highlightQuery(text, query) {
      if (!query) return text;
      
      const regex = new RegExp(`(${query})`, 'gi');
      return text.replace(regex, '<mark style="background: #fef3c7; padding: 0 2px;">$1</mark>');
    },
    
    // 显示无结果
    showNoResults(inputElement) {
      const noResults = document.createElement('div');
      noResults.className = 'search-no-results';
      noResults.textContent = '没有找到相关结果';
      
      Object.assign(noResults.style, {
        position: 'absolute',
        top: '100%',
        left: '0',
        right: '0',
        background: 'white',
        border: '1px solid #e5e7eb',
        borderTop: 'none',
        borderRadius: '0 0 0.5rem 0.5rem',
        padding: '1rem',
        textAlign: 'center',
        color: '#6b7280',
        zIndex: '1000'
      });
      
      const parent = inputElement.parentElement;
      if (parent) {
        parent.style.position = 'relative';
        parent.appendChild(noResults);
      }
    },
    
    // 清除搜索结果
    clearSearchResults(inputElement) {
      const parent = inputElement.parentElement;
      if (parent) {
        const existing = parent.querySelectorAll('.search-results, .search-no-results');
        existing.forEach(el => el.remove());
      }
    },
    
    // 快速搜索（键盘快捷键）
    initQuickSearch() {
      document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K 打开搜索
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
          e.preventDefault();
          const searchInput = document.querySelector('input[type="search"], input[placeholder*="搜索"]');
          if (searchInput) {
            searchInput.focus();
            searchInput.select();
          } else {
            // 如果没有搜索框，跳转到搜索页面
            window.location.href = '/search';
          }
        }
      });
    }
  };
  
  // 图片懒加载
  const lazyLoading = {
    init() {
      this.initImageLazyLoading();
    },
    
    initImageLazyLoading() {
      const images = document.querySelectorAll('img[loading="lazy"]');
      
      if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target;
              this.loadImage(img);
              observer.unobserve(img);
            }
          });
        });
        
        images.forEach(img => imageObserver.observe(img));
      } else {
        // 降级方案
        images.forEach(img => this.loadImage(img));
      }
    },
    
    loadImage(img) {
      if (img.dataset.src) {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
      }
      
      img.addEventListener('load', () => {
        img.style.opacity = '1';
      });
      
      img.addEventListener('error', () => {
        img.style.opacity = '0.5';
        img.alt = '图片加载失败';
      });
    }
  };
  
  // 代码高亮和复制
  const codeEnhancement = {
    init() {
      this.initCodeCopy();
      this.initCodeLineNumbers();
    },
    
    initCodeCopy() {
      const codeBlocks = document.querySelectorAll('pre code');
      
      codeBlocks.forEach(code => {
        const pre = code.parentElement;
        if (!pre) return;
        
        // 创建复制按钮
        const copyButton = document.createElement('button');
        copyButton.className = 'code-copy-button';
        copyButton.textContent = '复制';
        copyButton.setAttribute('aria-label', '复制代码');
        
        // 样式
        Object.assign(copyButton.style, {
          position: 'absolute',
          top: '0.5rem',
          right: '0.5rem',
          padding: '0.25rem 0.5rem',
          background: 'rgba(255, 255, 255, 0.1)',
          color: 'white',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '0.25rem',
          fontSize: '0.75rem',
          cursor: 'pointer',
          opacity: '0',
          transition: 'opacity 0.3s ease'
        });
        
        pre.style.position = 'relative';
        pre.appendChild(copyButton);
        
        // 悬停显示按钮
        pre.addEventListener('mouseenter', () => {
          copyButton.style.opacity = '1';
        });
        
        pre.addEventListener('mouseleave', () => {
          copyButton.style.opacity = '0';
        });
        
        // 复制功能
        copyButton.addEventListener('click', async () => {
          const text = code.textContent;
          const success = await utils.copyToClipboard(text);
          
          if (success) {
            copyButton.textContent = '已复制!';
            copyButton.style.background = 'rgba(16, 185, 129, 0.8)';
            
            setTimeout(() => {
              copyButton.textContent = '复制';
              copyButton.style.background = 'rgba(255, 255, 255, 0.1)';
            }, 2000);
          } else {
            utils.showNotification('复制失败', 'error');
          }
        });
      });
    },
    
    initCodeLineNumbers() {
      const codeBlocks = document.querySelectorAll('pre code');
      
      codeBlocks.forEach(code => {
        const lines = code.textContent.split('\n');
        if (lines.length <= 1) return;
        
        const lineNumbers = document.createElement('div');
        lineNumbers.className = 'line-numbers';
        
        Object.assign(lineNumbers.style, {
          position: 'absolute',
          left: '0',
          top: '0',
          bottom: '0',
          width: '3rem',
          background: 'rgba(0, 0, 0, 0.2)',
          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '1rem 0.5rem',
          fontSize: '0.75rem',
          lineHeight: '1.5',
          color: 'rgba(255, 255, 255, 0.5)',
          userSelect: 'none'
        });
        
        for (let i = 1; i <= lines.length; i++) {
          const lineNumber = document.createElement('div');
          lineNumber.textContent = i;
          lineNumbers.appendChild(lineNumber);
        }
        
        const pre = code.parentElement;
        pre.style.position = 'relative';
        pre.style.paddingLeft = '4rem';
        pre.insertBefore(lineNumbers, code);
      });
    }
  };
  
  // 主题切换（可选）
  const themeToggle = {
    init() {
      this.createThemeToggle();
      this.loadTheme();
    },
    
    createThemeToggle() {
      const toggle = document.createElement('button');
      toggle.className = 'theme-toggle';
      toggle.innerHTML = '🌙';
      toggle.setAttribute('aria-label', '切换主题');
      
      Object.assign(toggle.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: 'white',
        border: '1px solid #e5e7eb',
        cursor: 'pointer',
        fontSize: '18px',
        zIndex: '1000',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s ease'
      });
      
      document.body.appendChild(toggle);
      
      toggle.addEventListener('click', () => {
        this.toggleTheme();
      });
    },
    
    toggleTheme() {
      const currentTheme = localStorage.getItem('theme') || 'light';
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      
      this.setTheme(newTheme);
      localStorage.setItem('theme', newTheme);
    },
    
    setTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      
      const toggle = document.querySelector('.theme-toggle');
      if (toggle) {
        toggle.innerHTML = theme === 'light' ? '🌙' : '☀️';
      }
    },
    
    loadTheme() {
      const savedTheme = localStorage.getItem('theme') || 'light';
      this.setTheme(savedTheme);
    }
  };
  
  // 性能监控
  const performance = {
    init() {
      this.measurePageLoad();
      this.initErrorTracking();
    },
    
    measurePageLoad() {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const perfData = window.performance.timing;
          const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
          
          console.log(`页面加载时间: ${pageLoadTime}ms`);
          
          // 可以发送到分析服务
          if (window.gtag) {
            window.gtag('event', 'page_load_time', {
              value: pageLoadTime
            });
          }
        }, 0);
      });
    },
    
    initErrorTracking() {
      window.addEventListener('error', (e) => {
        console.error('JavaScript错误:', e.error);
        
        // 可以发送错误报告
        if (window.gtag) {
          window.gtag('event', 'exception', {
            description: e.error.toString(),
            fatal: false
          });
        }
      });
    }
  };
  
  // 初始化所有功能
  function init() {
    // 等待DOM加载完成
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }
    
    try {
      navigation.init();
      search.init();
      lazyLoading.init();
      codeEnhancement.init();
      // themeToggle.init(); // 可选功能
      performance.init();
      
      console.log('静态网站生成器前端脚本已初始化');
    } catch (error) {
      console.error('初始化失败:', error);
    }
  }
  
  // 导出到全局
  window.SiteGenerator = {
    utils,
    navigation,
    search,
    lazyLoading,
    codeEnhancement,
    themeToggle,
    performance
  };
  
  // 自动初始化
  init();
  
})();