# 🚀 小猹网站快速部署

## 一键部署命令

```bash
# 生产环境（推荐）
./scripts/deploy.sh

# 预览环境
./scripts/deploy.sh preview
```

## 📋 部署检查清单

- [ ] 已登录 Cloudflare: `pnpm wrangler auth login`
- [ ] 代码已提交: `git status`
- [ ] 依赖已安装: `pnpm install`
- [ ] 构建成功: `pnpm run build`

## 🌐 访问地址

- **生产环境**: https://xiaocha.pages.dev
- **本地预览**: http://localhost:8788 (`pnpm wrangler pages dev dist`)

## 🆘 遇到问题？

```bash
# 查看详细部署文档
cat DEPLOY.md

# 获取帮助
./scripts/deploy.sh --help
```

---

*🌱 查单词，用小猹 - 选中，即懂*