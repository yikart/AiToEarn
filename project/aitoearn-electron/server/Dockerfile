# 第一阶段：构建
FROM nestjs:v10 AS builder

WORKDIR /app
COPY package*.json ./
RUN yarn install
COPY . .
RUN yarn run build

# 第二阶段：创建最终运行镜像
FROM nestjs:v10

# 构建参数
ENV WORK_HOME /home/server
COPY --from=builder /app/dist /home/server/dist
COPY --from=builder /app/node_modules /home/server/node_modules

WORKDIR $WORK_HOME

# 声明对外暴露的端口
EXPOSE 3000
# 配置容器启动时运行的命令
ENTRYPOINT ["node","/home/server/dist/src/main.js"]

