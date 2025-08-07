import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { MCP_CLIENT } from './constants'

@Injectable()
export class McpService {
  constructor(
    @Inject(MCP_CLIENT)
    private readonly mcpClient: Client,
  ) {}

  private handleError(error: any): Error {
    if (error.response) {
      // 处理HTTP响应错误
      const status = error.response.status
      const message = error.response.data?.message || 'Unknown error'
      const err = new Error(`MCP Error: ${status} - ${message}`);
      (err as any).statusCode = status
      return err
    }
    // 处理网络或其他错误
    return new Error(`MCP Service Error: ${error.message}`)
  }

  // 列出工具
  async listTools(): Promise<any> {
    try {
      const response = await this.mcpClient.listTools()
      Logger.debug(response, '-------- mcp listTools --------')
      return response
    }
    catch (error) {
      Logger.error(`-------- mcp listTools message error ------`, error)

      // throw this.handleError(error);
    }
  }

  // 获取资源列表
  async getResourceList(): Promise<any> {
    try {
      const response = await this.mcpClient.listResources()
      Logger.debug(response, '-------- mcp getResourceList --------')
      return response
    }
    catch (error) {
      Logger.error(`-------- mcp getResourceList message error ------`, error)
    }
  }

  async helloWorld() {
    // Request completions for any argument
    const userName = 'nevin'
    const uri = `mcp://hello-world/${userName}`
    const res = await this.mcpClient.readResource({
      uri,
      args: {
        userName,
      },
      contents: [],
    })

    Logger.log(res)
  }

  /**
   * 测试工具调用
   */
  async testMcpToolHello() {
    const res = await this.mcpClient.callTool({
      name: 'hello-world',
      arguments: {
        name: 'nevin',
      },
      contents: [],
    })

    Logger.log(res)
  }
}
