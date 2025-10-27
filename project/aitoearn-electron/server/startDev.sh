#!/bin/bash

# 赋予执行权限：chmod +x startDev.sh
# 运行：./start.sh

# git切换到master分支
git checkout dev

# git拉取最新代码
git pull

# 安装依赖（如需自动安装）
pnpm install

# 构建项目
pnpm build

# 使用PM2启动应用
pm2 start pm2.json

echo "PM2 $APP_NAME 启动完成！"
pm2 list
