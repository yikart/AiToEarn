# AiToEarn MCP 连接器配置指南（个人本地使用版）

AiToEarn 的内容生成（文案、图片、视频）与全平台发布能力通过 MCP 服务提供。本地安装本技能包后，需在豆包中新建一个自定义连接器并填入 API Key，工具才会生效。

## 配置步骤（豆包客户端）

1. 打开豆包电脑客户端（Mac / Windows 客户端，网页版与手机 App 无此入口），左侧栏进入「技能 · 连接器 · 伙伴」。
2. 右上角点「+ 新建 / 添加」→「新建自定义连接器」。
3. 按下表填写服务器信息：

| 配置项 | 国际站（aitoearn.ai） | 中国站（aitoearn.cn） |
| --- | --- | --- |
| 服务器名称 | AiToEarn（或 AiToEarn-MCP） | AiToEarn-CN（或 AiToEarn-MCP-CN） |
| 服务器 URL | `https://aitoearn.ai/api/ai/agent/mcp` | `https://aitoearn.cn/api/ai/agent/mcp` |
| 传输类型 | HTTP / Streamable HTTP | HTTP / Streamable HTTP |
| 鉴权方式 | API Key（请求头 `Authorization: Bearer <Key>`） | API Key（请求头 `Authorization: Bearer <Key>`） |

4. 保存连接器。之后在对话中触发本技能时，AiToEarn 工具（`generate_image`、`generate_video`、`list_channel_platforms` 等）即可被调用。

## 配置文件写法（如客户端支持 JSON 配置）

```json
{
  "mcpServers": {
    "aitoearn": {
      "type": "http",
      "url": "https://aitoearn.ai/api/ai/agent/mcp",
      "headers": {
        "Authorization": "Bearer <你的 AiToEarn API Key>"
      }
    }
  }
}
```

## API Key 获取

- 登录 aitoearn.ai（国际站）或 aitoearn.cn（中国站），在个人设置 / 开发者页面创建 AiToEarn API Key。
- 两个站点的账号与 Key 相互独立：国际站 Key 只能连国际站 URL，中国站 Key 只能连中国站 URL。
- 不要把 API Key 写进技能文件或对话内容；只保存在连接器鉴权配置中。

## 工具清单（连接后可用）

- 生成类：`list_image_models` / `generate_image`（图片）；`list_video_generation_models` / `generate_video`（视频，Seedance 系列）；`image_edit`（像素级图片编辑）；`call_maas_proxy`（音频生成 / ASR，视连接器暴露情况）
- 发布类：`list_channel_accounts` / `list_channel_platforms` / `get_channel_platform` / `create_*_publish_flow` / `guide_*_plugin_publish` / `get_channel_publish_record` / `cancel_channel_publish_task` / `update_channel_publish_at` 等
- 辅助类：`extract_video_frame` / `probe_video_metadata` / `probe_audio_metadata` / `probe_image_metadata` 等

以当前会话实际列出的工具为准；未列出的工具不可用，如实报告能力缺口。

## 常见问题

- **提示工具不存在 / 未授权**：检查连接器 URL 与 Key 所属站点是否匹配，以及 API Key 是否有效、是否有余额（积分）。
- **小红书 / 微信视频号不支持服务端发布**：走浏览器插件发布流程（`guide_rednote_plugin_publish` / `guide_wechat_channels_plugin_publish`），详见 `skills/channel-publish/SKILL.md`。
- **积分（credits）**：生成与发布消耗积分，中文表述一律为「积分」。
