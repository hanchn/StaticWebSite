import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { getAllPosts, getPostBySlug, createPost, updatePost, deletePost } from '../utils/markdown.js';
import config from '../config/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../content/uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB 限制
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件 (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// 管理首页
router.get('/', async (req, res) => {
  try {
    const posts = await getAllPosts();
    const stats = {
      totalPosts: posts.length,
      publishedPosts: posts.filter(p => !p.draft).length,
      draftPosts: posts.filter(p => p.draft).length,
      recentPosts: posts.slice(0, 5)
    };

    res.render('admin/dashboard', {
      title: '管理后台 - ' + config.site.title,
      layout: 'layouts/admin',
      stats,
      posts: stats.recentPosts
    });
  } catch (error) {
    console.error('管理后台加载错误:', error);
    res.status(500).render('admin/error', {
      title: '加载错误',
      layout: 'layouts/admin',
      message: '管理后台加载失败，请稍后重试。'
    });
  }
});

// 文章列表
router.get('/posts', async (req, res) => {
  try {
    const posts = await getAllPosts();
    res.render('admin/posts', {
      title: '文章管理 - ' + config.site.title,
      layout: 'layouts/admin',
      posts
    });
  } catch (error) {
    console.error('文章列表加载错误:', error);
    res.status(500).render('admin/error', {
      title: '加载错误',
      layout: 'layouts/admin',
      message: '文章列表加载失败，请稍后重试。'
    });
  }
});

// 新建文章页面
router.get('/posts/new', (req, res) => {
  res.render('admin/post-edit', {
    title: '新建文章 - ' + config.site.title,
    layout: 'layouts/admin',
    post: null,
    isEdit: false
  });
});

// 编辑文章页面
router.get('/posts/edit/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const post = await getPostBySlug(slug);
    
    if (!post) {
      return res.status(404).render('admin/error', {
        title: '文章未找到',
        layout: 'layouts/admin',
        message: '要编辑的文章不存在。'
      });
    }

    res.render('admin/post-edit', {
      title: '编辑文章 - ' + config.site.title,
      layout: 'layouts/admin',
      post,
      isEdit: true
    });
  } catch (error) {
    console.error('文章编辑页面加载错误:', error);
    res.status(500).render('admin/error', {
      title: '加载错误',
      layout: 'layouts/admin',
      message: '文章编辑页面加载失败，请稍后重试。'
    });
  }
});

// 创建文章
router.post('/posts', async (req, res) => {
  try {
    const postData = {
      title: req.body.title,
      content: req.body.content,
      category: req.body.category,
      tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [],
      description: req.body.description,
      cover: req.body.cover,
      draft: req.body.draft === 'true'
    };

    const slug = await createPost(postData);
    res.redirect(`/admin/posts/edit/${slug}?success=created`);
  } catch (error) {
    console.error('文章创建错误:', error);
    res.status(500).render('admin/error', {
      title: '创建失败',
      layout: 'layouts/admin',
      message: '文章创建失败: ' + error.message
    });
  }
});

// 更新文章
router.post('/posts/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const postData = {
      title: req.body.title,
      content: req.body.content,
      category: req.body.category,
      tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [],
      description: req.body.description,
      cover: req.body.cover,
      draft: req.body.draft === 'true'
    };

    await updatePost(slug, postData);
    res.redirect(`/admin/posts/edit/${slug}?success=updated`);
  } catch (error) {
    console.error('文章更新错误:', error);
    res.status(500).render('admin/error', {
      title: '更新失败',
      layout: 'layouts/admin',
      message: '文章更新失败: ' + error.message
    });
  }
});

// 删除文章
router.delete('/posts/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    await deletePost(slug);
    res.json({ success: true, message: '文章删除成功' });
  } catch (error) {
    console.error('文章删除错误:', error);
    res.status(500).json({ success: false, message: '文章删除失败: ' + error.message });
  }
});

// 文件上传
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '没有文件被上传' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      success: true,
      message: '文件上传成功',
      url: fileUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('文件上传错误:', error);
    res.status(500).json({ success: false, message: '文件上传失败: ' + error.message });
  }
});

// 媒体库
router.get('/media', (req, res) => {
  res.render('admin/media', {
    title: '媒体库 - ' + config.site.title,
    layout: 'layouts/admin'
  });
});

// 设置页面
router.get('/settings', (req, res) => {
  res.render('admin/settings', {
    title: '站点设置 - ' + config.site.title,
    layout: 'layouts/admin',
    config
  });
});

export default router;