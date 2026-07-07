#!/bin/bash

# 小猹网站部署脚本
# 使用方法: ./scripts/deploy.sh [环境] [分支]
# 环境: preview | production (默认: production)
# 分支: main | website-dev (默认: main)

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 参数处理
ENVIRONMENT=${1:-"production"}
BRANCH=${2:-"main"}
PROJECT_NAME="xiaocha"
DOMAIN="xiaocha.pages.dev"

echo -e "${BLUE}🌱 小猹网站部署脚本${NC}"
echo -e "${BLUE}=========================${NC}"
echo -e "环境: ${YELLOW}${ENVIRONMENT}${NC}"
echo -e "分支: ${YELLOW}${BRANCH}${NC}"
echo -e "项目: ${YELLOW}${PROJECT_NAME}${NC}"
echo -e "域名: ${YELLOW}${DOMAIN}${NC}"
echo ""

# 函数：检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}❌ 错误: $1 命令未找到，请先安装${NC}"
        exit 1
    fi
}

# 函数：检查Git状态
check_git_status() {
    echo -e "${BLUE}📋 检查Git状态...${NC}"

    if [[ -n $(git status --porcelain) ]]; then
        echo -e "${YELLOW}⚠️  检测到未提交的更改${NC}"
        read -p "是否要继续部署? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${RED}❌ 部署已取消${NC}"
            exit 1
        fi
    fi

    echo -e "${GREEN}✅ Git状态检查通过${NC}"
}

# 函数：构建项目
build_project() {
    echo -e "${BLUE}🔨 构建项目...${NC}"

    # 检查依赖
    if [[ ! -d "node_modules" ]]; then
        echo -e "${YELLOW}📦 安装依赖...${NC}"
        pnpm install
    fi

    # 构建
    pnpm run build

    if [[ $? -eq 0 ]]; then
        echo -e "${GREEN}✅ 构建成功${NC}"
    else
        echo -e "${RED}❌ 构建失败${NC}"
        exit 1
    fi
}

# 函数：本地预览
local_preview() {
    echo -e "${BLUE}👀 本地预览测试...${NC}"

    # 启动wrangler pages dev
    echo -e "${YELLOW}正在启动本地预览服务器...${NC}"
    echo -e "${YELLOW}预览地址: http://localhost:8788${NC}"
    echo -e "${YELLOW}按 Ctrl+C 停止预览并继续部署${NC}"

    pnpm wrangler pages dev dist &
    WRANGLER_PID=$!

    # 等待用户确认
    read -p "预览测试完成? (y/N): " -n 1 -r
    echo

    # 停止预览服务器
    kill $WRANGLER_PID 2>/dev/null || true

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}❌ 部署已取消${NC}"
        exit 1
    fi

    echo -e "${GREEN}✅ 本地预览测试通过${NC}"
}

# 函数：部署到Cloudflare Pages
deploy_to_cloudflare() {
    echo -e "${BLUE}🚀 部署到Cloudflare Pages...${NC}"

    if [[ "$ENVIRONMENT" == "preview" ]]; then
        echo -e "${YELLOW}🔍 部署到预览环境...${NC}"
        pnpm wrangler pages deploy dist \
            --project-name "$PROJECT_NAME" \
            --branch "preview-$BRANCH" \
            --commit-message "预览部署: $(date '+%Y-%m-%d %H:%M:%S')"

        echo -e "${GREEN}✅ 预览部署完成${NC}"
        echo -e "${YELLOW}📖 预览地址: https://preview-$BRANCH.$DOMAIN${NC}"

    else
        echo -e "${YELLOW}🌟 部署到生产环境...${NC}"
        pnpm wrangler pages deploy dist \
            --project-name "$PROJECT_NAME" \
            --branch "$BRANCH" \
            --commit-message "生产部署: $(date '+%Y-%m-%d %H:%M:%S')"

        echo -e "${GREEN}✅ 生产部署完成${NC}"
        echo -e "${YELLOW}🌐 访问地址: https://$DOMAIN${NC}"
    fi
}

# 函数：验证部署
verify_deployment() {
    echo -e "${BLUE}🔍 验证部署状态...${NC}"

    # 检查项目列表
    pnpm wrangler pages project list | grep "$PROJECT_NAME" > /dev/null

    if [[ $? -eq 0 ]]; then
        echo -e "${GREEN}✅ 项目验证通过${NC}"
    else
        echo -e "${RED}❌ 项目验证失败${NC}"
        exit 1
    fi
}

# 主流程
main() {
    echo -e "${BLUE}开始部署流程...${NC}"

    # 检查必要命令
    check_command "pnpm"
    check_command "git"

    # 检查Git状态
    check_git_status

    # 构建项目
    build_project

    # 可选：本地预览
    read -p "是否进行本地预览测试? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        local_preview
    fi

    # 部署到Cloudflare Pages
    deploy_to_cloudflare

    # 验证部署
    verify_deployment

    echo ""
    echo -e "${GREEN}🎉 部署完成！${NC}"
    echo -e "${GREEN}=====================${NC}"

    if [[ "$ENVIRONMENT" == "preview" ]]; then
        echo -e "${YELLOW}📖 预览地址: https://preview-$BRANCH.$DOMAIN${NC}"
    else
        echo -e "${YELLOW}🌐 生产地址: https://$DOMAIN${NC}"
    fi

    echo -e "${YELLOW}📊 Cloudflare Dashboard: https://dash.cloudflare.com/pages${NC}"
    echo ""
}

# 显示帮助信息
show_help() {
    echo "小猹网站部署脚本"
    echo ""
    echo "使用方法:"
    echo "  $0 [环境] [分支]"
    echo ""
    echo "参数:"
    echo "  环境     preview | production (默认: production)"
    echo "  分支     main | website-dev (默认: main)"
    echo ""
    echo "示例:"
    echo "  $0                    # 部署生产环境(main分支)"
    echo "  $0 preview            # 部署预览环境(main分支)"
    echo "  $0 production website-dev  # 部署生产环境(website-dev分支)"
    echo "  $0 preview website-dev     # 部署预览环境(website-dev分支)"
    echo ""
    echo "要求:"
    echo "  - pnpm 命令可用"
    echo "  - git 命令可用"
    echo "  - 已登录Cloudflare账号"
}

# 处理命令行参数
case "$1" in
    -h|--help)
        show_help
        exit 0
        ;;
    *)
        main
        ;;
esac