import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Render,
  UseGuards,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { v4 as uuidv4 } from 'uuid'
import { Public } from '@/auth/auth.guard'
import { OrgGuard } from '@/common/interceptor/transform.interceptor'
import { RedisService } from '@/libs/redis/redis.service'

@ApiTags('plat/test - 平台测试')
@Controller('plat/test')
export class PlatTestController {
  constructor(private readonly redisService: RedisService) {}

  // 添加授权测试页面，并返回测试页面链接
  @Public()
  @Post('authPage')
  setAuthPage(@Body('url') url: string) {
    const id = uuidv4()
    void this.redisService.setKey<string>(`test:authPage:${id}`, url, 60 * 5)
    return `https://apitest.aiearn.ai/api/plat/test/authPage/${id}`
  }

  // 获取授权测试页面
  @Public()
  @UseGuards(OrgGuard)
  @Get('authPage/:id')
  @Render('test/authPage.ejs')
  async getAuthPage(@Param('id') id: string) {
    const url = await this.redisService.get<string>(
      `test:authPage:${id}`,
      false,
    )

    return {
      id,
      url: url || '#',
    }
  }
}
