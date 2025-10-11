/*
 * @Author: nevin
 * @Date: 2024-06-17 19:19:20
 * @LastEditTime: 2024-12-23 12:45:22
 * @LastEditors: nevin
 * @Description: 通用工具
 */
import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ParamsValidationPipe } from 'src/validation.pipe';
import { TmsService } from 'src/lib/tms/tms.service';
import { KwaiSignDto, TextModerationDto } from './dto/tools.dto';
import { KwaiSginService } from './kwaiSign/kwaiSgin.service';
import { Public } from '../../auth/auth.guard';

@ApiTags('通用工具')
@Controller('tools/common')
export class ToolsController {
  constructor(
    private readonly tmsService: TmsService,
    private readonly kwaiSginService: KwaiSginService,
  ) {}

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
    @Body(new ParamsValidationPipe()) body: TextModerationDto,
  ) {
    const res = await this.tmsService.textModeration(body.content);
    return res;
  }

  @ApiOperation({
    summary: '快手签名',
    description:
      '快手签名，注意，json中必须要有 ‘kuaishou.web.cp.api_ph’ 字段，此字段是从cookie获取的，type为 form-data 或 json',
  })
  @Public()
  @Post('kwaiSign')
  async kwaiSignCore(@Body(new ParamsValidationPipe()) body: KwaiSignDto) {
    return await this.kwaiSginService.sign(body);
  }
}
