# 小猹网站部署指南

## 🚀 快速部署

### 使用部署脚本（推荐）

```bash
# 生产环境部署（main分支）
./scripts/deploy.sh

# 预览环境部署（main分支）
./scripts/deploy.sh preview

# 指定分支部署
./scripts/deploy.sh production website-dev
./scripts/deploy.sh preview website-dev
```

## 📋 部署前准备

### 1. 环境要求
- Node.js (推荐 v18+)
- pnpm 包管理器
- Git
- Cloudflare Wrangler

### 2. 安装依赖
```bash
pnpm install
```

### 3. 登录 Cloudflare
```bash
pnpm wrangler auth login
```

## 🌐 项目信息

- **项目名称**: `xiaocha`
- **生产域名**: `xiaocha.pages.dev`
- **生产分支**: `main`
- **构建目录**: `dist`
- **部署平台**: Cloudflare Pages

## 📝 部署流程

### 手动部署步骤

1. **构建项目**
   ```bash
   pnpm run build
   ```

2. **本地预览（可选）**
   ```bash
   pnpm wrangler pages dev dist
   ```

3. **部署到生产环境**
   ```bash
   pnpm wrangler pages deploy dist --project-name xiaocha --branch main
   ```

4. **部署到预览环境**
   ```bash
   pnpm wrangler pages deploy dist --project-name xiaocha --branch preview-test
   ```

## 🔧 项目配置

### Wrangler 配置 (`wrangler.jsonc`)
```json
{
  "name": "cha-website",
  "compatibility_date": "2025-10-11",
  "pages_build_output_dir": "./dist",
  "observability": {
    "enabled": true
  }
}
```

### Package.json 脚本
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "pnpm run build && wrangler pages dev dist",
    "deploy": "pnpm run build && wrangler pages deploy dist"
  }
}
```

## 📊 部署地址

### 环境对应
- **生产环境**: https://xiaocha.pages.dev
- **预览环境**: https://preview-{branch}.xiaocha.pages.dev
- **本地预览**: http://localhost:8788

### 查看部署历史
```bash
pnpm wrangler pages deployment list --project-name xiaocha
```

## 🛠️ 常用命令

### 项目管理
```bash
# 查看项目列表
pnpm wrangler pages project list

# 查看部署历史
pnpm wrangler pages deployment list --project-name xiaocha

# 删除部署
pnpm wrangler pages deployment delete <deployment-id> --project-name xiaocha
```

### 本地开发
```bash
# 启动开发服务器
pnpm run dev

# 本地预览构建结果
pnpm run preview

# 类型检查
pnpm wrangler types
```

## 🔍 故障排除

### 常见问题

1. **构建失败**
   ```bash
   # 清理缓存重新构建
   rm -rf dist node_modules
   pnpm install
   pnpm run build
   ```

2. **部署权限问题**
   ```bash
   # 重新登录 Cloudflare
   pnpm wrangler auth login
   ```

3. **分支不存在**
   ```bash
   # 检查可用分支
   git branch -a
   git checkout <branch-name>
   ```

### 调试模式
```bash
# 详细日志
pnpm wrangler pages deploy dist --project-name xiaocha --verbose
```

## 📱 移动端测试

部署后请在移动设备上测试：
- 响应式布局
- 触摸交互
- 性能表现
- SEO标签

## 🎯 品牌定位

- **核心定位**: 查单词，用小猹
- **差异化**: 选中，即懂
- **文化共鸣**: 鲁迅《故乡》闰土探索精神
- **设计风格**: 靓丽明快橙红色系

## 📞 技术支持

如有问题，请检查：
1. [Cloudflare Pages Dashboard](https://dash.cloudflare.com/pages)
2. 项目构建日志
3. 网络连接状态
4. Wrangler 版本兼容性

---

*最后更新: 2025年10月27日*