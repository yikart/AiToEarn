import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { ApiDoc } from '@yikart/common'
import { CreateMcpApiKeyDto, DeleteApiKeyAccountDto, McpListApiKeyAccountsQueryDto, McpListApiKeysQueryDto, UpdateMcpApiKeyDescDto } from './mcp.dto'
import { McpService } from './mcp.service'

@ApiTags('OpenSource/Home/SkKey')
@Controller('channel/skKey')
export class McpApiKeyController {
  constructor(private readonly mcpService: McpService) {}

  @ApiDoc({
    summary: 'Create SkKey',
    description: 'Create a new SkKey entry.',
    body: CreateMcpApiKeyDto.schema,
  })
  @Post()
  create(@GetToken() token: TokenInfo, @Body() data: CreateMcpApiKeyDto) {
    return this.mcpService.createApiKey(token.id, data)
  }

  @ApiDoc({
    summary: 'Remove SkKey Association',
    description: 'Delete an account association from a SkKey.',
  })
  @Delete('ref')
  delRefAccount(
    @GetToken() token: TokenInfo,
    @Body() data: DeleteApiKeyAccountDto,
  ) {
    return this.mcpService.deleteApiKeyAccount(token.id, data)
  }

  @ApiDoc({
    summary: 'Delete SkKey',
    description: 'Remove a SkKey entry.',
  })
  @Delete(':key')
  del(@GetToken() token: TokenInfo, @Param('key') key: string) {
    return this.mcpService.deleteByApiKey(token.id, key)
  }

  @ApiDoc({
    summary: 'Update SkKey',
    description: 'Update SkKey metadata.',
    body: UpdateMcpApiKeyDescDto.schema,
  })
  @Put()
  upInfo(@GetToken() token: TokenInfo, @Body() data: UpdateMcpApiKeyDescDto) {
    return this.mcpService.updateApiKeyDesc(token.id, data.key, data.desc)
  }

  @ApiDoc({
    summary: 'List SkKeys',
    description: 'List SkKeys belonging to the current user.',
  })
  @Get('list/:pageNo/:pageSize')
  async list(@GetToken() token: TokenInfo, @Param() data: McpListApiKeysQueryDto) {
    const [list, total] = await this.mcpService.getList(token.id, data)
    return { list, total }
  }

  @ApiDoc({
    summary: 'List SkKey Associations',
    description: 'Retrieve associated accounts for a SkKey.',
    query: McpListApiKeyAccountsQueryDto.schema,
  })
  @Get('ref/list/:pageNo/:pageSize')
  async getRefAccountList(
    @GetToken() token: TokenInfo,
    @Param() data: McpListApiKeyAccountsQueryDto,
    @Query() query: { key: string },
  ) {
    const [list, total] = await this.mcpService.getApiKeyAccountsList(token.id, query.key, data)
    return { list, total }
  }
}
