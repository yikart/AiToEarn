# aitoearn-cloud-space 应用专用 Dockerfile
# 包含 Ansible 安装逻辑，适配 k8s 环境

# 多阶段构建
FROM node:22-alpine AS base

# 安装 pnpm
RUN npm install -g pnpm

# 设置工作目录
WORKDIR /app

# 复制 pnpm 配置文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./

# 复制工作区包
COPY apps/ ./apps/
COPY libs/ ./libs/

# 安装生产依赖
RUN pnpm install --prod --frozen-lockfile

# 生产阶段
FROM node:22-alpine AS production

# 设置 APP_NAME 参数
ARG APP_NAME=aitoearn-cloud-space

# 安装系统依赖和 Ansible（仅针对 aitoearn-cloud-space）
RUN apk update && \
    if [ "$APP_NAME" = "aitoearn-cloud-space" ]; then \
        apk add --no-cache curl gnupg openssh-client python3 py3-pip && \
        pip3 install ansible && \
        apk del py3-pip && \
        rm -rf /var/cache/apk/*; \
    fi

WORKDIR /app

# 复制应用和依赖
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/apps ./apps
COPY --from=base /app/libs ./libs
COPY --from=base /app/package.json ./

# 设置环境变量
ENV NODE_ENV=production
ENV APP_NAME=$APP_NAME

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 -G nodejs

# 更改文件所有权
RUN chown -R nestjs:nodejs /app
USER nestjs

# 启动应用
CMD ["node", "apps/aitoearn-cloud-space/main.js"]