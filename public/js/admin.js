/**
 * Admin Panel JavaScript
 * 管理后台通用功能
 */

// 全局管理对象
window.AdminUtils = {
    // API 基础路径
    apiBase: '/admin/api',
    
    // 通用 API 请求方法
    async request(url, options = {}) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        const config = { ...defaultOptions, ...options };
        
        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || '请求失败');
            }
            
            return data;
        } catch (error) {
            console.error('API 请求错误:', error);
            throw error;
        }
    },
    
    // GET 请求
    async get(endpoint) {
        return this.request(`${this.apiBase}${endpoint}`);
    },
    
    // POST 请求
    async post(endpoint, data) {
        return this.request(`${this.apiBase}${endpoint}`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    
    // PUT 请求
    async put(endpoint, data) {
        return this.request(`${this.apiBase}${endpoint}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },
    
    // DELETE 请求
    async delete(endpoint) {
        return this.request(`${this.apiBase}${endpoint}`, {
            method: 'DELETE'
        });
    },
    
    // 格式化日期
    formatDate(date, format = 'YYYY-MM-DD HH:mm') {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        
        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hours)
            .replace('mm', minutes);
    },
    
    // 格式化文件大小
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    // 格式化数字
    formatNumber(num) {
        return new Intl.NumberFormat('zh-CN').format(num);
    },
    
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
    
    // 复制到剪贴板
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('已复制到剪贴板', 'success');
        } catch (error) {
            console.error('复制失败:', error);
            this.showToast('复制失败', 'error');
        }
    },
    
    // 显示提示消息
    showToast(message, type = 'info', duration = 5000) {
        const container = document.getElementById('toastContainer') || this.createToastContainer();
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icon = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        }[type] || 'fas fa-info-circle';
        
        toast.innerHTML = `
            <i class="${icon}"></i>
            <span>${message}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        container.appendChild(toast);
        
        // 自动移除
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, duration);
    },
    
    // 创建提示消息容器
    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
        return container;
    },
    
    // 显示确认对话框
    confirm(message, title = '确认操作') {
        return new Promise((resolve) => {
            const modal = this.createModal({
                title,
                content: `<p>${message}</p>`,
                buttons: [
                    {
                        text: '取消',
                        class: 'btn-secondary',
                        click: () => {
                            modal.remove();
                            resolve(false);
                        }
                    },
                    {
                        text: '确认',
                        class: 'btn-danger',
                        click: () => {
                            modal.remove();
                            resolve(true);
                        }
                    }
                ]
            });
        });
    },
    
    // 创建模态框
    createModal({ title, content, buttons = [], size = 'medium' }) {
        const modal = document.createElement('div');
        modal.className = 'modal modal-overlay';
        
        const buttonsHtml = buttons.map(btn => 
            `<button class="btn ${btn.class || 'btn-primary'}" data-action="${btn.text}">${btn.text}</button>`
        ).join('');
        
        modal.innerHTML = `
            <div class="modal-dialog modal-${size}">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 class="modal-title">${title}</h3>
                        <button class="modal-close" data-action="close">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                    <div class="modal-footer">
                        ${buttonsHtml}
                    </div>
                </div>
            </div>
        `;
        
        // 绑定事件
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.dataset.action === 'close') {
                modal.remove();
            } else if (e.target.dataset.action) {
                const button = buttons.find(btn => btn.text === e.target.dataset.action);
                if (button && button.click) {
                    button.click();
                }
            }
        });
        
        document.body.appendChild(modal);
        return modal;
    },
    
    // 显示加载状态
    showLoading(message = '加载中...') {
        let overlay = document.getElementById('loadingOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'loadingOverlay';
            overlay.className = 'loading-overlay';
            overlay.innerHTML = `
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>加载中...</p>
                </div>
            `;
            document.body.appendChild(overlay);
        }
        
        const text = overlay.querySelector('p');
        text.textContent = message;
        overlay.style.display = 'flex';
    },
    
    // 隐藏加载状态
    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    },
    
    // 表单验证
    validateForm(form) {
        const errors = [];
        const requiredFields = form.querySelectorAll('[required]');
        
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                errors.push(`${field.dataset.label || field.name} 不能为空`);
                field.classList.add('error');
            } else {
                field.classList.remove('error');
            }
        });
        
        // 邮箱验证
        const emailFields = form.querySelectorAll('input[type="email"]');
        emailFields.forEach(field => {
            if (field.value && !this.isValidEmail(field.value)) {
                errors.push('邮箱格式不正确');
                field.classList.add('error');
            }
        });
        
        // URL 验证
        const urlFields = form.querySelectorAll('input[type="url"]');
        urlFields.forEach(field => {
            if (field.value && !this.isValidUrl(field.value)) {
                errors.push('URL 格式不正确');
                field.classList.add('error');
            }
        });
        
        return errors;
    },
    
    // 邮箱验证
    isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },
    
    // URL 验证
    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    },
    
    // 初始化数据表格
    initDataTable(tableId, options = {}) {
        const table = document.getElementById(tableId);
        if (!table) return;
        
        const defaultOptions = {
            sortable: true,
            searchable: true,
            pagination: true,
            pageSize: 10
        };
        
        const config = { ...defaultOptions, ...options };
        
        // 添加搜索功能
        if (config.searchable) {
            this.addTableSearch(table);
        }
        
        // 添加排序功能
        if (config.sortable) {
            this.addTableSort(table);
        }
        
        // 添加分页功能
        if (config.pagination) {
            this.addTablePagination(table, config.pageSize);
        }
    },
    
    // 添加表格搜索
    addTableSearch(table) {
        const searchInput = table.parentElement.querySelector('.table-search');
        if (!searchInput) return;
        
        searchInput.addEventListener('input', this.debounce((e) => {
            const searchTerm = e.target.value.toLowerCase();
            const rows = table.querySelectorAll('tbody tr');
            
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        }, 300));
    },
    
    // 添加表格排序
    addTableSort(table) {
        const headers = table.querySelectorAll('th[data-sort]');
        
        headers.forEach(header => {
            header.style.cursor = 'pointer';
            header.addEventListener('click', () => {
                const column = header.dataset.sort;
                const direction = header.classList.contains('sort-asc') ? 'desc' : 'asc';
                
                // 清除其他列的排序状态
                headers.forEach(h => h.classList.remove('sort-asc', 'sort-desc'));
                
                // 设置当前列的排序状态
                header.classList.add(`sort-${direction}`);
                
                // 执行排序
                this.sortTable(table, column, direction);
            });
        });
    },
    
    // 表格排序
    sortTable(table, column, direction) {
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        
        rows.sort((a, b) => {
            const aValue = a.querySelector(`[data-value="${column}"]`)?.textContent || '';
            const bValue = b.querySelector(`[data-value="${column}"]`)?.textContent || '';
            
            if (direction === 'asc') {
                return aValue.localeCompare(bValue, 'zh-CN', { numeric: true });
            } else {
                return bValue.localeCompare(aValue, 'zh-CN', { numeric: true });
            }
        });
        
        // 重新插入排序后的行
        rows.forEach(row => tbody.appendChild(row));
    },
    
    // 添加表格分页
    addTablePagination(table, pageSize) {
        const rows = Array.from(table.querySelectorAll('tbody tr'));
        const totalPages = Math.ceil(rows.length / pageSize);
        let currentPage = 1;
        
        // 创建分页控件
        const pagination = document.createElement('div');
        pagination.className = 'table-pagination';
        table.parentElement.appendChild(pagination);
        
        const showPage = (page) => {
            const start = (page - 1) * pageSize;
            const end = start + pageSize;
            
            rows.forEach((row, index) => {
                row.style.display = (index >= start && index < end) ? '' : 'none';
            });
            
            currentPage = page;
            updatePagination();
        };
        
        const updatePagination = () => {
            pagination.innerHTML = `
                <button class="btn btn-sm" ${currentPage === 1 ? 'disabled' : ''} onclick="showPage(${currentPage - 1})">
                    上一页
                </button>
                <span>第 ${currentPage} 页，共 ${totalPages} 页</span>
                <button class="btn btn-sm" ${currentPage === totalPages ? 'disabled' : ''} onclick="showPage(${currentPage + 1})">
                    下一页
                </button>
            `;
        };
        
        // 暴露 showPage 函数到全局
        window.showPage = showPage;
        
        // 显示第一页
        showPage(1);
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化侧边栏
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const sidebar = document.querySelector('.admin-sidebar');
    
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }
    
    // 初始化所有数据表格
    const tables = document.querySelectorAll('.data-table');
    tables.forEach(table => {
        AdminUtils.initDataTable(table.id);
    });
    
    // 检查 URL 参数中的消息
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');
    
    if (success) {
        const messages = {
            created: '创建成功！',
            updated: '更新成功！',
            deleted: '删除成功！',
            uploaded: '上传成功！'
        };
        AdminUtils.showToast(messages[success] || '操作成功！', 'success');
    }
    
    if (error) {
        AdminUtils.showToast(decodeURIComponent(error), 'error');
    }
    
    // 清理 URL 参数
    if (success || error) {
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
    }
});