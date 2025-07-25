/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:20
 * @LastEditTime: 2024-12-23 12:45:22
 * @LastEditors: nevin
 * @Description: 测试
 */
import { Controller, Get } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Public } from 'src/auth/auth.guard'
import { McpService } from 'src/libs/mcp/mcp.service'
import { TestService } from './test.service'

@ApiTags('测试')
@Controller('test')
export class TestController {
  constructor(
    private readonly testService: TestService,
    private readonly mcpService: McpService,
  ) {}

  @Public()
  @Get('mcp/hello')
  async testMcpHello() {
    const res = await this.mcpService.helloWorld()
    return res
  }

  @Public()
  @Get('mcp/res-list')
  async testMcpResList() {
    const res = await this.mcpService.getResourceList()
    return res
  }

  @Public()
  @Get('mcp/tool/hello')
  async testMcpToolHello() {
    const res = await this.mcpService.testMcpToolHello()
    return res
  }

  @Public()
  @Get('archiveAddByUtoken')
  archiveAddByUtoken() {
    this.testService.archiveAddByUtoken()
  }
}
