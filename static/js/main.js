// 主要的 JavaScript 功能
(function() {
  'use strict';

  // DOM 加载完成后执行
  document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
  });

  function initializeApp() {
    initMobileMenu();
    initScrollToTop();
    initSmoothScroll();
    initSearchFunctionality();
    initThemeToggle();
    initCodeHighlight();
    initImageLazyLoading();
    initReadingProgress();
  }

  // 移动端菜单
  function initMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const siteNav = document.querySelector('.site-nav');
    
    if (menuToggle && siteNav) {
      menuToggle.addEventListener('click', function() {
        siteNav.classList.toggle('active');
        menuToggle.classList.toggle('active');
      });

      // 点击菜单项后关闭菜单
      const navLinks = siteNav.querySelectorAll('a');
      navLinks.forEach(link => {
        link.addEventListener('click', function() {
          siteNav.classList.remove('active');
          menuToggle.classList.remove('active');
        });
      });
    }
  }

  // 回到顶部按钮
  function initScrollToTop() {
    const scrollToTopBtn = document.createElement('button');
    scrollToTopBtn.innerHTML = '↑';
    scrollToTopBtn.className = 'scroll-to-top';
    scrollToTopBtn.setAttribute('aria-label', '回到顶部');
    document.body.appendChild(scrollToTopBtn);

    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
      .scroll-to-top {
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        width: 50px;
        height: 50px;
        border: none;
        border-radius: 50%;
        background: #3498db;
        color: white;
        font-size: 1.2rem;
        cursor: pointer;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        z-index: 1000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      }
      .scroll-to-top.visible {
        opacity: 1;
        visibility: visible;
      }
      .scroll-to-top:hover {
        background: #2980b9;
        transform: translateY(-2px);
      }
    `;
    document.head.appendChild(style);

    // 滚动事件
    window.addEventListener('scroll', function() {
      if (window.pageYOffset > 300) {
        scrollToTopBtn.classList.add('visible');
      } else {
        scrollToTopBtn.classList.remove('visible');
      }
    });

    // 点击事件
    scrollToTopBtn.addEventListener('click', function() {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  // 平滑滚动
  function initSmoothScroll() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
      link.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });
  }

  // 搜索功能
  function initSearchFunctionality() {
    const searchInput = document.querySelector('.search-input');
    const searchBtn = document.querySelector('.search-btn');
    
    if (searchInput) {
      // 实时搜索
      let searchTimeout;
      searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          performSearch(this.value);
        }, 300);
      });

      // 搜索按钮
      if (searchBtn) {
        searchBtn.addEventListener('click', function() {
          performSearch(searchInput.value);
        });
      }

      // 回车搜索
      searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          performSearch(this.value);
        }
      });
    }
  }

  function performSearch(query) {
    if (!query.trim()) {
      showAllPosts();
      return;
    }

    const posts = document.querySelectorAll('.post-card, .post-item');
    let visibleCount = 0;

    posts.forEach(post => {
      const title = post.querySelector('.post-title')?.textContent.toLowerCase() || '';
      const excerpt = post.querySelector('.post-excerpt')?.textContent.toLowerCase() || '';
      const tags = Array.from(post.querySelectorAll('.tag')).map(tag => tag.textContent.toLowerCase()).join(' ');
      
      const searchText = (title + ' ' + excerpt + ' ' + tags).toLowerCase();
      
      if (searchText.includes(query.toLowerCase())) {
        post.style.display = 'block';
        visibleCount++;
      } else {
        post.style.display = 'none';
      }
    });

    // 更新搜索结果计数
    updateSearchResults(visibleCount, query);
  }

  function showAllPosts() {
    const posts = document.querySelectorAll('.post-card, .post-item');
    posts.forEach(post => {
      post.style.display = 'block';
    });
    updateSearchResults(posts.length, '');
  }

  function updateSearchResults(count, query) {
    const resultsElement = document.querySelector('.search-results');
    if (resultsElement) {
      if (query) {
        resultsElement.textContent = `找到 ${count} 个结果："${query}"`;
      } else {
        resultsElement.textContent = '';
      }
    }
  }

  // 主题切换
  function initThemeToggle() {
    const themeToggle = document.querySelector('.theme-toggle');
    if (!themeToggle) {
      // 创建主题切换按钮
      const toggle = document.createElement('button');
      toggle.className = 'theme-toggle';
      toggle.innerHTML = '🌙';
      toggle.setAttribute('aria-label', '切换主题');
      
      const header = document.querySelector('.site-header .container');
      if (header) {
        header.appendChild(toggle);
      }
    }

    const toggle = document.querySelector('.theme-toggle');
    if (toggle) {
      // 检查本地存储的主题设置
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);
      }

      toggle.addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
      });
    }
  }

  function updateThemeIcon(theme) {
    const toggle = document.querySelector('.theme-toggle');
    if (toggle) {
      toggle.innerHTML = theme === 'dark' ? '☀️' : '🌙';
    }
  }

  // 代码高亮（简单实现）
  function initCodeHighlight() {
    const codeBlocks = document.querySelectorAll('pre code');
    
    codeBlocks.forEach(block => {
      // 添加复制按钮
      const copyBtn = document.createElement('button');
      copyBtn.className = 'copy-code';
      copyBtn.innerHTML = '复制';
      copyBtn.addEventListener('click', function() {
        navigator.clipboard.writeText(block.textContent).then(() => {
          copyBtn.innerHTML = '已复制!';
          setTimeout(() => {
            copyBtn.innerHTML = '复制';
          }, 2000);
        });
      });
      
      const wrapper = document.createElement('div');
      wrapper.className = 'code-wrapper';
      block.parentNode.insertBefore(wrapper, block.parentNode);
      wrapper.appendChild(block.parentNode);
      wrapper.appendChild(copyBtn);
    });
  }

  // 图片懒加载
  function initImageLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.remove('lazy');
            imageObserver.unobserve(img);
          }
        });
      });

      images.forEach(img => {
        img.classList.add('lazy');
        imageObserver.observe(img);
      });
    } else {
      // 降级处理
      images.forEach(img => {
        img.src = img.dataset.src;
      });
    }
  }

  // 阅读进度条
  function initReadingProgress() {
    const article = document.querySelector('article, .post-content, .page-content');
    if (!article) return;

    const progressBar = document.createElement('div');
    progressBar.className = 'reading-progress';
    document.body.appendChild(progressBar);

    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
      .reading-progress {
        position: fixed;
        top: 0;
        left: 0;
        width: 0%;
        height: 3px;
        background: linear-gradient(90deg, #3498db, #2ecc71);
        z-index: 1001;
        transition: width 0.3s ease;
      }
    `;
    document.head.appendChild(style);

    window.addEventListener('scroll', function() {
      const articleTop = article.offsetTop;
      const articleHeight = article.offsetHeight;
      const windowHeight = window.innerHeight;
      const scrollTop = window.pageYOffset;
      
      const articleBottom = articleTop + articleHeight;
      const windowBottom = scrollTop + windowHeight;
      
      if (scrollTop >= articleTop && scrollTop <= articleBottom) {
        const progress = ((scrollTop - articleTop) / (articleHeight - windowHeight)) * 100;
        progressBar.style.width = Math.min(Math.max(progress, 0), 100) + '%';
      }
    });
  }

  // 工具函数
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  function throttle(func, limit) {
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
  }

  // 导出到全局作用域（如果需要）
  window.SiteUtils = {
    debounce,
    throttle,
    performSearch,
    showAllPosts
  };

})();