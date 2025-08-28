# 测试URL列表

## 功能测试链接

### 1. 只指定平台类型
- [Facebook授权](http://localhost:3000/accounts?platform=facebook)
- [Instagram授权](http://localhost:3000/accounts?platform=instagram)
- [TikTok授权](http://localhost:3000/accounts?platform=tiktok)
- [YouTube授权](http://localhost:3000/accounts?platform=youtube)
- [Twitter授权](http://localhost:3000/accounts?platform=twitter)

### 2. 指定平台类型和空间ID
- [Facebook + 空间ID](http://localhost:3000/accounts?platform=facebook&spaceId=123456)
- [Instagram + 空间ID](http://localhost:3000/accounts?platform=instagram&spaceId=789012)
- [TikTok + 空间ID](http://localhost:3000/accounts?platform=tiktok&spaceId=345678)

### 3. 只指定空间ID
- [指定空间ID](http://localhost:3000/accounts?spaceId=123456)

### 4. 无效参数测试
- [无效平台类型](http://localhost:3000/accounts?platform=invalid_platform)
- [无效平台 + 有效空间ID](http://localhost:3000/accounts?platform=invalid&spaceId=123456)

## 测试步骤

1. **基础功能测试**
   - 点击上述链接
   - 验证弹窗是否自动打开
   - 验证参数是否正确传递

2. **平台授权测试**
   - 使用包含platform参数的链接
   - 验证是否自动触发对应平台授权
   - 验证授权流程是否正常

3. **空间选择测试**
   - 使用包含spaceId参数的链接
   - 验证空间是否正确预选择
   - 验证空间选择器是否按预期显示

4. **参数清理测试**
   - 打开弹窗后关闭
   - 验证URL参数是否被清理
   - 验证页面状态是否重置

5. **错误处理测试**
   - 使用无效参数
   - 验证系统是否正确处理错误
   - 验证其他功能是否正常

## 预期结果

### 成功场景
- ✅ 弹窗自动打开
- ✅ 参数正确传递
- ✅ 平台授权自动触发
- ✅ 空间正确预选择
- ✅ URL参数正确清理

### 错误场景
- ✅ 无效参数被忽略
- ✅ 系统正常运行
- ✅ 错误信息正确显示
- ✅ 用户体验不受影响

## 调试信息

在浏览器控制台中可以看到以下调试信息：
- 参数接收日志
- 平台验证结果
- 弹窗状态变化
- 授权流程日志
- URL清理操作

## 注意事项

1. 确保开发服务器正在运行
2. 确保网络连接正常
3. 某些平台可能需要特定的网络环境
4. 授权流程需要用户手动完成
5. 测试时注意浏览器控制台的错误信息
