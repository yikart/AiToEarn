# draft-box 组件目录

草稿箱业务域的跨页面共享组件目录。仅放置草稿箱计划、详情、生成栏、素材操作等明确属于草稿箱业务且会被多个草稿箱页面复用的组件。

## 组件清单

| 目录                                 | 说明                                                                                                                              |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `components/AiBatchGenerateBar/`     | 草稿箱 AI 批量生成输入栏，包含媒体上传、提示词输入、模型参数和平台选择；内部按 `components` / `hooks` / `utils` / `styles` 拆分。 |
| `components/MediaMentionPromptText/` | 只读提示词媒体提及展示，将 `@Image` / `@Video` / `@Audio` 渲染为资源 chip。                                                       |

## 新增规则

- 页面私有组件优先放到对应页面目录，不要提前提升到 `src/components/draft-box`。
- 新增跨页面复用组件时使用 PascalCase 独立文件夹，并通过 `index.tsx` 导出。
- 组件内部私有子组件、hooks、工具函数放在组件目录内；确认跨组件复用后再提升到 `src/components/draft-box/hooks` 或 `src/components/draft-box/utils`。
- 新增或迁移组件时同步更新本 README。
