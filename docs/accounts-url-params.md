# Accounts页面URL参数使用说明

## 概述

Accounts页面现在支持通过URL参数直接打开添加账号弹窗并自动触发指定平台的授权流程。

## 支持的参数

### 1. platform (平台类型)
- **类型**: string
- **必填**: 否
- **说明**: 指定要添加的平台类型
- **有效值**: 
  - `tiktok` - TikTok
  - `douyin` - 抖音
  - `xhs` - 小红书
  - `wxSph` - 微信视频号
  - `KWAI` - 快手
  - `youtube` - YouTube
  - `bilibili` - B站
  - `twitter` - Twitter
  - `wxGzh` - 微信公众号
  - `facebook` - Facebook
  - `instagram` - Instagram
  - `threads` - Threads
  - `pinterest` - Pinterest

### 2. spaceId (空间ID)
- **类型**: string
- **必填**: 否
- **说明**: 指定要添加账号的目标空间ID
- **注意**: 如果不提供此参数，弹窗会显示空间选择器

## 使用示例

### 示例2: 指定平台类型和空间ID
```
/accounts?platform=bilibili&spaceId=68aff90bba742c232af986f2
```
- 打开添加账号弹窗
- 预选择指定的空间ID
- 自动触发Instagram授权流程 

## 功能特性

### 1. 自动弹窗
- 当URL包含相关参数时，页面加载后会自动打开添加账号弹窗

### 2. 参数验证
- 系统会验证平台类型是否有效
- 无效的平台类型会被忽略

### 3. 空间预选择
- 如果提供了有效的spaceId，弹窗会预选择该空间
- 如果没有提供spaceId，会显示空间选择器

### 4. 自动授权触发
- 如果同时提供了有效的platform和spaceId，会自动触发对应平台的授权流程
- 授权流程会在弹窗完全打开后延迟500ms执行

### 5. URL清理
- 当用户关闭弹窗时，URL参数会被自动清除
- 使用`window.history.replaceState`确保URL干净

## 技术实现

### 1. 页面结构
```
/accounts/page.tsx - 接收URL参数
└── /accounts/accountCore.tsx - 处理参数逻辑
    └── AddAccountModal - 执行具体操作
```

### 2. 参数处理流程
1. 页面接收`searchParams`
2. 验证平台类型有效性
3. 设置弹窗状态和参数
4. 打开添加账号弹窗
5. 自动触发平台授权（如果条件满足）

### 3. 状态管理
- 使用React hooks管理弹窗状态
- 使用Zustand store管理账号数据
- 参数状态在组件内部管理

## 注意事项

1. **平台类型大小写敏感**: 请确保使用正确的平台类型值
2. **空间ID有效性**: 系统不会验证spaceId是否存在，请确保提供有效的ID
3. **授权流程**: 自动授权需要用户手动完成授权流程
4. **浏览器兼容性**: URL清理功能需要现代浏览器支持
5. **SSR兼容**: 参数处理在客户端执行，确保SSR兼容性

## 错误处理

- 无效的平台类型会被忽略，不会影响其他功能
- 网络错误或授权失败会显示相应的错误信息
- 弹窗关闭时会清理URL参数，避免重复触发

## 扩展性

该功能设计具有良好的扩展性：
- 可以轻松添加新的平台类型
- 可以扩展更多URL参数
- 可以自定义参数验证逻辑
- 可以添加更多的自动触发行为
