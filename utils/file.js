import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 确保目录存在
export function ensureDir(dirPath) {
  return fs.ensureDir(dirPath);
}

// 复制文件
export function copyFile(src, dest) {
  return fs.copy(src, dest);
}

// 复制目录
export function copyDir(src, dest) {
  return fs.copy(src, dest);
}

// 删除文件或目录
export function remove(target) {
  return fs.remove(target);
}

// 清空目录
export async function emptyDir(dirPath) {
  await fs.ensureDir(dirPath);
  return fs.emptyDir(dirPath);
}

// 读取文件
export function readFile(filePath, encoding = 'utf-8') {
  return fs.readFile(filePath, encoding);
}

// 写入文件
export function writeFile(filePath, content, encoding = 'utf-8') {
  return fs.writeFile(filePath, content, encoding);
}

// 检查文件是否存在
export function pathExists(filePath) {
  return fs.pathExists(filePath);
}

// 获取文件状态
export function stat(filePath) {
  return fs.stat(filePath);
}

// 读取目录
export function readDir(dirPath) {
  return fs.readdir(dirPath);
}

// 获取文件扩展名
export function getExtension(filePath) {
  return path.extname(filePath).toLowerCase();
}

// 获取文件名（不含扩展名）
export function getBasename(filePath, ext) {
  return path.basename(filePath, ext);
}

// 获取目录名
export function getDirname(filePath) {
  return path.dirname(filePath);
}

// 连接路径
export function joinPath(...paths) {
  return path.join(...paths);
}

// 解析路径
export function parsePath(filePath) {
  return path.parse(filePath);
}

// 获取相对路径
export function getRelativePath(from, to) {
  return path.relative(from, to);
}

// 获取绝对路径
export function getAbsolutePath(filePath) {
  return path.resolve(filePath);
}

// 递归获取目录下所有文件
export async function getAllFiles(dirPath, extensions = []) {
  const files = [];
  
  async function traverse(currentPath) {
    const items = await fs.readdir(currentPath);
    
    for (const item of items) {
      const itemPath = path.join(currentPath, item);
      const stats = await fs.stat(itemPath);
      
      if (stats.isDirectory()) {
        await traverse(itemPath);
      } else if (stats.isFile()) {
        if (extensions.length === 0 || extensions.includes(getExtension(itemPath))) {
          files.push(itemPath);
        }
      }
    }
  }
  
  if (await pathExists(dirPath)) {
    await traverse(dirPath);
  }
  
  return files;
}

// 获取文件大小（格式化）
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 获取文件信息
export async function getFileInfo(filePath) {
  try {
    const stats = await fs.stat(filePath);
    const parsed = path.parse(filePath);
    
    return {
      path: filePath,
      name: parsed.name,
      ext: parsed.ext,
      size: stats.size,
      sizeFormatted: formatFileSize(stats.size),
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
      created: stats.birthtime,
      modified: stats.mtime,
      accessed: stats.atime
    };
  } catch (error) {
    console.error(`获取文件信息错误 ${filePath}:`, error);
    return null;
  }
}

// 创建目录结构
export async function createDirStructure(basePath, structure) {
  for (const [name, content] of Object.entries(structure)) {
    const fullPath = path.join(basePath, name);
    
    if (typeof content === 'object' && content !== null) {
      // 创建目录
      await fs.ensureDir(fullPath);
      await createDirStructure(fullPath, content);
    } else {
      // 创建文件
      await fs.ensureDir(path.dirname(fullPath));
      if (content !== null) {
        await fs.writeFile(fullPath, content || '', 'utf-8');
      }
    }
  }
}

// 安全删除文件（移动到回收站）
export async function safeDelete(filePath) {
  try {
    const trashDir = path.join(__dirname, '../.trash');
    await fs.ensureDir(trashDir);
    
    const filename = path.basename(filePath);
    const timestamp = Date.now();
    const trashPath = path.join(trashDir, `${timestamp}-${filename}`);
    
    await fs.move(filePath, trashPath);
    console.log(`文件已移动到回收站: ${trashPath}`);
    
    return trashPath;
  } catch (error) {
    console.error('安全删除文件错误:', error);
    throw error;
  }
}

// 清理回收站
export async function cleanTrash(olderThanDays = 30) {
  try {
    const trashDir = path.join(__dirname, '../.trash');
    
    if (!(await pathExists(trashDir))) {
      return;
    }
    
    const files = await fs.readdir(trashDir);
    const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
    
    for (const file of files) {
      const filePath = path.join(trashDir, file);
      const stats = await fs.stat(filePath);
      
      if (stats.mtime.getTime() < cutoffTime) {
        await fs.remove(filePath);
        console.log(`清理回收站文件: ${file}`);
      }
    }
  } catch (error) {
    console.error('清理回收站错误:', error);
  }
}

// 备份文件
export async function backupFile(filePath, backupDir) {
  try {
    const filename = path.basename(filePath);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilename = `${timestamp}-${filename}`;
    const backupPath = path.join(backupDir, backupFilename);
    
    await fs.ensureDir(backupDir);
    await fs.copy(filePath, backupPath);
    
    console.log(`文件备份成功: ${backupPath}`);
    return backupPath;
  } catch (error) {
    console.error('备份文件错误:', error);
    throw error;
  }
}