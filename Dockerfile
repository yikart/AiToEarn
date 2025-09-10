# 依赖安装阶段 - 仅复制依赖信息，不包含源代码
FROM node:22-alpine AS deps

RUN npm install -g pnpm

WORKDIR /app

# 复制依赖专用 workspace（仅包含 package.json 文件）
COPY deps/ ./

# 安装依赖 - 这一层可以被有效缓存，除非依赖发生变化
RUN pnpm install --prod --frozen-lockfile

# 生产构建阶段 - 复制实际的构建产物和代码
FROM node:22-alpine AS production

ARG APP_NAME

WORKDIR /app

# 从依赖阶段复制 node_modules 和配置文件
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./
COPY --from=deps /app/pnpm-workspace.yaml ./
COPY --from=deps /app/.npmrc ./

# 复制构建产物和代码（这些变化不会影响依赖缓存）
COPY apps/ ./apps/
COPY libs/ ./libs/

ENV NODE_ENV=production
ENV APP_NAME=$APP_NAME

CMD node apps/${APP_NAME}/main.js