# Common Components

`common/` 存放跨页面、跨业务域复用的小型通用组件。组件应低业务耦合，不承载某个页面的完整流程。

## 组件清单

| 组件                   | 说明                                         |
| ---------------------- | -------------------------------------------- |
| `AvatarPlat`           | 带平台标识的账号头像组件。                   |
| `EditTitleModal`       | 通用标题编辑弹窗。                           |
| `FavoriteButton`       | 收藏按钮。                                   |
| `MediaPreview`         | 图片/视频/音频预览组件。                     |
| `MorphingIcon`         | 图标过渡动效组件。                           |
| `OssImage`             | OSS/R2 图片渲染组件，统一生成缩略图 URL。    |
| `PlatformIcon`         | 平台图标组件，基于平台元数据与静态兜底图标。 |
| `WechatBrowserOverlay` | 微信/支付宝内置浏览器提示遮罩。              |

## 放置规则

- 只放小型、通用、低业务耦合组件。
- 页面级流程、业务域卡片、列表、弹窗优先放页面局部或对应业务域目录。
- 渲染 OSS/R2 图片时优先复用 `OssImage`，不要直接使用 `next/image` 或 `img`。
