# @yikart/multilogin

NestJS 模块，用于 Multilogin X API 集成。

## 功能特性

- 🚀 **Launcher API**: 控制浏览器配置文件、快速配置文件、内核和验证
- 👤 **Profile Management API**: 用户认证、工作区、配置文件和文件夹管理
- 🛡️ **类型安全**: 完整的 TypeScript 支持和全面的类型定义
- 🔄 **错误处理**: 结构化的错误类和适当的 HTTP 状态码
- 📡 **HTTP 客户端**: 基于 Axios，支持拦截器和自动重试
- 🏗️ **NestJS 模块**: 标准的 NestJS 动态模块设计

## 安装

```bash
pnpm add @yikart/multilogin
```

## 使用方法

### 模块导入

```typescript
import { Module } from '@nestjs/common'
import { MultiloginConfig } from '../src/multilogin.config'
import { MultiloginModule } from '../src/multilogin.module'

const config: MultiloginConfig = {
  launcherBaseUrl: 'https://launcher.mlx.yt:45001',
  profileBaseUrl: 'https://api.multilogin.com',
  timeout: 30000,
  accessToken: 'your-access-token' // 可选
}

@Module({
  imports: [
    MultiloginModule.forRoot(config)
  ],
})
export class AppModule {}
```

### 服务注入和使用

```typescript
import { Injectable } from '@nestjs/common'
import { MultiloginService } from '../src/multilogin.module'

@Injectable()
export class SomeService {
  constructor(private readonly multiloginService: MultiloginService) {}

  async startProfile() {
    // 使用 launcher 客户端
    return await this.multiloginService.launcher.startBrowserProfile(
      'folder-id',
      'profile-id',
      { automation_type: 'selenium', headless_mode: false }
    )
  }

  async getUserWorkspaces() {
    // 使用 profile 客户端
    return await this.multiloginService.profile.getUserWorkspaces()
  }
}
```

### API 使用示例

#### Launcher API

```typescript
@Injectable()
export class BrowserService {
  constructor(private readonly multiloginService: MultiloginService) {}

  // 启动浏览器配置文件
  async startBrowserProfile(folderId: string, profileId: string) {
    return await this.multiloginService.launcher.startBrowserProfile(
      folderId,
      profileId,
      { automation_type: 'selenium', headless_mode: false }
    )
  }

  // 创建快速配置文件
  async createQuickProfile() {
    return await this.multiloginService.launcher.startQuickProfileV3({
      browser_type: 'mimic',
      os_type: 'linux',
      automation: 'selenium',
      core_version: 124,
      is_headless: false,
      parameters: {
        flags: {
          audio_masking: 'mask',
          fonts_masking: 'custom',
          // ... 其他标志
        },
        fingerprint: {
          navigator: {
            hardware_concurrency: 8,
            platform: 'Win32',
            user_agent: 'Mozilla/5.0...',
            os_cpu: '',
          },
          // ... 其他指纹数据
        },
      },
    })
  }

  // 停止配置文件
  async stopProfile(profileId: string) {
    await this.multiloginService.launcher.stopBrowserProfile(profileId)
  }

  // 获取版本信息
  async getVersion() {
    return await this.multiloginService.launcher.getVersion()
  }
}
```

#### Profile Management API

```typescript
@Injectable()
export class ProfileManagementService {
  constructor(private readonly multiloginService: MultiloginService) {}

  // 用户登录
  async signIn(email: string, password: string) {
    return await this.multiloginService.profile.signIn({ email, password })
  }

  // 获取配置文件列表
  async getProfiles(folderId?: string) {
    return await this.multiloginService.profile.getProfiles(folderId)
  }

  // 创建文件夹
  async createFolder(name: string, parentId?: string) {
    return await this.multiloginService.profile.createFolder(name, parentId)
  }

  // 获取用户工作区
  async getUserWorkspaces() {
    return await this.multiloginService.profile.getUserWorkspaces()
  }
}
```

### 错误处理

```typescript
import { MultiloginAuthenticationError, MultiloginError, MultiloginValidationError } from '../src/multilogin.exception'

@Injectable()
export class ExampleService {
  constructor(private readonly multiloginService: MultiloginService) {}

  async handleApiCall() {
    try {
      await this.multiloginService.launcher.startBrowserProfile('folder-id', 'profile-id')
    }
    catch (error) {
      if (error instanceof MultiloginAuthenticationError) {
        // 处理认证错误
        throw new TypeError(`认证失败: ${error.message}`)
      }
      else if (error instanceof MultiloginValidationError) {
        // 处理验证错误
        throw new TypeError('验证错误')
      }
      else if (error instanceof MultiloginError) {
        // 处理其他 API 错误
        throw new TypeError(`API 错误: ${error.message}`)
      }
      else {
        // 处理未知错误
        throw new TypeError('未知错误')
      }
    }
  }
}
```

## API 覆盖范围

### Launcher API ✅

- ✅ 启动/停止浏览器配置文件
- ✅ 快速配置文件管理 (v2/v3)
- ✅ 浏览器内核管理
- ✅ 配置文件状态监控
- ✅ Cookie 导入/导出
- ✅ 代理验证
- ✅ QBP 转换为配置文件

### Profile Management API ✅

- ✅ 用户认证
- ✅ 令牌管理
- ✅ 工作区管理
- ✅ 配置文件 CRUD 操作
- ✅ 文件夹管理

### 不包含的功能 🚫

- ❌ 对象存储端点
- ❌ 代理管理端点

## 类型定义

该模块提供了完整的 TypeScript 类型定义：

- `BrowserType`, `OsType`, `AutomationType`
- `ProfileResponse`, `ProfileStatus`, `QuickProfileRequest`
- `BrowserFingerprint`, `MaskingFlags`, `ProxyConfig`
- `AuthResponse`, `UserProfile`, `Workspace`
- 以及更多...

## 配置选项

```typescript
export interface MultiloginConfig {
  launcherBaseUrl?: string // 默认: 'https://launcher.mlx.yt:45001'
  profileBaseUrl?: string // 默认: 'https://api.multilogin.com'
  timeout?: number // 默认: 30000
  accessToken?: string // 可选的访问令牌
}
```

## 构建

运行 `nx build multilogin` 来构建库。

## 许可证

MIT
