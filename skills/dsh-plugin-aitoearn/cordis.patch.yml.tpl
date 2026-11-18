- insert:
  - id: dsh-plugin-aitoearn
    name: dsh-plugin-aitoearn
  - id: mcp-aitoearn
    name: '@deepseek-ai/dsh-mcp-client'
    config:
      serverName: aitoearn
      transport: streamable-http
      url: __AITOEARN_URL__
      headers:
        X-Api-Key: '__AITOEARN_KEY__'
