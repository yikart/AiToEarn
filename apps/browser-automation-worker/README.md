# Browser Automation Worker

一个轻量级的浏览器自动化工具，使用 Multilogin 管理浏览器配置文件，通过 Playwright 控制浏览器。

## 功能特性

- 🚀 使用 Multilogin 启动和管理浏览器配置文件
- 🪟 支持同时打开多个浏览器窗口
- 🎯 自动导航到指定 URL
- 🍪 为每个窗口独立设置 cookies
- 💾 为每个窗口独立设置 localStorage
- 📄 通过配置文件传递参数
- 🛡️ 完整的错误处理和日志记录

## 安装依赖

```bash
pnpm install
```

## 构建

```bash
pnpm nx build browser-automation-worker
```

## 使用方法

### 1. 创建配置文件

#### 配置文件

创建一个 JSON 配置文件，支持同时打开多个浏览器窗口：

```json
{
  "multilogin": {
    "email": "your-email@example.com",
    "password": "your-multilogin-password",
    "token": "optional-access-token"
  },
  "folderId": "your-folder-id",
  "profileId": "your-profile-id",
  "windows": [
    {
      "windowName": "Google Search",
      "url": "https://www.google.com",
      "cookies": [
        {
          "name": "search_preference",
          "value": "advanced",
          "domain": ".google.com",
          "path": "/",
          "secure": true,
          "httpOnly": false,
          "sameSite": "Lax"
        }
      ],
      "localStorage": [
        {
          "name": "theme",
          "value": "dark"
        }
      ]
    },
    {
      "windowName": "GitHub",
      "url": "https://github.com",
      "cookies": [
        {
          "name": "user_session",
          "value": "your-session-token",
          "domain": ".github.com",
          "path": "/",
          "secure": true,
          "httpOnly": true,
          "sameSite": "Lax"
        }
      ],
      "localStorage": [
        {
          "name": "preferred_color_mode",
          "value": "dark"
        }
      ]
    }
  ]
}
```

]
}

````

### 2. 运行工具

```bash
node dist/apps/browser-automation-worker/main.js --config example-multi-window-task.json
````

## 配置文件格式

### 配置参数

- `multilogin`: Multilogin 配置
  - `email`: Multilogin 账户邮箱
  - `password`: Multilogin 账户密码
  - `token` (可选): Multilogin 访问令牌，如果提供则优先使用，无需 email/password
- `folderId`: Multilogin 文件夹 ID，包含要使用的配置文件
- `profileId`: Multilogin 浏览器配置文件 ID
- `windows`: 窗口配置数组，每个元素包含：
  - `url`: 要访问的目标 URL
  - `cookies` (可选): 要设置的 HTTP cookie 数组
  - `localStorage` (可选): 要设置的 localStorage 数据数组

### Cookie 数据格式

- `name`: Cookie 名称
- `value`: Cookie 值
- `domain` (可选): Cookie 域名，默认为目标 URL 的主机名
- `path` (可选): Cookie 路径，默认为 '/'
- `expires` (可选): Cookie 过期时间戳
- `httpOnly` (可选): 是否仅限 HTTP 访问，默认为 false
- `secure` (可选): 是否仅在 HTTPS 下传输，默认为 false
- `sameSite` (可选): SameSite 策略，默认为 'Lax'

### LocalStorage 数据格式

- `name`: localStorage 键名
- `value`: localStorage 值

## 命令行选项

- `-c, --config <path>`: 配置文件路径 (必需)
- `-h, --help`: 显示帮助信息
- `-V, --version`: 显示版本信息

## 示例

查看 `example-task.json` 文件了解完整的配置示例。

## 错误处理

工具包含完整的错误处理机制：

- 配置文件验证
- Multilogin 连接错误
- 浏览器启动失败
- 网络连接问题

所有错误都会输出详细的错误信息和堆栈跟踪。

## 注意事项

1. 确保 Multilogin 客户端正在运行
2. 确保提供的配置文件 ID 存在且可访问
3. 配置文件中的敏感信息（如密码）应妥善保管
4. 建议在生产环境中使用 Ansible Vault 等工具管理敏感配置

## 与 Ansible 集成

此工具设计用于与 Ansible 集成，Ansible 可以：

1. 动态生成配置文件
2. 部署和执行脚本
3. 管理敏感凭据
4. 清理临时文件

详细的 Ansible 集成方案请参考项目文档。
