/**
 * Markdown Editor JavaScript
 * Markdown 编辑器功能
 */

// 编辑器工具类
window.MarkdownEditor = {
    // 当前编辑器实例
    currentEditor: null,
    
    // 初始化编辑器
    init(textareaId, previewId) {
        const textarea = document.getElementById(textareaId);
        const preview = document.getElementById(previewId);
        
        if (!textarea) {
            console.error('找不到编辑器文本区域');
            return;
        }
        
        this.currentEditor = {
            textarea,
            preview,
            lastCursorPos: 0
        };
        
        // 绑定事件
        this.bindEvents();
        
        // 初始化工具栏
        this.initToolbar();
        
        // 初始化预览
        if (preview) {
            this.updatePreview();
        }
        
        // 初始化字数统计
        this.updateWordCount();
        
        return this.currentEditor;
    },
    
    // 绑定事件
    bindEvents() {
        const { textarea, preview } = this.currentEditor;
        
        // 内容变化时更新预览和字数统计
        textarea.addEventListener('input', () => {
            if (preview) {
                this.updatePreview();
            }
            this.updateWordCount();
            this.saveCursorPosition();
        });
        
        // 记录光标位置
        textarea.addEventListener('selectionchange', () => {
            this.saveCursorPosition();
        });
        
        // 键盘快捷键
        textarea.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
        
        // Tab 键处理
        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                this.insertText('    '); // 插入4个空格
            }
        });
    },
    
    // 初始化工具栏
    initToolbar() {
        const toolbar = document.querySelector('.editor-toolbar');
        if (!toolbar) return;
        
        // 绑定工具栏按钮事件
        toolbar.addEventListener('click', (e) => {
            const button = e.target.closest('[data-action]');
            if (!button) return;
            
            e.preventDefault();
            const action = button.dataset.action;
            this.executeAction(action);
        });
    },
    
    // 执行工具栏操作
    executeAction(action) {
        switch (action) {
            case 'bold':
                this.wrapText('**', '**');
                break;
            case 'italic':
                this.wrapText('*', '*');
                break;
            case 'strikethrough':
                this.wrapText('~~', '~~');
                break;
            case 'heading1':
                this.insertLinePrefix('# ');
                break;
            case 'heading2':
                this.insertLinePrefix('## ');
                break;
            case 'heading3':
                this.insertLinePrefix('### ');
                break;
            case 'quote':
                this.insertLinePrefix('> ');
                break;
            case 'code':
                this.wrapText('`', '`');
                break;
            case 'code-block':
                this.insertCodeBlock();
                break;
            case 'link':
                this.insertLink();
                break;
            case 'image':
                this.insertImage();
                break;
            case 'unordered-list':
                this.insertLinePrefix('- ');
                break;
            case 'ordered-list':
                this.insertLinePrefix('1. ');
                break;
            case 'table':
                this.insertTable();
                break;
            case 'horizontal-rule':
                this.insertText('\n---\n');
                break;
            case 'fullscreen':
                this.toggleFullscreen();
                break;
            case 'preview':
                this.togglePreview();
                break;
        }
    },
    
    // 处理键盘快捷键
    handleKeyboardShortcuts(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'b':
                    e.preventDefault();
                    this.executeAction('bold');
                    break;
                case 'i':
                    e.preventDefault();
                    this.executeAction('italic');
                    break;
                case 'k':
                    e.preventDefault();
                    this.executeAction('link');
                    break;
                case 'Enter':
                    e.preventDefault();
                    this.executeAction('code-block');
                    break;
            }
        }
    },
    
    // 包装选中文本
    wrapText(prefix, suffix) {
        const { textarea } = this.currentEditor;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);
        const replacement = prefix + selectedText + suffix;
        
        this.replaceSelection(replacement);
        
        // 如果没有选中文本，将光标放在标记之间
        if (selectedText === '') {
            textarea.setSelectionRange(start + prefix.length, start + prefix.length);
        }
    },
    
    // 在行首插入前缀
    insertLinePrefix(prefix) {
        const { textarea } = this.currentEditor;
        const start = textarea.selectionStart;
        const value = textarea.value;
        
        // 找到当前行的开始位置
        let lineStart = start;
        while (lineStart > 0 && value[lineStart - 1] !== '\n') {
            lineStart--;
        }
        
        // 检查是否已经有前缀
        const lineEnd = value.indexOf('\n', lineStart);
        const currentLine = value.substring(lineStart, lineEnd === -1 ? value.length : lineEnd);
        
        if (currentLine.startsWith(prefix)) {
            // 移除前缀
            const newValue = value.substring(0, lineStart) + 
                           currentLine.substring(prefix.length) + 
                           value.substring(lineEnd === -1 ? value.length : lineEnd);
            textarea.value = newValue;
            textarea.setSelectionRange(start - prefix.length, start - prefix.length);
        } else {
            // 添加前缀
            const newValue = value.substring(0, lineStart) + 
                           prefix + 
                           value.substring(lineStart);
            textarea.value = newValue;
            textarea.setSelectionRange(start + prefix.length, start + prefix.length);
        }
        
        this.updatePreview();
        this.updateWordCount();
    },
    
    // 插入文本
    insertText(text) {
        this.replaceSelection(text);
    },
    
    // 替换选中内容
    replaceSelection(replacement) {
        const { textarea } = this.currentEditor;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        
        textarea.value = textarea.value.substring(0, start) + 
                        replacement + 
                        textarea.value.substring(end);
        
        textarea.setSelectionRange(start + replacement.length, start + replacement.length);
        textarea.focus();
        
        this.updatePreview();
        this.updateWordCount();
    },
    
    // 插入代码块
    insertCodeBlock() {
        const language = prompt('请输入代码语言（可选）:', 'javascript');
        const codeBlock = `\n\`\`\`${language || ''}\n\n\`\`\`\n`;
        this.insertText(codeBlock);
        
        // 将光标放在代码块内部
        const { textarea } = this.currentEditor;
        const pos = textarea.selectionStart - 4; // 4 = '```\n'.length
        textarea.setSelectionRange(pos, pos);
    },
    
    // 插入链接
    insertLink() {
        const { textarea } = this.currentEditor;
        const selectedText = this.getSelectedText();
        
        let linkText = selectedText;
        let linkUrl = '';
        
        if (!linkText) {
            linkText = prompt('请输入链接文本:') || '链接文本';
        }
        
        linkUrl = prompt('请输入链接地址:') || 'https://example.com';
        
        const linkMarkdown = `[${linkText}](${linkUrl})`;
        
        if (selectedText) {
            this.replaceSelection(linkMarkdown);
        } else {
            this.insertText(linkMarkdown);
        }
    },
    
    // 插入图片
    insertImage() {
        const altText = prompt('请输入图片描述:') || '图片描述';
        const imageUrl = prompt('请输入图片地址:') || 'https://example.com/image.jpg';
        
        const imageMarkdown = `![${altText}](${imageUrl})`;
        this.insertText(imageMarkdown);
    },
    
    // 插入表格
    insertTable() {
        const rows = parseInt(prompt('请输入行数:', '3')) || 3;
        const cols = parseInt(prompt('请输入列数:', '3')) || 3;
        
        let table = '\n';
        
        // 表头
        table += '|';
        for (let i = 0; i < cols; i++) {
            table += ` 列${i + 1} |`;
        }
        table += '\n';
        
        // 分隔线
        table += '|';
        for (let i = 0; i < cols; i++) {
            table += ' --- |';
        }
        table += '\n';
        
        // 数据行
        for (let i = 0; i < rows - 1; i++) {
            table += '|';
            for (let j = 0; j < cols; j++) {
                table += ' 数据 |';
            }
            table += '\n';
        }
        
        table += '\n';
        this.insertText(table);
    },
    
    // 获取选中文本
    getSelectedText() {
        const { textarea } = this.currentEditor;
        return textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
    },
    
    // 保存光标位置
    saveCursorPosition() {
        const { textarea } = this.currentEditor;
        this.currentEditor.lastCursorPos = textarea.selectionStart;
    },
    
    // 更新预览
    updatePreview() {
        const { textarea, preview } = this.currentEditor;
        if (!preview) return;
        
        const markdown = textarea.value;
        const html = this.markdownToHtml(markdown);
        preview.innerHTML = html;
    },
    
    // Markdown 转 HTML（简单实现）
    markdownToHtml(markdown) {
        let html = markdown;
        
        // 代码块
        html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
        
        // 行内代码
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // 标题
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
        
        // 粗体
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // 斜体
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // 删除线
        html = html.replace(/~~(.*?)~~/g, '<del>$1</del>');
        
        // 链接
        html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
        
        // 图片
        html = html.replace(/!\[([^\]]*)\]\(([^\)]+)\)/g, '<img src="$2" alt="$1" />');
        
        // 引用
        html = html.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');
        
        // 水平线
        html = html.replace(/^---$/gim, '<hr>');
        
        // 无序列表
        html = html.replace(/^- (.*$)/gim, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
        
        // 有序列表
        html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');
        
        // 段落
        html = html.replace(/\n\n/g, '</p><p>');
        html = '<p>' + html + '</p>';
        
        // 换行
        html = html.replace(/\n/g, '<br>');
        
        return html;
    },
    
    // 更新字数统计
    updateWordCount() {
        const { textarea } = this.currentEditor;
        const content = textarea.value;
        
        // 字符数
        const charCount = content.length;
        
        // 单词数（中文按字符计算，英文按单词计算）
        const chineseChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length;
        const englishWords = (content.match(/[a-zA-Z]+/g) || []).length;
        const wordCount = chineseChars + englishWords;
        
        // 行数
        const lineCount = content.split('\n').length;
        
        // 预计阅读时间（按每分钟200字计算）
        const readingTime = Math.ceil(wordCount / 200);
        
        // 更新显示
        const wordCountElement = document.querySelector('.word-count');
        if (wordCountElement) {
            wordCountElement.innerHTML = `
                字符: ${charCount} | 
                字数: ${wordCount} | 
                行数: ${lineCount} | 
                预计阅读: ${readingTime} 分钟
            `;
        }
    },
    
    // 切换全屏模式
    toggleFullscreen() {
        const editor = document.querySelector('.editor-container');
        if (!editor) return;
        
        if (editor.classList.contains('fullscreen')) {
            editor.classList.remove('fullscreen');
            document.body.style.overflow = '';
        } else {
            editor.classList.add('fullscreen');
            document.body.style.overflow = 'hidden';
        }
    },
    
    // 切换预览模式
    togglePreview() {
        const container = document.querySelector('.editor-container');
        const previewBtn = document.querySelector('[data-action="preview"]');
        
        if (!container || !previewBtn) return;
        
        if (container.classList.contains('preview-only')) {
            container.classList.remove('preview-only');
            previewBtn.innerHTML = '<i class="fas fa-eye"></i> 预览';
        } else {
            container.classList.add('preview-only');
            previewBtn.innerHTML = '<i class="fas fa-edit"></i> 编辑';
            this.updatePreview();
        }
    },
    
    // 文件上传处理
    handleFileUpload(file, callback) {
        const formData = new FormData();
        formData.append('file', file);
        
        AdminUtils.showLoading('正在上传文件...');
        
        fetch('/admin/api/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            AdminUtils.hideLoading();
            
            if (data.success) {
                if (callback) {
                    callback(data.url);
                }
                AdminUtils.showToast('文件上传成功', 'success');
            } else {
                AdminUtils.showToast('文件上传失败: ' + data.message, 'error');
            }
        })
        .catch(error => {
            AdminUtils.hideLoading();
            console.error('上传错误:', error);
            AdminUtils.showToast('文件上传失败', 'error');
        });
    },
    
    // 拖拽上传
    initDragUpload() {
        const { textarea } = this.currentEditor;
        
        textarea.addEventListener('dragover', (e) => {
            e.preventDefault();
            textarea.classList.add('drag-over');
        });
        
        textarea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            textarea.classList.remove('drag-over');
        });
        
        textarea.addEventListener('drop', (e) => {
            e.preventDefault();
            textarea.classList.remove('drag-over');
            
            const files = Array.from(e.dataTransfer.files);
            files.forEach(file => {
                if (file.type.startsWith('image/')) {
                    this.handleFileUpload(file, (url) => {
                        const imageMarkdown = `![${file.name}](${url})`;
                        this.insertText(imageMarkdown);
                    });
                }
            });
        });
    },
    
    // 自动保存
    initAutoSave(saveCallback, interval = 30000) {
        if (!saveCallback) return;
        
        let saveTimer;
        const { textarea } = this.currentEditor;
        
        const autoSave = () => {
            clearTimeout(saveTimer);
            saveTimer = setTimeout(() => {
                saveCallback();
            }, interval);
        };
        
        textarea.addEventListener('input', autoSave);
    }
};

// 页面加载完成后初始化编辑器
document.addEventListener('DOMContentLoaded', function() {
    // 查找编辑器元素
    const contentTextarea = document.getElementById('content');
    const previewElement = document.getElementById('preview');
    
    if (contentTextarea) {
        // 初始化编辑器
        const editor = MarkdownEditor.init('content', 'preview');
        
        if (editor) {
            // 初始化拖拽上传
            MarkdownEditor.initDragUpload();
            
            // 初始化自动保存（如果有保存函数）
            if (typeof autoSavePost === 'function') {
                MarkdownEditor.initAutoSave(autoSavePost);
            }
        }
    }
    
    // 图片上传按钮
    const imageUploadBtn = document.getElementById('imageUpload');
    if (imageUploadBtn) {
        imageUploadBtn.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                MarkdownEditor.handleFileUpload(file, (url) => {
                    const imageMarkdown = `![${file.name}](${url})`;
                    MarkdownEditor.insertText(imageMarkdown);
                });
            }
        });
    }
});