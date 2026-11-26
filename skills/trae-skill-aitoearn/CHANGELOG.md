# Changelog

## OAuth migration

- MCP configuration now contains only the AiToEarn Streamable HTTP URL.
- Removed static-credential bridge and setup scripts.
- OAuth login and token lifecycle are owned by the MCP host and server.
- If Trae does not expose an OAuth authorization flow, the package reports the connection as unavailable and does not use a fallback credential.
