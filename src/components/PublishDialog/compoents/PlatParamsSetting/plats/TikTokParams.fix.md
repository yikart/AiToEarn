# TikTokParams Switch 开关问题修复

## 问题描述

用户反馈 TikTokParams 组件中的商业内容披露 Switch 开关无法打开。

## 问题分析

1. **API 数据正常**：接口返回的数据结构正确，包含了所有必要的字段
2. **初始化问题**：Switch 的 `checked` 属性基于 `brand_organic_toggle || brand_content_toggle`，初始值都是 `false`
3. **状态更新问题**：直接修改 `pubItem.params.option` 对象可能导致 React 状态更新问题

## 修复方案

### 1. 改进状态更新逻辑

**修复前：**
```typescript
const option = pubItem.params.option;
option.tiktok!.brand_organic_toggle = true;
setOnePubParams({ option }, pubItem.account.id);
```

**修复后：**
```typescript
const option = { ...pubItem.params.option };
if (!option.tiktok) {
  option.tiktok = {
    privacy_level: '',
    comment_disabled: false,
    duet_disabled: false,
    stitch_disabled: false,
    brand_organic_toggle: false,
    brand_content_toggle: false,
  };
}
option.tiktok.brand_organic_toggle = true;
setOnePubParams({ option }, pubItem.account.id);
```

### 2. 添加调试信息

添加了详细的控制台日志和状态显示，帮助调试：

```typescript
// 显示当前状态
<div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
  当前状态: {JSON.stringify({
    brand_organic_toggle: pubItem.params.option.tiktok?.brand_organic_toggle,
    brand_content_toggle: pubItem.params.option.tiktok?.brand_content_toggle,
    switch_checked: pubItem.params.option.tiktok?.brand_organic_toggle || pubItem.params.option.tiktok?.brand_content_toggle
  })}
</div>

// 控制台日志
console.log('TikTok Switch changed:', checked);
console.log('TikTok options after change:', option.tiktok);
```

### 3. 改进 Switch 行为

**修复前：**
- 点击 Switch 时，如果 `checked` 为 `true`，会进入 `if (!checked)` 分支
- 导致两个值都被设置为 `false`，Switch 无法打开

**修复后：**
- 明确处理开启和关闭两种情况
- 开启时默认选择"您的品牌"选项
- 关闭时清空所有商业内容选项

## 修复的文件

- `src/components/PublishDialog/compoents/PlatParamsSetting/plats/TikTokParams.tsx`

## 测试方法

1. 打开浏览器开发者工具的控制台
2. 在发布对话框中选择 TikTok 账户
3. 查看商业内容披露 Switch 的状态显示
4. 点击 Switch 开关，观察控制台日志
5. 验证 Switch 能够正常开启和关闭

## 预期结果

- Switch 开关能够正常响应点击事件
- 开启时显示"您的品牌"和"品牌内容"选项
- 关闭时隐藏所有商业内容选项
- 控制台显示详细的状态变化日志

## 注意事项

1. 调试信息会在生产环境中移除
2. 状态更新使用对象展开操作符确保 React 能正确检测变化
3. 所有 TikTok 相关的状态更新都使用相同的模式
