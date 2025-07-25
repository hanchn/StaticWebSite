/**
 * 静态博客系统 - 主要 JavaScript 文件
 * 包含前端交互功能和工具函数
 */

(function() {
    'use strict';
    
    // 全局变量
    let isScrolling = false;
    let lastScrollTop = 0;
    
    // DOM 加载完成后初始化
    document.addEventListener('DOMContentLoaded', function() {
        initializeApp();
    });
    
    /**
     * 初始化应用
     */
    function initializeApp() {
        initNavigation();
        initScrollEffects();
        initLazyLoading();
        initCodeBlocks();
        initImageLightbox();
        initTooltips();
        initForms();
        initSearch();
        initTheme();
        initAnalytics();
    }
    
    /**
     * 导航功能
     */
    function initNavigation() {
        // 移动端菜单切换
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        const mobileMenu = document.querySelector('.mobile-menu');
        
        if (mobileToggle && mobileMenu) {
            mobileToggle.addEventListener('click', function() {
                mobileMenu.classList.toggle('show');
                this.classList.toggle('active');
            });
            
            // 点击菜单项后关闭菜单
            mobileMenu.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', function() {
                    mobileMenu.classList.remove('show');
                    mobileToggle.classList.remove('active');
                });
            });
        }
        
        // 导航栏滚动效果
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            window.addEventListener('scroll', throttle(function() {
                if (window.scrollY > 100) {
                    navbar.classList.add('scrolled');
                } else {
                    navbar.classList.remove('scrolled');
                }
            }, 100));
        }
        
        // 当前页面导航高亮
        highlightCurrentNav();
    }
    
    /**
     * 高亮当前页面导航
     */
    function highlightCurrentNav() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPath || (currentPath.startsWith(href) && href !== '/')) {
                link.classList.add('active');
            }
        });
    }
    
    /**
     * 滚动效果
     */
    function initScrollEffects() {
        // 回到顶部按钮
        const backToTop = document.querySelector('.back-to-top');
        if (backToTop) {
            window.addEventListener('scroll', throttle(function() {
                if (window.scrollY > 300) {
                    backToTop.classList.add('show');
                } else {
                    backToTop.classList.remove('show');
                }
            }, 100));
            
            backToTop.addEventListener('click', function(e) {
                e.preventDefault();
                smoothScrollTo(0);
            });
        }
        
        // 阅读进度条
        const progressBar = document.querySelector('.reading-progress');
        if (progressBar) {
            window.addEventListener('scroll', throttle(updateReadingProgress, 50));
        }
        
        // 滚动动画
        initScrollAnimations();
    }
    
    /**
     * 更新阅读进度
     */
    function updateReadingProgress() {
        const progressBar = document.querySelector('.reading-progress');
        if (!progressBar) return;
        
        const article = document.querySelector('.post-content');
        if (!article) return;
        
        const articleTop = article.offsetTop;
        const articleHeight = article.offsetHeight;
        const windowHeight = window.innerHeight;
        const scrollTop = window.scrollY;
        
        const progress = Math.max(0, Math.min(100, 
            ((scrollTop - articleTop + windowHeight) / articleHeight) * 100
        ));
        
        progressBar.style.width = progress + '%';
    }
    
    /**
     * 滚动动画
     */
    function initScrollAnimations() {
        const animatedElements = document.querySelectorAll('[data-animate]');
        
        if (animatedElements.length === 0) return;
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    const animation = element.dataset.animate;
                    element.classList.add('animate-' + animation);
                    observer.unobserve(element);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });
        
        animatedElements.forEach(el => observer.observe(el));
    }
    
    /**
     * 懒加载
     */
    function initLazyLoading() {
        const lazyImages = document.querySelectorAll('img[data-src]');
        
        if (lazyImages.length === 0) return;
        
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    img.classList.add('loaded');
                    imageObserver.unobserve(img);
                }
            });
        });
        
        lazyImages.forEach(img => {
            img.classList.add('lazy');
            imageObserver.observe(img);
        });
    }
    
    /**
     * 代码块功能
     */
    function initCodeBlocks() {
        const codeBlocks = document.querySelectorAll('pre code');
        
        codeBlocks.forEach(block => {
            // 添加复制按钮
            addCopyButton(block);
            
            // 添加语言标签
            addLanguageLabel(block);
            
            // 添加行号
            addLineNumbers(block);
        });
    }
    
    /**
     * 添加复制按钮
     */
    function addCopyButton(codeBlock) {
        const pre = codeBlock.parentElement;
        const button = document.createElement('button');
        button.className = 'copy-code-btn';
        button.innerHTML = '<i class="fas fa-copy"></i>';
        button.title = '复制代码';
        
        button.addEventListener('click', function() {
            const text = codeBlock.textContent;
            copyToClipboard(text).then(() => {
                button.innerHTML = '<i class="fas fa-check"></i>';
                button.classList.add('copied');
                setTimeout(() => {
                    button.innerHTML = '<i class="fas fa-copy"></i>';
                    button.classList.remove('copied');
                }, 2000);
            }).catch(() => {
                showToast('复制失败', 'error');
            });
        });
        
        pre.style.position = 'relative';
        pre.appendChild(button);
    }
    
    /**
     * 添加语言标签
     */
    function addLanguageLabel(codeBlock) {
        const className = codeBlock.className;
        const match = className.match(/language-(\w+)/);
        
        if (match) {
            const language = match[1];
            const label = document.createElement('span');
            label.className = 'code-language';
            label.textContent = language.toUpperCase();
            
            const pre = codeBlock.parentElement;
            pre.appendChild(label);
        }
    }
    
    /**
     * 添加行号
     */
    function addLineNumbers(codeBlock) {
        const lines = codeBlock.textContent.split('\n');
        if (lines.length > 1) {
            const lineNumbers = document.createElement('span');
            lineNumbers.className = 'line-numbers';
            
            for (let i = 1; i <= lines.length; i++) {
                const lineNumber = document.createElement('span');
                lineNumber.textContent = i;
                lineNumbers.appendChild(lineNumber);
            }
            
            const pre = codeBlock.parentElement;
            pre.insertBefore(lineNumbers, codeBlock);
            pre.classList.add('has-line-numbers');
        }
    }
    
    /**
     * 图片灯箱
     */
    function initImageLightbox() {
        const images = document.querySelectorAll('.post-content img, .gallery img');
        
        images.forEach(img => {
            img.addEventListener('click', function() {
                openLightbox(this.src, this.alt);
            });
            img.style.cursor = 'pointer';
        });
    }
    
    /**
     * 打开灯箱
     */
    function openLightbox(src, alt) {
        const lightbox = document.createElement('div');
        lightbox.className = 'lightbox';
        lightbox.innerHTML = `
            <div class="lightbox-content">
                <img src="${src}" alt="${alt}">
                <button class="lightbox-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(lightbox);
        document.body.style.overflow = 'hidden';
        
        // 关闭事件
        const closeBtn = lightbox.querySelector('.lightbox-close');
        const closeLightbox = () => {
            document.body.removeChild(lightbox);
            document.body.style.overflow = '';
        };
        
        closeBtn.addEventListener('click', closeLightbox);
        lightbox.addEventListener('click', function(e) {
            if (e.target === this) {
                closeLightbox();
            }
        });
        
        // ESC 键关闭
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeLightbox();
            }
        }, { once: true });
    }
    
    /**
     * 工具提示
     */
    function initTooltips() {
        const tooltipElements = document.querySelectorAll('[data-tooltip]');
        
        tooltipElements.forEach(element => {
            element.addEventListener('mouseenter', showTooltip);
            element.addEventListener('mouseleave', hideTooltip);
        });
    }
    
    /**
     * 显示工具提示
     */
    function showTooltip(e) {
        const element = e.target;
        const text = element.dataset.tooltip;
        
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip-popup';
        tooltip.textContent = text;
        
        document.body.appendChild(tooltip);
        
        const rect = element.getBoundingClientRect();
        tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
        tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';
        
        element._tooltip = tooltip;
    }
    
    /**
     * 隐藏工具提示
     */
    function hideTooltip(e) {
        const element = e.target;
        if (element._tooltip) {
            document.body.removeChild(element._tooltip);
            delete element._tooltip;
        }
    }
    
    /**
     * 表单功能
     */
    function initForms() {
        // 表单验证
        const forms = document.querySelectorAll('form[data-validate]');
        forms.forEach(form => {
            form.addEventListener('submit', validateForm);
        });
        
        // 实时验证
        const inputs = document.querySelectorAll('input[required], textarea[required]');
        inputs.forEach(input => {
            input.addEventListener('blur', validateField);
            input.addEventListener('input', clearFieldError);
        });
        
        // 邮件订阅
        const newsletterForm = document.querySelector('#newsletter-form');
        if (newsletterForm) {
            newsletterForm.addEventListener('submit', handleNewsletterSubmit);
        }
        
        // 评论表单
        const commentForm = document.querySelector('#comment-form');
        if (commentForm) {
            commentForm.addEventListener('submit', handleCommentSubmit);
        }
    }
    
    /**
     * 表单验证
     */
    function validateForm(e) {
        const form = e.target;
        const inputs = form.querySelectorAll('input[required], textarea[required]');
        let isValid = true;
        
        inputs.forEach(input => {
            if (!validateField({ target: input })) {
                isValid = false;
            }
        });
        
        if (!isValid) {
            e.preventDefault();
        }
    }
    
    /**
     * 字段验证
     */
    function validateField(e) {
        const field = e.target;
        const value = field.value.trim();
        const type = field.type;
        let isValid = true;
        let message = '';
        
        // 必填验证
        if (field.hasAttribute('required') && !value) {
            isValid = false;
            message = '此字段为必填项';
        }
        
        // 邮箱验证
        if (type === 'email' && value && !isValidEmail(value)) {
            isValid = false;
            message = '请输入有效的邮箱地址';
        }
        
        // 网址验证
        if (type === 'url' && value && !isValidUrl(value)) {
            isValid = false;
            message = '请输入有效的网址';
        }
        
        // 显示错误
        if (!isValid) {
            showFieldError(field, message);
        } else {
            clearFieldError({ target: field });
        }
        
        return isValid;
    }
    
    /**
     * 显示字段错误
     */
    function showFieldError(field, message) {
        clearFieldError({ target: field });
        
        field.classList.add('error');
        
        const error = document.createElement('div');
        error.className = 'field-error';
        error.textContent = message;
        
        field.parentNode.appendChild(error);
    }
    
    /**
     * 清除字段错误
     */
    function clearFieldError(e) {
        const field = e.target;
        field.classList.remove('error');
        
        const error = field.parentNode.querySelector('.field-error');
        if (error) {
            error.remove();
        }
    }
    
    /**
     * 处理邮件订阅
     */
    function handleNewsletterSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const email = form.querySelector('input[type="email"]').value;
        
        if (!isValidEmail(email)) {
            showToast('请输入有效的邮箱地址', 'error');
            return;
        }
        
        // 模拟提交
        showToast('订阅成功！', 'success');
        form.reset();
    }
    
    /**
     * 处理评论提交
     */
    function handleCommentSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        
        // 这里应该发送到后端API
        showToast('评论提交成功，等待审核', 'success');
        form.reset();
    }
    
    /**
     * 搜索功能
     */
    function initSearch() {
        const searchForm = document.querySelector('#search-form');
        const searchInput = document.querySelector('#search-input');
        const searchResults = document.querySelector('#search-results');
        
        if (!searchForm || !searchInput) return;
        
        // 搜索表单提交
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            performSearch(searchInput.value.trim());
        });
        
        // 实时搜索
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            const query = this.value.trim();
            
            if (query.length >= 2) {
                searchTimeout = setTimeout(() => {
                    performSearch(query, true);
                }, 300);
            } else if (searchResults) {
                searchResults.innerHTML = '';
                searchResults.style.display = 'none';
            }
        });
        
        // 点击外部关闭搜索结果
        document.addEventListener('click', function(e) {
            if (searchResults && !searchForm.contains(e.target)) {
                searchResults.style.display = 'none';
            }
        });
    }
    
    /**
     * 执行搜索
     */
    function performSearch(query, isLive = false) {
        if (!query) return;
        
        // 这里应该调用搜索API
        // 现在只是模拟
        const mockResults = [
            { title: '示例文章 1', url: '/posts/example-1', excerpt: '这是一篇示例文章...' },
            { title: '示例文章 2', url: '/posts/example-2', excerpt: '这是另一篇示例文章...' }
        ];
        
        if (isLive) {
            displaySearchResults(mockResults);
        } else {
            // 跳转到搜索结果页面
            window.location.href = `/search?q=${encodeURIComponent(query)}`;
        }
    }
    
    /**
     * 显示搜索结果
     */
    function displaySearchResults(results) {
        const searchResults = document.querySelector('#search-results');
        if (!searchResults) return;
        
        if (results.length === 0) {
            searchResults.innerHTML = '<div class="no-results">未找到相关内容</div>';
        } else {
            searchResults.innerHTML = results.map(result => `
                <div class="search-result">
                    <h4><a href="${result.url}">${result.title}</a></h4>
                    <p>${result.excerpt}</p>
                </div>
            `).join('');
        }
        
        searchResults.style.display = 'block';
    }
    
    /**
     * 主题切换
     */
    function initTheme() {
        const themeToggle = document.querySelector('#theme-toggle');
        if (!themeToggle) return;
        
        // 获取保存的主题
        const savedTheme = localStorage.getItem('theme') || 'light';
        setTheme(savedTheme);
        
        // 主题切换事件
        themeToggle.addEventListener('click', function() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            setTheme(newTheme);
        });
    }
    
    /**
     * 设置主题
     */
    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        const themeToggle = document.querySelector('#theme-toggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
        }
    }
    
    /**
     * 统计分析
     */
    function initAnalytics() {
        // 页面浏览统计
        trackPageView();
        
        // 阅读时间统计
        trackReadingTime();
        
        // 点击事件统计
        trackClicks();
    }
    
    /**
     * 页面浏览统计
     */
    function trackPageView() {
        // 这里应该发送到分析服务
        console.log('Page view tracked:', window.location.pathname);
    }
    
    /**
     * 阅读时间统计
     */
    function trackReadingTime() {
        const article = document.querySelector('.post-content');
        if (!article) return;
        
        let startTime = Date.now();
        let isReading = true;
        
        // 页面失焦时停止计时
        document.addEventListener('visibilitychange', function() {
            isReading = !document.hidden;
            if (isReading) {
                startTime = Date.now();
            }
        });
        
        // 页面卸载时发送统计
        window.addEventListener('beforeunload', function() {
            if (isReading) {
                const readingTime = Math.round((Date.now() - startTime) / 1000);
                console.log('Reading time:', readingTime, 'seconds');
                // 这里应该发送到分析服务
            }
        });
    }
    
    /**
     * 点击事件统计
     */
    function trackClicks() {
        // 跟踪外部链接点击
        document.addEventListener('click', function(e) {
            const link = e.target.closest('a');
            if (link && link.hostname !== window.location.hostname) {
                console.log('External link clicked:', link.href);
                // 这里应该发送到分析服务
            }
        });
    }
    
    // 工具函数
    
    /**
     * 节流函数
     */
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
    
    /**
     * 防抖函数
     */
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
    
    /**
     * 平滑滚动
     */
    function smoothScrollTo(target) {
        const targetPosition = typeof target === 'number' ? target : target.offsetTop;
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        const duration = 800;
        let start = null;
        
        function animation(currentTime) {
            if (start === null) start = currentTime;
            const timeElapsed = currentTime - start;
            const run = ease(timeElapsed, startPosition, distance, duration);
            window.scrollTo(0, run);
            if (timeElapsed < duration) requestAnimationFrame(animation);
        }
        
        function ease(t, b, c, d) {
            t /= d / 2;
            if (t < 1) return c / 2 * t * t + b;
            t--;
            return -c / 2 * (t * (t - 2) - 1) + b;
        }
        
        requestAnimationFrame(animation);
    }
    
    /**
     * 复制到剪贴板
     */
    function copyToClipboard(text) {
        if (navigator.clipboard) {
            return navigator.clipboard.writeText(text);
        } else {
            return new Promise((resolve, reject) => {
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                
                try {
                    document.execCommand('copy');
                    textArea.remove();
                    resolve();
                } catch (err) {
                    textArea.remove();
                    reject(err);
                }
            });
        }
    }
    
    /**
     * 显示提示消息
     */
    function showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="fas fa-${getToastIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="toast-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        document.body.appendChild(toast);
        
        // 显示动画
        setTimeout(() => toast.classList.add('show'), 100);
        
        // 自动关闭
        const autoClose = setTimeout(() => {
            closeToast(toast);
        }, duration);
        
        // 手动关闭
        toast.querySelector('.toast-close').addEventListener('click', () => {
            clearTimeout(autoClose);
            closeToast(toast);
        });
    }
    
    /**
     * 关闭提示消息
     */
    function closeToast(toast) {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }
    
    /**
     * 获取提示图标
     */
    function getToastIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }
    
    /**
     * 邮箱验证
     */
    function isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    /**
     * 网址验证
     */
    function isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }
    
    /**
     * 格式化日期
     */
    function formatDate(date, format = 'YYYY-MM-DD') {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        
        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day);
    }
    
    /**
     * 格式化数字
     */
    function formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }
    
    /**
     * 计算阅读时间
     */
    function calculateReadingTime(text) {
        const wordsPerMinute = 200; // 平均阅读速度
        const words = text.trim().split(/\s+/).length;
        const minutes = Math.ceil(words / wordsPerMinute);
        return minutes;
    }
    
    // 导出全局函数
    window.BlogUtils = {
        smoothScrollTo,
        copyToClipboard,
        showToast,
        formatDate,
        formatNumber,
        calculateReadingTime,
        isValidEmail,
        isValidUrl,
        throttle,
        debounce
    };
    
})();