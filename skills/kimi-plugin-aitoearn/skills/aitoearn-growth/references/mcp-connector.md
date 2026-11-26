# AiToEarn MCP OAuth 连接器

AiToEarn MCP 使用 OAuth。中国版服务器为 `https://aitoearn.cn/api/ai/agent/mcp`，国际版服务器为 `https://aitoearn.ai/api/ai/agent/mcp`。

MCP 配置只包含传输方式和服务器 URL；不要添加认证请求头、环境变量、本地凭证文件或旧连接脚本。Kimi Work 应在发现服务端 OAuth 后打开登录与授权流程。

工具未出现时，指导用户在 Kimi Work 的 MCP 设置重新连接并完成 OAuth。若没有授权入口或授权失败，说明 MCP 尚未连接并停止，不要伪造工具调用或改用静态鉴权。
