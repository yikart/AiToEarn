# AiToEarn Docker 部署指南

本指南将帮助您使用 Docker Compose 快速部署完整的 AiToEarn 应用栈。

## 📋 前置要求

在开始之前，请确保您的系统已安装：

- **Docker**: 版本 20.10 或更高
- **Docker Compose**: 版本 2.0 或更高

验证安装：
```bash
docker --version
docker compose version
```

## 🚀 快速启动

### 1. 克隆仓库

```bash
git clone https://github.com/yourusername/AiToEarn.git
cd AiToEarn
```

### 2. 配置环境变量

复制环境变量模板文件并根据您的需求修改：

```bash
cp env.example .env
```

编辑 `.env` 文件，至少需要修改以下关键配置：

```bash
# 必须修改的安全配置
MONGODB_PASSWORD=your-secure-mongodb-password
REDIS_PASSWORD=your-secure-redis-password
JWT_SECRET=your-jwt-secret-key
INTERNAL_TOKEN=your-internal-token

# 如果需要外部访问，修改 API 地址
NEXT_PUBLIC_API_URL=http://your-domain.com:3002/api
APP_DOMAIN=your-domain.com
```

> ⚠️ **安全提示**: 请务必修改默认密码和密钥，不要在生产环境使用默认值！

### 3. 启动服务

使用 Docker Compose 启动所有服务：

```bash
docker compose up -d
```

首次启动会拉取镜像，可能需要几分钟时间。

### 4. 查看服务状态

```bash
docker compose ps
```

所有服务的状态应该显示为 `healthy` 或 `running`。

### 5. 查看日志

查看所有服务日志：
```bash
docker compose logs -f
```

查看特定服务的日志：
```bash
docker compose logs -f aitoearn-web
docker compose logs -f aitoearn-server
docker compose logs -f aitoearn-channel
```

## 🌐 访问应用

启动成功后，您可以通过以下地址访问各个服务：

| 服务 | 地址 | 说明 |
|------|------|------|
| **前端应用** | http://localhost:3000 | Web 用户界面 |
| **主后端 API** | http://localhost:3002 | AiToEarn Server API |
| **频道服务 API** | http://localhost:7001 | AiToEarn Channel API |
| **MongoDB** | localhost:27017 | 数据库（需要认证） |
| **Redis** | localhost:6379 | 缓存服务（需要密码） |

## 📂 数据持久化

应用数据存储在 Docker volumes 中，即使容器删除，数据也会保留：

- `mongodb-data`: MongoDB 数据库文件
- `mongodb-config`: MongoDB 配置文件
- `redis-data`: Redis 持久化数据

查看所有 volumes：
```bash
docker volume ls | grep aitoearn
```

## 🔧 常用操作

### 停止服务

停止所有服务但保留数据：
```bash
docker compose stop
```

### 重启服务

```bash
docker compose restart
```

重启特定服务：
```bash
docker compose restart aitoearn-web
```

### 更新镜像

拉取最新镜像并重启：
```bash
docker compose pull
docker compose up -d
```

### 查看资源使用情况

```bash
docker stats
```

## 🗑️ 清理与卸载

### 停止并删除容器

保留数据卷：
```bash
docker compose down
```

### 完全清理（包括数据）

⚠️ **警告**: 这将删除所有数据，请谨慎操作！

```bash
# 停止并删除容器、网络和卷
docker compose down -v

# 删除镜像（可选）
docker rmi aitoearn/aitoearn-web:latest
docker rmi aitoearn/aitoearn-server:latest
docker rmi aitoearn/aitoearn-channel:latest
```

## 🐛 常见问题

### 1. 服务启动失败

**问题**: 容器频繁重启或健康检查失败

**解决方案**:
- 检查日志: `docker compose logs <service-name>`
- 确保端口未被占用: `lsof -i :3000,3002,7001,27017,6379`
- 验证环境变量配置是否正确

### 2. MongoDB 连接失败

**问题**: 服务无法连接到 MongoDB

**解决方案**:
- 确保 MongoDB 容器已完全启动: `docker compose logs mongodb`
- 检查用户名和密码是否正确配置
- 等待 MongoDB 健康检查通过

### 3. 服务间无法通信

**问题**: aitoearn-server 无法连接到 aitoearn-channel

**解决方案**:
- 确保所有服务在同一网络: `docker network inspect aitoearn-network`
- 检查 `INTERNAL_TOKEN` 在所有服务中是否一致
- 查看服务日志排查具体错误

### 4. 前端无法访问后端 API

**问题**: 浏览器访问 API 时出现 CORS 或网络错误

**解决方案**:
- 确保 `NEXT_PUBLIC_API_URL` 配置正确
- 如果使用域名，确保 DNS 解析正确
- 检查防火墙是否阻止了端口访问

### 5. 内存不足

**问题**: 容器因 OOM (Out of Memory) 被杀死

**解决方案**:
- 检查系统可用内存: `free -h`
- 为容器设置内存限制（编辑 docker-compose.yml）
- 考虑增加 swap 空间或升级硬件

## 📊 监控与维护

### 数据库备份

备份 MongoDB 数据：
```bash
docker compose exec mongodb mongodump --username admin --password your-password --authenticationDatabase admin --out /backup
docker cp aitoearn-mongodb:/backup ./mongodb-backup-$(date +%Y%m%d)
```

### 查看容器资源使用

```bash
docker stats --no-stream
```

### 日志管理

限制日志大小，编辑 `docker-compose.yml` 添加：
```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

## 🔒 安全建议

1. **修改默认密码**: 不要使用 `env.example` 中的示例密码
2. **使用强密钥**: JWT_SECRET 和 INTERNAL_TOKEN 应该是长随机字符串
3. **限制端口暴露**: 生产环境中，考虑只暴露必要的端口
4. **启用 TLS**: 使用 Nginx 或 Traefik 作为反向代理并配置 HTTPS
5. **定期更新**: 及时更新镜像以获取安全补丁
6. **网络隔离**: 考虑使用防火墙规则限制容器网络访问

## 📖 进阶配置

### 使用外部数据库

如果您已有 MongoDB 和 Redis 服务，可以修改 `docker-compose.yml`:

1. 注释掉 `mongodb` 和 `redis` 服务定义
2. 修改其他服务的环境变量，指向外部数据库地址
3. 移除 `depends_on` 中的数据库依赖

### 自定义网络

如果需要与其他 Docker 应用共享网络：

```yaml
networks:
  aitoearn-network:
    external: true
    name: my-custom-network
```

### 扩展服务

水平扩展某个服务（例如 web 服务）：

```bash
docker compose up -d --scale aitoearn-web=3
```

## 📞 获取帮助

- **GitHub Issues**: [提交问题](https://github.com/yourusername/AiToEarn/issues)
- **文档**: [查看完整文档](https://github.com/yourusername/AiToEarn)
- **社区**: 加入我们的讨论组

## 📝 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE.txt) 文件。

---

**祝您使用愉快！** 🎉

如有任何问题或建议，欢迎提交 Issue 或 Pull Request。

