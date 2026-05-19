import { Body, Controller, Delete, ForbiddenException, Get, Param, Post } from '@nestjs/common'
import { GetToken, TokenInfo } from '@yikart/aitoearn-auth'
import { CustomerRadarWorkspaceDto, CustomerReplyGenerationDto, CustomerTenantAiConfigDto, CustomerTenantSettingsDto, GlobalKnowledgeDto, SystemAiConfigDto } from './customer-growth.dto'
import { CustomerGrowthService } from './customer-growth.service'

@Controller('knowledge-base')
export class GlobalKnowledgeController {
  constructor(private readonly customerGrowthService: CustomerGrowthService) { }

  @Get()
  list(@GetToken() token: TokenInfo) {
    return this.customerGrowthService.listKnowledge(token.id)
  }

  @Post()
  create(@GetToken() token: TokenInfo, @Body() body: GlobalKnowledgeDto) {
    return this.customerGrowthService.createKnowledge(token.id, body)
  }

  @Post(':id')
  update(
    @GetToken() token: TokenInfo,
    @Param('id') id: string,
    @Body() body: GlobalKnowledgeDto,
  ) {
    return this.customerGrowthService.updateKnowledge(token.id, id, body)
  }

  @Post(':id/toggle')
  toggle(
    @GetToken() token: TokenInfo,
    @Param('id') id: string,
    @Body() body: { enabled: boolean },
  ) {
    return this.customerGrowthService.updateKnowledge(token.id, id, { enabled: body.enabled })
  }

  @Delete(':id')
  delete(@GetToken() token: TokenInfo, @Param('id') id: string) {
    return this.customerGrowthService.deleteKnowledge(token.id, id)
  }
}

@Controller('customer-radar')
export class CustomerRadarController {
  constructor(private readonly customerGrowthService: CustomerGrowthService) { }

  @Get('workspace')
  getWorkspace(@GetToken() token: TokenInfo) {
    return this.customerGrowthService.getCustomerRadarWorkspace(token.id)
  }

  @Get('tenant-context')
  getTenantContext(@GetToken() token: TokenInfo) {
    return this.customerGrowthService.getCustomerTenantContext(token)
  }

  @Get('tenant-ai-config')
  getTenantAiConfig(@GetToken() token: TokenInfo) {
    return this.customerGrowthService.getCustomerTenantAiConfig(token.id)
  }

  @Post('tenant-ai-config')
  saveTenantAiConfig(
    @GetToken() token: TokenInfo,
    @Body() body: CustomerTenantAiConfigDto,
  ) {
    return this.customerGrowthService.saveCustomerTenantAiConfig(token.id, body)
  }

  @Post('workspace')
  saveWorkspace(
    @GetToken() token: TokenInfo,
    @Body() body: CustomerRadarWorkspaceDto,
  ) {
    return this.customerGrowthService.saveCustomerRadarWorkspace(token.id, body)
  }

  @Post('reply-candidates/generate')
  generateReplyCandidate(
    @GetToken() token: TokenInfo,
    @Body() body: CustomerReplyGenerationDto,
  ) {
    return this.customerGrowthService.generateReplyCandidate(token.id, body)
  }
}

@Controller('system')
export class SystemSettingsController {
  constructor(private readonly customerGrowthService: CustomerGrowthService) { }

  private assertSystemAdmin(token: TokenInfo) {
    const adminEmails = (process.env['SYSTEM_ADMIN_EMAILS'] || 'admin@aitoearn.local')
      .split(',')
      .map(item => item.trim().toLowerCase())
      .filter(Boolean)

    if (!token.mail || !adminEmails.includes(token.mail.toLowerCase()))
      throw new ForbiddenException('Only system administrators can manage AI configuration')
  }

  @Get('ai-config')
  getAiConfig(@GetToken() token: TokenInfo) {
    this.assertSystemAdmin(token)
    return this.customerGrowthService.getSystemAiConfig()
  }

  @Post('ai-config')
  saveAiConfig(@GetToken() token: TokenInfo, @Body() body: SystemAiConfigDto) {
    this.assertSystemAdmin(token)
    return this.customerGrowthService.saveSystemAiConfig(token.id, body)
  }

  @Get('customer-tenants')
  listCustomerTenants(@GetToken() token: TokenInfo) {
    this.assertSystemAdmin(token)
    return this.customerGrowthService.listCustomerTenants()
  }

  @Post('customer-tenants')
  saveCustomerTenants(@GetToken() token: TokenInfo, @Body() body: CustomerTenantSettingsDto) {
    this.assertSystemAdmin(token)
    return this.customerGrowthService.saveCustomerTenants(token.id, body)
  }
}
