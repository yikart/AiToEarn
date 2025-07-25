import { TmsService } from '@libs/tms/tms.service'
/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:20
 * @LastEditTime: 2024-12-23 12:45:22
 * @LastEditors: nevin
 * @Description: 通用工具
 */
import { Body, Controller, Post } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { TextModerationDto } from './dto/tools.dto'

@ApiTags('通用工具')
@Controller('tools/common')
export class ToolsController {
  constructor(private readonly tmsService: TmsService) {}

  @ApiOperation({
    summary: '内容安全检测',
    description: '内容安全检测',
  })
  @ApiResponse({
    description: '是否通过检测',
    type: Boolean,
  })
  @Post('text/moderation')
  async textModeration(
    @Body() body: TextModerationDto,
  ) {
    const res = await this.tmsService.textModeration(body.content)
    return res
  }
}
