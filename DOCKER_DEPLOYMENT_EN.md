# AiToEarn Docker Deployment Guide

This guide will help you quickly deploy the complete AiToEarn application stack using Docker Compose.

## 📋 Prerequisites

Before you begin, ensure your system has:

- **Docker**: Version 20.10 or higher
- **Docker Compose**: Version 2.0 or higher

Verify installation:
```bash
docker --version
docker compose version
```

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yikart/AiToEarn.git
cd AiToEarn
```

### 2. Configure Environment Variables

Copy the environment variable template file and modify it according to your needs:

```bash
cp env.example .env
```

Edit the `.env` file. At minimum, modify these critical configurations:

```bash
# Required security configurations
MONGODB_PASSWORD=your-secure-mongodb-password
REDIS_PASSWORD=your-secure-redis-password
JWT_SECRET=your-jwt-secret-key
INTERNAL_TOKEN=your-internal-token

# If external access is needed, modify API address
NEXT_PUBLIC_API_URL=http://your-domain.com:3002/api
APP_DOMAIN=your-domain.com
```

> ⚠️ **Security Warning**: Always change default passwords and secrets. Never use default values in production!

### 3. Start Services

Launch all services using Docker Compose:

```bash
docker compose up -d
```

The first startup will pull images, which may take a few minutes.

### 4. Check Service Status

```bash
docker compose ps
```

All services should show status as `healthy` or `running`.

### 5. View Logs

View all service logs:
```bash
docker compose logs -f
```

View specific service logs:
```bash
docker compose logs -f aitoearn-web
docker compose logs -f aitoearn-server
docker compose logs -f aitoearn-channel
```

## 🌐 Access Applications

After successful startup, you can access services at the following addresses:

| Service | URL | Description |
|---------|-----|-------------|
| **Web Frontend** | http://localhost:3000 | Web User Interface |
| **Main Backend API** | http://localhost:3002 | AiToEarn Server API |
| **Channel Service API** | http://localhost:7001 | AiToEarn Channel API |
| **MongoDB** | localhost:27017 | Database (authentication required) |
| **Redis** | localhost:6379 | Cache Service (password required) |

## 📂 Data Persistence

Application data is stored in Docker volumes. Data persists even if containers are deleted:

- `mongodb-data`: MongoDB database files
- `mongodb-config`: MongoDB configuration files
- `redis-data`: Redis persistent data

View all volumes:
```bash
docker volume ls | grep aitoearn
```

## 🔧 Common Operations

### Stop Services

Stop all services while preserving data:
```bash
docker compose stop
```

### Restart Services

```bash
docker compose restart
```

Restart specific service:
```bash
docker compose restart aitoearn-web
```

### Update Images

Pull latest images and restart:
```bash
docker compose pull
docker compose up -d
```

### View Resource Usage

```bash
docker stats
```

## 🗑️ Cleanup & Uninstall

### Stop and Remove Containers

Preserve data volumes:
```bash
docker compose down
```

### Complete Cleanup (Including Data)

⚠️ **Warning**: This will delete all data. Proceed with caution!

```bash
# Stop and remove containers, networks, and volumes
docker compose down -v

# Remove images (optional)
docker rmi aitoearn/aitoearn-web:latest
docker rmi aitoearn/aitoearn-server:latest
docker rmi aitoearn/aitoearn-channel:latest
```

## 🐛 Troubleshooting

### 1. Service Startup Failure

**Issue**: Containers restart frequently or health checks fail

**Solution**:
- Check logs: `docker compose logs <service-name>`
- Ensure ports are not in use: `lsof -i :3000,3002,7001,27017,6379`
- Verify environment variable configuration

### 2. MongoDB Connection Failure

**Issue**: Services cannot connect to MongoDB

**Solution**:
- Ensure MongoDB container is fully started: `docker compose logs mongodb`
- Verify username and password are correctly configured
- Wait for MongoDB health check to pass

### 3. Inter-service Communication Issues

**Issue**: aitoearn-server cannot connect to aitoearn-channel

**Solution**:
- Ensure all services are on the same network: `docker network inspect aitoearn-network`
- Check that `INTERNAL_TOKEN` is consistent across all services
- Review service logs for specific errors

### 4. Frontend Cannot Access Backend API

**Issue**: Browser shows CORS or network errors when accessing API

**Solution**:
- Ensure `NEXT_PUBLIC_API_URL` is correctly configured
- If using a domain, verify DNS resolution
- Check if firewall is blocking port access

### 5. Out of Memory

**Issue**: Containers killed due to OOM (Out of Memory)

**Solution**:
- Check available system memory: `free -h`
- Set memory limits for containers (edit docker-compose.yml)
- Consider increasing swap space or upgrading hardware

## 📊 Monitoring & Maintenance

### Database Backup

Backup MongoDB data:
```bash
docker compose exec mongodb mongodump --username admin --password your-password --authenticationDatabase admin --out /backup
docker cp aitoearn-mongodb:/backup ./mongodb-backup-$(date +%Y%m%d)
```

### View Container Resources

```bash
docker stats --no-stream
```

### Log Management

Limit log size by adding to `docker-compose.yml`:
```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

## 🔒 Security Recommendations

1. **Change Default Passwords**: Never use example passwords from `env.example`
2. **Use Strong Keys**: JWT_SECRET and INTERNAL_TOKEN should be long random strings
3. **Limit Port Exposure**: In production, consider exposing only necessary ports
4. **Enable TLS**: Use Nginx or Traefik as reverse proxy with HTTPS
5. **Regular Updates**: Keep images updated for security patches
6. **Network Isolation**: Use firewall rules to restrict container network access

## 📖 Advanced Configuration

### Using External Databases

If you have existing MongoDB and Redis services, modify `docker-compose.yml`:

1. Comment out `mongodb` and `redis` service definitions
2. Update other services' environment variables to point to external database addresses
3. Remove database dependencies from `depends_on`

### Custom Network

To share network with other Docker applications:

```yaml
networks:
  aitoearn-network:
    external: true
    name: my-custom-network
```

### Scaling Services

Horizontally scale a service (e.g., web service):

```bash
docker compose up -d --scale aitoearn-web=3
```

## 📞 Get Help

- **GitHub Issues**: [Submit an issue](https://github.com/yourusername/AiToEarn/issues)
- **Documentation**: [View full documentation](https://github.com/yourusername/AiToEarn)
- **Community**: Join our discussion forum

## 📝 License

This project is licensed under the MIT License. See [LICENSE](LICENSE.txt) file for details.

---

**Enjoy using AiToEarn!** 🎉

If you have any questions or suggestions, please submit an Issue or Pull Request.

